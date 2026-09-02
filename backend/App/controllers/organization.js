import mongoose from "mongoose";
import { setUser } from "../../services/Auth.js";
import { sendOtp, verifyOtp } from "../../services/otp.js";
import OrganizationModel from "../models/organization.js";
import { uploadFileToCloud, deleteImageByUrl } from "../../services/upload.js";
import { isUserOnline } from "../../services/chat.js";
import { hashPassword, verifyPassword } from "../../services/encryption.js";
import ApprovalSubmissionModel from "../models/approvalSubmission.js";
import PlanModel from "../models/plan.js";
import { sendMail } from "../../services/mail.js";
import { getEffectiveLoginMethod } from "./authSettingController.js";
import { getOrCreateUserWallet } from "./walletController.js";
import ReferralModel from "../models/referral.js";
import WalletModel from "../models/wallet.js";
import WalletTransactionModel from "../models/walletTransaction.js";
import { generateUniqueReferralCode } from "./referralController.js";

function normalizeCompanyType(type = "") {
    const value = String(type).toLowerCase().trim();

    const map = {
        startup: "startup",
        startups: "startup",
        investor: "investor",
        investors: "investor",
        mentor: "mentor",
        mentors: "mentor",
        "incubator/accelerator": "incubator",
        incubator: "incubator",
        incubators: "incubator",
        accelerator: "accelerator",
        accelerators: "accelerator",
        "incubators/accelerators": "incubator",
    };

    return map[value] || value;
}

async function signUp(req, res) {
    try {
        const {
            company_type,
            investing_as,
            company_name,
            name,
            email,
            phone,
            password,
            agree,
            otp,
            referralCode,
        } = req.body;

        if (
            !company_type ||
            !company_name ||
            !name ||
            !email ||
            !phone ||
            !otp
        ) {
            return res.send({
                status: 7,
                msg: "All required fields are mandatory"
            });
        }

        if (
            company_type === "investor" &&
            !investing_as
        ) {
            return res.send({
                status: 7,
                msg: "Investor type is required"
            });
        }

        const alreadyExists = await OrganizationModel.findOne({
            email
        });

        if (alreadyExists) {
            return res.send({
                status: 3,
                msg: "Email already registered"
            });
        }

        const otpMatched = await verifyOtp(email, otp);

        if (!otpMatched) {
            return res.send({
                status: 2,
                msg: "Invalid OTP"
            });
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await hashPassword(password);
        }

        // Generate unique referral code for this new user (Starts with RBF...)
        const myReferralCode = await generateUniqueReferralCode();

        // Validate applied referral code if provided
        let referrer = null;
        if (referralCode && String(referralCode).trim()) {
            const cleanRefCode = String(referralCode).trim().toUpperCase();
            const foundReferrer = await OrganizationModel.findOne({
                referralCode: cleanRefCode,
                accountStatus: { $ne: "disabled" },
            });

            // Prevent self-referrals and disabled referrers
            if (foundReferrer && foundReferrer.email !== email.toLowerCase().trim() && foundReferrer.phone !== phone) {
                referrer = foundReferrer;
            }
        }

        // Strictly enforce default permitted role and Pending Approval state for public registrations
        const organization = new OrganizationModel({
            company_type,
            investing_as:
                company_type === "investor"
                    ? investing_as
                    : undefined,
            company_name,
            name,
            email,
            phone,
            password: hashedPassword,
            agree,
            role: "normal",
            customRole: null,
            team: null,
            accountStatus: "active",
            approvalStatus: "Pending Form",
            account: {},
            sessions: [],
            referralCode: myReferralCode,
            referredBy: referrer ? referrer._id : null,
            referralCreditsEarned: 0,
            referralCount: 0,
        });

        const token = await setUser(organization._id);

        organization.sessions.push({
            token
        });

        res.cookie("UID", token, {
            httpOnly: process.env.PRODUCTION === "true",
            secure: process.env.PRODUCTION === "true",
            sameSite:
                process.env.PRODUCTION === "true"
                    ? "none"
                    : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await organization.save();

        // Create initial Approval Submission record
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const appId = `APP-${year}-${randomSuffix}`;

        const initialSubmission = await ApprovalSubmissionModel.create({
            applicationId: appId,
            user: organization._id,
            organizationType: company_type,
            roleKey: investing_as || "default",
            status: "Pending Form",
            auditLog: [
                {
                    action: "USER_REGISTERED",
                    previousStatus: "",
                    newStatus: "Pending Form",
                    performedBy: organization._id,
                    performedByName: organization.name,
                    comment: "User registered. Approval form completion required for ecosystem dashboard access.",
                    timestamp: new Date(),
                },
            ],
        });

        organization.approvalSubmission = initialSubmission._id;
        await organization.save();

        // 1. Automatically provision new user wallet with 500 Welcome Credits
        try {
            await getOrCreateUserWallet(organization._id);
        } catch (walletErr) {
            console.error("Auto wallet provisioning on signup error:", walletErr);
        }

        // 2. If referred by another user, award bilateral 250-credit rewards atomically
        if (referrer) {
            try {
                // Check if referral was already processed (Idempotency)
                const existingRef = await ReferralModel.findOne({ referredUser: organization._id });
                if (!existingRef) {
                    await ReferralModel.create({
                        referrer: referrer._id,
                        referredUser: organization._id,
                        referralCode: referrer.referralCode,
                        referrerReward: 250,
                        referredReward: 250,
                        status: "completed",
                        rewardedAt: new Date(),
                    });

                    // Award +250 credits to Referrer's Wallet atomically
                    const updatedRefWallet = await WalletModel.findOneAndUpdate(
                        { user: referrer._id },
                        { $inc: { balance: 250, total_credited: 250 } },
                        { new: true, upsert: true }
                    );

                    await WalletTransactionModel.create({
                        user: referrer._id,
                        wallet: updatedRefWallet._id,
                        type: "credit",
                        amount: 250,
                        balance_after: updatedRefWallet.balance,
                        category: "referral_reward",
                        description: `Referral reward: 250 credits earned for inviting ${organization.name} (${organization.company_name})`,
                        reference_id: `REF_REWARD_${organization._id.toString().slice(-6)}`,
                        status: "success",
                    });

                    await OrganizationModel.findByIdAndUpdate(referrer._id, {
                        $inc: { referralCount: 1, referralCreditsEarned: 250 },
                    });

                    // Award +250 bonus credits to New User's Wallet atomically (500 Base + 250 Referral = 750)
                    const updatedUserWallet = await WalletModel.findOneAndUpdate(
                        { user: organization._id },
                        { $inc: { balance: 250, total_credited: 250 } },
                        { new: true, upsert: true }
                    );

                    await WalletTransactionModel.create({
                        user: organization._id,
                        wallet: updatedUserWallet._id,
                        type: "credit",
                        amount: 250,
                        balance_after: updatedUserWallet.balance,
                        category: "referral_reward",
                        description: `Referral bonus: 250 credits earned for registering with code ${referrer.referralCode}`,
                        reference_id: `REF_BONUS_${referrer._id.toString().slice(-6)}`,
                        status: "success",
                    });
                }
            } catch (refErr) {
                console.error("Referral rewards processing error:", refErr);
            }
        }

        // Send registration & approval form link email
        try {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            await sendMail(
                email,
                "Welcome to RealBell Foundation — Complete Your Verification Form",
                `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
                  <h2 style="color: #f59e0b; margin-top: 0;">Welcome to RealBell Business Foundation</h2>
                  <p>Hello <strong>${name}</strong>,</p>
                  <p>Your account for <strong>${company_name}</strong> (${company_type.toUpperCase()}) has been successfully created with Application ID: <strong>${appId}</strong>.</p>
                  <div style="background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">Account Status:</p>
                    <p style="margin: 4px 0 0; font-size: 16px; font-weight: bold; color: #fbbf24;">Pending Approval Form Completion</p>
                  </div>
                  <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                    To protect our ecosystem community, all new organizations must submit required verification credentials before full dashboard functionality is enabled.
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${frontendUrl}/approval-center" style="display: inline-block; background: #f59e0b; color: #0f172a; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                      Complete Verification Form →
                    </a>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #64748b; margin: 0;">
                    © ${new Date().getFullYear()} RealBell Business Foundation.
                  </p>
                </div>
                `
            );
        } catch (mailErr) {
            console.error("Signup email error:", mailErr);
        }

        return res.send({
            status: 1,
            msg: "Organization registered successfully. Please complete your verification form for dashboard access.",
            approvalStatus: "Pending Form",
            applicationId: appId,
        });

    } catch (err) {

        console.log(err);

        return res.send({
            status: 0,
            msg: "Internal Server Error"
        });

    }
}

async function login(req, res) {
    try {
        let { email, otp, password } = req.body;
        if (!email) return res.send({ status: 7, msg: "Email is required" });
        email = email.trim().toLowerCase();

        const configuredLoginMethod = await getEffectiveLoginMethod();

        let findUser = await OrganizationModel.findOne({ email })
            .populate("customRole", "name slug permissions status")
            .populate("team", "name slug description department permissions status");

        if (!findUser) {
            return res.send({ status: 9, msg: "No registered account found with this email" });
        }

        if (findUser.accountStatus === "disabled") {
            return res.send({
                status: 13,
                msg: "Your account has been deactivated. Please contact the administrator.",
            });
        }

        // Handle method routing strictly as per backend setting
        if (configuredLoginMethod === "otp") {
            if (!otp) return res.send({ status: 7, msg: "Verification OTP is required" });
            const otpMatched = await verifyOtp(email, otp);
            if (!otpMatched) {
                return res.send({ status: 2, msg: "Invalid or expired OTP code" });
            }
        } else if (configuredLoginMethod === "password") {
            if (!password || !String(password).trim()) return res.send({ status: 7, msg: "Password is required" });
            if (!findUser.password) {
                return res.send({
                    status: 12,
                    msg: "Password not yet set for this account. Please contact admin."
                });
            }
            const passwordMatched = await verifyPassword(String(password).trim(), findUser.password);
            if (!passwordMatched) {
                return res.send({ status: 2, msg: "Incorrect password" });
            }
        } else {
            // configuredLoginMethod === "both" (2-Factor: Password verified before sending OTP, OTP verified here)
            if (!otp) return res.send({ status: 7, msg: "Verification OTP is required" });
            const otpMatched = await verifyOtp(email, otp);
            if (!otpMatched) {
                return res.send({ status: 2, msg: "Invalid or expired OTP code" });
            }
        }

        let token = await setUser(findUser._id);
        if (!token) return res.send({ status: 11, msg: "Error generating session token" });

        findUser.sessions = [{ token }];
        res.cookie("UID", token, {
            httpOnly: process.env.PRODUCTION === "true" || process.env.production === "true",
            secure: process.env.PRODUCTION === "true" || process.env.production === "true",
            sameSite:
                process.env.PRODUCTION === "true" || process.env.production === "true"
                    ? "none"
                    : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        if ((findUser.role === "super_admin" || findUser.role === "admin") && findUser.approvalStatus !== "Approved") {
            findUser.approvalStatus = "Approved";
        }

        await findUser.save();

        const permissions =
            findUser.role === "super_admin"
                ? ["*"]
                : findUser.team?.permissions || findUser.customRole?.permissions || [];

        return res.send({
            status: 1,
            msg: "Login successful",
            user: {
                _id: findUser._id,
                name: findUser.name,
                email: findUser.email,
                role: findUser.role,
                company_type: findUser.company_type,
                team: findUser.team,
                customRole: findUser.customRole,
                accountStatus: findUser.accountStatus,
                approvalStatus: findUser.approvalStatus || (findUser.role === "super_admin" || findUser.role === "admin" ? "Approved" : "Pending Form"),
                approvalSubmission: findUser.approvalSubmission,
                mustChangePassword: findUser.mustChangePassword,
                permissions,
            },
        });
    } catch (err) {
        console.error("Login controller error:", err);
        return res.send({ status: 0, msg: "Internal server error" });
    }
}

async function sendSignupOTP(req, res) {
    let { email } = req.body;
    if (!email) return res.send({ status: 7, msg: "Email is required" });
    email = email.trim().toLowerCase();

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
        return res.send({ status: 7, msg: "Invalid email address format" });
    }

    try {
        const alreadyExists = await OrganizationModel.findOne({ email });
        if (alreadyExists) {
            return res.send({
                status: 3,
                msg: "Email is already registered. Please log in instead.",
            });
        }

        let r = await sendOtp(email);
        if (!r) {
            return res.send({
                status: 8,
                msg: "Error generating and sending OTP. Please try again.",
            });
        }
        return res.send({ status: 1, msg: "Verification OTP sent to your email successfully" });
    } catch (err) {
        console.error("Signup send OTP error:", err);
        return res.send({ status: 0, msg: "Internal server error" });
    }
}

async function sendOTPToEmail(req, res) {
    let { email, password } = req.body;
    if (!email) return res.send({ status: 7, msg: "Email is required" });
    email = email.trim().toLowerCase();

    try {
        const configuredLoginMethod = await getEffectiveLoginMethod();
        if (configuredLoginMethod === "password") {
            return res.send({
                status: 10,
                msg: "OTP authentication is disabled by administrator. Please log in using password.",
            });
        }

        let findUser = await OrganizationModel.findOne({ email });
        if (!findUser) {
            return res.send({ status: 9, msg: "No registered account found with this email" });
        }

        // If backend setting is 'both', verify password before sending OTP
        if (configuredLoginMethod === "both") {
            if (!password || !String(password).trim()) {
                return res.send({ status: 7, msg: "Password is required" });
            }
            if (!findUser.password) {
                return res.send({
                    status: 12,
                    msg: "Password not set for this account. Please contact administrator.",
                });
            }
            const passwordMatched = await verifyPassword(String(password).trim(), findUser.password);
            if (!passwordMatched) {
                return res.send({ status: 2, msg: "Incorrect password" });
            }
        }

        let r = await sendOtp(email);
        if (!r) return res.send({ status: 8, msg: "Error generating and sending OTP" });
        return res.send({ status: 1, msg: "OTP sent successfully" });
    } catch (err) {
        console.error("Send OTP error:", err);
        return res.send({ status: 0, msg: "Internal server error" });
    }
}

async function forgotPasswordSendOTP(req, res) {
    try {
        let { email } = req.body;
        if (!email) return res.send({ status: 7, msg: "Email is required" });
        email = email.trim().toLowerCase();

        let findUser = await OrganizationModel.findOne({ email });
        if (!findUser) {
            return res.send({ status: 9, msg: "No registered account found with this email" });
        }

        let r = await sendOtp(email);
        if (!r) return res.send({ status: 8, msg: "Error generating and sending OTP" });
        return res.send({ status: 1, msg: "Password reset verification code sent to your email" });
    } catch (err) {
        console.error("Forgot password send OTP error:", err);
        return res.send({ status: 0, msg: "Internal server error" });
    }
}

async function resetPasswordWithOTP(req, res) {
    try {
        let { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.send({ status: 7, msg: "Email, OTP, and New Password are required" });
        }
        email = email.trim().toLowerCase();

        if (newPassword.length < 6) {
            return res.send({ status: 7, msg: "Password must be at least 6 characters long" });
        }

        let findUser = await OrganizationModel.findOne({ email });
        if (!findUser) {
            return res.send({ status: 9, msg: "No registered account found with this email" });
        }

        const otpMatched = await verifyOtp(email, otp);
        if (!otpMatched) {
            return res.send({ status: 2, msg: "Invalid or expired OTP code" });
        }

        const hashedPassword = await hashPassword(newPassword);
        findUser.password = hashedPassword;
        await findUser.save();

        return res.send({
            status: 1,
            msg: "Password has been reset successfully! You can now log in with your new password.",
        });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.send({ status: 0, msg: "Internal server error" });
    }
}

async function fetchUser(req, res) {
    try {
        if (!req.user) {
            return res.send({ status: 0, msg: "No active user session" });
        }

        if (req.user.accountStatus === "disabled") {
            res.clearCookie("UID");
            return res.status(403).send({ status: 0, msg: "Account has been deactivated" });
        }

        const permissions =
            req.user.role === "super_admin"
                ? ["*"]
                : req.user.team?.permissions || req.user.customRole?.permissions || [];

        const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
        delete userObj.password;
        delete userObj.sessions;
        userObj.permissions = permissions;
        if (userObj.role === "super_admin" || userObj.role === "admin") {
            userObj.approvalStatus = "Approved";
        }

        // Attach populated subscription plan modules & tier rank & handle expiration
        const hasExpired = Boolean(
            userObj.subscription?.endDate &&
            new Date(userObj.subscription.endDate) < new Date()
        );

        if (hasExpired && userObj.subscription?.status === "active") {
            userObj.subscription.status = "expired";
            userObj.subscription.is_expired = true;
            OrganizationModel.updateOne(
                { _id: userObj._id },
                { $set: { "subscription.status": "expired" } }
            ).catch((err) => console.error("Error setting expired subscription:", err));
        }

        const isEffectiveActive = userObj.subscription?.status === "active" && !hasExpired;
        const subPlanKey = isEffectiveActive ? (userObj.subscription?.planKey || "free") : "free";
        const activePlanDoc = await PlanModel.findOne({ key: subPlanKey, is_deleted: { $ne: true } }).lean();
        if (activePlanDoc) {
            userObj.subscription = {
                ...(userObj.subscription || {}),
                included_modules: isEffectiveActive ? (activePlanDoc.included_modules || []) : [],
                tier_rank: isEffectiveActive ? (activePlanDoc.tier_rank || 1) : 1,
                is_legacy: activePlanDoc.status === "disabled",
                is_expired: hasExpired,
            };
        }

        return res.send({ status: 1, user: userObj });
    } catch (err) {
        console.log(err);
        return res.send({ status: 0, msg: "Error fetching user" });
    }
}

async function updateAccount(req, res) {
    try {
        let {
            name,
            account = {}
        } = req.body;

        account = JSON.parse(account);

        // Update Organization fields
        if (name !== undefined) {
            req.user.name = name;
        }

        // Ensure account exists
        if (!req.user.account) {
            req.user.account = {};
        }

        // Update Account fields
        if (account.designation !== undefined) {
            req.user.account.designation = account.designation;
        }

        if (req.file) {
            if (account.image !== undefined && account.image !== null && account.image !== "") {
                // Delete the old image from Cloudinary
                await deleteImageByUrl(account.image);
            }
            await uploadFileToCloud(req.file.buffer, req.file.originalname)
                .then((result) => {
                    req.user.account.image = result.secure_url;
                })
                .catch((err) => {
                    console.error("Error uploading image:", err);
                    return res.send({
                        status: 0,
                        msg: "Error uploading image",
                    });
                });
        }

        if (account.availability) {
            req.user.account.availability = {
                ...(req.user.account.availability || {}),
                ...account.availability,
            };
        }

        await req.user.save();

        return res.send({
            status: 1,
            msg: "Account updated successfully",
            user: req.user,
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Internal server error",
        });
    }
}

async function updateProfile(req, res) {
    console.log(req.body);
    try {
        // Parse profile JSON sent as FormData string
        let profileData = {};
        if (req.body.profile) {
            try {
                profileData = JSON.parse(req.body.profile);
            } catch {
                profileData = req.body;
            }
        } else {
            profileData = req.body;
        }

        // Upload any attached image files (logo / photo) to Cloudinary
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const result = await uploadFileToCloud(file.buffer, file.originalname);
                    const secureUrl = result.secure_url;

                    // Assign to the correct profile field based on multer field name
                    if (file.fieldname === "logo" || file.fieldname === "photo") {
                        profileData.logo = secureUrl;
                        profileData.photo = secureUrl;
                    } else {
                        profileData[file.fieldname] = secureUrl;
                    }

                    // Also sync to account.image so the avatar updates app-wide
                    if (!req.user.account) req.user.account = {};
                    req.user.account.image = secureUrl;
                    req.user.markModified("account");
                } catch (uploadErr) {
                    console.error("Error uploading profile image:", uploadErr);
                    return res.send({ status: 0, msg: "Error uploading image to cloud" });
                }
            }
        }

        // Merge into existing profile and persist
        if (!req.user.profile) req.user.profile = {};
        Object.assign(req.user.profile, profileData);
        // Store a serialized copy so front-end can JSON.parse it
        req.user.profile.profile = JSON.stringify(profileData);
        req.user.markModified("profile");

        await req.user.save();

        return res.send({
            status: 1,
            msg: "Profile updated successfully",
        });
    } catch (err) {
        console.error(err);
        return res.send({
            status: 0,
            msg: "Internal server error",
        });
    }
}

async function logout(req, res) {
    try {
        let token = req.cookies?.UID;
        if (!token) return res.send({ status: 1, msg: "Logged out successfully" });
        res.clearCookie('UID', {
            httpOnly: process.env.PRODUCTION === "true",
            secure: process.env.PRODUCTION === "true",
            sameSite: process.env.PRODUCTION === "true" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        req.user.sessions = req.user.sessions.filter((session) => session.token !== token);
        await req.user.save();
        req.user = null
        return res.send({ status: 1, msg: "Logged out successfully" })
    } catch (err) {
        console.log(err)
        return res.send({ status: 0, msg: "server error" })
    }
}

async function fetchOrganizationsByType(req, res) {
    try {
        const company_type = normalizeCompanyType(req.params.type);

        if (!company_type) {
            return res.send({
                status: 7,
                msg: "Invalid organization type",
            });
        }

        const profiles = await OrganizationModel.find({ company_type })
            .sort({ createdAt: -1 });

        return res.send({
            status: 1,
            msg: "Profiles fetched successfully",
            profiles,
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Internal Server Error",
        });
    }
}

async function fetchOrganizationById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.send({
                status: 7,
                msg: "Invalid profile id",
            });
        }

        const profile = await OrganizationModel.findById(id);

        if (!profile) {
            return res.send({
                status: 9,
                msg: "Profile not found",
            });
        }

        return res.send({
            status: 1,
            msg: "Profile fetched successfully",
            profile,
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Internal Server Error",
        });
    }
}

async function toggleSaveProfile(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.send({
                status: 7,
                msg: "Invalid profile id",
            });
        }

        if (String(req.user._id) === String(id)) {
            return res.send({
                status: 7,
                msg: "You cannot save your own profile",
            });
        }

        const target = await OrganizationModel.findById(id);

        if (!target) {
            return res.send({
                status: 9,
                msg: "Profile not found",
            });
        }

        req.user.saved_profiles = req.user.saved_profiles || [];

        const savedIndex = req.user.saved_profiles.findIndex(
            (item) => String(item.profile) === String(id)
        );

        if (savedIndex >= 0) {
            req.user.saved_profiles.splice(savedIndex, 1);
            await req.user.save();

            return res.send({
                status: 1,
                msg: "Profile unsaved successfully",
                saved: false,
            });
        }

        req.user.saved_profiles.push({
            profile: target._id,
        });

        await req.user.save();

        return res.send({
            status: 1,
            msg: "Profile saved successfully",
            saved: true,
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Internal Server Error",
        });
    }
}

async function toggleConnectionRequest(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.send({
                status: 7,
                msg: "Invalid profile id",
            });
        }

        if (String(req.user._id) === String(id)) {
            return res.send({
                status: 7,
                msg: "You cannot connect with your own profile",
            });
        }

        const target = await OrganizationModel.findById(id);

        if (!target) {
            return res.send({
                status: 9,
                msg: "Profile not found",
            });
        }

        req.user.connections = req.user.connections || [];
        target.connections = target.connections || [];

        const userConnectionIndex = req.user.connections.findIndex(
            (item) => String(item.with) === String(id)
        );
        const targetConnectionIndex = target.connections.findIndex(
            (item) => String(item.with) === String(req.user._id)
        );

        const userConnection =
            userConnectionIndex >= 0
                ? req.user.connections[userConnectionIndex]
                : null;
        const targetConnection =
            targetConnectionIndex >= 0
                ? target.connections[targetConnectionIndex]
                : null;

        if (userConnection?.status === "accepted") {
            return res.send({
                status: 1,
                msg: "You are already connected",
                connection_status: "accepted",
            });
        }

        if (userConnection?.status === "pending" && userConnection.direction === "sent") {
            return res.send({
                status: 1,
                msg: "Connection request already sent",
                connection_status: "pending",
            });
        }

        if (userConnection?.status === "pending" && userConnection.direction === "received") {
            req.user.connections[userConnectionIndex].status = "accepted";
            req.user.connections[userConnectionIndex].respondedAt = new Date();

            if (targetConnectionIndex >= 0) {
                target.connections[targetConnectionIndex].status = "accepted";
                target.connections[targetConnectionIndex].respondedAt = new Date();
            } else {
                target.connections.push({
                    with: req.user._id,
                    direction: "sent",
                    status: "accepted",
                    requestedAt: new Date(),
                    respondedAt: new Date(),
                });
            }

            await req.user.save();
            await target.save();

            return res.send({
                status: 1,
                msg: "Connection accepted successfully",
                connection_status: "accepted",
            });
        }

        const now = new Date();

        if (userConnectionIndex >= 0) {
            req.user.connections[userConnectionIndex].with = target._id;
            req.user.connections[userConnectionIndex].direction = "sent";
            req.user.connections[userConnectionIndex].status = "pending";
            req.user.connections[userConnectionIndex].requestedAt = now;
            req.user.connections[userConnectionIndex].respondedAt = null;
        } else {
            req.user.connections.push({
                with: target._id,
                direction: "sent",
                status: "pending",
                requestedAt: now,
                respondedAt: null,
            });
        }

        if (targetConnectionIndex >= 0) {
            target.connections[targetConnectionIndex].with = req.user._id;
            target.connections[targetConnectionIndex].direction = "received";
            target.connections[targetConnectionIndex].status = "pending";
            target.connections[targetConnectionIndex].requestedAt = now;
            target.connections[targetConnectionIndex].respondedAt = null;
        } else {
            target.connections.push({
                with: req.user._id,
                direction: "received",
                status: "pending",
                requestedAt: now,
                respondedAt: null,
            });
        }

        await req.user.save();
        await target.save();

        return res.send({
            status: 1,
            msg: "Connection request sent successfully",
            connection_status: "pending",
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Internal Server Error",
        });
    }
}

async function isProfileOnline(profile) {
    return await isUserOnline(profile?._id);
}

function serializeConnectionProfile(profile) {
    if (!profile) return null;

    return {
        _id: profile._id,
        name: profile.name || "",
        company_name: profile.company_name || "",
        company_type: profile.company_type || "",
        email: profile.email || "",
        phone: profile.phone || "",
        account: {
            image: profile.account?.image || "",
            designation: profile.account?.designation || "",
            availability: profile.account?.availability || {},
        },
    };
}

function normalizeConnectionEntries(connections = []) {
    const map = new Map();

    connections.forEach((entry) => {
        const key = String(entry.with?._id || entry.with);
        const existing = map.get(key);
        const currentTime = new Date(entry.respondedAt || entry.requestedAt || 0).getTime();
        const existingTime = existing
            ? new Date(existing.respondedAt || existing.requestedAt || 0).getTime()
            : -1;

        if (!existing || currentTime >= existingTime) {
            map.set(key, entry);
        }
    });

    return [...map.values()];
}

async function fetchMyConnections(req, res) {
    try {
        const user = await OrganizationModel.findById(req.user._id).populate(
            "connections.with",
            "name company_name company_type email phone account"
        );

        if (!user) {
            return res.send({
                status: 9,
                msg: "Profile not found",
            });
        }

        const entries = normalizeConnectionEntries(user.connections || []);

        const normalized = (
            await Promise.all(
                entries.map(async (entry) => {
                    const profile = serializeConnectionProfile(entry.with);

                    if (!profile) return null;

                    return {
                        profile,
                        status: entry.status,
                        direction: entry.direction,
                        requestedAt: entry.requestedAt,
                        respondedAt: entry.respondedAt,
                        is_online: await isProfileOnline(entry.with),
                    };
                })
            )
        )
            .filter(Boolean)
            .sort((a, b) => {
                const left = new Date(
                    b.respondedAt || b.requestedAt || 0
                ).getTime();

                const right = new Date(
                    a.respondedAt || a.requestedAt || 0
                ).getTime();

                return left - right;
            });

        const active = normalized.filter((item) => item.status === "accepted");
        const pending = normalized.filter((item) => item.status === "pending");
        const rejected = normalized.filter((item) => item.status === "rejected");
        const pendingRequests = pending.filter((item) => item.direction === "received");
        const online = active.filter((item) => item.is_online);

        return res.send({
            status: 1,
            msg: "Connections fetched successfully",
            summary: {
                active: active.length,
                pending: pending.length,
                rejected: rejected.length,
                pending_requests: pendingRequests.length,
                online: online.length,
            },
            connections: {
                active,
                pending,
                rejected,
                pending_requests: pendingRequests,
                online,
            },
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Unable to fetch connections",
        });
    }
}

async function respondConnectionRequest(req, res) {
    try {
        const { id } = req.params;
        const action = String(req.body?.action || "").toLowerCase();

        if (!mongoose.isValidObjectId(id)) {
            return res.send({
                status: 7,
                msg: "Invalid profile id",
            });
        }

        if (!["accept", "reject"].includes(action)) {
            return res.send({
                status: 7,
                msg: "Invalid response action",
            });
        }

        const target = await OrganizationModel.findById(id);

        if (!target) {
            return res.send({
                status: 9,
                msg: "Profile not found",
            });
        }

        req.user.connections = req.user.connections || [];
        target.connections = target.connections || [];

        const userConnectionIndex = req.user.connections.findIndex(
            (item) => String(item.with) === String(id)
        );
        const targetConnectionIndex = target.connections.findIndex(
            (item) => String(item.with) === String(req.user._id)
        );

        const userConnection =
            userConnectionIndex >= 0
                ? req.user.connections[userConnectionIndex]
                : null;

        if (!userConnection || userConnection.status !== "pending" || userConnection.direction !== "received") {
            return res.send({
                status: 7,
                msg: "No pending request found",
            });
        }

        const newStatus = action === "accept" ? "accepted" : "rejected";
        const now = new Date();

        req.user.connections[userConnectionIndex].status = newStatus;
        req.user.connections[userConnectionIndex].respondedAt = now;

        if (targetConnectionIndex >= 0) {
            target.connections[targetConnectionIndex].status = newStatus;
            target.connections[targetConnectionIndex].respondedAt = now;
            target.connections[targetConnectionIndex].direction = "sent";
        } else {
            target.connections.push({
                with: req.user._id,
                direction: "sent",
                status: newStatus,
                requestedAt: now,
                respondedAt: now,
            });
        }

        await req.user.save();
        await target.save();

        return res.send({
            status: 1,
            msg:
                action === "accept"
                    ? "Connection accepted successfully"
                    : "Connection rejected successfully",
            connection_status: newStatus,
        });
    } catch (err) {
        console.log(err);
        return res.send({
            status: 0,
            msg: "Unable to update connection",
        });
    }
}

/**
 * Switch active organization type profile (e.g. startup, investor, mentor, incubator, accelerator)
 */
async function switchOrganizationType(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ status: 0, msg: "Unauthorized: Please log in" });
        }

        const isAllowed = req.user.role === "super_admin" || req.user.role === "admin" || Boolean(req.user.team);
        if (!isAllowed) {
            return res.status(403).json({
                status: 0,
                msg: "Access Forbidden: Only admin and super admin can switch organization types",
            });
        }

        const { company_type } = req.body;
        if (!company_type || typeof company_type !== "string") {
            return res.status(400).json({ status: 7, msg: "Please specify a valid organization type" });
        }

        const normalizedType = company_type.trim().toLowerCase();
        req.user.company_type = normalizedType;
        await req.user.save();

        const permissions =
            req.user.role === "super_admin"
                ? ["*"]
                : req.user.team?.permissions || req.user.customRole?.permissions || [];

        const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
        delete userObj.password;
        delete userObj.sessions;
        userObj.permissions = permissions;

        return res.json({
            status: 1,
            msg: `Switched profile to ${normalizedType}`,
            user: userObj,
        });
    } catch (err) {
        console.error("switchOrganizationType error:", err);
        return res.status(500).json({ status: 0, msg: "Failed to switch organization type" });
    }
}

export {
    signUp,
    login,
    sendSignupOTP,
    sendOTPToEmail,
    forgotPasswordSendOTP,
    resetPasswordWithOTP,
    fetchUser,
    logout,
    updateAccount,
    updateProfile,
    switchOrganizationType,
    fetchOrganizationsByType,
    fetchOrganizationById,
    fetchMyConnections,
    respondConnectionRequest,
    toggleSaveProfile,
    toggleConnectionRequest,
}

import mongoose from "mongoose";
import OrganizationModel from "../models/organization.js";
import CustomRoleModel from "../models/customRole.js";
import TeamModel from "../models/team.js";
import JobModel from "../models/job.js";
import TicketModel from "../models/ticket.js";
import CommunityPostModel from "../models/community.js";
import MeetingModel from "../models/meeting.js";
import MilestoneModel from "../models/milestone.js";
import { hashPassword } from "../../services/encryption.js";
import { sendMail } from "../../services/mail.js";
import { logAudit } from "../../services/auditLogger.js";
import { sendOtp, verifyOtp } from "../../services/otp.js";
import { userHasPermission } from "../../middlewares/rbac.js";

/* ======================= Dashboard Stats ======================= */

async function getDashboardStats(req, res) {
    try {
        const [
            totalUsers,
            roleAgg,
            admins,
            totalJobs,
            activeJobs,
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            totalPosts,
            totalMeetings,
            totalMilestones,
            recentUsers,
        ] = await Promise.all([
            OrganizationModel.countDocuments(),
            OrganizationModel.aggregate([
                { $group: { _id: "$company_type", count: { $sum: 1 } } }
            ]),
            OrganizationModel.countDocuments({ role: { $in: ["admin", "super_admin"] } }),
            JobModel.countDocuments(),
            JobModel.countDocuments({ status: "active" }),
            TicketModel.countDocuments(),
            TicketModel.countDocuments({ status: "Open" }),
            TicketModel.countDocuments({ status: "In Progress" }),
            TicketModel.countDocuments({ status: "Resolved" }),
            CommunityPostModel.countDocuments(),
            MeetingModel.countDocuments(),
            MilestoneModel.countDocuments(),
            OrganizationModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("name company_name company_type email account role customRole team accountStatus createdAt")
                .populate("customRole", "name permissions status")
                .populate("team", "name slug description department permissions status"),
        ]);

        const byRole = {};
        let startups = 0, investors = 0, mentors = 0, incubators = 0, accelerators = 0;
        roleAgg.forEach((b) => {
            if (b._id) {
                byRole[b._id] = b.count;
                if (b._id === "startup") startups = b.count;
                if (b._id === "investor") investors = b.count;
                if (b._id === "mentor") mentors = b.count;
                if (b._id === "incubator" || b._id === "incubator/accelerator") incubators = b.count;
                if (b._id === "accelerator") accelerators = b.count;
            }
        });

        // Signups over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const signupTrend = await OrganizationModel.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Recent tickets
        const recentTickets = await TicketModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("organization", "name company_name account");

        return res.json({
            status: 1,
            stats: {
                users: { total: totalUsers, startups, investors, mentors, incubators, accelerators, admins, byRole },
                jobs: { total: totalJobs, active: activeJobs },
                tickets: { total: totalTickets, open: openTickets, in_progress: inProgressTickets, resolved: resolvedTickets },
                posts: { total: totalPosts },
                meetings: { total: totalMeetings },
                milestones: { total: totalMilestones },
            },
            signupTrend,
            recentUsers,
            recentTickets,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= User Management ======================= */

async function getAllUsers(req, res) {
    try {
        const { page = 1, limit = 20, search = "", type = "", role = "", team = "", customRole = "", status = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { company_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (type) query.company_type = type;
        if (role) query.role = role;
        if (team) query.team = team;
        if (customRole) query.customRole = customRole;
        if (status) query.accountStatus = status;

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            OrganizationModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .select("-sessions -saved_profiles -connections -profile")
                .populate("customRole", "name permissions status")
                .populate("team", "name slug description department permissions status"),
            OrganizationModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function getUserById(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        const user = await OrganizationModel.findById(id)
            .select("-sessions")
            .populate("connections.with", "name company_name email account.image");

        if (!user) return res.status(404).json({ status: 9, msg: "User not found" });

        const jobCount = await JobModel.countDocuments({ organization: id });
        const ticketCount = await TicketModel.countDocuments({ organization: id });
        const postCount = await CommunityPostModel.countDocuments({ author: id });

        return res.json({ status: 1, user, meta: { jobCount, ticketCount, postCount } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function sendInviteMemberOTP(req, res) {
    try {
        let { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 7, msg: "Email address is required" });
        }
        email = email.trim().toLowerCase();

        const existing = await OrganizationModel.findOne({ email });
        if (existing) {
            return res.status(400).json({ status: 3, msg: "This email is already registered in the ecosystem" });
        }

        const sent = await sendOtp(email);
        if (!sent) {
            return res.status(500).json({ status: 8, msg: "Failed to dispatch verification OTP" });
        }

        return res.json({ status: 1, msg: `Verification OTP successfully sent to ${email}` });
    } catch (err) {
        console.error("sendInviteMemberOTP error:", err);
        return res.status(500).json({ status: 0, msg: "Internal server error sending OTP" });
    }
}

async function inviteOrAddAdminUser(req, res) {
    try {
        const {
            email,
            name,
            phone,
            company_name,
            teamId,
            roleId,
            password,
            otp,
            sendInviteEmail = true,
        } = req.body;

        if (!email || !name) {
            return res.status(400).json({ status: 7, msg: "Email and Name are required" });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // Verify OTP for the invited member's email
        if (!otp || String(otp).trim().length === 0) {
            return res.status(400).json({ status: 4, msg: "Verification OTP is required to invite a new team member" });
        }

        const isOtpValid = verifyOtp(trimmedEmail, otp);
        if (!isOtpValid) {
            return res.status(400).json({ status: 4, msg: "Invalid or expired verification OTP. Please request a new OTP." });
        }

        const existing = await OrganizationModel.findOne({ email: trimmedEmail });
        if (existing) {
            return res.status(400).json({ status: 3, msg: "Email is already registered in the ecosystem" });
        }

        let teamObj = null;
        if (teamId) {
            teamObj = await TeamModel.findById(teamId);
            if (!teamObj) {
                return res.status(400).json({ status: 7, msg: "Selected team not found" });
            }
        }

        let hashedPassword = null;
        let temporaryPassword = null;
        let mustChangePassword = false;

        if (password && String(password).trim()) {
            temporaryPassword = String(password).trim();
            hashedPassword = await hashPassword(temporaryPassword);
            mustChangePassword = true;
        } else {
            const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            temporaryPassword = `RBF@${randSuffix}!9`;
            hashedPassword = await hashPassword(temporaryPassword);
            mustChangePassword = true;
        }

        const newUser = new OrganizationModel({
            name: name.trim(),
            email: trimmedEmail,
            phone: phone ? phone.trim() : "0000000000",
            company_name: company_name ? company_name.trim() : "RealBell Operations",
            company_type: "startup",
            role: "admin",
            team: teamObj?._id || null,
            accountStatus: "active",
            password: hashedPassword,
            mustChangePassword,
            account: {
                designation: teamObj?.name ? `${teamObj.name} Team Member` : "Staff Member",
            },
        });

        await newUser.save();

        // Send Professional Onboarding Email
        if (sendInviteEmail) {
            const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to RealBell Business Foundation</title>
</head>
<body style="margin:0;padding:0;background:#0b0d14;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d14;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#131722;border:1px solid #232936;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);">
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #4f46e5, #7c3aed);padding:35px 25px;color:#ffffff;">
              <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.02em;">RealBell Business Foundation</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#e0e7ff;opacity:0.95;">Administrative Console & Team Assignment</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 35px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              <p style="margin-top:0;font-size:17px;color:#f8fafc;">Hello <strong style="color:#ffffff;">${newUser.name}</strong>,</p>
              <p>You have been invited and assigned access to the <strong>RealBell Business Foundation</strong> administrative platform.</p>
              
              <div style="background:#1a202c;border:1px solid #2d3748;border-radius:10px;padding:22px;margin:25px 0;">
                <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#cbd5e1;">
                  <tr>
                    <td style="width:140px;color:#94a3b8;font-weight:600;">Organization:</td>
                    <td style="color:#f1f5f9;font-weight:700;">RealBell Business Foundation</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-weight:600;">Login Email:</td>
                    <td style="color:#818cf8;font-weight:700;">${newUser.email}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-weight:600;">Assigned Team:</td>
                    <td style="color:#38bdf8;font-weight:700;">🏢 ${teamObj ? teamObj.name + ' Team' : 'General Team'}</td>
                  </tr>
                  ${temporaryPassword ? `
                  <tr>
                    <td style="color:#94a3b8;font-weight:600;">Temporary Password:</td>
                    <td style="color:#f43f5e;font-family:monospace;font-weight:700;font-size:15px;background:#2d1b22;padding:4px 8px;border-radius:4px;display:inline-block;">${temporaryPassword}</td>
                  </tr>` : ""}
                </table>
              </div>

              <div style="text-align:center;margin:30px 0 20px;">
                <a href="${loginUrl}" style="background:linear-gradient(135deg, #6366f1, #8b5cf6);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(99,102,241,0.35);">
                  Sign In to Admin Console →
                </a>
              </div>

              <div style="background:rgba(239,68,68,0.08);border-left:4px solid #ef4444;padding:15px;border-radius:6px;margin-top:25px;">
                <strong style="color:#f87171;font-size:13px;">🔒 Security Best Practice:</strong>
                <p style="margin:6px 0 0;font-size:13px;color:#cbd5e1;line-height:1.5;">
                  Please change your temporary password after logging in. Your access permissions are controlled according to your assigned organizational role.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#0e111a;padding:20px;border-top:1px solid #1e2433;color:#64748b;font-size:12px;">
              © ${new Date().getFullYear()} RealBell Business Foundation. All Rights Reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

            await sendMail(
                newUser.email,
                "Welcome to RealBell Admin Console — Invitation & Account Setup",
                emailHtml
            );
        }

        await logAudit({
            action: "USER_INVITED",
            performedBy: req.user,
            targetType: "User",
            targetId: newUser._id,
            details: {
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                customRole: customRoleObj?.name || null,
                team: teamObj?.name || null,
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"],
        });

        const populatedUser = await OrganizationModel.findById(newUser._id)
            .select("-password -sessions")
            .populate("customRole", "name permissions status")
            .populate("team", "name department");

        return res.json({
            status: 1,
            msg: `User "${newUser.name}" invited successfully`,
            user: populatedUser,
        });
    } catch (err) {
        console.error("inviteOrAddAdminUser error:", err);
        return res.status(500).json({ status: 0, msg: "Failed to invite user" });
    }
}

async function updateUserRoleAndTeam(req, res) {
    try {
        const { id } = req.params;
        const { role, teamId, accountStatus, company_type } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        const user = await OrganizationModel.findById(id);
        if (!user) {
            return res.status(404).json({ status: 9, msg: "User not found" });
        }

        // Self-protection
        if (String(req.user._id) === String(id)) {
            if (role && role !== req.user.role) {
                return res.status(400).json({ status: 7, msg: "You cannot change your own system role" });
            }
            if (accountStatus && accountStatus === "disabled") {
                return res.status(400).json({ status: 7, msg: "You cannot disable your own account" });
            }
        }

        // Only super_admin can grant or remove super_admin role
        if (role === "super_admin" && req.user.role !== "super_admin") {
            return res.status(403).json({ status: 0, msg: "Only Super Admins can assign the super_admin role" });
        }

        const previousData = {
            role: user.role,
            team: user.team,
            accountStatus: user.accountStatus,
        };

        if (role !== undefined) {
            if (!["normal", "admin", "super_admin"].includes(role)) {
                return res.status(400).json({ status: 7, msg: "Invalid role value" });
            }
            user.role = role;
        }

        if (company_type !== undefined) {
            user.company_type = company_type;
        }

        if (teamId !== undefined) {
            if (teamId === "" || teamId === null) {
                user.team = null;
            } else {
                const team = await TeamModel.findById(teamId);
                if (!team) {
                    return res.status(400).json({ status: 7, msg: "Team not found" });
                }
                user.team = team._id;
                if (user.role === "normal") {
                    user.role = "admin";
                }
            }
        }

        if (accountStatus !== undefined) {
            if (!["active", "invited", "disabled", "pending"].includes(accountStatus)) {
                return res.status(400).json({ status: 7, msg: "Invalid account status" });
            }
            user.accountStatus = accountStatus;
            if (accountStatus === "disabled") {
                user.sessions = [];
            }
        }

        await user.save();

        await logAudit({
            action: "ROLE_ASSIGNED",
            performedBy: req.user,
            targetType: "User",
            targetId: user._id,
            details: {
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                previous: previousData,
                updated: {
                    role: user.role,
                    customRole: user.customRole,
                    team: user.team,
                    accountStatus: user.accountStatus,
                },
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"],
        });

        const updatedUser = await OrganizationModel.findById(user._id)
            .select("-password -sessions")
            .populate("customRole", "name permissions status")
            .populate("team", "name slug description department permissions status");

        return res.json({
            status: 1,
            msg: `Role and team updated for ${user.name}`,
            user: updatedUser,
        });
    } catch (err) {
        console.error("updateUserRoleAndTeam error:", err);
        return res.status(500).json({ status: 0, msg: "Failed to update user assignments" });
    }
}

async function toggleUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "disabled"].includes(status)) {
            return res.status(400).json({ status: 7, msg: "Status must be active or disabled" });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        if (String(req.user._id) === String(id)) {
            return res.status(400).json({ status: 7, msg: "You cannot change your own account status" });
        }

        const user = await OrganizationModel.findById(id);
        if (!user) {
            return res.status(404).json({ status: 9, msg: "User not found" });
        }

        user.accountStatus = status;
        if (status === "disabled") {
            user.sessions = [];
        }
        await user.save();

        await logAudit({
            action: "USER_STATUS_CHANGED",
            performedBy: req.user,
            targetType: "User",
            targetId: user._id,
            details: { userName: user.name, userEmail: user.email, status },
            ipAddress: req.ip || req.headers["x-forwarded-for"],
        });

        return res.json({
            status: 1,
            msg: `User account is now ${status}`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                accountStatus: user.accountStatus,
            },
        });
    } catch (err) {
        console.error("toggleUserStatus error:", err);
        return res.status(500).json({ status: 0, msg: "Failed to update account status" });
    }
}

async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role, company_type } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        const updates = {};

        if (role) {
            if (!["normal", "admin", "super_admin"].includes(role)) {
                return res.status(400).json({ status: 7, msg: "Invalid role. Must be normal, admin, or super_admin" });
            }

            // Only super_admin can assign super_admin role
            if (role === "super_admin" && req.user.role !== "super_admin") {
                return res.status(403).json({ status: 0, msg: "Only super admins can assign super_admin role" });
            }

            // Cannot change own system role
            if (String(req.user._id) === String(id) && role !== req.user.role) {
                return res.status(400).json({ status: 7, msg: "You cannot change your own system role" });
            }

            updates.role = role;
        }

        if (company_type) {
            updates.company_type = company_type;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ status: 7, msg: "No role or company_type provided to update" });
        }

        const user = await OrganizationModel.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        ).select("-sessions")
        .populate("customRole", "name permissions status")
        .populate("team", "name slug description department permissions status");

        if (!user) return res.status(404).json({ status: 9, msg: "User not found" });

        return res.json({ status: 1, msg: "User role / organization type updated successfully", user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        // Cannot delete yourself
        if (String(req.user._id) === String(id)) {
            return res.status(400).json({ status: 7, msg: "You cannot delete your own account" });
        }

        const user = await OrganizationModel.findById(id);
        if (!user) return res.status(404).json({ status: 9, msg: "User not found" });

        // Only super_admin can delete admin users
        if ((user.role === "admin" || user.role === "super_admin") && req.user.role !== "super_admin") {
            return res.status(403).json({ status: 0, msg: "Only super admins can delete admin users" });
        }

        // Delete user's related data
        await Promise.all([
            JobModel.deleteMany({ organization: id }),
            TicketModel.deleteMany({ organization: id }),
            CommunityPostModel.deleteMany({ author: id }),
            OrganizationModel.findByIdAndDelete(id),
        ]);

        await logAudit({
            action: "USER_DELETED",
            performedBy: req.user,
            targetType: "Organization",
            targetId: id,
            details: {
                deletedUserEmail: user.email,
                deletedUserName: user.name,
                team: user.team,
                role: user.role,
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"],
        });

        return res.json({ status: 1, msg: `User "${user.name}" and all associated data deleted successfully` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Job Management ======================= */

async function getAllJobs(req, res) {
    try {
        const { page = 1, limit = 20, search = "", status = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { industry: { $regex: search, $options: "i" } },
            ];
        }
        if (status) query.status = status;

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [jobs, total] = await Promise.all([
            JobModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("organization", "name company_name email account.image"),
            JobModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            jobs,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deleteJob(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid job id" });

        const job = await JobModel.findByIdAndDelete(id);
        if (!job) return res.status(404).json({ status: 9, msg: "Job not found" });

        return res.json({ status: 1, msg: "Job deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Ticket Management ======================= */

async function getAllTickets(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            search = "",
            status = "",
            priority = "",
            issue_type = "",
            view = "all",
            teamId = "",
            assigned_team = "",
            assigned_to = "",
            sortBy = "createdAt",
            order = "desc",
        } = req.query;

        const query = {};

        // Search text
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { ticket_number: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // Status & Priority & Issue Type
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (issue_type) query.issue_type = issue_type;

        // Specific filters
        if (assigned_to && mongoose.isValidObjectId(assigned_to)) {
            query.assigned_to = assigned_to;
        }
        if (assigned_team && mongoose.isValidObjectId(assigned_team)) {
            query.assigned_team = assigned_team;
        }

        // View Switcher: All, My Tickets, My Team, Unassigned, Specific Team
        const currentUserId = req.user?._id;
        const currentUserTeamId = req.user?.team?._id || req.user?.team;
        // Strictly Super Admin gets global ecosystem queue & unassigned tickets
        const hasGlobalView = req.user?.role === "super_admin";

        if (!hasGlobalView) {
            // Team members / staff without global tickets.view permission (e.g. User B & User C):
            // Strictly blocked from unassigned tickets or global ecosystem queues.
            if (view === "unassigned") {
                // Return empty result
                query._id = new mongoose.Types.ObjectId();
            } else if (view === "my" || view === "my_tickets") {
                // Strictly personal tickets assigned to this member
                query.assigned_to = currentUserId;
            } else if (view === "my_team") {
                // Common team queue tickets (unassigned to a member) OR assigned directly to this member
                if (currentUserTeamId) {
                    query.assigned_team = currentUserTeamId;
                    query.$or = [
                        { assigned_to: null },
                        { assigned_to: { $exists: false } },
                        { assigned_to: currentUserId },
                    ];
                } else {
                    query.assigned_to = currentUserId;
                }
            } else {
                // Fallback / default: strictly personal + common team queue
                if (currentUserTeamId && currentUserId) {
                    query.$or = [
                        { assigned_to: currentUserId },
                        { assigned_team: currentUserTeamId, assigned_to: null },
                        { assigned_team: currentUserTeamId, assigned_to: { $exists: false } },
                    ];
                } else if (currentUserId) {
                    query.assigned_to = currentUserId;
                } else if (currentUserTeamId) {
                    query.assigned_team = currentUserTeamId;
                    query.$or = [
                        { assigned_to: null },
                        { assigned_to: { $exists: false } },
                    ];
                } else {
                    query._id = new mongoose.Types.ObjectId();
                }
            }
        } else {
            // Global admin / super_admin (e.g. User A)
            if (view === "my" || view === "my_tickets") {
                if (currentUserId) {
                    query.assigned_to = currentUserId;
                }
            } else if (view === "my_team") {
                if (currentUserTeamId) {
                    query.assigned_team = currentUserTeamId;
                } else {
                    query.assigned_team = new mongoose.Types.ObjectId();
                }
            } else if (view === "unassigned") {
                query.assigned_team = null;
                query.assigned_to = null;
            } else if (view === "team" && teamId && mongoose.isValidObjectId(teamId)) {
                query.assigned_team = teamId;
            }
        }

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Define aggregation match condition for scoped user
        const baseScopeMatch = hasGlobalView
            ? {}
            : (currentUserTeamId && currentUserId)
                ? {
                    $or: [
                        { assigned_to: new mongoose.Types.ObjectId(String(currentUserId)) },
                        { assigned_team: new mongoose.Types.ObjectId(String(currentUserTeamId)), assigned_to: null },
                        { assigned_team: new mongoose.Types.ObjectId(String(currentUserTeamId)), assigned_to: { $exists: false } },
                    ],
                }
                : currentUserId
                    ? { assigned_to: new mongoose.Types.ObjectId(String(currentUserId)) }
                    : { _id: null };

        const [tickets, total, countsAgg] = await Promise.all([
            TicketModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("organization", "name company_name email phone account.image")
                .populate("assigned_team", "name slug department status")
                .populate("assigned_to", "name company_name email role account.image team")
                .populate("assigned_by", "name email")
                .populate("assignment_history.assigned_to", "name email account.image")
                .populate("assignment_history.assigned_team", "name department")
                .populate("assignment_history.assigned_by", "name email")
                .populate("internal_notes.author", "name email account.image"),
            TicketModel.countDocuments(query),
            TicketModel.aggregate([
                { $match: baseScopeMatch },
                {
                    $facet: {
                        all: [{ $count: "count" }],
                        open: [{ $match: { status: "Open" } }, { $count: "count" }],
                        inProgress: [{ $match: { status: "In Progress" } }, { $count: "count" }],
                        resolved: [{ $match: { status: "Resolved" } }, { $count: "count" }],
                        closed: [{ $match: { status: "Closed" } }, { $count: "count" }],
                        unassigned: hasGlobalView
                            ? [{ $match: { assigned_team: null, assigned_to: null } }, { $count: "count" }]
                            : [{ $match: { _id: null } }, { $count: "count" }],
                        myTickets: currentUserId
                            ? [{ $match: { assigned_to: new mongoose.Types.ObjectId(String(currentUserId)) } }, { $count: "count" }]
                            : [{ $match: { _id: null } }, { $count: "count" }],
                        myTeamTickets: currentUserTeamId
                            ? [
                                {
                                    $match: hasGlobalView
                                        ? { assigned_team: new mongoose.Types.ObjectId(String(currentUserTeamId)) }
                                        : {
                                            assigned_team: new mongoose.Types.ObjectId(String(currentUserTeamId)),
                                            $or: [
                                                { assigned_to: null },
                                                { assigned_to: { $exists: false } },
                                                { assigned_to: new mongoose.Types.ObjectId(String(currentUserId)) },
                                            ],
                                        },
                                },
                                { $count: "count" },
                            ]
                            : [{ $match: { _id: null } }, { $count: "count" }],
                    },
                },
            ]),
        ]);

        const facet = countsAgg?.[0] || {};
        const counts = {
            total: facet.all?.[0]?.count || 0,
            open: facet.open?.[0]?.count || 0,
            inProgress: facet.inProgress?.[0]?.count || 0,
            resolved: facet.resolved?.[0]?.count || 0,
            closed: facet.closed?.[0]?.count || 0,
            unassigned: facet.unassigned?.[0]?.count || 0,
            myTickets: facet.myTickets?.[0]?.count || 0,
            myTeamTickets: facet.myTeamTickets?.[0]?.count || 0,
        };

        return res.json({
            status: 1,
            tickets,
            counts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.max(1, Math.ceil(total / parseInt(limit))),
            },
        });
    } catch (err) {
        console.error("getAllTickets error:", err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function getAssignableUsersAndTeams(req, res) {
    try {
        const [teams, admins] = await Promise.all([
            TeamModel.find({ status: "active" })
                .select("name slug department leader permissions")
                .sort({ name: 1 }),
            OrganizationModel.find({
                role: { $in: ["admin", "super_admin"] },
                accountStatus: { $ne: "disabled" },
            })
                .select("name email role company_name team account.image account.designation")
                .populate("team", "name department slug")
                .sort({ name: 1 }),
        ]);

        return res.json({
            status: 1,
            teams,
            admins,
        });
    } catch (err) {
        console.error("getAssignableUsersAndTeams error:", err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function assignOrForwardTicket(req, res) {
    try {
        const { id } = req.params;
        const { assigned_team, assigned_to, note = "", priority } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid ticket ID" });
        }

        const ticket = await TicketModel.findById(id);
        if (!ticket) {
            return res.status(404).json({ status: 9, msg: "Ticket not found" });
        }

        let targetTeam = null;
        if (assigned_team) {
            if (!mongoose.isValidObjectId(assigned_team)) {
                return res.status(400).json({ status: 7, msg: "Invalid team ID" });
            }
            targetTeam = await TeamModel.findById(assigned_team);
            if (!targetTeam) {
                return res.status(400).json({ status: 7, msg: "Selected target team not found" });
            }
        }

        let targetUser = null;
        if (assigned_to) {
            if (!mongoose.isValidObjectId(assigned_to)) {
                return res.status(400).json({ status: 7, msg: "Invalid target user ID" });
            }
            targetUser = await OrganizationModel.findById(assigned_to);
            if (!targetUser) {
                return res.status(400).json({ status: 7, msg: "Selected target user not found" });
            }
            // Auto-align team if user belongs to a team and team wasn't explicitly selected
            if (!assigned_team && targetUser.team) {
                targetTeam = await TeamModel.findById(targetUser.team);
            }
        }

        // Determine action
        const wasAssigned = Boolean(ticket.assigned_team || ticket.assigned_to);
        let action = "assigned";
        if (!assigned_team && !assigned_to) {
            action = "unassigned";
        } else if (wasAssigned) {
            action = "forwarded";
        }

        const resolvedTeamId = targetTeam ? targetTeam._id : (assigned_team || null);
        const resolvedUserId = targetUser ? targetUser._id : (assigned_to || null);

        // Record Assignment History
        const historyEntry = {
            assigned_to: resolvedUserId,
            assigned_team: resolvedTeamId,
            assigned_by: req.user._id,
            action,
            note: note ? note.trim() : (action === "forwarded" ? "Forwarded to new assignee/team" : "Assigned ticket"),
            createdAt: new Date(),
        };

        ticket.assigned_team = resolvedTeamId;
        ticket.assigned_to = resolvedUserId;
        ticket.assigned_by = req.user._id;
        if (priority && ["Low", "Medium", "High", "Urgent"].includes(priority)) {
            ticket.priority = priority;
        }

        ticket.assignment_history.push(historyEntry);

        // If status was Open and now assigned, optionally advance to In Progress
        if (ticket.status === "Open" && (resolvedTeamId || resolvedUserId)) {
            ticket.status = "In Progress";
        }

        await ticket.save();

        await logAudit({
            action: action === "forwarded" ? "TICKET_FORWARDED" : "TICKET_ASSIGNED",
            performedBy: req.user,
            targetType: "Ticket",
            targetId: ticket._id,
            details: {
                ticket_number: ticket.ticket_number,
                title: ticket.title,
                assigned_team: targetTeam ? targetTeam.name : null,
                assigned_to: targetUser ? targetUser.name : null,
                note: historyEntry.note,
                priority: ticket.priority,
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"],
        });

        const updatedTicket = await TicketModel.findById(ticket._id)
            .populate("organization", "name company_name email phone account.image")
            .populate("assigned_team", "name slug department status")
            .populate("assigned_to", "name company_name email role account.image team")
            .populate("assigned_by", "name email")
            .populate("assignment_history.assigned_to", "name email account.image")
            .populate("assignment_history.assigned_team", "name department")
            .populate("assignment_history.assigned_by", "name email")
            .populate("internal_notes.author", "name email account.image");

        return res.json({
            status: 1,
            msg: action === "forwarded"
                ? `Ticket forwarded successfully to ${targetUser?.name || targetTeam?.name || "new assignee"}`
                : `Ticket assigned successfully to ${targetUser?.name || targetTeam?.name || "assignee"}`,
            ticket: updatedTicket,
        });
    } catch (err) {
        console.error("assignOrForwardTicket error:", err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function addTicketInternalNote(req, res) {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid ticket ID" });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ status: 7, msg: "Note message cannot be empty" });
        }

        const ticket = await TicketModel.findById(id);
        if (!ticket) {
            return res.status(404).json({ status: 9, msg: "Ticket not found" });
        }

        ticket.internal_notes.push({
            author: req.user._id,
            message: message.trim(),
            createdAt: new Date(),
        });

        await ticket.save();

        const updatedTicket = await TicketModel.findById(ticket._id)
            .populate("organization", "name company_name email phone account.image")
            .populate("assigned_team", "name slug department status")
            .populate("assigned_to", "name company_name email role account.image team")
            .populate("assigned_by", "name email")
            .populate("assignment_history.assigned_to", "name email account.image")
            .populate("assignment_history.assigned_team", "name department")
            .populate("assignment_history.assigned_by", "name email")
            .populate("internal_notes.author", "name email account.image");

        return res.json({
            status: 1,
            msg: "Internal note added successfully",
            ticket: updatedTicket,
        });
    } catch (err) {
        console.error("addTicketInternalNote error:", err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function updateTicketStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;

        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid ticket id" });

        const ticket = await TicketModel.findById(id);
        if (!ticket) return res.status(404).json({ status: 9, msg: "Ticket not found" });

        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ status: 7, msg: "Invalid status" });
            }
            if (status !== ticket.status) {
                ticket.assignment_history.push({
                    assigned_to: ticket.assigned_to,
                    assigned_team: ticket.assigned_team,
                    assigned_by: req.user._id,
                    action: "status_changed",
                    note: `Status changed from ${ticket.status} to ${status}`,
                    createdAt: new Date(),
                });
                ticket.status = status;
            }
        }

        if (priority && ["Low", "Medium", "High", "Urgent"].includes(priority)) {
            ticket.priority = priority;
        }

        await ticket.save();

        const updatedTicket = await TicketModel.findById(ticket._id)
            .populate("organization", "name company_name email phone account.image")
            .populate("assigned_team", "name slug department status")
            .populate("assigned_to", "name company_name email role account.image team")
            .populate("assigned_by", "name email")
            .populate("assignment_history.assigned_to", "name email account.image")
            .populate("assignment_history.assigned_team", "name department")
            .populate("assignment_history.assigned_by", "name email")
            .populate("internal_notes.author", "name email account.image");

        return res.json({ status: 1, msg: "Ticket updated successfully", ticket: updatedTicket });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deleteTicket(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid ticket id" });

        const ticket = await TicketModel.findByIdAndDelete(id);
        if (!ticket) return res.status(404).json({ status: 9, msg: "Ticket not found" });

        await logAudit({
            action: "TICKET_DELETED",
            performedBy: req.user,
            targetType: "Ticket",
            targetId: id,
            details: {
                ticket_number: ticket.ticket_number,
                title: ticket.title,
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"],
        });

        return res.json({ status: 1, msg: "Ticket deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Community Management ======================= */

async function getAllCommunityPosts(req, res) {
    try {
        const { page = 1, limit = 20, search = "", post_type = "", company_type = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) query.content = { $regex: search, $options: "i" };
        if (post_type) query.post_type = post_type;

        if (company_type) {
            const matchingAuthors = await OrganizationModel.find({ company_type }).distinct("_id");
            query.author = { $in: matchingAuthors };
        }

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [posts, total] = await Promise.all([
            CommunityPostModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("author", "name company_name email account.image company_type"),
            CommunityPostModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            posts,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deletePost(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid post id" });

        const post = await CommunityPostModel.findByIdAndDelete(id);
        if (!post) return res.status(404).json({ status: 9, msg: "Post not found" });

        return res.json({ status: 1, msg: "Post deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function togglePinPost(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid post id" });

        const post = await CommunityPostModel.findById(id);
        if (!post) return res.status(404).json({ status: 9, msg: "Post not found" });

        post.is_pinned = !post.is_pinned;
        await post.save();

        return res.json({ status: 1, msg: post.is_pinned ? "Post pinned" : "Post unpinned", is_pinned: post.is_pinned });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Analytics ======================= */

async function getAnalytics(req, res) {
    try {
        const { range = "30" } = req.query;
        const days = parseInt(range);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [
            usersByType,
            usersByRole,
            signupsByDay,
            ticketsByStatus,
            ticketsByType,
            jobsByStatus,
            jobsByType,
            topActiveUsers,
        ] = await Promise.all([
            // Users by company type
            OrganizationModel.aggregate([
                { $group: { _id: "$company_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Users by role
            OrganizationModel.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
            ]),
            // Signups per day in range
            OrganizationModel.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Tickets by status
            TicketModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            // Tickets by type
            TicketModel.aggregate([
                { $group: { _id: "$issue_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Jobs by status
            JobModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            // Jobs by employment type
            JobModel.aggregate([
                { $group: { _id: "$employment_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Top users by connection count
            OrganizationModel.aggregate([
                {
                    $project: {
                        name: 1,
                        company_name: 1,
                        company_type: 1,
                        "account.image": 1,
                        connectionCount: {
                            $size: {
                                $filter: {
                                    input: "$connections",
                                    as: "c",
                                    cond: { $eq: ["$$c.status", "accepted"] },
                                },
                            },
                        },
                    },
                },
                { $sort: { connectionCount: -1 } },
                { $limit: 5 },
            ]),
        ]);

        return res.json({
            status: 1,
            analytics: {
                usersByType,
                usersByRole,
                signupsByDay,
                ticketsByStatus,
                ticketsByType,
                jobsByStatus,
                jobsByType,
                topActiveUsers,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Recent Activity ======================= */

async function getRecentActivity(req, res) {
    try {
        const [recentUsers, recentTickets, recentPosts, recentJobs] = await Promise.all([
            OrganizationModel.find().sort({ createdAt: -1 }).limit(10)
                .select("name company_name company_type email account.image role createdAt"),
            TicketModel.find().sort({ createdAt: -1 }).limit(10)
                .populate("organization", "name company_name account.image"),
            CommunityPostModel.find().sort({ createdAt: -1 }).limit(10)
                .populate("author", "name company_name account.image"),
            JobModel.find().sort({ createdAt: -1 }).limit(10)
                .populate("organization", "name company_name account.image"),
        ]);

        const activity = [
            ...recentUsers.map((u) => ({ type: "user_joined", data: u, createdAt: u.createdAt })),
            ...recentTickets.map((t) => ({ type: "ticket_created", data: t, createdAt: t.createdAt })),
            ...recentPosts.map((p) => ({ type: "post_created", data: p, createdAt: p.createdAt })),
            ...recentJobs.map((j) => ({ type: "job_posted", data: j, createdAt: j.createdAt })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);

        return res.json({ status: 1, activity });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

export {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAllJobs,
    deleteJob,
    getAllTickets,
    getAssignableUsersAndTeams,
    assignOrForwardTicket,
    addTicketInternalNote,
    updateTicketStatus,
    deleteTicket,
    getAllCommunityPosts,
    deletePost,
    togglePinPost,
    getAnalytics,
    getRecentActivity,
    sendInviteMemberOTP,
    inviteOrAddAdminUser,
    updateUserRoleAndTeam,
    toggleUserStatus,
};

import crypto from "crypto";
import OrganizationModel from "../models/organization.js";
import ReferralModel from "../models/referral.js";
import WalletModel from "../models/wallet.js";
import WalletTransactionModel from "../models/walletTransaction.js";
import { getOrCreateUserWallet, getWalletConfig } from "./walletController.js";

/**
 * Helper to generate a clean, secure, unique uppercase alphanumeric referral code
 * Format: "RBF" + 5 random unambiguous alphanumeric chars (e.g. RBF8K2M1, RBF47X9A)
 */
export async function generateUniqueReferralCode() {
  const prefix = "RBF";
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  let isUnique = false;
  let code = "";
  let attempts = 0;

  while (!isUnique && attempts < 20) {
    attempts++;
    let randomStr = "";
    const randomBytes = crypto.randomBytes(5);
    for (let i = 0; i < 5; i++) {
      randomStr += chars[randomBytes[i] % chars.length];
    }

    code = `${prefix}${randomStr}`;

    const existing = await OrganizationModel.findOne({ referralCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  // Fallback if collision persists
  if (!isUnique) {
    code = `RBF${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }

  return code;
}

/**
 * Public: Validate a referral code during signup
 * Checks existence, active status, and returns public referrer info
 */
export async function validateReferralCode(req, res) {
  try {
    const { code } = req.params;
    if (!code || !code.trim()) {
      return res.status(400).json({ status: 0, msg: "Referral code is required" });
    }

    const normalizedCode = code.trim().toUpperCase();

    const referrer = await OrganizationModel.findOne({ referralCode: normalizedCode }).select(
      "name company_name company_type accountStatus"
    );

    if (!referrer) {
      return res.status(404).json({
        status: 0,
        msg: "Invalid referral code. Please check the code and try again.",
      });
    }

    if (referrer.accountStatus === "disabled") {
      return res.status(400).json({
        status: 0,
        msg: "This referral code belongs to an inactive account.",
      });
    }

    const config = await getWalletConfig();
    const bonusCredits = typeof config.referralCredits === "number" ? config.referralCredits : 250;

    return res.json({
      status: 1,
      msg: `Referral code applied! You will receive ${bonusCredits} bonus credits on registration.`,
      referrer: {
        name: referrer.name,
        company_name: referrer.company_name,
        company_type: referrer.company_type,
        referralCode: normalizedCode,
      },
      bonusCredits,
    });
  } catch (err) {
    console.error("validateReferralCode error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Protected: Get authenticated user's referral code, link, stats, and referral history
 */
export async function getMyReferralStats(req, res) {
  try {
    const user = await OrganizationModel.findById(req.user._id).select(
      "name company_name email referralCode referralCreditsEarned referralCount"
    );

    if (!user) {
      return res.status(404).json({ status: 0, msg: "User not found" });
    }

    // Auto-generate code if user doesn't have one yet
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode(user.name || user.company_name);
      await user.save();
    }

    // Fetch dynamic referral reward configuration
    const config = await getWalletConfig();
    const rewardPerReferral = typeof config.referralCredits === "number" ? config.referralCredits : 250;

    // Fetch referral history
    const referrals = await ReferralModel.find({ referrer: req.user._id })
      .populate("referredUser", "name company_name company_type createdAt")
      .sort({ createdAt: -1 });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const referralLink = `${frontendUrl}/signup?ref=${user.referralCode}`;

    return res.json({
      status: 1,
      referralCode: user.referralCode,
      referralLink,
      stats: {
        successfulReferrals: user.referralCount || referrals.length,
        totalCreditsEarned: user.referralCreditsEarned || referrals.length * rewardPerReferral,
        rewardPerReferral,
      },
      referrals: referrals.map((r) => ({
        _id: r._id,
        referredUser: {
          name: r.referredUser?.name || "Ecosystem Member",
          company_name: r.referredUser?.company_name || "Startup Project",
          company_type: r.referredUser?.company_type || "startup",
        },
        rewardAmount: r.referrerReward ?? rewardPerReferral,
        status: r.status || "completed",
        rewardedAt: r.rewardedAt || r.createdAt,
      })),
    });
  } catch (err) {
    console.error("getMyReferralStats error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Seed missing referral codes for any existing users in MongoDB on server startup
 */
export async function seedMissingReferralCodes() {
  try {
    const usersWithoutCode = await OrganizationModel.find({
      $or: [{ referralCode: null }, { referralCode: "" }, { referralCode: { $exists: false } }],
    });

    if (usersWithoutCode.length > 0) {
      for (const u of usersWithoutCode) {
        u.referralCode = await generateUniqueReferralCode(u.name || u.company_name);
        await u.save();
      }
      console.log(`[Referral System] Auto-seeded unique referral codes for ${usersWithoutCode.length} users.`);
    }
  } catch (err) {
    console.warn("seedMissingReferralCodes warning:", err.message);
  }
}

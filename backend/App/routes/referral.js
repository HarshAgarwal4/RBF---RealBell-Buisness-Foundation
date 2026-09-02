import express from "express";
import { validateReferralCode, getMyReferralStats } from "../controllers/referralController.js";

const referralRouter = express.Router();

// Public: Validate referral code during signup
referralRouter.get("/validate/:code", validateReferralCode);

// Protected: Get user's referral code, link, and stats (handled via global isLoggedIn middleware)
referralRouter.get("/my-stats", getMyReferralStats);

export default referralRouter;

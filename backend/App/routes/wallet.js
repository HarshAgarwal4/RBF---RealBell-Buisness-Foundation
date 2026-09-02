import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import {
  getMyWallet,
  createWalletTopupOrder,
  verifyWalletTopupPayment,
  getWalletTransactions,
  getAdminWallets,
  getAdminWalletUserDetail,
  adminAdjustCredits,
  getAdminWalletTransactions,
  getAdminWalletStats,
} from "../controllers/walletController.js";

const walletRouter = express.Router();

// User Wallet Endpoints (Protected by global isLoggedIn)
walletRouter.get("/my-wallet", getMyWallet);
walletRouter.post("/topup/create-order", createWalletTopupOrder);
walletRouter.post("/topup/verify", verifyWalletTopupPayment);
walletRouter.get("/transactions", getWalletTransactions);

// Admin & Super Admin Management Endpoints
walletRouter.get("/admin/stats", isAdmin, authorize("users.view"), getAdminWalletStats);
walletRouter.get("/admin/wallets", isAdmin, authorize("users.view"), getAdminWallets);
walletRouter.get("/admin/user/:userId", isAdmin, authorize("users.view"), getAdminWalletUserDetail);
walletRouter.post("/admin/adjust", isAdmin, authorize("users.update"), adminAdjustCredits);
walletRouter.get("/admin/transactions", isAdmin, authorize("users.view"), getAdminWalletTransactions);

export default walletRouter;

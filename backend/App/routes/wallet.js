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
  getAdminWalletSettings,
  updateAdminWalletSettings,
  getPublicWalletSettings,
} from "../controllers/walletController.js";

const walletRouter = express.Router();

// Public / User Wallet Endpoints (Protected by global isLoggedIn or public)
walletRouter.get("/settings", getPublicWalletSettings);
walletRouter.get("/my-wallet", getMyWallet);
walletRouter.post("/topup/create-order", createWalletTopupOrder);
walletRouter.post("/topup/verify", verifyWalletTopupPayment);
walletRouter.get("/transactions", getWalletTransactions);

// Admin & Super Admin Management Endpoints (Strictly Protected by Team RBAC)
walletRouter.get("/admin/stats", isAdmin, authorize("wallets.view"), getAdminWalletStats);
walletRouter.get("/admin/settings", isAdmin, authorize(["wallets.view", "wallets.settings"]), getAdminWalletSettings);
walletRouter.put("/admin/settings", isAdmin, authorize(["wallets.settings", "wallets.manage"]), updateAdminWalletSettings);
walletRouter.get("/admin/wallets", isAdmin, authorize("wallets.view"), getAdminWallets);
walletRouter.get("/admin/user/:userId", isAdmin, authorize("wallets.view"), getAdminWalletUserDetail);
walletRouter.post("/admin/adjust", isAdmin, authorize(["wallets.adjust", "wallets.manage"]), adminAdjustCredits);
walletRouter.get("/admin/transactions", isAdmin, authorize("wallets.view"), getAdminWalletTransactions);

export default walletRouter;


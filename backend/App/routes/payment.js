import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import {
  createOrder,
  verifyPayment,
  getUserSubscription,
  getAdminTransactions,
  getAdminPaymentStats,
  handleRazorpayWebhook,
  syncPaymentStatus,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

/* Razorpay Server-to-Server Webhook (Handles background auto-activation if user closed browser) */
paymentRouter.post("/webhook", handleRazorpayWebhook);

/* User Payment Routes */
paymentRouter.post("/create-order", createOrder);
paymentRouter.post("/verify", verifyPayment);
paymentRouter.post("/sync-status", syncPaymentStatus);
paymentRouter.get("/my-subscription", getUserSubscription);

/* Admin Payment Routes with RBAC */
paymentRouter.get("/admin/transactions", isAdmin, authorize("payments.view"), getAdminTransactions);
paymentRouter.get("/admin/stats", isAdmin, authorize("payments.view"), getAdminPaymentStats);

export default paymentRouter;

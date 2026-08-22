import express from "express";
import { isAdmin, authorize } from "../../middlewares/admin.js";
import {
  createOrder,
  verifyPayment,
  getUserSubscription,
  getAdminTransactions,
  getAdminPaymentStats,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

/* User Payment Routes */
paymentRouter.post("/create-order", createOrder);
paymentRouter.post("/verify", verifyPayment);
paymentRouter.get("/my-subscription", getUserSubscription);

/* Admin Payment Routes with RBAC */
paymentRouter.get("/admin/transactions", isAdmin, authorize("payments.view"), getAdminTransactions);
paymentRouter.get("/admin/stats", isAdmin, authorize("payments.view"), getAdminPaymentStats);

export default paymentRouter;

import express from "express";
import { isAdmin } from "../../middlewares/admin.js";
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

/* Admin Payment Routes */
paymentRouter.get("/admin/transactions", isAdmin, getAdminTransactions);
paymentRouter.get("/admin/stats", isAdmin, getAdminPaymentStats);

export default paymentRouter;

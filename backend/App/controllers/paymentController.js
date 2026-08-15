import crypto from "crypto";
import Razorpay from "razorpay";
import PlanModel from "../models/plan.js";
import TransactionModel from "../models/transaction.js";
import OrganizationModel from "../models/organization.js";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_RBF1234567890";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_RBF";

let razorpayInstance = null;
try {
  razorpayInstance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
} catch (e) {
  console.warn("Razorpay instance init warning:", e.message);
}

/**
 * Create a Razorpay Order
 */
export async function createOrder(req, res) {
  try {
    const { planId, planKey } = req.body;
    let plan = null;

    if (planId) {
      plan = await PlanModel.findById(planId);
    } else if (planKey) {
      plan = await PlanModel.findOne({ key: planKey });
    }

    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Subscription plan not found" });
    }

    // Free plan handler
    if (plan.price === 0) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10); // 10 years for free

      await OrganizationModel.findByIdAndUpdate(req.user._id, {
        subscription: {
          planKey: plan.key,
          planName: plan.name,
          status: "active",
          startDate,
          endDate,
          razorpayPaymentId: "FREE_PLAN",
          razorpayOrderId: "FREE_PLAN",
        },
      });

      await TransactionModel.create({
        user: req.user._id,
        plan: plan._id,
        planKey: plan.key,
        planName: plan.name,
        amount: 0,
        currency: "INR",
        razorpayOrderId: "FREE_PLAN",
        razorpayPaymentId: "FREE_PLAN",
        status: "paid",
        startDate,
        endDate,
      });

      return res.json({
        status: 1,
        isFree: true,
        msg: "Free plan activated successfully!",
      });
    }

    const amountInPaise = Math.round(plan.price * 100);
    const receiptId = `rcpt_${req.user._id.toString().slice(-6)}_${Date.now()}`;

    let razorpayOrder = null;
    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      try {
        razorpayOrder = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: plan.currency || "INR",
          receipt: receiptId,
          notes: {
            userId: req.user._id.toString(),
            planKey: plan.key,
          },
        });
      } catch (err) {
        console.error("Razorpay API order error, using fallback demo order:", err);
      }
    }

    // Fallback order object if live API key is not configured or fails
    if (!razorpayOrder) {
      razorpayOrder = {
        id: `order_demo_${Date.now()}`,
        amount: amountInPaise,
        currency: plan.currency || "INR",
        receipt: receiptId,
      };
    }

    // Record created transaction draft
    await TransactionModel.create({
      user: req.user._id,
      plan: plan._id,
      planKey: plan.key,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency || "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "created",
    });

    return res.json({
      status: 1,
      order: razorpayOrder,
      key_id: KEY_ID,
      plan: {
        _id: plan._id,
        name: plan.name,
        price: plan.price,
        key: plan.key,
      },
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Verify Razorpay Payment Signature and activate subscription
 */
export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, planKey } = req.body;

    let plan = null;
    if (planId) {
      plan = await PlanModel.findById(planId);
    } else if (planKey) {
      plan = await PlanModel.findOne({ key: planKey });
    }

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ status: 0, msg: "Invalid payment payload" });
    }

    // Validate Signature if live secret is present
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        await TransactionModel.findOneAndUpdate(
          { razorpayOrderId: razorpay_order_id },
          { status: "failed", razorpayPaymentId: razorpay_payment_id }
        );
        return res.status(400).json({ status: 0, msg: "Payment signature verification failed" });
      }
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (plan?.interval === "yearly" ? 365 : 30));

    const pKey = plan?.key || "pro_growth";
    const pName = plan?.name || "Pro Growth";

    // Update user subscription
    const updatedUser = await OrganizationModel.findByIdAndUpdate(
      req.user._id,
      {
        subscription: {
          planKey: pKey,
          planName: pName,
          status: "active",
          startDate,
          endDate,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        },
      },
      { new: true }
    ).select("-sessions");

    // Update or create transaction record
    await TransactionModel.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        user: req.user._id,
        plan: plan?._id,
        planKey: pKey,
        planName: pName,
        amount: plan?.price || 0,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature || "verified",
        status: "paid",
        startDate,
        endDate,
      },
      { upsert: true, new: true }
    );

    return res.json({
      status: 1,
      msg: "Payment verified! Subscription activated.",
      subscription: updatedUser.subscription,
    });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Get current user subscription details & transaction history
 */
export async function getUserSubscription(req, res) {
  try {
    const user = await OrganizationModel.findById(req.user._id).select("subscription name email company_name");
    const transactions = await TransactionModel.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json({
      status: 1,
      subscription: user?.subscription || {
        planKey: "free",
        planName: "Free Starter",
        status: "active",
      },
      transactions,
    });
  } catch (err) {
    console.error("getUserSubscription error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Get all payment transactions
 */
export async function getAdminTransactions(req, res) {
  try {
    const { page = 1, limit = 20, search = "", status = "" } = req.query;
    const query = {};

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name company_name email company_type account.image"),
      TransactionModel.countDocuments(query),
    ]);

    return res.json({
      status: 1,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("getAdminTransactions error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Get payment & subscription summary stats
 */
export async function getAdminPaymentStats(req, res) {
  try {
    const [paidAgg, activeSubs, totalTxns, totalPlans] = await Promise.all([
      TransactionModel.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
      ]),
      OrganizationModel.countDocuments({ "subscription.status": "active", "subscription.planKey": { $ne: "free" } }),
      TransactionModel.countDocuments({ status: "paid" }),
      PlanModel.countDocuments(),
    ]);

    const totalRevenue = paidAgg[0]?.totalRevenue || 0;

    return res.json({
      status: 1,
      stats: {
        totalRevenue,
        activeSubs,
        totalTxns,
        totalPlans,
      },
    });
  } catch (err) {
    console.error("getAdminPaymentStats error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

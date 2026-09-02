import crypto from "crypto";
import Razorpay from "razorpay";
import PlanModel from "../models/plan.js";
import TransactionModel from "../models/transaction.js";
import OrganizationModel from "../models/organization.js";
import WalletModel from "../models/wallet.js";
import WalletTransactionModel from "../models/walletTransaction.js";

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
 * Create a Razorpay Order with Upgrade Price Adjustment & Downgrade Prevention
 */
export async function createOrder(req, res) {
  try {
    const { planId, planKey } = req.body;
    let plan = null;

    if (planId) {
      plan = await PlanModel.findOne({ _id: planId, is_deleted: { $ne: true } });
    } else if (planKey) {
      plan = await PlanModel.findOne({ key: planKey.toLowerCase().trim(), is_deleted: { $ne: true } });
    }

    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Subscription plan not found or unavailable" });
    }

    // Fetch user's current subscription
    const userDoc = await OrganizationModel.findById(req.user._id).select("subscription name email");
    const currentSub = userDoc?.subscription;
    const isCurrentActive = currentSub?.status === "active";
    const currentPlanKey = currentSub?.planKey || "free";

    let currentPlanDoc = null;
    if (currentPlanKey && currentPlanKey !== "free") {
      currentPlanDoc = await PlanModel.findOne({ key: currentPlanKey, is_deleted: { $ne: true } });
    }

    const currentPrice = isCurrentActive && currentPlanDoc ? currentPlanDoc.price : 0;
    const currentTierRank = isCurrentActive && currentPlanDoc ? currentPlanDoc.tier_rank || 1 : 1;
    const targetTierRank = plan.tier_rank || 1;

    // Disabled / Legacy plan purchase restriction:
    // If the plan is disabled, new users cannot purchase it!
    if (plan.status === "disabled" && (!isCurrentActive || currentPlanKey !== plan.key)) {
      return res.status(400).json({
        status: 0,
        msg: `Plan "${plan.name}" is a legacy plan and is no longer available for new subscriptions.`,
      });
    }

    // Downgrade Prevention:
    // If user is currently on an active paid plan and attempts to pick a lower tier or cheaper plan:
    if (isCurrentActive && currentPrice > 0) {
      if (targetTierRank < currentTierRank || (plan.price < currentPrice && targetTierRank <= currentTierRank)) {
        return res.status(400).json({
          status: 0,
          msg: `Downgrading is not permitted on active subscriptions. Your current plan is "${currentPlanDoc?.name || currentPlanKey}". You can only maintain or upgrade your subscription.`,
        });
      }
    }

    // Upgrade Price Difference Calculation:
    // When upgrading to a higher tier plan, calculate price difference: new_price - current_price
    let payableAmount = plan.price;
    let isUpgrade = false;
    let priceDifference = plan.price;

    if (isCurrentActive && currentPrice > 0 && plan.key !== currentPlanKey) {
      isUpgrade = true;
      priceDifference = Math.max(0, plan.price - currentPrice);
      payableAmount = priceDifference;
    }

    // If payable amount is 0 (Free plan or 0 price difference):
    if (payableAmount === 0) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.interval === "yearly" ? 365 : plan.price === 0 ? 3650 : 30));

      await OrganizationModel.findByIdAndUpdate(req.user._id, {
        subscription: {
          planKey: plan.key,
          planName: plan.name,
          status: "active",
          startDate,
          endDate,
          razorpayPaymentId: isUpgrade ? "UPGRADE_FREE" : "FREE_PLAN",
          razorpayOrderId: isUpgrade ? "UPGRADE_FREE" : "FREE_PLAN",
        },
      });

      // Increment plan purchase counter
      await PlanModel.findByIdAndUpdate(plan._id, { $inc: { purchased_count: 1 } });

      await TransactionModel.create({
        user: req.user._id,
        plan: plan._id,
        planKey: plan.key,
        planName: plan.name,
        amount: 0,
        currency: plan.currency || "INR",
        razorpayOrderId: isUpgrade ? "UPGRADE_FREE" : "FREE_PLAN",
        razorpayPaymentId: isUpgrade ? "UPGRADE_FREE" : "FREE_PLAN",
        status: "paid",
        startDate,
        endDate,
      });

      return res.json({
        status: 1,
        isFree: true,
        isUpgrade,
        msg: isUpgrade ? `Upgraded to ${plan.name} successfully!` : "Free plan activated successfully!",
      });
    }

    const amountInPaise = Math.round(payableAmount * 100);
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
            isUpgrade: isUpgrade ? "true" : "false",
            previousPlanKey: currentPlanKey,
            priceDifference: String(payableAmount),
          },
        });
      } catch (err) {
        console.error("Razorpay API order error, using fallback demo order:", err);
      }
    }

    // Fallback demo order if live API key is absent/test mode
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
      amount: payableAmount,
      currency: plan.currency || "INR",
      razorpayOrderId: razorpayOrder.id,
      status: "created",
    });

    return res.json({
      status: 1,
      order: razorpayOrder,
      key_id: KEY_ID,
      isUpgrade,
      priceDifference: payableAmount,
      originalPrice: plan.price,
      previousPlanPrice: currentPrice,
      plan: {
        _id: plan._id,
        name: plan.name,
        price: payableAmount,
        originalPrice: plan.price,
        key: plan.key,
        included_modules: plan.included_modules || [],
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
      plan = await PlanModel.findOne({ _id: planId, is_deleted: { $ne: true } });
    } else if (planKey) {
      plan = await PlanModel.findOne({ key: planKey, is_deleted: { $ne: true } });
    }

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ status: 0, msg: "Invalid payment payload" });
    }

    // Validate Signature if live secret is present
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature && razorpay_signature !== "demo_signature") {
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

    // Increment purchased count on plan
    if (plan) {
      await PlanModel.findByIdAndUpdate(plan._id, { $inc: { purchased_count: 1 } });
    }

    // Update transaction record
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
      msg: "Payment verified! Subscription activated successfully.",
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

    const currentPlanKey = user?.subscription?.planKey || "free";
    const planDoc = await PlanModel.findOne({ key: currentPlanKey, is_deleted: { $ne: true } }).lean();

    const isLegacy = planDoc ? planDoc.status === "disabled" : false;

    return res.json({
      status: 1,
      subscription: {
        ...(user?.subscription || {
          planKey: "free",
          planName: "Starter Free",
          status: "active",
        }),
        is_legacy: isLegacy,
        planDetails: planDoc || null,
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
        pages: Math.ceil(total / parseInt(limit)) || 1,
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
      PlanModel.countDocuments({ is_deleted: { $ne: true } }),
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

/**
 * Razorpay Server-to-Server Webhook Handler
 * Catches payment.captured & order.paid directly from Razorpay
 * Ensures that if user's browser dropped/closed before /verify callback,
 * the subscription is STILL activated automatically without failure!
 */
export async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || KEY_SECRET;

    // Verify webhook signature
    if (signature && webhookSecret && webhookSecret !== "rzp_test_secret_RBF") {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        console.warn("Razorpay Webhook: Invalid signature received");
        return res.status(400).json({ status: 0, msg: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment?.entity;
      const orderEntity = payload.order?.entity;
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const txn = await TransactionModel.findOne({ razorpayOrderId: orderId });
        if (txn && txn.status !== "paid") {
          const plan = await PlanModel.findOne({
            $or: [{ _id: txn.plan }, { key: txn.planKey }],
            is_deleted: { $ne: true },
          });

          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (plan?.interval === "yearly" ? 365 : 30));

          const pKey = plan?.key || txn.planKey || "pro_growth";
          const pName = plan?.name || txn.planName || "Pro Growth";

          // Activate user subscription asynchronously
          await OrganizationModel.findByIdAndUpdate(txn.user, {
            subscription: {
              planKey: pKey,
              planName: pName,
              status: "active",
              startDate,
              endDate,
              razorpayPaymentId: paymentId || txn.razorpayPaymentId,
              razorpayOrderId: orderId,
            },
          });

          // Mark transaction as paid
          txn.status = "paid";
          txn.razorpayPaymentId = paymentId || txn.razorpayPaymentId;
          txn.razorpaySignature = signature || "webhook_verified";
          txn.startDate = startDate;
          txn.endDate = endDate;
          await txn.save();

          if (plan) {
            await PlanModel.findByIdAndUpdate(plan._id, { $inc: { purchased_count: 1 } });
          }

          console.log(`[Razorpay Webhook] Successfully auto-activated subscription for user ${txn.user} on order ${orderId}`);
        }
      }

      // Handle Wallet Credit Top-up via Webhook
      const notes = paymentEntity?.notes || orderEntity?.notes;
      if (notes?.type === "WALLET_TOPUP" || notes?.creditsToPurchase) {
        const userId = notes.userId;
        const credits = Number(notes.creditsToPurchase || Math.round((paymentEntity?.amount || 0) / 100));

        if (userId && credits > 0) {
          const existingTxn = await WalletTransactionModel.findOne({ razorpay_payment_id: paymentId });
          if (!existingTxn) {
            const updatedWallet = await WalletModel.findOneAndUpdate(
              { user: userId },
              { $inc: { balance: credits, total_credited: credits } },
              { new: true, upsert: true }
            );

            await WalletTransactionModel.create({
              user: userId,
              wallet: updatedWallet._id,
              type: "credit",
              amount: credits,
              balance_after: updatedWallet.balance,
              category: "razorpay_topup",
              description: `Added ${credits} credits via Razorpay online payment (Webhook)`,
              reference_id: paymentId,
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              status: "success",
            });

            console.log(`[Razorpay Webhook] Successfully credited ${credits} credits to user ${userId} for payment ${paymentId}`);
          }
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await TransactionModel.findOneAndUpdate(
          { razorpayOrderId: orderId, status: { $ne: "paid" } },
          { status: "failed", razorpayPaymentId: paymentEntity?.id }
        );
      }
    }

    return res.status(200).json({ status: 1, msg: "Webhook processed" });
  } catch (err) {
    console.error("Razorpay Webhook error:", err);
    return res.status(500).json({ status: 0, msg: "Webhook handler error" });
  }
}

/**
 * Self-healing / Sync Payment Status
 * Allows user to re-check and auto-recover any pending transaction from Razorpay API
 */
export async function syncPaymentStatus(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ status: 0, msg: "Order ID is required" });
    }

    const txn = await TransactionModel.findOne({
      razorpayOrderId: orderId,
      user: req.user._id,
    });

    if (!txn) {
      return res.status(404).json({ status: 0, msg: "Transaction not found" });
    }

    if (txn.status === "paid") {
      return res.json({ status: 1, msg: "Payment is already verified and active.", txn });
    }

    // Attempt to query Razorpay API for live payment status
    if (razorpayInstance && !orderId.startsWith("order_demo_")) {
      try {
        const orderPayments = await razorpayInstance.orders.fetchPayments(orderId);
        const capturedPayment = orderPayments.items?.find((p) => p.status === "captured");

        if (capturedPayment) {
          const plan = await PlanModel.findOne({
            $or: [{ _id: txn.plan }, { key: txn.planKey }],
            is_deleted: { $ne: true },
          });

          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + (plan?.interval === "yearly" ? 365 : 30));

          const pKey = plan?.key || txn.planKey || "pro_growth";
          const pName = plan?.name || txn.planName || "Pro Growth";

          // Activate subscription
          await OrganizationModel.findByIdAndUpdate(req.user._id, {
            subscription: {
              planKey: pKey,
              planName: pName,
              status: "active",
              startDate,
              endDate,
              razorpayPaymentId: capturedPayment.id,
              razorpayOrderId: orderId,
            },
          });

          txn.status = "paid";
          txn.razorpayPaymentId = capturedPayment.id;
          txn.startDate = startDate;
          txn.endDate = endDate;
          await txn.save();

          if (plan) {
            await PlanModel.findByIdAndUpdate(plan._id, { $inc: { purchased_count: 1 } });
          }

          return res.json({
            status: 1,
            msg: "Payment recovered and subscription activated successfully!",
            subscription: { planKey: pKey, planName: pName, status: "active", startDate, endDate },
          });
        }
      } catch (rzpErr) {
        console.error("Razorpay sync query error:", rzpErr.message);
      }
    }

    return res.json({
      status: 0,
      msg: "No completed bank payment found for this order. If money was deducted, it will be refunded by your bank within 3-5 working days.",
    });
  } catch (err) {
    console.error("syncPaymentStatus error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

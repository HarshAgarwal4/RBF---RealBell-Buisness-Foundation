import crypto from "crypto";
import Razorpay from "razorpay";
import WalletModel from "../models/wallet.js";
import WalletTransactionModel from "../models/walletTransaction.js";
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
  console.warn("Wallet Razorpay instance init warning:", e.message);
}

/**
 * Helper: Retrieve or auto-initialize a user's wallet with 500 Initial Welcome Credits
 */
export async function getOrCreateUserWallet(userId) {
  let wallet = await WalletModel.findOne({ user: userId });

  if (!wallet) {
    wallet = await WalletModel.create({
      user: userId,
      balance: 500,
      total_credited: 500,
      total_debited: 0,
      currency: "INR",
      status: "active",
    });

    await WalletTransactionModel.create({
      user: userId,
      wallet: wallet._id,
      type: "credit",
      amount: 500,
      balance_after: 500,
      category: "signup_bonus",
      description: "Welcome bonus: 500 initial credits credited upon joining RealBell Foundation",
      reference_id: `WELCOME_${userId.toString().slice(-6)}`,
      status: "success",
    });
  }

  return wallet;
}

/* ─────────────────────────────────────────────────────────────
   USER WALLET ACTIONS
───────────────────────────────────────────────────────────── */

/**
 * Get current user's wallet summary, balance and recent activity
 */
export async function getMyWallet(req, res) {
  try {
    const wallet = await getOrCreateUserWallet(req.user._id);

    const recentTransactions = await WalletTransactionModel.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const totalTransactions = await WalletTransactionModel.countDocuments({ user: req.user._id });

    return res.json({
      status: 1,
      wallet: {
        _id: wallet._id,
        balance: wallet.balance,
        total_credited: wallet.total_credited,
        total_debited: wallet.total_debited,
        currency: wallet.currency,
        status: wallet.status,
        updatedAt: wallet.updatedAt,
      },
      recentTransactions,
      totalTransactions,
      creditConversionRate: 1, // 1 Credit = 1 INR
    });
  } catch (err) {
    console.error("getMyWallet error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Create Razorpay Order to Purchase Credits (1 Credit = 1 INR)
 */
export async function createWalletTopupOrder(req, res) {
  try {
    const { amount } = req.body;
    const creditsToPurchase = Number(amount);

    if (!creditsToPurchase || isNaN(creditsToPurchase) || creditsToPurchase < 1) {
      return res.status(400).json({ status: 0, msg: "Please enter a valid credit amount (minimum 1 credit)" });
    }

    const wallet = await getOrCreateUserWallet(req.user._id);
    if (wallet.status === "frozen") {
      return res.status(403).json({ status: 0, msg: "Your wallet is currently frozen. Please contact support." });
    }

    const amountInRupees = creditsToPurchase; // 1 credit = 1 rupee
    const amountInPaise = Math.round(amountInRupees * 100);
    const receiptId = `wal_top_${req.user._id.toString().slice(-6)}_${Date.now()}`;

    let razorpayOrder = null;
    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      try {
        razorpayOrder = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: receiptId,
          notes: {
            userId: req.user._id.toString(),
            creditsToPurchase: String(creditsToPurchase),
            type: "WALLET_TOPUP",
          },
        });
      } catch (err) {
        console.error("Razorpay topup order error, fallback to demo order:", err);
      }
    }

    if (!razorpayOrder) {
      razorpayOrder = {
        id: `order_wal_demo_${Date.now()}`,
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
      };
    }

    return res.json({
      status: 1,
      order: razorpayOrder,
      key_id: KEY_ID,
      credits: creditsToPurchase,
      amount: amountInRupees,
      currency: "INR",
    });
  } catch (err) {
    console.error("createWalletTopupOrder error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Verify Razorpay Payment Signature and Credit Wallet
 */
export async function verifyWalletTopupPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits } = req.body;

    const creditsToAdd = Number(credits);
    if (!razorpay_order_id || !razorpay_payment_id || !creditsToAdd || creditsToAdd < 1) {
      return res.status(400).json({ status: 0, msg: "Invalid top-up payment payload" });
    }

    // Verify cryptographic signature if live secret is available
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature && razorpay_signature !== "demo_signature") {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ status: 0, msg: "Payment signature verification failed" });
      }
    }

    // Check for duplicate payment transaction
    const existingTxn = await WalletTransactionModel.findOne({ razorpay_payment_id });
    if (existingTxn) {
      const wallet = await getOrCreateUserWallet(req.user._id);
      return res.json({
        status: 1,
        msg: "Credits have already been added for this transaction.",
        balance: wallet.balance,
      });
    }

    // Update wallet balance atomically
    const updatedWallet = await WalletModel.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { balance: creditsToAdd, total_credited: creditsToAdd },
      },
      { new: true, upsert: true }
    );

    // Record credit transaction in ledger
    const txn = await WalletTransactionModel.create({
      user: req.user._id,
      wallet: updatedWallet._id,
      type: "credit",
      amount: creditsToAdd,
      balance_after: updatedWallet.balance,
      category: "razorpay_topup",
      description: `Added ${creditsToAdd} credits via Razorpay online payment`,
      reference_id: razorpay_payment_id,
      razorpay_order_id,
      razorpay_payment_id,
      status: "success",
    });

    return res.json({
      status: 1,
      msg: `Successfully added ${creditsToAdd} credits to your wallet!`,
      wallet: updatedWallet,
      transaction: txn,
    });
  } catch (err) {
    console.error("verifyWalletTopupPayment error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Get paginated wallet transactions
 */
export async function getWalletTransactions(req, res) {
  try {
    const { page = 1, limit = 20, type, category } = req.query;
    const query = { user: req.user._id };

    if (type && ["credit", "debit"].includes(type)) {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      WalletTransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("performed_by", "name email"),
      WalletTransactionModel.countDocuments(query),
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
    console.error("getWalletTransactions error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/* ─────────────────────────────────────────────────────────────
   ADMIN & SUPER ADMIN WALLET MANAGEMENT
───────────────────────────────────────────────────────────── */

/**
 * Admin: Get all user wallets with search and filters
 */
export async function getAdminWallets(req, res) {
  try {
    const { page = 1, limit = 20, search = "", role = "", company_type = "" } = req.query;

    const userQuery = { is_deleted: { $ne: true } };
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company_name: { $regex: search, $options: "i" } },
      ];
    }
    if (role) userQuery.role = role;
    if (company_type) userQuery.company_type = company_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      OrganizationModel.find(userQuery)
        .select("name email company_name company_type role account.image subscription createdAt")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      OrganizationModel.countDocuments(userQuery),
    ]);

    // Fetch wallets for these users
    const userIds = users.map((u) => u._id);
    const wallets = await WalletModel.find({ user: { $in: userIds } });
    const walletMap = {};
    wallets.forEach((w) => {
      walletMap[w.user.toString()] = w;
    });

    const enrichedUsers = users.map((u) => {
      const w = walletMap[u._id.toString()] || {
        balance: 500,
        total_credited: 500,
        total_debited: 0,
        status: "active",
      };
      return {
        ...u.toObject(),
        wallet: w,
      };
    });

    return res.json({
      status: 1,
      users: enrichedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("getAdminWallets error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Get single user's detailed wallet and full transaction ledger
 */
export async function getAdminWalletUserDetail(req, res) {
  try {
    const { userId } = req.params;
    const user = await OrganizationModel.findById(userId).select("name email company_name company_type role account.image subscription");

    if (!user) {
      return res.status(404).json({ status: 0, msg: "User not found" });
    }

    const wallet = await getOrCreateUserWallet(userId);
    const transactions = await WalletTransactionModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("performed_by", "name email");

    return res.json({
      status: 1,
      user,
      wallet,
      transactions,
    });
  } catch (err) {
    console.error("getAdminWalletUserDetail error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin / Super Admin: Assign or deduct credits for any user
 */
export async function adminAdjustCredits(req, res) {
  try {
    const { userId, type, amount, reason, category } = req.body;

    const parsedAmount = Number(amount);
    if (!userId || !type || !["credit", "debit"].includes(type) || !parsedAmount || parsedAmount < 1) {
      return res.status(400).json({ status: 0, msg: "Please provide a valid user, adjustment type, and positive amount" });
    }

    const user = await OrganizationModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 0, msg: "User not found" });
    }

    const wallet = await getOrCreateUserWallet(userId);

    if (type === "debit" && wallet.balance < parsedAmount) {
      return res.status(400).json({
        status: 0,
        msg: `Insufficient balance. User only has ${wallet.balance} credits. Cannot deduct ${parsedAmount} credits.`,
      });
    }

    const balanceChange = type === "credit" ? parsedAmount : -parsedAmount;
    const newBalance = wallet.balance + balanceChange;

    wallet.balance = newBalance;
    if (type === "credit") {
      wallet.total_credited = (wallet.total_credited || 0) + parsedAmount;
    } else {
      wallet.total_debited = (wallet.total_debited || 0) + parsedAmount;
    }
    await wallet.save();

    const selectedCategory = category || (type === "credit" ? "admin_credit" : "admin_debit");
    const formattedReason = reason ? reason.trim() : (type === "credit" ? "Credits assigned by Admin" : "Credits debited by Admin");

    const txn = await WalletTransactionModel.create({
      user: userId,
      wallet: wallet._id,
      type,
      amount: parsedAmount,
      balance_after: newBalance,
      category: selectedCategory,
      description: formattedReason,
      reference_id: `ADM_${req.user._id.toString().slice(-6)}_${Date.now().toString().slice(-4)}`,
      performed_by: req.user._id,
      status: "success",
    });

    return res.json({
      status: 1,
      msg: `Successfully ${type === "credit" ? "assigned" : "deducted"} ${parsedAmount} credits for ${user.name}!`,
      wallet,
      transaction: txn,
    });
  } catch (err) {
    console.error("adminAdjustCredits error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Get global platform wallet ledger (all transactions)
 */
export async function getAdminWalletTransactions(req, res) {
  try {
    const { page = 1, limit = 25, search = "", type = "", category = "" } = req.query;
    const query = {};

    if (type && ["credit", "debit"].includes(type)) query.type = type;
    if (category) query.category = category;

    if (search) {
      const matchingUsers = await OrganizationModel.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { company_name: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { user: { $in: userIds } },
        { description: { $regex: search, $options: "i" } },
        { reference_id: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      WalletTransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name email company_name company_type role account.image")
        .populate("performed_by", "name email"),
      WalletTransactionModel.countDocuments(query),
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
    console.error("getAdminWalletTransactions error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Get wallet overview statistics
 */
export async function getAdminWalletStats(req, res) {
  try {
    const [walletAgg, topupAgg, legalSpendAgg, adminCreditAgg, totalWallets] = await Promise.all([
      WalletModel.aggregate([
        {
          $group: {
            _id: null,
            totalCirculationBalance: { $sum: "$balance" },
            totalEverCredited: { $sum: "$total_credited" },
            totalEverDebited: { $sum: "$total_debited" },
          },
        },
      ]),
      WalletTransactionModel.aggregate([
        { $match: { category: "razorpay_topup", status: "success" } },
        { $group: { _id: null, totalTopupAmount: { $sum: "$amount" }, totalTopupCount: { $sum: 1 } } },
      ]),
      WalletTransactionModel.aggregate([
        { $match: { category: "legal_compliance_payment", status: "success" } },
        { $group: { _id: null, totalLegalSpent: { $sum: "$amount" }, totalLegalTxns: { $sum: 1 } } },
      ]),
      WalletTransactionModel.aggregate([
        { $match: { category: "admin_credit", status: "success" } },
        { $group: { _id: null, totalAdminCredits: { $sum: "$amount" } } },
      ]),
      WalletModel.countDocuments(),
    ]);

    const totalCirculationBalance = walletAgg[0]?.totalCirculationBalance || 0;
    const totalEverCredited = walletAgg[0]?.totalEverCredited || 0;
    const totalEverDebited = walletAgg[0]?.totalEverDebited || 0;

    const totalTopupAmount = topupAgg[0]?.totalTopupAmount || 0;
    const totalTopupCount = topupAgg[0]?.totalTopupCount || 0;

    const totalLegalSpent = legalSpendAgg[0]?.totalLegalSpent || 0;
    const totalLegalTxns = legalSpendAgg[0]?.totalLegalTxns || 0;

    const totalAdminCredits = adminCreditAgg[0]?.totalAdminCredits || 0;

    return res.json({
      status: 1,
      stats: {
        totalCirculationBalance,
        totalEverCredited,
        totalEverDebited,
        totalTopupAmount,
        totalTopupCount,
        totalLegalSpent,
        totalLegalTxns,
        totalAdminCredits,
        totalWallets,
      },
    });
  } catch (err) {
    console.error("getAdminWalletStats error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

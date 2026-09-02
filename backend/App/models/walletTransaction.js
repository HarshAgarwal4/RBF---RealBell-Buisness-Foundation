import mongoose from "mongoose";

const WalletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    balance_after: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "signup_bonus",
        "referral_reward",
        "referral_bonus",
        "razorpay_topup",
        "legal_compliance_payment",
        "admin_credit",
        "admin_debit",
        "refund",
      ],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    reference_id: {
      type: String,
      default: "",
    },

    legal_compliance_application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LegalComplianceApplication",
      default: null,
    },

    razorpay_order_id: {
      type: String,
      default: "",
    },

    razorpay_payment_id: {
      type: String,
      default: "",
    },

    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

const WalletTransactionModel = mongoose.model("WalletTransaction", WalletTransactionSchema);

export default WalletTransactionModel;

import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    planKey: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);
export default TransactionModel;

import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      default: 500,
      min: 0,
    },

    total_credited: {
      type: Number,
      default: 500,
    },

    total_debited: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const WalletModel = mongoose.model("Wallet", WalletSchema);

export default WalletModel;

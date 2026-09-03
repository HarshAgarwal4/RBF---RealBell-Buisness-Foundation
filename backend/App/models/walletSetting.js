import mongoose from "mongoose";

const WalletSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "wallet_config",
    },
    welcomeCredits: {
      type: Number,
      default: 500,
      min: 0,
    },
    referralCredits: {
      type: Number,
      default: 250,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const WalletSettingModel = mongoose.model("WalletSetting", WalletSettingSchema);

export default WalletSettingModel;

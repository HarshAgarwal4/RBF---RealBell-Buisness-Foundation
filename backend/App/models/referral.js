import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true, // One referred user can only have a single referral relationship
      index: true,
    },

    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    referrerReward: {
      type: Number,
      default: 250,
    },

    referredReward: {
      type: Number,
      default: 250,
    },

    status: {
      type: String,
      enum: ["completed", "pending", "rejected"],
      default: "completed",
    },

    rewardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ReferralModel = mongoose.model("Referral", ReferralSchema);

export default ReferralModel;

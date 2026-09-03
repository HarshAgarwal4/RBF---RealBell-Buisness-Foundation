import mongoose from "mongoose";

const IncubationSettingsSchema = new mongoose.Schema(
  {
    physicalMonthlyFee: {
      type: Number,
      default: 5000,
    },
    physicalTrialDays: {
      type: Number,
      default: 14,
    },
    virtualMonthlyFee: {
      type: Number,
      default: 2500,
    },
    virtualTrialDays: {
      type: Number,
      default: 30,
    },
    defaultTrialDays: {
      type: Number,
      default: 14,
    },
    centerName: {
      type: String,
      default: "RealBell Vedic Council of Education Research & Training (Chandlai Hub)",
    },
    currency: {
      type: String,
      default: "INR",
    },
  },
  { timestamps: true }
);

const IncubationSettingsModel = mongoose.model("IncubationSettings", IncubationSettingsSchema);
export default IncubationSettingsModel;

import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "INR" },
    interval: { type: String, enum: ["monthly", "yearly", "one_time"], default: "monthly" },
    features: [{ type: String }],
    badge: { type: String, default: "" },
    accentColor: { type: String, default: "#6366f1" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PlanModel = mongoose.model("Plan", planSchema);
export default PlanModel;

import mongoose from "mongoose";

const IncludedModuleSchema = new mongoose.Schema(
  {
    module_key: { type: String, required: true, trim: true },
    module_name: { type: String, required: true, trim: true },
    access_line: { type: String, required: true, trim: true },
    is_enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    interval: { type: String, enum: ["monthly", "yearly", "one_time"], default: "monthly" },
    tier_rank: { type: Number, default: 1 }, // 1 (Free), 2 (Starter), 3 (Growth), 4 (Enterprise), etc.
    badge: { type: String, default: "" },
    accentColor: { type: String, default: "#6366f1" },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    isActive: { type: Boolean, default: true }, // backward compatibility
    is_deleted: { type: Boolean, default: false },
    purchased_count: { type: Number, default: 0 },
    included_modules: { type: [IncludedModuleSchema], default: [] },
    custom_features: [{ type: String }],
    features: [{ type: String }], // backward compatibility display array
  },
  { timestamps: true }
);

planSchema.index({ status: 1, is_deleted: 1, tier_rank: 1 });

const PlanModel = mongoose.model("Plan", planSchema);
export default PlanModel;

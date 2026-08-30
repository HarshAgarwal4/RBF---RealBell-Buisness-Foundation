import mongoose from "mongoose";

const BoosterKitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "cloud_devops",
        "finance_payments",
        "sales_marketing",
        "legal_compliance",
        "operations_hr",
        "tools_software",
        "general",
      ],
      default: "tools_software",
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    perk_value: {
      type: String,
      default: "",
      trim: true,
    },
    redemption_type: {
      type: String,
      enum: ["coupon_code", "external_link", "manual_review", "instant_unlock"],
      default: "manual_review",
    },
    redemption_code: {
      type: String,
      default: "",
      trim: true,
    },
    redemption_url: {
      type: String,
      default: "",
      trim: true,
    },
    eligibility_criteria: {
      type: String,
      default: "Open to all verified RealBell Business Foundation members",
      trim: true,
    },
    logo_url: {
      type: String,
      default: "",
    },
    attachments: [
      {
        url: { type: String, required: true },
        file_name: { type: String, default: "Document" },
        file_type: { type: String, default: "document" },
        file_size: { type: Number, default: 0 },
        public_id: { type: String },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    claim_count: {
      type: Number,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { timestamps: true }
);

BoosterKitSchema.index({ status: 1, is_deleted: 1, category: 1 });

const BoosterKitModel = mongoose.model("BoosterKit", BoosterKitSchema);
export default BoosterKitModel;

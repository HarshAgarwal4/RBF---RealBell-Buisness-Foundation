import mongoose from "mongoose";

const BoosterApplicationSchema = new mongoose.Schema(
  {
    booster_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BoosterKit",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    company_name: {
      type: String,
      default: "",
      trim: true,
    },
    applicant_name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    website: {
      type: String,
      default: "",
      trim: true,
    },
    startup_stage: {
      type: String,
      default: "Early Stage",
      trim: true,
    },
    use_case_notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "redeemed", "rejected"],
      default: "pending",
      index: true,
    },
    assigned_code: {
      type: String,
      default: "",
      trim: true,
    },
    admin_notes: {
      type: String,
      default: "",
      trim: true,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    reviewed_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

BoosterApplicationSchema.index({ booster_id: 1, user_id: 1 });

const BoosterApplicationModel = mongoose.model("BoosterApplication", BoosterApplicationSchema);
export default BoosterApplicationModel;

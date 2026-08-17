import mongoose from "mongoose";

/* ─── Dynamic Form Field Schema ─── */
const FormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true }, // field key e.g. "applicant_name"
    label: { type: String, required: true, trim: true }, // user display label
    type: {
      type: String,
      enum: [
        "text",
        "number",
        "email",
        "phone",
        "date",
        "textarea",
        "select",
        "radio",
        "checkbox",
      ],
      default: "text",
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    options: { type: [String], default: [] }, // for select, radio, checkbox
    validation: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      pattern: { type: String, default: "" },
      message: { type: String, default: "" },
    },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Dynamic Required Document Schema ─── */
const RequiredDocumentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true }, // e.g. "PAN Card", "Aadhaar Card"
    description: { type: String, default: "", trim: true },
    required: { type: Boolean, default: true },
    allowed_types: { type: [String], default: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
    max_size_mb: { type: Number, default: 10 },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Legal Compliance Service Schema ─── */
const LegalComplianceServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    short_description: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    fee: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR", uppercase: true },
    is_payment_required: { type: Boolean, default: false },
    processing_time: { type: String, default: "3-5 Business Days", trim: true },
    icon: { type: String, default: "Scale" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    form_fields: { type: [FormFieldSchema], default: [] },
    required_documents: { type: [RequiredDocumentSchema], default: [] },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LegalComplianceServiceModel = mongoose.model(
  "LegalComplianceService",
  LegalComplianceServiceSchema
);

export default LegalComplianceServiceModel;

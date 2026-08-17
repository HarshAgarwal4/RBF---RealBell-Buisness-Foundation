import mongoose from "mongoose";

/* ─── Form Field Response Schema ─── */
const FieldResponseSchema = new mongoose.Schema(
  {
    field_id: { type: String, required: true },
    field_name: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { _id: false }
);

/* ─── User Uploaded Document Schema ─── */
const UploadedDocumentSchema = new mongoose.Schema(
  {
    document_id: { type: String, required: true },
    document_name: { type: String, required: true },
    file_url: { type: String, required: true },
    public_id: { type: String, default: "" },
    original_name: { type: String, required: true },
    mime_type: { type: String, default: "" },
    size_in_bytes: { type: Number, default: 0 },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ─── Super Admin Issued Final Document / Certificate Schema ─── */
const FinalDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g. "Trademark Certificate", "GST Certificate"
    file_url: { type: String, required: true },
    public_id: { type: String, default: "" },
    original_name: { type: String, required: true },
    mime_type: { type: String, default: "" },
    size_in_bytes: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { _id: false }
);

/* ─── Status History / Timeline Entry Schema ─── */
const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    remark: { type: String, default: "" },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    updated_by_name: { type: String, default: "System" },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ─── Payment Details Schema ─── */
const PaymentDetailsSchema = new mongoose.Schema(
  {
    required: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "waived", "free"],
      default: "free",
    },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    razorpay_order_id: { type: String, default: "" },
    razorpay_payment_id: { type: String, default: "" },
    razorpay_signature: { type: String, default: "" },
    paid_at: { type: Date, default: null },
  },
  { _id: false }
);

/* ─── Legal Compliance Application Schema ─── */
const LegalComplianceApplicationSchema = new mongoose.Schema(
  {
    application_number: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LegalComplianceService",
      required: true,
    },
    // Snapshot of service at submission time so historical data remains immutable
    service_snapshot: {
      title: { type: String, required: true },
      category: { type: String, default: "" },
      fee: { type: Number, default: 0 },
      is_payment_required: { type: Boolean, default: false },
      processing_time: { type: String, default: "" },
      form_fields: { type: Array, default: [] },
      required_documents: { type: Array, default: [] },
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    form_responses: { type: [FieldResponseSchema], default: [] },
    documents: { type: [UploadedDocumentSchema], default: [] },
    final_documents: { type: [FinalDocumentSchema], default: [] },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Payment Pending",
        "Payment Completed",
        "Under Review",
        "Documents Required",
        "In Progress",
        "Completed",
        "Rejected",
        "Cancelled",
      ],
      default: "Submitted",
    },
    admin_remarks: { type: String, default: "" },
    status_history: { type: [StatusHistorySchema], default: [] },
    payment: { type: PaymentDetailsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Indexes
LegalComplianceApplicationSchema.index({ applicant: 1, createdAt: -1 });
LegalComplianceApplicationSchema.index({ service: 1, createdAt: -1 });
LegalComplianceApplicationSchema.index({ status: 1 });

const LegalComplianceApplicationModel = mongoose.model(
  "LegalComplianceApplication",
  LegalComplianceApplicationSchema
);

export default LegalComplianceApplicationModel;

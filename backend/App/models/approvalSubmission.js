import mongoose from "mongoose";

const DocumentItemSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    fieldLabel: { type: String, default: "" },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    publicId: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApprovalAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "USER_REGISTERED", "FORM_DRAFT_SAVED", "FORM_SUBMITTED", "ADMIN_REVIEWED", "CHANGES_REQUESTED", "RESUBMITTED", "APPROVED", "REJECTED"
    previousStatus: { type: String, default: "" },
    newStatus: { type: String, default: "" },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    performedByName: { type: String, default: "" },
    comment: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApprovalSubmissionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    organizationType: {
      type: String,
      required: true,
      trim: true,
    },
    roleKey: {
      type: String,
      default: "default",
      trim: true,
    },
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalForm",
      default: null,
    },
    formVersion: {
      type: Number,
      default: 1,
    },
    // Immutable snapshot of form structure & fields at time of submission
    formSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Dynamic responses: key-value map of submitted values
    responses: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    documents: [DocumentItemSchema],
    status: {
      type: String,
      enum: [
        "Pending Form",
        "Form Submitted",
        "Under Review",
        "Changes Requested",
        "Approved",
        "Rejected",
      ],
      default: "Pending Form",
      index: true,
    },
    adminFeedback: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    auditLog: [ApprovalAuditLogSchema],
  },
  {
    timestamps: true,
  }
);

ApprovalSubmissionSchema.index({ status: 1, createdAt: -1 });

const ApprovalSubmissionModel = mongoose.model(
  "ApprovalSubmission",
  ApprovalSubmissionSchema
);

export default ApprovalSubmissionModel;

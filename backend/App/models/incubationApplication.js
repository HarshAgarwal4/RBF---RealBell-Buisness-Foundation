import mongoose from "mongoose";

const TeamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    isLead: { type: Boolean, default: false },
  },
  { _id: false }
);

const IncubationDocumentSchema = new mongoose.Schema(
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

const FeedbackMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    senderName: { type: String, default: "" },
    senderRole: { type: String, default: "admin" }, // "admin" | "founder"
    message: { type: String, required: true },
    attachments: [{ fileName: String, fileUrl: String }],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const IncubationApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    incubationType: {
      type: String,
      enum: ["physical", "virtual"],
      required: true,
      default: "physical",
      index: true,
    },
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncubationForm",
      default: null,
    },
    businessDetails: {
      companyName: { type: String, default: "", trim: true },
      dippNumber: { type: String, default: "", trim: true },
      cinNumber: { type: String, default: "", trim: true },
      sector: { type: String, default: "", trim: true },
      stage: { type: String, default: "Early Stage", trim: true },
      website: { type: String, default: "", trim: true },
      pitchSummary: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      targetMarket: { type: String, default: "" },
      annualRevenue: { type: String, default: "" },
    },
    teamMembers: {
      type: [TeamMemberSchema],
      validate: [
        function (val) {
          // If status is not Draft, require at least 1 team member
          if (this.status === "Draft") return true;
          return Array.isArray(val) && val.length > 0;
        },
        "At least one team member is required for incubation application",
      ],
      default: [],
    },
    customResponses: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    documents: [IncubationDocumentSchema],
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Under Review",
        "Shortlisted",
        "Changes Requested",
        "Accepted",
        "Rejected",
      ],
      default: "Submitted",
      index: true,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    feedbackMessages: [FeedbackMessageSchema],
    // Subscription & Billing Details
    subscriptionStatus: {
      type: String,
      enum: ["none", "trial", "active", "overdue", "cancelled"],
      default: "none",
      index: true,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    trialEndsAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    monthlyFee: {
      type: Number,
      default: 0,
    },
    lastPaidDate: {
      type: Date,
      default: null,
    },
    cohortName: {
      type: String,
      default: "Cohort 2026-Q1",
    },
    centerAllocated: {
      type: String,
      default: "RealBell Vedic Council (Chandlai Hub, Jaipur)",
    },
    deskAllocated: {
      type: String,
      default: "Desk #C-12",
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
    assignedMentors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
  },
  { timestamps: true }
);

const IncubationApplicationModel = mongoose.model("IncubationApplication", IncubationApplicationSchema);
export default IncubationApplicationModel;

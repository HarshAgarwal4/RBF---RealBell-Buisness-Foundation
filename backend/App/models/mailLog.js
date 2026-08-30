import mongoose from "mongoose";

const MailLogSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    target_type: {
      type: String,
      enum: [
        "custom_emails",
        "specific_users",
        "team",
        "team_selected_users",
        "normal_users_selected",
        "all_users",
        "organization_types",
        "super_admins",
      ],
      required: true,
      default: "custom_emails",
    },
    target_team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    target_organization_types: {
      type: [String],
      default: [],
    },
    recipient_emails: {
      type: [String],
      required: true,
      default: [],
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    sent_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "partially_failed", "failed"],
      default: "sent",
    },
    success_count: {
      type: Number,
      default: 0,
    },
    fail_count: {
      type: Number,
      default: 0,
    },
    error_details: {
      type: [String],
      default: [],
    },
    attachments: [
      {
        url: { type: String, required: true },
        file_name: { type: String, default: "" },
        file_type: { type: String, default: "" },
        file_size: { type: Number, default: 0 },
        public_id: { type: String, default: "" },
      },
    ],
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

MailLogSchema.index({ sent_by: 1, createdAt: -1 });
MailLogSchema.index({ target_type: 1 });

const MailLogModel =
  mongoose.models.MailLog || mongoose.model("MailLog", MailLogSchema);

export default MailLogModel;

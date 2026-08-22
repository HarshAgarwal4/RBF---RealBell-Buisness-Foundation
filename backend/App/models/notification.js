import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "announcement"],
      default: "info",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    action_url: {
      type: String,
      default: null,
      trim: true,
    },
    target_type: {
      type: String,
      enum: [
        "all",
        "specific_users",
        "team",
        "team_selected_users",
        "normal_users_selected",
        "organization_types",
      ],
      required: true,
      default: "specific_users",
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
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    read_by: [
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
    sent_as_email: {
      type: Boolean,
      default: false,
    },
    email_delivery_status: {
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipients: 1, createdAt: -1 });
NotificationSchema.index({ sent_by: 1 });
NotificationSchema.index({ target_type: 1 });

const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default NotificationModel;

import mongoose from "mongoose";

const TicketAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      default: "",
    },
    original_name: {
      type: String,
      default: "",
    },
    mime_type: {
      type: String,
      default: "",
    },
    size_in_bytes: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const TicketAssignmentHistorySchema = new mongoose.Schema(
  {
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    assigned_team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    action: {
      type: String,
      enum: ["assigned", "forwarded", "reassigned", "unassigned", "status_changed"],
      default: "assigned",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TicketInternalNoteSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TicketSchema = new mongoose.Schema(
  {
    ticket_number: {
      type: String,
      unique: true,
      index: true,
      default: () => `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    issue_type: {
      type: String,
      enum: [
        "Technical Issue",
        "Account Issue",
        "Payment Issue",
        "Bug Report",
        "Feature Request",
        "Other",
      ],
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    assigned_team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    assignment_history: {
      type: [TicketAssignmentHistorySchema],
      default: [],
    },
    internal_notes: {
      type: [TicketInternalNoteSchema],
      default: [],
    },
    attachments: {
      type: [TicketAttachmentSchema],
      default: [],
    },
    source: {
      type: String,
      default: "web",
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const TicketModel = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);

export default TicketModel;

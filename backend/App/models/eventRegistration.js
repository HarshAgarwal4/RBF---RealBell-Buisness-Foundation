import mongoose from "mongoose";

const CustomResponseSchema = new mongoose.Schema(
  {
    field_id: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { _id: false }
);

const EventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    ticket_number: {
      type: String,
      unique: true,
      index: true,
      default: () => `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    },
    registration_type: {
      type: String,
      enum: ["free", "paid_ticket", "paid_token"],
      default: "free",
    },
    amount_paid: {
      type: Number,
      default: 0,
    },
    tokens_used: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["registered", "attended", "cancelled"],
      default: "registered",
    },
    custom_responses: {
      type: [CustomResponseSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicate active registrations for the same event by the same user
EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

const EventRegistrationModel =
  mongoose.models.EventRegistration ||
  mongoose.model("EventRegistration", EventRegistrationSchema);

export default EventRegistrationModel;

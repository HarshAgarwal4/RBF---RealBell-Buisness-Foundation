import mongoose from "mongoose";

const IncubationBookingSchema = new mongoose.Schema(
  {
    bookingId: {
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
    infrastructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncubationInfrastructure",
      required: true,
      index: true,
    },
    facilityName: {
      type: String,
      default: "",
    },
    facilityType: {
      type: String,
      default: "meeting_room",
    },
    date: {
      type: String, // e.g. "2026-09-05"
      required: true,
      index: true,
    },
    monthYear: {
      type: String, // e.g. "2026-09" for monthly quota limit checks
      index: true,
    },
    startTime: {
      type: String, // e.g. "09:00 AM"
      required: true,
    },
    endTime: {
      type: String, // e.g. "11:00 AM"
      required: true,
    },
    durationHours: {
      type: Number,
      default: 2,
    },
    purpose: {
      type: String,
      required: true,
    },
    attendeesCount: {
      type: Number,
      default: 1,
    },
    isFreeTrial: {
      type: Boolean,
      default: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["free_trial", "paid", "pending", "waived"],
      default: "free_trial",
    },
    status: {
      type: String,
      enum: ["Confirmed", "Completed", "Cancelled"],
      default: "Confirmed",
      index: true,
    },
  },
  { timestamps: true }
);

const IncubationBookingModel = mongoose.model("IncubationBooking", IncubationBookingSchema);
export default IncubationBookingModel;

import mongoose from "mongoose";

const IncubationMentorBookingSchema = new mongoose.Schema(
  {
    bookingId: {
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
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IncubationMentor",
      required: true,
    },
    mentorName: {
      type: String,
      default: "",
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    timeSlot: {
      type: String, // e.g. "04:00 PM - 04:45 PM"
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    meetingLink: {
      type: String,
      default: "https://meet.google.com/rbf-incubation-mentor",
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

const IncubationMentorBookingModel = mongoose.model("IncubationMentorBooking", IncubationMentorBookingSchema);
export default IncubationMentorBookingModel;

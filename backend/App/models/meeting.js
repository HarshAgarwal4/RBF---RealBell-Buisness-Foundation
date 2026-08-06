import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    agenda: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: Number,
      enum: [15, 30, 45, 60],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    mode: {
      type: String,
      enum: ["Online", "In-person"],
      required: true,
    },

    meetingTool: {
      type: String,
      enum: ["In-built", "External"],
      default: "In-built",
    },

    meetingUrl: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const MeetingModel = mongoose.model("Meeting", MeetingSchema);

export default MeetingModel;
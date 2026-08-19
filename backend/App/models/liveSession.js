import mongoose from "mongoose";

const LiveSessionSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "LIVE", "PAUSED", "ENDED", "CANCELLED"],
      default: "SCHEDULED",
      index: true,
    },

    sessionType: {
      type: String,
      enum: ["one-to-one", "group"],
      default: "one-to-one",
    },

    scheduledAt: {
      type: Date,
      default: Date.now,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    pausedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    maxQueueSize: {
      type: Number,
      default: 20,
      min: 1,
      max: 500,
    },

    maxParticipants: {
      type: Number,
      default: 50,
    },

    maxConsultationDuration: {
      type: Number, // in minutes
      default: 15,
    },

    averageConsultationDuration: {
      type: Number, // in minutes
      default: 10,
    },

    autoNextParticipant: {
      type: Boolean,
      default: false,
    },

    queuePaused: {
      type: Boolean,
      default: false,
    },

    currentParticipantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    currentQueueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QueueEntry",
      default: null,
    },

    videoProvider: {
      type: String,
      enum: ["in-built-webrtc", "jitsi", "livekit", "agora", "external"],
      default: "in-built-webrtc",
    },

    videoRoomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isPasswordProtected: {
      type: Boolean,
      default: false,
    },

    passcode: {
      type: String,
      trim: true,
      default: "",
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    stats: {
      totalJoined: { type: Number, default: 0 },
      totalAdmitted: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      totalRejected: { type: Number, default: 0 },
      totalCancelled: { type: Number, default: 0 },
      totalWaitTimeSec: { type: Number, default: 0 },
      totalConsultationTimeSec: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
LiveSessionSchema.index({ status: 1, createdAt: -1 });
LiveSessionSchema.index({ hostId: 1, status: 1 });

const LiveSessionModel = mongoose.model("LiveSession", LiveSessionSchema);

export default LiveSessionModel;

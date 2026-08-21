import mongoose from "mongoose";

const QueueMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["waiting", "in_consultation", "completed", "left"],
      default: "waiting",
    },
    priority: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const LiveSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    maxQueueSize: {
      type: Number,
      default: 20,
      min: 1,
    },
    avgConsultationMins: {
      type: Number,
      default: 10,
      min: 1,
    },
    maxDurationLimitMins: {
      type: Number,
      default: 15,
      min: 1,
    },
    sessionFormat: {
      type: String,
      enum: ["1-to-1 Queue", "Group Call"],
      default: "1-to-1 Queue",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    visibleToConnections: {
      type: Boolean,
      default: false,
    },
    requirePasscode: {
      type: Boolean,
      default: false,
    },
    passcode: {
      type: String,
      default: "",
      trim: true,
    },
    autoAdmit: {
      type: Boolean,
      default: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["live", "scheduled", "ended"],
      default: "live",
    },
    activeConsultation: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null,
      },
      startedAt: {
        type: Date,
        default: null,
      },
    },
    stats: {
      completedCount: {
        type: Number,
        default: 0,
      },
      totalAdmittedCount: {
        type: Number,
        default: 0,
      },
    },
    queue: {
      type: [QueueMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

LiveSessionSchema.index({ status: 1, visibility: 1, createdAt: -1 });

const LiveSessionModel = mongoose.model("LiveSession", LiveSessionSchema);
export default LiveSessionModel;

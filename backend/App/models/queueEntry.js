import mongoose from "mongoose";

const QueueEntrySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveSession",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    position: {
      type: Number,
      default: 0,
      index: true,
    },

    priority: {
      type: Number,
      default: 0, // Higher integer = higher priority
      index: true,
    },

    status: {
      type: String,
      enum: [
        "WAITING",
        "ADMITTED",
        "IN_CALL",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
        "EXPIRED",
      ],
      default: "WAITING",
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    admittedAt: {
      type: Date,
      default: null,
    },

    consultationStartedAt: {
      type: Date,
      default: null,
    },

    consultationEndedAt: {
      type: Date,
      default: null,
    },

    cancellationTime: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    estimatedWaitTime: {
      type: Number, // In minutes
      default: 0,
    },

    disconnectGraceExpiresAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal queries and ranking
QueueEntrySchema.index({ sessionId: 1, status: 1, priority: -1, joinedAt: 1 });
QueueEntrySchema.index({ sessionId: 1, userId: 1, status: 1 });
QueueEntrySchema.index({ sessionId: 1, position: 1 });

const QueueEntryModel = mongoose.model("QueueEntry", QueueEntrySchema);

export default QueueEntryModel;

import mongoose from "mongoose";

const aiSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Strategy Session",
      trim: true,
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AiSessionModel = mongoose.model("AiSession", aiSessionSchema);
export default AiSessionModel;

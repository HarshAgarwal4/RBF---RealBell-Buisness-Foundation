import mongoose from "mongoose";

const ChatThreadSchema = new mongoose.Schema(
  {
    threadKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Organization",
        },
      ],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: "A chat thread must contain exactly two participants.",
      },
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ChatThreadSchema.index({ participants: 1 });

const ChatThreadModel = mongoose.model("ChatThread", ChatThreadSchema);

export default ChatThreadModel;


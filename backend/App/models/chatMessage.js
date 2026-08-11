import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    name: { type: String, default: "" },
    size: { type: Number, default: 0 },
    resourceType: { type: String, default: "auto" },
  },
  { _id: false }
);

const VoiceSchema = new mongoose.Schema(
  {
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const ChatMessageSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    threadKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["text", "file", "voice"],
      default: "text",
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    attachment: {
      type: AttachmentSchema,
      default: null,
    },
    voice: {
      type: VoiceSchema,
      default: null,
    },
    replyTo: {
      type: String,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ChatMessageSchema.index({ threadKey: 1, createdAt: -1 });
ChatMessageSchema.index({ recipientId: 1, deliveredAt: 1, readAt: 1 });

const ChatMessageModel = mongoose.model("ChatMessage", ChatMessageSchema);

export default ChatMessageModel;


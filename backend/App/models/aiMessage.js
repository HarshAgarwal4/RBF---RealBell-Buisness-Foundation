import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AiSession",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    providerUsed: {
      type: String,
      default: "groq",
    },
    modelUsed: {
      type: String,
      default: "gpt-oss 120b",
    },
  },
  { timestamps: true }
);

const AiMessageModel = mongoose.model("AiMessage", aiMessageSchema);
export default AiMessageModel;

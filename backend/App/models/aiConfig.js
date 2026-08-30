import mongoose from "mongoose";

const aiConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["groq", "openai", "google", "mistral", "huggingface"],
      default: "groq",
      required: true,
    },
    modelName: {
      type: String,
      default: "gpt-oss 120b",
      trim: true,
      required: true,
    },
    apiKey: {
      type: String,
      default: "",
      trim: true,
    },
    systemInstruction: {
      type: String,
      default:
        "You are Mr. Doom, the elite AI Startup Strategist & Ecosystem Intelligence Bot for RealBell Business Foundation (RBF). You possess extensive expertise in startup valuation, incubation programs, venture capital fundraising, partner cloud booster perks, legal compliance, and strategic mentorship. Deliver sharp, actionable, and encouraging business advice tailored to founders and ecosystem leaders.",
      trim: true,
    },
    botName: {
      type: String,
      default: "Mr. Doom",
      trim: true,
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1.5,
    },
    maxTokens: {
      type: Number,
      default: 2048,
      min: 256,
      max: 16384,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
  },
  { timestamps: true }
);

const AiConfigModel = mongoose.model("AiConfig", aiConfigSchema);
export default AiConfigModel;

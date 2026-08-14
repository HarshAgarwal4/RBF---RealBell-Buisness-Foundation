import mongoose from "mongoose";

/* ======================= Resource Schema ======================= */
const ResourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["contract", "glossary", "report", "news", "video"],
      index: true,
    },

    // --- Shared ---
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    // --- Contracts & Reports: category tab ---
    category: { type: String, default: "", trim: true },

    // --- Contracts & Reports: file URL (Cloudinary) ---
    fileUrl: { type: String, default: "" },
    filePublicId: { type: String, default: "" },
    fileName: { type: String, default: "" },
    downloadCount: { type: Number, default: 0 },

    // --- Glossary: letter index & definition ---
    letter: { type: String, default: "", trim: true, uppercase: true },
    definition: { type: String, default: "", trim: true },

    // --- News: image, source, publishedAt, newsCategory ---
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    sourceName: { type: String, default: "" },
    newsCategory: { type: String, default: "" },
    publishedAt: { type: Date, default: null },

    // --- Videos: youtubeUrl, thumbnail, speaker, industry ---
    videoUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    speaker: { type: String, default: "" },
    industry: { type: String, default: "" },
    courtesy: { type: String, default: "" },

    // --- Meta ---
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for search
ResourceSchema.index({ title: "text", description: "text", definition: "text" });

const ResourceModel =
  mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

export default ResourceModel;

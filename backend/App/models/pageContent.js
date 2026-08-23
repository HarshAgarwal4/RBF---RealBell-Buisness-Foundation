import mongoose from "mongoose";

const PageContentSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "home",
        "login",
        "signup",
        "privacy-policy",
        "terms-of-service",
        "code-of-conduct",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PageContentModel = mongoose.model("PageContent", PageContentSchema);

export default PageContentModel;

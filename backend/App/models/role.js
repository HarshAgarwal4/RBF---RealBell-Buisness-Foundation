import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "textarea", "number", "select", "multiselect", "checkbox", "date", "url"],
      default: "text",
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    options: [{ type: String }],
    gridCols: { type: Number, default: 1 },
  },
  { _id: false }
);

const StepSchema = new mongoose.Schema(
  {
    stepId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fields: [FieldSchema],
  },
  { _id: false }
);

const RoleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "Building2",
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
    hasSubtypes: {
      type: Boolean,
      default: false,
    },
    subtypes: [
      {
        id: String,
        label: String,
      },
    ],
    profileSchema: {
      steps: [StepSchema],
    },
    uiConfig: {
      accentColor: { type: String, default: "#d97706" },
      stepperStyle: { type: String, default: "horizontal_tabs" },
      bannerTitle: { type: String, default: "" },
      bannerSubtitle: { type: String, default: "" },
      cardStyle: { type: String, default: "bordered" },
    },
  },
  {
    timestamps: true,
  }
);

const RoleModel = mongoose.model("Role", RoleSchema);

export default RoleModel;

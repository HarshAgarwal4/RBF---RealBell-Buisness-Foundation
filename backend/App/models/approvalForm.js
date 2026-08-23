import mongoose from "mongoose";

const FormFieldValidationSchema = new mongoose.Schema(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    allowedFileTypes: [{ type: String }], // e.g. ["pdf", "doc", "docx", "png", "jpg", "jpeg"]
    maxFileSizeMB: { type: Number, default: 10 },
  },
  { _id: false }
);

const ApprovalFormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "number",
        "email",
        "phone",
        "date",
        "checkbox",
        "radio",
        "select",
        "multiselect",
        "file",
        "image",
        "url",
        "address",
        "terms",
      ],
      default: "text",
    },
    placeholder: { type: String, default: "" },
    description: { type: String, default: "" },
    required: { type: Boolean, default: false },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: "" },
    options: [{ type: String }],
    validation: {
      type: FormFieldValidationSchema,
      default: () => ({}),
    },
    gridCols: { type: Number, default: 1 }, // 1 or 2
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ApprovalFormSchema = new mongoose.Schema(
  {
    organizationType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    roleKey: {
      type: String,
      default: "default",
      trim: true,
      lowercase: true,
    },
    roleLabel: {
      type: String,
      default: "All Roles",
      trim: true,
    },
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
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["published", "draft", "disabled"],
      default: "published",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    fields: [ApprovalFormFieldSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
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

// Compound index for active form per orgType + roleKey combination
ApprovalFormSchema.index({ organizationType: 1, roleKey: 1 });

const ApprovalFormModel = mongoose.model("ApprovalForm", ApprovalFormSchema);

export default ApprovalFormModel;

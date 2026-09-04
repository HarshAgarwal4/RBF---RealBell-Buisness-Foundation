import mongoose from "mongoose";

const FormFieldValidationSchema = new mongoose.Schema(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    allowedFileTypes: [{ type: String }],
    maxFileSizeMB: { type: Number, default: 25 },
  },
  { _id: false }
);

const IncubationFormFieldSchema = new mongoose.Schema(
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
    gridCols: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
    section: { type: String, default: "custom" }, // "business", "team", "custom"
  },
  { _id: false }
);

const IncubationFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "RealBell Startup Incubation & Cohort Application Form",
      trim: true,
    },
    description: {
      type: String,
      default: "Submit your startup profile, business model, DPIIT registration, and team details for incubation onboarding.",
      trim: true,
    },
    centerName: {
      type: String,
      default: "RealBell Vedic Council of Education Research & Training (Chandlai Hub)",
      trim: true,
    },
    cohortName: {
      type: String,
      default: "Cohort 2026-Q1",
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
    fields: [IncubationFormFieldSchema],
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
  { timestamps: true }
);

const IncubationFormModel = mongoose.model("IncubationForm", IncubationFormSchema);
export default IncubationFormModel;

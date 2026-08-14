import mongoose from "mongoose";

/* ─── Response per custom form field ─── */
const FieldResponseSchema = new mongoose.Schema(
  {
    field_id: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { _id: false }
);

/* ─── Program Application Schema ─── */
const ProgramApplicationSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    /* Custom form answers */
    custom_responses: { type: [FieldResponseSchema], default: [] },

    /* Status */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    admin_note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicate applications
ProgramApplicationSchema.index(
  { program: 1, applicant: 1 },
  { unique: true }
);

const ProgramApplicationModel = mongoose.model(
  "ProgramApplication",
  ProgramApplicationSchema
);
export default ProgramApplicationModel;

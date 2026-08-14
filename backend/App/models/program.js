import mongoose from "mongoose";

/* ─── External Link Schema ─── */
const ExternalLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "Apply on Website", "Learn More"
    url:   { type: String, required: true, trim: true },
  },
  { _id: false }
);

/* ─── Custom Form Field Schema ─── */
const FormFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "textarea", "select", "radio", "checkbox", "date", "file"],
      required: true,
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    options: { type: [String], default: [] }, // for select, radio, checkbox
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Rich Content Block Schema ─── */
const RichBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["heading", "paragraph", "faq"],
      required: true,
    },
    // heading / paragraph
    content: { type: String, default: "" },
    level: { type: Number, default: 2 }, // for heading: h2, h3, h4
    // faq
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Program Schema ─── */
const ProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    short_description: { type: String, trim: true, default: "" },
    banner_image: { type: String, default: "" },
    logo: { type: String, default: "" },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },

    /* Content — choose one mode */
    content_type: {
      type: String,
      enum: ["ai_text", "rich_editor"],
      default: "rich_editor",
    },
    // Mode 1 — AI generated markdown
    ai_raw_input: { type: String, default: "" },
    ai_content: { type: String, default: "" },

    // Mode 2 — Rich block editor
    rich_blocks: { type: [RichBlockSchema], default: [] },

    /* Custom application form */
    custom_form_fields: { type: [FormFieldSchema], default: [] },

    application_deadline: { type: Date, default: null },
    tags: { type: [String], default: [] },
    external_links: { type: [ExternalLinkSchema], default: [] },
  },
  { timestamps: true }
);

const ProgramModel = mongoose.model("Program", ProgramSchema);
export default ProgramModel;

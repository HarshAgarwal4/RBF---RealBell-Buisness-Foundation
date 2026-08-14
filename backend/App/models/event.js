import mongoose from "mongoose";

/* ─── External Link Schema ─── */
const ExternalLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
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
    options: { type: [String], default: [] },
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
    content: { type: String, default: "" },
    level: { type: Number, default: 2 },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ─── Event Schema ─── */
const EventSchema = new mongoose.Schema(
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

    /* Event Pricing & Ticket Options */
    event_type: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    payment_options: {
      type: [String], // ["ticket", "token"]
      default: ["ticket"],
    },
    price: {
      type: Number,
      default: 0, // Ticket price in INR
    },
    token_price: {
      type: Number,
      default: 0, // Price in Tokens
    },
    total_tickets: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    tickets_sold: {
      type: Number,
      default: 0,
    },

    /* Event Schedule & Location */
    event_date: { type: Date, required: true },
    event_end_date: { type: Date, default: null },
    location_type: {
      type: String,
      enum: ["online", "in_person", "hybrid"],
      default: "online",
    },
    venue: { type: String, default: "" }, // Physical address or meeting link

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

    /* Custom registration form */
    custom_form_fields: { type: [FormFieldSchema], default: [] },

    registration_deadline: { type: Date, default: null },
    tags: { type: [String], default: [] },
    external_links: { type: [ExternalLinkSchema], default: [] },
  },
  { timestamps: true }
);

const EventModel = mongoose.models.Event || mongoose.model("Event", EventSchema);
export default EventModel;

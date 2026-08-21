import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  X,
  GripVertical,
  Loader,
  Wand2,
  FileText,
  LayoutList,
  Calendar,
  Tag,
  Ticket as TicketIcon,
} from "lucide-react";

const STATUS_OPTS = ["draft", "published", "closed"];
const STATUS_COLORS = {
  draft: { bg: "rgba(245,158,11,0.1)", color: "#d97706", border: "rgba(245,158,11,0.3)" },
  published: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.3)" },
  closed: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", border: "rgba(239,68,68,0.3)" },
};

const FIELD_TYPES = ["text", "textarea", "select", "radio", "checkbox", "date", "file"];

const CONTENT_MODES = [
  { key: "ai_text", label: "AI Text", icon: Wand2, desc: "Write raw text — AI formats it" },
  { key: "rich_editor", label: "Rich Editor", icon: LayoutList, desc: "Build with heading, paragraph, FAQ blocks" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const newField = () => ({
  id: uid(),
  label: "",
  type: "text",
  required: false,
  placeholder: "",
  options: [],
  order: 0,
});

const newBlock = (type) => ({
  id: uid(),
  type,
  content: "",
  level: 2,
  question: "",
  answer: "",
  order: 0,
});

/* ── Rich block mini-editor ── */
function BlockEditor({ block, onChange, onDelete }) {
  const inputStyle = {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid var(--admin-input-border, rgba(255,255,255,0.1))",
    borderRadius: 6,
    background: "var(--admin-input-bg, rgba(255,255,255,0.05))",
    color: "var(--admin-input-text, #e2e8f0)",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        background: "var(--admin-card-bg, rgba(255,255,255,0.04))",
        border: "1px solid var(--admin-card-border, rgba(255,255,255,0.08))",
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <GripVertical size={13} color="#475569" style={{ cursor: "grab" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color:
                block.type === "heading"
                  ? "#818cf8"
                  : block.type === "paragraph"
                  ? "#94a3b8"
                  : "#34d399",
              background:
                block.type === "heading"
                  ? "rgba(99,102,241,0.1)"
                  : block.type === "paragraph"
                  ? "rgba(148,163,184,0.1)"
                  : "rgba(52,211,153,0.1)",
              padding: "2px 6px",
              borderRadius: 20,
            }}
          >
            {block.type}
          </span>
          {block.type === "heading" && (
            <select
              value={block.level}
              onChange={(e) => onChange({ ...block, level: parseInt(e.target.value) })}
              style={{ ...inputStyle, width: 60, padding: "3px 6px" }}
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
            </select>
          )}
        </div>
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }}
        >
          <X size={14} />
        </button>
      </div>

      {block.type === "heading" && (
        <input
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder="Heading text…"
          style={inputStyle}
        />
      )}
      {block.type === "paragraph" && (
        <textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder="Paragraph text…"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      )}
      {block.type === "faq" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            value={block.question}
            onChange={(e) => onChange({ ...block, question: e.target.value })}
            placeholder="Question…"
            style={inputStyle}
          />
          <textarea
            value={block.answer}
            onChange={(e) => onChange({ ...block, answer: e.target.value })}
            placeholder="Answer…"
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Custom Form field editor ── */
function FieldEditor({ field, onChange, onDelete }) {
  const inputStyle = {
    padding: "6px 10px",
    border: "1px solid var(--admin-input-border, rgba(255,255,255,0.1))",
    borderRadius: 6,
    background: "var(--admin-input-bg, rgba(255,255,255,0.05))",
    color: "var(--admin-input-text, #e2e8f0)",
    fontSize: 12.5,
    fontFamily: "inherit",
    outline: "none",
  };
  const needsOptions = ["select", "radio", "checkbox"].includes(field.type);
  const [optInput, setOptInput] = useState("");

  const addOpt = () => {
    if (optInput.trim()) {
      onChange({ ...field, options: [...field.options, optInput.trim()] });
      setOptInput("");
    }
  };

  return (
    <div
      style={{
        background: "var(--admin-card-bg, rgba(255,255,255,0.04))",
        border: "1px solid var(--admin-card-border, rgba(255,255,255,0.08))",
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <GripVertical size={13} color="#475569" />
        </div>
        <input
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Field label *"
          style={{ ...inputStyle, flex: 1, minWidth: 120 }}
        />
        <select
          value={field.type}
          onChange={(e) => onChange({ ...field, type: e.target.value, options: [] })}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          value={field.placeholder}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          placeholder="Placeholder…"
          style={{ ...inputStyle, width: 130 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--admin-text-subtle, #94a3b8)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            style={{ accentColor: "#6366f1" }}
          />
          Req
        </label>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>
          <Trash2 size={13} />
        </button>
      </div>

      {needsOptions && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
            {field.options.map((opt, i) => (
              <span
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(99,102,241,0.15)",
                  color: "#a5b4fc",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 11,
                }}
              >
                {opt}
                <button
                  onClick={() => onChange({ ...field, options: field.options.filter((_, j) => j !== i) })}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 0 }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={optInput}
              onChange={(e) => setOptInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addOpt()}
              placeholder="Add option + Enter"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={addOpt}
              style={{
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a5b4fc",
                borderRadius: 6,
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Event Modal Drawer ── */
function EventModal({ event, onClose, onSaved }) {
  const [form, setForm] = useState(
    event || {
      title: "",
      short_description: "",
      status: "draft",
      event_type: "free",
      payment_options: ["ticket"],
      price: 0,
      token_price: 0,
      total_tickets: 0,
      event_date: "",
      event_end_date: "",
      location_type: "online",
      venue: "",
      registration_deadline: "",
      content_type: "rich_editor",
      ai_raw_input: "",
      ai_content: "",
      rich_blocks: [],
      custom_form_fields: [],
      tags: [],
      external_links: [],
    }
  );

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(event?.banner_image || "");
  const [logoPreview, setLogoPreview] = useState(event?.logo || "");
  const bannerRef = useRef();
  const logoRef = useRef();

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "banner") { setBannerFile(file); setBannerPreview(url); }
    else { setLogoFile(file); setLogoPreview(url); }
  };

  const addBlock = (type) => {
    const b = newBlock(type);
    b.order = form.rich_blocks.length;
    set("rich_blocks", [...form.rich_blocks, b]);
  };

  const updateBlock = (id, updated) =>
    set("rich_blocks", form.rich_blocks.map((b) => (b.id === id ? updated : b)));

  const deleteBlock = (id) =>
    set("rich_blocks", form.rich_blocks.filter((b) => b.id !== id));

  const addField = () => {
    const f = newField();
    f.order = form.custom_form_fields.length;
    set("custom_form_fields", [...form.custom_form_fields, f]);
  };

  const updateField = (id, updated) =>
    set("custom_form_fields", form.custom_form_fields.map((f) => (f.id === id ? updated : f)));

  const deleteField = (id) =>
    set("custom_form_fields", form.custom_form_fields.filter((f) => f.id !== id));

  const generateAI = async () => {
    if (!form.ai_raw_input?.trim()) {
      toast.error("Please enter raw text first");
      return;
    }
    setGenerating(true);
    try {
      const r = await axios.post("/events/admin/ai-generate", { raw_text: form.ai_raw_input });
      if (r.data.status === 1) {
        set("ai_content", r.data.formatted_content);
        toast.success("AI content generated!");
      } else {
        toast.error(r.data.msg || "Generation failed");
      }
    } catch {
      toast.error("AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.event_date) return toast.error("Event start date is required");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("short_description", form.short_description || "");
      fd.append("status", form.status);
      fd.append("event_type", form.event_type);
      fd.append("payment_options", JSON.stringify(form.payment_options || ["ticket"]));
      fd.append("price", form.price || 0);
      fd.append("token_price", form.token_price || 0);
      fd.append("total_tickets", form.total_tickets || 0);
      fd.append("event_date", form.event_date || "");
      fd.append("event_end_date", form.event_end_date || "");
      fd.append("location_type", form.location_type || "online");
      fd.append("venue", form.venue || "");
      fd.append("registration_deadline", form.registration_deadline || "");
      fd.append("content_type", form.content_type);
      fd.append("ai_raw_input", form.ai_raw_input || "");
      fd.append("ai_content", form.ai_content || "");
      fd.append("rich_blocks", JSON.stringify(form.rich_blocks));
      fd.append("custom_form_fields", JSON.stringify(form.custom_form_fields));
      fd.append("tags", JSON.stringify(form.tags));
      fd.append("external_links", JSON.stringify(form.external_links || []));

      if (bannerFile) fd.append("banner_image", bannerFile);
      if (logoFile) fd.append("logo", logoFile);

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      let r;
      if (event?._id) {
        r = await axios.put(`/events/admin/${event._id}`, fd, config);
      } else {
        r = await axios.post("/events/admin", fd, config);
      }

      if (r.data.status === 1) {
        toast.success(event?._id ? "Event updated!" : "Event created!");
        onSaved(r.data.event);
      } else {
        toast.error(r.data.msg || "Save failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong saving event");
    } finally {
      setSaving(false);
    }
  };

  const s = {
    label: {
      display: "block",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--admin-text-subtle, #94a3b8)",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    input: {
      width: "100%",
      padding: "8px 10px",
      border: "1px solid var(--admin-input-border, rgba(255,255,255,0.1))",
      borderRadius: 6,
      background: "var(--admin-input-bg, rgba(255,255,255,0.05))",
      color: "var(--admin-input-text, #e2e8f0)",
      fontSize: 13,
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
    },
    section: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottom: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
    },
    sectionTitle: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--admin-text-primary, #e2e8f0)",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
  };

  return (
    <div className="admin-modal-overlay" style={{ justifyContent: "flex-end", padding: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        style={{
          width: "min(720px, 100vw)",
          height: "100vh",
          background: "var(--admin-modal-bg, #0f1117)",
          borderLeft: "1px solid var(--admin-modal-border, rgba(255,255,255,0.08))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--admin-text-primary, #e2e8f0)" }}>
            {event?._id ? "Edit Event" : "Create Event"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ padding: "6px 14px", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : event?._id ? "Update Event" : "Create Event"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-subtle, #94a3b8)" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Section 1: Basic Details */}
          <div style={s.section}>
            <div style={s.sectionTitle}><Calendar size={14} color="#6366f1" /> Basic Event Details</div>

            <div className="admin-grid-2col" style={{ marginBottom: 12 }}>
              <div>
                <label style={s.label}>Event Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} style={s.input} placeholder="e.g. Global Founder Summit" />
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                  {STATUS_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Short Tagline / Description</label>
              <textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} style={{ ...s.input, resize: "vertical" }} placeholder="Brief summary for event cards…" />
            </div>

            {/* Date & Location */}
            <div className="admin-grid-2col" style={{ marginBottom: 12 }}>
              <div>
                <label style={s.label}>Start Date & Time *</label>
                <input type="datetime-local" value={form.event_date ? new Date(form.event_date).toISOString().slice(0, 16) : ""} onChange={(e) => set("event_date", e.target.value)} style={s.input} />
              </div>
              <div>
                <label style={s.label}>End Date & Time</label>
                <input type="datetime-local" value={form.event_end_date ? new Date(form.event_end_date).toISOString().slice(0, 16) : ""} onChange={(e) => set("event_end_date", e.target.value)} style={s.input} />
              </div>
            </div>

            <div className="admin-grid-2col" style={{ marginBottom: 12 }}>
              <div>
                <label style={s.label}>Location Type</label>
                <select value={form.location_type} onChange={(e) => set("location_type", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                  <option value="online">Online / Virtual</option>
                  <option value="in_person">In Person / Physical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Venue Address / Meeting Link</label>
                <input value={form.venue} onChange={(e) => set("venue", e.target.value)} style={s.input} placeholder="Zoom link or venue address" />
              </div>
            </div>

            {/* Banner & Logo */}
            <div className="admin-grid-2col">
              <div>
                <label style={s.label}>Banner Image</label>
                <div onClick={() => bannerRef.current.click()} style={{ border: "1.5px dashed var(--admin-border-subtle, rgba(255,255,255,0.15))", borderRadius: 8, minHeight: 75, cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--admin-card-bg, rgba(255,255,255,0.03))" }}>
                  {bannerPreview ? <img src={bannerPreview} alt="banner" style={{ width: "100%", height: 75, objectFit: "cover" }} /> : <span style={{ color: "var(--admin-text-subtle, #64748b)", fontSize: 11 }}>Click to upload banner</span>}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, "banner")} />
              </div>

              <div>
                <label style={s.label}>Logo</label>
                <div onClick={() => logoRef.current.click()} style={{ border: "1.5px dashed var(--admin-border-subtle, rgba(255,255,255,0.15))", borderRadius: 8, minHeight: 75, cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--admin-card-bg, rgba(255,255,255,0.03))" }}>
                  {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: 55, height: 55, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ color: "var(--admin-text-subtle, #64748b)", fontSize: 11 }}>Click to upload logo</span>}
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, "logo")} />
              </div>
            </div>
          </div>

          {/* Section 2: Ticket Pricing & Seats */}
          <div style={s.section}>
            <div style={s.sectionTitle}><TicketIcon size={14} color="#6366f1" /> Ticket Pricing & Seats</div>

            <div className="admin-grid-2col" style={{ marginBottom: 12 }}>
              <div>
                <label style={s.label}>Event Type</label>
                <select value={form.event_type} onChange={(e) => set("event_type", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                  <option value="free">Free Event</option>
                  <option value="paid">Paid Event</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Total Seat Limit (0 = Unlimited)</label>
                <input type="number" value={form.total_tickets} onChange={(e) => set("total_tickets", parseInt(e.target.value) || 0)} style={s.input} />
              </div>
            </div>

            {form.event_type === "paid" && (
              <div className="admin-grid-2col" style={{ background: "rgba(99,102,241,0.06)", padding: 12, borderRadius: 8 }}>
                <div>
                  <label style={s.label}>Ticket Price (₹ INR)</label>
                  <input type="number" value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} style={s.input} placeholder="e.g. 499" />
                </div>
                <div>
                  <label style={s.label}>Token Price (Tokens)</label>
                  <input type="number" value={form.token_price} onChange={(e) => set("token_price", parseInt(e.target.value) || 0)} style={s.input} placeholder="e.g. 50" />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Rich Description */}
          <div style={s.section}>
            <div style={s.sectionTitle}><FileText size={14} color="#6366f1" /> Event Content Description</div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {CONTENT_MODES.map((m) => {
                const MIcon = m.icon;
                const active = form.content_type === m.key;
                return (
                  <button key={m.key} onClick={() => set("content_type", m.key)} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: active ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))", background: active ? "rgba(99,102,241,0.12)" : "var(--admin-card-bg, rgba(255,255,255,0.03))", color: active ? "#a5b4fc" : "var(--admin-text-subtle, #64748b)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                      <MIcon size={13} /> {m.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {form.content_type === "ai_text" ? (
              <div>
                <textarea value={form.ai_raw_input} onChange={(e) => set("ai_raw_input", e.target.value)} rows={4} style={{ ...s.input, resize: "vertical", marginBottom: 8 }} placeholder="Paste event details here for AI formatting…" />
                <button onClick={generateAI} disabled={generating} className="admin-btn admin-btn-primary" style={{ padding: "6px 14px", fontSize: 12, marginBottom: 12 }}>
                  <Wand2 size={13} /> {generating ? "Generating…" : "Generate AI Content"}
                </button>
                {form.ai_content && (
                  <div style={{ marginTop: 10, background: "var(--admin-card-bg, rgba(255,255,255,0.03))", padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--admin-text-subtle, #94a3b8)", fontWeight: 700, marginBottom: 6 }}>PREVIEW:</div>
                    <ReactMarkdown>{form.ai_content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  <button onClick={() => addBlock("heading")} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>+ Heading</button>
                  <button onClick={() => addBlock("paragraph")} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>+ Paragraph</button>
                  <button onClick={() => addBlock("faq")} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>+ FAQ Item</button>
                </div>
                {form.rich_blocks.map((block) => (
                  <BlockEditor key={block.id} block={block} onChange={(updated) => updateBlock(block.id, updated)} onDelete={() => deleteBlock(block.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Custom Form Fields */}
          <div style={s.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={s.sectionTitle}><Tag size={14} color="#6366f1" /> Custom Registration Fields</div>
              <button onClick={addField} className="admin-btn admin-btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }}>+ Add Field</button>
            </div>
            {form.custom_form_fields.map((field) => (
              <FieldEditor key={field.id} field={field} onChange={(updated) => updateField(field.id, updated)} onDelete={() => deleteField(field.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Admin Events Page ── */
export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const r = await axios.get("/events/admin");
      if (r.data.status === 1) setEvents(r.data.events);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event? All tickets and registrations will be deleted.")) return;
    try {
      const r = await axios.delete(`/events/admin/${id}`);
      if (r.data.status === 1) {
        toast.success("Event deleted");
        setEvents(events.filter((e) => e._id !== id));
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <AdminLayout title="Events & Workshops">
      <div>
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--admin-text-primary, #e2e8f0)", margin: 0 }}>Events & Workshops</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--admin-text-subtle, #64748b)", margin: "2px 0 0" }}>Curate and manage ecosystem events, workshops, tickets, and attendees</p>
          </div>

          <button onClick={() => { setModalEvent(null); setShowModal(true); }} className="admin-btn admin-btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            <Plus size={15} /> Create Event
          </button>
        </div>

        {/* Events Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "var(--admin-text-subtle, #64748b)", fontSize: 13 }}>Loading events…</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "var(--admin-card-bg, rgba(255,255,255,0.02))", borderRadius: 12, border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))", color: "var(--admin-text-subtle, #64748b)" }}>
            No events found. Click "+ Create Event" to add your first event.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Date</th>
                  <th>Type / Price</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const s = STATUS_COLORS[evt.status] || STATUS_COLORS.draft;
                  const dateStr = evt.event_date ? new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBA";

                  return (
                    <tr key={evt._id}>
                      <td>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--admin-text-primary, #e2e8f0)" }}>{evt.title}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--admin-text-subtle, #64748b)" }}>{evt.location_type}</div>
                      </td>
                      <td style={{ fontSize: "0.72rem", color: "var(--admin-text-muted, #94a3b8)" }}>{dateStr}</td>
                      <td>
                        <span style={{ background: evt.event_type === "free" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)", color: evt.event_type === "free" ? "#4ade80" : "#a5b4fc", padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700 }}>
                          {evt.event_type === "free" ? "Free" : `₹${evt.price} / ${evt.token_price} Tks`}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--admin-text-muted, #94a3b8)" }}>
                        {evt.tickets_sold} {evt.total_tickets > 0 ? `/ ${evt.total_tickets}` : "tickets"}
                      </td>
                      <td>
                        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700 }}>
                          {evt.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                          <button onClick={() => navigate(`/admin/events/${evt._id}/attendees`)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>
                            <Users size={12} /> Attendees
                          </button>
                          <button onClick={() => { setModalEvent(evt); setShowModal(true); }} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px" }}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete(evt._id)} className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <EventModal
            event={modalEvent}
            onClose={() => setShowModal(false)}
            onSaved={() => {
              setShowModal(false);
              fetchEvents();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

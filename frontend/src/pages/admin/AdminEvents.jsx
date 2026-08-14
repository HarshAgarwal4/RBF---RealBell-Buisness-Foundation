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
  Eye,
  Users,
  ChevronDown,
  X,
  GripVertical,
  Loader,
  Wand2,
  FileText,
  LayoutList,
  Calendar,
  Tag,
  MapPin,
  Ticket as TicketIcon,
  Coins,
  DollarSign,
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
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 7,
    background: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
    fontSize: 13.5,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GripVertical size={14} color="#475569" style={{ cursor: "grab" }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
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
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {block.type}
          </span>
          {block.type === "heading" && (
            <select
              value={block.level}
              onChange={(e) => onChange({ ...block, level: parseInt(e.target.value) })}
              style={{ ...inputStyle, width: 70, padding: "4px 8px" }}
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
            </select>
          )}
        </div>
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}
        >
          <X size={15} />
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
    padding: "7px 12px",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 7,
    background: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
    fontSize: 13,
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
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <GripVertical size={14} color="#475569" />
        </div>
        <input
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Field label *"
          style={{ ...inputStyle, flex: 1, minWidth: 140 }}
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
          style={{ ...inputStyle, width: 160 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#94a3b8", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            style={{ accentColor: "#6366f1" }}
          />
          Required
        </label>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>
          <Trash2 size={14} />
        </button>
      </div>

      {needsOptions && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {field.options.map((opt, i) => (
              <span
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(99,102,241,0.15)",
                  color: "#a5b4fc",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                }}
              >
                {opt}
                <button
                  onClick={() => onChange({ ...field, options: field.options.filter((_, j) => j !== i) })}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 0 }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
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
                borderRadius: 7,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
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

  const [tagInput, setTagInput] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // File states
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

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      set("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addLink = () => {
    if (linkLabel.trim() && linkUrl.trim()) {
      let url = linkUrl.trim();
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      set("external_links", [...(form.external_links || []), { label: linkLabel.trim(), url }]);
      setLinkLabel("");
      setLinkUrl("");
    }
  };

  const removeLink = (idx) =>
    set("external_links", (form.external_links || []).filter((_, i) => i !== idx));

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
      fontSize: 12.5,
      fontWeight: 600,
      color: "#94a3b8",
      marginBottom: 5,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    input: {
      width: "100%",
      padding: "9px 12px",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      background: "rgba(255,255,255,0.05)",
      color: "#e2e8f0",
      fontSize: 13.5,
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
    },
    section: {
      marginBottom: 24,
      paddingBottom: 24,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: "#e2e8f0",
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 7,
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(780px, 100vw)",
          height: "100vh",
          background: "#0f1117",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0" }}>
            {event?._id ? "Edit Event" : "Create Event"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: 13.5,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {saving ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {saving ? "Saving…" : event?._id ? "Update Event" : "Create Event"}
            </button>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Section 1: Basic Details */}
          <div style={s.section}>
            <div style={s.sectionTitle}><Calendar size={15} color="#6366f1" /> Basic Event Details</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={s.label}>Event Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  style={s.input}
                  placeholder="e.g. Global Founder Summit 2026"
                />
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  style={{ ...s.input, cursor: "pointer" }}
                >
                  {STATUS_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Short Tagline / Description</label>
              <textarea
                value={form.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                rows={2}
                style={{ ...s.input, resize: "vertical" }}
                placeholder="Brief summary for event cards…"
              />
            </div>

            {/* Date & Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={s.label}>Event Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.event_date ? new Date(form.event_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => set("event_date", e.target.value)}
                  style={s.input}
                />
              </div>
              <div>
                <label style={s.label}>Event End Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.event_end_date ? new Date(form.event_end_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => set("event_end_date", e.target.value)}
                  style={s.input}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={s.label}>Location Type</label>
                <select
                  value={form.location_type}
                  onChange={(e) => set("location_type", e.target.value)}
                  style={{ ...s.input, cursor: "pointer" }}
                >
                  <option value="online">Online / Virtual</option>
                  <option value="in_person">In Person / Physical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Venue Address / Meeting Link</label>
                <input
                  value={form.venue}
                  onChange={(e) => set("venue", e.target.value)}
                  style={s.input}
                  placeholder="e.g. Zoom link or Hall A, Convention Center"
                />
              </div>
            </div>

            {/* Banner & Logo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={s.label}>Banner Image</label>
                <div
                  onClick={() => bannerRef.current.click()}
                  style={{
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    minHeight: 80,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="banner" style={{ width: "100%", height: 80, objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#64748b", fontSize: 12 }}>Click to upload banner</span>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, "banner")} />
              </div>

              <div>
                <label style={s.label}>Logo</label>
                <div
                  onClick={() => logoRef.current.click()}
                  style={{
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    minHeight: 80,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <span style={{ color: "#64748b", fontSize: 12 }}>Click to upload logo</span>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, "logo")} />
              </div>
            </div>
          </div>

          {/* Section 2: Ticket Pricing & Seats */}
          <div style={s.section}>
            <div style={s.sectionTitle}><TicketIcon size={15} color="#6366f1" /> Ticket Pricing & Seats</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={s.label}>Event Type</label>
                <select
                  value={form.event_type}
                  onChange={(e) => set("event_type", e.target.value)}
                  style={{ ...s.input, cursor: "pointer" }}
                >
                  <option value="free">Free Event</option>
                  <option value="paid">Paid Event</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Total Seat Limit (0 = Unlimited)</label>
                <input
                  type="number"
                  value={form.total_tickets}
                  onChange={(e) => set("total_tickets", parseInt(e.target.value) || 0)}
                  style={s.input}
                />
              </div>
            </div>

            {form.event_type === "paid" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "rgba(99,102,241,0.06)", padding: 14, borderRadius: 10 }}>
                <div>
                  <label style={s.label}>Ticket Price (₹ INR)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                    style={s.input}
                    placeholder="e.g. 499"
                  />
                </div>

                <div>
                  <label style={s.label}>Token Price (Tokens count)</label>
                  <input
                    type="number"
                    value={form.token_price}
                    onChange={(e) => set("token_price", parseInt(e.target.value) || 0)}
                    style={s.input}
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Rich Description */}
          <div style={s.section}>
            <div style={s.sectionTitle}><FileText size={15} color="#6366f1" /> Event Content Description</div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {CONTENT_MODES.map((m) => {
                const MIcon = m.icon;
                const active = form.content_type === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => set("content_type", m.key)}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: active ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                      color: active ? "#a5b4fc" : "#64748b",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13 }}>
                      <MIcon size={14} /> {m.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {form.content_type === "ai_text" ? (
              <div>
                <textarea
                  value={form.ai_raw_input}
                  onChange={(e) => set("ai_raw_input", e.target.value)}
                  rows={5}
                  style={{ ...s.input, resize: "vertical", marginBottom: 10 }}
                  placeholder="Paste your event details here. AI will structure and format it beautifully…"
                />
                <button
                  onClick={generateAI}
                  disabled={generating}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: generating ? "not-allowed" : "pointer",
                  }}
                >
                  <Wand2 size={14} /> {generating ? "Generating AI Markdown…" : "Generate AI Content"}
                </button>

                {form.ai_content && (
                  <div style={{ marginTop: 14, background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>PREVIEW:</div>
                    <ReactMarkdown>{form.ai_content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button onClick={() => addBlock("heading")} style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "none", padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>+ Heading</button>
                  <button onClick={() => addBlock("paragraph")} style={{ background: "rgba(148,163,184,0.15)", color: "#cbd5e1", border: "none", padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>+ Paragraph</button>
                  <button onClick={() => addBlock("faq")} style={{ background: "rgba(52,211,153,0.15)", color: "#6ee7b7", border: "none", padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>+ FAQ Item</button>
                </div>

                {form.rich_blocks.map((block) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onChange={(updated) => updateBlock(block.id, updated)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Custom Form Fields */}
          <div style={s.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={s.sectionTitle}><Tag size={15} color="#6366f1" /> Custom Registration Fields</div>
              <button onClick={addField} style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "none", padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>+ Add Field</button>
            </div>

            {form.custom_form_fields.map((field) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(updated) => updateField(field.id, updated)}
                onDelete={() => deleteField(field.id)}
              />
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
    <AdminLayout title="Events Management">
      <div style={{ padding: "24px" }}>
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>Events</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Create and manage events, tickets, and attendees</p>
          </div>

          <button
            onClick={() => { setModalEvent(null); setShowModal(true); }}
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={16} /> Create Event
          </button>
        </div>

        {/* Events Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading events…</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
            No events found. Click "+ Create Event" to add your first event.
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Event Title</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Date</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Type / Price</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Registrations</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const s = STATUS_COLORS[evt.status] || STATUS_COLORS.draft;
                  const dateStr = evt.event_date ? new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBA";

                  return (
                    <tr key={evt._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                        <div style={{ fontSize: 14.5, color: "#e2e8f0" }}>{evt.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{evt.location_type}</div>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#94a3b8" }}>{dateStr}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ background: evt.event_type === "free" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)", color: evt.event_type === "free" ? "#4ade80" : "#a5b4fc", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {evt.event_type === "free" ? "Free" : `₹${evt.price} / ${evt.token_price} Tks`}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#94a3b8" }}>
                        {evt.tickets_sold} {evt.total_tickets > 0 ? `/ ${evt.total_tickets}` : "tickets"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {evt.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            onClick={() => navigate(`/admin/events/${evt._id}/attendees`)}
                            title="View Attendees"
                            style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", padding: "6px 10px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                          >
                            <Users size={14} /> Attendees
                          </button>
                          <button
                            onClick={() => { setModalEvent(evt); setShowModal(true); }}
                            style={{ background: "rgba(99,102,241,0.15)", border: "none", color: "#a5b4fc", padding: "6px 10px", borderRadius: 7, cursor: "pointer" }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(evt._id)}
                            style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171", padding: "6px 10px", borderRadius: 7, cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
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
            onSaved={(savedEvt) => {
              setShowModal(false);
              fetchEvents();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

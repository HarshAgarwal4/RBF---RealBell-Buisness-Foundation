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
  Award,
  Calendar,
  Tag,
} from "lucide-react";

const STATUS_OPTS = ["draft", "published", "closed"];
const STATUS_COLORS = {
  draft: { bg: "rgba(245,158,11,0.1)", color: "#d97706", border: "rgba(245,158,11,0.3)" },
  published: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.3)" },
  closed: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", border: "rgba(239,68,68,0.3)" },
};
const FIELD_TYPES = ["text", "textarea", "select", "radio", "checkbox", "date", "file"];

const CONTENT_MODES = [
  { key: "ai_text", label: "AI Text", icon: Wand2, desc: "Write raw content — AI formats it" },
  { key: "rich_editor", label: "Rich Editor", icon: LayoutList, desc: "Build with heading, paragraph, FAQ blocks" },
];

/* ── helpers ── */
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

/* ── Form field editor ── */
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
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "#94a3b8",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            style={{ accentColor: "#6366f1" }}
          />
          Required
        </label>
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
        >
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
                  onClick={() =>
                    onChange({ ...field, options: field.options.filter((_, j) => j !== i) })
                  }
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
                fontFamily: "inherit",
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

/* ── Main Modal ── */
function ProgramModal({ program, onClose, onSaved }) {
  const [form, setForm] = useState(
    program || {
      title: "",
      short_description: "",
      banner_image: "",
      logo: "",
      status: "draft",
      content_type: "rich_editor",
      ai_raw_input: "",
      ai_content: "",
      rich_blocks: [],
      custom_form_fields: [],
      application_deadline: "",
      tags: [],
      external_links: [],
    }
  );
  const [tagInput, setTagInput] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  // File state for uploads
  const [bannerFile, setBannerFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(program?.banner_image || "");
  const [logoPreview, setLogoPreview] = useState(program?.logo || "");
  const bannerRef = useRef();
  const logoRef = useRef();

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "banner") { setBannerFile(file); setBannerPreview(url); }
    else { setLogoFile(file); setLogoPreview(url); }
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

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
      toast.error("Please enter some text first");
      return;
    }
    setGenerating(true);
    try {
      const r = await axios.post("/programs/admin/ai-generate", {
        raw_text: form.ai_raw_input,
      });
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
    setSaving(true);
    try {
      // Build multipart FormData — backend expects files + stringified JSON fields
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("short_description", form.short_description || "");
      fd.append("status", form.status);
      fd.append("content_type", form.content_type);
      fd.append("ai_raw_input", form.ai_raw_input || "");
      fd.append("ai_content", form.ai_content || "");
      fd.append("application_deadline", form.application_deadline || "");
      fd.append("rich_blocks", JSON.stringify(form.rich_blocks));
      fd.append("custom_form_fields", JSON.stringify(form.custom_form_fields));
      fd.append("tags", JSON.stringify(form.tags));
      fd.append("external_links", JSON.stringify(form.external_links || []));
      if (bannerFile) fd.append("banner_image", bannerFile);
      if (logoFile) fd.append("logo", logoFile);

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      let r;
      if (program?._id) {
        r = await axios.put(`/programs/admin/${program._id}`, fd, config);
      } else {
        r = await axios.post("/programs/admin", fd, config);
      }
      if (r.data.status === 1) {
        toast.success(program?._id ? "Program updated!" : "Program created!");
        onSaved(r.data.program);
      } else {
        toast.error(r.data.msg || "Save failed");
      }
    } catch {
      toast.error("Something went wrong");
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
        background: "rgba(0,0,0,0.7)",
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
        {/* Drawer header */}
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
            {program?._id ? "Edit Program" : "Create Program"}
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
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
              {saving ? "Saving…" : program?._id ? "Update Program" : "Create Program"}
            </button>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {/* Basic Info */}
          <div style={s.section}>
            <div style={s.sectionTitle}><Award size={15} color="#6366f1" /> Basic Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={s.label}>Program Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} style={s.input} placeholder="e.g. Startup Launchpad 2026" />
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                  {STATUS_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Short Description</label>
              <textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} style={{ ...s.input, resize: "vertical" }} placeholder="Brief tagline shown on the program card…" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Banner Image Upload */}
              <div>
                <label style={s.label}>Banner Image</label>
                <div
                  onClick={() => bannerRef.current.click()}
                  style={{
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    minHeight: 90,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.03)",
                    position: "relative",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                >
                  {bannerPreview ? (
                    <>
                      <img src={bannerPreview} alt="banner" style={{ width: "100%", height: 90, objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                      >
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "#475569" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🖼️</div>
                      <div style={{ fontSize: 12 }}>Click to upload banner</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>JPG, PNG, WebP · Max 5 MB</div>
                    </div>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e, "banner")} />
              </div>

              {/* Logo Upload */}
              <div>
                <label style={s.label}>Program Logo</label>
                <div
                  onClick={() => logoRef.current.click()}
                  style={{
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    minHeight: 90,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.03)",
                    position: "relative",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="logo" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 10 }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                      >
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change Logo</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", color: "#475569" }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>🏷️</div>
                      <div style={{ fontSize: 12 }}>Click to upload logo</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>JPG, PNG, WebP · Max 5 MB</div>
                    </div>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e, "logo")} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={s.label}>Application Deadline</label>
                <input type="date" value={form.application_deadline ? form.application_deadline.slice(0, 10) : ""} onChange={(e) => set("application_deadline", e.target.value)} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Tags</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Add tag + Enter" style={{ ...s.input, flex: 1 }} />
                  <button onClick={addTag} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>+</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {form.tags.map((t) => (
                    <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", padding: "3px 9px", borderRadius: 20, fontSize: 12 }}>
                      {t}
                      <button onClick={() => set("tags", form.tags.filter((x) => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 0 }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* External Links */}
            <div style={{ marginTop: 14 }}>
              <label style={s.label}>External Links</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Link label (e.g. Official Website)"
                  style={{ ...s.input, flex: 1.2, minWidth: 140 }}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                />
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL (e.g. https://example.com)"
                  style={{ ...s.input, flex: 2, minWidth: 160 }}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                />
                <button
                  onClick={addLink}
                  style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: 8, padding: "0 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  + Add
                </button>
              </div>
              {(form.external_links || []).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {(form.external_links || []).map((lnk, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🔗 {lnk.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", flex: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lnk.url}
                      </div>
                      <button
                        onClick={() => removeLink(i)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2, flexShrink: 0 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={s.section}>
            <div style={s.sectionTitle}><FileText size={15} color="#6366f1" /> Program Content</div>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
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
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13 }}>
                      <MIcon size={14} /> {m.label}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 3, opacity: 0.75 }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>

            {form.content_type === "ai_text" ? (
              <div>
                <label style={s.label}>Raw Input (paste your content)</label>
                <textarea
                  value={form.ai_raw_input}
                  onChange={(e) => set("ai_raw_input", e.target.value)}
                  rows={6}
                  style={{ ...s.input, resize: "vertical", marginBottom: 10 }}
                  placeholder="Paste your program details here in any format. AI will structure and format it beautifully…"
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
                    padding: "9px 18px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: generating ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: generating ? 0.7 : 1,
                    marginBottom: 16,
                  }}
                >
                  {generating ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 size={14} />}
                  {generating ? "Generating…" : "Generate with AI"}
                </button>

                {form.ai_content && (
                  <div>
                    <div style={{ ...s.label, marginBottom: 10 }}>Preview (editable)</div>
                    <textarea
                      value={form.ai_content}
                      onChange={(e) => set("ai_content", e.target.value)}
                      rows={10}
                      style={{ ...s.input, resize: "vertical", fontFamily: "monospace", fontSize: 12.5 }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                {form.rich_blocks.map((block) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onChange={(updated) => updateBlock(block.id, updated)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {["heading", "paragraph", "faq"].map((type) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 12.5,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <Plus size={13} /> {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Form Fields */}
          <div style={{ marginBottom: 24 }}>
            <div style={s.sectionTitle}><LayoutList size={15} color="#6366f1" /> Custom Application Form Fields</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
              These fields will appear in Step 2 of the application form.
            </div>
            {form.custom_form_fields.map((field) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(updated) => updateField(field.id, updated)}
                onDelete={() => deleteField(field.id)}
              />
            ))}
            <button
              onClick={addField}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(99,102,241,0.1)",
                border: "1px dashed rgba(99,102,241,0.4)",
                color: "#a5b4fc",
                borderRadius: 8,
                padding: "9px 16px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Plus size={14} /> Add Form Field
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════
   Main AdminPrograms component
══════════════════════════════════ */
export default function AdminPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalProgram, setModalProgram] = useState(null); // null=closed, {}=create, {_id}=edit
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, [statusFilter]);

  const fetchPrograms = async () => {
    try {
      const r = await axios.get("/programs/admin", {
        params: { status: statusFilter },
      });
      if (r.data.status === 1) setPrograms(r.data.programs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this program and all its applications?")) return;
    setDeleting(id);
    try {
      const r = await axios.delete(`/programs/admin/${id}`);
      if (r.data.status === 1) {
        toast.success("Program deleted");
        setPrograms((prev) => prev.filter((p) => p._id !== id));
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setModalProgram(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setModalProgram(p);
    setShowModal(true);
  };

  const onSaved = (saved) => {
    setPrograms((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setShowModal(false);
  };

  return (
    <AdminLayout title="Programs">
      <div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
              Programs
            </h1>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 4 }}>
              {programs.length} program{programs.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                color: "#94a3b8",
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={openCreate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={16} /> New Program
            </button>
          </div>
        </div>

        {/* Program cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            Loading programs…
          </div>
        ) : programs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#64748b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Award size={40} color="#1e293b" />
            <div style={{ fontWeight: 600, fontSize: 16 }}>No programs yet</div>
            <div style={{ fontSize: 14 }}>Create your first program to get started.</div>
            <button
              onClick={openCreate}
              style={{
                marginTop: 8,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 22px",
                fontWeight: 600,
                fontSize: 13.5,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Create Program
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {programs.map((p) => {
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={p._id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                >
                  {/* Banner / logo */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 10,
                      background: p.banner_image ? `url(${p.banner_image}) center/cover no-repeat` : "rgba(99,102,241,0.15)",
                      flexShrink: 0,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.07)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!p.banner_image && <Award size={24} color="#6366f1" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", marginBottom: 3 }}>
                      {p.title}
                    </div>
                    {p.short_description && (
                      <div style={{ fontSize: 12.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.short_description}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: sc.bg,
                          color: sc.color,
                          border: `1px solid ${sc.border}`,
                        }}
                      >
                        {p.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        {p.content_type === "ai_text" ? "✨ AI Text" : "🧱 Rich Editor"}
                      </span>
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        {p.custom_form_fields?.length || 0} form field{p.custom_form_fields?.length !== 1 ? "s" : ""}
                      </span>
                      {p.application_deadline && (
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          Deadline: {new Date(p.application_deadline).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/admin/programs/${p._id}/applications`)}
                      title="View Applications"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        color: "#a5b4fc",
                        borderRadius: 8,
                        padding: "7px 12px",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontFamily: "inherit",
                        fontWeight: 600,
                      }}
                    >
                      <Users size={14} /> Applications
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                        borderRadius: 8,
                        padding: "7px 10px",
                        cursor: "pointer",
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deleting === p._id}
                      title="Delete"
                      style={{
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        color: "#f87171",
                        borderRadius: 8,
                        padding: "7px 10px",
                        cursor: "pointer",
                      }}
                    >
                      {deleting === p._id ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer Modal */}
      {showModal && (
        <ProgramModal
          program={modalProgram}
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

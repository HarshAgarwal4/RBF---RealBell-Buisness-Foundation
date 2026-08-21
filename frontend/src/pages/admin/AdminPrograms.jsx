import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Award,
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

/* ── Form field editor ── */
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
          style={{ ...inputStyle, width: 140 }}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "var(--admin-text-subtle, #94a3b8)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            style={{ accentColor: "#6366f1" }}
          />
          Req
        </label>
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
        >
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
                  onClick={() =>
                    onChange({ ...field, options: field.options.filter((_, j) => j !== i) })
                  }
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
        {/* Drawer header */}
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
            {program?._id ? "Edit Program" : "Create Program"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ padding: "6px 14px", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : program?._id ? "Update Program" : "Create Program"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-text-subtle, #94a3b8)" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Basic Info */}
          <div style={s.section}>
            <div style={s.sectionTitle}><Award size={14} color="#6366f1" /> Basic Information</div>
            <div className="admin-grid-2col" style={{ marginBottom: 12 }}>
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
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Short Description</label>
              <textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} style={{ ...s.input, resize: "vertical" }} placeholder="Brief tagline shown on card…" />
            </div>
            <div className="admin-grid-2col" style={{ marginBottom: 12 }}>
              {/* Banner Upload */}
              <div>
                <label style={s.label}>Banner Image</label>
                <div
                  onClick={() => bannerRef.current.click()}
                  style={{
                    border: "1.5px dashed var(--admin-border-subtle, rgba(255,255,255,0.15))",
                    borderRadius: 8,
                    minHeight: 80,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
                    position: "relative",
                  }}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="banner" style={{ width: "100%", height: 80, objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "#475569", padding: 8 }}>
                      <div style={{ fontSize: 18 }}>🖼️</div>
                      <div style={{ fontSize: 11 }}>Click to upload banner</div>
                    </div>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, "banner")} />
              </div>

              {/* Logo Upload */}
              <div>
                <label style={s.label}>Program Logo</label>
                <div
                  onClick={() => logoRef.current.click()}
                  style={{
                    border: "1.5px dashed var(--admin-border-subtle, rgba(255,255,255,0.15))",
                    borderRadius: 8,
                    minHeight: 80,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
                    position: "relative",
                  }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "#475569", padding: 8 }}>
                      <div style={{ fontSize: 18 }}>🏷️</div>
                      <div style={{ fontSize: 11 }}>Click to upload logo</div>
                    </div>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFileChange(e, "logo")} />
              </div>
            </div>
            <div className="admin-grid-2col">
              <div>
                <label style={s.label}>Application Deadline</label>
                <input type="date" value={form.application_deadline ? form.application_deadline.slice(0, 10) : ""} onChange={(e) => set("application_deadline", e.target.value)} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Tags</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Add tag + Enter" style={{ ...s.input, flex: 1 }} />
                  <button onClick={addTag} className="admin-btn admin-btn-secondary" style={{ padding: "0 10px", fontSize: 12 }}>+</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {form.tags.map((t) => (
                    <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>
                      {t}
                      <button onClick={() => set("tags", form.tags.filter((x) => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "#a5b4fc", padding: 0 }}><X size={9} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={s.section}>
            <div style={s.sectionTitle}><FileText size={14} color="#6366f1" /> Program Content</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {CONTENT_MODES.map((m) => {
                const MIcon = m.icon;
                const active = form.content_type === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => set("content_type", m.key)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: active ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
                      background: active ? "rgba(99,102,241,0.12)" : "var(--admin-card-bg, rgba(255,255,255,0.03))",
                      color: active ? "#a5b4fc" : "var(--admin-text-subtle, #64748b)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                      <MIcon size={13} /> {m.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {form.content_type === "ai_text" ? (
              <div>
                <label style={s.label}>Raw Input</label>
                <textarea
                  value={form.ai_raw_input}
                  onChange={(e) => set("ai_raw_input", e.target.value)}
                  rows={5}
                  style={{ ...s.input, resize: "vertical", marginBottom: 8 }}
                  placeholder="Paste details for AI formatting…"
                />
                <button onClick={generateAI} disabled={generating} className="admin-btn admin-btn-primary" style={{ padding: "6px 14px", fontSize: 12, marginBottom: 12 }}>
                  <Wand2 size={13} /> {generating ? "Generating…" : "Generate with AI"}
                </button>

                {form.ai_content && (
                  <div>
                    <div style={{ ...s.label, marginBottom: 6 }}>Preview (editable)</div>
                    <textarea
                      value={form.ai_content}
                      onChange={(e) => set("ai_content", e.target.value)}
                      rows={8}
                      style={{ ...s.input, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                {form.rich_blocks.map((block) => (
                  <BlockEditor key={block.id} block={block} onChange={(updated) => updateBlock(block.id, updated)} onDelete={() => deleteBlock(block.id)} />
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["heading", "paragraph", "faq"].map((type) => (
                    <button key={type} onClick={() => addBlock(type)} className="admin-btn admin-btn-secondary" style={{ padding: "5px 10px", fontSize: 11 }}>
                      <Plus size={12} /> {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Form Fields */}
          <div style={{ marginBottom: 20 }}>
            <div style={s.sectionTitle}><LayoutList size={14} color="#6366f1" /> Custom Application Form Fields</div>
            {form.custom_form_fields.map((field) => (
              <FieldEditor key={field.id} field={field} onChange={(updated) => updateField(field.id, updated)} onDelete={() => deleteField(field.id)} />
            ))}
            <button onClick={addField} className="admin-btn admin-btn-secondary" style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: 12 }}>
              <Plus size={13} /> Add Form Field
            </button>
          </div>
        </div>
      </div>
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
  const [modalProgram, setModalProgram] = useState(null);
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

  const openCreate = () => { setModalProgram(null); setShowModal(true); };
  const openEdit = (p) => { setModalProgram(p); setShowModal(true); };

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
    <AdminLayout title="Incubation Programs">
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--admin-text-primary, #f1f5f9)", margin: 0 }}>Incubation Programs</h1>
            <div style={{ fontSize: "0.8rem", color: "var(--admin-text-subtle, #64748b)", marginTop: 2 }}>
              {programs.length} incubation cohort{programs.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="admin-filter-bar" style={{ width: "auto", margin: 0 }}>
            <select className="admin-select-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={openCreate} className="admin-btn admin-btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
              <Plus size={15} /> New Program
            </button>
          </div>
        </div>

        {/* Program cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "var(--admin-text-subtle, #64748b)", fontSize: 13 }}>
            Loading programs…
          </div>
        ) : programs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--admin-text-subtle, #64748b)" }}>
            <Award size={36} color="#334155" />
            <div style={{ fontWeight: 600, fontSize: 15, marginTop: 8 }}>No Incubation Programs Found</div>
            <button onClick={openCreate} className="admin-btn admin-btn-primary" style={{ marginTop: 12, fontSize: 13 }}>
              Create Program
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {programs.map((p) => {
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={p._id}
                  style={{
                    background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
                    border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      background: p.banner_image ? `url(${p.banner_image}) center/cover no-repeat` : "rgba(99,102,241,0.15)",
                      flexShrink: 0,
                      overflow: "hidden",
                      border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.07))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!p.banner_image && <Award size={20} color="#6366f1" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text-primary, #f1f5f9)", marginBottom: 2 }}>
                      {p.title}
                    </div>
                    {p.short_description && (
                      <div style={{ fontSize: 12, color: "var(--admin-text-subtle, #64748b)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.short_description}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {p.status}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--admin-text-subtle, #475569)" }}>
                        {p.custom_form_fields?.length || 0} fields
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/admin/programs/${p._id}/applications`)} className="admin-btn admin-btn-secondary" style={{ padding: "5px 10px", fontSize: 12 }}>
                      <Users size={13} /> Apps
                    </button>
                    <button onClick={() => openEdit(p)} className="admin-btn admin-btn-secondary" style={{ padding: "5px 8px" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(p._id)} disabled={deleting === p._id} className="admin-btn admin-btn-danger" style={{ padding: "5px 8px" }}>
                      {deleting === p._id ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <ProgramModal program={modalProgram} onClose={() => setShowModal(false)} onSaved={onSaved} />}
    </AdminLayout>
  );
}

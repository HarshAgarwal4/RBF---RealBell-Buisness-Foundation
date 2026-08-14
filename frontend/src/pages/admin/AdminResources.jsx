import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios.jsx";
import { toast } from "react-toastify";
import { Trash2, Plus, Edit2, X, FileText, BookMarked, BarChart2, Newspaper, Video, Upload } from "lucide-react";

const RESOURCE_TABS = [
  { key: "contract", label: "Contracts & Legal Templates", icon: FileText, color: "#B91C1C" },
  { key: "glossary", label: "Glossary", icon: BookMarked, color: "#7C3AED" },
  { key: "report", label: "Reports", icon: BarChart2, color: "#0891B2" },
  { key: "news", label: "News", icon: Newspaper, color: "#D97706" },
  { key: "video", label: "Videos", icon: Video, color: "#059669" },
];

const CONTRACT_CATS = ["Business Partnership", "Employment Related", "Fund Raising", "NDA", "Web Policies"];
const REPORT_CATS = ["Market Research", "Startup Ecosystem", "Investment", "Technology", "Finance", "Policy & Regulation", "Industry Reports"];
const NEWS_CATS = ["Technology", "Finance & Investment", "Healthcare", "E-Commerce", "EdTech", "SaaS", "Clean Energy", "Agriculture", "Manufacturing", "Real Estate", "Advertising", "Aeronautics Aerospace & Defence", "Agriculture", "AI", "Airport Operations", "Banking & Finance", "Education", "Energy & Power", "Green Technology", "Travel & Tourism"];
const INDUSTRIES = ["Technology", "Finance & Investment", "Healthcare", "E-Commerce", "EdTech", "SaaS", "Clean Energy", "Agriculture", "Manufacturing", "Real Estate"];

/* ── Shared input style ── */
const iStyle = {
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#e2e8f0",
  fontSize: 13.5,
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

/* ── File drop zone ── */
function FileZone({ label, accept, file, onChange, hint }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
      <div
        style={{
          border: "2px dashed rgba(255,255,255,0.15)",
          borderRadius: 10,
          padding: "14px",
          textAlign: "center",
          cursor: "pointer",
          background: file ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
          position: "relative",
          transition: "border-color 0.15s",
        }}
      >
        <Upload size={18} color={file ? "#10b981" : "#64748b"} style={{ marginBottom: 4 }} />
        <div style={{ fontSize: 12, color: file ? "#10b981" : "#64748b" }}>
          {file ? file.name : hint || "Click to choose file"}
        </div>
        <input type="file" accept={accept} onChange={(e) => onChange(e.target.files[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
      </div>
    </label>
  );
}

/* ═══════════════════════ ADD / EDIT MODAL ═══════════════════════ */
function ResourceModal({ type, editItem, onClose, onSaved }) {
  const isEdit = !!editItem;
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(editItem?.title || "");
  const [description, setDescription] = useState(editItem?.description || "");
  const [category, setCategory] = useState(editItem?.category || CONTRACT_CATS[0]);
  const [letter, setLetter] = useState(editItem?.letter || "");
  const [definition, setDefinition] = useState(editItem?.definition || "");
  const [newsCategory, setNewsCategory] = useState(editItem?.newsCategory || NEWS_CATS[0]);
  const [sourceUrl, setSourceUrl] = useState(editItem?.sourceUrl || "");
  const [sourceName, setSourceName] = useState(editItem?.sourceName || "");
  const [publishedAt, setPublishedAt] = useState(editItem?.publishedAt ? new Date(editItem.publishedAt).toISOString().slice(0, 16) : "");
  const [videoUrl, setVideoUrl] = useState(editItem?.videoUrl || "");
  const [speaker, setSpeaker] = useState(editItem?.speaker || "");
  const [courtesy, setCourtesy] = useState(editItem?.courtesy || "");
  const [industry, setIndustry] = useState(editItem?.industry || INDUSTRIES[0]);

  const [mainFile, setMainFile] = useState(null);   // PDF / doc
  const [imageFile, setImageFile] = useState(null); // image

  const submit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");

    const fd = new FormData();
    fd.append("type", type);
    fd.append("title", title);
    if (description) fd.append("description", description);

    if (type === "contract") {
      fd.append("category", category);
      if (mainFile) fd.append("file", mainFile);
    }
    if (type === "glossary") {
      fd.append("letter", letter.toUpperCase());
      fd.append("definition", definition);
    }
    if (type === "report") {
      fd.append("category", category);
      if (mainFile) fd.append("file", mainFile);
    }
    if (type === "news") {
      fd.append("newsCategory", newsCategory);
      if (sourceUrl) fd.append("sourceUrl", sourceUrl);
      if (sourceName) fd.append("sourceName", sourceName);
      if (publishedAt) fd.append("publishedAt", publishedAt);
      if (imageFile) fd.append("image", imageFile);
    }
    if (type === "video") {
      fd.append("videoUrl", videoUrl);
      if (speaker) fd.append("speaker", speaker);
      if (courtesy) fd.append("courtesy", courtesy);
      fd.append("industry", industry);
      if (imageFile) fd.append("image", imageFile); // custom thumbnail
    }

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await axios.put(`/resources/${editItem._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        res = await axios.post("/resources", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success(isEdit ? "Updated!" : "Added!");
      onSaved(res.data.resource, isEdit);
      onClose();
    } catch { toast.error("Failed to save"); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#151827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: 540, maxWidth: "96vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{isEdit ? "Edit" : "Add"} {RESOURCE_TABS.find((t) => t.key === type)?.label}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} style={iStyle} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...iStyle, resize: "vertical" }} />

          {/* Contract fields */}
          {type === "contract" && <>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={iStyle}>
              {CONTRACT_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <FileZone label={isEdit ? "Replace File (PDF/DOC)" : "Upload File (PDF/DOC) *"} accept=".pdf,.doc,.docx,.xls,.xlsx" file={mainFile} onChange={setMainFile} hint={isEdit && editItem?.fileName ? `Current: ${editItem.fileName}` : "Click to choose file"} />
          </>}

          {/* Glossary fields */}
          {type === "glossary" && <>
            <input placeholder="Letter (A-Z) *" maxLength={1} value={letter} onChange={(e) => setLetter(e.target.value.toUpperCase())} style={iStyle} />
            <textarea placeholder="Definition *" value={definition} onChange={(e) => setDefinition(e.target.value)} rows={4} style={{ ...iStyle, resize: "vertical" }} />
          </>}

          {/* Report fields */}
          {type === "report" && <>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={iStyle}>
              {REPORT_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <FileZone label={isEdit ? "Replace File (PDF/DOC)" : "Upload File (PDF/DOC) *"} accept=".pdf,.doc,.docx,.xls,.xlsx" file={mainFile} onChange={setMainFile} hint={isEdit && editItem?.fileName ? `Current: ${editItem.fileName}` : "Click to choose file"} />
          </>}

          {/* News fields */}
          {type === "news" && <>
            <input placeholder="Source URL" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} style={iStyle} />
            <input placeholder="Source Name" value={sourceName} onChange={(e) => setSourceName(e.target.value)} style={iStyle} />
            <select value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)} style={iStyle}>
              {[...new Set(NEWS_CATS)].map((c) => <option key={c}>{c}</option>)}
            </select>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Published At</label>
              <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} style={iStyle} />
            </div>
            <FileZone label="Upload Cover Image" accept="image/*" file={imageFile} onChange={setImageFile} hint={isEdit && editItem?.imageUrl ? "Current image exists – choose to replace" : "Click to choose image"} />
          </>}

          {/* Video fields */}
          {type === "video" && <>
            <input placeholder="YouTube URL *" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={iStyle} />
            <input placeholder="Speaker(s)" value={speaker} onChange={(e) => setSpeaker(e.target.value)} style={iStyle} />
            <input placeholder="Courtesy" value={courtesy} onChange={(e) => setCourtesy(e.target.value)} style={iStyle} />
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} style={iStyle}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
            <FileZone label="Custom Thumbnail (optional – auto from YouTube)" accept="image/*" file={imageFile} onChange={setImageFile} hint={isEdit && editItem?.thumbnailUrl ? "Current thumbnail exists – choose to replace" : "Click to upload image"} />
          </>}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              {loading ? "Uploading..." : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════ RESOURCE TABLE ═══════════════════════ */
function ResourceTable({ type, color }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/resources", { params: { type, limit: 500 } });
      setItems(res.data.resources || []);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [type]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`/resources/${id}`);
      toast.success("Deleted");
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  const handleSaved = (resource, isEdit) => {
    if (isEdit) {
      setItems((prev) => prev.map((i) => i._id === resource._id ? resource : i));
    } else {
      setItems((prev) => [resource, ...prev]);
    }
  };

  const cellStyle = { padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13.5, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 };
  const headStyle = { padding: "12px 16px", fontWeight: 600, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "left" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>{items.length} item{items.length !== 1 ? "s" : ""}</div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${color}cc, ${color}88)`, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13.5 }}
        >
          <Plus size={15} /> Add New
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>No items yet. Click "Add New" to create one.</div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headStyle}>Title</th>
                {(type === "contract" || type === "report") && <th style={headStyle}>Category</th>}
                {type === "glossary" && <th style={headStyle}>Letter</th>}
                {type === "news" && <th style={headStyle}>Category</th>}
                {type === "video" && <th style={headStyle}>Industry</th>}
                {(type === "contract" || type === "report") && <th style={headStyle}>File</th>}
                <th style={{ ...headStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} style={{ transition: "background 0.1s" }}>
                  <td style={cellStyle}>{item.title}</td>
                  {(type === "contract" || type === "report") && <td style={cellStyle}>{item.category}</td>}
                  {type === "glossary" && <td style={cellStyle}>{item.letter}</td>}
                  {type === "news" && <td style={cellStyle}>{item.newsCategory}</td>}
                  {type === "video" && <td style={cellStyle}>{item.industry}</td>}
                  {(type === "contract" || type === "report") && (
                    <td style={cellStyle}>
                      {item.fileUrl ? (
                        <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontSize: 12, textDecoration: "none" }}>
                          {item.fileName || "View file"}
                        </a>
                      ) : <span style={{ color: "#475569", fontSize: 12 }}>No file</span>}
                    </td>
                  )}
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button onClick={() => { setEditItem(item); setShowModal(true); }} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: 7, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item._id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", borderRadius: 7, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ResourceModal
          type={type}
          editItem={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function AdminResources() {
  const [activeTab, setActiveTab] = useState("contract");
  const active = RESOURCE_TABS.find((t) => t.key === activeTab);

  return (
    <AdminLayout title="Resources">
      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {RESOURCE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", border: "none", borderBottom: isActive ? `3px solid ${tab.color}` : "3px solid transparent", background: "none", cursor: "pointer", color: isActive ? tab.color : "#64748b", fontWeight: isActive ? 700 : 500, fontSize: 13.5, transition: "all 0.15s", fontFamily: "inherit" }}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <ResourceTable key={activeTab} type={activeTab} color={active?.color || "#6366f1"} />
    </AdminLayout>
  );
}

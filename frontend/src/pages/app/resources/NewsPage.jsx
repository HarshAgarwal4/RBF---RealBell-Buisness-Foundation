import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { Search, Plus, Trash2, Tag, Calendar, Upload } from "lucide-react";
import { useStore } from "../../../zustand/store";
import axios from "../../../services/axios.jsx";
import { toast } from "react-toastify";

const NEWS_CATEGORIES = [
  "All",
  "Advertising",
  "Aeronautics Aerospace & Defence",
  "Agriculture",
  "AI",
  "Airport Operations",
  "Banking & Finance",
  "Education",
  "Energy & Power",
  "Green Technology",
  "Healthcare",
  "Real Estate",
  "Technology",
  "Travel & Tourism",
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function NewsCard({ item, isAdmin, onDelete }) {
  return (
    <div
      style={{ display: "flex", gap: 16, background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #F0F0F5", cursor: item.sourceUrl ? "pointer" : "default", transition: "box-shadow 0.15s" }}
      onClick={() => item.sourceUrl && window.open(item.sourceUrl, "_blank")}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.10)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)")}
    >
      <div style={{ width: 120, height: 80, borderRadius: 10, background: "#F3F4F6", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 12, color: "#aaa" }}>No Image</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1a1a2e", marginBottom: 4, lineHeight: 1.4 }}>{item.title}</div>
        {item.description && (
          <div style={{ fontSize: 13, color: "#666", marginBottom: 8, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {item.description}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {item.sourceName && <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{item.sourceName}</span>}
          {item.publishedAt && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#aaa" }}>
              <Calendar size={12} /> {formatDate(item.publishedAt)}
            </span>
          )}
          {item.newsCategory && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: "#FEE2E2", color: COLORS.primary }}>
              <Tag size={10} /> {item.newsCategory}
            </span>
          )}
        </div>
      </div>
      {isAdmin && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4, flexShrink: 0 }}>
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ title: "", description: "", newsCategory: "Technology", sourceUrl: "", sourceName: "", publishedAt: "" });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required");

    const fd = new FormData();
    fd.append("type", "news");
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (imageFile) fd.append("image", imageFile);

    setLoading(true);
    try {
      const res = await axios.post("/resources", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("News added!");
      onAdded(res.data.resource);
      onClose();
    } catch { toast.error("Upload failed"); } finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 520, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Add News Article</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Title *" value={form.title} onChange={f("title")} style={inputStyle} />
          <textarea placeholder="Description / Summary" value={form.description} onChange={f("description")} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          {/* Image upload */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Upload Cover Image (optional)</span>
            <div style={{ border: "2px dashed #e5e7eb", borderRadius: 10, padding: "14px", textAlign: "center", cursor: "pointer", background: imageFile ? "#F0FFF4" : "#FAFAFA", position: "relative" }}>
              <Upload size={18} color={imageFile ? "#16a34a" : "#aaa"} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, color: imageFile ? "#16a34a" : "#aaa" }}>{imageFile ? imageFile.name : "Click to choose image"}</div>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </div>
          </label>
          <input placeholder="Source URL (link to original article)" value={form.sourceUrl} onChange={f("sourceUrl")} style={inputStyle} />
          <input placeholder="Source Name (e.g. Zee News)" value={form.sourceName} onChange={f("sourceName")} style={inputStyle} />
          <select value={form.newsCategory} onChange={f("newsCategory")} style={inputStyle}>
            {NEWS_CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
          </select>
          <div>
            <label style={{ fontSize: 12, color: "#666", marginBottom: 4, display: "block" }}>Published At</label>
            <input type="datetime-local" value={form.publishedAt} onChange={f("publishedAt")} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtnStyle}>{loading ? "Uploading..." : "Add News"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

export default function NewsPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [news, setNews] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/resources", { params: { type: "news", limit: 200 } });
      setNews(res.data.resources || []);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  const filtered = news.filter((n) => {
    const matchCat = activeCategory === "All" || n.newsCategory === activeCategory;
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this article?")) return;
    try {
      await axios.delete(`/resources/${id}`);
      toast.success("Deleted");
      setNews((prev) => prev.filter((n) => n._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
      <Sidebar />
      <main style={{ marginLeft: 300, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 36px 0", display: "flex", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1a1a2e" }}>News</h1>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
            <input placeholder="Search news..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "9px 14px 9px 36px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13.5, outline: "none", width: 240 }} />
          </div>
          <div style={{ flex: 1 }} />
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} /> Add News
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 0, flex: 1, padding: "24px 36px 36px" }}>
          {/* Category sidebar */}
          <div style={{ width: 220, flexShrink: 0, marginRight: 28 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Category Filters</div>
              {NEWS_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setActiveCategory(c)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: activeCategory === c ? "#FEE2E2" : "none", color: activeCategory === c ? COLORS.primary : "#555", fontWeight: activeCategory === c ? 700 : 500, fontSize: 13.5, cursor: "pointer", textAlign: "left", marginBottom: 2, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8 }}>
                  {activeCategory === c && <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary }} />}
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80, color: "#bbb" }}>No news articles.{isAdmin && " Click 'Add News' to get started."}</div>
            ) : (
              filtered.map((item) => <NewsCard key={item._id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />)
            )}
          </div>
        </div>
      </main>
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdded={(r) => setNews((prev) => [r, ...prev])} />}
    </div>
  );
}

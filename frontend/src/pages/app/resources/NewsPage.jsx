import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { Search, Plus, Trash2, Tag, Calendar, Upload, Filter } from "lucide-react";
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
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white dark:bg-[#151D2E] rounded-2xl p-3.5 sm:p-4 border border-gray-100 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer overflow-hidden relative"
      onClick={() => item.sourceUrl && window.open(item.sourceUrl, "_blank")}
    >
      <div className="w-full sm:w-32 h-36 sm:h-24 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-gray-400">No Image</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-slate-100 mb-1 leading-snug">{item.title}</div>
        {item.description && (
          <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mb-2 line-clamp-2 leading-relaxed">
            {item.description}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {item.sourceName && <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{item.sourceName}</span>}
          {item.publishedAt && (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-gray-400 dark:text-slate-500">
              <Calendar size={12} /> {formatDate(item.publishedAt)}
            </span>
          )}
          {item.newsCategory && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-50 dark:bg-rose-950/40 text-[#8E1B2E] dark:text-rose-400">
              <Tag size={10} /> {item.newsCategory}
            </span>
          )}
        </div>
      </div>
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}
          className="absolute top-3 right-3 sm:static p-1 text-red-500 hover:text-red-700 transition cursor-pointer shrink-0"
          title="Delete article"
        >
          <Trash2 size={16} />
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: 520, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", maxHeight: "90vh", overflowY: "auto", color: COLORS.ink }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>Add News Article</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Title *" value={form.title} onChange={f("title")} style={inputStyle} />
          <textarea placeholder="Description / Summary" value={form.description} onChange={f("description")} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          {/* Image upload */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Upload Cover Image (optional)</span>
            <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: "14px", textAlign: "center", cursor: "pointer", background: "rgba(142, 27, 46, 0.08)", position: "relative" }}>
              <Upload size={18} color={imageFile ? "#16a34a" : "#aaa"} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, color: imageFile ? "#16a34a" : COLORS.muted }}>{imageFile ? imageFile.name : "Click to choose image"}</div>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </div>
          </label>
          <input placeholder="Source URL (link to original article)" value={form.sourceUrl} onChange={f("sourceUrl")} style={inputStyle} />
          <input placeholder="Source Name (e.g. Zee News)" value={form.sourceName} onChange={f("sourceName")} style={inputStyle} />
          <select value={form.newsCategory} onChange={f("newsCategory")} style={inputStyle}>
            {NEWS_CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
          </select>
          <div>
            <label style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4, display: "block" }}>Published At</label>
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

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-input-bg, #ffffff)", color: "var(--color-text-main, #0f172a)", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-card, #fff)", color: "var(--color-text-main, #0f172a)", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

export default function NewsPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    document.title = "Ecosystem News & Updates | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Stay informed with the latest startup press releases, funding announcements, and ecosystem news on RealBell Business Foundation."
    );
  }, []);

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
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-8 px-4 sm:px-6 lg:px-10 pb-10 min-h-screen flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 pt-4 pb-2 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.ink }}>News</h1>
            <div className="relative w-full sm:w-52">
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted }} />
              <input placeholder="Search news..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, padding: "9px 14px 9px 36px", fontSize: 13.5, width: "100%" }} />
            </div>
            <div className="relative w-full sm:w-44 flex items-center">
              <Filter size={14} style={{ position: "absolute", left: 12, color: COLORS.muted }} />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{ ...inputStyle, padding: "9px 14px 9px 34px", fontSize: 13.5, cursor: "pointer", appearance: "none", width: "100%" }}
              >
                {NEWS_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
              <Plus size={16} /> Add News
            </button>
          )}
        </div>

        {/* Feed */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 px-4 sm:px-6 lg:px-8 py-2">
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>No news articles.{isAdmin && " Click 'Add News' to get started."}</div>
          ) : (
            filtered.map((item) => <NewsCard key={item._id} item={item} isAdmin={isAdmin} onDelete={handleDelete} />)
          )}
        </div>
      </main>
      {showModal && isAdmin && <AddModal onClose={() => setShowModal(false)} onAdded={(r) => setNews((prev) => [r, ...prev])} />}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { Search, Plus, Trash2, Play, Filter, Upload } from "lucide-react";
import { useStore } from "../../../zustand/store";
import axios from "../../../services/axios.jsx";
import { toast } from "react-toastify";

const INDUSTRIES = [
  "All",
  "Technology",
  "Finance & Investment",
  "Healthcare",
  "E-Commerce",
  "EdTech",
  "SaaS",
  "Clean Energy",
  "Agriculture",
  "Manufacturing",
  "Real Estate",
];

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match ? match[1] : null;
}

function VideoCard({ item, isAdmin, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const ytId = getYouTubeId(item.videoUrl);
  const thumbnail = item.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  return (
    <div
      style={{ background: COLORS.card, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", transition: "box-shadow 0.15s, transform 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ position: "relative", paddingTop: "56.25%", background: "#1a1a2e", cursor: "pointer" }} onClick={() => setPlaying(true)}>
        {playing && ytId ? (
          <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title={item.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <>
            {thumbnail ? (
              <img src={thumbnail} alt={item.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#222" }}>
                <div style={{ fontSize: 28, color: "#fff" }}>▶</div>
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(185,28,28,0.4)" }}>
                <Play size={22} color="#fff" style={{ marginLeft: 3 }} />
              </div>
            </div>
          </>
        )}
      </div>
      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, lineHeight: 1.4 }}>{item.title}</div>
        {item.courtesy && <div style={{ fontSize: 12.5, color: COLORS.muted }}>Courtesy: <span style={{ color: COLORS.primary }}>{item.courtesy}</span></div>}
        {item.speaker && <div style={{ fontSize: 12.5, color: COLORS.textSubtle }}>Speaker: {item.speaker}</div>}
        {item.industry && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", alignSelf: "flex-start", marginTop: 4 }}>{item.industry}</span>}
      </div>
      {isAdmin && (
        <div style={{ padding: "0 18px 14px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onDelete(item._id)} style={{ background: "none", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: 8, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ title: "", videoUrl: "", speaker: "", courtesy: "", industry: "Technology", description: "" });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.videoUrl) return toast.error("Title and Video URL required");

    const fd = new FormData();
    fd.append("type", "video");
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    // Custom thumbnail upload (optional — auto-derived from YouTube if not uploaded)
    if (thumbnailFile) fd.append("image", thumbnailFile);

    setLoading(true);
    try {
      const res = await axios.post("/resources", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Video added!");
      onAdded(res.data.resource);
      onClose();
    } catch { toast.error("Upload failed"); } finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: 520, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", maxHeight: "90vh", overflowY: "auto", color: COLORS.ink }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>Add Video</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Title *" value={form.title} onChange={f("title")} style={inputStyle} />
          <input placeholder="YouTube URL *" value={form.videoUrl} onChange={f("videoUrl")} style={inputStyle} />
          <input placeholder="Speaker(s)" value={form.speaker} onChange={f("speaker")} style={inputStyle} />
          <input placeholder="Courtesy (e.g. www.youtube.com)" value={form.courtesy} onChange={f("courtesy")} style={inputStyle} />
          <select value={form.industry} onChange={f("industry")} style={inputStyle}>
            {INDUSTRIES.filter((i) => i !== "All").map((i) => <option key={i}>{i}</option>)}
          </select>
          <textarea placeholder="Description (optional)" value={form.description} onChange={f("description")} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          {/* Optional custom thumbnail */}
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Custom Thumbnail (optional – auto from YouTube)</span>
            <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: "14px", textAlign: "center", cursor: "pointer", background: "rgba(142, 27, 46, 0.08)", position: "relative" }}>
              <Upload size={18} color={thumbnailFile ? "#16a34a" : "#aaa"} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, color: thumbnailFile ? "#16a34a" : COLORS.muted }}>{thumbnailFile ? thumbnailFile.name : "Click to upload thumbnail image"}</div>
              <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </div>
          </label>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtnStyle}>{loading ? "Uploading..." : "Add Video"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-input-bg, #ffffff)", color: "var(--color-text-main, #0f172a)", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-card, #fff)", color: "var(--color-text-main, #0f172a)", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

export default function VideosPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    document.title = "Video Library & Masterclasses | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Watch recorded founder masterclasses, expert webinars, pitch presentations, and incubation tutorials on RealBell Business Foundation."
    );
  }, []);

  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/resources", { params: { type: "video", limit: 200 } });
      setVideos(res.data.resources || []);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  const filtered = videos.filter((v) => {
    const matchInd = industry === "All" || v.industry === industry;
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || (v.speaker || "").toLowerCase().includes(search.toLowerCase());
    return matchInd && matchSearch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await axios.delete(`/resources/${id}`);
      toast.success("Deleted");
      setVideos((prev) => prev.filter((v) => v._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-8 px-4 sm:px-6 lg:px-10 pb-10 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.ink }}>Videos</h1>
            <div className="relative w-full sm:w-52">
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted }} />
              <input placeholder="Search videos..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, padding: "9px 14px 9px 36px", fontSize: 13.5, width: "100%" }} />
            </div>
            <div className="relative w-full sm:w-44 flex items-center">
              <Filter size={14} style={{ position: "absolute", left: 12, color: COLORS.muted }} />
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ ...inputStyle, padding: "9px 14px 9px 34px", fontSize: 13.5, cursor: "pointer", appearance: "none", width: "100%" }}>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
              <Plus size={16} /> Add Video
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>No videos found.{isAdmin && " Click 'Add Video' to get started."}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((v) => <VideoCard key={v._id} item={v} isAdmin={isAdmin} onDelete={handleDelete} />)}
          </div>
        )}
      </main>
      {showModal && isAdmin && <AddModal onClose={() => setShowModal(false)} onAdded={(r) => setVideos((prev) => [r, ...prev])} />}
    </div>
  );
}

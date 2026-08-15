import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { Search, Download, Plus, Trash2, FileBarChart, Upload, Filter } from "lucide-react";
import { useStore } from "../../../zustand/store";
import axios from "../../../services/axios.jsx";
import { toast } from "react-toastify";

const CATEGORIES = [
  "All",
  "Market Research",
  "Startup Ecosystem",
  "Investment",
  "Technology",
  "Finance",
  "Policy & Regulation",
  "Industry Reports",
];

const CATEGORY_COLORS = {
  "Market Research": "#3B82F6",
  "Startup Ecosystem": "#8B5CF6",
  "Investment": "#10B981",
  "Technology": "#F59E0B",
  "Finance": "#EF4444",
  "Policy & Regulation": "#6366F1",
  "Industry Reports": "#EC4899",
};

function ReportCard({ item, isAdmin, onDelete, onDownload }) {
  const color = CATEGORY_COLORS[item.category] || COLORS.primary;
  return (
    <div
      style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #F0F0F5", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow 0.15s, transform 0.15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileBarChart size={22} color={color} />
        </div>
        {item.category && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: `${color}15`, color }}>{item.category}</span>
        )}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{item.title}</div>
        {item.fileName && <div style={{ fontSize: 12, color: "#999" }}>{item.fileName}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>{item.downloadCount || 0} downloads</span>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <button onClick={() => onDelete(item._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={15} /></button>
          )}
          <button onClick={() => onDownload(item)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${color}`, background: `${color}10`, color, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            <Download size={14} /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Market Research");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");
    if (!file) return toast.error("Please select a file to upload");

    const fd = new FormData();
    fd.append("type", "report");
    fd.append("title", title);
    fd.append("description", description);
    fd.append("category", category);
    fd.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("/resources", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Report added!");
      onAdded(res.data.resource);
      onClose();
    } catch { toast.error("Upload failed"); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Add Report</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
          </select>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Upload Report File (PDF / DOC) *</span>
            <div style={{ border: "2px dashed #e5e7eb", borderRadius: 10, padding: "18px 14px", textAlign: "center", cursor: "pointer", background: file ? "#F0FFF4" : "#FAFAFA", position: "relative" }}>
              <Upload size={22} color={file ? "#16a34a" : "#aaa"} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: file ? "#16a34a" : "#aaa" }}>{file ? file.name : "Click to choose file"}</div>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </div>
          </label>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtnStyle}>{loading ? "Uploading..." : "Add Report"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

export default function ReportsPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/resources", { params: { type: "report", limit: 200 } });
      setReports(res.data.resources || []);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = reports.filter((r) => {
    const matchCat = activeCategory === "All" || r.category === activeCategory;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await axios.delete(`/resources/${id}`);
      toast.success("Deleted");
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  const handleDownload = async (item) => {
    window.open(item.fileUrl, "_blank");
    try {
      await axios.patch(`/resources/${item._id}/download`, {});
      setReports((prev) => prev.map((r) => r._id === item._id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));
    } catch {/* silent */}
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-8 px-4 sm:px-6 lg:px-10 pb-10 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1a1a2e" }}>Reports</h1>
            <div className="relative w-full sm:w-52">
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
              <input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, width: "100%" }} />
            </div>
            <div className="relative w-full sm:w-48 flex items-center">
              <Filter size={14} style={{ position: "absolute", left: 12, color: "#aaa" }} />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{ padding: "9px 14px 9px 34px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13.5, outline: "none", background: "#fff", cursor: "pointer", appearance: "none", width: "100%" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
              <Plus size={16} /> Add Report
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>No reports found.{isAdmin && " Click 'Add Report' to upload one."}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((item) => (
              <ReportCard key={item._id} item={item} isAdmin={isAdmin} onDelete={handleDelete} onDownload={handleDownload} />
            ))}
          </div>
        )}
      </main>
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdded={(r) => setReports((prev) => [r, ...prev])} />}
    </div>
  );
}

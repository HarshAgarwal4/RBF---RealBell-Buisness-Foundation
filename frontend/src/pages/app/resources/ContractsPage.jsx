import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { FileText, Download, Search, Trash2, Plus, Upload } from "lucide-react";
import { useStore } from "../../../zustand/store";
import axios from "../../../services/axios.jsx";
import { toast } from "react-toastify";

const TABS = [
  "Business Partnership",
  "Employment Related",
  "Fund Raising",
  "NDA",
  "Web Policies",
];

/* ─── Contract Card ─── */
function ContractCard({ item, isAdmin, onDelete, onDownload }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 12,
        border: "1px solid #F0E8E8",
        background: "#fff",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(185,28,28,0.10)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={22} color="#B91C1C" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
        {item.fileName && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{item.fileName}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <button onClick={() => onDownload(item)} title="Download" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#B91C1C" }}>
          <Download size={18} />
        </button>
        <span style={{ fontSize: 11, color: "#aaa" }}>{item.downloadCount || 0}</span>
      </div>
      {isAdmin && (
        <button onClick={() => onDelete(item._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }} title="Delete">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

/* ─── Add Modal ─── */
function AddModal({ tab, onClose, onAdded }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");
    if (!file) return toast.error("Please select a PDF/DOC file");

    const fd = new FormData();
    fd.append("type", "contract");
    fd.append("title", title);
    fd.append("category", tab);
    fd.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("/resources", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Contract added!");
      onAdded(res.data.resource);
      onClose();
    } catch {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Add Contract — {tab}</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Upload File (PDF / DOC) *</span>
            <div
              style={{
                border: "2px dashed #e5e7eb",
                borderRadius: 10,
                padding: "18px 14px",
                textAlign: "center",
                cursor: "pointer",
                background: file ? "#F0FFF4" : "#FAFAFA",
                position: "relative",
              }}
            >
              <Upload size={22} color={file ? "#16a34a" : "#aaa"} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: file ? "#16a34a" : "#aaa" }}>
                {file ? file.name : "Click to choose file"}
              </div>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </div>
          </label>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtnStyle}>
              {loading ? "Uploading..." : "Add Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "inherit" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

/* ─── Page ─── */
export default function ContractsPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      const res = await axios.get("/resources", { params: { type: "contract", category: tab } });
      setData((prev) => ({ ...prev, [tab]: res.data.resources || [] }));
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchTab(activeTab); }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contract?")) return;
    try {
      await axios.delete(`/resources/${id}`);
      toast.success("Deleted");
      setData((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((x) => x._id !== id) }));
    } catch { toast.error("Failed to delete"); }
  };

  const handleDownload = async (item) => {
    window.open(item.fileUrl, "_blank");
    try {
      await axios.patch(`/resources/${item._id}/download`, {});
      setData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((x) => x._id === item._id ? { ...x, downloadCount: (x.downloadCount || 0) + 1 } : x),
      }));
    } catch {/* silent */}
  };

  const filtered = (data[activeTab] || []).filter((x) => !search || x.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
      <Sidebar />
      <main style={{ marginLeft: 300, flex: 1, padding: "36px 40px", minHeight: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1a1a2e" }}>Contracts &amp; Legal Templates</h1>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
            <input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, width: 220 }} />
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} /> Add Template
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e9ecef", marginBottom: 32 }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "11px 22px", border: "none", borderBottom: activeTab === tab ? `3px solid ${COLORS.primary}` : "3px solid transparent", background: "none", cursor: "pointer", fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? COLORS.primary : "#555", fontSize: 13.5, transition: "all 0.15s", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>{activeTab}</h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>No templates found.{isAdmin && " Click 'Add Template' to upload one."}</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filtered.map((item) => (
                <ContractCard key={item._id} item={item} isAdmin={isAdmin} onDelete={handleDelete} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <AddModal
          tab={activeTab}
          onClose={() => setShowModal(false)}
          onAdded={(r) => setData((prev) => ({ ...prev, [activeTab]: [r, ...(prev[activeTab] || [])] }))}
        />
      )}
    </div>
  );
}

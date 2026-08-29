import React, { useState, useEffect } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { FileText, Download, Search, Trash2, Plus, Upload, Filter } from "lucide-react";
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
        border: `1px solid ${COLORS.border}`,
        background: COLORS.card,
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(185,28,28,0.10)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(185,28,28,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={22} color="#F43F5E" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
        {item.fileName && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{item.fileName}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <button onClick={() => onDownload(item)} title="Download" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: COLORS.primary }}>
          <Download size={18} />
        </button>
        <span style={{ fontSize: 11, color: COLORS.muted }}>{item.downloadCount || 0}</span>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", color: COLORS.ink }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>Add Contract — {tab}</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Upload File (PDF / DOC) *</span>
            <div
              style={{
                border: `2px dashed ${COLORS.border}`,
                borderRadius: 10,
                padding: "18px 14px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(142, 27, 46, 0.08)",
                position: "relative",
              }}
            >
              <Upload size={22} color={file ? "#16a34a" : "#aaa"} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 13, color: file ? "#16a34a" : COLORS.muted }}>
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

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-input-bg, #ffffff)", color: "var(--color-text-main, #0f172a)", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-card, #fff)", color: "var(--color-text-main, #0f172a)", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

/* ─── Page ─── */
export default function ContractsPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    document.title = "Standard Legal Contracts & Templates | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Download standardized founder agreements, NDAs, term sheets, employment contracts, and web policy templates on RealBell Business Foundation."
    );
  }, []);

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
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-8 px-4 sm:px-6 lg:px-10 pb-10 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.ink }}>Contracts &amp; Legal Templates</h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-52">
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted }} />
              <input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, width: "100%" }} />
            </div>
            <div className="relative w-full sm:w-48 flex items-center">
              <Filter size={14} style={{ position: "absolute", left: 12, color: COLORS.muted }} />
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                style={{ ...inputStyle, padding: "9px 14px 9px 34px", fontSize: 13.5, cursor: "pointer", appearance: "none", width: "100%" }}
              >
                {TABS.map((tab) => (
                  <option key={tab} value={tab}>{tab}</option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
                <Plus size={16} /> Add Template
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#151D2E] border border-gray-100 dark:border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xs">
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>{activeTab}</h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>No templates found.{isAdmin && " Click 'Add Template' to upload one."}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <ContractCard key={item._id} item={item} isAdmin={isAdmin} onDelete={handleDelete} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && isAdmin && (
        <AddModal
          tab={activeTab}
          onClose={() => setShowModal(false)}
          onAdded={(r) => setData((prev) => ({ ...prev, [activeTab]: [r, ...(prev[activeTab] || [])] }))}
        />
      )}
    </div>
  );
}

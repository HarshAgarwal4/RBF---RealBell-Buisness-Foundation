import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios.jsx";
import { useStore } from "../../zustand/store.jsx";
import { isSuperAdmin, hasPermission } from "../../utils/rbac.js";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "cloud_devops", label: "Cloud & DevOps" },
  { id: "finance_payments", label: "Finance & Payments" },
  { id: "sales_marketing", label: "Sales & Marketing" },
  { id: "legal_compliance", label: "Legal & Compliance" },
  { id: "tools_software", label: "Software & Tools" },
  { id: "general", label: "General & Other" },
];

export default function AdminBusinessBooster() {
  const currentUser = useStore((s) => s.user);
  const isSuper = isSuperAdmin(currentUser);
  const canCreate = isSuper || hasPermission(currentUser, "booster.create");
  const canUpdate = isSuper || hasPermission(currentUser, "booster.update");
  const canDelete = isSuper || hasPermission(currentUser, "booster.delete");
  const canReview = isSuper || hasPermission(currentUser, "booster.review_claims");

  const [activeTab, setActiveTab] = useState("catalog"); // 'catalog' | 'applications'
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, totalApplications: 0, pendingApplications: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [perkModal, setPerkModal] = useState({ open: false, isEdit: false, item: null });
  const [reviewModal, setReviewModal] = useState({ open: false, application: null, status: "approved", assigned_code: "", admin_notes: "" });
  const [toast, setToast] = useState(null);

  // Perk Form State
  const [perkForm, setPerkForm] = useState({
    title: "",
    provider: "",
    category: "tools_software",
    tagline: "",
    description: "",
    perk_value: "",
    redemption_type: "manual_review",
    redemption_code: "",
    redemption_url: "",
    eligibility_criteria: "",
    featured: false,
    status: "active",
  });
  const [submittingPerk, setSubmittingPerk] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Perks
  const loadAdminPerks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await axios.get(`/booster/admin/all?${params.toString()}`);
      if (res.data.status === 1) {
        setItems(res.data.items || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error loading admin booster perks:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, searchQuery]);

  // Load Applications
  const loadAdminApplications = useCallback(async () => {
    try {
      const res = await axios.get("/booster/admin/applications");
      if (res.data.status === 1) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error("Error loading booster applications:", err);
    }
  }, []);

  useEffect(() => {
    loadAdminPerks();
    loadAdminApplications();
  }, [loadAdminPerks, loadAdminApplications]);

  // Open Create Perk Modal
  const openCreateModal = () => {
    setPerkForm({
      title: "",
      provider: "",
      category: "tools_software",
      tagline: "",
      description: "",
      perk_value: "",
      redemption_type: "manual_review",
      redemption_code: "",
      redemption_url: "",
      eligibility_criteria: "Open to all verified RealBell members",
      featured: false,
      status: "active",
    });
    setPerkModal({ open: true, isEdit: false, item: null });
  };

  // Open Edit Perk Modal
  const openEditModal = (item) => {
    setPerkForm({
      title: item.title || "",
      provider: item.provider || "",
      category: item.category || "tools_software",
      tagline: item.tagline || "",
      description: item.description || "",
      perk_value: item.perk_value || "",
      redemption_type: item.redemption_type || "manual_review",
      redemption_code: item.redemption_code || "",
      redemption_url: item.redemption_url || "",
      eligibility_criteria: item.eligibility_criteria || "",
      featured: Boolean(item.featured),
      status: item.status || "active",
    });
    setPerkModal({ open: true, isEdit: true, item });
  };

  // Save Perk (Create / Edit)
  const handleSavePerk = async (e) => {
    e.preventDefault();
    if (!perkForm.title.trim() || !perkForm.provider.trim()) {
      showToast("Title and Provider are required", "error");
      return;
    }

    setSubmittingPerk(true);
    try {
      if (perkModal.isEdit && perkModal.item) {
        const res = await axios.put(`/booster/admin/${perkModal.item._id}`, perkForm);
        if (res.data.status === 1) {
          showToast("Booster perk updated successfully");
          setPerkModal({ open: false, isEdit: false, item: null });
          loadAdminPerks();
        } else {
          showToast(res.data.msg || "Failed to update perk", "error");
        }
      } else {
        const res = await axios.post("/booster/admin/create", perkForm);
        if (res.data.status === 1) {
          showToast("Booster perk created successfully");
          setPerkModal({ open: false, isEdit: false, item: null });
          loadAdminPerks();
        } else {
          showToast(res.data.msg || "Failed to create perk", "error");
        }
      }
    } catch (err) {
      showToast(err.response?.data?.msg || "Error saving booster perk", "error");
    } finally {
      setSubmittingPerk(false);
    }
  };

  // Delete Perk
  const handleDeletePerk = async (id) => {
    if (!window.confirm("Are you sure you want to remove this booster perk?")) return;
    try {
      const res = await axios.delete(`/booster/admin/${id}`);
      if (res.data.status === 1) {
        showToast("Booster perk deleted");
        loadAdminPerks();
      } else {
        showToast(res.data.msg || "Failed to delete", "error");
      }
    } catch {
      showToast("Error deleting perk", "error");
    }
  };

  // Open Application Review Modal
  const openReviewModal = (app) => {
    setReviewModal({
      open: true,
      application: app,
      status: app.status || "approved",
      assigned_code: app.assigned_code || app.booster_id?.redemption_code || "",
      admin_notes: app.admin_notes || "",
    });
  };

  // Submit Application Review
  const handleReviewApplication = async (e) => {
    e.preventDefault();
    if (!reviewModal.application) return;

    try {
      const res = await axios.patch(
        `/booster/admin/applications/${reviewModal.application._id}/review`,
        {
          status: reviewModal.status,
          assigned_code: reviewModal.assigned_code,
          admin_notes: reviewModal.admin_notes,
        }
      );

      if (res.data.status === 1) {
        showToast("Application status updated successfully");
        setReviewModal({ open: false, application: null, status: "approved", assigned_code: "", admin_notes: "" });
        loadAdminApplications();
        loadAdminPerks();
      } else {
        showToast(res.data.msg || "Failed to update review", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.msg || "Error updating application review", "error");
    }
  };

  return (
    <AdminLayout title="Business Booster Kit">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "70px",
          right: "1.5rem",
          zIndex: 9999,
          padding: "0.65rem 1.25rem",
          borderRadius: "10px",
          fontFamily: "Inter,sans-serif",
          fontSize: "0.8rem",
          fontWeight: "600",
          background: toast.type === "error" ? "rgba(239,68,68,0.2)" : "rgba(52,211,153,0.2)",
          color: toast.type === "error" ? "#f87171" : "#34d399",
          border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(52,211,153,0.4)"}`,
          boxShadow: "0 12px 35px rgba(0,0,0,0.4)",
          backdropFilter: "blur(10px)"
        }}>
          {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--admin-text-primary, #f1f5f9)", letterSpacing: "-0.02em", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚡ Business Booster Kit</span>
            <span style={{ fontSize: "0.65rem", background: isSuper ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(52,211,153,0.2)", color: isSuper ? "#fff" : "#34d399", border: isSuper ? "none" : "1px solid rgba(52,211,153,0.4)", padding: "2px 8px", borderRadius: "99px", fontWeight: "700" }}>
              {isSuper ? "SUPER ADMIN" : "AUTHORIZED RBAC"}
            </span>
          </h1>
          <p style={{ color: "var(--admin-text-subtle, #64748b)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            Manage ecosystem partner perks, credits (AWS, Google Cloud, Razorpay, HubSpot), toolkits, and review user claim applications.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {canCreate && (
            <button
              onClick={openCreateModal}
              className="admin-btn admin-btn-primary"
              style={{ padding: "0.5rem 1.1rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              + Add Booster Perk
            </button>
          )}
          <button
            onClick={() => { loadAdminPerks(); loadAdminApplications(); }}
            className="admin-btn admin-btn-secondary"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.78rem" }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Metrics Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "0.65rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ padding: "0.75rem 0.9rem", borderRadius: "10px", background: "var(--admin-card-bg, rgba(255,255,255,0.03))", border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))", textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "#818cf8", fontWeight: "600", textTransform: "uppercase" }}>Total Perks</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#f1f5f9", marginTop: "0.2rem" }}>{stats.total}</div>
        </div>
        <div style={{ padding: "0.75rem 0.9rem", borderRadius: "10px", background: "var(--admin-card-bg, rgba(255,255,255,0.03))", border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))", textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "#34d399", fontWeight: "600", textTransform: "uppercase" }}>Active Perks</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#34d399", marginTop: "0.2rem" }}>{stats.active}</div>
        </div>
        <div style={{ padding: "0.75rem 0.9rem", borderRadius: "10px", background: "var(--admin-card-bg, rgba(255,255,255,0.03))", border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))", textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "#38bdf8", fontWeight: "600", textTransform: "uppercase" }}>Total Claims</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#38bdf8", marginTop: "0.2rem" }}>{stats.totalApplications}</div>
        </div>
        <div style={{ padding: "0.75rem 0.9rem", borderRadius: "10px", background: "var(--admin-card-bg, rgba(255,255,255,0.03))", border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))", textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "#fbbf24", fontWeight: "600", textTransform: "uppercase" }}>Pending Review</div>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fbbf24", marginTop: "0.2rem" }}>{stats.pendingApplications}</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("catalog")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "catalog" ? "rgba(99,102,241,0.2)" : "transparent",
            color: activeTab === "catalog" ? "#a5b4fc" : "#94a3b8",
            fontWeight: "700",
            fontSize: "0.78rem",
            cursor: "pointer"
          }}
        >
          ⚡ Perks & Toolkits Catalog ({items.length})
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "applications" ? "rgba(99,102,241,0.2)" : "transparent",
            color: activeTab === "applications" ? "#a5b4fc" : "#94a3b8",
            fontWeight: "700",
            fontSize: "0.78rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
        >
          <span>👥 User Claims & Reviews</span>
          {stats.pendingApplications > 0 && (
            <span style={{ background: "#fbbf24", color: "#000", fontSize: "0.65rem", fontWeight: "800", padding: "1px 5px", borderRadius: "99px" }}>
              {stats.pendingApplications}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: PERKS CATALOG (CRUD)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "catalog" && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="🔍 Search perk or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.74rem", minWidth: "200px" }}
              />

              <select
                className="admin-select-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.74rem" }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>

              <select
                className="admin-select-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.74rem" }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive / Draft</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="admin-table-container">
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading booster perks...</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    {["Provider & Perk Title", "Category", "Perk Value", "Redemption Type", "Claims", "Status", "Actions"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ maxWidth: "240px" }}>
                          <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "#818cf8", textTransform: "uppercase" }}>
                            {item.provider}
                          </div>
                          <div style={{ fontWeight: "600", color: "#f1f5f9", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.title}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.72rem", color: "#cbd5e1", textTransform: "capitalize" }}>
                          {item.category?.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "6px", background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontWeight: "700" }}>
                          {item.perk_value || "—"}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "capitalize" }}>
                          {item.redemption_type?.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "99px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontWeight: "700" }}>
                          👥 {item.claim_count || 0} claims
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "0.7rem", padding: "2px 7px", borderRadius: "99px", fontWeight: "700", textTransform: "uppercase", background: item.status === "active" ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)", color: item.status === "active" ? "#34d399" : "#f87171" }}>
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          {canUpdate && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="admin-btn admin-btn-secondary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePerk(item._id)}
                              className="admin-btn admin-btn-danger"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && items.length === 0 && (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                No booster perks found matching your filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: APPLICATIONS & CLAIMS REVIEW
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "applications" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                {["Applicant & Company", "Perk Claimed", "Date", "Status", "Voucher Code", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const perk = app.booster_id || {};
                return (
                  <tr key={app._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: "700", color: "#f1f5f9", fontSize: "0.8rem" }}>
                          {app.company_name || app.applicant_name}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          {app.email} {app.phone ? `• ${app.phone}` : ""}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ maxWidth: "200px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {perk.title || "Perk"}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#818cf8" }}>{perk.provider}</div>
                      </div>
                    </td>

                    <td style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {new Date(app.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    <td>
                      <span style={{
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        borderRadius: "99px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        background:
                          app.status === "approved" || app.status === "redeemed"
                            ? "rgba(52,211,153,0.15)"
                            : app.status === "pending"
                            ? "rgba(251,191,36,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color:
                          app.status === "approved" || app.status === "redeemed"
                            ? "#34d399"
                            : app.status === "pending"
                            ? "#fbbf24"
                            : "#f87171"
                      }}>
                        {app.status}
                      </span>
                    </td>

                    <td>
                      <code style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px", color: app.assigned_code ? "#34d399" : "#64748b" }}>
                        {app.assigned_code || "—"}
                      </code>
                    </td>

                    <td>
                      {canReview ? (
                        <button
                          onClick={() => openReviewModal(app)}
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                        >
                          Review / Assign
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>View only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {applications.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              No user claims or applications submitted yet.
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CREATE / EDIT PERK MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {perkModal.open && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setPerkModal({ open: false, isEdit: false, item: null })} style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(5px)",
          zIndex: 9990,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <form onSubmit={handleSavePerk} className="admin-modal-box" style={{
            background: "var(--admin-modal-bg, #111420)",
            border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#f1f5f9" }}>
                {perkModal.isEdit ? "✏️ Edit Booster Perk" : "⚡ Create New Booster Perk"}
              </h3>
              <button
                type="button"
                onClick={() => setPerkModal({ open: false, isEdit: false, item: null })}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Provider / Partner Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services / Razorpay"
                  value={perkForm.provider}
                  onChange={(e) => setPerkForm({ ...perkForm, provider: e.target.value })}
                  className="admin-search-input"
                  style={{ width: "100%", padding: "0.5rem 0.65rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Category
                </label>
                <select
                  className="admin-select-input"
                  value={perkForm.category}
                  onChange={(e) => setPerkForm({ ...perkForm, category: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem" }}
                >
                  <option value="cloud_devops">Cloud & DevOps</option>
                  <option value="finance_payments">Finance & Payments</option>
                  <option value="sales_marketing">Sales & Marketing</option>
                  <option value="legal_compliance">Legal & Compliance</option>
                  <option value="tools_software">Software & Tools</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Perk Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Activate Cloud Credits"
                  value={perkForm.title}
                  onChange={(e) => setPerkForm({ ...perkForm, title: e.target.value })}
                  className="admin-search-input"
                  style={{ width: "100%", padding: "0.5rem 0.65rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Perk Worth / Value Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. $5,000 Credits or 75% OFF"
                  value={perkForm.perk_value}
                  onChange={(e) => setPerkForm({ ...perkForm, perk_value: e.target.value })}
                  className="admin-search-input"
                  style={{ width: "100%", padding: "0.5rem 0.65rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Tagline / Short Summary
              </label>
              <input
                type="text"
                placeholder="Brief one-liner value proposition..."
                value={perkForm.tagline}
                onChange={(e) => setPerkForm({ ...perkForm, tagline: e.target.value })}
                className="admin-search-input"
                style={{ width: "100%", padding: "0.5rem 0.65rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Full Description & Inclusions
              </label>
              <textarea
                rows={3}
                placeholder="Details on what the partner offer includes..."
                value={perkForm.description}
                onChange={(e) => setPerkForm({ ...perkForm, description: e.target.value })}
                className="admin-search-input"
                style={{ width: "100%", padding: "0.5rem 0.65rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Redemption Mechanism
                </label>
                <select
                  className="admin-select-input"
                  value={perkForm.redemption_type}
                  onChange={(e) => setPerkForm({ ...perkForm, redemption_type: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem" }}
                >
                  <option value="manual_review">Manual Review by Admin</option>
                  <option value="coupon_code">Coupon / Voucher Code</option>
                  <option value="instant_unlock">Instant Unlock</option>
                  <option value="external_link">External Partner Link</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                  Default Voucher Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RBF-AWS-2026"
                  value={perkForm.redemption_code}
                  onChange={(e) => setPerkForm({ ...perkForm, redemption_code: e.target.value })}
                  className="admin-search-input"
                  style={{ width: "100%", padding: "0.5rem 0.65rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Partner Portal URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://aws.amazon.com/activate"
                value={perkForm.redemption_url}
                onChange={(e) => setPerkForm({ ...perkForm, redemption_url: e.target.value })}
                className="admin-search-input"
                style={{ width: "100%", padding: "0.5rem 0.65rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Eligibility Criteria
              </label>
              <input
                type="text"
                placeholder="e.g. Open to incorporated startups under 5 years old"
                value={perkForm.eligibility_criteria}
                onChange={(e) => setPerkForm({ ...perkForm, eligibility_criteria: e.target.value })}
                className="admin-search-input"
                style={{ width: "100%", padding: "0.5rem 0.65rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#cbd5e1", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={perkForm.featured}
                  onChange={(e) => setPerkForm({ ...perkForm, featured: e.target.checked })}
                />
                <span>⭐ Feature this perk on top</span>
              </label>

              <select
                className="admin-select-input"
                value={perkForm.status}
                onChange={(e) => setPerkForm({ ...perkForm, status: e.target.value })}
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.72rem" }}
              >
                <option value="active">Status: Active</option>
                <option value="inactive">Status: Inactive / Draft</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setPerkModal({ open: false, isEdit: false, item: null })}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPerk}
                className="admin-btn admin-btn-primary"
              >
                {submittingPerk ? "Saving..." : "Save Booster Perk"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          APPLICATION REVIEW MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {reviewModal.open && reviewModal.application && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setReviewModal({ open: false, application: null, status: "approved", assigned_code: "", admin_notes: "" })} style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(5px)",
          zIndex: 9990,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <form onSubmit={handleReviewApplication} className="admin-modal-box" style={{
            background: "var(--admin-modal-bg, #111420)",
            border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "520px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#f1f5f9" }}>
                Review User Perk Claim
              </h3>
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, application: null, status: "approved", assigned_code: "", admin_notes: "" })}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.1rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.85rem", borderRadius: "10px", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.6 }}>
              <div><strong>Company:</strong> {reviewModal.application.company_name || "—"}</div>
              <div><strong>Applicant:</strong> {reviewModal.application.applicant_name} ({reviewModal.application.email})</div>
              <div><strong>Perk:</strong> {reviewModal.application.booster_id?.title} ({reviewModal.application.booster_id?.provider})</div>
              {reviewModal.application.use_case_notes && (
                <div style={{ marginTop: "0.4rem", color: "#94a3b8" }}>
                  <strong>Use Case Notes:</strong> {reviewModal.application.use_case_notes}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Review Decision
              </label>
              <select
                className="admin-select-input"
                value={reviewModal.status}
                onChange={(e) => setReviewModal({ ...reviewModal, status: e.target.value })}
                style={{ width: "100%", padding: "0.5rem" }}
              >
                <option value="approved">Approve Claim & Grant Voucher</option>
                <option value="redeemed">Mark as Redeemed</option>
                <option value="pending">Keep in Pending Review</option>
                <option value="rejected">Reject Claim</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Assigned Voucher / Redemption Code
              </label>
              <input
                type="text"
                placeholder="e.g. RBF-AWS-COHORT-883"
                value={reviewModal.assigned_code}
                onChange={(e) => setReviewModal({ ...reviewModal, assigned_code: e.target.value })}
                className="admin-search-input"
                style={{ width: "100%", padding: "0.5rem 0.65rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.3rem" }}>
                Admin Notes for Applicant
              </label>
              <textarea
                rows={2}
                placeholder="Optional instructions or feedback for the user..."
                value={reviewModal.admin_notes}
                onChange={(e) => setReviewModal({ ...reviewModal, admin_notes: e.target.value })}
                className="admin-search-input"
                style={{ width: "100%", padding: "0.5rem 0.65rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setReviewModal({ open: false, application: null, status: "approved", assigned_code: "", admin_notes: "" })}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
              >
                Save & Update Decision
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

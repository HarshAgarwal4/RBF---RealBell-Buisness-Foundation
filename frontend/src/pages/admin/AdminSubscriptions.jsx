import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios.jsx";
import { useStore } from "../../zustand/store.jsx";
import { isSuperAdmin, hasPermission } from "../../utils/rbac.js";
import { AVAILABLE_SUBSCRIPTION_MODULES } from "../../config/subscriptionModules.js";

function Modal({ open, onClose, children, maxWidth = "600px" }) {
  if (!open) return null;
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(5px)",
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="admin-modal-box"
        style={{
          background: "var(--admin-modal-bg, #111420)",
          border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
          borderRadius: "16px",
          width: "100%",
          maxWidth,
          padding: "1.5rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
        border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
        borderRadius: "12px",
        padding: "0.85rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: `${color}18`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#f1f5f9", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", marginTop: "2px", textTransform: "uppercase" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function PlanModal({ open, onClose, onSave, plan }) {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    price: 0,
    interval: "monthly",
    tier_rank: 1,
    badge: "",
    accentColor: "#6366f1",
    status: "active",
    included_modules: [],
    custom_features: [],
  });

  const [newCustomLine, setNewCustomLine] = useState("");

  useEffect(() => {
    if (plan) {
      // Map existing plan modules or fallback to available defaults
      const existingModules = Array.isArray(plan.included_modules) && plan.included_modules.length > 0
        ? plan.included_modules
        : [];

      setFormData({
        name: plan.name || "",
        key: plan.key || "",
        description: plan.description || "",
        price: plan.price !== undefined ? plan.price : 0,
        interval: plan.interval || "monthly",
        tier_rank: plan.tier_rank || 1,
        badge: plan.badge || "",
        accentColor: plan.accentColor || "#6366f1",
        status: plan.status || "active",
        included_modules: existingModules,
        custom_features: Array.isArray(plan.custom_features) ? plan.custom_features : [],
      });
    } else {
      // Default new plan pre-populated with Starter modules
      setFormData({
        name: "",
        key: "",
        description: "",
        price: 0,
        interval: "monthly",
        tier_rank: 1,
        badge: "",
        accentColor: "#6366f1",
        status: "active",
        included_modules: AVAILABLE_SUBSCRIPTION_MODULES.slice(0, 5).map((m) => ({
          module_key: m.module_key,
          module_name: m.module_name,
          access_line: m.default_line,
          is_enabled: true,
        })),
        custom_features: [],
      });
    }
  }, [plan, open]);

  if (!open) return null;

  // Toggle Module inclusion
  const handleToggleModule = (mod) => {
    const exists = formData.included_modules.find((m) => m.module_key === mod.module_key);
    if (exists) {
      setFormData({
        ...formData,
        included_modules: formData.included_modules.filter((m) => m.module_key !== mod.module_key),
      });
    } else {
      setFormData({
        ...formData,
        included_modules: [
          ...formData.included_modules,
          {
            module_key: mod.module_key,
            module_name: mod.module_name,
            access_line: mod.default_line,
            is_enabled: true,
          },
        ],
      });
    }
  };

  // Edit access line for a module
  const handleEditAccessLine = (module_key, text) => {
    setFormData({
      ...formData,
      included_modules: formData.included_modules.map((m) =>
        m.module_key === module_key ? { ...m, access_line: text } : m
      ),
    });
  };

  // Remove access line / module
  const handleRemoveModule = (module_key) => {
    setFormData({
      ...formData,
      included_modules: formData.included_modules.filter((m) => m.module_key !== module_key),
    });
  };

  // Add custom feature line
  const handleAddCustomLine = () => {
    if (!newCustomLine.trim()) return;
    setFormData({
      ...formData,
      custom_features: [...formData.custom_features, newCustomLine.trim()],
    });
    setNewCustomLine("");
  };

  // Remove custom line
  const handleRemoveCustomLine = (index) => {
    setFormData({
      ...formData,
      custom_features: formData.custom_features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="680px">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#f1f5f9" }}>
              {plan ? "✏️ Edit Subscription Plan" : "⚡ Create Subscription Plan"}
            </h3>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "2px 0 0" }}>
              Configure pricing, tier rank, and predefined service access lines for user modules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Basic Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Plan Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pro Growth"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-search-input"
              style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.76rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Unique Plan Key (slug) *
            </label>
            <input
              type="text"
              required
              disabled={Boolean(plan)}
              placeholder="e.g. pro_growth"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="admin-search-input"
              style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.76rem", opacity: plan ? 0.6 : 1 }}
            />
          </div>
        </div>

        {/* Price & Billing Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Price (INR ₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="0 for free"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="admin-search-input"
              style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.76rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Billing Interval
            </label>
            <select
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
              className="admin-select-input"
              style={{ width: "100%", padding: "0.45rem", fontSize: "0.76rem" }}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One Time</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Tier Rank (Upgrade order)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              placeholder="1 (Free), 2 (Pro), 3 (VIP)"
              value={formData.tier_rank}
              onChange={(e) => setFormData({ ...formData, tier_rank: parseInt(e.target.value, 10) || 1 })}
              className="admin-search-input"
              style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.76rem" }}
            />
          </div>
        </div>

        {/* Badge & Status Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Badge Tag (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Most Popular / Best Value"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="admin-search-input"
              style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.76rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Accent Color
            </label>
            <input
              type="color"
              value={formData.accentColor}
              onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
              style={{ width: "100%", height: "34px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
              Plan Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="admin-select-input"
              style={{ width: "100%", padding: "0.45rem", fontSize: "0.76rem" }}
            >
              <option value="active">Active (Purchasable)</option>
              <option value="disabled">Disabled (Legacy)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "#818cf8", fontWeight: "700", marginBottom: "0.25rem" }}>
            Short Description
          </label>
          <input
            type="text"
            placeholder="e.g. Accelerated features for growing startups, active mentors, and founders..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="admin-search-input"
            style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.76rem" }}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            DYNAMIC MODULE & SERVICE ACCESS LINES CONFIGURATION
           ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#f1f5f9", display: "block" }}>
                📦 Included Services & Predefined Access Lines
              </span>
              <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                Select modules from the user sidebar to automatically include their access line. You can edit, keep, or delete each line.
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "2px 8px", borderRadius: "99px" }}>
              {formData.included_modules.length} Modules Included
            </span>
          </div>

          {/* Module Selector Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
            {AVAILABLE_SUBSCRIPTION_MODULES.map((mod) => {
              const isIncluded = formData.included_modules.some((m) => m.module_key === mod.module_key);
              return (
                <button
                  key={mod.module_key}
                  type="button"
                  onClick={() => handleToggleModule(mod)}
                  style={{
                    padding: "0.3rem 0.6rem",
                    borderRadius: "8px",
                    border: isIncluded ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                    background: isIncluded ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.02)",
                    color: isIncluded ? "#c7d2fe" : "#94a3b8",
                    fontSize: "0.7rem",
                    fontWeight: isIncluded ? "700" : "500",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isIncluded ? "✓ " : "+ "}
                  {mod.module_name}
                </button>
              );
            })}
          </div>

          {/* Active Configured Access Lines List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
            {formData.included_modules.map((m) => (
              <div
                key={m.module_key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "0.4rem 0.6rem",
                }}
              >
                <div style={{ minWidth: "120px", fontSize: "0.7rem", fontWeight: "700", color: "#818cf8" }}>
                  {m.module_name}
                </div>
                <input
                  type="text"
                  value={m.access_line}
                  onChange={(e) => handleEditAccessLine(m.module_key, e.target.value)}
                  className="admin-search-input"
                  style={{ flex: 1, padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveModule(m.module_key)}
                  title="Remove this access line"
                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                >
                  ✕
                </button>
              </div>
            ))}

            {formData.included_modules.length === 0 && (
              <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.72rem", color: "#64748b" }}>
                No modules selected yet. Click modules above to add predefined access lines.
              </div>
            )}
          </div>

          {/* Custom Feature Lines Section */}
          <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#cbd5e1", marginBottom: "0.4rem" }}>
              + Additional Custom Feature Lines
            </div>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                placeholder="e.g. Dedicated Account Manager or Syndicate Deal Flow Access..."
                value={newCustomLine}
                onChange={(e) => setNewCustomLine(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomLine())}
                className="admin-search-input"
                style={{ flex: 1, padding: "0.35rem 0.6rem", fontSize: "0.72rem" }}
              />
              <button
                type="button"
                onClick={handleAddCustomLine}
                className="admin-btn admin-btn-secondary"
                style={{ padding: "0.35rem 0.8rem", fontSize: "0.72rem" }}
              >
                Add Line
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {formData.custom_features.map((feat, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.68rem",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>{feat}</span>
                  <span
                    onClick={() => handleRemoveCustomLine(idx)}
                    style={{ cursor: "pointer", color: "#f87171", fontWeight: "bold" }}
                  >
                    ✕
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button type="button" onClick={onClose} className="admin-btn admin-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="admin-btn admin-btn-primary">
            {plan ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminSubscriptions() {
  const currentUser = useStore((s) => s.user);
  const isSuper = isSuperAdmin(currentUser);
  const canManage = isSuper || hasPermission(currentUser, "subscriptions.create") || hasPermission(currentUser, "subscriptions.update");

  const [activeTab, setActiveTab] = useState("plans"); // 'plans' | 'transactions'
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, activeSubs: 0, totalTxns: 0, totalPlans: 0 });
  const [loading, setLoading] = useState(true);

  // Modals & Feedback
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, txnsRes, statsRes] = await Promise.all([
        axios.get("/plans/admin"),
        axios.get("/payment/admin/transactions"),
        axios.get("/payment/admin/stats"),
      ]);

      if (plansRes.data.status === 1) setPlans(plansRes.data.plans || []);
      if (txnsRes.data.status === 1) setTransactions(txnsRes.data.transactions || []);
      if (statsRes.data.status === 1) setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error("Error loading subscription admin data:", err);
      showToast("Failed to load subscription plans", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save Plan
  const handleSavePlan = async (formData) => {
    try {
      if (editingPlan) {
        const res = await axios.put(`/plans/admin/${editingPlan._id}`, formData);
        if (res.data.status === 1) {
          showToast("Subscription plan updated successfully");
          setPlanModalOpen(false);
          setEditingPlan(null);
          loadData();
        } else {
          showToast(res.data.msg || "Failed to update plan", "error");
        }
      } else {
        const res = await axios.post("/plans/admin", formData);
        if (res.data.status === 1) {
          showToast("Subscription plan created successfully");
          setPlanModalOpen(false);
          loadData();
        } else {
          showToast(res.data.msg || "Failed to create plan", "error");
        }
      }
    } catch (err) {
      showToast(err.response?.data?.msg || "Error saving plan", "error");
    }
  };

  // Toggle Plan Status (Active vs. Disabled / Legacy)
  const handleToggleStatus = async (plan) => {
    try {
      const res = await axios.patch(`/plans/admin/${plan._id}/status`);
      if (res.data.status === 1) {
        showToast(res.data.msg);
        loadData();
      } else {
        showToast(res.data.msg || "Failed to toggle status", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.msg || "Error toggling plan status", "error");
    }
  };

  // Delete Plan (Permanent if 0 purchases, otherwise prompt disable)
  const handleDeletePlan = async (plan) => {
    if (!plan.can_delete) {
      alert(
        `Cannot delete plan "${plan.name}": It has already been purchased by ${plan.purchased_count || plan.active_subscribers} user(s).\n\nPlease use "Disable Plan" instead so existing owners keep their benefits as a Legacy Subscription.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete plan "${plan.name}"? (0 subscribers registered)`)) return;

    try {
      const res = await axios.delete(`/plans/admin/${plan._id}`);
      if (res.data.status === 1) {
        showToast(res.data.msg);
        loadData();
      } else {
        showToast(res.data.msg || "Failed to delete plan", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.msg || "Error deleting plan", "error");
    }
  };

  return (
    <AdminLayout title="Subscription Plans">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
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
            backdropFilter: "blur(10px)",
          }}
        >
          {toast.type === "error" ? "✕ " : "✓ "}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>💳 Subscription Management</span>
            <span style={{ fontSize: "0.65rem", background: isSuper ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(52,211,153,0.2)", color: isSuper ? "#fff" : "#34d399", border: isSuper ? "none" : "1px solid rgba(52,211,153,0.4)", padding: "2px 8px", borderRadius: "99px", fontWeight: "700" }}>
              {isSuper ? "SUPER ADMIN" : "AUTHORIZED RBAC"}
            </span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.2rem" }}>
            Manage pricing tiers, configure predefined access lines for user sidebar modules, handle upgrades, and manage legacy subscriptions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {canManage && (
            <button
              onClick={() => { setEditingPlan(null); setPlanModalOpen(true); }}
              className="admin-btn admin-btn-primary"
              style={{ padding: "0.5rem 1.1rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              + Create Subscription Plan
            </button>
          )}
          <button onClick={loadData} className="admin-btn admin-btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.78rem" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.65rem", marginBottom: "1.5rem" }}>
        <StatCard icon="💰" label="Total Revenue" value={`₹${stats.totalRevenue?.toLocaleString("en-IN") || 0}`} color="#10b981" />
        <StatCard icon="👥" label="Active Paid Subs" value={stats.activeSubs || 0} color="#6366f1" />
        <StatCard icon="🧾" label="Total Transactions" value={stats.totalTxns || 0} color="#38bdf8" />
        <StatCard icon="📦" label="Configured Plans" value={plans.length || 0} color="#f59e0b" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("plans")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "plans" ? "rgba(99,102,241,0.2)" : "transparent",
            color: activeTab === "plans" ? "#a5b4fc" : "#94a3b8",
            fontWeight: "700",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          ⚡ Subscription Plans ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "transactions" ? "rgba(99,102,241,0.2)" : "transparent",
            color: activeTab === "transactions" ? "#a5b4fc" : "#94a3b8",
            fontWeight: "700",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          🧾 Payment Logs ({transactions.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: PLANS CATALOG & MODULE ACCESS LINES
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "plans" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {plans.map((p) => {
            const isFree = p.price === 0;
            const isDisabled = p.status === "disabled";
            const includedMods = p.included_modules || [];

            return (
              <div
                key={p._id}
                style={{
                  background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
                  border: `1px solid ${isDisabled ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "16px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: isDisabled ? "0 4px 20px rgba(245,158,11,0.05)" : "none",
                }}
              >
                <div>
                  {/* Top Bar: Badges & Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "99px",
                          background: isDisabled ? "rgba(245,158,11,0.15)" : "rgba(52,211,153,0.15)",
                          color: isDisabled ? "#fbbf24" : "#34d399",
                          border: `1px solid ${isDisabled ? "rgba(245,158,11,0.3)" : "rgba(52,211,153,0.3)"}`,
                        }}
                      >
                        {isDisabled ? "Disabled (Legacy)" : "Active"}
                      </span>

                      {p.badge && (
                        <span style={{ fontSize: "0.68rem", fontWeight: "700", padding: "2px 7px", borderRadius: "6px", background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                          {p.badge}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600" }}>
                      Tier Rank: <strong style={{ color: "#f1f5f9" }}>{p.tier_rank || 1}</strong>
                    </span>
                  </div>

                  {/* Plan Name & Price */}
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.15rem", fontWeight: "800", color: "#f1f5f9" }}>
                    {p.name}
                  </h3>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                    {p.description || "Configured ecosystem tier."}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: "900", color: isFree ? "#34d399" : "#f1f5f9" }}>
                      {isFree ? "Free" : `₹${p.price?.toLocaleString("en-IN")}`}
                    </span>
                    {!isFree && (
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        / {p.interval}
                      </span>
                    )}
                  </div>

                  {/* Included Service Lines Preview */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: "800", color: "#818cf8", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                      Included Service Access ({includedMods.length} Modules)
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {includedMods.slice(0, 4).map((m, idx) => (
                        <div key={idx} style={{ fontSize: "0.72rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{ color: "#34d399", fontWeight: "bold" }}>✓</span>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.access_line}
                          </span>
                        </div>
                      ))}

                      {includedMods.length > 4 && (
                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic", marginTop: "2px" }}>
                          + {includedMods.length - 4} more modules configured
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subscribers Counter */}
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.4rem 0.65rem", borderRadius: "8px", fontSize: "0.7rem", color: "#94a3b8", display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span>Active Subscribers: <strong style={{ color: "#38bdf8" }}>{p.active_subscribers || 0}</strong></span>
                    <span>Total Purchases: <strong style={{ color: "#f1f5f9" }}>{p.purchased_count || 0}</strong></span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: "flex", gap: "0.4rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditingPlan(p); setPlanModalOpen(true); }}
                        className="admin-btn admin-btn-secondary"
                        style={{ flex: 1, padding: "0.4rem 0.6rem", fontSize: "0.72rem" }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className="admin-btn admin-btn-secondary"
                        style={{
                          flex: 1,
                          padding: "0.4rem 0.6rem",
                          fontSize: "0.72rem",
                          color: isDisabled ? "#34d399" : "#fbbf24",
                        }}
                      >
                        {isDisabled ? "Enable Plan" : "Disable Plan"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(p)}
                        className="admin-btn admin-btn-danger"
                        style={{
                          padding: "0.4rem 0.65rem",
                          fontSize: "0.72rem",
                          opacity: p.can_delete ? 1 : 0.4,
                          cursor: p.can_delete ? "pointer" : "not-allowed",
                        }}
                        title={p.can_delete ? "Delete permanently" : "Cannot delete plan with existing subscribers (Disable instead)"}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: PAYMENT & TRANSACTION LOGS
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "transactions" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                {["User / Company", "Plan Key", "Amount", "Razorpay Order ID", "Status", "Date"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "#f1f5f9", fontSize: "0.8rem" }}>
                      {tx.user?.company_name || tx.user?.name || "Ecosystem User"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{tx.user?.email || "—"}</div>
                  </td>

                  <td>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#818cf8" }}>
                      {tx.planName || tx.planKey}
                    </span>
                  </td>

                  <td>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#34d399" }}>
                      ₹{tx.amount?.toLocaleString("en-IN")}
                    </span>
                  </td>

                  <td>
                    <code style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px", color: "#cbd5e1" }}>
                      {tx.razorpayOrderId || "—"}
                    </code>
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        borderRadius: "99px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        background: tx.status === "paid" ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                        color: tx.status === "paid" ? "#34d399" : "#f87171",
                      }}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {transactions.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              No payment transactions recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Plan Builder Modal */}
      <PlanModal
        open={planModalOpen}
        onClose={() => { setPlanModalOpen(false); setEditingPlan(null); }}
        onSave={handleSavePlan}
        plan={editingPlan}
      />
    </AdminLayout>
  );
}

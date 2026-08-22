import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios.jsx";
import { useStore } from "../../zustand/store.jsx";
import { isSuperAdmin, hasPermission } from "../../utils/rbac.js";

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal-box" style={{ maxWidth: "480px" }}>
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "var(--admin-card-bg)",
        border: "1px solid var(--admin-card-border)",
        borderRadius: "12px",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: `${color}18`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--admin-text-primary)", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)", fontWeight: "500", marginTop: "2px" }}>{label}</div>
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
    badge: "",
    accentColor: "#6366f1",
    features: "",
    isActive: true,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        key: plan.key || "",
        description: plan.description || "",
        price: plan.price || 0,
        interval: plan.interval || "monthly",
        badge: plan.badge || "",
        accentColor: plan.accentColor || "#6366f1",
        features: Array.isArray(plan.features) ? plan.features.join(", ") : plan.features || "",
        isActive: plan.isActive !== undefined ? plan.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        key: "",
        description: "",
        price: 0,
        interval: "monthly",
        badge: "",
        accentColor: "#6366f1",
        features: "",
        isActive: true,
      });
    }
  }, [plan, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: "6px",
    background: "var(--admin-input-bg)",
    border: "1px solid var(--admin-input-border)",
    color: "var(--admin-input-text)",
    fontSize: "0.8rem",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.68rem",
    color: "#6366f1",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: "0.25rem",
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ color: "var(--admin-text-primary)", fontSize: "1rem", fontWeight: "700", marginBottom: "0.2rem" }}>
        {plan ? "Edit Subscription Plan" : "Add New Subscription Plan"}
      </h3>
      <p style={{ color: "var(--admin-text-muted)", fontSize: "0.78rem", marginBottom: "1rem" }}>
        Configure plan details, pricing, features, and active status.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div className="admin-grid-2col">
          <div>
            <label style={labelStyle}>Plan Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Pro Growth"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Unique Key</label>
            <input
              type="text"
              required
              disabled={Boolean(plan)}
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g. pro_growth"
              style={{ ...inputStyle, opacity: plan ? 0.6 : 1 }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief plan summary..."
            style={inputStyle}
          />
        </div>

        <div className="admin-grid-2col">
          <div>
            <label style={labelStyle}>Price (₹)</label>
            <input
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Billing Cycle</label>
            <select
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
              style={{ ...inputStyle, background: 'var(--admin-select-bg)', color: 'var(--admin-select-text)' }}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">Lifetime / One Time</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Badge Tag</label>
          <input
            type="text"
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            placeholder="e.g. Popular"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Features (comma separated)</label>
          <textarea
            rows={2}
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            placeholder="Unlimited connections, Direct Messaging, Priority Support..."
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <input
            type="checkbox"
            id="plan-isactive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            style={{ accentColor: "#6366f1" }}
          />
          <label htmlFor="plan-isactive" style={{ fontSize: "0.78rem", color: "var(--admin-text-secondary)" }}>
            Active (Visible to users)
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.65rem", marginTop: "0.35rem" }}>
          <button type="button" onClick={onClose} className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: "0.55rem" }}>
            Cancel
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1, padding: "0.55rem" }}>
            Save Plan
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminSubscriptions() {
  const [tab, setTab] = useState("plans");
  const [stats, setStats] = useState({ totalRevenue: 0, activeSubs: 0, totalTxns: 0, totalPlans: 0 });
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planModal, setPlanModal] = useState({ open: false, plan: null });
  const [toast, setToast] = useState(null);

  const currentUser = useStore((s) => s.user);
  const canCreatePlan = isSuperAdmin(currentUser) || hasPermission(currentUser, 'subscriptions.create');
  const canEditPlan = isSuperAdmin(currentUser) || hasPermission(currentUser, 'subscriptions.update');
  const canDeletePlan = isSuperAdmin(currentUser) || hasPermission(currentUser, 'subscriptions.delete');

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, plansRes, txnsRes] = await Promise.all([
        axios.get("/payment/admin/stats"),
        axios.get("/plans/admin"),
        axios.get("/payment/admin/transactions"),
      ]);

      if (statsRes.data.status === 1) setStats(statsRes.data.stats);
      if (plansRes.data.status === 1) setPlans(plansRes.data.plans || []);
      if (txnsRes.data.status === 1) setTransactions(txnsRes.data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlanSave = async (formData) => {
    try {
      if (planModal.plan) {
        const res = await axios.put(`/plans/admin/${planModal.plan._id}`, formData);
        if (res.data.status === 1) {
          showToast("Plan updated successfully");
          setPlanModal({ open: false, plan: null });
          loadData();
        } else {
          showToast(res.data.msg || "Failed to update plan", "error");
        }
      } else {
        const res = await axios.post("/plans/admin", formData);
        if (res.data.status === 1) {
          showToast("New plan created successfully");
          setPlanModal({ open: false, plan: null });
          loadData();
        } else {
          showToast(res.data.msg || "Failed to create plan", "error");
        }
      }
    } catch (e) {
      showToast("Error saving plan", "error");
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription plan?")) return;
    try {
      const res = await axios.delete(`/plans/admin/${id}`);
      if (res.data.status === 1) {
        showToast("Plan deleted");
        loadData();
      }
    } catch (e) {
      showToast("Error deleting plan", "error");
    }
  };

  return (
    <AdminLayout title="Subscription Plans">
      {toast && (
        <div style={{ position: "fixed", top: "70px", right: "1.5rem", zIndex: 9999, padding: "0.6rem 1.1rem", borderRadius: "8px", fontFamily: "Inter,sans-serif", fontSize: "0.8rem", fontWeight: "500", background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.15)", color: toast.type === "error" ? "#ef4444" : "#10b981", border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.3)"}`, boxShadow: "var(--admin-box-shadow)" }}>
          {toast.type === "error" ? "✕ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>Subscription & Revenue Management</h1>
          <p style={{ color: 'var(--admin-text-subtle)', fontSize: '0.8rem' }}>Manage subscription plans, revenue analytics, and transaction logs.</p>
        </div>
        {canCreatePlan && (
          <button
            onClick={() => setPlanModal({ open: true, plan: null })}
            className="admin-btn admin-btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
          >
            + Add New Plan
          </button>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="admin-grid-stats">
        <StatCard icon="💳" label="Total Revenue" value={`₹${stats.totalRevenue?.toLocaleString("en-IN") || 0}`} color="#10b981" />
        <StatCard icon="⚡" label="Active Subscriptions" value={stats.activeSubs || 0} color="#3b82f6" />
        <StatCard icon="🧾" label="Paid Transactions" value={stats.totalTxns || 0} color="#f59e0b" />
        <StatCard icon="🎯" label="Configured Plans" value={stats.totalPlans || 0} color="#8b5cf6" />
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--admin-border-subtle)", marginBottom: "1.25rem", overflowX: "auto", scrollbarWidth: "none" }}>
        <button
          onClick={() => setTab("plans")}
          style={{
            background: "none",
            border: "none",
            color: tab === "plans" ? "#6366f1" : "var(--admin-text-subtle)",
            fontWeight: "700",
            fontSize: "0.78rem",
            paddingBottom: "0.5rem",
            cursor: "pointer",
            borderBottom: tab === "plans" ? "2px solid #6366f1" : "2px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          Subscription Plans ({plans.length})
        </button>
        <button
          onClick={() => setTab("transactions")}
          style={{
            background: "none",
            border: "none",
            color: tab === "transactions" ? "#6366f1" : "var(--admin-text-subtle)",
            fontWeight: "700",
            fontSize: "0.78rem",
            paddingBottom: "0.5rem",
            cursor: "pointer",
            borderBottom: tab === "transactions" ? "2px solid #6366f1" : "2px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          Payment Transactions ({transactions.length})
        </button>
      </div>

      {/* Tab 1: Subscription Plans */}
      {tab === "plans" && (
        <div className="admin-grid-3col">
          {plans.map((p) => (
            <div
              key={p._id}
              style={{
                background: "var(--admin-card-bg)",
                border: "1px solid var(--admin-card-border)",
                borderRadius: "14px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {p.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: p.accentColor || "#6366f1",
                    color: "#fff",
                    fontSize: "0.6rem",
                    fontWeight: "800",
                    padding: "2px 7px",
                    borderRadius: "20px",
                    textTransform: "uppercase",
                  }}
                >
                  {p.badge}
                </span>
              )}

              <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--admin-text-primary)" }}>{p.name}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--admin-text-subtle)", marginTop: "2px" }}>Key: {p.key}</div>

              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--admin-text-primary)", margin: "0.85rem 0 0.4rem" }}>
                ₹{p.price.toLocaleString("en-IN")}{" "}
                <span style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)", fontWeight: "500" }}>/{p.interval}</span>
              </div>

              <p style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)", marginBottom: "0.85rem", lineHeight: "1.4" }}>
                {p.description || "No description"}
              </p>

              <div style={{ flex: 1, marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: "700", color: "var(--admin-text-subtle)", textTransform: "uppercase", marginBottom: "0.4rem" }}>Features</div>
                {p.features?.map((f, i) => (
                  <div key={i} style={{ fontSize: "0.75rem", color: "var(--admin-text-secondary)", marginBottom: "3px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ color: p.accentColor || "#10b981" }}>✓</span> {f}
                  </div>
                ))}
              </div>

              {(canEditPlan || canDeletePlan) && (
                <div style={{ display: "flex", gap: "0.45rem", borderTop: "1px solid var(--admin-border-subtle)", paddingTop: "0.85rem" }}>
                  {canEditPlan && (
                    <button
                      onClick={() => setPlanModal({ open: true, plan: p })}
                      className="admin-btn admin-btn-secondary"
                      style={{ flex: 1, padding: "0.45rem", fontSize: "0.72rem" }}
                    >
                      Edit Plan
                    </button>
                  )}
                  {canDeletePlan && (
                    <button
                      onClick={() => handleDeletePlan(p._id)}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: "0.45rem 0.75rem", fontSize: "0.72rem" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Transactions */}
      {tab === "transactions" && (
        <div className="admin-table-container">
          {transactions.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--admin-text-subtle)", fontSize: "0.8rem" }}>No payment transactions recorded yet.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  {["User", "Plan", "Amount", "Razorpay Payment ID", "Order ID", "Date", "Status"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <div style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-primary)" }}>{tx.user?.name || "User"}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--admin-text-subtle)" }}>{tx.user?.email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "700", color: "var(--admin-text-secondary)", fontSize: "0.78rem" }}>{tx.planName}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "800", color: "var(--admin-text-primary)", fontSize: "0.78rem" }}>₹{tx.amount?.toLocaleString("en-IN")}</span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#6366f1" }}>
                      {tx.razorpayPaymentId || "-"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--admin-text-subtle)" }}>
                      {tx.razorpayOrderId}
                    </td>
                    <td style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)" }}>{new Date(tx.createdAt).toLocaleDateString("en-IN")}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 7px",
                          borderRadius: "99px",
                          fontSize: "0.65rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          background: tx.status === "paid" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: tx.status === "paid" ? "#10b981" : "#ef4444",
                          border: `1px solid ${tx.status === "paid" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <PlanModal open={planModal.open} onClose={() => setPlanModal({ open: false, plan: null })} onSave={handlePlanSave} plan={planModal.plan} />
    </AdminLayout>
  );
}

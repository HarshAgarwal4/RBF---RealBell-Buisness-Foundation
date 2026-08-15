import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Hourglass,
  ChevronDown,
  ChevronUp,
  Loader,
  Users,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { icon: Hourglass, color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", label: "Pending" },
  approved: { icon: CheckCircle, color: "#16a34a", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", label: "Approved" },
  rejected: { icon: XCircle, color: "#dc2626", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", label: "Rejected" },
};

function ApplicationCard({ app, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(app.admin_note || "");
  const [updating, setUpdating] = useState(false);
  const conf = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
  const Icon = conf.icon;
  const applicant = app.applicant;

  const handleAction = async (status) => {
    setUpdating(true);
    try {
      await onUpdateStatus(app._id, status, note);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
        border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          flexWrap: "wrap",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {applicant?.account?.image ? (
            <img src={applicant.account.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            (applicant?.name || "A")[0].toUpperCase()
          )}
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text-primary, #f1f5f9)" }}>
            {applicant?.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--admin-text-subtle, #64748b)", marginTop: 1 }}>
            {applicant?.company_name} &middot; {applicant?.email}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--admin-text-subtle, #475569)" }}>
            {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: conf.bg,
              color: conf.color,
              border: `1px solid ${conf.border}`,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 20,
            }}
          >
            <Icon size={11} />
            {conf.label}
          </span>
          {expanded ? <ChevronUp size={15} color="#475569" /> : <ChevronDown size={15} color="#475569" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
            padding: "16px",
          }}
        >
          {/* Applicant profile */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-subtle, #64748b)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Applicant Profile
            </div>
            <div className="admin-grid-3col">
              {[
                { label: "Company", value: applicant?.company_name },
                { label: "Type", value: applicant?.company_type },
                { label: "Email", value: applicant?.email },
                { label: "Phone", value: applicant?.phone },
                { label: "Country", value: applicant?.profile?.country },
                { label: "City", value: applicant?.profile?.city },
                { label: "Website", value: applicant?.profile?.website },
                { label: "Company Size", value: applicant?.profile?.company_size },
                { label: "Year Founded", value: applicant?.profile?.year_of_incorporation },
              ]
                .filter((r) => r.value)
                .map((row) => (
                  <div
                    key={row.label}
                    style={{
                      background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
                      borderRadius: 6,
                      padding: "8px 10px",
                      border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--admin-text-subtle, #475569)", marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: "var(--admin-text-primary, #e2e8f0)", fontWeight: 600, wordBreak: "break-all" }}>
                      {row.value?.toString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Custom responses */}
          {app.custom_responses?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-subtle, #64748b)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Program Form Responses
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {app.custom_responses.map((resp, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
                      border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
                      borderRadius: 6,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--admin-text-subtle, #94a3b8)", marginBottom: 4, fontWeight: 600 }}>
                      {resp.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--admin-text-primary, #e2e8f0)", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                      {Array.isArray(resp.value) ? resp.value.join(", ") : resp.value || <em style={{ color: "var(--admin-text-subtle, #475569)" }}>—</em>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action area */}
          <div
            style={{
              borderTop: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
              paddingTop: 14,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-text-subtle, #64748b)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Admin Action
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note to applicant…"
              rows={2}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--admin-input-border, rgba(255,255,255,0.1))",
                borderRadius: 6,
                background: "var(--admin-input-bg, rgba(255,255,255,0.05))",
                color: "var(--admin-input-text, #e2e8f0)",
                fontSize: 12.5,
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => handleAction("approved")}
                disabled={updating || app.status === "approved"}
                className="admin-btn admin-btn-primary"
                style={{ padding: "6px 14px", fontSize: 12, opacity: app.status === "approved" ? 0.5 : 1 }}
              >
                {updating ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                Approve
              </button>
              <button
                onClick={() => handleAction("rejected")}
                disabled={updating || app.status === "rejected"}
                className="admin-btn admin-btn-danger"
                style={{ padding: "6px 14px", fontSize: 12, opacity: app.status === "rejected" ? 0.5 : 1 }}
              >
                {updating ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={13} />}
                Reject
              </button>
              {app.status !== "pending" && (
                <button
                  onClick={() => handleAction("pending")}
                  disabled={updating}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "6px 14px", fontSize: 12 }}
                >
                  <Hourglass size={13} /> Reset to Pending
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProgramApplications() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [id, statusFilter]);

  const fetchData = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        axios.get(`/programs/admin/${id}`),
        axios.get(`/programs/admin/${id}/applications`, { params: { status: statusFilter } }),
      ]);
      if (pRes.data.status === 1) setProgram(pRes.data.program);
      if (aRes.data.status === 1) setApplications(aRes.data.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, status, admin_note) => {
    try {
      const r = await axios.patch(`/programs/admin/applications/${appId}/status`, {
        status,
        admin_note,
      });
      if (r.data.status === 1) {
        toast.success(`Application ${status}`);
        setApplications((prev) =>
          prev.map((a) =>
            a._id === appId ? { ...a, status, admin_note } : a
          )
        );
      } else {
        toast.error(r.data.msg || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <AdminLayout title="Program Applications">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back + Program info */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate("/admin/programs")}
          className="admin-btn admin-btn-secondary"
          style={{ padding: "5px 10px", fontSize: 12, marginBottom: 14 }}
        >
          <ArrowLeft size={14} /> Back to Programs
        </button>

        {program && (
          <div
            style={{
              background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
              border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {program.banner_image ? (
              <img
                src={program.banner_image}
                alt=""
                style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} color="#6366f1" />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--admin-text-primary, #f1f5f9)" }}>{program.title}</div>
              <div style={{ fontSize: 12, color: "var(--admin-text-subtle, #64748b)", marginTop: 2 }}>
                {program.short_description}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="admin-grid-stats" style={{ marginBottom: 20 }}>
        {[
          { label: "Total", value: counts.all, color: "#6366f1" },
          { label: "Pending", value: counts.pending, color: "#d97706" },
          { label: "Approved", value: counts.approved, color: "#16a34a" },
          { label: "Rejected", value: counts.rejected, color: "#dc2626" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
              border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--admin-text-subtle, #64748b)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter + list */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: statusFilter === s ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
              background: statusFilter === s ? "rgba(99,102,241,0.15)" : "var(--admin-card-bg, rgba(255,255,255,0.04))",
              color: statusFilter === s ? "#a5b4fc" : "var(--admin-text-subtle, #64748b)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--admin-text-subtle, #64748b)", fontSize: 13 }}>
          Loading applications…
        </div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--admin-text-subtle, #64748b)" }}>
          <Users size={32} color="#334155" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 14 }}>No applications found</div>
        </div>
      ) : (
        applications.map((app) => (
          <ApplicationCard
            key={app._id}
            app={app}
            onUpdateStatus={handleUpdateStatus}
          />
        ))
      )}
    </AdminLayout>
  );
}

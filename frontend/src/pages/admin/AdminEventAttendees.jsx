import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { ArrowLeft, Search } from "lucide-react";

export default function AdminEventAttendees() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [evtRes, attRes] = await Promise.all([
        axios.get(`/events/admin/${id}`),
        axios.get(`/events/admin/${id}/attendees`),
      ]);
      if (evtRes.data.status === 1) setEvent(evtRes.data.event);
      if (attRes.data.status === 1) setAttendees(attRes.data.attendees);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendees");
    } finally {
      setLoading(false);
    }
  };

  const filtered = attendees.filter((a) => {
    const uName = a.user?.name || "";
    const uEmail = a.user?.email || "";
    const tNum = a.ticket_number || "";
    const q = search.toLowerCase();
    return uName.toLowerCase().includes(q) || uEmail.toLowerCase().includes(q) || tNum.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Event Attendees">
      <div>
        {/* Navigation / Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/admin/events")}
              className="admin-btn admin-btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--admin-text-primary, #e2e8f0)", margin: 0 }}>
                {event?.title || "Event"} Attendees
              </h1>
              <div style={{ fontSize: "0.8rem", color: "var(--admin-text-subtle, #64748b)", marginTop: 2 }}>
                Total Tickets Registered: {attendees.length}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              placeholder="🔍  Search by name, email, ticket…"
              style={{ minWidth: 220 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "var(--admin-text-subtle, #64748b)", fontSize: 13 }}>Loading attendees…</div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              background: "var(--admin-card-bg, rgba(255,255,255,0.02))",
              borderRadius: 12,
              border: "1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))",
              color: "var(--admin-text-subtle, #64748b)",
              fontSize: 13,
            }}
          >
            No attendees found.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Attendee</th>
                  <th>Payment Method</th>
                  <th>Registered Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((att) => (
                  <tr key={att._id}>
                    <td>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#818cf8", fontFamily: "monospace" }}>
                        {att.ticket_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--admin-text-primary, #e2e8f0)", fontSize: "0.78rem" }}>{att.user?.name || "User"}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--admin-text-subtle, #64748b)" }}>{att.user?.email}</div>
                    </td>
                    <td>
                      <span style={{ background: "var(--admin-card-bg, rgba(255,255,255,0.06))", padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem", textTransform: "capitalize" }}>
                        {att.registration_type} {att.amount_paid ? `(₹${att.amount_paid})` : att.tokens_used ? `(${att.tokens_used} tokens)` : ""}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.72rem", color: "var(--admin-text-muted, #94a3b8)" }}>
                      {new Date(att.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <span style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700 }}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { ArrowLeft, Ticket, Users, Search, Download } from "lucide-react";

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
      <div style={{ padding: "24px" }}>
        {/* Navigation / Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => navigate("/admin/events")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#94a3b8",
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
                {event?.title || "Event"} Attendees
              </h1>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                Total Tickets Registered: {attendees.length}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "6px 14px",
              width: 260,
            }}
          >
            <Search size={15} color="#64748b" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ticket…"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e2e8f0",
                fontSize: 13,
                width: "100%",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>Loading attendees…</div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#64748b",
            }}
          >
            No attendees found.
          </div>
        ) : (
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#e2e8f0", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Ticket #</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Attendee</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Payment Method</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Registered Date</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((att) => (
                  <tr key={att._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "14px 18px", fontWeight: 700, color: "#818cf8" }}>
                      {att.ticket_number}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{att.user?.name || "User"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{att.user?.email}</div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 20, fontSize: 12, textTransform: "capitalize" }}>
                        {att.registration_type} {att.amount_paid ? `(₹${att.amount_paid})` : att.tokens_used ? `(${att.tokens_used} tokens)` : ""}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#94a3b8" }}>
                      {new Date(att.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
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

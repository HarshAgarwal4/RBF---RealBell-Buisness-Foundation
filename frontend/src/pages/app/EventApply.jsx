import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../services/axios";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Ticket as TicketIcon,
  CheckCircle,
  Coins,
  CreditCard,
  Sparkles,
  Calendar,
  MapPin,
  Loader,
} from "lucide-react";

export default function EventApply() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  // Form states
  const [registrationType, setRegistrationType] = useState("paid_ticket");
  const [customResponses, setCustomResponses] = useState({});

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const r = await axios.get(`/events/public/${id}`);
      if (r.data.status === 1) {
        setEvent(r.data.event);
        if (r.data.myRegistration) {
          setRegistrationSuccess(r.data.myRegistration);
        }
        if (r.data.event.event_type === "free") {
          setRegistrationType("free");
        } else if (r.data.event.payment_options?.includes("ticket")) {
          setRegistrationType("paid_ticket");
        } else if (r.data.event.payment_options?.includes("token")) {
          setRegistrationType("paid_token");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomChange = (fieldId, val) => {
    setCustomResponses((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;

    // Validate required custom fields
    if (event.custom_form_fields?.length > 0) {
      for (const field of event.custom_form_fields) {
        if (field.required && !customResponses[field.id]) {
          return toast.error(`Please complete field "${field.label}"`);
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        registration_type: event.event_type === "free" ? "free" : registrationType,
        custom_responses: Object.entries(customResponses).map(([field_id, value]) => ({
          field_id,
          value,
        })),
      };

      const res = await axios.post(`/events/register/${id}`, payload);
      if (res.data.status === 1) {
        toast.success(res.data.msg || "Registration successful!");
        setRegistrationSuccess(res.data.registration);
      } else {
        toast.error(res.data.msg || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Something went wrong during registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F4F5F7" }}>
        <Sidebar />
        <main style={{ marginLeft: 300, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
          Loading registration details…
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#F4F5F7" }}>
        <Sidebar />
        <main style={{ marginLeft: 300, flex: 1, padding: 40, textAlign: "center", color: COLORS.muted }}>
          Event not found.
        </main>
      </div>
    );
  }

  const evtDate = event.event_date ? new Date(event.event_date) : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F5F7", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar />

      <main style={{ marginLeft: 300, flex: 1, minWidth: 0, paddingBottom: 60 }}>
        {/* Header bar */}
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => navigate(`/events/${id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: COLORS.muted,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Event
          </button>
          <div style={{ width: 1, height: 18, background: COLORS.border }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
            {registrationSuccess ? "Registration Confirmation" : "Event Ticket & Registration"}
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "36px auto", padding: "0 20px" }}>
          {registrationSuccess ? (
            /* Ticket Confirmation Card */
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                padding: "36px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#E8F5E9",
                  color: "#2E7D32",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <CheckCircle size={32} />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, margin: "0 0 8px" }}>
                Registration Confirmed!
              </h2>

              <p style={{ fontSize: 14, color: COLORS.muted, margin: "0 0 24px" }}>
                You are registered for <strong>{event.title}</strong>.
              </p>

              {/* Digital Ticket Badge */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
                  color: "#fff",
                  borderRadius: 16,
                  padding: "24px",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 28,
                  boxShadow: "0 8px 24px rgba(142,27,46,0.25)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8, marginBottom: 8 }}>
                  OFFICIAL ADMISSION TICKET
                </div>

                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  {event.title}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12.5, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 12 }}>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: 11 }}>EVENT DATE</div>
                    <div style={{ fontWeight: 700, marginTop: 2 }}>
                      {evtDate ? evtDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "TBA"}
                    </div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: 11 }}>TICKET NUMBER</div>
                    <div style={{ fontWeight: 800, marginTop: 2, letterSpacing: "0.05em", color: "#FDEB6B" }}>
                      {registrationSuccess.ticket_number}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/events")}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                View My Events
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form
              onSubmit={handleSubmit}
              style={{
                background: "#fff",
                borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                padding: "32px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, margin: "0 0 6px" }}>
                  Register for {event.title}
                </h1>
                <div style={{ fontSize: 13, color: COLORS.muted }}>
                  {evtDate ? evtDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : ""}
                </div>
              </div>

              {/* Payment Mode Selection for Paid Events */}
              {event.event_type === "paid" && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 10 }}>
                    Select Payment / Ticket Option
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {event.payment_options?.includes("ticket") && (
                      <div
                        onClick={() => setRegistrationType("paid_ticket")}
                        style={{
                          border: `2px solid ${registrationType === "paid_ticket" ? COLORS.primary : COLORS.border}`,
                          background: registrationType === "paid_ticket" ? `${COLORS.primary}08` : "#FAFAFA",
                          borderRadius: 12,
                          padding: "14px 16px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
                          <CreditCard size={18} color={COLORS.primary} /> Ticket Purchase
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4, fontWeight: 600 }}>
                          ₹{event.price} INR
                        </div>
                      </div>
                    )}

                    {event.payment_options?.includes("token") && (
                      <div
                        onClick={() => setRegistrationType("paid_token")}
                        style={{
                          border: `2px solid ${registrationType === "paid_token" ? COLORS.primary : COLORS.border}`,
                          background: registrationType === "paid_token" ? `${COLORS.primary}08` : "#FAFAFA",
                          borderRadius: 12,
                          padding: "14px 16px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
                          <Coins size={18} color={COLORS.primary} /> Token Redemption
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4, fontWeight: 600 }}>
                          {event.token_price} Tokens
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Form Fields if configured */}
              {event.custom_form_fields?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 14 }}>
                    Registration Information
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {event.custom_form_fields.map((field) => (
                      <div key={field.id}>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#4A4A5A", marginBottom: 6 }}>
                          {field.label} {field.required && <span style={{ color: "#C62828" }}>*</span>}
                        </label>

                        {field.type === "textarea" ? (
                          <textarea
                            value={customResponses[field.id] || ""}
                            onChange={(e) => handleCustomChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1px solid ${COLORS.border}`,
                              fontSize: 13.5,
                              fontFamily: "inherit",
                              boxSizing: "border-box",
                            }}
                          />
                        ) : field.type === "select" ? (
                          <select
                            value={customResponses[field.id] || ""}
                            onChange={(e) => handleCustomChange(field.id, e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1px solid ${COLORS.border}`,
                              fontSize: 13.5,
                              fontFamily: "inherit",
                              boxSizing: "border-box",
                              background: "#fff",
                            }}
                          >
                            <option value="">Select option…</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === "date" ? "date" : "text"}
                            value={customResponses[field.id] || ""}
                            onChange={(e) => handleCustomChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1px solid ${COLORS.border}`,
                              fontSize: 13.5,
                              fontFamily: "inherit",
                              boxSizing: "border-box",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 0",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {submitting ? <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {submitting
                  ? "Processing Ticket…"
                  : event.event_type === "free"
                  ? "Confirm Free Registration"
                  : registrationType === "paid_ticket"
                  ? `Pay ₹${event.price} & Register`
                  : `Redeem ${event.token_price} Tokens & Register`}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

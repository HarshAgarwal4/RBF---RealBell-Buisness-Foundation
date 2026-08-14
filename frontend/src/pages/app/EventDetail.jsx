import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axios from "../../services/axios";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  CheckCircle,
  Ticket as TicketIcon,
  Coins,
  ExternalLink,
  Link2,
  Tag,
  Users,
  Award,
  CalendarClock,
  Sparkles,
} from "lucide-react";

/* ══════════════════════════════════════
   FAQ Block — animated collapsible
══════════════════════════════════════ */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
        transition: "box-shadow 0.2s",
        boxShadow: open ? "0 4px 16px rgba(142,27,46,0.07)" : "none",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          background: open ? `${COLORS.primary}06` : "#fff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          gap: 14,
          transition: "background 0.18s",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: open ? COLORS.primary : COLORS.ink,
            flex: 1,
            lineHeight: 1.4,
            transition: "color 0.18s",
          }}
        >
          {question}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: open ? COLORS.primary : "#F2F4F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.18s",
          }}
        >
          <ChevronDown
            size={15}
            color={open ? "#fff" : COLORS.muted}
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.22s",
            }}
          />
        </div>
      </button>
      <div
        style={{
          maxHeight: open ? 600 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div
          style={{
            padding: "16px 22px 20px",
            fontSize: 14.5,
            color: "#555",
            lineHeight: 1.72,
            background: "#FAFAFA",
            borderTop: `1px solid ${COLORS.border}`,
            whiteSpace: "pre-wrap",
          }}
        >
          {answer}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Rich Block Renderer
══════════════════════════════════════ */
function RichBlockRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null;
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {sorted.map((block) => {
        if (block.type === "heading") {
          const sizes = { 2: 21, 3: 17, 4: 14.5 };
          const weights = { 2: 800, 3: 700, 4: 600 };
          return (
            <div
              key={block.id}
              style={{
                fontSize: sizes[block.level] || 18,
                fontWeight: weights[block.level] || 700,
                color: COLORS.ink,
                marginTop: block.level === 2 ? 28 : 18,
                marginBottom: 6,
                paddingLeft: 14,
                borderLeft: `3.5px solid ${COLORS.primary}`,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {block.content}
            </div>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p
              key={block.id}
              style={{
                fontSize: 15,
                color: "#4A4A5A",
                lineHeight: 1.78,
                margin: "6px 0",
                whiteSpace: "pre-wrap",
              }}
            >
              {block.content}
            </p>
          );
        }
        if (block.type === "faq") {
          return (
            <FaqItem key={block.id} question={block.question} answer={block.answer} />
          );
        }
        return null;
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   Markdown renderer components
══════════════════════════════════════ */
const mdComponents = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, margin: "28px 0 8px", paddingLeft: 14, borderLeft: `4px solid ${COLORS.primary}`, lineHeight: 1.3 }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: "22px 0 6px", paddingLeft: 14, borderLeft: `3px solid ${COLORS.primary}` }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 15.5, fontWeight: 700, color: COLORS.ink, margin: "16px 0 5px" }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: 15, color: "#4A4A5A", lineHeight: 1.78, margin: "8px 0" }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: 22, margin: "8px 0" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: 22, margin: "8px 0" }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: 15, color: "#4A4A5A", lineHeight: 1.75, marginBottom: 4 }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ color: COLORS.ink, fontWeight: 700 }}>{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: `3.5px solid ${COLORS.primary}`, paddingLeft: 16, margin: "14px 0", color: "#666", background: `${COLORS.primary}05`, padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "20px 0" }} />,
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [myRegistration, setMyRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const r = await axios.get(`/events/public/${id}`);
      if (r.data.status === 1) {
        setEvent(r.data.event);
        setMyRegistration(r.data.myRegistration);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const evtDate = event?.event_date ? new Date(event.event_date) : null;
  const evtEndDate = event?.event_end_date ? new Date(event.event_end_date) : null;
  const regDeadline = event?.registration_deadline ? new Date(event.registration_deadline) : null;
  const isExpired = regDeadline && new Date() > regDeadline;
  const isSoldOut = event?.total_tickets > 0 && event?.tickets_sold >= event?.total_tickets;
  const canRegister = Boolean(event && !myRegistration && !isExpired && !isSoldOut);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F5F7", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar />

      <main style={{ marginLeft: 300, flex: 1, minWidth: 0 }}>
        {/* Sticky top nav bar */}
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "12px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => navigate("/events")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: COLORS.muted,
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "inherit",
              padding: "6px 10px",
              borderRadius: 8,
            }}
          >
            <ArrowLeft size={15} /> Back to Events
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {myRegistration && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#E8F5E9",
                  color: "#2E7D32",
                  border: "1px solid #A5D6A7",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "6px 16px",
                  borderRadius: 20,
                }}
              >
                <CheckCircle size={14} /> Registered (Ticket: {myRegistration.ticket_number})
              </span>
            )}

            {canRegister && (
              <button
                onClick={() => navigate(`/events/${id}/apply`)}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {event?.event_type === "free" ? "Register Free →" : "Get Ticket / Purchase →"}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: COLORS.muted }}>
            Loading event details…
          </div>
        ) : !event ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
            <TicketIcon size={40} color={COLORS.border} />
            <div style={{ fontWeight: 600, fontSize: 16 }}>Event not found.</div>
          </div>
        ) : (
          <>
            {/* HERO BANNER */}
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: event.banner_image ? 340 : 180,
                background: event.banner_image
                  ? `url(${event.banner_image}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, #c94060 100%)`,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)",
                }}
              />

              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  padding: "32px 48px 36px",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 22,
                }}
              >
                {event.logo && (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      border: "3px solid rgba(255,255,255,0.9)",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#fff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <img src={event.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <span
                      style={{
                        background: event.event_type === "free" ? "#2E7D32" : COLORS.primary,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "3px 12px",
                        borderRadius: 20,
                        textTransform: "uppercase",
                      }}
                    >
                      {event.event_type === "free" ? "Free Event" : `Paid Event`}
                    </span>
                    {event.tags?.map((t) => (
                      <span
                        key={t}
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <h1
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#fff",
                      margin: "0 0 8px",
                      lineHeight: 1.2,
                      letterSpacing: "-0.02em",
                      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    {event.title}
                  </h1>

                  {event.short_description && (
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.55 }}>
                      {event.short_description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* BODY — Two Column Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 320px",
                gap: 24,
                padding: "28px 32px",
                maxWidth: 1100,
                margin: "0 auto",
              }}
            >
              {/* Left Column: Rich Content */}
              <div style={{ minWidth: 0 }}>
                {myRegistration && (
                  <div
                    style={{
                      background: "#E8F5E9",
                      border: "1px solid #A5D6A7",
                      borderRadius: 14,
                      padding: "16px 22px",
                      marginBottom: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <CheckCircle size={22} color="#2E7D32" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#2E7D32" }}>
                        You are registered for this event! 🎉
                      </div>
                      <div style={{ fontSize: 13, color: "#2E7D32", marginTop: 2 }}>
                        Ticket Number: <strong>{myRegistration.ticket_number}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    border: `1px solid ${COLORS.border}`,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      padding: "20px 28px 18px",
                      borderBottom: `1px solid ${COLORS.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${COLORS.primary}12`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TicketIcon size={18} color={COLORS.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: COLORS.ink }}>Event Details</div>
                    </div>
                  </div>

                  <div style={{ padding: "24px 28px" }}>
                    {event.content_type === "ai_text" ? (
                      <ReactMarkdown components={mdComponents}>
                        {event.ai_content || "*No content available.*"}
                      </ReactMarkdown>
                    ) : event.rich_blocks?.length > 0 ? (
                      <RichBlockRenderer blocks={event.rich_blocks} />
                    ) : (
                      <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.muted }}>
                        No additional event description provided.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Info Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Event Summary Card */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    padding: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink, marginBottom: 16 }}>
                    Event Information
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Date & Time */}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${COLORS.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Calendar size={16} color={COLORS.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>Date & Time</div>
                        <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 600, marginTop: 2 }}>
                          {evtDate ? evtDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "TBA"}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 1 }}>
                          {evtDate ? evtDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${COLORS.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MapPin size={16} color={COLORS.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>Location</div>
                        <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 600, marginTop: 2, textTransform: "capitalize" }}>
                          {event.location_type}
                        </div>
                        {event.venue && (
                          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 1 }}>
                            {event.venue}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${COLORS.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <TicketIcon size={16} color={COLORS.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase" }}>Ticket Price</div>
                        <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 700, marginTop: 2 }}>
                          {event.event_type === "free" ? "Free" : `₹${event.price} / ${event.token_price} Tokens`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {canRegister && (
                    <button
                      onClick={() => navigate(`/events/${id}/apply`)}
                      style={{
                        width: "100%",
                        marginTop: 20,
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 11,
                        padding: "13px 0",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {event.event_type === "free" ? "Register Now →" : "Buy Ticket / Use Tokens →"}
                    </button>
                  )}
                </div>

                {/* External Links */}
                {event.external_links?.length > 0 && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: `1px solid ${COLORS.border}`,
                      padding: "20px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
                      <Link2 size={15} color={COLORS.primary} /> Useful Links
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {event.external_links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: "#F7F8FA",
                            border: `1px solid ${COLORS.border}`,
                            color: COLORS.primary,
                            fontWeight: 600,
                            fontSize: 13,
                            textDecoration: "none",
                          }}
                        >
                          {link.label} <ExternalLink size={13} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
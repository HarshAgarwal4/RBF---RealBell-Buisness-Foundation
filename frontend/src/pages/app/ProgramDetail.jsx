import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import axios from "../../services/axios";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import {
  ArrowLeft,
  Clock,
  ChevronDown,
  CheckCircle,
  XCircle,
  Hourglass,
  Award,
  ExternalLink,
  Link2,
  Tag,
  CalendarClock,
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
          background: open ? `${COLORS.primary}12` : COLORS.card,
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
            background: open ? COLORS.primary : "rgba(100, 116, 139, 0.15)",
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
            color: COLORS.textSubtle,
            lineHeight: 1.72,
            background: "rgba(100, 116, 139, 0.05)",
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

  // Group consecutive FAQs together for visual sectioning
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
    <p style={{ fontSize: 15, color: COLORS.textSubtle, lineHeight: 1.78, margin: "8px 0" }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: 22, margin: "8px 0" }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: 22, margin: "8px 0" }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: 15, color: COLORS.textSubtle, lineHeight: 1.75, marginBottom: 4 }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ color: COLORS.ink, fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: COLORS.muted, fontStyle: "italic" }}>{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: `3.5px solid ${COLORS.primary}`, paddingLeft: 16, margin: "14px 0", color: COLORS.textSubtle, background: `${COLORS.primary}12`, padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: "none", borderTop: `1px solid ${COLORS.border}`, margin: "20px 0" }} />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary, textDecoration: "underline", textDecorationThickness: 1 }}>
      {children}
    </a>
  ),
};

/* ══════════════════════════════════════
   Application status config
══════════════════════════════════════ */
const appStatusConfig = {
  pending: { icon: Hourglass, color: "#fb923c", bg: "rgba(230, 81, 0, 0.2)", border: "rgba(251, 146, 60, 0.4)", label: "Application Pending Review" },
  approved: { icon: CheckCircle, color: "#4ade80", bg: "rgba(46, 125, 50, 0.2)", border: "rgba(74, 222, 128, 0.4)", label: "Application Approved! 🎉" },
  rejected: { icon: XCircle, color: "#f87171", bg: "rgba(198, 40, 40, 0.2)", border: "rgba(248, 113, 113, 0.4)", label: "Application Not Approved" },
};

/* ══════════════════════════════════════
   Main Component
══════════════════════════════════════ */
export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [myApplication, setMyApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const r = await axios.get(`/programs/public/${id}`);
      if (r.data.status === 1) {
        setProgram(r.data.program);
        setMyApplication(r.data.myApplication);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deadline = program?.application_deadline ? new Date(program.application_deadline) : null;
  const isExpired = deadline && new Date() > deadline;
  const daysLeft = deadline && !isExpired
    ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const appConf = myApplication ? appStatusConfig[myApplication.status] : null;
  const AppIcon = appConf?.icon;
  const canApply = !myApplication && !isExpired;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar />

      <main className="ml-0 lg:ml-[300px] flex-1 pt-16 lg:pt-0 min-w-0">

        {/* ── Sticky top nav bar ── */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#151D2E]/95 backdrop-blur border-b border-gray-200 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate("/programs")}
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
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(100, 116, 139, 0.1)"; e.currentTarget.style.color = COLORS.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = COLORS.muted; }}
          >
            <ArrowLeft size={15} /> Back to Programs
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {appConf && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: appConf.bg,
                  color: appConf.color,
                  border: `1px solid ${appConf.border}`,
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 20,
                }}
              >
                <AppIcon size={13} />
                {appConf.label}
              </span>
            )}
            {canApply && (
              <button
                onClick={() => navigate(`/programs/${id}/apply`)}
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
                  transition: "opacity 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                Apply Now →
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: COLORS.muted, fontSize: 15 }}>
            Loading program details…
          </div>
        ) : !program ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, color: COLORS.muted }}>
            <Award size={40} color={COLORS.border} />
            <div style={{ fontWeight: 600, fontSize: 16, color: COLORS.ink }}>Program not found.</div>
          </div>
        ) : (
          <>
            {/* ════════════════════════════
                HERO BANNER
            ════════════════════════════ */}
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: program.banner_image ? 300 : 160,
                background: program.banner_image
                  ? `url(${program.banner_image}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, #c94060 100%)`,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              {/* Dark gradient overlay always present */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.78) 100%)",
                }}
              />

              {/* Hero content */}
              <div className="relative z-2 w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-12 flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Logo */}
                {program.logo && (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      border: "3px solid rgba(255,255,255,0.9)",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#fff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <img src={program.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Tags */}
                  {program.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
                      {program.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            background: "rgba(255,255,255,0.18)",
                            color: "#fff",
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: 20,
                            border: "1px solid rgba(255,255,255,0.3)",
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2 leading-tight tracking-tight drop-shadow-md">
                    {program.title}
                  </h1>

                  {program.short_description && (
                    <p
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.85)",
                        margin: 0,
                        lineHeight: 1.55,
                        maxWidth: 600,
                      }}
                    >
                      {program.short_description}
                    </p>
                  )}

                  {/* Deadline pill in hero */}
                  {deadline && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 14,
                        background: isExpired ? "rgba(198,40,40,0.75)" : "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 20,
                        padding: "5px 14px",
                        color: "#fff",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      <CalendarClock size={13} />
                      {isExpired
                        ? "Applications closed"
                        : daysLeft === 1
                        ? "Last day to apply!"
                        : daysLeft <= 7
                        ? `${daysLeft} days left`
                        : `Deadline: ${deadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ════════════════════════════
                BODY — two-column layout
            ════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 sm:gap-8 px-4 py-6 sm:px-6 lg:px-10 max-w-7xl mx-auto min-w-0 overflow-hidden">
              {/* ── Left column: main content ── */}
              <div style={{ minWidth: 0 }}>

                {/* Application status banner (if applied) */}
                {appConf && (
                  <div
                    style={{
                      background: appConf.bg,
                      border: `1px solid ${appConf.border}`,
                      borderRadius: 14,
                      padding: "16px 22px",
                      marginBottom: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <AppIcon size={20} color={appConf.color} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: appConf.color }}>{appConf.label}</div>
                      {myApplication?.admin_note && (
                        <div style={{ fontSize: 13, color: appConf.color, marginTop: 3, opacity: 0.85 }}>
                          Admin note: {myApplication.admin_note}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Program Details content card */}
                <div
                  style={{
                    background: COLORS.card,
                    borderRadius: 18,
                    border: `1px solid ${COLORS.border}`,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Card header */}
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
                      <Award size={18} color={COLORS.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: COLORS.ink }}>Program Details</div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 1 }}>
                        {program.content_type === "ai_text" ? "AI-formatted content" : "Structured content"}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "24px 28px" }}>
                    {program.content_type === "ai_text" ? (
                      <ReactMarkdown components={mdComponents}>
                        {program.ai_content || "*No content available.*"}
                      </ReactMarkdown>
                    ) : program.rich_blocks?.length > 0 ? (
                      <RichBlockRenderer blocks={program.rich_blocks} />
                    ) : (
                      <div style={{ textAlign: "center", padding: "32px 0", color: COLORS.muted, fontSize: 14 }}>
                        No content added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply CTA at bottom of content */}
                {canApply && (
                  <div
                    style={{
                      marginTop: 24,
                      background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
                      borderRadius: 18,
                      padding: "28px 32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 20,
                      boxShadow: `0 8px 28px ${COLORS.primary}30`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 5 }}>
                        Ready to apply?
                      </div>
                      <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.78)" }}>
                        {daysLeft ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left · ` : ""}Takes only a few minutes
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/programs/${id}/apply`)}
                      style={{
                        background: "#fff",
                        color: COLORS.primary,
                        border: "none",
                        borderRadius: 12,
                        padding: "13px 30px",
                        fontWeight: 800,
                        fontSize: 14.5,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      Apply Now →
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right column: sidebar info ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Quick info card */}
                <div
                  style={{
                    background: COLORS.card,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    padding: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink, marginBottom: 14 }}>
                    Program Info
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {deadline && (
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: isExpired ? "rgba(198, 40, 40, 0.2)" : `${COLORS.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CalendarClock size={16} color={isExpired ? "#f87171" : COLORS.primary} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Application Deadline
                          </div>
                          <div style={{ fontSize: 13.5, color: isExpired ? "#f87171" : COLORS.ink, fontWeight: 600, marginTop: 2 }}>
                            {isExpired ? "Closed" : deadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </div>
                          {daysLeft && (
                            <div style={{ fontSize: 12, color: daysLeft <= 3 ? "#fb923c" : COLORS.muted, marginTop: 2 }}>
                              {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {program.created_by && (
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${COLORS.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Award size={16} color={COLORS.primary} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Organized by
                          </div>
                          <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 600, marginTop: 2 }}>
                            {program.created_by.company_name || program.created_by.name}
                          </div>
                        </div>
                      </div>
                    )}

                    {program.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${COLORS.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Tag size={15} color={COLORS.primary} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                            Tags
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {program.tags.map((t) => (
                              <span
                                key={t}
                                style={{
                                  background: `${COLORS.primary}15`,
                                  color: COLORS.primary,
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  padding: "3px 9px",
                                  borderRadius: 20,
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Apply button in sidebar */}
                  {canApply && (
                    <button
                      onClick={() => navigate(`/programs/${id}/apply`)}
                      style={{
                        width: "100%",
                        marginTop: 18,
                        background: COLORS.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 11,
                        padding: "13px 0",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "opacity 0.15s, transform 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.01)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      Apply Now →
                    </button>
                  )}
                </div>

                {/* External Links card */}
                {program.external_links?.length > 0 && (
                  <div
                    style={{
                      background: COLORS.card,
                      borderRadius: 16,
                      border: `1px solid ${COLORS.border}`,
                      padding: "20px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: COLORS.ink,
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <Link2 size={15} color={COLORS.primary} />
                      Useful Links
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {program.external_links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: `1px solid ${COLORS.border}`,
                            textDecoration: "none",
                            color: COLORS.ink,
                            fontSize: 13.5,
                            fontWeight: 600,
                            transition: "all 0.15s",
                            background: "rgba(100, 116, 139, 0.08)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${COLORS.primary}12`;
                            e.currentTarget.style.borderColor = `${COLORS.primary}40`;
                            e.currentTarget.style.color = COLORS.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(100, 116, 139, 0.08)";
                            e.currentTarget.style.borderColor = COLORS.border;
                            e.currentTarget.style.color = COLORS.ink;
                          }}
                        >
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {link.label}
                          </span>
                          <ExternalLink size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Already applied status card */}
                {myApplication && appConf && (
                  <div
                    style={{
                      background: appConf.bg,
                      border: `1px solid ${appConf.border}`,
                      borderRadius: 14,
                      padding: "18px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <AppIcon size={16} color={appConf.color} />
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: appConf.color }}>{appConf.label}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: appConf.color, opacity: 0.8, lineHeight: 1.5 }}>
                      Applied on {new Date(myApplication.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
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

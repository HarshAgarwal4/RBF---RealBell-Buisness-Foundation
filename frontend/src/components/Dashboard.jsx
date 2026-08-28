import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/axios";
import { toast } from "react-toastify";
import {
  MessageCircle,
  Users,
  Search,
  Ticket,
  Pencil,
  ImageIcon,
  BarChart2,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Link2,
  Loader2,
  Calendar,
  Send,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { COLORS } from "./colors";
import { useStore } from "../zustand/store";

const chipStyle = {
  background: COLORS.hoverBg,
  color: COLORS.ink,
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 6,
};

function formatNewsDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ProgressRing({ percent }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={72} height={72} viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border, #E2E8F0)" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill={COLORS.primary}
      >
        {percent}%
      </text>
    </svg>
  );
}

function calculateProfileCompletion(user) {
  if (!user) return 0;
  let score = 0;
  const total = 7;

  if (user.name) score += 1;
  if (user.email) score += 1;
  if (user.phone) score += 1;
  if (user.company_name) score += 1;
  if (user.account?.image || user.profile?.logo) score += 1;

  let profData = {};
  if (typeof user.profile === "string") {
    try {
      profData = JSON.parse(user.profile);
    } catch {
      profData = {};
    }
  } else {
    profData = user.profile || {};
  }

  if (profData.tagline || profData.sector || profData.bio) score += 1;
  if (profData.website || profData.location || profData.stage) score += 1;

  return Math.min(100, Math.round((score / total) * 100));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, roles, switchOrganizationType } = useStore();
  const canSwitchRole = user?.role === "admin" || user?.role === "super_admin" || Boolean(user?.team);

  // Available organization types from fetched roles
  const orgTypeOptions = Array.isArray(roles) && roles.length > 0
    ? roles.map((r) => ({
        key: (r.key || r.label).toLowerCase(),
        label: r.label || r.key,
      }))
    : [
        { key: "startup", label: "Startup" },
        { key: "investor", label: "Investor" },
        { key: "mentor", label: "Mentor" },
        { key: "incubator", label: "Incubator" },
        { key: "accelerator", label: "Accelerator" },
      ];

  const [tab, setTab] = useState("Investor");
  const [resourceTab, setResourceTab] = useState("News");

  // Post box state
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);

  // Live Stats
  const [stats, setStats] = useState({
    connectRequests: 0,
    connections: 0,
    unreadMessages: 0,
    meetings: 0,
    tickets: 0,
  });

  // Dynamic Data Lists
  const [recommendations, setRecommendations] = useState({
    Investor: [],
    Mentors: [],
    Startups: [],
  });
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  const completionPercent = calculateProfileCompletion(user);

  useEffect(() => {
    document.title = "Dashboard | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "RealBell Business Foundation Ecosystem Dashboard - Track startup milestones, connections, incubation programs, and mentorship."
    );
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch connections
        const connRes = await axios.get("/connect/connections");
        if (connRes.data?.status === 1) {
          const summary = connRes.data.summary || {};
          const connGroups = connRes.data.connections || {};
          const activeList = Array.isArray(connGroups.active) ? connGroups.active : [];
          setMyConnections(activeList);
          setStats((prev) => ({
            ...prev,
            connectRequests: summary.pending_requests ?? summary.pending ?? 0,
            connections: summary.active ?? activeList.length ?? 0,
          }));
        }
      } catch (e) {
        console.error("Dashboard connection load error:", e);
      }

      try {
        // Fetch meetings
        const meetRes = await axios.get("/meetings");
        if (meetRes.data.status === 1) {
          const meetList = Array.isArray(meetRes.data.meetings) ? meetRes.data.meetings : [];
          setMeetings(meetList);
          setStats((prev) => ({ ...prev, meetings: meetList.length }));
        }
      } catch (e) {
        console.error("Dashboard meetings load error:", e);
      }

      try {
        // Fetch tickets
        const tktRes = await axios.get("/tickets");
        if (tktRes.data.status === 1) {
          const tktList = Array.isArray(tktRes.data.tickets) ? tktRes.data.tickets : [];
          setStats((prev) => ({ ...prev, tickets: tktList.length }));
        }
      } catch (e) {
        console.error("Dashboard tickets load error:", e);
      }

      try {
        // Fetch public programs
        const progRes = await axios.get("/programs/public");
        if (progRes.data.status === 1) {
          const progList = Array.isArray(progRes.data.programs) ? progRes.data.programs : [];
          setPrograms(progList.slice(0, 4));
        }
      } catch (e) {
        console.error("Dashboard programs load error:", e);
      }

      try {
        // Fetch public events
        const evtRes = await axios.get("/events/public");
        if (evtRes.data.status === 1) {
          const evtList = Array.isArray(evtRes.data.events) ? evtRes.data.events : [];
          setEvents(evtList.slice(0, 3));
        }
      } catch (e) {
        console.error("Dashboard events load error:", e);
      }

      try {
        // Fetch latest dynamic news
        setLoadingNews(true);
        const newsRes = await axios.get("/resources", { params: { type: "news", limit: 3 } });
        if (newsRes.data?.status === 1 || Array.isArray(newsRes.data?.resources)) {
          const list = newsRes.data.resources || [];
          setLatestNews(list.slice(0, 3));
        }
      } catch (e) {
        console.error("Dashboard news load error:", e);
      } finally {
        setLoadingNews(false);
      }
    }

    loadDashboardData();
  }, []);

  // Fetch recommendation list based on selected tab
  useEffect(() => {
    async function fetchRecommendationsData() {
      setLoadingRecs(true);
      try {
        const typeMap = { Investor: "investor", Mentors: "mentor", Startups: "startup" };
        const reqType = typeMap[tab] || "investor";

        const res = await axios.get(`/connect/${reqType}`);
        if (res.data.status === 1) {
          const profList = Array.isArray(res.data.profiles) ? res.data.profiles : [];
          setRecommendations((prev) => ({
            ...prev,
            [tab]: profList.slice(0, 4),
          }));
        }
      } catch (e) {
        console.error("Error fetching recommendations:", e);
      } finally {
        setLoadingRecs(false);
      }
    }

    fetchRecommendationsData();
  }, [tab]);

  // Handle publishing a new community post directly from Dashboard
  const handlePostSubmit = async () => {
    if (!postText.trim()) {
      toast.error("Please enter a message to post");
      return;
    }

    setPosting(true);
    try {
      const res = await axios.post("/community", { content: postText.trim() });
      if (res.data.status === 1) {
        toast.success("Post published to Community Wall!");
        setPostText("");
      } else {
        toast.error(res.data.msg || "Failed to publish post");
      }
    } catch (e) {
      console.error(e);
      toast.error("Server error publishing post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      className="ml-0 lg:ml-[300px] pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen transition-all"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: COLORS.bg,
      }}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Welcome back,</div>
          <div
            className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight"
            style={{
              color: COLORS.primary,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {user?.name || "Member"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Organization Type Switcher (Only visible to Admin, Super Admin, and Team Members) */}
          {canSwitchRole && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "5px 10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Ecosystem Role
                </div>
                <span style={{ fontSize: 10, color: COLORS.primary, fontWeight: 700, textTransform: "capitalize" }}>
                  {user?.team?.name ? `${user.team.name} Team` : (user?.role === "super_admin" ? "Super Admin" : "Admin")}
                </span>
              </div>

              <select
                value={user?.company_type || "startup"}
                onChange={(e) => switchOrganizationType(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.hoverBg,
                  color: COLORS.ink,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                  textTransform: "capitalize",
                }}
                title="Switch your active ecosystem view (Startups, Investors, Mentors, Incubators, Accelerators)"
              >
                {orgTypeOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <ProgressRing percent={completionPercent} />
          <button
            onClick={() => navigate("/profile/edit")}
            style={{
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Pencil size={13} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
        <div className="flex-1 flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-2xs">
          <Search size={16} color={COLORS.muted} className="shrink-0" />
          <input
            placeholder="Search startups, investors, mentors, or programs..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                navigate(`/connect/startups?search=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
            className="border-none outline-none flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-100 bg-transparent placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={() => navigate("/connect/startups")}
          className="flex h-10 sm:h-11 items-center justify-center gap-2 px-5 rounded-xl font-semibold text-xs sm:text-sm text-white transition cursor-pointer shrink-0"
          style={{
            background: COLORS.primary,
          }}
        >
          <Search size={14} /> Search
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-6">
        <div>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: stats.connectRequests, label: "Connect Requests", Icon: Users, path: "/connections" },
              { value: stats.connections, label: "Active Connections", Icon: MessageCircle, path: "/connections" },
              { value: stats.meetings, label: "Scheduled Meetings", Icon: BarChart2, path: "/meetings" },
              { value: stats.tickets, label: "Support Tickets", Icon: Ticket, path: "/tickets" },
            ].map((s) => (
              <div
                key={s.label}
                onClick={() => navigate(s.path)}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{s.value}</div>
                  <s.Icon size={18} color={COLORS.primary} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Functional Community Post Box */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} color={COLORS.primary} /> Share with the Community
              </span>
            </div>

            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind today? Announce updates, ask for help, or share insights..."
              rows={3}
              style={{
                width: "100%",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                outline: "none",
                resize: "none",
                fontSize: 14,
                color: COLORS.ink,
                background: COLORS.inputBg,
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                Posts are shared directly to the <span style={{ fontWeight: 700, color: COLORS.primary }}>Community Wall</span>.
              </div>

              <button
                onClick={handlePostSubmit}
                disabled={posting}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 24px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: posting ? 0.6 : 1,
                }}
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {posting ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </div>

          {/* Recommendations Tab */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>Explore & Connect</div>
              <div style={{ display: "flex", gap: 20 }}>
                {["Investors", "Mentors", "Startups"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t === "Investors" ? "Investor" : t)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      paddingBottom: 6,
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: (tab === t || (t === "Investors" && tab === "Investor")) ? COLORS.primary : COLORS.muted,
                      borderBottom: (tab === t || (t === "Investors" && tab === "Investor")) ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {loadingRecs ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: COLORS.muted }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} />
              </div>
            ) : !Array.isArray(recommendations[tab]) || recommendations[tab].length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                No recommendations found for this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {recommendations[tab].map((r) => (
                  <div
                    key={r._id}
                    onClick={() => navigate(`/connect/${r.company_type || "startup"}/${r._id}`)}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: COLORS.card,
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        height: 70,
                        background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
                        display: "flex",
                        alignItems: "flex-end",
                        padding: "0 10px 8px",
                      }}
                    >
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {r.company_name || r.name}
                      </span>
                    </div>
                    <div style={{ padding: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={chipStyle}>{r.company_type || "Member"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Programs Section */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>Active Programs</div>
              <button
                onClick={() => navigate("/programs")}
                style={{
                  background: COLORS.bg,
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: COLORS.primary,
                  cursor: "pointer",
                }}
              >
                View All
              </button>
            </div>

            {!Array.isArray(programs) || programs.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                No active programs available right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {programs.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/programs/${p._id}`)}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: COLORS.card,
                    }}
                  >
                    <div
                      style={{
                        height: 78,
                        background: "linear-gradient(135deg, #1E293B, #0F172A)",
                        display: "flex",
                        alignItems: "flex-end",
                        padding: "0 10px 8px",
                      }}
                    >
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {p.title}
                      </span>
                    </div>
                    <div style={{ padding: 10, fontSize: 12, color: COLORS.muted, minHeight: 34, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.short_description || p.category || "Incubation Program"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Ecosystem News Section */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>Latest Ecosystem News</div>
              <button
                onClick={() => navigate("/resources/news")}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                Browse All News →
              </button>
            </div>

            {loadingNews ? (
              <div style={{ padding: "28px 0", textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                <Loader2 size={20} className="animate-spin inline-block mr-2" />
                Loading latest news...
              </div>
            ) : latestNews.length === 0 ? (
              <div
                onClick={() => navigate("/resources/news")}
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 14,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: "pointer",
                  background: COLORS.card,
                  alignItems: "center",
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 10, background: "rgba(142, 27, 46, 0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  📰
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>
                    Explore RealBell News & Market Intelligence
                  </div>
                  <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 2 }}>
                    Read curated updates across funding, AI, tech, clean energy, and startup policies.
                  </div>
                </div>
                <ArrowRight size={16} color={COLORS.primary} />
              </div>
            ) : (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {latestNews.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (item.sourceUrl) {
                        window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
                      } else {
                        navigate("/resources/news");
                      }
                    }}
                    style={{
                      display: "flex",
                      gap: 14,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 12,
                      padding: 12,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      background: COLORS.card,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.primary)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
                  >
                    <div
                      style={{
                        width: 76,
                        height: 64,
                        borderRadius: 8,
                        background: "rgba(142, 27, 46, 0.12)",
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>📰</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13.5,
                          color: COLORS.ink,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: COLORS.muted,
                            marginTop: 3,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            lineHeight: "1.35",
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        {item.newsCategory && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              background: "rgba(142, 27, 46, 0.15)",
                              color: COLORS.primary,
                              padding: "2px 7px",
                              borderRadius: 4,
                            }}
                          >
                            {item.newsCategory}
                          </span>
                        )}
                        {item.sourceName && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.ink }}>
                            {item.sourceName}
                          </span>
                        )}
                        {item.publishedAt && (
                          <span style={{ fontSize: 11, color: COLORS.muted, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Calendar size={11} /> {formatNewsDate(item.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Connections, Meetings & Events */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Connections Card */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 6 }}>
              <div style={{ fontWeight: 800, color: COLORS.primary, fontSize: 14 }}>
                My Connections
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted }}>{stats.connections} Total</span>
            </div>

            {!Array.isArray(myConnections) || myConnections.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: COLORS.muted }}>
                No active connections yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
                {(Array.isArray(myConnections) ? myConnections : []).slice(0, 3).map((conn) => {
                  const p = conn.profile || conn.with || {};
                  return (
                    <div key={p._id || conn._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img
                        src={p.account?.image || "/default_user.png"}
                        alt="Avatar"
                        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {p.name || p.company_name || "Member"}
                        </div>
                        <span style={chipStyle}>{p.company_type || "Connection"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => navigate("/connections")}
              style={{
                width: "100%",
                marginTop: 16,
                background: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "10px 0",
                fontWeight: 700,
                fontSize: 13.5,
                color: COLORS.ink,
                cursor: "pointer",
              }}
            >
              View All Connections
            </button>
          </div>

          {/* Upcoming Meetings Card */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 6 }}>
              <div style={{ fontWeight: 800, color: COLORS.primary, fontSize: 14 }}>
                Upcoming Meetings
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted }}>{stats.meetings} Total</span>
            </div>

            {!Array.isArray(meetings) || meetings.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 0", color: COLORS.muted }}>
                <Calendar size={28} />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>No meetings scheduled</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {meetings.slice(0, 3).map((m) => (
                  <div key={m._id} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 2 }}>
                       {m.date ? new Date(m.date).toLocaleDateString() : ""} {m.time ? `· ${m.time}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events Card */}
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 6 }}>
              <div style={{ fontWeight: 800, color: COLORS.primary, fontSize: 14 }}>Upcoming Events</div>
              <button
                onClick={() => navigate("/events")}
                style={{ background: "none", border: "none", color: COLORS.primary, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                View All
              </button>
            </div>

            {!Array.isArray(events) || events.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 0", color: COLORS.muted }}>
                <Calendar size={28} />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>No events scheduled</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {events.map((evt) => (
                  <div
                    key={evt._id}
                    onClick={() => navigate(`/events/${evt._id}`)}
                    style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10, cursor: "pointer" }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{evt.title}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 2 }}>
                      {evt.date ? new Date(evt.date).toLocaleDateString() : "Upcoming Event"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
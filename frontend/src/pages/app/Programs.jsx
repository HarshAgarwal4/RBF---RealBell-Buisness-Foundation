import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axios";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import {
  Search,
  Calendar,
  Clock,
  Tag,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  Hourglass,
  Award,
  Plus,
} from "lucide-react";

const statusColors = {
  published: { bg: "#E8F5E9", color: "#2E7D32", label: "Open" },
  closed: { bg: "#FFEBEE", color: "#C62828", label: "Closed" },
  draft: { bg: "#FFF3E0", color: "#E65100", label: "Draft" },
};

const appStatusConfig = {
  pending: { icon: Hourglass, color: "#E65100", bg: "#FFF3E0", label: "Pending Review" },
  approved: { icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9", label: "Approved" },
  rejected: { icon: XCircle, color: "#C62828", bg: "#FFEBEE", label: "Rejected" },
};

function ProgramCard({ program, myApplication, onClick }) {
  const deadline = program.application_deadline
    ? new Date(program.application_deadline)
    : null;
  const isExpired = deadline && new Date() > deadline;
  const s = statusColors[program.status] || statusColors.published;
  const appConf = myApplication ? appStatusConfig[myApplication.status] : null;
  const AppIcon = appConf?.icon;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
        cursor: "pointer",
        transition: "transform 0.18s, box-shadow 0.18s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Banner */}
      <div
        style={{
          height: 130,
          background: program.banner_image
            ? `url(${program.banner_image}) center/cover no-repeat`
            : `linear-gradient(135deg, ${COLORS.primary}22 0%, ${COLORS.primary}44 100%)`,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Status badge */}
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: s.bg,
            color: s.color,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          {s.label}
        </span>
        {/* Logo */}
        {program.logo && (
          <div
            style={{
              position: "absolute",
              bottom: -20,
              left: 16,
              width: 42,
              height: 42,
              borderRadius: 10,
              border: "2.5px solid #fff",
              background: "#fff",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <img
              src={program.logo}
              alt="logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "24px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, color: COLORS.ink, marginBottom: 6, lineHeight: 1.3 }}>
          {program.title}
        </div>
        {program.short_description && (
          <div
            style={{
              fontSize: 13,
              color: COLORS.muted,
              lineHeight: 1.55,
              marginBottom: 12,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {program.short_description}
          </div>
        )}

        {/* Tags */}
        {program.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {program.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                style={{
                  background: `${COLORS.primary}12`,
                  color: COLORS.primary,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Deadline */}
        {deadline && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: isExpired ? "#C62828" : COLORS.muted,
              marginBottom: 12,
            }}
          >
            <Clock size={12} />
            {isExpired ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
          </div>
        )}

        {/* Application status badge */}
        {appConf && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: appConf.bg,
              color: appConf.color,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            <AppIcon size={13} />
            {appConf.label}
          </div>
        )}

        {/* CTA */}
        {!appConf && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: COLORS.primary,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            View Program <ChevronRight size={14} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Programs() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showMyApps, setShowMyApps] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [progRes, appRes] = await Promise.all([
        axios.get("/programs/public"),
        axios.get("/programs/my-applications"),
      ]);
      if (progRes.data.status === 1) setPrograms(progRes.data.programs);
      if (appRes.data.status === 1) setMyApplications(appRes.data.applications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = programs.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.short_description?.toLowerCase().includes(search.toLowerCase())
  );

  const getMyApp = (programId) =>
    myApplications.find((a) => a.program?._id === programId || a.program === programId);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F8FA" }}>
      <Sidebar />
      <main
        className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Programs
            </h1>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>
              Explore opportunities curated for you
            </div>
          </div>
          <button
            onClick={() => setShowMyApps(!showMyApps)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer self-start sm:self-auto"
            style={{
              border: `1.5px solid ${showMyApps ? COLORS.primary : COLORS.border}`,
              background: showMyApps ? COLORS.primary : "#fff",
              color: showMyApps ? "#fff" : COLORS.ink,
            }}
          >
            <FileText size={15} />
            My Applications
            {myApplications.length > 0 && (
              <span
                style={{
                  background: showMyApps ? "rgba(255,255,255,0.3)" : COLORS.primary,
                  color: "#fff",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                }}
              >
                {myApplications.length}
              </span>
            )}
          </button>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {/* My Applications panel */}
          {showMyApps && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                padding: 24,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: COLORS.ink,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Award size={18} color={COLORS.primary} />
                My Applications
              </div>
              {myApplications.length === 0 ? (
                <div style={{ textAlign: "center", color: COLORS.muted, padding: "24px 0", fontSize: 14 }}>
                  You haven't applied to any programs yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {myApplications.map((app) => {
                    const conf = appStatusConfig[app.status];
                    const Icon = conf.icon;
                    return (
                      <div
                        key={app._id}
                        onClick={() => navigate(`/programs/${app.program?._id}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "12px 16px",
                          borderRadius: 10,
                          border: `1px solid ${COLORS.border}`,
                          cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F8FA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {app.program?.banner_image ? (
                          <img
                            src={app.program.banner_image}
                            alt=""
                            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              background: `${COLORS.primary}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Award size={20} color={COLORS.primary} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink }}>
                            {app.program?.title || "Program"}
                          </div>
                          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                            Applied {new Date(app.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: conf.bg,
                            color: conf.color,
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: 20,
                          }}
                        >
                          <Icon size={12} />
                          {conf.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 mb-6 max-w-md">
            <Search size={16} color={COLORS.muted} className="shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs…"
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontSize: 14,
                color: COLORS.ink,
                background: "transparent",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.muted }}>
              Loading programs…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: COLORS.muted,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Award size={40} color={COLORS.border} />
              <div style={{ fontWeight: 600, fontSize: 16 }}>No programs found</div>
              <div style={{ fontSize: 14 }}>Check back later for new opportunities.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((p) => (
                <ProgramCard
                  key={p._id}
                  program={p}
                  myApplication={getMyApp(p._id)}
                  onClick={() => navigate(`/programs/${p._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

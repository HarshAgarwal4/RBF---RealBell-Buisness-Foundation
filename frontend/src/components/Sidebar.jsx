import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../zustand/store";
import axios from "../services/axios";
import { COLORS } from "./colors";
import { useTheme } from "../context/ThemeProvider";
import {
  MessageCircle,
  Users,
  Search,
  Scissors,
  HandCoins,
  Megaphone,
  Briefcase,
  DollarSign,
  BookOpen,
  Ticket,
  UserCircle2,
  LogOut,
  Eye,
  ChevronDown,
  Building2,
  Rocket,
  Landmark,
  Handshake,
  Newspaper,
  FileText,
  HelpCircle,
  FileArchive,
  BookMarked,
  BarChart2,
  Video,
  CreditCard,
  Menu,
  X,
  ShieldCheck,
  Sun,
  Moon,
  TrendingUp,
  Award,
  GraduationCap,
  Globe,
  Scale,
  FolderLock,
  Layers,
} from "lucide-react";

const ICON_MAP = {
  Rocket,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  Award,
  GraduationCap,
  Globe,
  Landmark,
  Handshake,
  Search,
};

const DEFAULT_CONNECT_CHILDREN = [
  { path: "/connect/startups", label: "Startups", icon: Rocket },
  { path: "/connect/investors", label: "Investors", icon: Landmark },
  { path: "/connect/mentors", label: "Mentors", icon: Handshake },
];

const pillBtnStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "9px 0",
  borderRadius: 20,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.card,
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.ink,
  cursor: "pointer",
};

function isChildActive(item, pathname) {
  return !!item.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + "/"));
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useStore();
  const roles = useStore((state) => state.roles);
  const { theme, toggleTheme } = useTheme();

  const [activeCount, setActiveCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic Connect sub-items: uses fetched organization types if present, else default 3 items
  const connectChildren = useMemo(() => {
    if (Array.isArray(roles) && roles.length > 0) {
      return roles.map((r) => ({
        path: `/connect/${r.key || r.label.toLowerCase()}`,
        label: r.label,
        icon:
          ICON_MAP[r.icon] ||
          (r.key === "investor"
            ? Landmark
            : r.key === "mentor"
            ? Handshake
            : r.key === "startup"
            ? Rocket
            : Building2),
      }));
    }
    return DEFAULT_CONNECT_CHILDREN;
  }, [roles]);

  const navItems = useMemo(() => {
    return [
      { path: "/dashboard", label: "Dashboard", icon: Building2 },
      {
        key: "connect",
        label: "Connect",
        icon: Search,
        children: connectChildren,
      },
      { path: "/community", label: "Community Wall", icon: Users },
      {
        key: "actions",
        label: "My Actions",
        icon: Scissors,
        children: [
          { path: "/connections", label: "Connections" },
          { path: "/meetings", label: "My Meetings" },
          { path: "/mentorship-hours", label: "Mentor Hours" },
          { path: "/milestones", label: "MileStones" },
        ],
      },
      { path: "/programs", label: "Programs", icon: HandCoins },
      { path: "/events", label: "Events", icon: Megaphone },
      { path: "/resources/news", label: "News", icon: Newspaper },
      { path: "/resources/videos", label: "Videos", icon: Video },
      {
        key: "legal_compliance",
        label: "Legal Compliances",
        icon: Scale,
        children: [
          { path: "/legal-compliances", label: "Available Services", icon: Scale },
          { path: "/legal-compliances/my-applications", label: "My Applications", icon: Layers },
          { path: "/legal-compliances/documents", label: "Legal Documents", icon: FolderLock },
        ],
      },
      { path: "/jobs", label: "Jobs", icon: Briefcase },
      { path: "/subscription", label: "Subscriptions", icon: CreditCard },
      { path: "/booster", label: "Startup Booster Kit", icon: DollarSign },
      {
        key: "resources",
        label: "Resources",
        icon: BookOpen,
        children: [
          { path: "/resources/contracts", label: "Contracts & Legal Templates", icon: FileArchive },
          { path: "/resources/glossary",  label: "Glossary",                   icon: BookMarked },
          { path: "/resources/reports",   label: "Reports",                    icon: BarChart2  },
        ],
      },
      { path: "/tickets", label: "Tickets", icon: Ticket },
      { path: "/account", label: "Account Settings", icon: UserCircle2 },
    ];
  }, [connectChildren]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    async function loadConnectionsCount() {
      try {
        const res = await axios.get("/connect/connections");
        if (res.data?.status === 1) {
          setActiveCount(res.data.summary?.active || 0);
        }
      } catch (e) {
        console.error("Sidebar connection count fetch error:", e);
      }
    }
    loadConnectionsCount();
  }, []);

  // Tracks which expandable items are open, e.g. { connect: true }
  const [openKeys, setOpenKeys] = useState({});

  // Auto-expand a section when the current route lives inside it.
  const routeOpenKeys = {};
  navItems.forEach((item) => {
    if (item.children && isChildActive(item, location.pathname)) {
      routeOpenKeys[item.key] = true;
    }
  });

  const toggleKey = (key) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;

    // Expandable parent item
    if (item.children) {
      const open = !!openKeys[item.key] || !!routeOpenKeys[item.key];
      const parentActive = isChildActive(item, location.pathname);

      return (
        <div key={item.key} style={{ marginBottom: 2 }}>
          <button
            onClick={() => toggleKey(item.key)}
            aria-expanded={open}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: parentActive && !open ? "#F6E9EB" : "transparent",
              color: "#3A3A46",
              fontWeight: parentActive ? 700 : 500,
              fontSize: 14.5,
              textAlign: "left",
              transition: "background 0.15s",
            }}
          >
            {Icon && <Icon size={17} color={COLORS.primary} style={{ opacity: 0.85, flexShrink: 0 }} />}
            <span style={{ flex: 1 }}>{item.label}</span>
            <ChevronDown
              size={15}
              style={{
                opacity: 0.6,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
                flexShrink: 0,
              }}
            />
          </button>

          {/* Submenu */}
          <div
            style={{
              maxHeight: open ? item.children.length * 44 + 8 : 0,
              overflow: "hidden",
              transition: "max-height 0.2s ease",
            }}
          >
            <div style={{ paddingLeft: 16, marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childActive = location.pathname === child.path;
                return (
                  <button
                    key={child.path}
                    onClick={() => navigate(child.path)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: childActive ? COLORS.primary : "transparent",
                      color: childActive ? "#fff" : "#5B5B68",
                      fontWeight: childActive ? 700 : 500,
                      fontSize: 13.5,
                      textAlign: "left",
                      borderLeft: `2px solid ${childActive ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {ChildIcon && (
                      <ChildIcon size={14} color={childActive ? "#fff" : COLORS.muted} style={{ flexShrink: 0 }} />
                    ) }
                    <span style={{ flex: 1 }}>{child.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Plain (non-expandable) item
    const active = location.pathname === item.path;
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 12px",
          marginBottom: 2,
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: active ? COLORS.primary : "transparent",
          color: active ? "#fff" : "#3A3A46",
          fontWeight: active ? 700 : 500,
          fontSize: 14.5,
          textAlign: "left",
          transition: "background 0.15s",
        }}
      >
        <Icon size={17} color={active ? "#fff" : COLORS.primary} style={{ opacity: active ? 1 : 0.85 }} />
        <span style={{ flex: 1 }}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Top Mobile Navbar with Hamburger Button (appears on mobile/tablet screen sizes < 1024px) */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-[#E4E9F1] bg-white px-4 lg:hidden shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F7FA] text-[#18213A] hover:bg-[#EEF0F5] transition active:scale-95 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img
              src="/logo.png"
              alt="RealBell"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 800,
                fontSize: 16,
                color: COLORS.ink,
                letterSpacing: 0.2,
              }}
            >
              REAL<span style={{ color: COLORS.primary }}>BELL</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>
          <button
            type="button"
            onClick={() => navigate("/connections?section=chat")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9EB] text-[#B52B2B] hover:bg-[#F0D5D8] transition cursor-pointer"
            title="Messages"
          >
            <MessageCircle size={18} />
          </button>
          <div
            onClick={() => navigate("/profile")}
            className="h-9 w-9 rounded-full bg-[#FDEB6B] overflow-hidden border border-gray-200 cursor-pointer"
            title="Profile"
          >
            <img
              src={user?.profile?.logo || "/default_user.png"}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer: Fixed on Desktop (>= 1024px), Slide-in Overlay on Mobile (< 1024px) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex h-full flex-col border-r border-[#E4E9F1] bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        style={{
          width: 300,
          minWidth: 300,
          background: COLORS.card,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
      {/* Logo */}
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo.png"
            alt="RealBell Business Foundation"
            style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div
            style={{
              display: "none",
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontFamily: "Georgia, serif",
              flexShrink: 0,
            }}
          >
            R
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 800,
                fontSize: 15,
                color: COLORS.ink,
                letterSpacing: 0.2,
              }}
            >
              REAL<span style={{ color: COLORS.primary }}>BELL</span>
            </div>
            <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Business Foundation
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: "flex",
              height: 32,
              width: 32,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              cursor: "pointer",
            }}
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === "dark" ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
          </button>
          {/* Mobile Close Button inside Sidebar */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition cursor-pointer"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#FDEB6B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={user?.profile?.logo || "/default_user.png"}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
          <div onClick={() => navigate("/profile")} style={{ flex: 1, cursor: "pointer", minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }} className="truncate">{user?.name}</div>
            <span style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: 500 }}>
              My Profile
            </span>
          </div>
          <div
            title="Total Active Connections"
            onClick={() => navigate("/connections")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 9px",
              borderRadius: 14,
              background: "#F6E9EB",
              color: "#B52B2B",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Users size={12} />
            {activeCount}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={() => navigate('/connections?section=chat')} style={pillBtnStyle}>
            <MessageCircle size={15} /> Messages
          </button>
          <button onClick={() => navigate('/connections')} style={pillBtnStyle}>
            <Users size={15} /> Connections
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none"
        style={{
          overflowY: "auto",
          maxHeight: "100%",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <button
            onClick={() => navigate("/admin")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 12px",
              marginBottom: 6,
              borderRadius: 10,
              border: `1px solid ${COLORS.primary}40`,
              cursor: "pointer",
              background: location.pathname.startsWith("/admin") ? COLORS.primary : "#FFF5F6",
              color: location.pathname.startsWith("/admin") ? "#fff" : COLORS.primary,
              fontWeight: 700,
              fontSize: 14.5,
              textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <ShieldCheck size={18} color={location.pathname.startsWith("/admin") ? "#fff" : COLORS.primary} />
            <span style={{ flex: 1 }}>Admin Panel</span>
          </button>
        )}
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Logout */}
      <div style={{ padding: 16 }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: COLORS.ink,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px 0",
            fontWeight: 700,
            fontSize: 14.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
    </>
  );
}

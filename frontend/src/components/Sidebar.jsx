import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
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
  Radio,
  Bell,
  Zap,
} from "lucide-react";
import { useWebNotifications } from "../hooks/useWebNotifications";

const ICON_MAP = {
  Landmark,
  Handshake,
  Rocket,
  Building2,
  Search,
  Users,
  Radio,
  Scale,
  Scissors,
  HandCoins,
  Megaphone,
  Newspaper,
  Briefcase,
  CreditCard: DollarSign,
  DollarSign,
  BookOpen,
  Ticket,
  UserCircle2,
  Bell,
  Zap,
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
  background: COLORS.cardElevated,
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
  const navRef = useRef(null);

  const { unreadCount } = useWebNotifications({ autoPoll: true, triggerWebAlerts: true });
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
      { path: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
      {
        key: "connect",
        label: "Connect",
        icon: Search,
        children: connectChildren,
      },
      { path: "/community", label: "Community Wall", icon: Users },
      { path: "/live_sessions", label: "Live Sessions & Meetings", icon: Radio },
      {
        key: "legal_compliance",
        label: "Legal Compliance",
        icon: Scale,
        children: [
          { path: "/legal-compliances", label: "Available Services", icon: Scale },
          { path: "/legal-compliances/my-applications", label: "My Applications", icon: Layers },
          { path: "/legal-compliances/documents", label: "Legal Documents", icon: FolderLock },
        ],
      },
      {
        key: "actions",
        label: "My Workspace",
        icon: Scissors,
        children: [
          { path: "/connections", label: "My Connections" },
          { path: "/live_sessions", label: "Live Sessions & Meetings" },
          { path: "/meetings", label: "Scheduled Meetings" },
          { path: "/milestones", label: "Milestone Tracking" },
        ],
      },
      { path: "/programs", label: "Programs", icon: HandCoins },
      { path: "/events", label: "Events & Workshops", icon: Megaphone },
      { path: "/resources/news", label: "Industry News", icon: Newspaper },
      { path: "/resources/videos", label: "Knowledge Videos", icon: Video },
      { path: "/jobs", label: "Job Opportunities", icon: Briefcase },
      {
        key: "assessments",
        label: "Assessments",
        icon: GraduationCap,
        children: [
          { path: "/assessments", label: "Browse Tests", icon: GraduationCap },
          { path: "/my-certificates", label: "My Certificates", icon: Award },
        ],
      },
      { path: "/subscription", label: "Membership Plans", icon: DollarSign },
      { path: "/booster", label: "Business Booster Kit", icon: Zap },
      {
        key: "resources",
        label: "Resource Library",
        icon: BookOpen,
        children: [
          { path: "/resources/contracts", label: "Legal & Contract Templates", icon: FileArchive },
          { path: "/resources/glossary",  label: "Startup Glossary",            icon: BookMarked },
          { path: "/resources/reports",   label: "Research & Market Reports",   icon: BarChart2  },
        ],
      },
      { path: "/tickets", label: "Support Tickets", icon: Ticket },
      { path: "/account", label: "Account Settings", icon: UserCircle2 },
    ];
  }, [connectChildren, unreadCount]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Restore sidebar scroll position across renders & page navigation
  useLayoutEffect(() => {
    const restore = () => {
      const saved = sessionStorage.getItem("rbf_sidebar_scroll");
      if (saved !== null && navRef.current) {
        navRef.current.scrollTop = Number(saved);
      }
    };
    restore();
    const rafId = requestAnimationFrame(restore);
    const timer = setTimeout(restore, 60);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
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
  const routeOpenKeys = useMemo(() => {
    const keys = {};
    navItems.forEach((item) => {
      if (item.children && isChildActive(item, location.pathname)) {
        keys[item.key] = true;
      }
    });
    return keys;
  }, [navItems, location.pathname]);

  const isItemOpen = (key) => {
    if (openKeys[key] !== undefined) {
      return !!openKeys[key];
    }
    return !!routeOpenKeys[key];
  };

  const toggleKey = (key, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (navRef.current) {
      sessionStorage.setItem("rbf_sidebar_scroll", String(navRef.current.scrollTop));
    }
    setOpenKeys((prev) => {
      const currentVal = prev[key] !== undefined ? prev[key] : !routeOpenKeys[key];
      return { ...prev, [key]: !currentVal };
    });
  };

  const handleNavigate = (path) => {
    if (navRef.current) {
      sessionStorage.setItem("rbf_sidebar_scroll", String(navRef.current.scrollTop));
    }
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;

    // Expandable parent item
    if (item.children) {
      const open = isItemOpen(item.key);
      const parentActive = isChildActive(item, location.pathname);

      return (
        <div key={item.key} style={{ marginBottom: 2 }}>
          <button
            type="button"
            onClick={(e) => toggleKey(item.key, e)}
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
              background: parentActive && !open ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : "transparent",
              color: parentActive ? COLORS.primary : COLORS.ink,
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
                const childActive =
                  location.pathname === child.path ||
                  (child.path === "/live_sessions" && location.pathname === "/live-sessions");
                return (
                  <button
                    type="button"
                    key={child.path}
                    onClick={() => handleNavigate(child.path)}
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
                      color: childActive ? "#fff" : COLORS.textSubtle,
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
    const active =
      location.pathname === item.path ||
      (item.path === "/live_sessions" && location.pathname === "/live-sessions");
    return (
      <button
        type="button"
        key={item.path}
        onClick={() => handleNavigate(item.path)}
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
          color: active ? "#fff" : COLORS.ink,
          fontWeight: active ? 700 : 500,
          fontSize: 14.5,
          textAlign: "left",
          transition: "background 0.15s",
        }}
      >
        <Icon size={17} color={active ? "#fff" : COLORS.primary} style={{ opacity: active ? 1 : 0.85, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              background: active ? "#fff" : COLORS.primary,
              color: active ? COLORS.primary : "#fff",
              padding: "1px 7px",
              borderRadius: 99,
              lineHeight: "16px",
              flexShrink: 0,
            }}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Top Mobile Navbar with Hamburger Button (appears on mobile/tablet screen sizes < 1024px) */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-[#E4E9F1] dark:border-[#263744] bg-white dark:bg-[#0D141B] px-4 lg:hidden shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F7FA] dark:bg-[#182530] text-[#18213A] dark:text-[#F1F5F9] hover:bg-[#EEF0F5] dark:hover:bg-[#203040] transition active:scale-95 cursor-pointer"
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-[#182530] text-slate-700 dark:text-cyan-400 hover:bg-slate-200 dark:hover:bg-[#203040] transition cursor-pointer"
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === "dark" ? <Sun size={18} color="#06B6D4" /> : <Moon size={18} color="#6366f1" />}
          </button>
          <button
            onClick={() => navigate("/notifications")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-[#182530] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#203040] transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/connections?section=chat")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6E9EB] text-[#B52B2B] hover:bg-[#F0D5D8] transition relative cursor-pointer"
            title="Messages"
          >
            <MessageCircle size={16} />
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 dark:border-[#263744] cursor-pointer"
            title="Profile"
          >
            <img
              src={user?.profile?.logo || "/default_user.png"}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar (Drawer on mobile/tablet, Fixed on desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-[#E7E7EC] dark:border-[#263744] bg-white dark:bg-[#0D141B] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: 300,
          minWidth: 300,
          background: COLORS.sidebarBg,
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
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.hoverBg,
              cursor: "pointer",
            }}
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === "dark" ? <Sun size={16} color="#06B6D4" /> : <Moon size={16} color="#6366f1" />}
          </button>
          {/* Mobile Close Button inside Sidebar */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#182530] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#203040] transition cursor-pointer"
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
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 10.5, color: COLORS.muted, fontWeight: 600, textTransform: "capitalize" }}>
                {user?.company_type || "Member"}
              </span>
              {user?.team?.name && (
                <span style={{ fontSize: 9.5, background: "rgba(6,182,212,0.15)", color: "#06B6D4", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                  🏢 {user.team.name}
                </span>
              )}
            </div>
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
              background: "color-mix(in srgb, var(--color-primary) 16%, transparent)",
              color: "var(--color-primary)",
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
        ref={navRef}
        onScroll={(e) => {
          sessionStorage.setItem("rbf_sidebar_scroll", String(e.currentTarget.scrollTop));
        }}
        className="flex-1 overflow-y-auto px-3 py-2 sidebar-desktop-scroll"
        style={{
          overflowY: "auto",
          maxHeight: "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {(user?.role === "admin" || user?.role === "super_admin" || Boolean(user?.team)) && (
          <button
            onClick={() => navigate("/admin")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 12px",
              marginBottom: 8,
              borderRadius: 10,
              border: `1px solid color-mix(in srgb, var(--color-primary) 28%, transparent)`,
              cursor: "pointer",
              background: location.pathname.startsWith("/admin") ? COLORS.primary : "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              color: location.pathname.startsWith("/admin") ? "#fff" : COLORS.primary,
              fontWeight: 700,
              fontSize: 14.5,
              textAlign: "left",
              transition: "all 0.15s",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <ShieldCheck size={18} color={location.pathname.startsWith("/admin") ? "#fff" : COLORS.primary} />
            <div style={{ flex: 1, lineHeight: 1.2 }}>
              <div>Admin Panel</div>
              {user?.team?.name && (
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 500 }}>
                  Team: {user.team.name}
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, background: "color-mix(in srgb, var(--color-primary) 18%, transparent)", padding: "2px 6px", borderRadius: 4, color: COLORS.primary, fontWeight: 700 }}>
              Console →
            </span>
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
            background: COLORS.darkBtnBg,
            color: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "13px 0",
            fontWeight: 700,
            fontSize: 14.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
    </>
  );
}

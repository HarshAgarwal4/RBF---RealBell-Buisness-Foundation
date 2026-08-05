import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../zustand/store";
import { COLORS } from "./colors";
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
} from "lucide-react";

/**
 * Nav config.
 * - Plain item:      { path, label, icon }
 * - Expandable item:  { key, label, icon, children: [{ path, label, icon? }, ...] }
 *
 * To add a new expandable section in the future, just add a `children` array —
 * no other code changes are needed. `key` is only required for expandable
 * items (used to track open/closed state); plain items don't need one.
 */
const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: Building2 },
  {
    key: "connect",
    label: "Connect",
    icon: Search,
    children: [
      { path: "/connect/startups", label: "Startups", icon: Rocket },
      { path: "/connect/investors", label: "Investors", icon: Landmark },
      { path: "/connect/mentors", label: "Mentors", icon: Handshake },
    ],
  },
  { path: "/community", label: "Community Wall", icon: Users },
  {
    key: "actions",
    label: "My Actions",
    icon: Scissors,
    children: [
      { path: "/connections", label: "Connections"},
      { path: "/meetings", label: "My Meetings" },
      { path: "/mentorship-hours", label: "Mentor Hours" },
      { path: "/milestones", label: "MileStones" },
    ],
  },
  { path: "/programs", label: "Programs", icon: HandCoins },
  { path: "/events", label: "Events", icon: Megaphone },
  { path: "/jobs", label: "Jobs", icon: Briefcase },
  { path: "/booster", label: "Startup Booster Kit", icon: DollarSign },
  {
    key: "resources",
    label: "Resources",
    icon: BookOpen,
    children: [
      { path: "/resources/articles", label: "Articles", icon: Newspaper },
      { path: "/resources/guides", label: "Guides", icon: FileText },
      { path: "/resources/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  { path: "/tickets", label: "Tickets", icon: Ticket },
  { path: "/account", label: "Account Settings", icon: UserCircle2 },
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
  background: "#fff",
  fontSize: 13,
  fontWeight: 600,
  color: "#3A3A46",
  cursor: "pointer",
};

function isChildActive(item, pathname) {
  return !!item.children?.some((c) => pathname === c.path || pathname.startsWith(c.path + "/"));
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useStore();

  // Tracks which expandable items are open, e.g. { connect: true }
  const [openKeys, setOpenKeys] = useState({});

  // Auto-expand a section when the current route lives inside it.
  const routeOpenKeys = {};
  NAV_ITEMS.forEach((item) => {
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
    <aside
      style={{
        width: 300,
        minWidth: 300,
        background: COLORS.card,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo.png"
            alt="RealBell Business Foundation"
            style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div
            style={{
              display: "none",
              width: 40,
              height: 40,
              borderRadius: 10,
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
                fontSize: 16,
                color: COLORS.ink,
                letterSpacing: 0.2,
              }}
            >
              REAL<span style={{ color: COLORS.primary }}>BELL</span>
            </div>
            <div style={{ fontSize: 9.5, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
              Business Foundation
            </div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 46,
                height: 46,
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
          <div onClick={() => navigate("/profile")} style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink }}>{user?.name}</div>
            <button
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                fontWeight: 600,
                fontSize: 12.5,
                color: COLORS.muted,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              My Profile
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#EFEFF3",
              borderRadius: 20,
              padding: "4px 9px",
              fontSize: 12.5,
              color: COLORS.muted,
              fontWeight: 600,
            }}
          >
            <Eye size={13} /> 2
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button style={pillBtnStyle}>
            <MessageCircle size={15} /> Messages
          </button>
          <button onClick={() => navigate('/connections')} style={pillBtnStyle}>
            <Users size={15} /> Connections
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {NAV_ITEMS.map((item) => renderNavItem(item))}
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
  );
}

import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminTheme } from "./AdminThemeContext";
import { toast } from "react-toastify";
import { Palette, RefreshCw, Check, Sun, Moon, Sparkles } from "lucide-react";

const ACCENT_PRESETS = [
  { label: "Indigo Violet", hex: "#6366f1" },
  { label: "Emerald Green", hex: "#10b981" },
  { label: "Amber Gold", hex: "#f59e0b" },
  { label: "Rose Crimson", hex: "#f43f5e" },
  { label: "Cyan Blue", hex: "#06b6d4" },
  { label: "Purple Orchid", hex: "#a855f7" },
];

export default function AdminThemeCustomizer() {
  const {
    theme,
    toggleTheme,
    customColors,
    updateCustomColor,
    setAllCustomColors,
    resetCustomColors,
    defaultColors,
  } = useAdminTheme();

  const [activeTab, setActiveTab] = useState(theme); // 'dark' or 'light'
  const [localColors, setLocalColors] = useState(customColors);

  const handleColorChange = (key, value) => {
    const updated = { ...localColors, [key]: value };
    setLocalColors(updated);
    updateCustomColor(key, value);
  };

  const handleSave = () => {
    setAllCustomColors(localColors);
    toast.success("Theme customization saved!");
  };

  const handleReset = () => {
    if (window.confirm("Reset all theme colors to default settings?")) {
      setLocalColors(defaultColors);
      resetCustomColors();
      toast.info("Theme reset to defaults");
    }
  };

  const ColorInput = ({ label, colorKey }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
        border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
        borderRadius: 10,
        padding: "10px 14px",
      }}
    >
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--admin-text-primary, #e2e8f0)" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--admin-text-muted, #94a3b8)", fontFamily: "monospace" }}>
          {localColors[colorKey] || "#ffffff"}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color"
          value={localColors[colorKey] || "#ffffff"}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: "transparent",
          }}
        />
      </div>
    </div>
  );

  return (
    <AdminLayout title="Theme Customizer">
      <div>
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--admin-text-primary, #e2e8f0)", margin: 0 }}>
              Admin Theme Customizer
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--admin-text-subtle, #64748b)", margin: "2px 0 0" }}>
              Customize color palettes for Dark and Light mode across the entire Admin Panel
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleReset}
              className="admin-btn admin-btn-secondary"
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              <RefreshCw size={13} /> Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="admin-btn admin-btn-primary"
              style={{ padding: "6px 16px", fontSize: 12 }}
            >
              <Check size={14} /> Save Theme Settings
            </button>
          </div>
        </div>

        {/* Brand Primary Accent Selector */}
        <div
          style={{
            background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
            border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
            borderRadius: 14,
            padding: "16px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--admin-text-primary, #e2e8f0)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={15} color="#6366f1" /> Brand Accent Color
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                onClick={() => handleColorChange("primaryColor", preset.hex)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: localColors.primaryColor === preset.hex ? "2px solid #ffffff" : "1px solid var(--admin-border-subtle, rgba(255,255,255,0.1))",
                  background: "var(--admin-input-bg, rgba(255,255,255,0.04))",
                  color: "var(--admin-text-primary, #e2e8f0)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: preset.hex }} />
                {preset.label}
              </button>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
              <span style={{ fontSize: 12, color: "var(--admin-text-subtle, #64748b)" }}>Custom:</span>
              <input
                type="color"
                value={localColors.primaryColor || "#6366f1"}
                onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", background: "transparent" }}
              />
            </div>
          </div>
        </div>

        {/* Tabs for Dark / Light Theme customization */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab("dark")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: activeTab === "dark" ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
              background: activeTab === "dark" ? "rgba(99,102,241,0.15)" : "var(--admin-card-bg, rgba(255,255,255,0.03))",
              color: activeTab === "dark" ? "#a5b4fc" : "var(--admin-text-subtle, #64748b)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Moon size={15} /> 🌙 Dark Theme Palette
          </button>
          <button
            onClick={() => setActiveTab("light")}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: activeTab === "light" ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))",
              background: activeTab === "light" ? "rgba(99,102,241,0.15)" : "var(--admin-card-bg, rgba(255,255,255,0.03))",
              color: activeTab === "light" ? "#a5b4fc" : "var(--admin-text-subtle, #64748b)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Sun size={15} /> ☀️ Light Theme Palette
          </button>
        </div>

        {/* Color Pickers Grid */}
        {activeTab === "dark" ? (
          <div className="admin-grid-2col" style={{ marginBottom: 24 }}>
            <ColorInput label="Dark Page Background" colorKey="darkBg" />
            <ColorInput label="Dark Sidebar Background" colorKey="darkSidebarBg" />
            <ColorInput label="Dark Topbar Background" colorKey="darkTopbarBg" />
            <ColorInput label="Dark Card / Box Background" colorKey="darkCardBg" />
            <ColorInput label="Dark Input Field Background" colorKey="darkInputBg" />
            <ColorInput label="Dark Input Border" colorKey="darkInputBorder" />
            <ColorInput label="Dark Primary Text Color" colorKey="darkTextPrimary" />
            <ColorInput label="Dark Muted Text Color" colorKey="darkTextMuted" />
          </div>
        ) : (
          <div className="admin-grid-2col" style={{ marginBottom: 24 }}>
            <ColorInput label="Light Page Background" colorKey="lightBg" />
            <ColorInput label="Light Sidebar Background" colorKey="lightSidebarBg" />
            <ColorInput label="Light Topbar Background" colorKey="lightTopbarBg" />
            <ColorInput label="Light Card / Box Background" colorKey="lightCardBg" />
            <ColorInput label="Light Input Field Background" colorKey="lightInputBg" />
            <ColorInput label="Light Input Border" colorKey="lightInputBorder" />
            <ColorInput label="Light Primary Text Color" colorKey="lightTextPrimary" />
            <ColorInput label="Light Muted Text Color" colorKey="lightTextMuted" />
          </div>
        )}

        {/* Live UI Preview Card */}
        <div
          style={{
            background: "var(--admin-card-bg, rgba(255,255,255,0.03))",
            border: "1px solid var(--admin-card-border, rgba(255,255,255,0.07))",
            borderRadius: 14,
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-subtle, #64748b)", marginBottom: 12 }}>
            Live UI Preview (Current Active Theme: {theme.toUpperCase()})
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              border: "1px solid var(--admin-card-border)",
              background: "var(--admin-bg)",
              color: "var(--admin-text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", color: "var(--admin-text-primary)" }}>Preview Card Component</h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
                  This is how text, cards, buttons, and inputs render with your custom color palette.
                </p>
              </div>
              <button
                className="admin-btn admin-btn-primary"
                style={{ padding: "6px 14px", fontSize: 12, background: localColors.primaryColor || "#6366f1" }}
              >
                Action Button
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="admin-search-input"
                placeholder="Sample text input field..."
                style={{ flex: 1, minWidth: 160 }}
                readOnly
              />
              <button className="admin-btn admin-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                Secondary Action
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

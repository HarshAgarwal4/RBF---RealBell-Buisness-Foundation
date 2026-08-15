import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";
import "./adminTheme.css";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Info,
  Clock,
  UserCheck,
} from "lucide-react";

const AUTH_METHODS = [
  {
    id: "otp",
    title: "OTP Based Authentication",
    subtitle: "Email One-Time Password",
    icon: KeyRound,
    color: "amber",
    badge: "Passwordless",
    desc: "Users enter their email and verify with a 6-digit one-time code sent directly to their inbox.",
    highlights: [
      "Eliminates password fatigue and weak password risks",
      "Guarantees verified inbox ownership per session",
      "Instant sign-in without remembering credentials",
    ],
  },
  {
    id: "password",
    title: "Password Based Authentication",
    subtitle: "Traditional Password Login",
    icon: Lock,
    color: "blue",
    badge: "Direct Access",
    desc: "Users sign in directly using their registered email and encrypted bcrypt password.",
    highlights: [
      "Instant 1-step login without email delivery dependency",
      "Bcrypt hashed security with minimum character validation",
      "Ideal for quick and repetitive dashboard access",
    ],
  },
  {
    id: "both",
    title: "Hybrid (OTP & Password)",
    subtitle: "Flexible Multi-Mode Access",
    icon: Layers,
    color: "emerald",
    badge: "Recommended",
    desc: "Provides users the choice to authenticate either using their secure password or via Email OTP.",
    highlights: [
      "Maximum convenience & resilience for all stakeholder roles",
      "Automatic fallback if mailbox delivery is delayed",
      "Users can toggle freely between Password and OTP",
    ],
  },
];

export default function AdminAuthSettings() {
  const [selectedMethod, setSelectedMethod] = useState("both");
  const [activeMethod, setActiveMethod] = useState("both");
  const [description, setDescription] = useState("");
  const [settingMeta, setSettingMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/auth-settings");
      if (res.data.status === 1 && res.data.setting) {
        const s = res.data.setting;
        setSelectedMethod(s.loginMethod || "both");
        setActiveMethod(s.loginMethod || "both");
        setDescription(s.description || "");
        setSettingMeta(s);
      }
    } catch (err) {
      console.error("Error loading auth settings:", err);
      toast.error("Failed to load authentication settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setLoginMethod = useStore((state) => state.setLoginMethod);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put("/admin/auth-settings", {
        loginMethod: selectedMethod,
        description,
      });
      if (res.data.status === 1) {
        toast.success(res.data.msg || "Authentication method updated!");
        setActiveMethod(selectedMethod);
        setLoginMethod(selectedMethod);
        if (res.data.setting) {
          setSettingMeta(res.data.setting);
        }
      } else {
        toast.error(res.data.msg || "Failed to update authentication method");
      }
    } catch (err) {
      console.error("Error saving auth settings:", err);
      toast.error("An error occurred while saving authentication method");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6"
          style={{
            borderBottom: "1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08))",
          }}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(217, 119, 6, 0.15)",
                  color: "#f59e0b",
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h1
                className="text-2xl font-black tracking-tight"
                style={{
                  color: "var(--admin-text-primary, #ffffff)",
                }}
              >
                Authentication Method Manager
              </h1>
            </div>
            <p
              className="mt-1 text-sm"
              style={{
                color: "var(--admin-text-muted, #94a3b8)",
              }}
            >
              Configure how founders, investors, mentors, and incubators log in to RealBell Business Foundation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: "var(--admin-card-bg, #151827)",
                border: "1px solid var(--admin-card-border, rgba(255, 255, 255, 0.1))",
                color: "var(--admin-text-primary, #f1f5f9)",
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading || selectedMethod === activeMethod}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #d97706, #b45309)",
                boxShadow: "0 4px 12px rgba(217, 119, 6, 0.3)",
              }}
            >
              <Save size={14} />
              <span>{saving ? "Saving Changes..." : "Apply Method"}</span>
            </button>
          </div>
        </div>

        {/* Current Active Status Alert Banner */}
        <div
          className="p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: "var(--admin-card-bg, #151827)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            boxShadow: "var(--admin-box-shadow, 0 10px 30px rgba(0, 0, 0, 0.2))",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                Live Login Configuration
              </div>
              <div
                className="text-base font-black capitalize"
                style={{
                  color: "var(--admin-text-primary, #ffffff)",
                }}
              >
                Currently Active:{" "}
                <span className="text-amber-500 underline underline-offset-4">
                  {activeMethod === "both"
                    ? "Hybrid (OTP & Password)"
                    : activeMethod === "otp"
                    ? "OTP Verification Only"
                    : "Password Login Only"}
                </span>
              </div>
            </div>
          </div>

          {settingMeta && (
            <div
              className="flex items-center gap-4 text-xs"
              style={{
                color: "var(--admin-text-muted, #94a3b8)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>
                  Updated: {new Date(settingMeta.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {settingMeta.updatedBy && (
                <div className="flex items-center gap-1.5">
                  <UserCheck size={13} />
                  <span>By: {settingMeta.updatedBy.name || "Super Admin"}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Method Selection Cards Grid */}
        <div className="space-y-4">
          <div
            className="text-xs font-bold uppercase tracking-wider"
            style={{
              color: "var(--admin-text-muted, #94a3b8)",
            }}
          >
            Select Authentication Strategy
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AUTH_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              const isLive = activeMethod === method.id;

              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className="relative rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between"
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04))"
                      : "var(--admin-card-bg, #151827)",
                    border: isSelected
                      ? "2px solid #f59e0b"
                      : "1px solid var(--admin-card-border, rgba(255, 255, 255, 0.08))",
                    boxShadow: isSelected
                      ? "0 10px 25px rgba(245, 158, 11, 0.15)"
                      : "var(--admin-box-shadow, 0 4px 20px rgba(0, 0, 0, 0.2))",
                  }}
                >
                  <div>
                    {/* Top Row: Icon & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-colors"
                        style={{
                          background: isSelected
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "var(--admin-input-bg, rgba(255, 255, 255, 0.06))",
                          color: isSelected
                            ? "#ffffff"
                            : "var(--admin-text-secondary, #cbd5e1)",
                          boxShadow: isSelected
                            ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                            : "none",
                        }}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="flex items-center gap-2">
                        {isLive && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                          </span>
                        )}
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                          style={{
                            background: "var(--admin-input-bg, rgba(255, 255, 255, 0.06))",
                            color: "var(--admin-text-muted, #94a3b8)",
                            border: "1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.05))",
                          }}
                        >
                          {method.badge}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3
                      className="text-base font-extrabold"
                      style={{
                        color: "var(--admin-text-primary, #ffffff)",
                      }}
                    >
                      {method.title}
                    </h3>
                    <p className="text-xs font-semibold text-amber-500 mt-0.5">
                      {method.subtitle}
                    </p>
                    <p
                      className="mt-3 text-xs leading-relaxed"
                      style={{
                        color: "var(--admin-text-secondary, #cbd5e1)",
                      }}
                    >
                      {method.desc}
                    </p>

                    {/* Key Highlights */}
                    <div
                      className="mt-5 space-y-2 pt-4"
                      style={{
                        borderTop: "1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.06))",
                      }}
                    >
                      {method.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs"
                          style={{
                            color: "var(--admin-text-muted, #94a3b8)",
                          }}
                        >
                          <CheckCircle2
                            size={14}
                            className="shrink-0 mt-0.5"
                            style={{
                              color: isSelected ? "#f59e0b" : "var(--admin-text-subtle, #64748b)",
                            }}
                          />
                          <span className="leading-snug">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selector Radio */}
                  <div
                    className="mt-6 pt-4 flex items-center justify-between"
                    style={{
                      borderTop: "1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.06))",
                    }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: isSelected ? "#f59e0b" : "var(--admin-text-subtle, #64748b)",
                      }}
                    >
                      {isSelected ? "Selected for deployment" : "Click to select"}
                    </span>
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full border transition-all"
                      style={{
                        borderColor: isSelected
                          ? "#f59e0b"
                          : "var(--admin-card-border, rgba(255, 255, 255, 0.2))",
                        background: isSelected ? "#f59e0b" : "transparent",
                      }}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Impact & Technical Context */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--admin-card-bg, #151827)",
            border: "1px solid var(--admin-card-border, rgba(255, 255, 255, 0.08))",
            boxShadow: "var(--admin-box-shadow, 0 4px 20px rgba(0, 0, 0, 0.2))",
          }}
        >
          <div className="flex items-start gap-3">
            <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
              <div
                className="font-bold"
                style={{
                  color: "var(--admin-text-primary, #ffffff)",
                }}
              >
                How this affects user login immediately:
              </div>
              <p
                style={{
                  color: "var(--admin-text-secondary, #cbd5e1)",
                }}
              >
                When you switch the login method and click <strong>Apply Method</strong>, all incoming visitors on the <code>/login</code> page will instantly receive the updated interface and authentication flow without requiring server restarts.
              </p>
              <ul
                className="list-disc pl-5 space-y-1 text-xs pt-1"
                style={{
                  color: "var(--admin-text-muted, #94a3b8)",
                }}
              >
                <li>
                  <strong style={{ color: "var(--admin-text-primary, #ffffff)" }}>OTP Mode:</strong> Login form asks for Email, dispatches verification OTP code, and establishes session upon OTP check.
                </li>
                <li>
                  <strong style={{ color: "var(--admin-text-primary, #ffffff)" }}>Password Mode:</strong> Login form asks for Email + Password directly and validates against bcrypt hash.
                </li>
                <li>
                  <strong style={{ color: "var(--admin-text-primary, #ffffff)" }}>Hybrid Mode:</strong> Step 1 verifies Password & sends OTP, and Step 2 verifies the OTP code.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

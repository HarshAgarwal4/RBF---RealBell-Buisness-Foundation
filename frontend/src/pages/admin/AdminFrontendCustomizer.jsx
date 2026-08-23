import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";
import { hasPermission, isSuperAdmin } from "../../utils/rbac";
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Home,
  LogIn,
  UserPlus,
  Shield,
  FileText,
  HeartHandshake,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
  Phone,
  Mail,
  MapPin,
  Eye,
  RefreshCw,
  Lock,
} from "lucide-react";

const PAGES_CONFIG = [
  {
    key: "home",
    title: "Home Page",
    icon: Home,
    badge: "Public Landing",
    description: "Customize hero, navbar, statistics, capabilities, personas, FAQ, CTA, and footer.",
    liveUrl: "/",
  },
  {
    key: "login",
    title: "Login Page",
    icon: LogIn,
    badge: "Authentication",
    description: "Customize left panel branding, badge, title, feature list, and footer notes.",
    liveUrl: "/login",
  },
  {
    key: "signup",
    title: "Signup Page",
    icon: UserPlus,
    badge: "Onboarding",
    description: "Customize onboarding highlights, persona selection notes, and terms prompts.",
    liveUrl: "/signup",
  },
  {
    key: "privacy-policy",
    title: "Privacy Policy",
    icon: Shield,
    badge: "Legal & Trust",
    description: "Manage data protection clauses, information usage, security standards, and DPO contacts.",
    liveUrl: "/privacy-policy",
  },
  {
    key: "terms-of-service",
    title: "Terms and Service",
    icon: FileText,
    badge: "Governance",
    description: "Manage foundation membership rules, IP clauses, dispute governance, and disclaimers.",
    liveUrl: "/terms-of-service",
  },
  {
    key: "code-of-conduct",
    title: "Code of Conduct",
    icon: HeartHandshake,
    badge: "Community",
    description: "Manage community pledge, expected behaviors, enforcement ladders, and reporting guidelines.",
    liveUrl: "/code-of-conduct",
  },
];

const HOME_SUBTABS = [
  { id: "navbar", label: "Navbar & Ticker" },
  { id: "hero", label: "Hero / Main Section" },
  { id: "stats", label: "Stats & Metrics" },
  { id: "services", label: "Core Capabilities" },
  { id: "personas", label: "Role Tracks" },
  { id: "howItWorks", label: "How It Works" },
  { id: "demoDays", label: "Live Cohorts" },
  { id: "testimonials", label: "Testimonials" },
  { id: "faq", label: "FAQ Accordion" },
  { id: "cta", label: "CTA Banner" },
  { id: "footer", label: "Footer & Contact" },
];

export default function AdminFrontendCustomizer() {
  const currentUser = useStore((state) => state.user);
  const canEdit = isSuperAdmin(currentUser) || hasPermission(currentUser, "frontend_customizer.update") || hasPermission(currentUser, "theme.manage");

  const [selectedPageKey, setSelectedPageKey] = useState("home");
  const [homeSubTab, setHomeSubTab] = useState("hero");
  const [pageData, setPageData] = useState(null);
  const [pageMeta, setPageMeta] = useState({ title: "", description: "", isPublished: true });
  const [lastUpdatedInfo, setLastUpdatedInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setPageContent = useStore((state) => state.setPageContent);

  // Fetch page details when selectedPageKey changes
  useEffect(() => {
    fetchPageDetails(selectedPageKey);
  }, [selectedPageKey]);

  const fetchPageDetails = async (pageKey) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/admin/frontend-customizer/pages/${pageKey}`);
      if (res.data?.status === 1 && res.data.page) {
        setPageData(res.data.page.data || {});
        setPageMeta({
          title: res.data.page.title || "",
          description: res.data.page.description || "",
          isPublished: res.data.page.isPublished ?? true,
        });
        setLastUpdatedInfo({
          updatedAt: res.data.page.updatedAt,
          updatedBy: res.data.page.updatedBy,
        });
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error("Error fetching page details:", err);
      toast.error("Failed to load page customization data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataChange = (path, value) => {
    setPageData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev || {}));
      const keys = path.split(".");
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to modify or publish page content.");
      return;
    }
    if (!pageData) return;
    setIsSaving(true);
    try {
      const payload = {
        title: pageMeta.title,
        description: pageMeta.description,
        isPublished: pageMeta.isPublished,
        data: pageData,
      };
      const res = await axios.put(`/admin/frontend-customizer/pages/${selectedPageKey}`, payload);
      if (res.data?.status === 1) {
        toast.success(`'${pageMeta.title || selectedPageKey}' content published successfully!`);
        setHasUnsavedChanges(false);
        if (res.data.page) {
          setLastUpdatedInfo({
            updatedAt: res.data.page.updatedAt,
            updatedBy: res.data.page.updatedBy,
          });
          if (res.data.page.data) {
            setPageContent(selectedPageKey, res.data.page.data);
          }
        }
      } else {
        toast.error(res.data?.msg || "Failed to update page content");
      }
    } catch (err) {
      console.error("Error saving page content:", err);
      toast.error("Server error while updating page content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to reset page content.");
      return;
    }
    const activePageObj = PAGES_CONFIG.find((p) => p.key === selectedPageKey);
    const pageName = activePageObj ? activePageObj.title : selectedPageKey;

    if (
      !window.confirm(
        `Are you sure you want to reset "${pageName}" to factory defaults? All custom text and modifications on this page will be restored.`
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await axios.post(`/admin/frontend-customizer/pages/${selectedPageKey}/reset`);
      if (res.data?.status === 1 && res.data.page) {
        setPageData(res.data.page.data || {});
        setPageMeta({
          title: res.data.page.title || "",
          description: res.data.page.description || "",
          isPublished: res.data.page.isPublished ?? true,
        });
        setLastUpdatedInfo({
          updatedAt: res.data.page.updatedAt,
          updatedBy: res.data.page.updatedBy,
        });
        setHasUnsavedChanges(false);
        if (res.data.page.data) {
          setPageContent(selectedPageKey, res.data.page.data);
        }
        toast.success(`'${pageName}' reset to factory defaults.`);
      } else {
        toast.error(res.data?.msg || "Failed to reset page content");
      }
    } catch (err) {
      console.error("Error resetting page content:", err);
      toast.error("Server error while resetting page");
    } finally {
      setIsResetting(false);
    }
  };

  const activePageConfig = PAGES_CONFIG.find((p) => p.key === selectedPageKey);

  return (
    <AdminLayout title="Frontend Customizer">
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Top Header Card */}
        <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Content Management Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Frontend Customizer
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Modify headlines, navigation bars, capability cards, legal terms, FAQs, and footers in real-time across public platform pages.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {activePageConfig && (
              <a
                href={activePageConfig.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:scale-[1.02]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                View Live Page
              </a>
            )}

            {canEdit ? (
              <>
                <button
                  onClick={handleReset}
                  disabled={isResetting || isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                  Reset Default
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg hover:scale-[1.02] disabled:opacity-50 cursor-pointer ${
                    hasUnsavedChanges
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/30"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30"
                  }`}
                >
                  <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                  {isSaving ? "Publishing..." : hasUnsavedChanges ? "Publish Changes *" : "Save & Publish"}
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Read-Only Mode (Edit restricted by Super Admin)</span>
              </div>
            )}
          </div>
        </div>

        {/* Page Switcher Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PAGES_CONFIG.map((page) => {
            const Icon = page.icon;
            const isSelected = selectedPageKey === page.key;
            return (
              <button
                key={page.key}
                onClick={() => setSelectedPageKey(page.key)}
                className={`p-3.5 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-950/50 border-indigo-500/60 text-white shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40"
                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                    {page.badge}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 truncate">{page.title}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{page.liveUrl}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Editor Section */}
        {isLoading ? (
          <div className="rounded-2xl p-16 bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading customizer data for {activePageConfig?.title}...</p>
          </div>
        ) : pageData ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl overflow-hidden">
            {/* Header info bar */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold text-white">Editing:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                  /{selectedPageKey}
                </span>
                {lastUpdatedInfo?.updatedAt && (
                  <span className="text-slate-500 ml-2 hidden sm:inline">
                    Last modified: {new Date(lastUpdatedInfo.updatedAt).toLocaleString()}
                    {lastUpdatedInfo.updatedBy?.name ? ` by ${lastUpdatedInfo.updatedBy.name}` : ""}
                  </span>
                )}
              </div>

              {hasUnsavedChanges && (
                <div className="flex items-center gap-1.5 text-amber-400 font-medium animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unsaved changes</span>
                </div>
              )}
            </div>

            {/* Content Area Based on Selected Page */}
            <div className="p-6">
              {selectedPageKey === "home" && (
                <div>
                  {/* Sub-tabs for Home Page Sections */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-800 scrollbar-none">
                    {HOME_SUBTABS.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setHomeSubTab(sub.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                          homeSubTab === sub.id
                            ? "bg-amber-600 text-white shadow-md shadow-amber-900/20"
                            : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {/* Render active sub-section */}
                  {homeSubTab === "navbar" && (
                    <HomeNavbarEditor data={pageData.navbar || {}} onChange={(path, val) => handleDataChange(`navbar.${path}`, val)} />
                  )}
                  {homeSubTab === "hero" && (
                    <HomeHeroEditor data={pageData.hero || {}} onChange={(path, val) => handleDataChange(`hero.${path}`, val)} />
                  )}
                  {homeSubTab === "stats" && (
                    <HomeStatsEditor stats={pageData.stats || []} onChange={(val) => handleDataChange("stats", val)} />
                  )}
                  {homeSubTab === "services" && (
                    <HomeServicesEditor data={pageData.servicesSection || {}} onChange={(path, val) => handleDataChange(`servicesSection.${path}`, val)} />
                  )}
                  {homeSubTab === "personas" && (
                    <HomePersonasEditor data={pageData.personasSection || {}} onChange={(path, val) => handleDataChange(`personasSection.${path}`, val)} />
                  )}
                  {homeSubTab === "howItWorks" && (
                    <HomeHowItWorksEditor data={pageData.howItWorksSection || {}} onChange={(path, val) => handleDataChange(`howItWorksSection.${path}`, val)} />
                  )}
                  {homeSubTab === "demoDays" && (
                    <HomeDemoDaysEditor data={pageData.demoDaysSection || {}} onChange={(path, val) => handleDataChange(`demoDaysSection.${path}`, val)} />
                  )}
                  {homeSubTab === "testimonials" && (
                    <HomeTestimonialsEditor data={pageData.testimonialsSection || {}} onChange={(path, val) => handleDataChange(`testimonialsSection.${path}`, val)} />
                  )}
                  {homeSubTab === "faq" && (
                    <HomeFaqEditor data={pageData.faqSection || {}} onChange={(path, val) => handleDataChange(`faqSection.${path}`, val)} />
                  )}
                  {homeSubTab === "cta" && (
                    <HomeCtaEditor data={pageData.ctaBanner || {}} onChange={(path, val) => handleDataChange(`ctaBanner.${path}`, val)} />
                  )}
                  {homeSubTab === "footer" && (
                    <HomeFooterEditor data={pageData.footer || {}} onChange={(path, val) => handleDataChange(`footer.${path}`, val)} />
                  )}
                </div>
              )}

              {selectedPageKey === "login" && (
                <LoginSignupEditor
                  type="login"
                  data={pageData}
                  onChange={(path, val) => handleDataChange(path, val)}
                />
              )}

              {selectedPageKey === "signup" && (
                <LoginSignupEditor
                  type="signup"
                  data={pageData}
                  onChange={(path, val) => handleDataChange(path, val)}
                />
              )}

              {(selectedPageKey === "privacy-policy" ||
                selectedPageKey === "terms-of-service" ||
                selectedPageKey === "code-of-conduct") && (
                <LegalPolicyEditor
                  pageKey={selectedPageKey}
                  data={pageData}
                  onChange={(path, val) => handleDataChange(path, val)}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

/* =========================================================================
   1. HOME PAGE SECTION EDITORS
   ========================================================================= */

function TextInput({ label, value, onChange, placeholder, hint, isTextArea = false, rows = 3 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </div>
      {isTextArea ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
        />
      )}
    </div>
  );
}

function ToggleInput({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition">
      <div>
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
      </div>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-700 bg-slate-900 cursor-pointer"
      />
    </label>
  );
}

function HomeNavbarEditor({ data, onChange }) {
  const navLinks = data.navLinks || [];

  const handleLinkChange = (index, field, val) => {
    const updated = [...navLinks];
    updated[index] = { ...updated[index], [field]: val };
    onChange("navLinks", updated);
  };

  const addNavLink = () => {
    onChange("navLinks", [...navLinks, { label: "New Link", href: "#" }]);
  };

  const removeNavLink = (index) => {
    const updated = navLinks.filter((_, i) => i !== index);
    onChange("navLinks", updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Brand Name" value={data.brandName} onChange={(v) => onChange("brandName", v)} placeholder="REALBELL" />
        <TextInput label="Brand Highlight Word" value={data.brandHighlight} onChange={(v) => onChange("brandHighlight", v)} placeholder="BELL" />
        <TextInput label="Navbar Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} placeholder="Business Foundation" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Sign In Button Text" value={data.loginButtonText} onChange={(v) => onChange("loginButtonText", v)} placeholder="Sign In" />
        <TextInput label="Register Button Text" value={data.registerButtonText} onChange={(v) => onChange("registerButtonText", v)} placeholder="Get Started Free" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleInput
          label="Show Top Notification Ticker"
          checked={data.showLiveTicker}
          onChange={(v) => onChange("showLiveTicker", v)}
          hint="Displays top animated announcement bar on homepage"
        />
        <TextInput label="Announcement Ticker Text" value={data.tickerText} onChange={(v) => onChange("tickerText", v)} placeholder="Applications Open for Cohort 2026" />
      </div>

      {/* Navigation Menu Links */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Navbar Navigation Menu Items</h3>
            <p className="text-[11px] text-slate-500">Configure menu anchor links or page routes</p>
          </div>
          <button
            type="button"
            onClick={addNavLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>

        <div className="space-y-2.5">
          {navLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => handleLinkChange(idx, "label", e.target.value)}
                placeholder="Link Label"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => handleLinkChange(idx, "href", e.target.value)}
                placeholder="#section or /url"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => removeNavLink(idx)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeHeroEditor({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Top Tag Badge Text" value={data.badgeText} onChange={(v) => onChange("badgeText", v)} placeholder="RealBell Ecosystem • DPIIT & Section 8 Recognized" />
        <TextInput label="Tag Badge Highlight" value={data.badgeHighlight} onChange={(v) => onChange("badgeHighlight", v)} placeholder="National Network" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <TextInput label="Main Hero Headline" value={data.mainHeadline} onChange={(v) => onChange("mainHeadline", v)} placeholder="Connecting Visionary Founders, Investors & Mentors..." />
        </div>
        <div>
          <TextInput label="Headline Gradient Highlight" value={data.headlineHighlight} onChange={(v) => onChange("headlineHighlight", v)} placeholder="One Ecosystem." />
        </div>
      </div>

      <TextInput
        label="Hero Paragraph Description"
        value={data.description}
        onChange={(v) => onChange("description", v)}
        placeholder="RealBell Business Foundation powers early-stage startups with capital access..."
        isTextArea={true}
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Primary CTA Button</div>
          <TextInput label="Button Text" value={data.primaryButtonText} onChange={(v) => onChange("primaryButtonText", v)} placeholder="Get Started Free" />
          <TextInput label="Button Link" value={data.primaryButtonLink} onChange={(v) => onChange("primaryButtonLink", v)} placeholder="/signup" />
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Secondary CTA Button</div>
          <TextInput label="Button Text" value={data.secondaryButtonText} onChange={(v) => onChange("secondaryButtonText", v)} placeholder="Explore Cohorts" />
          <TextInput label="Button Link" value={data.secondaryButtonLink} onChange={(v) => onChange("secondaryButtonLink", v)} placeholder="/programs" />
        </div>
      </div>

      <TextInput label="Trust Badge Footer Text" value={data.trustBadgeText} onChange={(v) => onChange("trustBadgeText", v)} placeholder="Trusted by 500+ Indian Startups..." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300">Floating Hero Card 1</div>
          <TextInput label="Title" value={data.floatingCard1?.title} onChange={(v) => onChange("floatingCard1.title", v)} />
          <TextInput label="Value" value={data.floatingCard1?.value} onChange={(v) => onChange("floatingCard1.value", v)} />
          <TextInput label="Growth Subtext" value={data.floatingCard1?.subtext} onChange={(v) => onChange("floatingCard1.subtext", v)} />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300">Floating Hero Card 2</div>
          <TextInput label="Title" value={data.floatingCard2?.title} onChange={(v) => onChange("floatingCard2.title", v)} />
          <TextInput label="Value" value={data.floatingCard2?.value} onChange={(v) => onChange("floatingCard2.value", v)} />
          <TextInput label="Subtext" value={data.floatingCard2?.subtext} onChange={(v) => onChange("floatingCard2.subtext", v)} />
        </div>
      </div>
    </div>
  );
}

function HomeStatsEditor({ stats, onChange }) {
  const handleStatChange = (index, field, value) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addStat = () => {
    onChange([...stats, { label: "New Metric", value: "100+", subtext: "Ecosystem measure" }]);
  };

  const removeStat = (index) => {
    onChange(stats.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Key Metrics & Traction Counters</h3>
          <p className="text-[11px] text-slate-500">Displayed in the stats grid directly beneath the main hero section.</p>
        </div>
        <button
          type="button"
          onClick={addStat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Metric
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Metric #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeStat(idx)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="Display Value" value={stat.value} onChange={(v) => handleStatChange(idx, "value", v)} placeholder="₹50Cr+" />
              <TextInput label="Metric Label" value={stat.label} onChange={(v) => handleStatChange(idx, "label", v)} placeholder="Capital Facilitated" />
            </div>
            <TextInput label="Subtext / Growth Detail" value={stat.subtext} onChange={(v) => handleStatChange(idx, "subtext", v)} placeholder="Across Seed rounds" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeServicesEditor({ data, onChange }) {
  const cards = data.cards || [];

  const handleCardChange = (index, field, val) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: val };
    onChange("cards", updated);
  };

  const addCard = () => {
    onChange("cards", [
      ...cards,
      { title: "New Service", description: "Service description here", tag: "General" },
    ]);
  };

  const removeCard = (index) => {
    onChange("cards", cards.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Section Badge" value={data.badge} onChange={(v) => onChange("badge", v)} placeholder="Ecosystem Pillars" />
        <TextInput label="Section Title" value={data.title} onChange={(v) => onChange("title", v)} placeholder="Comprehensive Infrastructure..." />
        <TextInput label="Section Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} placeholder="Everything you need to launch..." />
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Capability Cards</h3>
          <button
            type="button"
            onClick={addCard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Capability Card
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Card #{idx + 1}</span>
                <button type="button" onClick={() => removeCard(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput label="Card Title" value={card.title} onChange={(v) => handleCardChange(idx, "title", v)} />
                <TextInput label="Tag Badge" value={card.tag} onChange={(v) => handleCardChange(idx, "tag", v)} />
              </div>
              <TextInput label="Description" value={card.description} onChange={(v) => handleCardChange(idx, "description", v)} isTextArea rows={2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomePersonasEditor({ data, onChange }) {
  const cards = data.cards || [];

  const handleCardChange = (index, field, val) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: val };
    onChange("cards", updated);
  };

  const handlePointChange = (cardIndex, pointIndex, val) => {
    const updated = [...cards];
    const pts = [...(updated[cardIndex].points || [])];
    pts[pointIndex] = val;
    updated[cardIndex] = { ...updated[cardIndex], points: pts };
    onChange("cards", updated);
  };

  const addPoint = (cardIndex) => {
    const updated = [...cards];
    const pts = [...(updated[cardIndex].points || []), "New track capability or benefit"];
    updated[cardIndex] = { ...updated[cardIndex], points: pts };
    onChange("cards", updated);
  };

  const removePoint = (cardIndex, pointIndex) => {
    const updated = [...cards];
    const pts = (updated[cardIndex].points || []).filter((_, i) => i !== pointIndex);
    updated[cardIndex] = { ...updated[cardIndex], points: pts };
    onChange("cards", updated);
  };

  const addCard = () => {
    const newId = `track_${Date.now()}`;
    const newTrack = {
      id: newId,
      role: "New Ecosystem Track",
      badge: "Partner Track",
      title: "For Regional Incubators",
      tagline: "Supercharge cohort management and founder acceleration with unified tooling.",
      points: [
        "Structured cohort sprints & weekly milestone tracking",
        "Direct syndication to 100+ accredited angel investors",
        "1-on-1 strategic advisory clinics with vetted CXOs",
        "Standardized legal vault: term sheets & cap tables",
      ],
      actionText: "Join Ecosystem",
      actionLink: "/signup",
      iconName: "Building2",
    };
    onChange("cards", [...cards, newTrack]);
  };

  const removeCard = (index) => {
    if (cards.length <= 1) {
      toast.warn("At least one role track must be maintained");
      return;
    }
    onChange("cards", cards.filter((_, i) => i !== index));
  };

  const moveCard = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= cards.length) return;
    const updated = [...cards];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange("cards", updated);
  };

  const AVAILABLE_ICONS = ["Rocket", "TrendingUp", "Users", "Building2", "Handshake", "Target", "Award", "Globe", "ShieldCheck", "Layers"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Section Badge" value={data.badge} onChange={(v) => onChange("badge", v)} placeholder="Stakeholder Tracks" />
        <TextInput label="Section Title" value={data.title} onChange={(v) => onChange("title", v)} placeholder="Tailored Value for Every Stakeholder" />
        <TextInput label="Section Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Role Tracks ({cards.length})</h3>
          <p className="text-[11px] text-slate-400">Manage stakeholder persona tabs, benefits, bullet points, and CTA actions.</p>
        </div>
        <button
          type="button"
          onClick={addCard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Role Track
        </button>
      </div>

      <div className="space-y-4">
        {cards.map((card, idx) => (
          <div key={card.id || idx} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-white">{card.badge || card.role || `Track #${idx + 1}`}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveCard(idx, -1)}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === cards.length - 1}
                  onClick={() => moveCard(idx, 1)}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCard(idx)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition cursor-pointer ml-2"
                  title="Delete Track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TextInput label="Tab Badge Label" value={card.badge} onChange={(v) => handleCardChange(idx, "badge", v)} placeholder="e.g. Founder Track" />
              <TextInput label="Track Title" value={card.title} onChange={(v) => handleCardChange(idx, "title", v)} placeholder="e.g. For Startups & Founders" />
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Icon</label>
                <select
                  value={card.iconName || "Rocket"}
                  onChange={(e) => handleCardChange(idx, "iconName", e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {AVAILABLE_ICONS.map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextInput label="Tagline / Description" value={card.tagline || card.description} onChange={(v) => handleCardChange(idx, "tagline", v)} isTextArea rows={2} />

            {/* Bullets List CRUD */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Key Benefits / Bullets ({(card.points || []).length})</span>
                <button
                  type="button"
                  onClick={() => addPoint(idx)}
                  className="text-[11px] font-semibold text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Bullet
                </button>
              </div>
              <div className="space-y-1.5">
                {(card.points || []).map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pt || ""}
                      onChange={(e) => handlePointChange(idx, pIdx, e.target.value)}
                      placeholder="Benefit description..."
                      className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => removePoint(idx, pIdx)}
                      className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                      title="Remove bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <TextInput label="Action Button Label" value={card.actionText} onChange={(v) => handleCardChange(idx, "actionText", v)} placeholder="e.g. Join as a Startup" />
              <TextInput label="Action Button Link" value={card.actionLink} onChange={(v) => handleCardChange(idx, "actionLink", v)} placeholder="e.g. /signup" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeHowItWorksEditor({ data, onChange }) {
  const steps = data.steps || [];

  const handleStepChange = (index, field, val) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: val };
    onChange("steps", updated);
  };

  const addStep = () => {
    const nextNum = String(steps.length + 1).padStart(2, "0");
    const newStep = {
      stepNumber: nextNum,
      title: "New Milestone Step",
      description: "Describe the specific execution deliverable or acceleration activity in this step.",
      iconName: "Rocket",
    };
    onChange("steps", [...steps, newStep]);
  };

  const removeStep = (index) => {
    if (steps.length <= 1) {
      toast.warn("At least one step must be maintained in the roadmap");
      return;
    }
    onChange("steps", steps.filter((_, i) => i !== index));
  };

  const moveStep = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange("steps", updated);
  };

  const AVAILABLE_ICONS = ["Users", "Target", "Rocket", "Award", "Handshake", "Globe", "Lightbulb", "CheckCircle2"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Section Badge" value={data.badge} onChange={(v) => onChange("badge", v)} placeholder="Structured Journey" />
        <TextInput label="Section Title" value={data.title} onChange={(v) => onChange("title", v)} placeholder="How RealBell Accelerates Your Venture" />
        <TextInput label="Section Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Roadmap Steps ({steps.length})</h3>
          <p className="text-[11px] text-slate-400">Add, edit, or reorder the step-by-step acceleration framework.</p>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Step
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, idx) => (
          <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-extrabold text-amber-400">Step {step.stepNumber || idx + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveStep(idx, -1)}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === steps.length - 1}
                  onClick={() => moveStep(idx, 1)}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(idx)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition cursor-pointer ml-1.5"
                  title="Delete Step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <TextInput label="Step #" value={step.stepNumber} onChange={(v) => handleStepChange(idx, "stepNumber", v)} placeholder="01" />
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Icon</label>
                <select
                  value={step.iconName || "Rocket"}
                  onChange={(e) => handleStepChange(idx, "iconName", e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {AVAILABLE_ICONS.map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextInput label="Step Title" value={step.title} onChange={(v) => handleStepChange(idx, "title", v)} placeholder="e.g. Onboard & Define Profile" />
            <TextInput label="Description" value={step.description} onChange={(v) => handleStepChange(idx, "description", v)} isTextArea rows={3} placeholder="Step details..." />
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeDemoDaysEditor({ data, onChange }) {
  const cohorts = data.cohorts || [];

  const handleCohortChange = (index, field, val) => {
    const updated = [...cohorts];
    updated[index] = { ...updated[index], [field]: val };
    onChange("cohorts", updated);
  };

  const addCohort = () => {
    const newCohort = {
      title: "New Acceleration Cohort 2026",
      category: "Incubation",
      date: "Applications Open • June 2026",
      desc: "An intensive sprint for high-conviction founders covering unit economics and demo day pitch preparation.",
      badge: "Open Cohort",
      ctaText: "Apply Now",
      ctaLink: "/signup",
    };
    onChange("cohorts", [...cohorts, newCohort]);
  };

  const removeCohort = (index) => {
    if (cohorts.length <= 1) {
      toast.warn("At least one program/cohort must be maintained");
      return;
    }
    onChange("cohorts", cohorts.filter((_, i) => i !== index));
  };

  const moveCohort = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= cohorts.length) return;
    const updated = [...cohorts];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange("cohorts", updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Section Badge" value={data.badge} onChange={(v) => onChange("badge", v)} placeholder="Live Programs" />
        <TextInput label="Section Title" value={data.title} onChange={(v) => onChange("title", v)} placeholder="Upcoming Cohorts & Pitch Arenas" />
        <TextInput label="Section Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} />
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Spotlight Highlight Arena</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Highlight Event Title" value={data.highlightTitle} onChange={(v) => onChange("highlightTitle", v)} />
          <TextInput label="Highlight Subtitle" value={data.highlightSubtitle} onChange={(v) => onChange("highlightSubtitle", v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Event Date" value={data.highlightDate} onChange={(v) => onChange("highlightDate", v)} />
          <TextInput label="Location / Mode" value={data.highlightLocation} onChange={(v) => onChange("highlightLocation", v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="CTA Button Text" value={data.ctaText} onChange={(v) => onChange("ctaText", v)} />
          <TextInput label="CTA Link" value={data.ctaLink} onChange={(v) => onChange("ctaLink", v)} />
        </div>
      </div>

      {/* Cohorts & Programs Grid CRUD */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Cohort Programs ({cohorts.length})</h3>
            <p className="text-[11px] text-slate-400">Add, update, or remove pitch events, masterclasses, and cohort programs.</p>
          </div>
          <button
            type="button"
            onClick={addCohort}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Program
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cohorts.map((prog, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400">{prog.badge || `Program #${idx + 1}`}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCohort(idx, -1)}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move Left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={idx === cohorts.length - 1}
                      onClick={() => moveCohort(idx, 1)}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move Right"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCohort(idx)}
                      className="p-1 text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer ml-1"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Category" value={prog.category} onChange={(v) => handleCohortChange(idx, "category", v)} placeholder="Incubation" />
                  <TextInput label="Badge" value={prog.badge} onChange={(v) => handleCohortChange(idx, "badge", v)} placeholder="Flagship" />
                </div>

                <TextInput label="Program Title" value={prog.title} onChange={(v) => handleCohortChange(idx, "title", v)} placeholder="Program title..." />
                <TextInput label="Timeline / Date" value={prog.date} onChange={(v) => handleCohortChange(idx, "date", v)} placeholder="e.g. March 2026" />
                <TextInput label="Description" value={prog.desc || prog.description} onChange={(v) => handleCohortChange(idx, "desc", v)} isTextArea rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <TextInput label="CTA Text" value={prog.ctaText} onChange={(v) => handleCohortChange(idx, "ctaText", v)} placeholder="Apply Now" />
                <TextInput label="CTA Link" value={prog.ctaLink} onChange={(v) => handleCohortChange(idx, "ctaLink", v)} placeholder="/signup" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeTestimonialsEditor({ data, onChange }) {
  const items = data.items || [];

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    onChange("items", updated);
  };

  const addItem = () => {
    onChange("items", [
      ...items,
      { quote: "New testimonial quote", author: "Founder Name", role: "CEO", company: "Tech Startup" },
    ]);
  };

  const removeItem = (index) => {
    onChange("items", items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Section Badge" value={data.badge} onChange={(v) => onChange("badge", v)} />
        <TextInput label="Section Title" value={data.title} onChange={(v) => onChange("title", v)} />
        <TextInput label="Section Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} />
      </div>

      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Testimonial Quotes</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Testimonial
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Quote #{idx + 1}</span>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <TextInput label="Quote Text" value={item.quote} onChange={(v) => handleItemChange(idx, "quote", v)} isTextArea rows={2} />
              <div className="grid grid-cols-3 gap-2">
                <TextInput label="Author" value={item.author} onChange={(v) => handleItemChange(idx, "author", v)} />
                <TextInput label="Role" value={item.role} onChange={(v) => handleItemChange(idx, "role", v)} />
                <TextInput label="Company" value={item.company} onChange={(v) => handleItemChange(idx, "company", v)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeFaqEditor({ data, onChange }) {
  const faqs = data.faqs || [];

  const handleFaqChange = (index, field, val) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: val };
    onChange("faqs", updated);
  };

  const addFaq = () => {
    onChange("faqs", [
      ...faqs,
      { question: "New Question Title?", answer: "Clear, helpful answer explaining the topic." },
    ]);
  };

  const removeFaq = (index) => {
    onChange("faqs", faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Section Badge" value={data.badge} onChange={(v) => onChange("badge", v)} />
        <TextInput label="Section Title" value={data.title} onChange={(v) => onChange("title", v)} />
        <TextInput label="Section Subtitle" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} />
      </div>

      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Frequently Asked Questions ({faqs.length})</h3>
          <button
            type="button"
            onClick={addFaq}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Q&A Item
          </button>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Q#{idx + 1}</span>
                <button type="button" onClick={() => removeFaq(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <TextInput label="Question" value={faq.question} onChange={(v) => handleFaqChange(idx, "question", v)} />
              <TextInput label="Answer" value={faq.answer} onChange={(v) => handleFaqChange(idx, "answer", v)} isTextArea rows={2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeCtaEditor({ data, onChange }) {
  return (
    <div className="space-y-5">
      <TextInput label="Banner Headline" value={data.title} onChange={(v) => onChange("title", v)} placeholder="Ready to Accelerate Your Venture?" />
      <TextInput
        label="Banner Subtitle"
        value={data.subtitle}
        onChange={(v) => onChange("subtitle", v)}
        placeholder="Join hundreds of founders, investors, and mentors..."
        isTextArea
        rows={2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-amber-400">Primary CTA Action</div>
          <TextInput label="Button Text" value={data.buttonText} onChange={(v) => onChange("buttonText", v)} />
          <TextInput label="Button Link" value={data.buttonLink} onChange={(v) => onChange("buttonLink", v)} />
        </div>
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300">Secondary CTA Action</div>
          <TextInput label="Button Text" value={data.secondaryButtonText} onChange={(v) => onChange("secondaryButtonText", v)} />
          <TextInput label="Button Link" value={data.secondaryButtonLink} onChange={(v) => onChange("secondaryButtonLink", v)} />
        </div>
      </div>
    </div>
  );
}

function HomeFooterEditor({ data, onChange }) {
  const quickLinks = data.quickLinks || [];
  const ecosystemLinks = data.ecosystemLinks || [];
  const resourceLinks = data.resourceLinks || [];

  // Normalize socialLinksList
  const socialLinksList = Array.isArray(data.socialLinksList)
    ? data.socialLinksList
    : Object.entries(data.socialLinks || {})
        .filter(([_, url]) => Boolean(url))
        .map(([platform, url]) => ({
          platform,
          url,
          label: platform.charAt(0).toUpperCase() + platform.slice(1),
        }));

  const handleSocialChange = (index, field, val) => {
    const updated = [...socialLinksList];
    updated[index] = { ...updated[index], [field]: val };
    onChange("socialLinksList", updated);
  };

  const addSocialLink = () => {
    const newLink = { platform: "instagram", label: "Instagram", url: "https://instagram.com/realbell" };
    onChange("socialLinksList", [...socialLinksList, newLink]);
  };

  const removeSocialLink = (index) => {
    onChange("socialLinksList", socialLinksList.filter((_, i) => i !== index));
  };

  const moveSocialLink = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= socialLinksList.length) return;
    const updated = [...socialLinksList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange("socialLinksList", updated);
  };

  const AVAILABLE_PLATFORMS = [
    { id: "twitter", label: "Twitter / X" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "YouTube" },
    { id: "github", label: "GitHub" },
    { id: "discord", label: "Discord" },
    { id: "telegram", label: "Telegram" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "website", label: "Website / Custom" },
  ];

  const handleLinkChange = (listKey, index, field, val) => {
    const list = data[listKey] || [];
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: val };
    onChange(listKey, updated);
  };

  const addLink = (listKey, defaultLabel = "New Link", defaultHref = "#") => {
    const list = data[listKey] || [];
    onChange(listKey, [...list, { label: defaultLabel, href: defaultHref }]);
  };

  const removeLink = (listKey, index) => {
    const list = data[listKey] || [];
    onChange(listKey, list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <TextInput
        label="Foundation Brand Description"
        value={data.brandDescription}
        onChange={(v) => onChange("brandDescription", v)}
        isTextArea
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Newsletter Header" value={data.newsletterTitle} onChange={(v) => onChange("newsletterTitle", v)} />
        <TextInput label="Newsletter Subtitle" value={data.newsletterSubtitle} onChange={(v) => onChange("newsletterSubtitle", v)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Contact Email" value={data.contactEmail} onChange={(v) => onChange("contactEmail", v)} />
        <TextInput label="Contact Phone" value={data.contactPhone} onChange={(v) => onChange("contactPhone", v)} />
        <TextInput label="Copyright Text" value={data.copyrightText} onChange={(v) => onChange("copyrightText", v)} />
      </div>

      <TextInput label="Physical Office Address" value={data.address} onChange={(v) => onChange("address", v)} />

      {/* Social Media Links CRUD */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Social Media Handles ({socialLinksList.length})</h3>
            <p className="text-[11px] text-slate-400">Add, edit, or delete official ecosystem social channels (Facebook, Instagram, X, LinkedIn, etc.).</p>
          </div>
          <button
            type="button"
            onClick={addSocialLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Social Link
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {socialLinksList.map((soc, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <div className="flex items-center gap-2">
                  <select
                    value={soc.platform || "twitter"}
                    onChange={(e) => {
                      const selected = AVAILABLE_PLATFORMS.find(p => p.id === e.target.value);
                      handleSocialChange(idx, "platform", e.target.value);
                      if (selected && !soc.label) {
                        handleSocialChange(idx, "label", selected.label);
                      }
                    }}
                    className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {AVAILABLE_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSocialLink(idx, -1)}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer text-xs"
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === socialLinksList.length - 1}
                    onClick={() => moveSocialLink(idx, 1)}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer text-xs"
                    title="Move Down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    className="p-1 text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer ml-1"
                    title="Delete Social Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={soc.url || ""}
                onChange={(e) => handleSocialChange(idx, "url", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ecosystem Column Links */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ecosystem Column Links ({ecosystemLinks.length})</h3>
          <button
            type="button"
            onClick={() => addLink("ecosystemLinks", "New Ecosystem Target", "/signup")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Ecosystem Link
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ecosystemLinks.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => handleLinkChange("ecosystemLinks", idx, "label", e.target.value)}
                placeholder="Label"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => handleLinkChange("ecosystemLinks", idx, "href", e.target.value)}
                placeholder="/signup"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => removeLink("ecosystemLinks", idx)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Resources / Quick Links */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Resources Column Links ({resourceLinks.length || quickLinks.length})</h3>
          <button
            type="button"
            onClick={() => addLink("quickLinks", "New Resource Link", "/resources/contracts")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Resource Link
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(quickLinks.length > 0 ? quickLinks : resourceLinks).map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => handleLinkChange(quickLinks.length > 0 ? "quickLinks" : "resourceLinks", idx, "label", e.target.value)}
                placeholder="Label"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => handleLinkChange(quickLinks.length > 0 ? "quickLinks" : "resourceLinks", idx, "href", e.target.value)}
                placeholder="/url"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => removeLink(quickLinks.length > 0 ? "quickLinks" : "resourceLinks", idx)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. LOGIN / SIGNUP PAGE CUSTOMIZER
   ========================================================================= */

function LoginSignupEditor({ type, data, onChange }) {
  const features = data.features || [];

  const handleFeatureChange = (index, val) => {
    const updated = [...features];
    updated[index] = { ...updated[index], text: val };
    onChange("features", updated);
  };

  const addFeature = () => {
    onChange("features", [...features, { text: "New ecosystem highlight bullet" }]);
  };

  const removeFeature = (index) => {
    onChange("features", features.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
        Customizing the left branding showcase panel, highlight benefits, and footer badges for the <strong>{type === "login" ? "Login" : "Signup"}</strong> view.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Left Panel Tag Badge" value={data.leftPanelBadge} onChange={(v) => onChange("leftPanelBadge", v)} />
        <TextInput label="Platform Status Text" value={data.platformStatusText} onChange={(v) => onChange("platformStatusText", v)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Main Title Prefix" value={data.mainTitle} onChange={(v) => onChange("mainTitle", v)} />
        <TextInput label="Title Highlight Word" value={data.titleHighlight} onChange={(v) => onChange("titleHighlight", v)} />
        {type === "login" && (
          <TextInput label="Title Suffix" value={data.titleSuffix} onChange={(v) => onChange("titleSuffix", v)} />
        )}
      </div>

      <TextInput
        label="Left Panel Description"
        value={data.description}
        onChange={(v) => onChange("description", v)}
        isTextArea
        rows={3}
      />

      {/* Feature Bullet Points */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Benefit Highlights Bullet Points</h3>
            <p className="text-[11px] text-slate-500">Displayed with check icons on the left side panel</p>
          </div>
          <button
            type="button"
            onClick={addFeature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Benefit
          </button>
        </div>

        <div className="space-y-2.5">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={feat.text || ""}
                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                placeholder="Benefit description"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-700/60 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        <TextInput label="Left Panel Footer Note" value={data.footerNote} onChange={(v) => onChange("footerNote", v)} />
        {type === "login" ? (
          <TextInput label="Right Panel Form Prompt" value={data.rightPanelPrompt} onChange={(v) => onChange("rightPanelPrompt", v)} />
        ) : (
          <TextInput label="Terms Agreement Notice" value={data.termsAgreementNote} onChange={(v) => onChange("termsAgreementNote", v)} />
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   3. LEGAL POLICY & GOVERNANCE PAGES (Privacy, Terms, Conduct)
   ========================================================================= */

function LegalPolicyEditor({ pageKey, data, onChange }) {
  const sections = data.sections || [];

  const handleSectionChange = (index, field, val) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: val };
    onChange("sections", updated);
  };

  const addSection = () => {
    onChange("sections", [
      ...sections,
      {
        id: `section-${sections.length + 1}`,
        heading: `${sections.length + 1}. New Policy Clause`,
        content: "Detailed description of legal terms and guidelines here.",
      },
    ]);
  };

  const removeSection = (index) => {
    onChange("sections", sections.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="Page Header Title" value={data.pageTitle} onChange={(v) => onChange("pageTitle", v)} />
        <TextInput label="Page Subtitle / Scope" value={data.subtitle} onChange={(v) => onChange("subtitle", v)} />
        <TextInput label="Last Updated Date Label" value={data.lastUpdated} onChange={(v) => onChange("lastUpdated", v)} placeholder="June 2026" />
      </div>

      <TextInput
        label="Introduction / Preamble Paragraph"
        value={data.introduction}
        onChange={(v) => onChange("introduction", v)}
        isTextArea
        rows={4}
      />

      {/* Dynamic Clauses / Policy Sections */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Clauses & Policy Sections ({sections.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Each section is automatically rendered in the table of contents and formatted in the reader view.
            </p>
          </div>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Clause / Section
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((sec, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Section #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSection(idx)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <TextInput
                label="Section Heading / Title"
                value={sec.heading}
                onChange={(v) => handleSectionChange(idx, "heading", v)}
                placeholder="e.g. 1. Information We Collect"
              />

              <TextInput
                label="Clause Content (Markdown Supported)"
                value={sec.content}
                onChange={(v) => handleSectionChange(idx, "content", v)}
                isTextArea
                rows={4}
                placeholder="Detailed text..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

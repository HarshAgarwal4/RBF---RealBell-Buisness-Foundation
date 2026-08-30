import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar.jsx";
import axios from "../../services/axios.jsx";
import { useStore } from "../../zustand/store.jsx";
import {
  Zap,
  Gift,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Sparkles,
  Rocket,
  ShieldCheck,
  CreditCard,
  Layers,
  Code,
  FileText,
  X,
  RefreshCw,
  Tag,
  ChevronRight,
  AlertCircle,
  Download,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Perks", icon: Sparkles },
  { id: "cloud_devops", label: "Cloud & DevOps", icon: Code },
  { id: "finance_payments", label: "Finance & Payments", icon: CreditCard },
  { id: "sales_marketing", label: "Sales & Marketing", icon: Rocket },
  { id: "legal_compliance", label: "Legal & Compliance", icon: ShieldCheck },
  { id: "tools_software", label: "Software & Tools", icon: Layers },
];

export default function BusinessBooster() {
  const currentUser = useStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("explore"); // 'explore' | 'my_claims'
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({});

  // Modals
  const [claimModal, setClaimModal] = useState({ open: false, perk: null });
  const [voucherModal, setVoucherModal] = useState({ open: false, perk: null, code: "" });
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    applicant_name: "",
    email: "",
    phone: "",
    website: "",
    startup_stage: "Early Stage",
    use_case_notes: "",
  });
  const [claimFeedback, setClaimFeedback] = useState(null);

  // Load Perks
  const loadBoosterItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await axios.get(`/booster/items?${params.toString()}`);
      if (res.data.status === 1) {
        setItems(res.data.items || []);
        if (res.data.categoryCounts) setCategoryCounts(res.data.categoryCounts);
      }
    } catch (err) {
      console.error("Error loading booster perks:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  // Load My Applications
  const loadMyApplications = useCallback(async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const res = await axios.get("/booster/my-applications");
      if (res.data.status === 1) {
        setMyApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error("Error loading my applications:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadBoosterItems();
    loadMyApplications();
  }, [loadBoosterItems, loadMyApplications]);

  // Pre-fill claim modal form
  const handleOpenClaimModal = (perk) => {
    setClaimFeedback(null);
    setFormData({
      company_name: currentUser?.company_name || currentUser?.name || "",
      applicant_name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      website: currentUser?.website || "",
      startup_stage: "Early Stage",
      use_case_notes: "",
    });
    setClaimModal({ open: true, perk });
  };

  // Submit Claim
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimModal.perk) return;

    setSubmittingClaim(true);
    setClaimFeedback(null);
    try {
      const res = await axios.post(`/booster/items/${claimModal.perk._id}/apply`, formData);
      if (res.data.status === 1) {
        setClaimFeedback({ type: "success", msg: res.data.msg });
        loadBoosterItems();
        loadMyApplications();

        // If code was assigned immediately, open voucher modal
        if (res.data.assigned_code) {
          setTimeout(() => {
            setClaimModal({ open: false, perk: null });
            setVoucherModal({
              open: true,
              perk: claimModal.perk,
              code: res.data.assigned_code,
            });
          }, 1200);
        } else {
          setTimeout(() => {
            setClaimModal({ open: false, perk: null });
          }, 2000);
        }
      } else {
        setClaimFeedback({ type: "error", msg: res.data.msg || "Failed to submit application" });
      }
    } catch (err) {
      setClaimFeedback({
        type: "error",
        msg: err.response?.data?.msg || "Error processing your request",
      });
    } finally {
      setSubmittingClaim(false);
    }
  };

  const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 sm:p-8 font-sans antialiased text-gray-800 dark:text-slate-200">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Hero Banner Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C2340] via-[#151D2E] to-[#0D141B] border border-slate-800 p-6 sm:p-10 text-white shadow-xl">
            {/* Ambient Background Accents */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8B1D2C]/25 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 mb-3">
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>RealBell Ecosystem Growth Suite</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                  Business Booster Kit
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Accelerate your business with ₹25,00,000+ worth of exclusive partner perks, cloud infrastructure credits, payment gateway waivers, and legal toolkits.
                </p>
              </div>

              {/* Stats Box */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 self-start md:self-auto shrink-0">
                <div className="text-center px-2">
                  <div className="text-xs font-bold text-slate-400 uppercase">Available Perks</div>
                  <div className="text-2xl font-extrabold text-white mt-0.5">{items.length || "10+"}</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center px-2">
                  <div className="text-xs font-bold text-slate-400 uppercase">Your Claims</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-0.5">{myApplications.length}</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="relative z-10 mt-8 flex items-center gap-2 border-t border-white/10 pt-4 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("explore")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "explore"
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Booster Perks ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("my_claims")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "my_claims"
                    ? "bg-[#8B1D2C] text-white shadow-md shadow-[#8B1D2C]/40"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>My Claimed Perks</span>
                {myApplications.length > 0 && (
                  <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {myApplications.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              TAB 1: EXPLORE BOOSTER PERKS
             ═══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "explore" && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    const count = categoryCounts[cat.id];
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                          isActive
                            ? "bg-[#8B1D2C] text-white shadow-xs"
                            : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                        {count !== undefined && count > 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              isActive ? "bg-white text-[#8B1D2C]" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Search input */}
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search perks or partners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0B0F19] text-xs text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Booster Perks */}
              {loading ? (
                <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-16 text-center border border-gray-100 dark:border-slate-800 shadow-xs">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#8B1D2C] mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Loading Business Booster perks...
                  </p>
                </div>
              ) : items.length === 0 ? (
                <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-16 text-center border border-gray-100 dark:border-slate-800 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-slate-500">
                    <Gift className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">
                    No Booster Perks Found
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                    Try switching category filters or clearing your search term.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => {
                    const userApp = item.userApplication;
                    const isClaimed = Boolean(userApp);
                    const isApproved = userApp && (userApp.status === "approved" || userApp.status === "redeemed");
                    const isPending = userApp && userApp.status === "pending";

                    return (
                      <div
                        key={item._id}
                        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: Provider Logo & Perk Value Badge */}
                          <div className="flex items-start justify-between gap-3 mb-3.5">
                            <div className="flex items-center gap-2.5">
                              {item.logo_url ? (
                                <img
                                  src={item.logo_url}
                                  alt={item.provider}
                                  className="h-10 w-10 object-contain rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 p-1 shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-[#8B1D2C]/10 dark:bg-[#8B1D2C]/20 text-[#8B1D2C] dark:text-[#f87171] flex items-center justify-center font-black text-sm shrink-0">
                                  {item.provider?.charAt(0) || "B"}
                                </div>
                              )}

                              <div>
                                <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block">
                                  {item.provider}
                                </span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 capitalize">
                                  {item.category?.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>

                            {/* Value Pill */}
                            {item.perk_value && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs whitespace-nowrap">
                                {item.perk_value}
                              </span>
                            )}
                          </div>

                          {/* Title & Tagline */}
                          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#8B1D2C] dark:group-hover:text-rose-400 transition-colors mb-1.5">
                            {item.title}
                          </h3>

                          <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-3">
                            {item.tagline || item.description}
                          </p>

                          {/* Eligibility criteria */}
                          {item.eligibility_criteria && (
                            <div className="mb-4 rounded-xl bg-gray-50 dark:bg-[#0B0F19]/60 border border-gray-100 dark:border-slate-800/80 p-2.5 text-[11px] text-gray-500 dark:text-slate-400 flex items-start gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{item.eligibility_criteria}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom: Action Button */}
                        <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80">
                          {isApproved ? (
                            <button
                              type="button"
                              onClick={() =>
                                setVoucherModal({
                                  open: true,
                                  perk: item,
                                  code: userApp.assigned_code || item.redemption_code || "RBF-UNLOCKED",
                                })
                              }
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>View Voucher Code</span>
                            </button>
                          ) : isPending ? (
                            <button
                              type="button"
                              disabled
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 py-2 text-xs font-bold opacity-80 cursor-not-allowed"
                            >
                              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                              <span>Claim Pending Review</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenClaimModal(item)}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white py-2 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Claim This Perk</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════
              TAB 2: MY CLAIMED PERKS
             ═══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "my_claims" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                    My Claimed Perks & Vouchers ({myApplications.length})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Track the status of your partner credit applications and access your redemption vouchers.
                  </p>
                </div>
              </div>

              {myApplications.length === 0 ? (
                <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-16 text-center border border-gray-100 dark:border-slate-800 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-slate-500">
                    <Gift className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">
                    No Perks Claimed Yet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
                    Explore available partner discounts, cloud credits, and toolkits in the Explore tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("explore")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Browse All Perks</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myApplications.map((app) => {
                    const perk = app.booster_id || {};
                    const isApproved = app.status === "approved" || app.status === "redeemed";
                    const isPending = app.status === "pending";
                    const isRejected = app.status === "rejected";

                    return (
                      <div
                        key={app._id}
                        className="rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-100 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B1D2C]/10 dark:bg-[#8B1D2C]/20 text-[#8B1D2C] dark:text-[#f87171] font-black text-lg shrink-0">
                            {perk.provider?.charAt(0) || "P"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase">
                                {perk.provider}
                              </span>
                              {perk.perk_value && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                  {perk.perk_value}
                                </span>
                              )}
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  isApproved
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                                    : isPending
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
                                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60"
                                }`}
                              >
                                {app.status}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-gray-900 dark:text-slate-100">
                              {perk.title || "Business Booster Perk"}
                            </h4>

                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                              <span>Applied on {new Date(app.createdAt).toLocaleDateString("en-IN")}</span>
                              {app.admin_notes && (
                                <span className="text-[#8B1D2C] dark:text-rose-400 font-medium">
                                  Note: {app.admin_notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Box */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {isApproved && (
                            <button
                              type="button"
                              onClick={() =>
                                setVoucherModal({
                                  open: true,
                                  perk,
                                  code: app.assigned_code || perk.redemption_code || "RBF-BOOST",
                                })
                              }
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>View Voucher & Redeem</span>
                            </button>
                          )}

                          {perk.redemption_url && (
                            <a
                              href={perk.redemption_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                            >
                              <span>Partner Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CLAIM APPLICATION MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {claimModal.open && claimModal.perk && (
        <div
          onClick={() => setClaimModal({ open: false, perk: null })}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
              <div>
                <span className="text-[11px] font-bold text-[#8B1D2C] dark:text-rose-400 uppercase tracking-wider">
                  Claim Business Perk
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                  {claimModal.perk.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClaimModal({ open: false, perk: null })}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitClaim} className="p-6 overflow-y-auto space-y-4">
              {claimFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    claimFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{claimFeedback.msg}</span>
                </div>
              )}

              <div className="rounded-xl bg-[#8B1D2C]/5 dark:bg-[#8B1D2C]/10 border border-[#8B1D2C]/15 p-3 text-xs text-gray-700 dark:text-slate-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#8B1D2C] dark:text-rose-400 block">{claimModal.perk.provider}</span>
                  <span>{claimModal.perk.perk_value || "Exclusive Partner Credit"}</span>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 capitalize">
                  {claimModal.perk.redemption_type?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Company / Venture Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0B0F19] px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Applicant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.applicant_name}
                    onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                    className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0B0F19] px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0B0F19] px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0B0F19] px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Website or Profile Link
                </label>
                <input
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0B0F19] px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  How will you use this perk? (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe your project, compute requirements, or growth plan..."
                  value={formData.use_case_notes}
                  onChange={(e) => setFormData({ ...formData, use_case_notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0B0F19] p-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClaimModal({ open: false, perk: null })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[#8B1D2C] hover:bg-[#721724] text-white shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingClaim ? "Submitting Claim..." : "Confirm & Claim Perk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VOUCHER CODE DISPLAY MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {voucherModal.open && voucherModal.perk && (
        <div
          onClick={() => setVoucherModal({ open: false, perk: null, code: "" })}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-100 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Perk Unlocked & Active
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {voucherModal.perk.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Use your unique redemption voucher code during partner signup or checkout.
              </p>
            </div>

            {/* Voucher Code Box */}
            <div className="rounded-2xl bg-gray-50 dark:bg-[#0B0F19] border-2 border-dashed border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between gap-3">
              <div className="font-mono text-base font-extrabold text-[#8B1D2C] dark:text-rose-400 tracking-wider">
                {voucherModal.code || "RBF-BOOSTER-ACTIVE"}
              </div>

              <button
                type="button"
                onClick={() => copyVoucherCode(voucherModal.code || "RBF-BOOSTER-ACTIVE")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8B1D2C] text-white hover:bg-[#721724] transition active:scale-95 cursor-pointer shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {voucherModal.perk.redemption_url && (
                <a
                  href={voucherModal.perk.redemption_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1C2340] dark:bg-[#8B1D2C] text-white py-2.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Open {voucherModal.perk.provider} Redemption Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setVoucherModal({ open: false, perk: null, code: "" })}
                className="w-full py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../zustand/store";
import {
  CreditCard,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  Loader2,
  FileText,
  AlertCircle,
  ArrowUpRight,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  Receipt,
  Crown,
  Building2,
  Check,
  TrendingUp,
} from "lucide-react";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Subscription() {
  const { user, setUser } = useStore();

  useEffect(() => {
    document.title = "Subscription Plans & Invoices | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Upgrade your startup or ecosystem profile with premium tier incubation access, partner cloud credits, and legal compliance packages."
    );
  }, []);

  const [activeTab, setActiveTab] = useState("plans"); // 'plans' | 'billing'
  const [expandedPlans, setExpandedPlans] = useState({}); // { [planId]: boolean }
  const [plans, setPlans] = useState([]);
  const [legacyPlan, setLegacyPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingKey, setPayingKey] = useState("");
  const [syncingOrderId, setSyncingOrderId] = useState("");

  const handleSyncPayment = async (orderId) => {
    if (!orderId || syncingOrderId) return;
    setSyncingOrderId(orderId);
    try {
      const res = await axios.post("/payment/sync-status", { orderId });
      if (res.data.status === 1) {
        toast.success(res.data.msg || "Payment verified & subscription activated!");
        await fetchData();
      } else {
        toast.info(res.data.msg || "No completed payment found for this order.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error checking payment status.");
    } finally {
      setSyncingOrderId("");
    }
  };

  const togglePlanExpansion = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        axios.get("/plans"),
        axios.get("/payment/my-subscription"),
      ]);

      if (plansRes.data.status === 1) {
        setPlans(plansRes.data.plans || []);
        if (plansRes.data.userLegacyPlan) {
          setLegacyPlan(plansRes.data.userLegacyPlan);
        }
      }

      if (subRes.data.status === 1) {
        setSubscription(subRes.data.subscription);
        setTransactions(subRes.data.transactions || []);
      }
    } catch (err) {
      console.error("Error loading subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute user current plan details
  const currentPlanKey = subscription?.planKey || "free";
  const currentPlanDoc =
    legacyPlan?.key === currentPlanKey
      ? legacyPlan
      : plans.find((p) => p.key === currentPlanKey) || subscription?.planDetails;

  const currentPrice = currentPlanDoc?.price || 0;
  const currentTierRank = currentPlanDoc?.tier_rank || 1;
  const isCurrentActive = subscription?.status === "active";

  const totalSpent = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const handleSubscribe = async (plan) => {
    if (payingKey) return;
    setPayingKey(plan.key);

    try {
      // 1. Create order on backend (handles upgrade price difference)
      const orderRes = await axios.post("/payment/create-order", {
        planId: plan._id,
        planKey: plan.key,
      });

      if (orderRes.data.status !== 1) {
        toast.error(orderRes.data.msg || "Failed to initiate subscription");
        setPayingKey("");
        return;
      }

      // Free plan / zero price difference activation
      if (orderRes.data.isFree) {
        toast.success(orderRes.data.msg || "Plan activated successfully!");
        await fetchData();
        setPayingKey("");
        return;
      }

      // 2. Load Razorpay checkout
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        toast.error("Razorpay SDK failed to load. Please check your network.");
        setPayingKey("");
        return;
      }

      const options = {
        key: orderRes.data.key_id,
        amount: orderRes.data.order.amount,
        currency: orderRes.data.order.currency || "INR",
        name: "RealBell Business Foundation",
        description: orderRes.data.isUpgrade
          ? `Upgrade to ${plan.name} (Price Difference Adjustment)`
          : `${plan.name} Subscription Plan`,
        order_id: orderRes.data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
              planKey: plan.key,
            });

            if (verifyRes.data.status === 1) {
              toast.success("Subscription activated successfully!");
              await fetchData();
            } else {
              toast.error(verifyRes.data.msg || "Payment verification failed.");
            }
          } catch (vErr) {
            toast.error("Payment verification error.");
            console.error(vErr);
          } finally {
            setPayingKey("");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: plan.accentColor || "#8B1D2C",
        },
        modal: {
          ondismiss: function () {
            setPayingKey("");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Subscription purchase error:", err);
      toast.error(err.response?.data?.msg || "Error processing payment request");
      setPayingKey("");
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 sm:p-8 font-sans antialiased text-gray-800 dark:text-slate-200">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C2340] via-[#151D2E] to-[#0D141B] border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#8B1D2C]/25 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 mb-2.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>RealBell Ecosystem Membership</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
                  Subscription & Billing Hub
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Manage your ecosystem membership tier, upgrade benefits, and review invoice history.
                </p>
              </div>

              {/* Active Plan Pill */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 self-start md:self-auto shrink-0 flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B1D2C]/20 border border-[#8B1D2C]/40 text-[#f87171]">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Tier</div>
                  <div className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                    <span>{subscription?.is_expired ? "Starter Free" : (subscription?.planName || "Starter Free")}</span>
                    {subscription?.is_legacy && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Legacy
                      </span>
                    )}
                    {subscription?.is_expired && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  {subscription?.endDate && (
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 inline" />
                      <span>
                        {subscription.is_expired ? "Expired on " : "Valid until "}
                        {new Date(subscription.endDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              TOP SECTION NAVIGATION TABS
             ═══════════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("plans")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === "plans"
                  ? "bg-[#8B1D2C] text-white shadow-md shadow-[#8B1D2C]/20"
                  : "bg-white dark:bg-[#151D2E] text-gray-600 dark:text-slate-400 border border-gray-200/80 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Membership Plans</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === "billing"
                  ? "bg-[#8B1D2C] text-white shadow-md shadow-[#8B1D2C]/20"
                  : "bg-white dark:bg-[#151D2E] text-gray-600 dark:text-slate-400 border border-gray-200/80 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Payment & Invoice History</span>
              {transactions.length > 0 && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === "billing" ? "bg-white/20 text-white" : "bg-[#8B1D2C]/10 text-[#8B1D2C] dark:text-rose-400"
                }`}>
                  {transactions.length}
                </span>
              )}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              TAB 1: MEMBERSHIP PLANS VIEW
             ═══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "plans" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Legacy Plan Notice */}
              {subscription?.is_legacy && legacyPlan && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold">
                        You are subscribed to the {legacyPlan.name} (Legacy Subscription)
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                        This plan is no longer offered to new users, but your account retains full access to all its included services. You may keep this subscription or upgrade to an active tier below anytime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="bg-white dark:bg-[#151D2E] rounded-3xl p-16 text-center border border-gray-100 dark:border-slate-800 shadow-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C] mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    Loading subscription plans & access tiers...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  {plans.map((plan) => {
                    const isCurrent = plan.key === currentPlanKey;
                    const isFree = plan.price === 0;
                    const planTier = plan.tier_rank || 1;

                    // Upgrade / Downgrade Logic
                    const isHigherTier = planTier > currentTierRank || plan.price > currentPrice;
                    const isLowerTier = planTier < currentTierRank || (plan.price < currentPrice && planTier <= currentTierRank);

                    // Calculate Upgrade Price Difference
                    const priceDelta = isHigherTier ? Math.max(0, plan.price - currentPrice) : plan.price;

                    const includedMods = plan.included_modules || [];
                    const customFeats = plan.custom_features || [];
                    const allFeatures = [
                      ...includedMods.map((m) => m.access_line),
                      ...customFeats,
                    ];

                    const isExpanded = Boolean(expandedPlans[plan._id]);
                    const previewCount = 3;
                    const displayedFeatures = isExpanded ? allFeatures : allFeatures.slice(0, previewCount);
                    const remainingCount = Math.max(0, allFeatures.length - previewCount);

                    return (
                      <div
                        key={plan._id}
                        className={`relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 transition-all duration-200 ${
                          isCurrent
                            ? "bg-white dark:bg-[#151D2E] border-2 border-[#8B1D2C] shadow-lg shadow-[#8B1D2C]/10"
                            : "bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 hover:shadow-md shadow-xs"
                        }`}
                      >
                        <div>
                          {/* Top Badge & Current Tag */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${plan.accentColor || "#8B1D2C"}18`,
                                color: plan.accentColor || "#8B1D2C",
                                border: `1px solid ${plan.accentColor || "#8B1D2C"}30`,
                              }}
                            >
                              {plan.badge || (isFree ? "Starter" : "Pro Tier")}
                            </span>

                            {isCurrent && (
                              <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Current Plan</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
                            {plan.name}
                          </h3>

                          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2 min-h-[32px]">
                            {plan.description}
                          </p>

                          {/* Compact Price Display */}
                          <div className="flex items-baseline gap-1.5 pb-4 border-b border-gray-100 dark:border-slate-800 mb-4">
                            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
                              {isFree ? "₹0" : `₹${plan.price?.toLocaleString("en-IN")}`}
                            </span>
                            {!isFree && (
                              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                                / {plan.interval}
                              </span>
                            )}
                          </div>

                          {/* Compact Features Checklist */}
                          <div className="space-y-2 mb-4">
                            <div className="text-[10.5px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                              Included Features ({allFeatures.length})
                            </div>

                            {displayedFeatures.map((featText, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-snug text-[11.5px]">{featText}</span>
                              </div>
                            ))}

                            {allFeatures.length === 0 && (
                              <div className="text-xs text-gray-400 italic">
                                Standard ecosystem access included.
                              </div>
                            )}

                            {/* Expand / Collapse Button */}
                            {allFeatures.length > previewCount && (
                              <button
                                type="button"
                                onClick={() => togglePlanExpansion(plan._id)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-2 rounded-lg text-xs font-bold text-[#8B1D2C] dark:text-rose-400 hover:bg-[#8B1D2C]/5 transition cursor-pointer"
                              >
                                <span>{isExpanded ? "Show Less" : `View All ${allFeatures.length} Features (+${remainingCount})`}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Button Actions with Upgrade Price Delta */}
                        <div className="pt-3.5 border-t border-gray-100 dark:border-slate-800 mt-2">
                          {isCurrent ? (
                            <button
                              type="button"
                              disabled
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 py-2.5 text-xs font-bold cursor-default"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Active Plan</span>
                            </button>
                          ) : isLowerTier && isCurrentActive && currentPrice > 0 ? (
                            <button
                              type="button"
                              disabled
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 py-2.5 text-xs font-bold cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Downgrade Unavailable</span>
                            </button>
                          ) : isHigherTier && isCurrentActive && currentPrice > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSubscribe(plan)}
                              disabled={payingKey === plan.key}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white py-2.5 text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {payingKey === plan.key ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <ArrowUpRight className="w-4 h-4" />
                                  <span>
                                    Upgrade • Pay ₹{priceDelta.toLocaleString("en-IN")} Difference
                                  </span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSubscribe(plan)}
                              disabled={payingKey === plan.key}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white py-2.5 text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {payingKey === plan.key ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-amber-300" />
                                  <span>{isFree ? "Select Free Plan" : `Subscribe for ₹${plan.price?.toLocaleString("en-IN")}`}</span>
                                </>
                              )}
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
              TAB 2: DEDICATED BILLING & PAYMENT HISTORY SECTION
             ═══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "billing" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Billing Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
                  <div className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Active Membership
                  </div>
                  <div className="text-xl font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{subscription?.planName || "Starter Free"}</span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    Status: {subscription?.status || "Active"}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
                  <div className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Total Transactions
                  </div>
                  <div className="text-xl font-extrabold text-gray-900 dark:text-slate-100">
                    {transactions.length} Purchases
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Lifetime recorded payments
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 shadow-xs">
                  <div className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Total Amount Invested
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{totalSpent.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Inclusive of GST & upgrades
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      Payment & Invoice Records
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Downloadable receipts and verified payment confirmation records.
                    </p>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400 dark:text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <div>No payment records found yet.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="pb-3 pr-4">Plan / Service</th>
                          <th className="pb-3 px-4">Amount Paid</th>
                          <th className="pb-3 px-4">Razorpay Order ID</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 pl-4">Payment Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {transactions.map((tx) => (
                          <tr key={tx._id} className="text-gray-700 dark:text-slate-300">
                            <td className="py-3.5 pr-4 font-bold flex items-center gap-2">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>{tx.planName || tx.planKey}</span>
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹{tx.amount?.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">{tx.razorpayOrderId || "—"}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  tx.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : tx.status === "failed"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                }`}>
                                  {tx.status}
                                </span>
                                {tx.status !== "paid" && (
                                  <button
                                    onClick={() => handleSyncPayment(tx.razorpayOrderId)}
                                    disabled={syncingOrderId === tx.razorpayOrderId}
                                    className="text-[10px] font-bold text-[#8B1D2C] dark:text-rose-400 underline hover:no-underline cursor-pointer"
                                    title="Check with Razorpay if bank payment succeeded"
                                  >
                                    {syncingOrderId === tx.razorpayOrderId ? "Checking..." : "Re-check"}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 pl-4 text-gray-400">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

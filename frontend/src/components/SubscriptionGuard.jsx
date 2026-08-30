import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../zustand/store";
import Sidebar from "./Sidebar";
import {
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Crown,
  ChevronRight,
  Compass,
  ArrowLeft,
} from "lucide-react";

export default function SubscriptionGuard({
  moduleKey,
  moduleName = "this feature",
  children,
  fallbackBanner = false,
}) {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);

  // Super admins, admins, and staff teams bypass subscription checks
  if (user?.role === "super_admin" || user?.role === "admin" || user?.team) {
    return <>{children}</>;
  }

  const subscription = user?.subscription;
  const hasExpired = Boolean(subscription?.endDate && new Date(subscription.endDate) < new Date());
  const isSubActive = subscription?.status === "active" && !hasExpired;
  const planKey = isSubActive ? (subscription?.planKey || "free") : "free";

  // Check if module is allowed in user's active subscription
  let hasAccess = false;

  if (isSubActive) {
    if (Array.isArray(subscription?.included_modules) && subscription.included_modules.length > 0) {
      hasAccess = subscription.included_modules.some(
        (m) => m.module_key === moduleKey && m.is_enabled !== false
      );
    } else {
      // Standard fallback rules for seed tiers
      if (planKey === "enterprise_vip") {
        hasAccess = true;
      } else if (planKey === "pro_growth") {
        hasAccess = moduleKey !== "booster" && moduleKey !== "legal_compliance" && moduleKey !== "certificates";
      } else if (planKey === "free" || !planKey) {
        hasAccess = false;
      } else {
        hasAccess = false;
      }
    }
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Inline Fallback Banner mode (if used inside other pages)
  if (fallbackBanner) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 p-4 sm:p-5 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Subscription Upgrade Required
            </div>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
              Access to <strong className="text-slate-900 dark:text-white font-bold">{moduleName}</strong> is restricted on your plan ({subscription?.planName || "Starter Free"}).
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/subscription")}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B1D2C] to-[#A82538] hover:from-[#721724] hover:to-[#8B1D2C] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Upgrade Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Full Screen Guard with Integrated Sidebar & Professional Luxury UI
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-[300px] min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 pt-24 lg:pt-10 relative overflow-hidden">
        {/* Ambient Decorative Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-[#8B1D2C]/15 via-rose-500/10 to-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Lock Card Container */}
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white/90 dark:bg-[#121826]/90 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl backdrop-blur-xl p-6 sm:p-10 text-center z-10 transition-all">
          
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#8B1D2C]/10 via-rose-500/10 to-amber-500/10 border border-[#8B1D2C]/25 text-[#8B1D2C] dark:text-rose-400 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-6">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Premium Ecosystem Access</span>
          </div>

          {/* Floating Lock Icon with Glowing Aura */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#8B1D2C] to-amber-500 opacity-20 blur-lg animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B1D2C] to-[#5C111C] text-white shadow-xl shadow-[#8B1D2C]/30 border border-white/20">
              <Lock className="w-9 h-9 text-amber-300" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Unlock Full Access to <span className="bg-gradient-to-r from-[#8B1D2C] via-rose-600 to-amber-600 bg-clip-text text-transparent">{moduleName}</span>
          </h2>

          {/* Explanatory Subtext */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto mb-8">
            Access to <strong className="font-semibold text-slate-900 dark:text-white">{moduleName}</strong> is reserved for members with an active subscription plan. Your current membership is on the{" "}
            <span className="inline-block px-2.5 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {subscription?.planName || "Starter Free Tier"}
            </span>.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full Feature Access</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Unlimited access to {moduleName} with zero usage barriers.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Ecosystem Connect</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Direct networking with verified founders, investors, and mentors.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Priority Support</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Expedited application reviews and dedicated assistance.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => navigate("/subscription")}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#8B1D2C] via-[#9B2132] to-[#8B1D2C] hover:from-[#751724] hover:to-[#751724] text-white px-7 py-3.5 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-[#8B1D2C]/25 hover:shadow-xl hover:shadow-[#8B1D2C]/40 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Explore Membership Plans & Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Micro Footer Guarantee */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>🔒 Secure Razorpay Checkout</span>
            <span>•</span>
            <span>⚡ Instant Feature Activation</span>
            <span>•</span>
            <span>🛡️ Cancel Anytime</span>
          </div>

        </div>
      </div>
    </div>
  );
}

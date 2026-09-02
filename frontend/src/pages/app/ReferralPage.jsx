import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import {
  Gift,
  Copy,
  Check,
  Users,
  Coins,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  Search,
  Building2,
  Info,
  TrendingUp,
  Award,
} from "lucide-react";

export default function ReferralPage() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [referralData, setReferralData] = useState({
    referralCode: "",
    referralLink: "",
    stats: {
      successfulReferrals: 0,
      totalCreditsEarned: 0,
      rewardPerReferral: 250,
    },
    referrals: [],
  });

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/referrals/my-stats");
      if (res.data.status === 1) {
        setReferralData({
          referralCode: res.data.referralCode || "",
          referralLink:
            res.data.referralLink ||
            `${window.location.origin}/signup?ref=${res.data.referralCode}`,
          stats: res.data.stats || {
            successfulReferrals: 0,
            totalCreditsEarned: 0,
            rewardPerReferral: 250,
          },
          referrals: res.data.referrals || [],
        });
      }
    } catch (err) {
      console.error("Failed to load referral stats:", err);
      toast.error("Could not fetch referral details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const handleCopyLink = () => {
    const link =
      referralData.referralLink ||
      `${window.location.origin}/signup?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    setCopiedCode(true);
    toast.success("Referral code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const filteredReferrals = referralData.referrals.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (r.referredUser?.name || "").toLowerCase();
    const company = (r.referredUser?.company_name || "").toLowerCase();
    return name.includes(q) || company.includes(q);
  });

  return (
    <>
      {/* Fixed Sidebar for Desktop + Responsive Header/Drawer for Mobile */}
      <Sidebar />

      {/* Main Content Area properly offset for Desktop (300px) and Mobile top bar */}
      <main
        className="ml-0 lg:ml-[300px] pt-20 lg:pt-8 min-h-screen px-4 sm:px-6 lg:px-8 pb-16 transition-all"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          background: COLORS.gradientBg,
        }}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-1" style={{ color: COLORS.muted }}>
                <Gift size={16} color="var(--color-primary, #2563EB)" />
                <span>RBF Rewards Program</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{
                  color: COLORS.ink,
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                Refer & Earn Credits
              </h1>
              <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.muted }}>
                Invite founders, mentors, and investors to RealBell Foundation and earn <strong>250 credits</strong> for each verified signup.
              </p>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xs border"
              style={{
                background: COLORS.gradientCard,
                borderColor: COLORS.border,
              }}
            >
              <div
                className="p-2.5 rounded-xl flex items-center justify-center"
                style={{ background: COLORS.gradientPillBadge, color: COLORS.primary }}
              >
                <Coins size={22} />
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                  Total Referral Credits
                </div>
                <div className="text-lg font-black" style={{ color: COLORS.primary }}>
                  {referralData.stats.totalCreditsEarned.toLocaleString()}{" "}
                  <span className="text-xs font-bold" style={{ color: COLORS.muted }}>
                    (₹{referralData.stats.totalCreditsEarned.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Grid: Referral Share Card & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Share Card */}
            <div
              className="lg:col-span-8 rounded-3xl p-6 sm:p-8 shadow-sm border relative overflow-hidden"
              style={{
                background: COLORS.gradientCard,
                borderColor: COLORS.border,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-2"
                    style={{
                      background: COLORS.gradientPillBadge,
                      color: COLORS.primary,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Your Unique Referral Invite</span>
                  </span>
                  <h2
                    className="text-xl sm:text-2xl font-black mt-1"
                    style={{ color: COLORS.ink }}
                  >
                    Share Your Link With Your Network
                  </h2>
                  <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: COLORS.muted }}>
                    When a friend joins using your referral link or code, they receive <strong>250 bonus credits</strong> and you receive <strong>250 credits</strong> directly in your wallet.
                  </p>
                </div>
                <div
                  className="p-3.5 rounded-2xl shrink-0 flex items-center justify-center"
                  style={{ background: COLORS.gradientPillBadge, color: COLORS.primary }}
                >
                  <Share2 size={24} />
                </div>
              </div>

              <div className="space-y-4">
                {/* Referral Link Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.ink }}>
                    Referral Link
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      readOnly
                      value={referralData.referralLink}
                      style={{
                        background: COLORS.inputBg,
                        borderColor: COLORS.inputBorder,
                        color: COLORS.ink,
                      }}
                      className="flex-1 rounded-2xl border px-4 py-3.5 text-xs sm:text-sm font-mono outline-none select-all shadow-inner"
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        background: COLORS.gradientPrimary,
                        color: "#fff",
                        boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>

                {/* Referral Code Field */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.ink }}>
                    Your Referral Code
                  </label>
                  <div
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-xs"
                    style={{
                      background: COLORS.gradientCardElevated,
                      borderColor: COLORS.border,
                    }}
                  >
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                        Unique Promo Code
                      </div>
                      <div
                        className="text-xl sm:text-2xl font-black font-mono tracking-widest mt-0.5"
                        style={{ color: COLORS.primary }}
                      >
                        {referralData.referralCode || "..."}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      style={{
                        background: COLORS.card,
                        borderColor: COLORS.border,
                        color: COLORS.ink,
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold hover:border-blue-500 shadow-xs transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Column */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div
                className="flex-1 rounded-3xl border p-6 shadow-xs flex flex-col justify-between"
                style={{
                  background: COLORS.gradientCard,
                  borderColor: COLORS.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                    Successful Referrals
                  </span>
                  <div
                    className="p-2.5 rounded-xl flex items-center justify-center"
                    style={{ background: COLORS.gradientPillBadge, color: COLORS.primary }}
                  >
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: COLORS.ink }}>
                    {referralData.stats.successfulReferrals}
                  </div>
                  <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                    Verified ecosystem members joined
                  </p>
                </div>
              </div>

              <div
                className="flex-1 rounded-3xl border p-6 shadow-xs flex flex-col justify-between"
                style={{
                  background: COLORS.gradientCard,
                  borderColor: COLORS.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                    Reward Per Signup
                  </span>
                  <div
                    className="p-2.5 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}
                  >
                    <Coins size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                    +250 <span className="text-sm font-bold" style={{ color: COLORS.muted }}>Credits</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                    100% usable on Legal Compliance services
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Step Walkthrough Guide */}
          <div
            className="rounded-3xl border p-6 sm:p-8 shadow-xs"
            style={{
              background: COLORS.gradientCard,
              borderColor: COLORS.border,
            }}
          >
            <h3
              className="text-base sm:text-lg font-bold mb-6 flex items-center gap-2"
              style={{ color: COLORS.ink }}
            >
              <Sparkles size={18} color="var(--color-primary, #2563EB)" />
              <span>How The Referral Program Works</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: COLORS.gradientCardElevated,
                  borderColor: COLORS.border,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm"
                    style={{ background: COLORS.gradientPillBadge, color: COLORS.primary }}
                  >
                    1
                  </span>
                  <Share2 size={16} style={{ color: COLORS.muted }} />
                </div>
                <h4 className="text-sm font-bold mb-1" style={{ color: COLORS.ink }}>
                  Share Your Link or Code
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
                  Send your unique referral link to founders, mentors, and startups in your professional circle.
                </p>
              </div>

              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: COLORS.gradientCardElevated,
                  borderColor: COLORS.border,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm"
                    style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366F1" }}
                  >
                    2
                  </span>
                  <CheckCircle2 size={16} style={{ color: COLORS.muted }} />
                </div>
                <h4 className="text-sm font-bold mb-1" style={{ color: COLORS.ink }}>
                  Friend Signs Up
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
                  Your referral code is auto-applied at signup. They complete registration and email OTP verification.
                </p>
              </div>

              <div
                className="p-5 rounded-2xl border"
                style={{
                  background: COLORS.gradientCardElevated,
                  borderColor: COLORS.border,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm"
                    style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}
                  >
                    3
                  </span>
                  <Coins size={16} style={{ color: COLORS.muted }} />
                </div>
                <h4 className="text-sm font-bold mb-1" style={{ color: COLORS.ink }}>
                  Both Receive 250 Credits
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>
                  You get 250 credits, and your friend gets 250 bonus credits instantly added to their Credit Wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Referrals History Table */}
          <div
            className="rounded-3xl border shadow-xs overflow-hidden"
            style={{
              background: COLORS.gradientCard,
              borderColor: COLORS.border,
            }}
          >
            <div
              className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ borderColor: COLORS.border }}
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold" style={{ color: COLORS.ink }}>
                  Referral History
                </h3>
                <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  Track all ecosystem members who registered using your referral code
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.muted }} />
                <input
                  type="text"
                  placeholder="Search member or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: COLORS.inputBg,
                    borderColor: COLORS.inputBorder,
                    color: COLORS.ink,
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs" style={{ color: COLORS.muted }}>
                Loading referral activity...
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-12 text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-3"
                  style={{ background: COLORS.gradientCardElevated, color: COLORS.muted }}
                >
                  <Users size={24} />
                </div>
                <h4 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                  No Referrals Yet
                </h4>
                <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: COLORS.muted }}>
                  Share your referral link with startup founders and backers to start earning 250 credits per signup!
                </p>
                <button
                  onClick={handleCopyLink}
                  style={{
                    background: COLORS.gradientPrimary,
                    color: "#fff",
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Referral Link</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead
                    className="font-bold uppercase tracking-wider border-b"
                    style={{
                      background: COLORS.gradientCardElevated,
                      borderColor: COLORS.border,
                      color: COLORS.muted,
                    }}
                  >
                    <tr>
                      <th className="px-6 py-3.5">Referred Organization</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Reward Earned</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                    {filteredReferrals.map((item) => (
                      <tr
                        key={item._id}
                        className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold" style={{ color: COLORS.ink }}>
                            {item.referredUser?.company_name || "Startup"}
                          </div>
                          <div className="text-[11px]" style={{ color: COLORS.muted }}>
                            {item.referredUser?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">
                          <span
                            className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border"
                            style={{
                              background: COLORS.gradientCardElevated,
                              borderColor: COLORS.border,
                              color: COLORS.ink,
                            }}
                          >
                            {item.referredUser?.company_type || "startup"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{item.rewardAmount || 250} Credits
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={11} />
                            <span>{item.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4" style={{ color: COLORS.muted }}>
                          {new Date(item.rewardedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
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
      </main>
    </>
  );
}

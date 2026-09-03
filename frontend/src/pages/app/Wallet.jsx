import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar.jsx";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import { COLORS } from "../../components/colors";
import {
  Wallet as WalletIcon,
  PlusCircle,
  CreditCard,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Coins,
  Receipt,
  Search,
  ChevronRight,
  ExternalLink,
  Lock,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const TOPUP_PRESETS = [
  { credits: 250, label: "Starter", pop: false },
  { credits: 500, label: "Recommended", pop: true },
  { credits: 1000, label: "Growth", pop: false },
  { credits: 2500, label: "Scale", pop: false },
  { credits: 5000, label: "Enterprise", pop: false },
];

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

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useStore();

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({
    balance: 500,
    total_credited: 500,
    total_debited: 0,
    currency: "INR",
    status: "active",
  });
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Top-Up Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [processingTopup, setProcessingTopup] = useState(false);

  // Filter State
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/wallet/my-wallet");
      if (res.data.status === 1) {
        setWallet(res.data.wallet || {});
        setTransactions(res.data.recentTransactions || []);
        setPagination((prev) => ({ ...prev, total: res.data.totalTransactions || 0 }));
      }
    } catch (err) {
      console.error("Failed to load wallet:", err);
      toast.error("Could not fetch wallet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Razorpay Wallet Top-up Handler with Full Cryptographic Verification
  const handleTopupPayment = async () => {
    const creditsToBuy = Number(topupAmount);
    if (!creditsToBuy || creditsToBuy < 1) {
      toast.error("Please enter a valid credit amount (minimum 1 credit)");
      return;
    }

    try {
      setProcessingTopup(true);

      // 1. Create order on backend (Authenticated via JWT Session)
      const res = await axios.post("/wallet/topup/create-order", { amount: creditsToBuy });

      if (res.data.status !== 1) {
        toast.error(res.data.msg || "Failed to initialize top-up order");
        setProcessingTopup(false);
        return;
      }

      const { order, key_id, credits } = res.data;

      // 2. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Please check internet connection.");
        setProcessingTopup(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "RealBell Business Foundation",
        description: `Purchase ${credits} Wallet Credits (1 Credit = ₹1)`,
        order_id: order.id.startsWith("order_wal_demo_") ? undefined : order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: () => {
            toast.warn("Credit purchase cancelled.");
            setProcessingTopup(false);
          },
        },
        handler: async function (response) {
          try {
            // 4. Cryptographically verify signature on server and credit wallet
            const verifyRes = await axios.post("/wallet/topup/verify", {
              razorpay_order_id: order.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "demo_signature",
              credits,
            });

            if (verifyRes.data.status === 1) {
              toast.success(`🎉 Added ${credits} credits to your wallet!`);
              setShowTopupModal(false);
              fetchWalletData();
            } else {
              toast.error(verifyRes.data.msg || "Payment verification failed");
            }
          } catch (vErr) {
            console.error("Top-up verification error:", vErr);
            toast.error(vErr.response?.data?.msg || "Payment verification failed on server");
          } finally {
            setProcessingTopup(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setProcessingTopup(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Topup error:", err);
      toast.error(err.response?.data?.msg || "Failed to process top-up");
      setProcessingTopup(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const ref = (t.reference_id || "").toLowerCase();
      return desc.includes(q) || ref.includes(q);
    }
    return true;
  });

  return (
    <>
      {/* Sidebar (Desktop Fixed + Mobile Responsive Header & Drawer) */}
      <Sidebar />

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
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <Coins size={16} color="var(--color-primary)" />
                <span>RBF Financial Hub</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{
                  color: COLORS.ink,
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                My Credit Wallet
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your ecosystem credits, add balance, and review compliance service deductions.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={fetchWalletData}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
                title="Refresh Wallet"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 transition cursor-pointer"
                style={{ background: COLORS.gradientPrimary }}
              >
                <PlusCircle size={16} />
                <span>Add Credits</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Balance Cards & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main Glowing Balance Card */}
            <div
              className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl"
              style={{
                background: COLORS.gradientPrimary,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              {/* Ambient Lighting Orbs */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 -top-12 w-48 h-48 rounded-full bg-cyan-300/15 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-full min-h-[190px]">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-white mb-3">
                      <Sparkles size={12} className="text-amber-300" />
                      <span>1 Credit = 1 INR (₹1)</span>
                    </span>
                    <div className="text-xs sm:text-sm text-blue-100 font-medium tracking-wide">
                      AVAILABLE WALLET BALANCE
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                    <CheckCircle2 size={13} className="text-emerald-300" />
                    <span>Active</span>
                  </div>
                </div>

                <div className="my-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      {wallet.balance.toLocaleString("en-IN")}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-blue-200">Credits</span>
                    <span className="text-xs text-blue-200/80 font-medium sm:ml-2">
                      (≈ ₹{wallet.balance.toLocaleString("en-IN")})
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-100">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="opacity-75">Total Credited: </span>
                      <strong className="text-white font-bold">
                        +{wallet.total_credited?.toLocaleString("en-IN") || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="opacity-75">Total Spent: </span>
                      <strong className="text-white font-bold">
                        -{wallet.total_debited?.toLocaleString("en-IN") || 0}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTopupModal(true)}
                    className="px-4 py-1.5 rounded-lg bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition cursor-pointer shadow-sm"
                  >
                    Top-Up Credits →
                  </button>
                </div>
              </div>
            </div>

            {/* Legal Compliance Usage Explainer Card */}
            <div
              className="rounded-3xl p-6 flex flex-col justify-between"
              style={{
                background: COLORS.gradientCard,
                border: `1px solid ${COLORS.border}`,
                boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: COLORS.ink }}>
                      Legal Compliance Credits
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Exclusive Usage Benefit
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Your wallet credits can be applied <strong>100%</strong> to pay for government registrations, trademark filings, incorporation, GST, and compliance advisory.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Welcome Bonus Credits included initially for your compliance services</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Pay full fee with credits or split with Razorpay</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/legal-compliances")}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Legal Services</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {/* Transaction History Section */}
          <div
            className="rounded-3xl p-5 sm:p-6"
            style={{
              background: COLORS.gradientCard,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
            }}
          >
            {/* Table Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold" style={{ color: COLORS.ink }}>
                  Wallet Activity Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete chronological audit of your credit top-ups, bonuses, and service payments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {/* Filter Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    onClick={() => setTypeFilter("all")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      typeFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTypeFilter("credit")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      typeFilter === "credit"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Credits (+)
                  </button>
                  <button
                    onClick={() => setTypeFilter("debit")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      typeFilter === "debit"
                        ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Debits (-)
                  </button>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs flex-1 md:flex-none">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 w-full md:w-44"
                  />
                </div>
              </div>
            </div>

            {/* Transactions Table / List */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
                <p className="text-xs font-semibold">Loading ledger transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt size={36} className="mx-auto text-slate-400 mb-3 opacity-60" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Transactions Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Top up your wallet or apply credits to legal compliance services to see records here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10.5px] tracking-wider">
                      <th className="pb-3 pl-2">Type</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Reference / ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 pr-2 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredTransactions.map((tx) => {
                      const isCredit = tx.type === "credit";
                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 pl-2">
                            <div
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isCredit
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                              <span>{isCredit ? "Credit" : "Debit"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                            {tx.description || (isCredit ? "Wallet Top-up" : "Service Payment")}
                          </td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                              {tx.category?.replace(/_/g, " ") || "General"}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {tx.reference_id || tx.razorpay_payment_id || "—"}
                          </td>
                          <td className="py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className={`py-3.5 text-right font-extrabold text-sm ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {isCredit ? "+" : "-"}{tx.amount?.toLocaleString("en-IN")} Credits
                          </td>
                          <td className="py-3.5 pr-2 text-right font-bold text-slate-700 dark:text-slate-300">
                            {tx.balance_after?.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Top-Up Credits Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-3xl p-6 text-slate-900 dark:text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: COLORS.gradientCard,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
                    Purchase Wallet Credits
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">1 Credit = ₹1.00 INR</span>
                </div>
              </div>
              <button
                onClick={() => !processingTopup && setShowTopupModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Preset Chips */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Select Credit Package:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TOPUP_PRESETS.map((p) => {
                  const isSelected = Number(topupAmount) === p.credits;
                  return (
                    <button
                      key={p.credits}
                      type="button"
                      onClick={() => setTopupAmount(p.credits)}
                      className={`relative p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-extrabold shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-semibold"
                      }`}
                    >
                      {p.pop && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap">
                          POPULAR
                        </span>
                      )}
                      <div className="text-sm">{p.credits}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">₹{p.credits}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Or Enter Custom Credits:
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full pl-8 pr-20 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500"
                  placeholder="Enter amount"
                />
                <span className="absolute right-3.5 text-xs text-slate-400 font-semibold">Credits</span>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mb-5 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Credits to add:</span>
                <strong className="text-slate-900 dark:text-white font-bold">+{Number(topupAmount) || 0} Credits</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Payable Amount:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-bold">₹{Number(topupAmount) || 0} INR</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Usable In:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Legal Compliance Services</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={processingTopup}
                onClick={() => setShowTopupModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingTopup || !topupAmount || Number(topupAmount) < 1}
                onClick={handleTopupPayment}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                style={{ background: COLORS.gradientPrimary }}
              >
                {processingTopup ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={14} />
                    <span>Pay ₹{Number(topupAmount) || 0}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

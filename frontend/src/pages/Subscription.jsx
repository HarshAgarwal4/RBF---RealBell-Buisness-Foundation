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
} from "lucide-react";
import { COLORS } from "../components/colors";

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
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingKey, setPayingKey] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          axios.get("/plans"),
          axios.get("/payment/my-subscription"),
        ]);

        if (plansRes.data.status === 1) {
          setPlans(plansRes.data.plans || []);
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
    }

    fetchData();
  }, []);

  const handleSubscribe = async (plan) => {
    if (payingKey) return;
    setPayingKey(plan.key);

    try {
      // 1. Create order on backend
      const orderRes = await axios.post("/payment/create-order", { planId: plan._id, planKey: plan.key });

      if (orderRes.data.status !== 1) {
        toast.error(orderRes.data.msg || "Failed to initiate payment");
        setPayingKey("");
        return;
      }

      // Free plan instant activation
      if (orderRes.data.isFree) {
        toast.success("Starter Free plan activated!");
        const refreshSub = await axios.get("/payment/my-subscription");
        if (refreshSub.data.status === 1) {
          setSubscription(refreshSub.data.subscription);
          setTransactions(refreshSub.data.transactions || []);
        }
        setPayingKey("");
        return;
      }

      const { order, key_id } = orderRes.data;

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Please check your internet connection.");
        setPayingKey("");
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "RealBell Business Foundation",
        description: `Upgrade to ${plan.name} Subscription`,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: plan.accentColor || COLORS.primary,
        },
        // Suppress Razorpay's own built-in success screen so we control messaging
        "modal.backdropclose": false,
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
              toast.success("🎉 Subscription activated successfully!");
              setSubscription(verifyRes.data.subscription);
              const subRefresh = await axios.get("/payment/my-subscription");
              if (subRefresh.data.status === 1) {
                setTransactions(subRefresh.data.transactions || []);
              }
            } else {
              toast.error(verifyRes.data.msg || "Payment verification failed");
            }
          } catch (e) {
            console.error(e);
            toast.error("Error verifying payment");
          } finally {
            setPayingKey("");
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled");
            setPayingKey("");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Subscription payment error:", err);
      toast.error(err?.response?.data?.msg || "Unable to initiate payment");
      setPayingKey("");
    }
  };

  const calculateDaysLeft = (endDateStr) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const currentPlanKey = subscription?.planKey || "free";
  const [mobileTab, setMobileTab] = useState("plans");
  const daysLeft = calculateDaysLeft(subscription?.endDate);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div
        className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-3 sm:px-6 lg:px-8 pb-10 min-h-screen max-w-full overflow-hidden"
        style={{
          background: COLORS.bg,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8E1B2E]">
            Billing & Membership
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold mt-0.5 text-[#152033]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Subscription Plans
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            Upgrade your membership to unlock unlimited connections, direct messaging, and priority ecosystem access.
          </p>
        </div>

        {/* Mobile View Switcher Tabs */}
        <div className="flex sm:hidden items-center p-1 bg-gray-200/80 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setMobileTab("plans")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === "plans" ? "bg-white text-[#152033] shadow-xs" : "text-gray-600"
            }`}
          >
            Membership Plans
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("history")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              mobileTab === "history" ? "bg-white text-[#152033] shadow-xs" : "text-gray-600"
            }`}
          >
            Billing History ({transactions.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: COLORS.muted }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <div>Loading subscription plans...</div>
          </div>
        ) : (
          <>
            {/* Active Subscription Banner */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                  }}
                >
                  <CreditCard size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-extrabold text-gray-900">
                      {subscription?.planName || "Free Starter"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        subscription?.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {subscription?.status || "active"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {subscription?.startDate ? (
                      <>
                        Active since {new Date(subscription.startDate).toLocaleDateString("en-IN")} · Expires on{" "}
                        <strong className="text-gray-800">{new Date(subscription.endDate).toLocaleDateString("en-IN")}</strong>
                      </>
                    ) : (
                      "Default Free Tier Membership"
                    )}
                  </div>
                </div>
              </div>

              {daysLeft !== null && (
                <div className="bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2.5 self-start sm:self-auto">
                  <Clock size={16} color={COLORS.primary} className="shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-gray-900">{daysLeft} Days</div>
                    <div className="text-[10px] text-gray-500 font-medium">Remaining in cycle</div>
                  </div>
                </div>
              )}
            </div>

            {/* Plans Grid (Shown when mobileTab === 'plans' or on tablet/desktop) */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full ${mobileTab === "plans" ? "block" : "hidden sm:grid"}`}>
              {plans.map((plan) => {
                const isCurrent = currentPlanKey === plan.key;
                const isPaying = payingKey === plan.key;

                return (
                  <div
                    key={plan._id}
                    className="bg-white rounded-2xl flex flex-col relative transition-all overflow-hidden"
                    style={{
                      border: isCurrent ? `2px solid ${plan.accentColor || COLORS.primary}` : `1px solid ${COLORS.border}`,
                      boxShadow: isCurrent ? "0 8px 24px rgba(99,102,241,0.12)" : "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    {plan.badge && (
                      <div
                        className="absolute top-3 right-3 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white"
                        style={{
                          background: plan.accentColor || COLORS.primary,
                        }}
                      >
                        {plan.badge}
                      </div>
                    )}

                    <div className="p-4 sm:p-5 border-b border-gray-100">
                      <div className="text-base sm:text-xl font-extrabold text-gray-900">{plan.name}</div>
                      <div className="text-xs text-gray-500 mt-1 min-h-[32px] leading-relaxed">
                        {plan.description}
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-xl sm:text-3xl font-extrabold text-gray-900">
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          /{plan.interval === "yearly" ? "year" : plan.interval === "one_time" ? "lifetime" : "month"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <div className="text-[10px] sm:text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                        Plan Features
                      </div>

                      <div className="flex flex-col gap-2 flex-1 mb-4">
                        {plan.features?.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                            <CheckCircle2 size={14} color={plan.accentColor || COLORS.primary} className="shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isCurrent || isPaying}
                        className="w-full h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        style={{
                          background: isCurrent ? "#F1F5F9" : plan.accentColor || COLORS.primary,
                          color: isCurrent ? COLORS.muted : "#fff",
                        }}
                      >
                        {isPaying ? (
                          <>
                            <Loader2 size={15} className="animate-spin" /> Initiating...
                          </>
                        ) : isCurrent ? (
                          "Current Active Plan"
                        ) : (
                          <>
                            <Zap size={15} /> Subscribe Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Billing History Section (Shown when mobileTab === 'history' or on tablet/desktop) */}
            <div className={`bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-5 max-w-full overflow-hidden ${mobileTab === "history" ? "block" : "hidden sm:block"}`}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <FileText size={18} color={COLORS.primary} />
                <h3 className="text-sm sm:text-lg font-extrabold text-gray-900">Billing & Invoices History</h3>
              </div>

              {transactions.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-xs sm:text-sm">
                  No payment transactions found.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View for Transactions */}
                  <div className="block sm:hidden space-y-2.5">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">{tx.planName}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              tx.status === "paid" ? "bg-green-100 text-green-800" : tx.status === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{new Date(tx.createdAt).toLocaleDateString("en-IN")}</span>
                          <span className="font-extrabold text-gray-900">₹{tx.amount?.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono truncate">
                          ID: {tx.razorpayPaymentId || tx.razorpayOrderId}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop / Tablet Table View for Transactions */}
                  <div className="hidden sm:block overflow-x-auto max-w-full">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Plan</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Payment ID</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx._id} className="border-b border-gray-100">
                            <td className="py-3 px-3 font-semibold text-gray-800">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-3 px-3 font-bold text-gray-900">{tx.planName}</td>
                            <td className="py-3 px-3 font-extrabold text-gray-900">₹{tx.amount?.toLocaleString("en-IN")}</td>
                            <td className="py-3 px-3 fontFamily-mono text-[11px] text-gray-500">
                              {tx.razorpayPaymentId || tx.razorpayOrderId}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                  tx.status === "paid" ? "bg-green-100 text-green-800" : tx.status === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

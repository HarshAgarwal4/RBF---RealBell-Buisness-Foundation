import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Scale,
  CreditCard,
  Calendar,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AdminWalletManagement() {
  const { user: loggedInAdmin } = useStore();

  const [activeTab, setActiveTab] = useState("users"); // "users" | "ledger"
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCirculationBalance: 0,
    totalEverCredited: 0,
    totalEverDebited: 0,
    totalTopupAmount: 0,
    totalTopupCount: 0,
    totalLegalSpent: 0,
    totalLegalTxns: 0,
    totalAdminCredits: 0,
    totalWallets: 0,
  });

  // User Wallets Table State
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Global Ledger State
  const [ledgerTxns, setLedgerTxns] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("");
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState("");
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Adjust Credits Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustType, setAdjustType] = useState("credit"); // "credit" | "debit"
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/wallet/admin/stats");
      if (res.data.status === 1) {
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error("Failed to load admin wallet stats:", err);
    }
  };

  const fetchUserWallets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/wallet/admin/wallets", {
        params: {
          page,
          limit: 15,
          search,
          company_type: companyTypeFilter,
        },
      });
      if (res.data.status === 1) {
        setUsers(res.data.users || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load user wallets:", err);
      toast.error("Could not fetch user wallets");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/wallet/admin/transactions", {
        params: {
          page: ledgerPage,
          limit: 20,
          search: ledgerSearch,
          type: ledgerTypeFilter,
          category: ledgerCategoryFilter,
        },
      });
      if (res.data.status === 1) {
        setLedgerTxns(res.data.transactions || []);
        setLedgerTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load ledger transactions:", err);
      toast.error("Could not fetch ledger transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUserWallets();
    } else {
      fetchLedger();
    }
  }, [activeTab, page, search, companyTypeFilter, ledgerPage, ledgerTypeFilter, ledgerCategoryFilter, ledgerSearch]);

  const handleOpenAdjustModal = (targetUser) => {
    setSelectedUser(targetUser);
    setAdjustType("credit");
    setAdjustAmount("");
    setAdjustReason("");
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount || Number(adjustAmount) < 1) {
      toast.error("Please enter a valid credit amount");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Please provide a reason or note for this adjustment");
      return;
    }

    try {
      setSubmittingAdjust(true);
      const res = await axios.post("/wallet/admin/adjust", {
        userId: selectedUser._id,
        type: adjustType,
        amount: Number(adjustAmount),
        reason: adjustReason.trim(),
      });

      if (res.data.status === 1) {
        toast.success(res.data.msg || "Credits updated successfully!");
        setShowAdjustModal(false);
        fetchStats();
        fetchUserWallets();
      } else {
        toast.error(res.data.msg || "Adjustment failed");
      }
    } catch (err) {
      console.error("Adjust error:", err);
      toast.error(err.response?.data?.msg || "Failed to adjust credits");
    } finally {
      setSubmittingAdjust(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">
            <Coins size={15} />
            <span>Financial &amp; Credit Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Wallet &amp; Credits Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage ecosystem user credit wallets, assign bonuses, and review full transaction ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === "users") fetchUserWallets();
              else fetchLedger();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Total Active Balance</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalCirculationBalance?.toLocaleString("en-IN") || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {stats.totalWallets || 0} user wallets
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Razorpay Top-Ups</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₹{stats.totalTopupAmount?.toLocaleString("en-IN") || 0}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {stats.totalTopupCount || 0} online purchase orders
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Redeemed in Legal Services</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Scale size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalLegalSpent?.toLocaleString("en-IN") || 0}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
            {stats.totalLegalTxns || 0} compliance payments
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">
            <span>Admin Credit Grants</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalAdminCredits?.toLocaleString("en-IN") || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Granted manually via console
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-4 transition cursor-pointer border-b-2 ${
            activeTab === "users"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          User Wallets Directory
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 px-4 transition cursor-pointer border-b-2 ${
            activeTab === "ledger"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Global Transaction Ledger
        </button>
      </div>

      {/* TAB 1: User Wallets Directory */}
      {activeTab === "users" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex items-center flex-1 sm:flex-none">
                <Search size={14} className="absolute left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, email, company..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none w-full sm:w-64"
                />
              </div>

              <select
                value={companyTypeFilter}
                onChange={(e) => {
                  setCompanyTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer capitalize"
              >
                <option value="">All Ecosystem Roles</option>
                <option value="startup">Startups</option>
                <option value="investor">Investors</option>
                <option value="mentor">Mentors</option>
                <option value="incubator">Incubators</option>
                <option value="accelerator">Accelerators</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-xs font-bold">Loading user wallets...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <User size={36} className="mx-auto text-slate-400 mb-3 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No users found matching query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10.5px]">
                    <th className="pb-3 pl-2">User / Company</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Current Balance</th>
                    <th className="pb-3">Total Credited</th>
                    <th className="pb-3">Total Spent</th>
                    <th className="pb-3">Wallet Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                            {u.company_name && (
                              <div className="text-[10px] text-slate-400 font-medium">{u.company_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                          {u.company_type || u.role || "Member"}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {u.wallet?.balance?.toLocaleString("en-IN") || 500} Credits
                        </span>
                      </td>
                      <td className="py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        +{u.wallet?.total_credited?.toLocaleString("en-IN") || 500}
                      </td>
                      <td className="py-3.5 text-rose-600 dark:text-rose-400 font-bold">
                        -{u.wallet?.total_debited?.toLocaleString("en-IN") || 0}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => handleOpenAdjustModal(u)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                        >
                          Assign / Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Global Transaction Ledger */}
      {activeTab === "ledger" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, ref ID, notes..."
                  value={ledgerSearch}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none w-60"
                />
              </div>

              <select
                value={ledgerTypeFilter}
                onChange={(e) => {
                  setLedgerTypeFilter(e.target.value);
                  setLedgerPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">All Types (Credit/Debit)</option>
                <option value="credit">Credits (+)</option>
                <option value="debit">Debits (-)</option>
              </select>

              <select
                value={ledgerCategoryFilter}
                onChange={(e) => {
                  setLedgerCategoryFilter(e.target.value);
                  setLedgerPage(1);
                }}
                className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="signup_bonus">Signup Bonus</option>
                <option value="razorpay_topup">Razorpay Topup</option>
                <option value="legal_compliance_payment">Legal Compliance Payment</option>
                <option value="admin_credit">Admin Credit</option>
                <option value="admin_debit">Admin Debit</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-xs font-bold">Loading global transactions...</p>
            </div>
          ) : ledgerTxns.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Receipt size={36} className="mx-auto text-slate-400 mb-3 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No ledger records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10.5px]">
                    <th className="pb-3 pl-2">User</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Reference ID</th>
                    <th className="pb-3">Performed By</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 pr-2 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {ledgerTxns.map((tx) => {
                    const isCredit = tx.type === "credit";
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 pl-2">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{tx.user?.name || "Member"}</div>
                          <div className="text-[10.5px] text-slate-500">{tx.user?.email}</div>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isCredit ? "+" : "-"} {tx.type?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                            {tx.category?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-xs text-slate-800 dark:text-slate-200 text-xs truncate">
                          {tx.description}
                        </td>
                        <td className="py-3.5 font-mono text-[10.5px] text-slate-500">
                          {tx.reference_id || tx.razorpay_payment_id || "—"}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 text-xs">
                          {tx.performed_by?.name || "System"}
                        </td>
                        <td className="py-3.5 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className={`py-3.5 text-right font-extrabold text-xs ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {isCredit ? "+" : "-"}{tx.amount?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 pr-2 text-right font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {tx.balance_after?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {ledgerTotalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">Page {ledgerPage} of {ledgerTotalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={ledgerPage <= 1}
                  onClick={() => setLedgerPage(ledgerPage - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={ledgerPage >= ledgerTotalPages}
                  onClick={() => setLedgerPage(ledgerPage + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust Credits Modal */}
      {showAdjustModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Assign / Adjust Credits</h3>
                  <p className="text-xs text-slate-500">Admin Audit Action</p>
                </div>
              </div>
              <button
                onClick={() => !submittingAdjust && setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target User Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-5 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</div>
              <div className="text-slate-500">{selectedUser.email}</div>
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Current Balance:</span>
                <strong className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                  {selectedUser.wallet?.balance?.toLocaleString("en-IN") || 500} Credits
                </strong>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Adjustment Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("credit")}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustType === "credit"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <PlusCircle size={14} />
                    <span>Assign / Credit (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("debit")}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjustType === "debit"
                        ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-2xs"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <MinusCircle size={14} />
                    <span>Deduct / Debit (-)</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Credit Amount:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Enter credit amount (e.g. 500)"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Reason / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Audit Reason / Remark (Required):
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Granted for winning Demo Day cohort / Adjustment for compliance package"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submittingAdjust}
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  {submittingAdjust ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm Adjustment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

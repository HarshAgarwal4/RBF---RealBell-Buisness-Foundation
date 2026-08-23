import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios.jsx";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  X,
  RotateCcw,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sliders,
  Download,
  File,
  Loader2,
  ArrowUpDown,
  History,
  MessageSquare,
} from "lucide-react";

export default function AdminApprovals() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingForm: 0,
    pendingReview: 0,
    changesRequested: 0,
    approved: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orgTypeFilter, setOrgTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Application Review Modal
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Review Action Modals
  const [actionModal, setActionModal] = useState({
    open: false,
    type: null, // 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'
    reasonOrFeedback: "",
    comment: "",
    submitting: false,
  });

  const fetchStats = async () => {
    try {
      const res = await axios.get("/approvals/stats");
      if (res.data?.status === 1) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        status: statusFilter,
        organizationType: orgTypeFilter,
        search: searchTerm,
      };

      const res = await axios.get("/approvals/applications", { params });
      if (res.data?.status === 1) {
        setApplications(res.data.applications || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      toast.error("Failed to load approval applications.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, orgTypeFilter, searchTerm]);

  useEffect(() => {
    fetchStats();
    fetchApplications();
  }, [fetchApplications]);

  const openAppDetails = async (id) => {
    setSelectedAppId(id);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/approvals/applications/${id}`);
      if (res.data?.status === 1) {
        setAppDetail(res.data.application);
      } else {
        toast.error("Failed to load application details.");
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
      toast.error("Error loading application data.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedAppId(null);
    setAppDetail(null);
  };

  const handleReviewDecision = async () => {
    if (!selectedAppId || !actionModal.type) return;

    if (actionModal.type === "REJECT" && !actionModal.reasonOrFeedback.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    if (actionModal.type === "REQUEST_CHANGES" && !actionModal.reasonOrFeedback.trim()) {
      toast.error("Please describe what changes/updates are required.");
      return;
    }

    setActionModal((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = {
        action: actionModal.type,
        comment: actionModal.comment,
        feedback: actionModal.type === "REQUEST_CHANGES" ? actionModal.reasonOrFeedback : undefined,
        reason: actionModal.type === "REJECT" ? actionModal.reasonOrFeedback : undefined,
      };

      const res = await axios.post(`/approvals/applications/${selectedAppId}/review`, payload);

      if (res.data?.status === 1) {
        toast.success(res.data.msg || "Review decision processed successfully!");
        setActionModal({ open: false, type: null, reasonOrFeedback: "", comment: "", submitting: false });
        await fetchStats();
        await fetchApplications();
        // Refresh detail view
        openAppDetails(selectedAppId);
      } else {
        toast.error(res.data?.msg || "Failed to submit review decision.");
        setActionModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch (err) {
      console.error("Error processing review:", err);
      toast.error("Failed to submit review decision.");
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "Form Submitted":
      case "Under Review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Review
          </span>
        );
      case "Changes Requested":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Changes Requested
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <FileText className="w-3.5 h-3.5" /> Pending Form
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Ecosystem Approvals & Verification">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-amber-500" />
              Role-Based Onboarding Approvals
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Verify submitted organization credentials, evaluate identity documentation, and grant or restrict dashboard access.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin/approval-forms"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Approval Form Builder</span>
            </Link>
          </div>
        </div>

        {/* METRICS COUNTER CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Total Applicants</div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
          </div>

          <div
            onClick={() => setStatusFilter("Form Submitted")}
            className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1 cursor-pointer hover:border-indigo-500/60 transition"
          >
            <div className="text-xs text-indigo-300 font-semibold flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300">{stats.pendingReview}</div>
          </div>

          <div
            onClick={() => setStatusFilter("Changes Requested")}
            className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1 cursor-pointer hover:border-amber-500/60 transition"
          >
            <div className="text-xs text-amber-300 font-semibold flex items-center justify-between">
              <span>Changes Requested</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{stats.changesRequested}</div>
          </div>

          <div
            onClick={() => setStatusFilter("Approved")}
            className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 cursor-pointer hover:border-emerald-500/60 transition"
          >
            <div className="text-xs text-emerald-300 font-semibold flex items-center justify-between">
              <span>Approved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{stats.approved}</div>
          </div>

          <div
            onClick={() => setStatusFilter("Rejected")}
            className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-1 cursor-pointer hover:border-red-500/60 transition"
          >
            <div className="text-xs text-red-300 font-semibold flex items-center justify-between">
              <span>Rejected</span>
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-300">{stats.rejected}</div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="Form Submitted">Form Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending Form">Pending Form</option>
            </select>

            <select
              value={orgTypeFilter}
              onChange={(e) => {
                setOrgTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-amber-500"
            >
              <option value="all">All Organization Types</option>
              <option value="startup">Startup</option>
              <option value="investor">Investor</option>
              <option value="mentor">Mentor / CXO</option>
              <option value="incubator">Incubator</option>
              <option value="accelerator">Accelerator</option>
            </select>

            {(searchTerm || statusFilter !== "all" || orgTypeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setOrgTypeFilter("all");
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* APPLICATIONS DATA TABLE */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No applications match the current criteria.</p>
              <p className="text-xs text-slate-500">Try adjusting your search terms or status filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Application ID</th>
                    <th className="py-3.5 px-4">Applicant & Contact</th>
                    <th className="py-3.5 px-4">Track / Entity</th>
                    <th className="py-3.5 px-4">Submission Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-850/50 transition">
                      {/* Application ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {app.applicationId}
                      </td>

                      {/* Applicant & User Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{app.user?.name || "Anonymous User"}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{app.user?.email}</div>
                        {app.user?.phone && (
                          <div className="text-[10px] text-slate-500">{app.user.phone}</div>
                        )}
                      </td>

                      {/* Track / Entity */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{app.user?.company_name || "—"}</div>
                        <div className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 mt-0.5">
                          {app.organizationType?.toUpperCase()} {app.roleKey !== "default" ? `• ${app.roleKey}` : ""}
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openAppDetails(app._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          APPLICATION DETAILS DRAWER / MODAL
          ========================================================================= */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">Application Review</h2>
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {appDetail?.applicationId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Track: {appDetail?.organizationType?.toUpperCase()} | Role: {appDetail?.roleKey}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {appDetail && getStatusBadge(appDetail.status)}
                <button
                  onClick={closeDetails}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs font-semibold">Loading applicant verification file...</p>
                </div>
              ) : appDetail ? (
                <>
                  {/* 1. Applicant Profile Card */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Primary Contact</div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" />
                        <span>{appDetail.user?.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">{appDetail.user?.email}</div>
                      <div className="text-xs text-slate-400">{appDetail.user?.phone}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Organization</div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span>{appDetail.user?.company_name}</span>
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        Type: {appDetail.user?.company_type}
                      </div>
                      {appDetail.user?.investing_as && (
                        <div className="text-xs text-slate-400 capitalize">Entity: {appDetail.user.investing_as}</div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Timeline & Reviewer</div>
                      <div className="text-xs text-slate-300">
                        Registered: {new Date(appDetail.user?.createdAt || appDetail.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-300">
                        Submitted: {appDetail.submittedAt ? new Date(appDetail.submittedAt).toLocaleDateString() : "Draft"}
                      </div>
                      {appDetail.reviewedBy && (
                        <div className="text-xs text-emerald-400 font-medium">
                          Reviewer: {appDetail.reviewedBy.name || appDetail.reviewedBy.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback / Rejection Notes if present */}
                  {appDetail.adminFeedback && (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
                      <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Requested Changes History
                      </div>
                      <p className="text-xs text-amber-200 whitespace-pre-wrap">{appDetail.adminFeedback}</p>
                    </div>
                  )}

                  {appDetail.rejectionReason && (
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1">
                      <div className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> Rejection Notice
                      </div>
                      <p className="text-xs text-red-200 whitespace-pre-wrap">{appDetail.rejectionReason}</p>
                    </div>
                  )}

                  {/* 2. Form Responses Dynamic Viewer */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Verification Form Responses (Form Version {appDetail.formVersion || 1})
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {Array.isArray(appDetail.formSnapshot) && appDetail.formSnapshot.length > 0 ? (
                        appDetail.formSnapshot.map((field) => {
                          const val = appDetail.responses?.[field.key];
                          const isFullWidth = field.gridCols === 2 || field.type === "textarea" || field.type === "address";

                          return (
                            <div
                              key={field.id || field.key}
                              className={`p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 ${
                                isFullWidth ? "sm:col-span-2" : "sm:col-span-1"
                              }`}
                            >
                              <div className="text-[11px] font-semibold text-slate-400">
                                {field.label} {field.required && <span className="text-amber-500">*</span>}
                              </div>
                              <div className="text-xs font-medium text-white break-words">
                                {field.type === "terms" || field.type === "checkbox" ? (
                                  val ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> Confirmed / Accepted
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">Not accepted</span>
                                  )
                                ) : Array.isArray(val) ? (
                                  val.join(", ")
                                ) : val ? (
                                  String(val)
                                ) : (
                                  <span className="text-slate-600 italic">Not provided</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="sm:col-span-2 text-xs text-slate-500 italic p-4 bg-slate-950 rounded-xl">
                          No responses captured yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Uploaded Documents Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <File className="w-4 h-4 text-amber-500" />
                      Uploaded Documents & Credentials ({appDetail.documents?.length || 0})
                    </h3>

                    {Array.isArray(appDetail.documents) && appDetail.documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {appDetail.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <File className="w-4 h-4 text-amber-400 shrink-0" />
                              <div className="truncate">
                                <div className="text-xs font-semibold text-white truncate">{doc.fieldLabel || doc.fileName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {doc.fileName} ({Math.round((doc.fileSize || 0) / 1024)} KB)
                                </div>
                              </div>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl">
                        No documents attached.
                      </div>
                    )}
                  </div>

                  {/* 4. Audit Trail Timeline */}
                  {Array.isArray(appDetail.auditLog) && appDetail.auditLog.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Audit Trail & Decision History
                      </h3>
                      <div className="space-y-2">
                        {appDetail.auditLog.map((log, i) => (
                          <div key={i} className="text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-start justify-between gap-4">
                            <div>
                              <span className="font-bold text-amber-400">{log.action}</span>
                              {log.performedByName && (
                                <span className="text-slate-400 ml-2">by {log.performedByName}</span>
                              )}
                              {log.comment && <p className="text-slate-300 mt-0.5">{log.comment}</p>}
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Action Bar */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={closeDetails}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Close View
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      type: "REQUEST_CHANGES",
                      reasonOrFeedback: "",
                      comment: "",
                      submitting: false,
                    })
                  }
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      type: "REJECT",
                      reasonOrFeedback: "",
                      comment: "",
                      submitting: false,
                    })
                  }
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActionModal({
                      open: true,
                      type: "APPROVE",
                      reasonOrFeedback: "",
                      comment: "All credentials and incorporation documentation verified.",
                      submitting: false,
                    })
                  }
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REVIEW CONFIRMATION / REASON MODAL
          ========================================================================= */}
      {actionModal.open && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {actionModal.type === "APPROVE" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {actionModal.type === "REQUEST_CHANGES" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {actionModal.type === "REJECT" && <XCircle className="w-5 h-5 text-red-400" />}
                <span>
                  {actionModal.type === "APPROVE"
                    ? "Confirm Approval"
                    : actionModal.type === "REQUEST_CHANGES"
                    ? "Request Information Updates"
                    : "Reject Verification Application"}
                </span>
              </h3>
              <button
                onClick={() => setActionModal({ open: false, type: null, reasonOrFeedback: "", comment: "", submitting: false })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionModal.type === "APPROVE" && (
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to approve this applicant? This will immediately activate full dashboard permissions for their role and send an official welcome confirmation email.
              </p>
            )}

            {actionModal.type === "REQUEST_CHANGES" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Instructions for Applicant <span className="text-amber-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={actionModal.reasonOrFeedback}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, reasonOrFeedback: e.target.value }))}
                  placeholder="Specify which documents or field inputs need clarification or replacement..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500"
                />
              </div>
            )}

            {actionModal.type === "REJECT" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={actionModal.reasonOrFeedback}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, reasonOrFeedback: e.target.value }))}
                  placeholder="State the regulatory or compliance reason for rejecting this application..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-red-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Internal Admin Note (Optional)</label>
              <input
                type="text"
                value={actionModal.comment}
                onChange={(e) => setActionModal((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Recorded in internal audit log..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-slate-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: null, reasonOrFeedback: "", comment: "", submitting: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionModal.submitting}
                onClick={handleReviewDecision}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                  actionModal.type === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : actionModal.type === "REQUEST_CHANGES"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {actionModal.submitting ? "Processing..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

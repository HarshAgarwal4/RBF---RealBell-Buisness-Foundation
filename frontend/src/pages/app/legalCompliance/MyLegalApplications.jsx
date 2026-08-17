import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import axios from "../../../services/axios";
import { toast } from "react-toastify";
import { COLORS } from "../../../components/colors";
import {
  Scale,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  Eye,
  ExternalLink,
  ChevronRight,
  UploadCloud,
  FileArchive,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X,
  Loader2,
  FolderLock,
  Plus,
} from "lucide-react";

const STATUS_CONFIG = {
  Draft: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300" },
  Submitted: { label: "Submitted", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
  "Payment Pending": { label: "Payment Pending", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  "Payment Completed": { label: "Payment Completed", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800" },
  "Under Review": { label: "Under Review", bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  "Documents Required": { label: "Documents Required", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  "In Progress": { label: "In Progress", bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800" },
  Completed: { label: "Completed", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  Rejected: { label: "Rejected", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
  Cancelled: { label: "Cancelled", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-300" },
};

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MyLegalApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = useState(null);

  // Additional document upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const addFileInputRef = useRef(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/legal-compliance/applications/my");
      if (res.data?.status === 1) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load user applications:", err);
      toast.error("Failed to load your applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const stats = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter((a) =>
      ["Submitted", "Under Review", "In Progress", "Payment Completed"].includes(a.status)
    ).length;
    const completed = applications.filter((a) => a.status === "Completed").length;
    const docRequired = applications.filter((a) => a.status === "Documents Required").length;
    return { total, inProgress, completed, docRequired };
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchStatus = statusFilter === "All" || app.status === statusFilter;
      const matchSearch =
        !searchQuery.trim() ||
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.service_snapshot?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.service?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  const handleUploadAdditional = async (e) => {
    e.preventDefault();
    if (!selectedApp || additionalFiles.length === 0) {
      toast.error("Please select at least one document to upload");
      return;
    }

    setUploadingAdditional(true);
    try {
      const formData = new FormData();
      additionalFiles.forEach((file) => {
        formData.append("additional_docs", file);
      });

      const res = await axios.post(
        `/legal-compliance/applications/${selectedApp._id}/upload-additional`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.status === 1) {
        toast.success("Additional documents uploaded successfully!");
        setUploadModalOpen(false);
        setAdditionalFiles([]);
        setSelectedApp(res.data.application);
        fetchApplications();
      } else {
        toast.error(res.data?.msg || "Failed to upload documents");
      }
    } catch (err) {
      console.error("Failed to upload additional documents:", err);
      toast.error("Failed to upload documents");
    } finally {
      setUploadingAdditional(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#1E293B] dark:text-[#E2E8F0] font-sans">
      <Sidebar />

      <main className="flex-1 lg:pl-[300px] pt-16 lg:pt-0 min-h-screen flex flex-col w-full">
        {/* Top Header */}
        <div className="bg-white dark:bg-[#111827] border-b border-[#E2E8F0] dark:border-[#1F2937] px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B52B2B] mb-1.5">
                  <Scale size={16} /> Legal & Regulatory Dashboard
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  My Compliance Applications
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Track dynamic status updates, review remarks, timeline audit history, and download issued compliance certificates.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate("/legal-compliances")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#B52B2B] hover:bg-[#9B1B2A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus size={16} /> Avail New Service
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/legal-compliances/documents")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-bold text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] transition shadow-xs cursor-pointer"
                >
                  <FolderLock size={16} className="text-[#B52B2B]" /> Legal Documents
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1F2937]">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Total Applications
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white mt-1">
                  {stats.total}
                </div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#EFF6FF] dark:bg-[#172554]/30 border border-[#BFDBFE] dark:border-[#1E3A8A]">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  In Progress
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#1E40AF] dark:text-[#93C5FD] mt-1">
                  {stats.inProgress}
                </div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] dark:bg-[#052E16]/30 border border-[#BBF7D0] dark:border-[#14532D]">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#16A34A]">
                  Completed
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#15803D] dark:text-[#86EFAC] mt-1">
                  {stats.completed}
                </div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFF7ED] dark:bg-[#431407]/30 border border-[#FED7AA] dark:border-[#7C2D12]">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#EA580C]">
                  Docs Required
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#C2410C] dark:text-[#FDBA74] mt-1">
                  {stats.docRequired}
                </div>
              </div>
            </div>

            {/* Search & Status Filter Controls */}
            <div className="mt-6 sm:mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID (e.g. LC-109283) or service..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1F2937] bg-[#F8FAFC] dark:bg-[#0F172A] text-xs text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#B52B2B]/20"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full md:w-auto">
                {["All", "Submitted", "Under Review", "In Progress", "Documents Required", "Completed", "Payment Pending"].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        statusFilter === st
                          ? "bg-[#B52B2B] text-white"
                          : "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#B52B2B]"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] animate-pulse"
                />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-8">
              <FileArchive size={48} className="mx-auto text-[#94A3B8] mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                No Applications Found
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                You haven't submitted any compliance applications yet. Explore available services to get started.
              </p>
              <button
                onClick={() => navigate("/legal-compliances")}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B52B2B] text-white text-xs font-bold hover:bg-[#9B1B2A] transition"
              >
                Browse Services <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => {
                const statusMeta = STATUS_CONFIG[app.status] || STATUS_CONFIG.Submitted;
                const hasFinalDocs = app.final_documents && app.final_documents.length > 0;
                const isDocRequired = app.status === "Documents Required";

                return (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] hover:border-[#B52B2B]/40 hover:shadow-xs transition cursor-pointer gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#F6E9EB] dark:bg-[#B52B2B]/10 flex items-center justify-center text-[#B52B2B] shrink-0 group-hover:scale-105 transition">
                        <Scale size={22} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-extrabold text-[#B52B2B] tracking-wider">
                            {app.application_number}
                          </span>
                          <span className="text-xs text-[#94A3B8]">•</span>
                          <span className="text-xs text-[#64748B]">
                            {new Date(app.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {app.payment?.status === "paid" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PAID (₹{app.payment.amount})
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-[#0F172A] dark:text-white mt-1 group-hover:text-[#B52B2B] transition">
                          {app.service_snapshot?.title || app.service?.title || "Legal Service"}
                        </h3>

                        {app.admin_remarks && (
                          <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 italic line-clamp-1">
                            Remark: "{app.admin_remarks}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                      >
                        {statusMeta.label}
                      </span>

                      {isDocRequired && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            setUploadModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <UploadCloud size={14} /> Upload Required Docs
                        </button>
                      )}

                      {hasFinalDocs && (
                        <div className="flex items-center gap-1 text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-lg">
                          <CheckCircle2 size={14} /> Certificate Ready
                        </div>
                      )}

                      <ChevronRight size={18} className="text-[#94A3B8] group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Application Detail Modal / Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#E2E8F0] dark:border-[#1F2937] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-[#1F2937] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-[#B52B2B]">
                    {selectedApp.application_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.Submitted).bg
                    } ${(STATUS_CONFIG[selectedApp.status] || STATUS_CONFIG.Submitted).text}`}
                  >
                    {selectedApp.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mt-1">
                  {selectedApp.service_snapshot?.title || selectedApp.service?.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="h-8 w-8 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Issued Final Certificates Section */}
              {selectedApp.final_documents && selectedApp.final_documents.length > 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] dark:from-[#052E16]/40 dark:to-[#14532D]/40 border border-[#86EFAC] dark:border-[#15803D]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-[#16A34A]" />
                      <h4 className="text-sm font-bold text-[#14532D] dark:text-[#86EFAC]">
                        Issued Certificates & Final Documents
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-[#064E3B] text-[#16A34A]">
                      OFFICIAL ISSUANCE
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedApp.final_documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111827] border border-[#BBF7D0] dark:border-[#166534]"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText size={18} className="text-[#16A34A]" />
                          <div>
                            <div className="text-xs font-bold text-[#0F172A] dark:text-white">
                              {doc.title}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {doc.original_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition cursor-pointer"
                        >
                          <Download size={13} /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Remarks Notice */}
              {selectedApp.admin_remarks && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <AlertCircle size={14} /> Official Remarks from Admin
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {selectedApp.admin_remarks}
                  </p>
                </div>
              )}

              {/* Status Lifecycle Timeline */}
              <div>
                <h4 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-3">
                  Application Timeline & Audit History
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-[#334155]">
                  {(selectedApp.status_history || []).map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-[#B52B2B] ring-4 ring-white dark:ring-[#111827]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0F172A] dark:text-white">
                            {step.status}
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">
                            {new Date(step.updated_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {step.remark && (
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {step.remark}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted Form Responses */}
              {selectedApp.form_responses && selectedApp.form_responses.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-3">
                    Submitted Application Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1F2937]">
                    {selectedApp.form_responses.map((resp, i) => (
                      <div key={i} className="text-xs">
                        <div className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                          {resp.label}
                        </div>
                        <div className="text-[#0F172A] dark:text-white font-bold mt-0.5 break-words">
                          {Array.isArray(resp.value) ? resp.value.join(", ") : String(resp.value || "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Documents List */}
              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                      User Submitted Documents
                    </h4>
                    {selectedApp.status === "Documents Required" && (
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="text-xs font-bold text-[#B52B2B] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Add More Files
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedApp.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1F2937]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={16} className="text-[#64748B] shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                              {doc.document_name}
                            </div>
                            <div className="text-[10px] text-[#94A3B8] truncate">
                              {doc.original_name}
                            </div>
                          </div>
                        </div>

                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 w-7 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-white dark:hover:bg-[#1E293B] flex items-center justify-center transition"
                          title="View / Download"
                        >
                          <Eye size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#1F2937] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#0F172A]">
              <div className="text-xs text-[#64748B]">
                Submitted on {new Date(selectedApp.createdAt).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-3">
                {selectedApp.status === "Documents Required" && (
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition"
                  >
                    Upload Requested Documents
                  </button>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-bold text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Document Upload Sub-Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-[#E2E8F0] dark:border-[#1F2937] w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                Upload Additional Documents
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="h-8 w-8 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center text-[#64748B]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
              Select one or multiple requested documents to upload for review.
            </p>

            <form onSubmit={handleUploadAdditional} className="space-y-4">
              <input
                type="file"
                multiple
                ref={addFileInputRef}
                onChange={(e) => {
                  if (e.target.files) {
                    setAdditionalFiles(Array.from(e.target.files));
                  }
                }}
                accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => addFileInputRef.current?.click()}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-[#CBD5E1] dark:border-[#334155] hover:border-[#B52B2B] flex flex-col items-center justify-center gap-2 bg-[#F8FAFC] dark:bg-[#0F172A] transition cursor-pointer"
              >
                <UploadCloud size={28} className="text-[#B52B2B]" />
                <span className="text-xs font-bold text-[#334155] dark:text-white">
                  Click to select files
                </span>
                <span className="text-[10px] text-[#94A3B8]">
                  PDF, JPG, PNG, DOCX up to 15MB
                </span>
              </button>

              {additionalFiles.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {additionalFiles.map((f, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-between"
                    >
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] text-[#64748B]">{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingAdditional || additionalFiles.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#B52B2B] hover:bg-[#9B1B2A] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {uploadingAdditional ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload Documents"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

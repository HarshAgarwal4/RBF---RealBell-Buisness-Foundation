import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import axios from "../../../services/axios";
import { COLORS } from "../../../components/colors";
import {
  Scale,
  FolderLock,
  Search,
  Download,
  Eye,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function LegalComplianceDocuments() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        const res = await axios.get("/legal-compliance/documents/my");
        if (res.data?.status === 1) {
          setApplications(res.data.applications || []);
        }
      } catch (err) {
        console.error("Failed to load compliance documents:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const totalCertificates = useMemo(() => {
    let count = 0;
    applications.forEach((a) => {
      count += a.final_documents?.length || 0;
    });
    return count;
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !searchQuery.trim() ||
        a.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.service_snapshot?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [applications, searchQuery]);

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
                  <FolderLock size={16} /> Digital Compliance Locker
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  Legal Compliance Documents
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Access and download all issued certificates, licenses, official filings, and submitted proofs across all your compliance services.
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
                  onClick={() => navigate("/legal-compliances/my-applications")}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-bold text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] transition shadow-xs cursor-pointer"
                >
                  <Layers size={16} className="text-[#B52B2B]" /> My Applications
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6 sm:mt-8 relative max-w-md w-full">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by service or ID..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1F2937] bg-[#F8FAFC] dark:bg-[#0F172A] text-xs text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#B52B2B]/20"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] animate-pulse"
                />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-[#1F2937] p-8">
              <FolderLock size={48} className="mx-auto text-[#94A3B8] mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                No Compliance Documents Yet
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                Once your legal compliance applications are processed, issued certificates and registration papers will appear in this digital locker.
              </p>
              <button
                onClick={() => navigate("/legal-compliances")}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B52B2B] text-white text-xs font-bold hover:bg-[#9B1B2A] transition"
              >
                Explore Services <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredApps.map((app) => {
                const finalDocs = app.final_documents || [];
                const userDocs = app.documents || [];

                return (
                  <div
                    key={app._id}
                    className="rounded-3xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] p-6 lg:p-8 shadow-xs"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#F1F5F9] dark:border-[#1F2937]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#F6E9EB] dark:bg-[#B52B2B]/10 flex items-center justify-center text-[#B52B2B] shrink-0">
                          <Scale size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#B52B2B]">
                              {app.application_number}
                            </span>
                            <span className="text-xs text-[#94A3B8]">•</span>
                            <span className="text-xs font-semibold text-[#64748B]">
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5">
                            {app.service_snapshot?.title || "Legal Compliance"}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            app.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          Status: {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Admin Remark Note if exists */}
                    {app.admin_remarks && (
                      <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1F2937] text-xs text-[#475569] dark:text-[#94A3B8]">
                        <span className="font-bold text-[#0F172A] dark:text-white">Admin Note:</span>{" "}
                        {app.admin_remarks}
                      </div>
                    )}

                    {/* Section 1: Final Certificates */}
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={16} className="text-[#16A34A]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#15803D] dark:text-[#86EFAC]">
                          Official Issued Certificates ({finalDocs.length})
                        </h4>
                      </div>

                      {finalDocs.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1F2937] text-xs text-[#64748B] italic">
                          Official certificates will be uploaded here as soon as the filing is approved by the regulatory authority.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {finalDocs.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-white dark:from-[#052E16]/30 dark:to-[#111827] border border-[#BBF7D0] dark:border-[#166534]"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-9 w-9 rounded-lg bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                                    {doc.title}
                                  </div>
                                  <div className="text-[10px] text-[#64748B] truncate">
                                    {doc.original_name} • Issued {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                              >
                                <Download size={13} /> Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: User Submitted Documents */}
                    {userDocs.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-[#F1F5F9] dark:border-[#1F2937]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-3">
                          Submitted Application Proofs ({userDocs.length})
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {userDocs.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1F2937]"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={15} className="text-[#94A3B8] shrink-0" />
                                <div className="truncate">
                                  <div className="text-xs font-semibold text-[#0F172A] dark:text-white truncate">
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
                                title="View Document"
                              >
                                <Eye size={13} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

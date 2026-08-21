import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";

const ISSUE_TYPES = [
  "Technical Issue",
  "Account Issue",
  "Payment Issue",
  "Bug Report",
  "Feature Request",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUS_META = {
  Open: {
    label: "Open",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  Resolved: {
    label: "Resolved",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  Closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },
};

const PRIORITY_META = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-[#F6E9EB] text-[#8B1D2C]",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700",
};

const emptyForm = () => ({
  issue_type: "",
  title: "",
  description: "",
  attachmentsEnabled: false,
});

function formatDate(value) {
  if (!value) return "Just now";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(size) {
  if (!size) return "0 KB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/tickets");
      setTickets(res.data?.tickets || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const ticketCountText = useMemo(() => {
    const count = tickets.length;
    return count === 1 ? "1 ticket" : `${count} tickets`;
  }, [tickets.length]);

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm());
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.issue_type || !form.title.trim() || !form.description.trim()) {
      toast.error("Please fill in issue type, title, and description");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("issue_type", form.issue_type);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());

      files.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await axios.post("/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("Ticket raised successfully");
        setTickets((prev) => [res.data.ticket, ...prev]);
        closeModal();
      }
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast.error(error.response?.data?.message || "Failed to raise ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Delete this ticket?")) return;

    try {
      const res = await axios.delete(`/tickets/${ticketId}`);
      if (res.data?.success) {
        toast.success("Ticket deleted successfully");
        setTickets((prev) => prev.filter((ticket) => ticket._id !== ticketId));
      }
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-8 min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans antialiased text-gray-800 max-w-[1400px]">
        <header className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200/80">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Support Tickets</h1>
            <p className="text-xs text-gray-500 mt-1">{ticketCountText}</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-[#1C2340] hover:bg-[#151A31] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise a Ticket</span>
          </button>
        </header>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs min-h-[460px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B1D2C] mr-3"></div>
              <span>Loading tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
              <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 mb-4 bg-gray-50">
                <AlertCircle className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">No Support Tickets Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mb-5">
                Raise a ticket if you need assistance with your ecosystem account, cohorts, legal resources, or technical support.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#8B1D2C] hover:bg-[#721724] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                + Raise a Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Submitted Tickets ({tickets.length})</h2>
                <span className="text-xs text-gray-500">Your requests</span>
              </div>

              <div className="grid gap-4">
                {tickets.map((ticket) => {
                  const status = STATUS_META[ticket.status] || STATUS_META.Open;

                  return (
                    <div
                      key={ticket._id}
                      className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:shadow-xs transition-all flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <h3 className="text-base font-bold text-gray-900">{ticket.title}</h3>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-[#8B1D2C]">
                              {ticket.issue_type}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${status.className}`}>
                              {status.label}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                            {ticket.description}
                          </p>

                          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px] text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock3 className="w-3.5 h-3.5 text-gray-400" />
                              <span>{formatDate(ticket.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                              <span>{ticket.ticket_number || ticket._id}</span>
                            </div>
                            {ticket.attachments?.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                                <span>{ticket.attachments.length} attachment(s)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTicket(ticket._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {ticket.attachments?.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {ticket.attachments.map((attachment, idx) => (
                            <a
                              key={`${ticket._id}-${idx}`}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-[#8B1D2C] shrink-0" />
                                <span className="font-medium text-gray-800 truncate">{attachment.original_name || "Attachment"}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 shrink-0">
                                {formatFileSize(attachment.size_in_bytes)}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>Copyright © 2026 ecosystem firstwingsconnect.com. All rights reserved.</p>
          <p>
            Powered by <span className="font-semibold text-[#8B1D2C]">SanchaarJS</span>
          </p>
        </footer>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 overflow-hidden transition-all">
            {/* Compact Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Create Ticket</h3>
                <p className="text-xs text-gray-500">Fill details below to send us a request</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.issue_type}
                    onChange={(event) => setForm((prev) => ({ ...prev, issue_type: event.target.value }))}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                    required
                  >
                    <option value="">Select type</option>
                    {ISSUE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Brief summary of the issue"
                  className="w-full h-9 rounded-lg border border-gray-300 px-3 text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Explain your issue in detail here..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none resize-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                  required
                />
              </div>

              {/* Attachments Toggle & Dropzone */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Add Attachments</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, attachmentsEnabled: !prev.attachmentsEnabled }));
                      if (form.attachmentsEnabled) {
                        setFiles([]);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      form.attachmentsEnabled ? "bg-[#8B1D2C]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        form.attachmentsEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {form.attachmentsEnabled && (
                  <div className="space-y-2 mt-2">
                    <div className="border border-dashed border-gray-300 hover:border-[#8B1D2C]/60 rounded-xl p-4 text-center bg-gray-50/60 transition-all relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <p className="text-xs font-medium text-gray-700">
                          Click or drag files here to upload
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Supports images and common documents
                        </p>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-[#8B1D2C] shrink-0" />
                              <span className="font-medium text-gray-700 truncate text-[11px]">{file.name}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="text-gray-400 hover:text-red-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#8B1D2C] hover:bg-[#721724] text-white font-medium text-xs transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
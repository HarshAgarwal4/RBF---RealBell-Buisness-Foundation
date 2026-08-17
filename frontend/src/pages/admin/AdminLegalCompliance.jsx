import React, { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Download,
  UploadCloud,
  FileText,
  ShieldCheck,
  CreditCard,
  X,
  Layers,
  ChevronDown,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Building2,
  GripVertical,
  Check,
  RefreshCw,
} from "lucide-react";

const STATUS_OPTS = [
  "Draft",
  "Submitted",
  "Payment Pending",
  "Payment Completed",
  "Under Review",
  "Documents Required",
  "In Progress",
  "Completed",
  "Rejected",
  "Cancelled",
];

const STATUS_COLORS = {
  Draft: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", border: "rgba(100,116,139,0.3)" },
  Submitted: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "Payment Pending": { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "Payment Completed": { bg: "rgba(99,102,241,0.15)", color: "#818cf8", border: "rgba(99,102,241,0.3)" },
  "Under Review": { bg: "rgba(168,85,247,0.15)", color: "#c084fc", border: "rgba(168,85,247,0.3)" },
  "Documents Required": { bg: "rgba(249,115,22,0.15)", color: "#fb923c", border: "rgba(249,115,22,0.3)" },
  "In Progress": { bg: "rgba(6,182,212,0.15)", color: "#22d3ee", border: "rgba(6,182,212,0.3)" },
  Completed: { bg: "rgba(34,197,94,0.15)", color: "#4ade80", border: "rgba(34,197,94,0.3)" },
  Rejected: { bg: "rgba(239,68,68,0.15)", color: "#f87171", border: "rgba(239,68,68,0.3)" },
  Cancelled: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

const FIELD_TYPES = ["text", "number", "email", "phone", "date", "textarea", "select", "radio", "checkbox"];

function uid() {
  return "id_" + Math.random().toString(36).slice(2, 9);
}

function emptyService() {
  return {
    title: "",
    category: "General",
    short_description: "",
    description: "",
    fee: 0,
    currency: "INR",
    is_payment_required: false,
    processing_time: "3-5 Business Days",
    icon: "Scale",
    status: "active",
    form_fields: [
      {
        id: uid(),
        name: "applicant_name",
        label: "Applicant Full Name",
        type: "text",
        required: true,
        placeholder: "Enter full name",
        options: [],
        order: 1,
      },
    ],
    required_documents: [
      {
        id: uid(),
        name: "Identity Proof",
        description: "Aadhaar / Passport / Voter ID",
        required: true,
        allowed_types: ["application/pdf", "image/jpeg", "image/png"],
        max_size_mb: 5,
        order: 1,
      },
    ],
  };
}

export default function AdminLegalCompliance() {
  const [activeTab, setActiveTab] = useState("services"); // "services" or "applications"

  // Services State
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService());
  const [savingService, setSavingService] = useState(false);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("All");
  const [appServiceFilter, setAppServiceFilter] = useState("All");

  // Selected Application for Detail/Review Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusRemark, setStatusRemark] = useState("");

  // Final Certificate Upload State
  const [certTitle, setCertTitle] = useState("Official Compliance Certificate");
  const [certRemark, setCertRemark] = useState("");
  const [certFiles, setCertFiles] = useState([]);
  const [markCompleteChecked, setMarkCompleteChecked] = useState(true);
  const [uploadingCert, setUploadingCert] = useState(false);
  const certFileInputRef = useRef(null);

  // Fetch Services
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const res = await axios.get("/legal-compliance/admin/services");
      if (res.data?.status === 1) {
        setServices(res.data.services || []);
      }
    } catch (err) {
      console.error("Failed to load admin services:", err);
      toast.error("Failed to load services");
    } finally {
      setServicesLoading(false);
    }
  };

  // Fetch Applications
  const fetchApplications = async () => {
    try {
      setAppsLoading(true);
      const res = await axios.get("/legal-compliance/admin/applications");
      if (res.data?.status === 1) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load admin applications:", err);
      toast.error("Failed to load applications");
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchApplications();
  }, []);

  // Open Create Service Modal
  const handleOpenCreateService = () => {
    setEditingServiceId(null);
    setServiceForm(emptyService());
    setServiceModalOpen(true);
  };

  // Open Edit Service Modal
  const handleOpenEditService = (service) => {
    setEditingServiceId(service._id);
    setServiceForm({
      title: service.title || "",
      category: service.category || "General",
      short_description: service.short_description || "",
      description: service.description || "",
      fee: service.fee || 0,
      currency: service.currency || "INR",
      is_payment_required: !!service.is_payment_required,
      processing_time: service.processing_time || "3-5 Business Days",
      icon: service.icon || "Scale",
      status: service.status || "active",
      form_fields: service.form_fields?.length > 0 ? service.form_fields : [],
      required_documents: service.required_documents?.length > 0 ? service.required_documents : [],
    });
    setServiceModalOpen(true);
  };

  // Save Service
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) {
      toast.error("Service Title is required");
      return;
    }

    setSavingService(true);
    try {
      if (editingServiceId) {
        const res = await axios.put(`/legal-compliance/admin/services/${editingServiceId}`, serviceForm);
        if (res.data?.status === 1) {
          toast.success("Service updated successfully");
          setServiceModalOpen(false);
          fetchServices();
        } else {
          toast.error(res.data?.msg || "Failed to update service");
        }
      } else {
        const res = await axios.post("/legal-compliance/admin/services", serviceForm);
        if (res.data?.status === 1) {
          toast.success("Service created successfully");
          setServiceModalOpen(false);
          fetchServices();
        } else {
          toast.error(res.data?.msg || "Failed to create service");
        }
      }
    } catch (err) {
      console.error("Save service error:", err);
      toast.error("Failed to save service");
    } finally {
      setSavingService(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this compliance service?")) return;
    try {
      const res = await axios.delete(`/legal-compliance/admin/services/${serviceId}`);
      if (res.data?.status === 1) {
        toast.success("Service deleted successfully");
        fetchServices();
      } else {
        toast.error(res.data?.msg || "Failed to delete service");
      }
    } catch (err) {
      console.error("Delete service error:", err);
      toast.error("Failed to delete service");
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (service) => {
    const nextStatus = service.status === "active" ? "inactive" : "active";
    try {
      const res = await axios.put(`/legal-compliance/admin/services/${service._id}`, {
        status: nextStatus,
      });
      if (res.data?.status === 1) {
        toast.success(`Service status changed to ${nextStatus}`);
        fetchServices();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Form Field Helpers
  const addFormField = () => {
    setServiceForm((prev) => ({
      ...prev,
      form_fields: [
        ...prev.form_fields,
        {
          id: uid(),
          name: `field_${prev.form_fields.length + 1}`,
          label: `New Field ${prev.form_fields.length + 1}`,
          type: "text",
          required: false,
          placeholder: "",
          options: [],
          order: prev.form_fields.length + 1,
        },
      ],
    }));
  };

  const updateFormField = (index, updates) => {
    setServiceForm((prev) => {
      const fields = [...prev.form_fields];
      fields[index] = { ...fields[index], ...updates };
      return { ...prev, form_fields: fields };
    });
  };

  const removeFormField = (index) => {
    setServiceForm((prev) => ({
      ...prev,
      form_fields: prev.form_fields.filter((_, i) => i !== index),
    }));
  };

  // Required Document Helpers
  const addRequiredDoc = () => {
    setServiceForm((prev) => ({
      ...prev,
      required_documents: [
        ...prev.required_documents,
        {
          id: uid(),
          name: `Document ${prev.required_documents.length + 1}`,
          description: "Upload scanned copy",
          required: true,
          allowed_types: ["application/pdf", "image/jpeg", "image/png"],
          max_size_mb: 10,
          order: prev.required_documents.length + 1,
        },
      ],
    }));
  };

  const updateRequiredDoc = (index, updates) => {
    setServiceForm((prev) => {
      const docs = [...prev.required_documents];
      docs[index] = { ...docs[index], ...updates };
      return { ...prev, required_documents: docs };
    });
  };

  const removeRequiredDoc = (index) => {
    setServiceForm((prev) => ({
      ...prev,
      required_documents: prev.required_documents.filter((_, i) => i !== index),
    }));
  };

  // Open Application Detail Modal
  const handleOpenAppDetail = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setStatusRemark(app.admin_remarks || "");
    setCertTitle(`${app.service_snapshot?.title || "Legal"} Certificate`);
    setCertRemark("");
    setCertFiles([]);
    setMarkCompleteChecked(true);
  };

  // Update Application Status & Remark
  const handleUpdateAppStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdatingStatus(true);
    try {
      const res = await axios.put(`/legal-compliance/admin/applications/${selectedApp._id}/status`, {
        status: newStatus,
        remark: statusRemark,
      });

      if (res.data?.status === 1) {
        toast.success(`Application status updated to ${newStatus}`);
        setSelectedApp(res.data.application);
        fetchApplications();
      } else {
        toast.error(res.data?.msg || "Failed to update status");
      }
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Upload Final Certificate / Issued Document
  const handleUploadCertificates = async (e) => {
    e.preventDefault();
    if (!selectedApp || certFiles.length === 0) {
      toast.error("Please choose at least one certificate file to upload");
      return;
    }

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append("title", certTitle || "Compliance Certificate");
      formData.append("remarks", certRemark || "");
      formData.append("markCompleted", String(markCompleteChecked));

      certFiles.forEach((f) => {
        formData.append("final_documents", f);
      });

      const res = await axios.post(
        `/legal-compliance/admin/applications/${selectedApp._id}/final-documents`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.status === 1) {
        toast.success("🎉 Final compliance document uploaded & issued successfully!");
        setSelectedApp(res.data.application);
        setCertFiles([]);
        setCertRemark("");
        fetchApplications();
      } else {
        toast.error(res.data?.msg || "Failed to upload final documents");
      }
    } catch (err) {
      console.error("Upload final documents error:", err);
      toast.error("Failed to upload final documents");
    } finally {
      setUploadingCert(false);
    }
  };

  // Filtered Applications for Table
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchStatus = appStatusFilter === "All" || app.status === appStatusFilter;
      const matchService = appServiceFilter === "All" || app.service?._id === appServiceFilter;
      const matchSearch =
        !appSearch.trim() ||
        app.application_number?.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.applicant?.name?.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.applicant?.email?.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.applicant?.company_name?.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.service_snapshot?.title?.toLowerCase().includes(appSearch.toLowerCase());
      return matchStatus && matchService && matchSearch;
    });
  }, [applications, appStatusFilter, appServiceFilter, appSearch]);

  return (
    <AdminLayout title="Legal Compliance Management">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--admin-card-bg,rgba(255,255,255,0.03))] border border-[var(--admin-border-subtle,rgba(255,255,255,0.08))]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#818cf8] uppercase tracking-wider mb-1">
              <Scale size={16} /> Legal & Regulatory Module
            </div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-[var(--admin-text-primary,#f1f5f9)]">
              Legal Compliance Console
            </h1>
            <p className="text-xs text-[var(--admin-text-subtle,#94a3b8)] mt-1">
              Configure dynamic legal services, customize required application fields & documents, review submitted filings, and issue final compliance certificates.
            </p>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--admin-input-bg,rgba(255,255,255,0.05))] border border-[var(--admin-border-subtle,rgba(255,255,255,0.08))] self-start md:self-center">
            <button
              onClick={() => setActiveTab("services")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "services"
                  ? "bg-[#6366f1] text-white shadow-xs"
                  : "text-[var(--admin-text-muted,#94a3b8)] hover:text-white"
              }`}
            >
              Services Management ({services.length})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "applications"
                  ? "bg-[#6366f1] text-white shadow-xs"
                  : "text-[var(--admin-text-muted,#94a3b8)] hover:text-white"
              }`}
            >
              Applications Management ({applications.length})
            </button>
          </div>
        </div>

        {/* TAB 1: SERVICES MANAGEMENT */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--admin-text-primary,#f1f5f9)]">
                  Configured Compliance Services
                </h2>
                <p className="text-xs text-[var(--admin-text-subtle,#94a3b8)]">
                  Services with dynamic forms and document requirements.
                </p>
              </div>

              <button
                onClick={handleOpenCreateService}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus size={16} /> Create New Service
              </button>
            </div>

            {/* Services Table */}
            <div className="rounded-2xl bg-[var(--admin-card-bg,rgba(255,255,255,0.03))] border border-[var(--admin-border-subtle,rgba(255,255,255,0.08))] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--admin-input-bg,rgba(255,255,255,0.04))] text-[var(--admin-text-subtle,#94a3b8)] font-bold uppercase tracking-wider border-b border-[var(--admin-border-subtle,rgba(255,255,255,0.08))]">
                    <tr>
                      <th className="py-3.5 px-4">Service Details</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Fee / Pricing</th>
                      <th className="py-3.5 px-4">Form Fields</th>
                      <th className="py-3.5 px-4">Req. Docs</th>
                      <th className="py-3.5 px-4">Applications</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border-subtle,rgba(255,255,255,0.06))]">
                    {servicesLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-[var(--admin-text-muted,#94a3b8)]">
                          <Loader2 className="animate-spin mx-auto mb-2 text-[#6366f1]" size={24} />
                          Loading services...
                        </td>
                      </tr>
                    ) : services.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-[var(--admin-text-muted,#94a3b8)]">
                          No services created yet. Click "Create New Service" above.
                        </td>
                      </tr>
                    ) : (
                      services.map((s) => (
                        <tr
                          key={s._id}
                          className="hover:bg-[var(--admin-input-bg,rgba(255,255,255,0.02))] transition"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[var(--admin-text-primary,#f1f5f9)]">
                              {s.title}
                            </div>
                            <div className="text-[11px] text-[var(--admin-text-subtle,#94a3b8)] line-clamp-1 max-w-xs">
                              {s.short_description || s.description}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-[rgba(99,102,241,0.1)] text-[#a5b4fc] font-semibold text-[11px]">
                              {s.category || "General"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-[var(--admin-text-primary,#f1f5f9)]">
                              {s.fee > 0 ? `₹${Number(s.fee).toLocaleString("en-IN")}` : <span className="text-emerald-400">FREE</span>}
                            </div>
                            <div className="text-[10px] text-[var(--admin-text-subtle,#94a3b8)]">
                              {s.is_payment_required ? "Payment Mandatory" : "Free Submission"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[var(--admin-text-primary,#f1f5f9)]">
                            {s.form_fields?.length || 0} fields
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[var(--admin-text-primary,#f1f5f9)]">
                            {s.required_documents?.length || 0} docs
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#818cf8]">
                            {s.applicationCount || 0} submitted
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(s)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                s.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {s.status === "active" ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditService(s)}
                                className="h-7 w-7 rounded-lg bg-[var(--admin-input-bg,rgba(255,255,255,0.06))] hover:bg-[#6366f1]/20 text-[#a5b4fc] flex items-center justify-center transition cursor-pointer"
                                title="Edit Service"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteService(s._id)}
                                className="h-7 w-7 rounded-lg bg-[var(--admin-input-bg,rgba(255,255,255,0.06))] hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition cursor-pointer"
                                title="Delete Service"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPLICATIONS MANAGEMENT */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--admin-card-bg,rgba(255,255,255,0.03))] border border-[var(--admin-border-subtle,rgba(255,255,255,0.08))]">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search by App ID, user name, email, company..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--admin-border-subtle,rgba(255,255,255,0.1))] bg-[var(--admin-input-bg,rgba(255,255,255,0.05))] text-xs text-[var(--admin-text-primary,#f1f5f9)] placeholder-[#94a3b8] focus:outline-none focus:border-[#6366f1]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[var(--admin-border-subtle,rgba(255,255,255,0.1))] bg-[var(--admin-input-bg,rgba(255,255,255,0.05))] text-xs text-[var(--admin-text-primary,#f1f5f9)] focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  {STATUS_OPTS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                {/* Service Filter */}
                <select
                  value={appServiceFilter}
                  onChange={(e) => setAppServiceFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[var(--admin-border-subtle,rgba(255,255,255,0.1))] bg-[var(--admin-input-bg,rgba(255,255,255,0.05))] text-xs text-[var(--admin-text-primary,#f1f5f9)] focus:outline-none"
                >
                  <option value="All">All Services</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={fetchApplications}
                  className="h-8 w-8 rounded-xl bg-[var(--admin-input-bg,rgba(255,255,255,0.05))] border border-[var(--admin-border-subtle,rgba(255,255,255,0.1))] flex items-center justify-center text-[#94a3b8] hover:text-white"
                  title="Refresh List"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-2xl bg-[var(--admin-card-bg,rgba(255,255,255,0.03))] border border-[var(--admin-border-subtle,rgba(255,255,255,0.08))] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--admin-input-bg,rgba(255,255,255,0.04))] text-[var(--admin-text-subtle,#94a3b8)] font-bold uppercase tracking-wider border-b border-[var(--admin-border-subtle,rgba(255,255,255,0.08))]">
                    <tr>
                      <th className="py-3.5 px-4">Application ID</th>
                      <th className="py-3.5 px-4">Applicant & Entity</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Submission Date</th>
                      <th className="py-3.5 px-4">Payment Status</th>
                      <th className="py-3.5 px-4">Current Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border-subtle,rgba(255,255,255,0.06))]">
                    {appsLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-[var(--admin-text-muted,#94a3b8)]">
                          <Loader2 className="animate-spin mx-auto mb-2 text-[#6366f1]" size={24} />
                          Loading applications...
                        </td>
                      </tr>
                    ) : filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[var(--admin-text-muted,#94a3b8)]">
                          No applications match the current criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => {
                        const statusStyle = STATUS_COLORS[app.status] || STATUS_COLORS.Submitted;
                        const hasCerts = app.final_documents?.length > 0;

                        return (
                          <tr
                            key={app._id}
                            className="hover:bg-[var(--admin-input-bg,rgba(255,255,255,0.02))] transition"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-[#818cf8]">
                                {app.application_number}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[var(--admin-text-primary,#f1f5f9)]">
                                {app.applicant?.name || "Applicant"}
                              </div>
                              <div className="text-[11px] text-[var(--admin-text-subtle,#94a3b8)]">
                                {app.applicant?.company_name} • {app.applicant?.email}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[var(--admin-text-primary,#f1f5f9)]">
                              {app.service_snapshot?.title || app.service?.title}
                            </td>
                            <td className="py-3.5 px-4 text-[var(--admin-text-subtle,#94a3b8)]">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  app.payment?.status === "paid"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : app.payment?.status === "pending"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-slate-500/20 text-slate-400"
                                }`}
                              >
                                {app.payment?.status === "paid"
                                  ? `PAID (₹${app.payment?.amount})`
                                  : app.payment?.status === "pending"
                                  ? "PENDING"
                                  : "FREE"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                style={{
                                  background: statusStyle.bg,
                                  color: statusStyle.color,
                                  border: `1px solid ${statusStyle.border}`,
                                }}
                                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                {app.status}
                                {hasCerts && <CheckCircle2 size={12} className="text-emerald-400" />}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleOpenAppDetail(app)}
                                className="px-3 py-1.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Eye size={13} /> Manage & Review
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE / EDIT SERVICE */}
        {serviceModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#11131a] rounded-3xl border border-[rgba(255,255,255,0.1)] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#e2e8f0]">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingServiceId ? "Edit Compliance Service" : "Create New Compliance Service"}
                  </h3>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    Configure service metadata, dynamic form fields, and required document uploads.
                  </p>
                </div>
                <button
                  onClick={() => setServiceModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-[rgba(255,255,255,0.06)] text-[#94a3b8] hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Scrollable Form */}
              <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Basic Metadata */}
                <div className="p-5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8]">
                    1. Basic Service Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1]">Service Title *</label>
                      <input
                        type="text"
                        value={serviceForm.title}
                        onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                        placeholder="e.g. Trademark Registration"
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none focus:border-[#6366f1]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1]">Category</label>
                      <input
                        type="text"
                        value={serviceForm.category}
                        onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                        placeholder="e.g. Intellectual Property, Tax & GST, Corporate"
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-[#cbd5e1]">Short Description</label>
                      <input
                        type="text"
                        value={serviceForm.short_description}
                        onChange={(e) => setServiceForm({ ...serviceForm, short_description: e.target.value })}
                        placeholder="Brief summary displayed on service discovery card"
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-[#cbd5e1]">Detailed Description</label>
                      <textarea
                        rows={2}
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                        placeholder="Full explanation of legal requirements, coverage, and guidelines"
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1]">Processing Time</label>
                      <input
                        type="text"
                        value={serviceForm.processing_time}
                        onChange={(e) => setServiceForm({ ...serviceForm, processing_time: e.target.value })}
                        placeholder="e.g. 3-5 Business Days"
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1]">Status</label>
                      <select
                        value={serviceForm.status}
                        onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none"
                      >
                        <option value="active">Active (Visible to Users)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Pricing & Payment */}
                <div className="p-5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8]">
                    2. Service Fee & Payment Configuration
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1]">Service Fee (INR)</label>
                      <input
                        type="number"
                        min="0"
                        value={serviceForm.fee}
                        onChange={(e) => setServiceForm({ ...serviceForm, fee: Number(e.target.value) })}
                        className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none focus:border-[#6366f1]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#cbd5e1] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={serviceForm.is_payment_required}
                          onChange={(e) => setServiceForm({ ...serviceForm, is_payment_required: e.target.checked })}
                          className="accent-[#6366f1] h-4 w-4 rounded"
                        />
                        <span>Require Razorpay Payment before submission</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Dynamic Form Fields Builder */}
                <div className="p-5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8]">
                        3. Application Form Fields ({serviceForm.form_fields.length})
                      </h4>
                      <p className="text-[11px] text-[#94a3b8]">
                        Fields the user must fill out when applying for this service.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addFormField}
                      className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#a5b4fc] text-xs font-bold hover:bg-[#6366f1] hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Field
                    </button>
                  </div>

                  <div className="space-y-3">
                    {serviceForm.form_fields.map((field, idx) => (
                      <div
                        key={field.id || idx}
                        className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateFormField(idx, { label: e.target.value })}
                              placeholder="Field Label (e.g. Business Name)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <select
                              value={field.type}
                              onChange={(e) => updateFormField(idx, { type: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-xs text-white focus:outline-none"
                            >
                              {FIELD_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-1 text-[11px] text-[#cbd5e1] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateFormField(idx, { required: e.target.checked })}
                                className="accent-[#6366f1]"
                              />
                              <span>Required</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => removeFormField(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Delete Field"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Options input for select/radio/checkbox */}
                        {["select", "radio", "checkbox"].includes(field.type) && (
                          <div>
                            <input
                              type="text"
                              value={Array.isArray(field.options) ? field.options.join(", ") : ""}
                              onChange={(e) =>
                                updateFormField(idx, {
                                  options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                })
                              }
                              placeholder="Comma-separated options (e.g. Proprietorship, Partnership, Pvt Ltd)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[11px] text-white focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Dynamic Required Documents Builder */}
                <div className="p-5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8]">
                        4. Required Documents & Proofs ({serviceForm.required_documents.length})
                      </h4>
                      <p className="text-[11px] text-[#94a3b8]">
                        List of files the user must upload (e.g. PAN Card, Address Proof).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addRequiredDoc}
                      className="px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.15)] text-[#a5b4fc] text-xs font-bold hover:bg-[#6366f1] hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Document Requirement
                    </button>
                  </div>

                  <div className="space-y-3">
                    {serviceForm.required_documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={doc.name}
                              onChange={(e) => updateRequiredDoc(idx, { name: e.target.value })}
                              placeholder="Document Name (e.g. PAN Card)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              value={doc.description}
                              onChange={(e) => updateRequiredDoc(idx, { description: e.target.value })}
                              placeholder="Description / Guidance"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-1 text-[11px] text-[#cbd5e1] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={doc.required}
                                onChange={(e) => updateRequiredDoc(idx, { required: e.target.checked })}
                                className="accent-[#6366f1]"
                              />
                              <span>Mandatory</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => removeRequiredDoc(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Delete Requirement"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    type="button"
                    onClick={() => setServiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#94a3b8] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingService}
                    className="px-6 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    {savingService ? <Loader2 size={14} className="animate-spin" /> : "Save Service Configuration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: APPLICATION DETAIL, STATUS MANAGEMENT & CERTIFICATE ISSUANCE */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#11131a] rounded-3xl border border-[rgba(255,255,255,0.1)] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#e2e8f0]">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#818cf8]">
                      {selectedApp.application_number}
                    </span>
                    <span
                      style={{
                        background: (STATUS_COLORS[selectedApp.status] || STATUS_COLORS.Submitted).bg,
                        color: (STATUS_COLORS[selectedApp.status] || STATUS_COLORS.Submitted).color,
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {selectedApp.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedApp.service_snapshot?.title || selectedApp.service?.title}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="h-8 w-8 rounded-full bg-[rgba(255,255,255,0.06)] text-[#94a3b8] hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Applicant & Entity Overview */}
                <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] mb-3">
                    1. Applicant & Company Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[#94a3b8]">Applicant Name:</span>
                      <div className="font-bold text-white">{selectedApp.applicant?.name || "—"}</div>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Company / Entity:</span>
                      <div className="font-bold text-white">{selectedApp.applicant?.company_name || "—"}</div>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Email Address:</span>
                      <div className="font-bold text-white truncate">{selectedApp.applicant?.email || "—"}</div>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Contact Phone:</span>
                      <div className="font-bold text-white">{selectedApp.applicant?.phone || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Submitted Dynamic Form Answers */}
                {selectedApp.form_responses && selectedApp.form_responses.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] mb-3">
                      2. Submitted Form Responses
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedApp.form_responses.map((resp, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-xs">
                          <div className="text-[#94a3b8] font-medium">{resp.label}</div>
                          <div className="font-bold text-white mt-0.5 break-words">
                            {Array.isArray(resp.value) ? resp.value.join(", ") : String(resp.value || "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. User Uploaded Documents */}
                {selectedApp.documents && selectedApp.documents.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] mb-3">
                      3. User Uploaded Documents ({selectedApp.documents.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedApp.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={16} className="text-[#818cf8] shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-white truncate">{doc.document_name}</div>
                              <div className="text-[10px] text-[#94a3b8] truncate">{doc.original_name}</div>
                            </div>
                          </div>

                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-[rgba(99,102,241,0.2)] hover:bg-[#6366f1] text-[#a5b4fc] hover:text-white font-semibold transition inline-flex items-center gap-1 text-[11px]"
                          >
                            <Download size={12} /> View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Payment Information Audit */}
                <div className="p-4 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] mb-3">
                    4. Payment Audit
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[#94a3b8]">Status:</span>
                      <div className="font-bold text-white capitalize">{selectedApp.payment?.status || "Free"}</div>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Amount:</span>
                      <div className="font-bold text-white">₹{selectedApp.payment?.amount || 0}</div>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Razorpay Order ID:</span>
                      <div className="font-mono text-[11px] text-[#cbd5e1] truncate">{selectedApp.payment?.razorpay_order_id || "—"}</div>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Payment ID:</span>
                      <div className="font-mono text-[11px] text-[#cbd5e1] truncate">{selectedApp.payment?.razorpay_payment_id || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* 5. Status Management & Remarks Form */}
                <div className="p-5 rounded-2xl bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.2)] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#a5b4fc]">
                    5. Update Status & Add Remarks
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#cbd5e1]">Change Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none"
                      >
                        {STATUS_OPTS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-[#cbd5e1]">Remark / Guidance for User</label>
                      <input
                        type="text"
                        value={statusRemark}
                        onChange={(e) => setStatusRemark(e.target.value)}
                        placeholder="e.g. Documents verified. Application submitted to MCA/Trademark registry."
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleUpdateAppStatus}
                      disabled={updatingStatus}
                      className="px-5 py-2 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {updatingStatus ? <Loader2 size={13} className="animate-spin" /> : "Update Status & Save"}
                    </button>
                  </div>
                </div>

                {/* 6. Upload Final Issued Certificates */}
                <div className="p-5 rounded-2xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.2)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck size={16} /> 6. Issue Final Certificates & Documents
                      </h4>
                      <p className="text-[11px] text-[#94a3b8]">
                        Upload the approved registration certificate, trademark papers, or official license.
                      </p>
                    </div>
                  </div>

                  {/* List of already issued certificates */}
                  {selectedApp.final_documents && selectedApp.final_documents.length > 0 && (
                    <div className="space-y-2">
                      {selectedApp.final_documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-emerald-500/30 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <div>
                              <div className="font-bold text-white">{doc.title}</div>
                              <div className="text-[10px] text-[#94a3b8]">{doc.original_name}</div>
                            </div>
                          </div>

                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <Download size={12} /> Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload new certificate box */}
                  <form onSubmit={handleUploadCertificates} className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#cbd5e1]">Certificate Title</label>
                        <input
                          type="text"
                          value={certTitle}
                          onChange={(e) => setCertTitle(e.target.value)}
                          placeholder="e.g. Trademark Registration Certificate"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#cbd5e1]">Select File(s)</label>
                        <input
                          type="file"
                          multiple
                          ref={certFileInputRef}
                          onChange={(e) => {
                            if (e.target.files) {
                              setCertFiles(Array.from(e.target.files));
                            }
                          }}
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => certFileInputRef.current?.click()}
                          className="w-full mt-1 py-2 px-3 rounded-xl border border-dashed border-emerald-500/40 bg-[rgba(255,255,255,0.02)] hover:bg-emerald-500/10 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UploadCloud size={15} />
                          {certFiles.length > 0 ? `${certFiles.length} file(s) selected` : "Choose Certificate File(s)"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#cbd5e1] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={markCompleteChecked}
                          onChange={(e) => setMarkCompleteChecked(e.target.checked)}
                          className="accent-emerald-500"
                        />
                        <span>Automatically mark status as "Completed"</span>
                      </label>

                      <button
                        type="submit"
                        disabled={uploadingCert || certFiles.length === 0}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {uploadingCert ? <Loader2 size={13} className="animate-spin" /> : "Upload & Issue Certificate"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* 7. Status Timeline History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#818cf8] mb-3">
                    7. Status History & Audit Log
                  </h4>
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[rgba(255,255,255,0.1)]">
                    {(selectedApp.status_history || []).map((step, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-[#6366f1] ring-4 ring-[#11131a]" />
                        <div>
                          <span className="font-bold text-white">{step.status}</span>
                          <span className="text-[10px] text-[#94a3b8] ml-2">
                            {new Date(step.updated_at).toLocaleString()} by {step.updated_by_name || "Admin"}
                          </span>
                          {step.remark && <p className="text-[#cbd5e1] mt-0.5">{step.remark}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.08)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-xs font-bold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

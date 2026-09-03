import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";
import { hasPermission, isSuperAdmin } from "../../utils/rbac";
import {
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  QrCode,
  CreditCard,
  Download,
  Eye,
  Award,
  ShieldCheck,
  User,
  Users,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Send,
  MessageSquare,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sliders,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Sparkles,
  GraduationCap,
  Settings,
  Star,
  Laptop,
} from "lucide-react";

export default function AdminIncubation() {
  const { user: currentUser } = useStore();
  const canManage = isSuperAdmin(currentUser) || hasPermission(currentUser, "programs.update") || hasPermission(currentUser, "programs.create");

  const [activeTab, setActiveTab] = useState("applications"); // 'applications' | 'form-builder' | 'mentors' | 'infrastructure' | 'attendance' | 'settings' | 'accounting'
  const [loading, setLoading] = useState(false);

  // 1. Applications State
  const [applications, setApplications] = useState([]);
  const [appSearch, setAppSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [adminFeedbackMsg, setAdminFeedbackMsg] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 2. Form Builder State
  const [formConfig, setFormConfig] = useState({
    title: "",
    description: "",
    centerName: "",
    cohortName: "",
    fields: [],
  });
  const [savingForm, setSavingForm] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newField, setNewField] = useState({
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    optionsText: "",
    section: "custom",
  });

  // 3. Mentors State
  const [mentorsList, setMentorsList] = useState([]);
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    name: "",
    role: "",
    company: "RealBell Ecosystem",
    bio: "",
    expertiseAreas: "",
    email: "",
  });

  // 4. Infrastructure State
  const [infrastructureList, setInfrastructureList] = useState([]);
  const [showInfraModal, setShowInfraModal] = useState(false);
  const [editingInfraId, setEditingInfraId] = useState(null);
  const [infraForm, setInfraForm] = useState({
    title: "",
    type: "meeting_room",
    capacity: 4,
    location: "Floor 1, Chandlai Center, Jaipur",
    description: "",
    amenities: "Wi-Fi 6, 4K Screen, Video Conferencing",
    availabilityType: "specific_days",
    availableDays: "Monday, Tuesday, Wednesday, Thursday, Friday",
    availableTimeSlots: "09:00 AM - 11:00 AM, 11:30 AM - 01:30 PM, 02:30 PM - 04:30 PM, 05:00 PM - 07:00 PM",
    monthlyBookingLimit: 20,
    monthlyHoursLimit: 20,
    isFreeForNewProfiles: true,
    freeQuotaPerUser: 3,
    pricePerHour: 500,
  });
  const [adminBookingsHistory, setAdminBookingsHistory] = useState([]);
  const [infraSubTab, setInfraSubTab] = useState("facilities"); // 'facilities' | 'bookings'


  // 5. Attendance State
  const [attendanceData, setAttendanceData] = useState({ todayLogs: [], todayCount: 0, centerQrToken: "" });

  // 6. Settings & Pricing State
  const [incubationSettings, setIncubationSettings] = useState({
    physicalMonthlyFee: 5000,
    physicalTrialDays: 14,
    virtualMonthlyFee: 2500,
    virtualTrialDays: 30,
    defaultTrialDays: 14,
    centerName: "RealBell Vedic Council of Education Research & Training (Chandlai Hub)",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // 7. Accounting State
  const [accountingData, setAccountingData] = useState({ invoices: [], summary: { totalInvoices: 0, totalRevenue: 0, totalSubsidies: 0 } });

  // Fetch Applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/incubation/admin/applications", {
        params: { status: statusFilter, type: typeFilter, search: appSearch },
      });
      if (res.data?.status === 1) {
        setApplications(res.data.applications || []);
        if (res.data.settings) setIncubationSettings(res.data.settings);
      }
    } catch (err) {
      console.error("fetchApplications error:", err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Form Config
  const fetchFormConfig = async () => {
    try {
      const res = await axios.get("/incubation/admin/form");
      if (res.data?.status === 1 && res.data.form) {
        setFormConfig({
          title: res.data.form.title || "",
          description: res.data.form.description || "",
          centerName: res.data.form.centerName || "",
          cohortName: res.data.form.cohortName || "",
          fields: res.data.form.fields || [],
        });
      }
    } catch (err) {
      console.error("fetchFormConfig error:", err);
    }
  };

  // Fetch Mentors
  const fetchMentors = async () => {
    try {
      const res = await axios.get("/incubation/mentors");
      if (res.data?.status === 1) {
        setMentorsList(res.data.mentors || []);
      }
    } catch (err) {
      console.error("fetchMentors error:", err);
    }
  };

  // Fetch Infrastructure
  const fetchInfrastructure = async () => {
    try {
      const [infraRes, bookingsRes] = await Promise.all([
        axios.get("/incubation/admin/infrastructure"),
        axios.get("/incubation/admin/infrastructure/bookings"),
      ]);
      if (infraRes.data?.status === 1) {
        setInfrastructureList(infraRes.data.infrastructure || []);
      }
      if (bookingsRes.data?.status === 1) {
        setAdminBookingsHistory(bookingsRes.data.bookings || []);
      }
    } catch (err) {
      console.error("fetchInfrastructure error:", err);
    }
  };

  // Fetch Attendance
  const fetchAttendance = async () => {
    try {
      const res = await axios.get("/incubation/admin/attendance");
      if (res.data?.status === 1) {
        setAttendanceData(res.data);
      }
    } catch (err) {
      console.error("fetchAttendance error:", err);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await axios.get("/incubation/admin/settings");
      if (res.data?.status === 1 && res.data.settings) {
        setIncubationSettings(res.data.settings);
      }
    } catch (err) {
      console.error("fetchSettings error:", err);
    }
  };

  // Fetch Accounting
  const fetchAccounting = async () => {
    try {
      const res = await axios.get("/incubation/admin/accounting");
      if (res.data?.status === 1) {
        setAccountingData(res.data);
      }
    } catch (err) {
      console.error("fetchAccounting error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "applications") fetchApplications();
    else if (activeTab === "form-builder") fetchFormConfig();
    else if (activeTab === "mentors") fetchMentors();
    else if (activeTab === "infrastructure") fetchInfrastructure();
    else if (activeTab === "attendance") fetchAttendance();
    else if (activeTab === "settings") fetchSettings();
    else if (activeTab === "accounting") fetchAccounting();
  }, [activeTab, statusFilter, typeFilter]);

  // Update Status Handler (Triggers Notification and Email upon approval)
  const handleUpdateStatus = async (appId) => {
    if (!newStatus) return;
    try {
      setUpdatingStatus(true);
      const res = await axios.put(`/incubation/admin/applications/${appId}/status`, {
        status: newStatus,
        reviewNotes,
      });
      if (res.data?.status === 1) {
        toast.success(`Application updated to ${newStatus}! Notification & Email sent to founder.`);
        setReviewModalOpen(false);
        fetchApplications();
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Send Feedback Message
  const handleSendFeedback = async (appId) => {
    if (!adminFeedbackMsg.trim()) return;
    try {
      const res = await axios.post(`/incubation/admin/applications/${appId}/feedback`, {
        message: adminFeedbackMsg.trim(),
      });
      if (res.data?.status === 1) {
        toast.success("Feedback dispatched to founder");
        setAdminFeedbackMsg("");
        if (selectedApp) {
          setSelectedApp({
            ...selectedApp,
            feedbackMessages: res.data.feedbackMessages,
          });
        }
      }
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  // Save Settings & Pricing
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await axios.put("/incubation/admin/settings", incubationSettings);
      if (res.data?.status === 1) {
        toast.success("Incubation pricing and free trial settings updated!");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Mentor
  const handleAddMentor = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/incubation/admin/mentors", {
        ...mentorForm,
        expertiseAreas: mentorForm.expertiseAreas.split(",").map((s) => s.trim()).filter(Boolean),
      });
      if (res.data?.status === 1) {
        toast.success("Mentor added to roster!");
        setShowAddMentorModal(false);
        setMentorForm({ name: "", role: "", company: "RealBell Ecosystem", bio: "", expertiseAreas: "", email: "" });
        fetchMentors();
      }
    } catch (err) {
      toast.error("Failed to add mentor");
    }
  };

  // Save Form Builder
  const handleSaveForm = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingForm(true);
      const res = await axios.put("/incubation/admin/form", formConfig);
      if (res.data?.status === 1) {
        toast.success("Incubation Form configuration saved!");
      }
    } catch (err) {
      toast.error("Failed to save form");
    } finally {
      setSavingForm(false);
    }
  };

  // Add Dynamic Field to Form
  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast.error("Field label is required");
      return;
    }
    const key = newField.label.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const options = newField.optionsText
      ? newField.optionsText.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const fieldObj = {
      id: `f_${Date.now()}`,
      key,
      label: newField.label.trim(),
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder || "",
      options,
      section: newField.section,
      order: formConfig.fields.length + 1,
    };

    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, fieldObj],
    });
    setShowAddFieldModal(false);
    setNewField({ label: "", type: "text", required: false, placeholder: "", optionsText: "", section: "custom" });
    toast.success("Field added to form schema");
  };

  // Save / Update Infrastructure
  const handleSaveInfra = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...infraForm,
        amenities: (infraForm.amenities || "").split(",").map((s) => s.trim()).filter(Boolean),
        availableDays: (infraForm.availableDays || "").split(",").map((s) => s.trim()).filter(Boolean),
        availableTimeSlots: (infraForm.availableTimeSlots || "").split(",").map((s) => s.trim()).filter(Boolean),
        monthlyBookingLimit: Number(infraForm.monthlyBookingLimit) || 20,
        monthlyHoursLimit: Number(infraForm.monthlyHoursLimit) || 20,
      };

      if (editingInfraId) {
        await axios.put(`/incubation/admin/infrastructure/${editingInfraId}`, payload);
        toast.success("Facility updated successfully");
      } else {
        await axios.post("/incubation/admin/infrastructure", payload);
        toast.success("New facility added to catalog");
      }
      setShowInfraModal(false);
      setEditingInfraId(null);
      fetchInfrastructure();
    } catch (err) {
      toast.error("Failed to save infrastructure facility");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
              <Building2 size={15} />
              <span>Incubation &amp; Cohort Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Incubation Management Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage startup applications (Physical &amp; Virtual), advisors roster, dynamic form schema, monthly pricing rules, and turnstile records.
            </p>
          </div>

          <button
            onClick={() => {
              if (activeTab === "applications") fetchApplications();
              else if (activeTab === "form-builder") fetchFormConfig();
              else if (activeTab === "mentors") fetchMentors();
              else if (activeTab === "infrastructure") fetchInfrastructure();
              else if (activeTab === "attendance") fetchAttendance();
              else if (activeTab === "settings") fetchSettings();
              else if (activeTab === "accounting") fetchAccounting();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto">
          {[
            { key: "applications", label: "Startup Applications", icon: FileText },
            { key: "mentors", label: "Mentor Roster", icon: GraduationCap },
            { key: "settings", label: "Pricing & Free Trial", icon: Settings },
            { key: "form-builder", label: "Form Builder", icon: Sliders },
            { key: "infrastructure", label: "Infrastructure Catalog", icon: Building2 },
            { key: "attendance", label: "Turnstile Attendance", icon: QrCode },
            { key: "accounting", label: "Incubation Accounting", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-4 transition cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-teal-600 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: STARTUP APPLICATIONS */}
        {activeTab === "applications" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex items-center flex-1 sm:flex-none">
                  <Search size={14} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search applicant, startup, DIPP..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none w-full sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Changes Requested">Changes Requested</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="">All Types</option>
                  <option value="physical">Physical Incubation</option>
                  <option value="virtual">Virtual Incubation</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            {loading ? (
              <div className="py-16 text-center text-slate-500">
                <RefreshCw size={24} className="animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-xs font-bold">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <FileText size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-sm font-bold">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                      <th className="pb-3 pl-2">App ID &amp; Startup</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Founder</th>
                      <th className="pb-3">Team</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Monthly Fee</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {applications.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 pl-2">
                          <div className="font-mono font-bold text-teal-600 dark:text-teal-400 text-[11px]">
                            {app.applicationId}
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {app.businessDetails?.companyName || app.user?.company_name || "Startup Applicant"}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-extrabold uppercase border ${
                              app.incubationType === "virtual"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : "bg-teal-500/10 text-teal-600 border-teal-500/20"
                            }`}
                          >
                            {app.incubationType || "Physical"}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{app.user?.name || "Founder"}</div>
                          <div className="text-slate-400 text-[11px]">{app.user?.email}</div>
                        </td>
                        <td className="py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {app.teamMembers?.length || 1} Members
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                              app.status === "Accepted"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : app.status === "Rejected"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold">
                          ₹{app.monthlyFee || (app.incubationType === "physical" ? 5000 : 2500)}/mo
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setNewStatus(app.status);
                              setReviewNotes(app.reviewNotes || "");
                              setReviewModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Review &amp; Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENTORS ROSTER */}
        {activeTab === "mentors" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Incubation Mentors &amp; Advisory Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage mentors available for 1-on-1 strategy and technical guidance calls.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMentorModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Mentor to Roster</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentorsList.map((m) => (
                <div
                  key={m._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                        <Star size={12} className="fill-amber-500" />
                        <span>{m.rating || 4.9}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-teal-600 font-semibold">{m.role} · {m.company}</div>
                    <p className="text-slate-500 text-[11px] mt-1.5 line-clamp-2">{m.bio}</p>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {m.expertiseAreas?.map((area, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">{m.sessionsCount || 0} calls completed</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Remove mentor ${m.name}?`)) {
                          await axios.delete(`/incubation/admin/mentors/${m._id}`);
                          fetchMentors();
                          toast.info("Mentor removed");
                        }
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & PRICING */}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 max-w-2xl">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Incubation Subscription &amp; Free Trial Settings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set monthly service pricing for Physical and Virtual cohorts and define default free trial days.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              {/* Physical Incubation Configuration */}
              <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-3">
                <div className="font-bold text-sm text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                  <Building2 size={16} className="text-teal-600" />
                  <span>Physical Incubation (On-Campus)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold mb-1">Monthly Fee (₹):</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={incubationSettings.physicalMonthlyFee}
                      onChange={(e) => setIncubationSettings({ ...incubationSettings, physicalMonthlyFee: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Attendance + Infrastructure + Mentors</p>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Free Trial Duration (Days):</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={incubationSettings.physicalTrialDays ?? 14}
                      onChange={(e) => setIncubationSettings({ ...incubationSettings, physicalTrialDays: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Physical cohort trial period</p>
                  </div>
                </div>
              </div>

              {/* Virtual Incubation Configuration */}
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                <div className="font-bold text-sm text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                  <Laptop size={16} className="text-blue-600" />
                  <span>Virtual Incubation (Remote)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold mb-1">Monthly Fee (₹):</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={incubationSettings.virtualMonthlyFee}
                      onChange={(e) => setIncubationSettings({ ...incubationSettings, virtualMonthlyFee: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Attendance + Mentors</p>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Free Trial Duration (Days):</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={incubationSettings.virtualTrialDays ?? 30}
                      onChange={(e) => setIncubationSettings({ ...incubationSettings, virtualTrialDays: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Virtual cohort trial period (separate from physical)</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  {savingSettings ? "Saving Settings..." : "Save Pricing & Trial Settings"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: FORM BUILDER */}
        {activeTab === "form-builder" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Incubation Application Form Builder
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the official onboarding form fields required from applicants.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Custom Field</span>
                </button>
                <button
                  type="button"
                  disabled={savingForm}
                  onClick={handleSaveForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingForm ? "Saving Form..." : "Save Configuration"}</span>
                </button>
              </div>
            </div>

            {/* General Header Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Form Title:</label>
                <input
                  type="text"
                  value={formConfig.title}
                  onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Cohort Name:</label>
                <input
                  type="text"
                  value={formConfig.cohortName}
                  onChange={(e) => setFormConfig({ ...formConfig, cohortName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Permanent Sections Note */}
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
              <Sparkles size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Permanent Required Application Sections:</strong>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                  1. <strong>Incubation Type</strong> (Physical vs Virtual) - mandatory selector.<br />
                  2. <strong>Business Details</strong> (Company Name, DIPP/CIN, Sector, Stage, Pitch Summary).<br />
                  3. <strong>Team Members</strong> (Minimum 1 member required).
                </p>
              </div>
            </div>

            {/* Dynamic Custom Fields List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Configured Dynamic Form Fields ({formConfig.fields.length})
              </h4>

              <div className="space-y-2.5">
                {formConfig.fields.map((field, idx) => (
                  <div
                    key={field.id || idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-[11px]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Key: {field.key} · Type: <span className="uppercase font-bold text-teal-600">{field.type}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = formConfig.fields.filter((_, i) => i !== idx);
                        setFormConfig({ ...formConfig, fields: updated });
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INFRASTRUCTURE & BOOKINGS */}
        {activeTab === "infrastructure" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Infrastructure Facilities &amp; Bookings Ledger
                  </h3>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setInfraSubTab("facilities")}
                      className={`px-3 py-1 rounded-md transition ${infraSubTab === "facilities" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-500"}`}
                    >
                      Facilities Catalog ({infrastructureList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInfraSubTab("bookings")}
                      className={`px-3 py-1 rounded-md transition ${infraSubTab === "bookings" ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs" : "text-slate-500"}`}
                    >
                      Bookings History ({adminBookingsHistory.length})
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure availability (24/7, days, time slots) and enforce startup monthly limits (max bookings/hours).
                </p>
              </div>

              {infraSubTab === "facilities" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingInfraId(null);
                    setInfraForm({
                      title: "",
                      type: "meeting_room",
                      capacity: 4,
                      location: "Floor 1, Chandlai Center, Jaipur",
                      description: "",
                      amenities: "Wi-Fi 6, 4K Screen, Video Conferencing",
                      availabilityType: "specific_days",
                      availableDays: "Monday, Tuesday, Wednesday, Thursday, Friday",
                      availableTimeSlots: "09:00 AM - 11:00 AM, 11:30 AM - 01:30 PM, 02:30 PM - 04:30 PM, 05:00 PM - 07:00 PM",
                      monthlyBookingLimit: 20,
                      monthlyHoursLimit: 20,
                      isFreeForNewProfiles: true,
                      freeQuotaPerUser: 3,
                      pricePerHour: 500,
                    });
                    setShowInfraModal(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add New Facility</span>
                </button>
              )}
            </div>

            {infraSubTab === "bookings" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                      <th className="pb-2.5">Booking Ref</th>
                      <th className="pb-2.5">Startup &amp; Founder</th>
                      <th className="pb-2.5">Facility</th>
                      <th className="pb-2.5">Date &amp; Slot</th>
                      <th className="pb-2.5">Duration</th>
                      <th className="pb-2.5">Purpose</th>
                      <th className="pb-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {adminBookingsHistory.map((b) => (
                      <tr key={b._id}>
                        <td className="py-3 font-mono font-bold text-teal-600">{b.bookingId}</td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{b.user?.company_name || b.user?.name}</div>
                          <div className="text-[11px] text-slate-400">{b.user?.email}</div>
                        </td>
                        <td className="py-3 font-semibold">{b.facilityName}</td>
                        <td className="py-3 text-slate-500">{b.date}, {b.startTime}</td>
                        <td className="py-3 font-semibold">{b.durationHours || 2} hrs</td>
                        <td className="py-3 max-w-xs truncate">{b.purpose}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {infrastructureList.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/10 text-teal-600 border border-teal-500/20">
                        {item.type?.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">{item.capacity} Seater</span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{item.location}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Free Quota:</span>
                      <strong className="text-emerald-600 font-bold">{item.freeQuotaPerUser} Free Slots</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Rate:</span>
                      <strong className="text-slate-900 dark:text-white">₹{item.pricePerHour}/hr</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingInfraId(item._id);
                        setInfraForm({
                          title: item.title,
                          type: item.type,
                          capacity: item.capacity,
                          location: item.location,
                          description: item.description,
                          amenities: (item.amenities || []).join(", "),
                          isFreeForNewProfiles: item.isFreeForNewProfiles,
                          freeQuotaPerUser: item.freeQuotaPerUser,
                          pricePerHour: item.pricePerHour,
                        });
                        setShowInfraModal(true);
                      }}
                      className="flex-1 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-center"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete ${item.title}?`)) {
                          await axios.delete(`/incubation/admin/infrastructure/${item._id}`);
                          fetchInfrastructure();
                          toast.info("Facility deleted");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Incubatee Attendance &amp; Turnstile Logs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Today's presence records from physical turnstiles and virtual sessions.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">
                Today Present: {attendanceData.todayCount} Incubatees
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                    <th className="pb-3 pl-2">Incubatee Founder</th>
                    <th className="pb-3">Startup Entity</th>
                    <th className="pb-3">Check-In Time</th>
                    <th className="pb-3">Check-Out Time</th>
                    <th className="pb-3">Location / Mode</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendanceData.todayLogs?.map((log) => (
                    <tr key={log._id}>
                      <td className="py-3 pl-2 font-bold text-slate-900 dark:text-white">{log.user?.name}</td>
                      <td className="py-3 text-slate-500">{log.user?.company_name}</td>
                      <td className="py-3 font-mono text-emerald-600 font-semibold">
                        {new Date(log.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {log.checkOutTime
                          ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Active"}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{log.location}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: ACCOUNTING */}
        {activeTab === "accounting" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Incubation Financial Accounting &amp; Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly subscription collections, seat billing, and invoices.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-emerald-600">
                  Total Collected Revenue: ₹{accountingData.summary?.totalRevenue?.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                    <th className="pb-3 pl-2">Invoice #</th>
                    <th className="pb-3">Startup</th>
                    <th className="pb-3">Period / Description</th>
                    <th className="pb-3">Gross</th>
                    <th className="pb-3">Net Paid</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {accountingData.invoices?.map((inv) => (
                    <tr key={inv._id}>
                      <td className="py-3 pl-2 font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{inv.user?.company_name || inv.user?.name}</td>
                      <td className="py-3 text-slate-500">{inv.billingPeriod}</td>
                      <td className="py-3">₹{inv.grossAmount}</td>
                      <td className="py-3 font-bold">₹{inv.netAmount}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEW & STATUS MODAL */}
        {reviewModalOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative max-h-[90vh] overflow-y-auto text-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold">
                  Review Application: {selectedApp.applicationId}
                </h3>
                <button onClick={() => setReviewModalOpen(false)} className="text-lg font-bold text-slate-400">
                  ✕
                </button>
              </div>

              {/* Startup & Type */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedApp.businessDetails?.companyName || selectedApp.user?.company_name}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-black uppercase bg-teal-500/10 text-teal-600 border border-teal-500/20">
                    {selectedApp.incubationType} Incubation
                  </span>
                </div>
                <div className="text-slate-500">
                  Founder: {selectedApp.user?.name} ({selectedApp.user?.email}) · DIPP: {selectedApp.businessDetails?.dippNumber || "N/A"}
                </div>
              </div>

              {/* Team Roster */}
              {selectedApp.teamMembers?.length > 0 && (
                <div>
                  <div className="font-bold uppercase text-[10px] text-slate-400 mb-1.5">Team Members ({selectedApp.teamMembers.length}):</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedApp.teamMembers.map((t, idx) => (
                      <div key={idx} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <div className="font-bold">{t.name}</div>
                        <div className="text-[10px] text-slate-400">{t.role} · {t.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Updater */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block font-bold mb-1">Set Application Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Changes Requested">Changes Requested</option>
                    <option value="Accepted">Accepted (Approved)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {newStatus === "Accepted" && (
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-900 dark:text-teal-200 text-[11px] leading-relaxed">
                    ✨ <strong>Approval Workflow Trigger:</strong> Accepting this application will:
                    <ul className="list-disc ml-4 mt-1 space-y-0.5">
                      <li>Activate a <strong>{(selectedApp.incubationType === "virtual" ? incubationSettings.virtualTrialDays : incubationSettings.physicalTrialDays) || (selectedApp.incubationType === "virtual" ? 30 : 14)}-day free trial</strong> for {selectedApp.incubationType?.toUpperCase()} Incubation.</li>
                      <li>Set next monthly fee to <strong>₹{selectedApp.incubationType === "physical" ? incubationSettings.physicalMonthlyFee : incubationSettings.virtualMonthlyFee}/mo</strong>.</li>
                      <li>Send an immediate in-app notification to the founder.</li>
                      <li>Send an official approval email to <strong>{selectedApp.user?.email}</strong> via SMTP mail service.</li>
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1">Internal Evaluation Notes:</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Committee notes..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedApp._id)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                  >
                    {updatingStatus ? "Updating & Dispatching..." : "Save Status & Trigger Actions"}
                  </button>
                </div>
              </div>

              {/* Messaging Thread */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="font-bold text-xs">Direct Feedback &amp; Messaging to Founder</div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  {selectedApp.feedbackMessages?.length === 0 ? (
                    <div className="text-slate-400 text-center py-2">No messages yet. Send feedback below.</div>
                  ) : (
                    selectedApp.feedbackMessages?.map((m, idx) => (
                      <div key={idx} className={`p-2 rounded-lg text-xs ${m.senderRole === "admin" ? "bg-teal-500/10 text-teal-900 dark:text-teal-200" : "bg-blue-500/10 text-blue-900 dark:text-blue-200"}`}>
                        <div className="font-bold text-[10px] uppercase text-slate-500">
                          {m.senderName} ({m.senderRole}):
                        </div>
                        <div className="mt-0.5">{m.message}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type feedback message..."
                    value={adminFeedbackMsg}
                    onChange={(e) => setAdminFeedbackMsg(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendFeedback(selectedApp._id)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD MENTOR MODAL */}
        {showAddMentorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative text-xs space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold">Add Mentor to Incubation Roster</h3>
                <button onClick={() => setShowAddMentorModal(false)} className="text-lg font-bold text-slate-400">✕</button>
              </div>

              <form onSubmit={handleAddMentor} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">Mentor Full Name *:</label>
                  <input
                    type="text"
                    required
                    value={mentorForm.name}
                    onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Designation / Role *:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief AI Advisor & ex-IIT Faculty"
                    value={mentorForm.role}
                    onChange={(e) => setMentorForm({ ...mentorForm, role: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Affiliation / Organization:</label>
                  <input
                    type="text"
                    value={mentorForm.company}
                    onChange={(e) => setMentorForm({ ...mentorForm, company: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Expertise Areas (comma-separated):</label>
                  <input
                    type="text"
                    placeholder="AI, Valuation, Fundraising, GTM"
                    value={mentorForm.expertiseAreas}
                    onChange={(e) => setMentorForm({ ...mentorForm, expertiseAreas: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Short Bio:</label>
                  <textarea
                    rows={2}
                    value={mentorForm.bio}
                    onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddMentorModal(false)} className="flex-1 py-2 rounded-xl border border-slate-300 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold">Add to Roster</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD / EDIT INFRASTRUCTURE MODAL */}
        {showInfraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative text-xs space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold">{editingInfraId ? "Edit Facility" : "Add New Facility"}</h3>
                <button onClick={() => setShowInfraModal(false)} className="text-lg font-bold text-slate-400">✕</button>
              </div>

              <form onSubmit={handleSaveInfra} className="space-y-3">
                <div>
                  <label className="block font-bold mb-1">Facility Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chanakya Boardroom"
                    value={infraForm.title}
                    onChange={(e) => setInfraForm({ ...infraForm, title: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">Type:</label>
                    <select
                      value={infraForm.type}
                      onChange={(e) => setInfraForm({ ...infraForm, type: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="meeting_room">Meeting Room</option>
                      <option value="boardroom">Boardroom</option>
                      <option value="desk">Dedicated Desk</option>
                      <option value="lab">Compute / AI Lab</option>
                      <option value="studio">Podcast Studio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Capacity (Seats):</label>
                    <input
                      type="number"
                      value={infraForm.capacity}
                      onChange={(e) => setInfraForm({ ...infraForm, capacity: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">Free Quota (Bookings):</label>
                    <input
                      type="number"
                      min="0"
                      value={infraForm.freeQuotaPerUser}
                      onChange={(e) => setInfraForm({ ...infraForm, freeQuotaPerUser: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Hourly Rate (₹):</label>
                    <input
                      type="number"
                      min="0"
                      value={infraForm.pricePerHour}
                      onChange={(e) => setInfraForm({ ...infraForm, pricePerHour: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Availability & Limits */}
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2.5">
                  <div className="font-bold text-teal-800 dark:text-teal-200">Availability &amp; Monthly Startup Limits</div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1">Availability Mode:</label>
                      <select
                        value={infraForm.availabilityType}
                        onChange={(e) => setInfraForm({ ...infraForm, availabilityType: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="24_7">24/7 Access (All Days)</option>
                        <option value="specific_days">Specific Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Available Days (comma-sep):</label>
                      <input
                        type="text"
                        placeholder="Monday, Tuesday, Wednesday, Thursday, Friday"
                        value={infraForm.availableDays}
                        onChange={(e) => setInfraForm({ ...infraForm, availableDays: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Available Time Slots (comma-separated):</label>
                    <input
                      type="text"
                      placeholder="09:00 AM - 11:00 AM, 11:30 AM - 01:30 PM, 02:30 PM - 04:30 PM, 05:00 PM - 07:00 PM"
                      value={infraForm.availableTimeSlots}
                      onChange={(e) => setInfraForm({ ...infraForm, availableTimeSlots: e.target.value })}
                      className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10.5px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block font-bold mb-1">Startup Max Bookings/Month:</label>
                      <input
                        type="number"
                        min="1"
                        value={infraForm.monthlyBookingLimit}
                        onChange={(e) => setInfraForm({ ...infraForm, monthlyBookingLimit: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                      <span className="text-[10px] text-slate-400">e.g. Max 20 times per month</span>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Startup Max Hours/Month:</label>
                      <input
                        type="number"
                        min="1"
                        value={infraForm.monthlyHoursLimit}
                        onChange={(e) => setInfraForm({ ...infraForm, monthlyHoursLimit: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      />
                      <span className="text-[10px] text-slate-400">e.g. Max 20 hours per month</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowInfraModal(false)} className="flex-1 py-2 rounded-xl border border-slate-300 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold">Save Facility</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

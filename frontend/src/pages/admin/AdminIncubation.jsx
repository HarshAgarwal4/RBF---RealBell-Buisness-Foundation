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
  Calendar,
  X,
  Check,
  Copy,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  CheckSquare,
  CircleDot,
  List,
  UploadCloud,
  Image as ImageIcon,
  Link2,
  Globe,
  FileCheck,
} from "lucide-react";

export const INCUBATION_FIELD_PALETTE = [
  { type: "text", label: "Single-line Text", icon: Type, defaultLabel: "Single Line Text", defaultPlaceholder: "Enter text...", category: "Standard" },
  { type: "textarea", label: "Multi-line Text", icon: AlignLeft, defaultLabel: "Detailed Description", defaultPlaceholder: "Provide comprehensive details...", category: "Standard" },
  { type: "number", label: "Numeric Value", icon: Hash, defaultLabel: "Numeric Amount / Count", defaultPlaceholder: "e.g. 500000", category: "Standard" },
  { type: "email", label: "Email Address", icon: Mail, defaultLabel: "Official Contact Email", defaultPlaceholder: "founder@startup.com", category: "Standard" },
  { type: "phone", label: "Phone / Mobile", icon: Phone, defaultLabel: "Contact Phone Number", defaultPlaceholder: "+91 9876543210", category: "Standard" },
  { type: "date", label: "Date Selector", icon: Calendar, defaultLabel: "Important Date", defaultPlaceholder: "", category: "Standard" },
  { type: "select", label: "Dropdown Select", icon: List, defaultLabel: "Dropdown Selection", defaultOptions: ["Option 1", "Option 2", "Option 3"], category: "Choice" },
  { type: "multiselect", label: "Multi-Select Tags", icon: List, defaultLabel: "Key Focus Areas", defaultOptions: ["Fundraising", "Mentorship", "Tech Architecture", "GTM"], category: "Choice" },
  { type: "checkbox", label: "Checkbox (Yes/No)", icon: CheckSquare, defaultLabel: "Declaration Agreement", defaultPlaceholder: "", category: "Choice" },
  { type: "radio", label: "Radio Option Group", icon: CircleDot, defaultLabel: "Choose One Option", defaultOptions: ["Choice A", "Choice B"], category: "Choice" },
  { type: "file", label: "Document Upload", icon: UploadCloud, defaultLabel: "Pitch Deck / Certificate (PDF)", defaultPlaceholder: "Upload PDF/DOC (Max 25MB)", category: "Uploads" },
  { type: "image", label: "Image / ID Upload", icon: ImageIcon, defaultLabel: "Photo ID / Logo", defaultPlaceholder: "Upload PNG/JPG", category: "Uploads" },
  { type: "url", label: "Website / URL", icon: Link2, defaultLabel: "Demo Video or Pitch URL", defaultPlaceholder: "https://demo.startup.com", category: "Standard" },
  { type: "address", label: "Physical Address", icon: MapPin, defaultLabel: "Registered Office Location", defaultPlaceholder: "Enter full address...", category: "Standard" },
  { type: "terms", label: "Terms & Conditions", icon: ShieldCheck, defaultLabel: "Compliance & Program Agreement", defaultPlaceholder: "I certify that all information submitted is accurate and true.", category: "Compliance" },
];

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
  const [reviewTab, setReviewTab] = useState("overview"); // 'overview' | 'custom' | 'documents' | 'team' | 'evaluation'
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
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [fieldModalForm, setFieldModalForm] = useState({
    id: "",
    key: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    description: "",
    options: [],
    gridCols: 1,
    section: "custom",
  });
  const [newOptionVal, setNewOptionVal] = useState("");
  const [formPreviewOpen, setFormPreviewOpen] = useState(false);

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
    phone: "",
  });

  // Mentor Assignment State
  const [showAssignMentorModal, setShowAssignMentorModal] = useState(false);
  const [targetAppForAssign, setTargetAppForAssign] = useState(null);
  const [selectedMentorIds, setSelectedMentorIds] = useState([]);
  const [savingMentorAssignment, setSavingMentorAssignment] = useState(false);
  const [reviewAssignedMentors, setReviewAssignedMentors] = useState([]);

  // 4. Infrastructure State
  const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableTimeSlots: [
      "09:00 AM - 11:00 AM",
      "11:30 AM - 01:30 PM",
      "02:30 PM - 04:30 PM",
      "05:00 PM - 07:00 PM",
    ],
    monthlyBookingLimit: 20,
    monthlyHoursLimit: 20,
    isFreeForNewProfiles: true,
    freeQuotaPerUser: 3,
    pricePerHour: 500,
  });
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("11:00");
  const [dayPreset, setDayPreset] = useState("weekdays");
  const [adminBookingsHistory, setAdminBookingsHistory] = useState([]);
  const [infraSubTab, setInfraSubTab] = useState("facilities"); // 'facilities' | 'bookings'

  // Time format converter: "14:30" -> "02:30 PM"
  const formatTime24To12 = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const minutes = m || "00";
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const handleAddSlot = () => {
    if (!newSlotStart || !newSlotEnd) {
      toast.warning("Please pick both start time and end time");
      return;
    }
    if (newSlotStart >= newSlotEnd) {
      toast.warning("Start time must be strictly before end time");
      return;
    }
    const formattedSlot = `${formatTime24To12(newSlotStart)} - ${formatTime24To12(newSlotEnd)}`;
    const currentSlots = Array.isArray(infraForm.availableTimeSlots) ? infraForm.availableTimeSlots : [];
    if (currentSlots.includes(formattedSlot)) {
      toast.info("This slot is already added");
      return;
    }
    setInfraForm({
      ...infraForm,
      availableTimeSlots: [...currentSlots, formattedSlot],
    });
    toast.success(`Slot added: ${formattedSlot}`);
  };

  const handleRemoveSlot = (slotToRemove) => {
    const currentSlots = Array.isArray(infraForm.availableTimeSlots) ? infraForm.availableTimeSlots : [];
    setInfraForm({
      ...infraForm,
      availableTimeSlots: currentSlots.filter((s) => s !== slotToRemove),
    });
  };

  const handleDayPresetChange = (preset) => {
    setDayPreset(preset);
    if (preset === "weekdays") {
      setInfraForm((prev) => ({ ...prev, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }));
    } else if (preset === "all_days") {
      setInfraForm((prev) => ({ ...prev, availableDays: [...ALL_DAYS] }));
    } else if (preset === "weekends") {
      setInfraForm((prev) => ({ ...prev, availableDays: ["Saturday", "Sunday"] }));
    } else if (preset === "six_days") {
      setInfraForm((prev) => ({ ...prev, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] }));
    }
  };

  const handleToggleDay = (day) => {
    const currentDays = Array.isArray(infraForm.availableDays) ? infraForm.availableDays : [];
    if (currentDays.includes(day)) {
      if (currentDays.length === 1) {
        toast.warning("Facility must have at least one active day");
        return;
      }
      setInfraForm((prev) => ({ ...prev, availableDays: currentDays.filter((d) => d !== day) }));
    } else {
      setInfraForm((prev) => ({ ...prev, availableDays: [...currentDays, day] }));
    }
    setDayPreset("custom");
  };

  const generatePresetSlots = (type) => {
    if (type === "2hour") {
      setInfraForm((prev) => ({
        ...prev,
        availableTimeSlots: [
          "09:00 AM - 11:00 AM",
          "11:30 AM - 01:30 PM",
          "02:30 PM - 04:30 PM",
          "05:00 PM - 07:00 PM",
        ],
      }));
      toast.success("Loaded standard 2-hour slots");
    } else if (type === "1hour") {
      setInfraForm((prev) => ({
        ...prev,
        availableTimeSlots: [
          "09:00 AM - 10:00 AM",
          "10:00 AM - 11:00 AM",
          "11:00 AM - 12:00 PM",
          "12:00 PM - 01:00 PM",
          "02:00 PM - 03:00 PM",
          "03:00 PM - 04:00 PM",
          "04:00 PM - 05:00 PM",
        ],
      }));
      toast.success("Loaded 1-hour slots preset");
    } else if (type === "fullday") {
      setInfraForm((prev) => ({
        ...prev,
        availableTimeSlots: [
          "09:00 AM - 01:00 PM",
          "02:00 PM - 06:00 PM",
        ],
      }));
      toast.success("Loaded half-day slots preset");
    }
  };


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

  // Fetch Registered Mentors
  const fetchMentors = async () => {
    try {
      const res = await axios.get("/incubation/admin/registered-mentors");
      if (res.data?.status === 1) {
        setMentorsList(res.data.mentors || []);
      }
    } catch (err) {
      console.error("fetchMentors error:", err);
    }
  };

  const handleOpenAssignModal = (app) => {
    setTargetAppForAssign(app);
    const existing = (app.assignedMentors || []).map((m) => (m?._id ? m._id : m));
    setSelectedMentorIds(existing);
    setShowAssignMentorModal(true);
  };

  const handleSaveMentorAssignment = async () => {
    if (!targetAppForAssign) return;
    setSavingMentorAssignment(true);
    try {
      const res = await axios.put(`/incubation/admin/applications/${targetAppForAssign._id}/assign-mentors`, {
        mentorIds: selectedMentorIds,
      });
      if (res.data?.status === 1) {
        toast.success(res.data.msg || "Mentors assigned successfully!");
        setShowAssignMentorModal(false);
        fetchApplications();
        fetchMentors();
      } else {
        toast.error(res.data?.msg || "Failed to assign mentors");
      }
    } catch (err) {
      console.error("handleSaveMentorAssignment error:", err);
      toast.error(err.response?.data?.msg || "Failed to assign mentors");
    } finally {
      setSavingMentorAssignment(false);
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
    if (activeTab === "applications") {
      fetchApplications();
      fetchMentors();
    }
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
        assignedMentors: reviewAssignedMentors,
      });
      if (res.data?.status === 1) {
        toast.success(`Application updated to ${newStatus}! Notification & Email sent to founder.`);
        setReviewModalOpen(false);
        fetchApplications();
        fetchMentors();
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

  // Open Add Field Modal
  const handleOpenAddField = (presetType = "text") => {
    const paletteItem = INCUBATION_FIELD_PALETTE.find((p) => p.type === presetType) || INCUBATION_FIELD_PALETTE[0];
    setEditingFieldIndex(null);
    setFieldModalForm({
      id: `f_${Date.now()}`,
      key: "",
      label: paletteItem.defaultLabel || "New Field",
      type: presetType,
      required: false,
      placeholder: paletteItem.defaultPlaceholder || "",
      description: "",
      options: paletteItem.defaultOptions ? [...paletteItem.defaultOptions] : [],
      gridCols: 1,
      section: "custom",
    });
    setNewOptionVal("");
    setShowFieldModal(true);
  };

  // Open Edit Field Modal
  const handleEditField = (idx) => {
    const field = formConfig.fields[idx];
    if (!field) return;
    setEditingFieldIndex(idx);
    setFieldModalForm({
      id: field.id || `f_${Date.now()}`,
      key: field.key || "",
      label: field.label || "",
      type: field.type || "text",
      required: Boolean(field.required),
      placeholder: field.placeholder || "",
      description: field.description || "",
      options: Array.isArray(field.options) ? [...field.options] : [],
      gridCols: field.gridCols || 1,
      section: field.section || "custom",
    });
    setNewOptionVal("");
    setShowFieldModal(true);
  };

  // Duplicate Field
  const handleDuplicateField = (idx) => {
    const field = formConfig.fields[idx];
    if (!field) return;
    const duplicated = {
      ...field,
      id: `f_${Date.now()}`,
      key: `${field.key}_copy_${Math.floor(100 + Math.random() * 900)}`,
      label: `${field.label} (Copy)`,
      order: formConfig.fields.length + 1,
    };
    const updated = [...formConfig.fields];
    updated.splice(idx + 1, 0, duplicated);
    setFormConfig({ ...formConfig, fields: updated });
    toast.success("Field duplicated");
  };

  // Move Field Up/Down
  const handleMoveField = (idx, direction) => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formConfig.fields.length) return;
    const updated = [...formConfig.fields];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    updated.forEach((f, i) => { f.order = i + 1; });
    setFormConfig({ ...formConfig, fields: updated });
  };

  // Options Manager in Modal
  const handleAddOption = () => {
    if (!newOptionVal.trim()) return;
    const trimmed = newOptionVal.trim();
    if (fieldModalForm.options.includes(trimmed)) {
      toast.warning("Option already exists");
      return;
    }
    setFieldModalForm({
      ...fieldModalForm,
      options: [...fieldModalForm.options, trimmed],
    });
    setNewOptionVal("");
  };

  const handleRemoveOption = (optIdx) => {
    const updated = fieldModalForm.options.filter((_, i) => i !== optIdx);
    setFieldModalForm({ ...fieldModalForm, options: updated });
  };

  // Save Modal Field
  const handleSaveFieldModal = (e) => {
    if (e) e.preventDefault();
    if (!fieldModalForm.label.trim()) {
      toast.error("Field label is required");
      return;
    }
    const autoKey = fieldModalForm.key.trim()
      ? fieldModalForm.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : fieldModalForm.label.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const finalField = {
      ...fieldModalForm,
      id: fieldModalForm.id || `f_${Date.now()}`,
      key: autoKey,
      label: fieldModalForm.label.trim(),
      options: ["select", "multiselect", "radio"].includes(fieldModalForm.type)
        ? fieldModalForm.options
        : [],
    };

    let updatedFields = [...formConfig.fields];
    if (editingFieldIndex !== null && editingFieldIndex >= 0) {
      updatedFields[editingFieldIndex] = finalField;
    } else {
      updatedFields.push({ ...finalField, order: updatedFields.length + 1 });
    }
    setFormConfig({ ...formConfig, fields: updatedFields });
    setShowFieldModal(false);
    toast.success(editingFieldIndex !== null ? "Field updated" : "Field added to form schema");
  };

  // Save / Update Infrastructure
  const handleSaveInfra = async (e) => {
    e.preventDefault();
    try {
      const days = Array.isArray(infraForm.availableDays)
        ? infraForm.availableDays
        : (infraForm.availableDays || "").split(",").map((s) => s.trim()).filter(Boolean);
      const slots = Array.isArray(infraForm.availableTimeSlots)
        ? infraForm.availableTimeSlots
        : (infraForm.availableTimeSlots || "").split(",").map((s) => s.trim()).filter(Boolean);

      if (infraForm.availabilityType !== "24_7" && days.length === 0) {
        toast.warning("Please select at least one active day for the facility");
        return;
      }
      if (infraForm.availabilityType !== "24_7" && slots.length === 0) {
        toast.warning("Please add at least one time slot for the facility");
        return;
      }

      const payload = {
        ...infraForm,
        amenities: typeof infraForm.amenities === "string"
          ? (infraForm.amenities || "").split(",").map((s) => s.trim()).filter(Boolean)
          : infraForm.amenities,
        availableDays: days,
        availableTimeSlots: slots,
        monthlyBookingLimit: Number(infraForm.monthlyBookingLimit) || 20,
        monthlyHoursLimit: Number(infraForm.monthlyHoursLimit) || 20,
        pricePerHour: Number(infraForm.pricePerHour) || 0,
        capacity: Number(infraForm.capacity) || 4,
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
                      <th className="pb-3">Assigned Mentors</th>
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
                        <td className="py-3.5">
                          {app.assignedMentors && app.assignedMentors.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {app.assignedMentors.map((m) => (
                                  <span
                                    key={m._id || m}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60"
                                  >
                                    <Users size={10} />
                                    {m.name || "Mentor"}
                                  </span>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(app)}
                                className="text-[10px] font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                              >
                                Edit ({app.assignedMentors.length} assigned)
                              </button>
                            </div>
                          ) : (app.status === "Accepted" || app.status === "Approved") ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
                            >
                              <Plus size={11} />
                              Assign Mentor
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Pending Approval</span>
                          )}
                        </td>
                        <td className="py-3.5 font-semibold">
                          ₹{app.monthlyFee || (app.incubationType === "physical" ? 5000 : 2500)}/mo
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {(app.status === "Accepted" || app.status === "Approved") && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(app)}
                                title="Assign or change mentor"
                                className="px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800/80 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/40 cursor-pointer flex items-center gap-1"
                              >
                                <Users size={12} />
                                <span>Mentor</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setNewStatus(app.status);
                                setReviewNotes(app.reviewNotes || "");
                                setReviewAssignedMentors((app.assignedMentors || []).map((m) => (m?._id ? m._id : m)));
                                setReviewModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                            >
                              Review &amp; Status
                            </button>
                          </div>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={20} className="text-teal-600" />
                  <span>Registered Mentors &amp; Incubation Advisory Roster</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mentors registered in the ecosystem during signup. Admins can assign these mentors to approved incubation startups.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMentorModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
              >
                <Plus size={14} />
                <span>Register New Mentor</span>
              </button>
            </div>

            {mentorsList.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Users size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-sm font-bold">No mentors found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Users who select &quot;Mentor&quot; during signup will automatically appear here. You can also click &quot;Register New Mentor&quot; above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentorsList.map((m) => (
                  <div
                    key={m._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-xs">
                            {m.avatarUrl && m.avatarUrl !== "/default_user.png" ? (
                              <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              m.name?.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.name}</h4>
                            <div className="text-[11px] text-teal-600 font-semibold truncate">{m.role || m.designation}</div>
                            <div className="text-[10px] text-slate-400 truncate">{m.company}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px] shrink-0">
                          <Star size={12} className="fill-amber-500" />
                          <span>{m.rating || 4.9}</span>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="flex flex-wrap gap-2 text-[10.5px] text-slate-500">
                        {m.email && (
                          <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-teal-600 truncate max-w-full">
                            <Mail size={11} className="shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </a>
                        )}
                        {m.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={11} className="shrink-0" />
                            <span>{m.phone}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">{m.bio}</p>

                      {/* Mentorship Domains */}
                      <div className="flex flex-wrap gap-1">
                        {(m.mentorshipDomains || m.expertiseAreas)?.slice(0, 4).map((area, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-[9.5px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                            {area}
                          </span>
                        ))}
                      </div>

                      {/* Assigned Startups Status */}
                      <div className="pt-2">
                        {m.assignedStartupsCount > 0 ? (
                          <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-200 text-[11px]">
                            <div className="font-bold flex items-center justify-between">
                              <span>Assigned to {m.assignedStartupsCount} Startup{m.assignedStartupsCount > 1 ? "s" : ""}:</span>
                              <span className="px-1.5 py-0.5 rounded bg-teal-600 text-white text-[9.5px] font-extrabold">Active Mentor</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {m.assignedStartups?.map((s) => (
                                <span key={s._id} className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/70 border border-teal-500/30 text-[10px] font-semibold text-teal-900 dark:text-teal-100">
                                  {s.companyName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-[10.5px] flex items-center justify-between">
                            <span>Not assigned to any startup yet</span>
                            <span className="text-[10px] text-teal-600 font-semibold">Available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]">
                      <a
                        href={`/connect/mentor/${m._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-bold"
                      >
                        <ExternalLink size={12} />
                        <span>View Profile</span>
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Remove mentor ${m.name} from roster?`)) {
                            await axios.delete(`/incubation/admin/mentors/${m._id}`);
                            fetchMentors();
                            toast.info("Mentor removed");
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 transition"
                        title="Remove mentor"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={20} className="text-teal-600" />
                  <span>Incubation Application Form Builder</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the official onboarding form fields required from startup founders and applicants.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenAddField("text")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-500/20 cursor-pointer transition"
                >
                  <Plus size={14} />
                  <span>Add Custom Field</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormPreviewOpen(!formPreviewOpen)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    formPreviewOpen
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Eye size={14} />
                  <span>{formPreviewOpen ? "Close Preview" : "Preview Form"}</span>
                </button>
                <button
                  type="button"
                  disabled={savingForm}
                  onClick={handleSaveForm}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm cursor-pointer disabled:opacity-50 transition"
                >
                  <Save size={14} />
                  <span>{savingForm ? "Saving..." : "Save Configuration"}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Palette Strip */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Add by Field Type:
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Click any type to configure &amp; insert
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INCUBATION_FIELD_PALETTE.map((p) => {
                  const IconComp = p.icon;
                  return (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => handleOpenAddField(p.type)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-300 text-xs font-medium hover:text-teal-600 transition cursor-pointer shadow-2xs"
                    >
                      <IconComp size={13} className="text-teal-600 shrink-0" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
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
                  placeholder="e.g. RealBell Startup Incubation & Cohort Application"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Cohort / Batch Name:</label>
                <input
                  type="text"
                  value={formConfig.cohortName}
                  onChange={(e) => setFormConfig({ ...formConfig, cohortName: e.target.value })}
                  placeholder="e.g. Cohort 2026-Q1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Incubation Center / Institution Name:</label>
                <input
                  type="text"
                  value={formConfig.centerName}
                  onChange={(e) => setFormConfig({ ...formConfig, centerName: e.target.value })}
                  placeholder="e.g. RealBell Vedic Council of Education Research & Training (Chandlai Hub)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Permanent Sections Note */}
            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
              <Sparkles size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Permanent Built-in Application Sections:</strong>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  1. <strong>Incubation Type</strong> (Physical vs Virtual) - mandatory selector.<br />
                  2. <strong>Business Details</strong> (Company Name, DIPP Number, CIN, Sector, Stage, Website, City, State, Pitch Summary).<br />
                  3. <strong>Team Members</strong> (Founder &amp; co-founders roster with roles, emails, contact info).
                </p>
              </div>
            </div>

            {/* Live Form Preview (Collapsible) */}
            {formPreviewOpen && (
              <div className="p-5 rounded-2xl border-2 border-teal-500/30 bg-teal-500/5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-teal-500/20">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-teal-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-teal-900 dark:text-teal-200">
                      Live Applicant Form Preview
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded font-mono">
                    Read-only preview
                  </span>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{formConfig.title || "Incubation Application"}</h4>
                    <p className="text-xs text-slate-500 mt-1">{formConfig.cohortName} · {formConfig.centerName}</p>
                  </div>

                  {formConfig.fields.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No dynamic fields added yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {formConfig.fields.map((f, fIdx) => (
                        <div key={f.id || fIdx} className={`space-y-1 ${f.gridCols === 2 ? "sm:col-span-2" : "sm:col-span-1"}`}>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {f.label} {f.required && <span className="text-rose-500">*</span>}
                          </label>
                          {f.description && <p className="text-[10.5px] text-slate-400">{f.description}</p>}

                          {f.type === "textarea" ? (
                            <textarea rows={2} readOnly placeholder={f.placeholder || "Enter text..."} className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs" />
                          ) : f.type === "select" ? (
                            <select disabled className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
                              <option>-- Select {f.label} --</option>
                              {f.options?.map((opt, oIdx) => <option key={oIdx}>{opt}</option>)}
                            </select>
                          ) : f.type === "multiselect" ? (
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                              {f.options?.map((opt, oIdx) => (
                                <span key={oIdx} className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : f.type === "radio" ? (
                            <div className="flex flex-wrap gap-3 p-2">
                              {f.options?.map((opt, oIdx) => (
                                <label key={oIdx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                  <input type="radio" disabled />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : f.type === "checkbox" || f.type === "terms" ? (
                            <label className="flex items-center gap-2 p-2 text-xs text-slate-700 dark:text-slate-300">
                              <input type="checkbox" disabled />
                              <span>{f.placeholder || f.label}</span>
                            </label>
                          ) : f.type === "file" || f.type === "image" ? (
                            <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-slate-400 text-xs">
                              <UploadCloud size={16} className="mx-auto mb-1 text-teal-600" />
                              <span>{f.placeholder || "Click or drag file to upload"}</span>
                            </div>
                          ) : (
                            <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} readOnly placeholder={f.placeholder || ""} className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Custom Fields List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Configured Dynamic Form Fields ({formConfig.fields.length})
                </h4>
                <button
                  type="button"
                  onClick={() => handleOpenAddField("text")}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Field</span>
                </button>
              </div>

              {formConfig.fields.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-2">
                  <Sliders size={28} className="mx-auto text-slate-400" />
                  <p className="font-bold">No custom dynamic fields configured yet.</p>
                  <p className="text-[11px] text-slate-400">Click any type in the quick palette above to add your first question or document upload.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formConfig.fields.map((field, idx) => {
                    const paletteItem = INCUBATION_FIELD_PALETTE.find((p) => p.type === field.type) || INCUBATION_FIELD_PALETTE[0];
                    const FieldIcon = paletteItem.icon;
                    return (
                      <div
                        key={field.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-teal-500/40 transition gap-3 text-xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                            {idx + 1}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {field.label}
                              </span>
                              {field.required && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                  Required
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20 uppercase">
                                {field.type}
                              </span>
                              {field.gridCols === 2 && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  Full Width
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <span>key: <strong>{field.key}</strong></span>
                              {field.placeholder && <span className="truncate max-w-[200px]">· placeholder: "{field.placeholder}"</span>}
                            </div>

                            {/* Options chips preview for choice fields */}
                            {["select", "multiselect", "radio"].includes(field.type) && Array.isArray(field.options) && field.options.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                <span className="text-[10px] text-slate-400">Options ({field.options.length}):</span>
                                {field.options.map((opt, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-sans"
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, "up")}
                            title="Move Up"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formConfig.fields.length - 1}
                            onClick={() => handleMoveField(idx, "down")}
                            title="Move Down"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditField(idx)}
                            title="Edit Field"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-600 cursor-pointer"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateField(idx)}
                            title="Duplicate Field"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formConfig.fields.filter((_, i) => i !== idx);
                              setFormConfig({ ...formConfig, fields: updated });
                              toast.info("Field removed");
                            }}
                            title="Delete Field"
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    setDayPreset("weekdays");
                    setNewSlotStart("09:00");
                    setNewSlotEnd("11:00");
                    setInfraForm({
                      title: "",
                      type: "meeting_room",
                      capacity: 4,
                      location: "Floor 1, Chandlai Center, Jaipur",
                      description: "",
                      amenities: "Wi-Fi 6, 4K Screen, Video Conferencing",
                      availabilityType: "specific_days",
                      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      availableTimeSlots: [
                        "09:00 AM - 11:00 AM",
                        "11:30 AM - 01:30 PM",
                        "02:30 PM - 04:30 PM",
                        "05:00 PM - 07:00 PM",
                      ],
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
                        <td className="py-2.5 font-mono font-bold text-teal-600">{b.bookingId}</td>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{b.user?.name || "Startup Founder"}</div>
                          <div className="text-[10px] text-slate-400">{b.user?.company_name || b.user?.email}</div>
                        </td>
                        <td className="py-2.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{b.facilityName}</span>
                          <span className="block text-[10px] text-slate-400 uppercase">{b.facilityType}</span>
                        </td>
                        <td className="py-2.5">
                          <div className="font-bold text-slate-900 dark:text-white">{b.date}</div>
                          <div className="text-[10px] text-teal-600 font-mono">{b.startTime} - {b.endTime}</div>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">{b.durationHours || 2} hrs</td>
                        <td className="py-2.5 text-slate-500 max-w-[160px] truncate" title={b.purpose}>{b.purpose}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {infraSubTab === "facilities" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Free Quota:</span>
                        <strong className="text-emerald-600 font-bold">{item.freeQuotaPerUser} Free Slots</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Rate:</span>
                        <strong className="text-slate-900 dark:text-white">₹{item.pricePerHour}/hr</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Schedule:</span>
                        <span className="font-semibold text-teal-600">
                          {item.availabilityType === "24_7"
                            ? "24/7 Access"
                            : `${(item.availableDays || []).length} Days • ${(item.availableTimeSlots || []).length} Slots`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          const loadedDays = Array.isArray(item.availableDays) && item.availableDays.length > 0
                            ? item.availableDays
                            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                          const loadedSlots = Array.isArray(item.availableTimeSlots) && item.availableTimeSlots.length > 0
                            ? item.availableTimeSlots
                            : [
                                "09:00 AM - 11:00 AM",
                                "11:30 AM - 01:30 PM",
                                "02:30 PM - 04:30 PM",
                                "05:00 PM - 07:00 PM",
                              ];
                          setEditingInfraId(item._id);
                          setDayPreset("custom");
                          setNewSlotStart("09:00");
                          setNewSlotEnd("11:00");
                          setInfraForm({
                            title: item.title,
                            type: item.type,
                            capacity: item.capacity || 4,
                            location: item.location || "",
                            description: item.description || "",
                            amenities: Array.isArray(item.amenities) ? item.amenities.join(", ") : (item.amenities || ""),
                            availabilityType: item.availabilityType || "specific_days",
                            availableDays: loadedDays,
                            availableTimeSlots: loadedSlots,
                            monthlyBookingLimit: item.monthlyBookingLimit || 20,
                            monthlyHoursLimit: item.monthlyHoursLimit || 20,
                            isFreeForNewProfiles: item.isFreeForNewProfiles !== false,
                            freeQuotaPerUser: item.freeQuotaPerUser || 3,
                            pricePerHour: item.pricePerHour || 0,
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
            )}
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
            <div className="w-full max-w-4xl rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-200 dark:border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                      {selectedApp.applicationId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedApp.businessDetails?.companyName || selectedApp.user?.company_name || "Startup Application"}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      selectedApp.incubationType === "virtual"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-teal-500/10 text-teal-600 border-teal-500/20"
                    }`}>
                      {selectedApp.incubationType} Incubation
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedApp.status === "Accepted"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : selectedApp.status === "Rejected"
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Submitted by: <strong>{selectedApp.user?.name}</strong> ({selectedApp.user?.email}) · Applied: {new Date(selectedApp.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
                {[
                  { id: "overview", label: "Business Details", icon: Building2 },
                  {
                    id: "custom",
                    label: `Custom Responses (${Object.keys(selectedApp.customResponses || {}).length})`,
                    icon: Sparkles,
                  },
                  {
                    id: "documents",
                    label: `Documents (${selectedApp.documents?.length || 0})`,
                    icon: UploadCloud,
                  },
                  {
                    id: "team",
                    label: `Team Roster (${selectedApp.teamMembers?.length || 0})`,
                    icon: Users,
                  },
                  {
                    id: "evaluation",
                    label: `Evaluation & Status (${selectedApp.feedbackMessages?.length || 0})`,
                    icon: ShieldCheck,
                  },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = reviewTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReviewTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-teal-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <TabIcon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: BUSINESS & FOUNDER OVERVIEW */}
              {reviewTab === "overview" && (
                <div className="space-y-4">
                  {/* Founder Details Card */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-500">Applicant Founder Profile</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="block text-[10.5px] text-slate-400">Founder Name:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.user?.name || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="block text-[10.5px] text-slate-400">Official Email:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.user?.email || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="block text-[10.5px] text-slate-400">Contact Phone:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.user?.phone || selectedApp.teamMembers?.[0]?.phone || "N/A"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Business Details Grid */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-500">Registered Business Information</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Startup / Entity Name:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.businessDetails?.companyName || selectedApp.user?.company_name || "N/A"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">DPIIT Recognition Number:</span>
                        <strong className="font-mono text-emerald-600 font-bold">{selectedApp.businessDetails?.dippNumber || "Not Registered"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">CIN / Registration Number:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedApp.businessDetails?.cinNumber || "N/A"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Sector / Industry:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.businessDetails?.sector || "General Tech"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Current Stage:</span>
                        <strong className="text-teal-600">{selectedApp.businessDetails?.stage || "Early Stage"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Registered City &amp; State:</span>
                        <strong className="text-slate-900 dark:text-white">
                          {[selectedApp.businessDetails?.city, selectedApp.businessDetails?.state].filter(Boolean).join(", ") || "N/A"}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Website / Public Link:</span>
                        {selectedApp.businessDetails?.website ? (
                          <a
                            href={selectedApp.businessDetails.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline flex items-center gap-1 font-semibold truncate"
                          >
                            <span>{selectedApp.businessDetails.website}</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400">None Provided</span>
                        )}
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Target Market / Audience:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.businessDetails?.targetMarket || "N/A"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                        <span className="block text-[10.5px] text-slate-400">Annual Revenue / Runway:</span>
                        <strong className="text-slate-900 dark:text-white">{selectedApp.businessDetails?.annualRevenue || "Pre-revenue"}</strong>
                      </div>
                    </div>

                    {/* Pitch Summary */}
                    {selectedApp.businessDetails?.pitchSummary && (
                      <div className="pt-2">
                        <span className="block text-[10.5px] font-bold text-slate-400 mb-1 uppercase">Executive Pitch Summary:</span>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {selectedApp.businessDetails.pitchSummary}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: DYNAMIC CUSTOM FORM RESPONSES */}
              {reviewTab === "custom" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-200 flex items-center justify-between">
                    <span>
                      Dynamic responses submitted for <strong>{selectedApp.form?.title || formConfig.title || "Incubation Onboarding Form"}</strong>.
                    </span>
                    <span className="font-mono font-bold bg-teal-600 text-white px-2 py-0.5 rounded text-[10px]">
                      {Object.keys(selectedApp.customResponses || {}).length} Fields Answered
                    </span>
                  </div>

                  {Object.keys(selectedApp.customResponses || {}).length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      No custom questionnaire responses recorded for this application.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(() => {
                        const activeFormFields = (selectedApp.form?.fields?.length ? selectedApp.form.fields : formConfig.fields) || [];
                        const knownKeys = new Set(activeFormFields.map((f) => f.key));
                        const responses = selectedApp.customResponses || {};
                        const extraKeys = Object.keys(responses).filter((k) => !knownKeys.has(k));

                        return (
                          <>
                            {activeFormFields.map((f, idx) => {
                              const val = responses[f.key];
                              const hasVal = val !== undefined && val !== null && val !== "";
                              const isFile = f.type === "file" || f.type === "image" || (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://")));

                              return (
                                <div
                                  key={f.id || idx}
                                  className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 ${
                                    f.gridCols === 2 ? "sm:col-span-2" : "sm:col-span-1"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                                      {f.label}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                      {f.type}
                                    </span>
                                  </div>

                                  {!hasVal ? (
                                    <div className="text-slate-400 italic text-[11px]">Not Provided / Blank</div>
                                  ) : isFile ? (
                                    <div className="flex items-center gap-2 pt-0.5">
                                      <a
                                        href={val}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                                      >
                                        <ExternalLink size={12} />
                                        <span>View / Download Attachment</span>
                                      </a>
                                    </div>
                                  ) : Array.isArray(val) ? (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {val.map((item, vIdx) => (
                                        <span
                                          key={vIdx}
                                          className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-500/20 text-[11px] font-medium"
                                        >
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  ) : f.type === "checkbox" || f.type === "terms" ? (
                                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                      val ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-slate-100 text-slate-400"
                                    }`}>
                                      {val ? "✓ Confirmed & Agreed" : "✗ Not Agreed"}
                                    </span>
                                  ) : (
                                    <div className="text-slate-800 dark:text-slate-200 text-xs font-medium whitespace-pre-wrap p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                      {String(val)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Any additional responses outside current form schema */}
                            {extraKeys.map((key) => {
                              const val = responses[key];
                              const isFile = typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));
                              return (
                                <div key={key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 sm:col-span-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-xs capitalize">
                                      {key.replace(/_/g, " ")}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                      Custom
                                    </span>
                                  </div>
                                  {isFile ? (
                                    <a
                                      href={val}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                                    >
                                      <ExternalLink size={12} />
                                      <span>View Attachment</span>
                                    </a>
                                  ) : (
                                    <div className="text-slate-800 dark:text-slate-200 text-xs font-medium p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                      {String(val)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 3: UPLOADED DOCUMENTS VAULT */}
              {reviewTab === "documents" && (
                <div className="space-y-4">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Verified Documents &amp; Attachments
                  </div>

                  {!selectedApp.documents || selectedApp.documents.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      No document files uploaded directly to this application.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedApp.documents.map((doc, dIdx) => (
                        <div
                          key={dIdx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {doc.fileName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {doc.fieldLabel || doc.fieldKey} · {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "Uploaded"} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}
                              </div>
                            </div>
                          </div>

                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            <Download size={13} />
                            <span>View / Download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 4: TEAM ROSTER */}
              {reviewTab === "team" && (
                <div className="space-y-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Incubatee Team Members ({selectedApp.teamMembers?.length || 0})
                  </div>

                  {!selectedApp.teamMembers || selectedApp.teamMembers.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      No team members recorded.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedApp.teamMembers.map((t, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 dark:text-white font-bold text-xs">{t.name}</strong>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {t.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            {t.email && <div>Email: {t.email}</div>}
                            {t.phone && <div>Phone: {t.phone}</div>}
                            {t.linkedin && (
                              <div>
                                <a href={t.linkedin} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                                  LinkedIn Profile
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 5: EVALUATION & COMMUNICATION */}
              {reviewTab === "evaluation" && (
                <div className="space-y-4">
                  {/* Status Updater */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Decision &amp; Incubation Status
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Set Application Status:</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                      >
                        <option value="Draft">Draft</option>
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
                          <li>
                            Activate a <strong>{(selectedApp.incubationType === "virtual" ? incubationSettings.virtualTrialDays : incubationSettings.physicalTrialDays) || (selectedApp.incubationType === "virtual" ? 30 : 14)}-day free trial</strong> for {selectedApp.incubationType?.toUpperCase()} Incubation.
                          </li>
                          <li>
                            Set next monthly fee to <strong>₹{selectedApp.incubationType === "physical" ? incubationSettings.physicalMonthlyFee : incubationSettings.virtualMonthlyFee}/mo</strong>.
                          </li>
                          <li>Send an immediate notification &amp; confirmation email to <strong>{selectedApp.user?.email}</strong>.</li>
                        </ul>
                      </div>
                    )}

                    {/* Assigned Mentors Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Users size={14} className="text-teal-600" />
                          <span>Assign Registered Mentors:</span>
                        </label>
                        <span className="text-[11px] font-semibold text-teal-600">
                          {reviewAssignedMentors.length} selected
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Select one or more registered mentors to guide this startup. Admins can assign the same mentor across multiple incubations.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        {mentorsList.length === 0 ? (
                          <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                            No registered mentors found in the database.
                          </div>
                        ) : (
                          mentorsList.map((m) => {
                            const isSelected = reviewAssignedMentors.includes(m._id);
                            return (
                              <div
                                key={m._id}
                                onClick={() => {
                                  setReviewAssignedMentors((prev) =>
                                    isSelected ? prev.filter((id) => id !== m._id) : [...prev, m._id]
                                  );
                                }}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                                  isSelected
                                    ? "border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-semibold"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold truncate text-[11.5px]">{m.name}</div>
                                  <div className="text-[10px] text-teal-600 dark:text-teal-400 truncate">{m.role || m.designation}</div>
                                  <div className="text-[9.5px] text-slate-400 truncate">{m.company} · {m.assignedStartupsCount || 0} startups guided</div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Internal Committee Review Notes:</label>
                      <textarea
                        rows={2}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Internal committee notes, scoring, or feedback..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(selectedApp._id)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatus ? "Saving..." : "Save Status & Review Notes"}
                      </button>
                    </div>
                  </div>

                  {/* Messaging Thread */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Direct Feedback &amp; Messaging to Founder
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      {selectedApp.feedbackMessages?.length === 0 ? (
                        <div className="text-slate-400 text-center py-3">No messages yet. Send feedback or queries to the founder below.</div>
                      ) : (
                        selectedApp.feedbackMessages?.map((m, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl text-xs ${
                              m.senderRole === "admin"
                                ? "bg-teal-500/10 text-teal-900 dark:text-teal-200 ml-4"
                                : "bg-blue-500/10 text-blue-900 dark:text-blue-200 mr-4"
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span>{m.senderName} ({m.senderRole})</span>
                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <div className="mt-1 font-medium">{m.message}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write feedback message to applicant..."
                        value={adminFeedbackMsg}
                        onChange={(e) => setAdminFeedbackMsg(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendFeedback(selectedApp._id)}
                        className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold cursor-pointer hover:bg-teal-700 transition"
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD / EDIT DYNAMIC FIELD MODAL */}
        {showFieldModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative max-h-[92vh] overflow-y-auto text-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold">
                    {editingFieldIndex !== null ? "Edit Form Field" : "Add Custom Form Field"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Define the question label, type, input parameters, and validation rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFieldModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFieldModal} className="space-y-4">
                {/* Field Type Selector */}
                <div>
                  <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                    Field Input Type:
                  </label>
                  <select
                    value={fieldModalForm.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const paletteItem = INCUBATION_FIELD_PALETTE.find((p) => p.type === newType);
                      setFieldModalForm({
                        ...fieldModalForm,
                        type: newType,
                        placeholder: paletteItem?.defaultPlaceholder || fieldModalForm.placeholder,
                        options: paletteItem?.defaultOptions && (!fieldModalForm.options || fieldModalForm.options.length === 0)
                          ? [...paletteItem.defaultOptions]
                          : fieldModalForm.options,
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  >
                    {INCUBATION_FIELD_PALETTE.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.label} ({p.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field Label & Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Field Label / Question <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fieldModalForm.label}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        const autoKey = newLabel.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                        setFieldModalForm({
                          ...fieldModalForm,
                          label: newLabel,
                          key: editingFieldIndex !== null && fieldModalForm.key ? fieldModalForm.key : autoKey,
                        });
                      }}
                      placeholder="e.g. Upload Pitch Deck (PDF)"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Field Key / Identifier <span className="text-slate-400 font-normal">(auto-slug)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fieldModalForm.key}
                      onChange={(e) => setFieldModalForm({ ...fieldModalForm, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                      placeholder="e.g. pitch_deck"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Placeholder & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Placeholder Text:
                    </label>
                    <input
                      type="text"
                      value={fieldModalForm.placeholder}
                      onChange={(e) => setFieldModalForm({ ...fieldModalForm, placeholder: e.target.value })}
                      placeholder="e.g. https://demo.startup.com"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Section Category:
                    </label>
                    <select
                      value={fieldModalForm.section}
                      onChange={(e) => setFieldModalForm({ ...fieldModalForm, section: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="custom">Custom Questionnaire</option>
                      <option value="business">Business Details</option>
                      <option value="team">Team &amp; Personnel</option>
                      <option value="legal">Compliance &amp; Documents</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Help Text / Description <span className="text-slate-400 font-normal">(guidance for founder)</span>:
                  </label>
                  <input
                    type="text"
                    value={fieldModalForm.description}
                    onChange={(e) => setFieldModalForm({ ...fieldModalForm, description: e.target.value })}
                    placeholder="e.g. Upload PDF version max 25MB with traction and market figures."
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Layout and Validation Toggles */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldModalForm.required}
                      onChange={(e) => setFieldModalForm({ ...fieldModalForm, required: e.target.checked })}
                      className="rounded text-teal-600"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Mandatory / Required Field</span>
                  </label>

                  <div>
                    <label className="block font-bold mb-0.5 text-slate-700 dark:text-slate-300">
                      Grid Column Span:
                    </label>
                    <select
                      value={fieldModalForm.gridCols}
                      onChange={(e) => setFieldModalForm({ ...fieldModalForm, gridCols: Number(e.target.value) })}
                      className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value={1}>Half Width (1 Column)</option>
                      <option value={2}>Full Width (2 Columns)</option>
                    </select>
                  </div>
                </div>

                {/* Options Manager (for select, multiselect, radio) */}
                {["select", "multiselect", "radio"].includes(fieldModalForm.type) && (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">
                      Configured Selection Options ({fieldModalForm.options?.length || 0}):
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type option name (e.g. Pre-Seed)..."
                        value={newOptionVal}
                        onChange={(e) => setNewOptionVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                        className="flex-1 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(!fieldModalForm.options || fieldModalForm.options.length === 0) ? (
                        <span className="text-[11px] text-slate-400 italic">No options added yet. Type an option above and click Add.</span>
                      ) : (
                        fieldModalForm.options.map((opt, optIdx) => (
                          <span
                            key={optIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium"
                          >
                            <span>{opt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(optIdx)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer ml-0.5"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowFieldModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer shadow-xs"
                  >
                    {editingFieldIndex !== null ? "Save Field Changes" : "Insert Field to Schema"}
                  </button>
                </div>
              </form>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">Email *:</label>
                    <input
                      type="email"
                      required
                      placeholder="mentor@realbell.org"
                      value={mentorForm.email}
                      onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Phone:</label>
                    <input
                      type="text"
                      placeholder="+91..."
                      value={mentorForm.phone}
                      onChange={(e) => setMentorForm({ ...mentorForm, phone: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
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
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold">Register Mentor</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STANDALONE MENTOR ASSIGNMENT MODAL */}
        {showAssignMentorModal && targetAppForAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-teal-600" />
                    <span>Assign Mentors to Startup</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Target Startup: <strong className="text-slate-900 dark:text-white">{targetAppForAssign.businessDetails?.companyName || targetAppForAssign.user?.company_name || targetAppForAssign.applicationId}</strong> ({targetAppForAssign.applicationId})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignMentorModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Registered Mentors ({selectedMentorIds.length} Selected):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMentorIds.length === mentorsList.length) setSelectedMentorIds([]);
                      else setSelectedMentorIds(mentorsList.map((m) => m._id));
                    }}
                    className="text-[11px] text-teal-600 font-semibold hover:underline"
                  >
                    {selectedMentorIds.length === mentorsList.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  {mentorsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No registered mentors found in the database.
                    </div>
                  ) : (
                    mentorsList.map((m) => {
                      const isChecked = selectedMentorIds.includes(m._id);
                      return (
                        <div
                          key={m._id}
                          onClick={() => {
                            setSelectedMentorIds((prev) =>
                              isChecked ? prev.filter((id) => id !== m._id) : [...prev, m._id]
                            );
                          }}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                            isChecked
                              ? "border-teal-500 bg-teal-500/10 dark:bg-teal-950/40"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-1 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-xs">
                            {m.avatarUrl && m.avatarUrl !== "/default_user.png" ? (
                              <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              m.name?.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{m.name}</h4>
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {m.assignedStartupsCount || 0} active startups
                              </span>
                            </div>
                            <div className="text-[11px] text-teal-600 font-semibold">{m.role || m.designation} · {m.company}</div>
                            <div className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">{m.bio}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(m.mentorshipDomains || m.expertiseAreas)?.slice(0, 3).map((area, idx) => (
                                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[10.5px] text-slate-400">
                  Admins can assign the same mentor to multiple startups.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignMentorModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingMentorAssignment}
                    onClick={handleSaveMentorAssignment}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {savingMentorAssignment ? "Saving..." : "Save Assigned Mentors"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD / EDIT INFRASTRUCTURE MODAL */}
        {showInfraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative text-xs space-y-3.5">
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
                <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                      <Clock size={14} className="text-teal-600" />
                      <span>Availability &amp; Time Slots Schedule</span>
                    </div>
                    <span className="text-[10.5px] text-teal-700 dark:text-teal-300 font-medium">
                      {infraForm.availabilityType === "24_7"
                        ? "Open 24/7"
                        : `${(infraForm.availableDays || []).length} Days • ${(infraForm.availableTimeSlots || []).length} Slots`}
                    </span>
                  </div>
                  
                  {/* Mode & Days Select Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1">Availability Mode:</label>
                      <select
                        value={infraForm.availabilityType}
                        onChange={(e) => setInfraForm({ ...infraForm, availabilityType: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                      >
                        <option value="specific_days">Specific Days &amp; Time Slots</option>
                        <option value="time_slots">Strict Time Slots Schedule</option>
                        <option value="24_7">24/7 Access (Always Open)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Schedule Preset (Days):</label>
                      <select
                        disabled={infraForm.availabilityType === "24_7"}
                        value={dayPreset}
                        onChange={(e) => handleDayPresetChange(e.target.value)}
                        className={`w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium ${
                          infraForm.availabilityType === "24_7" ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="weekdays">Monday to Friday (Weekdays)</option>
                        <option value="six_days">Monday to Saturday (6 Days)</option>
                        <option value="all_days">All 7 Days (Mon - Sun)</option>
                        <option value="weekends">Weekends Only (Sat - Sun)</option>
                        <option value="custom">Custom Days Selection</option>
                      </select>
                    </div>
                  </div>

                  {/* Day Picker Pills / Select Box */}
                  {infraForm.availabilityType !== "24_7" && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          Active Operating Days:
                        </span>
                        <span className="text-teal-600 font-bold">
                          {(infraForm.availableDays || []).length} / 7 Days Active
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_DAYS.map((day) => {
                          const isActive = (infraForm.availableDays || []).includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleToggleDay(day)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                isActive
                                  ? "bg-teal-600 text-white shadow-xs"
                                  : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400"
                              }`}
                            >
                              {isActive && <Check size={11} />}
                              <span>{day.substring(0, 3)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Time Slots Configuration via Time Inputs */}
                  {infraForm.availabilityType !== "24_7" && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Clock size={12} className="text-teal-600" />
                          <span>Configure Time Slots:</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => generatePresetSlots("2hour")}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            + 2-Hr Preset
                          </button>
                          <button
                            type="button"
                            onClick={() => generatePresetSlots("1hour")}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            + 1-Hr Preset
                          </button>
                          {infraForm.availableTimeSlots?.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setInfraForm({ ...infraForm, availableTimeSlots: [] })}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Time Input Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <span className="block text-[10px] text-slate-400 mb-0.5">Start Time:</span>
                          <input
                            type="time"
                            value={newSlotStart}
                            onChange={(e) => setNewSlotStart(e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                          />
                        </div>
                        <span className="text-slate-400 pt-3">to</span>
                        <div className="flex-1">
                          <span className="block text-[10px] text-slate-400 mb-0.5">End Time:</span>
                          <input
                            type="time"
                            value={newSlotEnd}
                            onChange={(e) => setNewSlotEnd(e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                          />
                        </div>
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={handleAddSlot}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-xs"
                          >
                            + Add Slot
                          </button>
                        </div>
                      </div>

                      {/* Configured Slots Badges */}
                      <div className="pt-1">
                        <div className="text-[10px] text-slate-400 mb-1">
                          Active Slots ({infraForm.availableTimeSlots?.length || 0}):
                        </div>
                        {(!infraForm.availableTimeSlots || infraForm.availableTimeSlots.length === 0) ? (
                          <div className="p-2 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[11px]">
                            No time slots added. Use time inputs above or click a preset.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                            {infraForm.availableTimeSlots.map((slot, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-500/30 text-[11px] font-mono font-medium"
                              >
                                <Clock size={11} className="text-teal-600" />
                                <span>{slot}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(slot)}
                                  className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                                  title="Remove slot"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Monthly Limits */}
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

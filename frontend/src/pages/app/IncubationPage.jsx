import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import { toast } from "react-toastify";
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
  Check,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Layers,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Calendar,
  Lock,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  Video,
  Star,
  Timer,
  AlertTriangle,
  Laptop,
  CheckCircle,
  XCircle,
  ChevronLeft,
  UploadCloud,
  Link2,
  Globe,
  Mail,
  Phone,
} from "lucide-react";

export default function IncubationPage() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") || "view-application";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // 1. Application & Form State
  const [formSchema, setFormSchema] = useState(null);
  const [settings, setSettings] = useState(null);
  const [myApp, setMyApp] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Form Fields State (Requires Incubation Type & Team Members)
  const [incubationType, setIncubationType] = useState("physical"); // 'physical' | 'virtual'
  const [businessDetails, setBusinessDetails] = useState({
    companyName: user?.company_name || "",
    dippNumber: "",
    cinNumber: "",
    sector: "EdTech & Education",
    stage: "Early Stage",
    website: "",
    pitchSummary: "",
    city: "Jaipur",
    state: "Rajasthan",
  });

  const [teamMembers, setTeamMembers] = useState([
    { name: user?.name || "Lead Founder", role: "Founder & CEO", email: user?.email || "", phone: user?.phone || "", linkedin: "", isLead: true },
  ]);

  const [customResponses, setCustomResponses] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  // Messaging Thread State
  const [founderReplyMsg, setFounderReplyMsg] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // 2. Mentorship State
  const [mentors, setMentors] = useState([]);
  const [myMentorSessions, setMyMentorSessions] = useState([]);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [sessionDate, setSessionDate] = useState("2026-09-08");
  const [sessionTime, setSessionTime] = useState("04:00 PM - 04:45 PM");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [bookingMentor, setBookingMentor] = useState(false);

  // 3. Infrastructure & Calendar State
  const [infrastructureList, setInfrastructureList] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("All");
  const [selectedFacility, setSelectedFacility] = useState(null);

  // Calendar State for Slot Booking
  const todayStr = new Date().toISOString().split("T")[0];
  const [calendarDate, setCalendarDate] = useState(todayStr);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [attendeesCount, setAttendeesCount] = useState(2);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [slotBookingMode, setSlotBookingMode] = useState("preset"); // 'preset' | 'custom'
  const [customStartTime, setCustomStartTime] = useState("09:00");
  const [customEndTime, setCustomEndTime] = useState("11:00");
  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [slotAvailabilityMeta, setSlotAvailabilityMeta] = useState({
    dayName: "",
    isDayOpen: true,
    availableDays: [],
    availabilityType: "specific_days",
  });

  const formatTime24To12 = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const minutes = m || "00";
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const calculateHoursBetween = (start24, end24) => {
    if (!start24 || !end24) return 2;
    const [sh, sm] = start24.split(":").map(Number);
    const [eh, em] = end24.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return 2;
    return Math.round((diff / 60) * 10) / 10;
  };

  const handleSelectDayOfWeek = (targetDayName) => {
    setSelectedDayFilter(targetDayName);
    if (!targetDayName) return;
    const curr = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.getTime() + i * 24 * 60 * 60 * 1000);
      const dName = d.toLocaleDateString("en-US", { weekday: "long" });
      if (dName.toLowerCase() === targetDayName.toLowerCase()) {
        setCalendarDate(d.toISOString().split("T")[0]);
        break;
      }
    }
  };

  const jumpToNextAvailableDay = () => {
    if (!slotAvailabilityMeta.availableDays || slotAvailabilityMeta.availableDays.length === 0) return;
    const curr = new Date(calendarDate + "T00:00:00");
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(curr.getTime() + i * 24 * 60 * 60 * 1000);
      const day = nextDate.toLocaleDateString("en-US", { weekday: "long" });
      if (slotAvailabilityMeta.availableDays.includes(day)) {
        setCalendarDate(nextDate.toISOString().split("T")[0]);
        break;
      }
    }
  };

  const handleApplyCustomTime = () => {
    if (!customStartTime || !customEndTime) {
      toast.warning("Please enter start time and end time");
      return;
    }
    if (customStartTime >= customEndTime) {
      toast.warning("Start time must be before end time");
      return;
    }
    const formattedStart = formatTime24To12(customStartTime);
    const formattedEnd = formatTime24To12(customEndTime);
    const duration = calculateHoursBetween(customStartTime, customEndTime);

    const hasCollision = availableSlots.some(
      (s) => s.isBooked && (s.startTime === formattedStart || s.endTime === formattedEnd)
    );
    if (hasCollision) {
      toast.error("The selected custom time overlaps with an existing reserved slot on this date.");
      return;
    }

    setSelectedSlot({
      slot: `${formattedStart} - ${formattedEnd}`,
      startTime: formattedStart,
      endTime: formattedEnd,
      durationHours: duration,
      isAvailable: slotAvailabilityMeta.isDayOpen,
    });
    toast.success(`Selected time: ${formattedStart} - ${formattedEnd} (${duration} hrs)`);
  };

  // 4. Attendance State
  const [attendanceData, setAttendanceData] = useState({
    logs: [],
    todayRecord: null,
    isCheckedIn: false,
    stats: { daysPresent: 0, compliancePercent: 0, avgHoursPerDay: 0 },
  });
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // 5. Accounting & Payment State
  const [accountingData, setAccountingData] = useState({
    invoices: [],
    statement: { totalGross: 0, totalSubsidy: 0, totalNetDue: 0, status: "Loading..." },
    subscription: { status: "none", dueDate: null, trialEndsAt: null, monthlyFee: 5000, incubationType: "physical", isOverdue: false },
  });
  const [payingDues, setPayingDues] = useState(false);

  // Live Real-Time Countdown State (Days : Hours : Minutes : Seconds)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false, totalRemainingMs: 0 });

  // Approval & Overdue Status Helpers
  const isApproved = myApp && (myApp.status === "Accepted" || myApp.status === "Approved");
  const hasSubmitted = !!myApp && myApp.status !== "Draft";
  const appType = myApp?.incubationType || incubationType || "physical";
  const isOverdue = countdown.isOverdue || (myApp?.dueDate && new Date() > new Date(myApp.dueDate) && myApp?.subscriptionStatus !== "active");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Real-Time Countdown Timer Interval
  useEffect(() => {
    if (!myApp?.dueDate) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(myApp.dueDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: myApp.subscriptionStatus !== "active", totalRemainingMs: 0 });
      } else {
        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setCountdown({ days, hours, minutes, seconds, isOverdue: false, totalRemainingMs: diff });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [myApp?.dueDate, myApp?.subscriptionStatus]);

  // Load Initial Application & Form
  const loadApplicationData = async () => {
    try {
      setLoading(true);
      const [formRes, appRes] = await Promise.all([
        axios.get("/incubation/form"),
        axios.get("/incubation/my-application"),
      ]);

      if (formRes.data?.status === 1) {
        setFormSchema(formRes.data.form);
        setSettings(formRes.data.settings);
      }

      if (appRes.data?.status === 1 && appRes.data.application) {
        const app = appRes.data.application;
        setMyApp(app);
        if (app.incubationType) setIncubationType(app.incubationType);
        if (app.businessDetails) setBusinessDetails(app.businessDetails);
        if (app.teamMembers?.length > 0) setTeamMembers(app.teamMembers);
        if (app.customResponses) setCustomResponses(app.customResponses);
      } else {
        setIsEditingForm(true);
      }
    } catch (err) {
      console.error("loadApplicationData error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Mentors
  const loadMentors = async () => {
    try {
      const [mentorsRes, sessionsRes] = await Promise.all([
        axios.get("/incubation/mentors"),
        axios.get("/incubation/my-mentor-sessions"),
      ]);
      if (mentorsRes.data?.status === 1) setMentors(mentorsRes.data.mentors || []);
      if (sessionsRes.data?.status === 1) setMyMentorSessions(sessionsRes.data.sessions || []);
    } catch (err) {
      console.error("loadMentors error:", err);
    }
  };

  // Load Infrastructure
  const loadInfrastructure = async () => {
    try {
      const [infraRes, bookingsRes] = await Promise.all([
        axios.get("/incubation/infrastructure"),
        axios.get("/incubation/my-bookings"),
      ]);
      if (infraRes.data?.status === 1) {
        const list = infraRes.data.infrastructure || [];
        setInfrastructureList(list);
        if (!selectedFacility && list.length > 0) {
          setSelectedFacility(list[0]);
        }
      }
      if (bookingsRes.data?.status === 1) setMyBookings(bookingsRes.data.bookings || []);
    } catch (err) {
      console.error("loadInfrastructure error:", err);
    }
  };

  // Load Slots for Facility on Calendar Date
  const loadFacilitySlots = async (facilityId, date) => {
    if (!facilityId || !date) return;
    try {
      setLoadingSlots(true);
      const res = await axios.get("/incubation/infrastructure/availability", {
        params: { infrastructureId: facilityId, date },
      });
      if (res.data?.status === 1) {
        setAvailableSlots(res.data.slots || []);
        setSlotAvailabilityMeta({
          dayName: res.data.dayName || "",
          isDayOpen: res.data.isDayOpen !== false,
          availableDays: res.data.availableDays || [],
          availabilityType: res.data.availabilityType || "specific_days",
        });
        setSelectedSlot(null);
      }
    } catch (err) {
      console.error("loadFacilitySlots error:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedFacility && calendarDate) {
      loadFacilitySlots(selectedFacility._id, calendarDate);
    }
  }, [selectedFacility, calendarDate]);

  // Load Attendance
  const loadAttendance = async () => {
    try {
      const res = await axios.get("/incubation/attendance/my-logs");
      if (res.data?.status === 1) {
        setAttendanceData(res.data);
      }
    } catch (err) {
      console.error("loadAttendance error:", err);
    }
  };

  // Load Accounting
  const loadAccounting = async () => {
    try {
      const res = await axios.get("/incubation/accounting");
      if (res.data?.status === 1) {
        setAccountingData(res.data);
      }
    } catch (err) {
      console.error("loadAccounting error:", err);
    }
  };

  useEffect(() => {
    loadApplicationData();
  }, []);

  useEffect(() => {
    if (activeTab === "mentor-support" && isApproved) loadMentors();
    else if (activeTab === "infrastructure-booking" && isApproved && appType === "physical") loadInfrastructure();
    else if (activeTab === "attendance" && isApproved) loadAttendance();
    else if (activeTab === "payment") loadAccounting();
  }, [activeTab, isApproved, appType]);

  // Submit Application Form (Draft or Final)
  const handleSubmitApplication = async (isDraft = false) => {
    if (!isDraft) {
      if (!incubationType) {
        toast.error("Please select Incubation Type (Physical or Virtual)");
        return;
      }
      if (!businessDetails.companyName.trim()) {
        toast.error("Please enter your startup / company name");
        return;
      }
      if (!teamMembers || teamMembers.length === 0 || !teamMembers[0].name.trim()) {
        toast.error("At least one team member is required");
        return;
      }
    }

    try {
      setSubmittingApp(true);
      const formData = new FormData();
      formData.append("isDraft", String(isDraft));
      formData.append("incubationType", incubationType);
      formData.append("businessDetails", JSON.stringify(businessDetails));
      formData.append("teamMembers", JSON.stringify(teamMembers));
      formData.append("customResponses", JSON.stringify(customResponses));

      Object.keys(uploadedFiles).forEach((fieldKey) => {
        if (uploadedFiles[fieldKey]) {
          formData.append(fieldKey, uploadedFiles[fieldKey]);
        }
      });

      const res = await axios.post("/incubation/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === 1) {
        toast.success(res.data.msg);
        setMyApp(res.data.application);
        setIsEditingForm(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
  };

  // Reply in Feedback Thread
  const handleReplyFeedback = async (e) => {
    e.preventDefault();
    if (!founderReplyMsg.trim()) return;
    try {
      setSendingReply(true);
      const res = await axios.post("/incubation/feedback/reply", { message: founderReplyMsg.trim() });
      if (res.data?.status === 1) {
        toast.success("Message sent to incubation committee");
        setFounderReplyMsg("");
        if (myApp) {
          setMyApp({ ...myApp, feedbackMessages: res.data.messages });
        }
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSendingReply(false);
    }
  };

  // Book Mentorship Session
  const handleBookMentorSession = async (e) => {
    e.preventDefault();
    if (!isApproved) {
      toast.error("Mentor support is restricted to approved profiles.");
      handleTabChange("view-application");
      return;
    }
    if (isOverdue) {
      toast.error("Action Suspended: Payment is overdue. You can view past sessions below, but booking new calls requires payment.");
      return;
    }
    if (!selectedMentor || !sessionTopic.trim()) {
      toast.error("Please enter discussion topic");
      return;
    }
    try {
      setBookingMentor(true);
      const res = await axios.post("/incubation/mentors/book", {
        mentorId: selectedMentor._id,
        date: sessionDate,
        timeSlot: sessionTime,
        topic: sessionTopic.trim(),
        notes: sessionNotes.trim(),
      });
      if (res.data?.status === 1) {
        toast.success(res.data.msg);
        setShowMentorModal(false);
        setSessionTopic("");
        setSessionNotes("");
        loadMentors();
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to book mentor session");
    } finally {
      setBookingMentor(false);
    }
  };

  // Book Infrastructure Slot from Calendar
  const handleBookSlotFromCalendar = async (e) => {
    e.preventDefault();
    if (!isApproved) {
      toast.error("Infrastructure booking is restricted to approved profiles.");
      handleTabChange("view-application");
      return;
    }
    if (isOverdue) {
      toast.error("Action Suspended: Payment is overdue. You can view your history below, but booking requires settling dues.");
      return;
    }
    if (appType === "virtual") {
      toast.error("Infrastructure booking is not available for Virtual Incubation.");
      return;
    }
    if (!selectedFacility || !selectedSlot || !bookingPurpose.trim()) {
      toast.error("Please select an available timeslot and enter booking purpose");
      return;
    }
    try {
      setSubmittingBooking(true);
      const res = await axios.post("/incubation/infrastructure/book", {
        infrastructureId: selectedFacility._id,
        date: calendarDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        purpose: bookingPurpose.trim(),
        attendeesCount,
      });
      if (res.data?.status === 1) {
        toast.success(res.data.msg);
        setBookingPurpose("");
        setSelectedSlot(null);
        loadInfrastructure();
        loadFacilitySlots(selectedFacility._id, calendarDate);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to book slot");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Toggle QR Attendance
  const handleToggleAttendance = async () => {
    if (!isApproved) {
      toast.error("Attendance is available only to approved profiles.");
      handleTabChange("view-application");
      return;
    }
    if (isOverdue) {
      toast.error("Action Suspended: Payment is overdue. You can view your attendance logs below, but check-in is suspended.");
      return;
    }
    try {
      setMarkingAttendance(true);
      if (attendanceData.isCheckedIn) {
        const res = await axios.post("/incubation/attendance/check-out");
        if (res.data?.status === 1) {
          toast.info(res.data.msg);
          loadAttendance();
        }
      } else {
        const res = await axios.post("/incubation/attendance/check-in");
        if (res.data?.status === 1) {
          toast.success(res.data.msg);
          loadAttendance();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update attendance");
    } finally {
      setMarkingAttendance(false);
    }
  };

  // Pay Monthly Dues
  const handlePayMonthlyDues = async () => {
    try {
      setPayingDues(true);
      const res = await axios.post("/incubation/pay-monthly-dues");
      if (res.data?.status === 1) {
        toast.success(res.data.msg);
        loadAccounting();
        loadApplicationData();
      }
    } catch (err) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setPayingDues(false);
    }
  };

  // Generate 14-day calendar dates array
  const generateDates = () => {
    const dates = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push({
        dateStr: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return dates;
  };

  const next14Days = generateDates();

  const options = [
    {
      key: "view-application",
      label: "View Application",
      shortDesc: "Startup profile, team roster, physical/virtual type & status",
      icon: FileText,
      badge: myApp?.status || "Application Open",
      badgeColor: myApp?.status === "Accepted"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        : "bg-teal-500/10 text-teal-600 border-teal-500/20",
    },
    {
      key: "mentor-support",
      label: "Mentor Support",
      shortDesc: "1-on-1 advisor calls, fundraising & legal mentorship",
      icon: GraduationCap,
      badge: isApproved ? `${mentors.length || 4} Mentors Active` : "🔒 Approved Only",
      badgeColor: isApproved ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20",
      locked: !isApproved,
    },
    {
      key: "infrastructure-booking",
      label: "Infrastructure Booking",
      shortDesc: appType === "virtual" ? "Not included in Virtual Incubation" : "Calendar availability, slots & booking history",
      icon: Building2,
      badge: appType === "virtual"
        ? "Physical Only"
        : isApproved
        ? `${infrastructureList.length || 5} Facilities Active`
        : "🔒 Approved Only",
      badgeColor: appType === "virtual"
        ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
        : isApproved
        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
        : "bg-amber-500/10 text-amber-600 border-amber-500/20",
      locked: !isApproved || appType === "virtual",
    },
    {
      key: "attendance",
      label: "QR Incubatee Attendance",
      shortDesc: "Smart QR check-in & monthly presence compliance",
      icon: QrCode,
      badge: isApproved
        ? (attendanceData.isCheckedIn ? "Checked In" : "Checked Out")
        : "🔒 Approved Only",
      badgeColor: isApproved
        ? (attendanceData.isCheckedIn ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20")
        : "bg-amber-500/10 text-amber-600 border-amber-500/20",
      locked: !isApproved,
    },
    {
      key: "payment",
      label: "Incubation Payment",
      shortDesc: "Monthly subscription dues, free trial timer & invoices",
      icon: CreditCard,
      badge: isOverdue ? "Payment Overdue" : myApp?.subscriptionStatus === "trial" ? "Free Trial" : "Active",
      badgeColor: isOverdue
        ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
  ];

  // Filtered Bookings History
  const filteredBookings = myBookings.filter((b) => {
    if (historyFilter === "All") return true;
    return b.status === historyFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      <Sidebar />

      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-16 min-h-screen">
        {/* Header Banner */}
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-teal-900/90 via-cyan-900/80 to-blue-900/90 p-6 sm:p-7 text-white relative overflow-hidden shadow-lg border border-teal-500/30">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  <span>DPIIT Recognized Incubatee Console</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white/90 uppercase">
                  {myApp?.incubationType || incubationType} Incubation
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Incubation Support Console
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-1 max-w-2xl">
                RealBell Vedic Council of Education Research &amp; Training (Chandlai Hub) · DIPP172504
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 self-start md:self-auto">
              <div className="w-10 h-10 rounded-lg bg-teal-400/20 flex items-center justify-center text-teal-300 font-bold shrink-0">
                {myApp?.incubationType === "virtual" ? <Laptop size={20} /> : <Building2 size={20} />}
              </div>
              <div>
                <div className="text-[11px] text-teal-200 font-medium">Assigned Mode &amp; Hub</div>
                <div className="text-xs font-bold text-white">
                  {myApp?.incubationType === "virtual" ? "Virtual Workspace (Remote)" : "Chandlai Hub, Jaipur"} · {myApp?.cohortName || "Cohort 2026-Q1"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC DUE ALERT COUNTDOWN TIMER BANNER */}
        {isApproved && myApp?.dueDate && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs ${
              isOverdue
                ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                : "bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isOverdue ? "bg-rose-500 text-white animate-bounce" : "bg-teal-600 text-white"}`}>
                {isOverdue ? <AlertTriangle size={18} /> : <Timer size={18} />}
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <span>{isOverdue ? "Payment Overdue - New Actions Suspended (Old Data Accessible)" : "Next Monthly Payment Due"}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${isOverdue ? "bg-rose-500 text-white" : "bg-teal-600 text-white"}`}>
                    {myApp.subscriptionStatus === "trial" ? "Free Trial Active" : isOverdue ? "Overdue" : "Active"}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isOverdue
                    ? `Payment was due on ${new Date(myApp.dueDate).toLocaleDateString()}. You can still view all historical data below. Pay monthly dues to create new bookings.`
                    : `Due Date: ${new Date(myApp.dueDate).toLocaleDateString()} (${myApp.incubationType?.toUpperCase()} Fee: ₹${myApp.monthlyFee || (myApp.incubationType === "physical" ? 5000 : 2500)}/mo)`}
                </p>
              </div>
            </div>

            {/* Countdown Display: Days : Hours : Mins : Secs */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 font-mono font-black text-sm bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-teal-600 dark:text-teal-400">{String(countdown.days).padStart(2, "0")}d</span>
                <span>:</span>
                <span>{String(countdown.hours).padStart(2, "0")}h</span>
                <span>:</span>
                <span>{String(countdown.minutes).padStart(2, "0")}m</span>
                <span>:</span>
                <span className="text-rose-500">{String(countdown.seconds).padStart(2, "0")}s</span>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange("payment")}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-xs whitespace-nowrap"
              >
                {isOverdue ? "Pay Dues Now" : "Manage Payment"}
              </button>
            </div>
          </div>
        )}

        {/* 5 Options Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers size={14} className="text-teal-600 dark:text-teal-400" />
              <span>Incubation Services</span>
            </h2>
            <span className="text-xs text-slate-400">Click any service to view full details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isActive = activeTab === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleTabChange(opt.key)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isActive
                      ? "bg-white dark:bg-slate-900 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                      : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {isActive && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2.5 rounded-lg ${isActive ? "bg-teal-500 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                        <Icon size={18} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">{opt.label}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{opt.shortDesc}</p>
                  </div>
                  <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    <span>{opt.locked ? "Restricted" : isActive ? "Viewing Section" : "Open Service"}</span>
                    <ChevronRight size={14} className={isActive ? "translate-x-0.5" : ""} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: VIEW APPLICATION & PROFILE FORM */}
        {activeTab === "view-application" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Startup Profile &amp; Incubation Application
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      myApp?.status === "Accepted"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : myApp?.status === "Rejected"
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        : "bg-teal-500/10 text-teal-600 border-teal-500/20"
                    }`}
                  >
                    Status: {myApp?.status || "Application Open"}
                  </span>
                  {myApp?.incubationType && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase">
                      {myApp.incubationType} Incubation
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Application ID: <strong>{myApp?.applicationId || "RBF-INC-DRAFT"}</strong> · Evaluated by Incubation Committee
                </p>
              </div>

              {myApp && !isEditingForm && (
                <button
                  type="button"
                  onClick={() => setIsEditingForm(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Edit Form Responses
                </button>
              )}
            </div>

            {/* If Not Editing: Summary & Review Timeline */}
            {myApp && !isEditingForm ? (
              <div className="space-y-6">
                {/* 5-Stage Timeline */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-3">
                    Evaluation Review Stage
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                    {[
                      { step: "1. Form Submitted", done: true },
                      { step: "2. Document Screening", done: ["Under Review", "Shortlisted", "Accepted"].includes(myApp.status) },
                      { step: "3. Technical Review", done: ["Shortlisted", "Accepted"].includes(myApp.status) },
                      { step: "4. Committee Pitch", done: ["Shortlisted", "Accepted"].includes(myApp.status) },
                      { step: "5. Final Decision", done: ["Accepted", "Rejected"].includes(myApp.status) },
                    ].map((st, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border flex items-center gap-2 font-bold ${
                          st.done
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <CheckCircle2 size={15} />
                        <span>{st.step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Business & Incubation Details */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                    <h4 className="font-bold uppercase text-slate-400 text-[10.5px]">Business &amp; Incubation Details</h4>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Incubation Type:</span>
                      <strong className="uppercase font-bold text-teal-600">{myApp.incubationType}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Startup Name:</span>
                      <strong className="text-slate-900 dark:text-white">{myApp.businessDetails?.companyName}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">DPIIT Recognition:</span>
                      <strong className="font-mono text-emerald-600">{myApp.businessDetails?.dippNumber || "Not Registered"}</strong>
                    </div>
                    {myApp.businessDetails?.cinNumber && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">CIN Number:</span>
                        <strong className="font-mono">{myApp.businessDetails.cinNumber}</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Sector &amp; Stage:</span>
                      <strong>{myApp.businessDetails?.sector || "Tech"} · {myApp.businessDetails?.stage || "Early Stage"}</strong>
                    </div>
                    {(myApp.businessDetails?.city || myApp.businessDetails?.state) && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Location:</span>
                        <strong>{[myApp.businessDetails?.city, myApp.businessDetails?.state].filter(Boolean).join(", ")}</strong>
                      </div>
                    )}
                    {myApp.businessDetails?.website && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Website:</span>
                        <a href={myApp.businessDetails.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline flex items-center gap-1 font-semibold truncate max-w-[200px]">
                          <span>{myApp.businessDetails.website}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                    {myApp.businessDetails?.pitchSummary && (
                      <div className="pt-1">
                        <span className="block text-slate-500 text-[10.5px] mb-0.5">Pitch Summary:</span>
                        <p className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {myApp.businessDetails.pitchSummary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                    <h4 className="font-bold uppercase text-slate-400 text-[10.5px]">Team Members ({myApp.teamMembers?.length || 1})</h4>
                    <div className="space-y-1.5">
                      {myApp.teamMembers?.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px]">
                          <div>
                            <strong>{t.name}</strong> <span className="text-slate-400">({t.role})</span>
                          </div>
                          <div className="text-slate-500">{t.email || t.phone}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Questionnaire Responses (Full View) */}
                  {myApp.customResponses && Object.keys(myApp.customResponses).length > 0 && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold uppercase text-slate-400 text-[10.5px] flex items-center gap-1.5">
                          <Sparkles size={14} className="text-teal-600" />
                          <span>Custom Questionnaire Answers</span>
                        </h4>
                        <span className="text-[10.5px] text-teal-600 font-mono font-bold">
                          {Object.keys(myApp.customResponses).length} Responses
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                        {Object.entries(myApp.customResponses).map(([key, val]) => {
                          const matchedField = formSchema?.fields?.find((f) => f.key === key);
                          const label = matchedField?.label || key.replace(/_/g, " ");
                          const isFile = typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));

                          return (
                            <div key={key} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
                              <span className="block text-[10.5px] font-bold text-slate-400 capitalize truncate" title={label}>
                                {label}
                              </span>
                              {isFile ? (
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-teal-600 hover:underline font-semibold text-xs"
                                >
                                  <ExternalLink size={12} />
                                  <span>View Uploaded Document</span>
                                </a>
                              ) : Array.isArray(val) ? (
                                <div className="flex flex-wrap gap-1">
                                  {val.map((item, vIdx) => (
                                    <span key={vIdx} className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-[10.5px] font-medium">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : typeof val === "boolean" ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold ${val ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>
                                  {val ? "Yes / Agreed" : "No"}
                                </span>
                              ) : (
                                <span className="text-slate-800 dark:text-slate-200 font-semibold block break-words">
                                  {String(val || "N/A")}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Documents Vault */}
                  {myApp.documents && myApp.documents.length > 0 && (
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 md:col-span-2">
                      <h4 className="font-bold uppercase text-slate-400 text-[10.5px] flex items-center gap-1.5">
                        <UploadCloud size={14} className="text-teal-600" />
                        <span>Uploaded Documents &amp; Pitch Decks ({myApp.documents.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {myApp.documents.map((doc, dIdx) => (
                          <div key={dIdx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <FileText size={15} className="text-teal-600 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.fileName}</span>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold text-[11px] shrink-0 hover:bg-teal-700"
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback Thread */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <MessageSquare size={15} className="text-teal-600" />
                    <span>Admin Feedback &amp; Conversation Thread</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto space-y-2 text-xs">
                    {myApp.feedbackMessages?.length === 0 ? (
                      <div className="text-slate-400 text-center py-2">No messages yet. Feedback from committee will appear here.</div>
                    ) : (
                      myApp.feedbackMessages?.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg ${
                            m.senderRole === "admin"
                              ? "bg-teal-500/10 text-teal-900 dark:text-teal-200 border border-teal-500/20"
                              : "bg-blue-500/10 text-blue-900 dark:text-blue-200 border border-blue-500/20 ml-6"
                          }`}
                        >
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                            <span>{m.senderName} ({m.senderRole})</span>
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div>{m.message}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleReplyFeedback} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Reply to incubation committee or request clarification..."
                      value={founderReplyMsg}
                      onChange={(e) => setFounderReplyMsg(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {sendingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* APPLICATION FORM EDITING VIEW */
              <div className="space-y-6 text-xs">
                {/* SECTION 0: MANDATORY INCUBATION TYPE */}
                <div className="p-4 rounded-xl border-2 border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20 space-y-3">
                  <div>
                    <span className="text-[10.5px] uppercase font-black text-teal-600 tracking-wider">Required Selection</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Choose Incubation Type *</h4>
                    <p className="text-[11px] text-slate-500">Select whether your startup requires on-campus physical workspace or remote virtual mentorship.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label
                      onClick={() => setIncubationType("physical")}
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        incubationType === "physical"
                          ? "border-teal-600 bg-white dark:bg-slate-900 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="incType"
                        checked={incubationType === "physical"}
                        onChange={() => setIncubationType("physical")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 size={14} className="text-teal-600" />
                          <span>Physical Incubation (On-Campus)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Includes <strong>Smart Attendance</strong> + <strong>Physical Infrastructure Booking</strong> (Boardrooms, Desks, AI Lab) + <strong>1-on-1 Mentor Support</strong>.
                        </p>
                        <div className="mt-2 text-[10.5px] font-bold text-teal-600">
                          ₹{settings?.physicalMonthlyFee || 5000} / month ({settings?.physicalTrialDays ?? 14}-Day Free Trial)
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setIncubationType("virtual")}
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        incubationType === "virtual"
                          ? "border-teal-600 bg-white dark:bg-slate-900 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="incType"
                        checked={incubationType === "virtual"}
                        onChange={() => setIncubationType("virtual")}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Laptop size={14} className="text-teal-600" />
                          <span>Virtual Incubation (Remote)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Includes <strong>Smart Attendance Tracking</strong> + <strong>1-on-1 Mentor Support</strong> (Infrastructure physical booking excluded).
                        </p>
                        <div className="mt-2 text-[10.5px] font-bold text-teal-600">
                          ₹{settings?.virtualMonthlyFee || 2500} / month ({settings?.virtualTrialDays ?? 30}-Day Free Trial)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* SECTION 1: BUSINESS DETAILS */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3.5">
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-teal-600" />
                    <span>Section 1: Startup Business Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Company / Startup Name *:</label>
                      <input
                        type="text"
                        required
                        value={businessDetails.companyName}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, companyName: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">DPIIT Recognition Number:</label>
                      <input
                        type="text"
                        placeholder="e.g. DIPP172504"
                        value={businessDetails.dippNumber}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, dippNumber: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Sector / Industry:</label>
                      <input
                        type="text"
                        value={businessDetails.sector}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, sector: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Website or Deck Link:</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={businessDetails.website}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, website: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Startup Pitch Summary &amp; Problem Solved:</label>
                    <textarea
                      rows={2}
                      placeholder="Briefly describe what your startup builds and your value proposition..."
                      value={businessDetails.pitchSummary}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, pitchSummary: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* SECTION 2: MANDATORY TEAM MEMBERS */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Users size={16} className="text-teal-600" />
                        <span>Section 2: Team Members * ({teamMembers.length})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Every incubation application must register team members.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTeamMembers([...teamMembers, { name: "", role: "Co-Founder", email: "", phone: "", linkedin: "" }])
                      }
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 text-white font-bold text-xs cursor-pointer"
                    >
                      <Plus size={12} /> Add Member
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {teamMembers.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Member Name *"
                          value={m.name}
                          onChange={(e) => {
                            const updated = [...teamMembers];
                            updated[idx].name = e.target.value;
                            setTeamMembers(updated);
                          }}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Role (e.g. CTO) *"
                          value={m.role}
                          onChange={(e) => {
                            const updated = [...teamMembers];
                            updated[idx].role = e.target.value;
                            setTeamMembers(updated);
                          }}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={m.email}
                          onChange={(e) => {
                            const updated = [...teamMembers];
                            updated[idx].email = e.target.value;
                            setTeamMembers(updated);
                          }}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Phone / Mobile"
                            value={m.phone}
                            onChange={(e) => {
                              const updated = [...teamMembers];
                              updated[idx].phone = e.target.value;
                              setTeamMembers(updated);
                            }}
                            className="flex-1 p-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                          />
                          {teamMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 3: DYNAMIC FORM FIELDS */}
                {formSchema?.fields?.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-teal-600" />
                        <span>Section 3: Incubation Questionnaire &amp; Attachments</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {formSchema.fields.length} Custom Fields
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formSchema.fields.map((f) => (
                        <div
                          key={f.id}
                          className={`space-y-1.5 ${f.gridCols === 2 ? "sm:col-span-2" : "sm:col-span-1"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label className="block font-bold text-xs text-slate-800 dark:text-slate-200">
                              {f.label} {f.required && <span className="text-rose-500">*</span>}
                            </label>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {f.type}
                            </span>
                          </div>
                          {f.description && (
                            <p className="text-[11px] text-slate-400">{f.description}</p>
                          )}

                          {/* Multi-Line Textarea */}
                          {f.type === "textarea" ? (
                            <textarea
                              rows={3}
                              placeholder={f.placeholder || "Enter details..."}
                              value={customResponses[f.key] || ""}
                              onChange={(e) => setCustomResponses({ ...customResponses, [f.key]: e.target.value })}
                              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          ) : f.type === "select" ? (
                            /* Dropdown Select */
                            <select
                              value={customResponses[f.key] || ""}
                              onChange={(e) => setCustomResponses({ ...customResponses, [f.key]: e.target.value })}
                              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                            >
                              <option value="">-- Select {f.label} --</option>
                              {f.options?.map((opt, oIdx) => (
                                <option key={oIdx} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : f.type === "multiselect" ? (
                            /* Multi-Select Tag Pills */
                            (() => {
                              const rawVal = customResponses[f.key];
                              const selectedList = Array.isArray(rawVal)
                                ? rawVal
                                : typeof rawVal === "string" && rawVal
                                ? rawVal.split(",").map((s) => s.trim()).filter(Boolean)
                                : [];

                              const handleToggle = (opt) => {
                                let updated;
                                if (selectedList.includes(opt)) {
                                  updated = selectedList.filter((item) => item !== opt);
                                } else {
                                  updated = [...selectedList, opt];
                                }
                                setCustomResponses({ ...customResponses, [f.key]: updated });
                              };

                              return (
                                <div className="space-y-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                  <div className="text-[10.5px] text-slate-400">
                                    Click tags to select multiple options ({selectedList.length} selected):
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {f.options?.map((opt, oIdx) => {
                                      const isSelected = selectedList.includes(opt);
                                      return (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          onClick={() => handleToggle(opt)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                                            isSelected
                                              ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500"
                                          }`}
                                        >
                                          {isSelected && <Check size={12} />}
                                          <span>{opt}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()
                          ) : f.type === "radio" ? (
                            /* Radio Options */
                            <div className="flex flex-wrap gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                              {f.options?.map((opt, oIdx) => (
                                <label key={oIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`user_radio_${f.key}`}
                                    checked={customResponses[f.key] === opt}
                                    onChange={() => setCustomResponses({ ...customResponses, [f.key]: opt })}
                                    className="text-teal-600"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : f.type === "checkbox" || f.type === "terms" ? (
                            /* Checkbox / Terms Agreement */
                            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={Boolean(customResponses[f.key])}
                                onChange={(e) => setCustomResponses({ ...customResponses, [f.key]: e.target.checked })}
                                className="mt-0.5 rounded text-teal-600"
                              />
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {f.placeholder || f.label}
                                </span>
                              </div>
                            </label>
                          ) : f.type === "file" || f.type === "image" ? (
                            /* File / Image Upload */
                            <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                              <input
                                type="file"
                                accept={f.type === "image" ? "image/*" : undefined}
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    setUploadedFiles({ ...uploadedFiles, [f.key]: e.target.files[0] });
                                  }
                                }}
                                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-950 dark:file:text-teal-300 cursor-pointer"
                              />
                              {uploadedFiles[f.key] && (
                                <p className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
                                  <Check size={12} /> Selected for upload: {uploadedFiles[f.key].name}
                                </p>
                              )}
                              {!uploadedFiles[f.key] && customResponses[f.key] && typeof customResponses[f.key] === "string" && customResponses[f.key].startsWith("http") && (
                                <a
                                  href={customResponses[f.key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-teal-600 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <ExternalLink size={11} />
                                  <span>View currently uploaded file</span>
                                </a>
                              )}
                            </div>
                          ) : f.type === "address" ? (
                            /* Address Multi-line */
                            <textarea
                              rows={2}
                              placeholder={f.placeholder || "Enter physical address..."}
                              value={customResponses[f.key] || ""}
                              onChange={(e) => setCustomResponses({ ...customResponses, [f.key]: e.target.value })}
                              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          ) : (
                            /* Standard Inputs: text, number, email, phone, date, url */
                            <input
                              type={
                                f.type === "number"
                                  ? "number"
                                  : f.type === "email"
                                  ? "email"
                                  : f.type === "phone"
                                  ? "tel"
                                  : f.type === "date"
                                  ? "date"
                                  : f.type === "url"
                                  ? "url"
                                  : "text"
                              }
                              placeholder={f.placeholder}
                              value={customResponses[f.key] || ""}
                              onChange={(e) => setCustomResponses({ ...customResponses, [f.key]: e.target.value })}
                              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  {myApp && (
                    <button
                      type="button"
                      onClick={() => setIsEditingForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={submittingApp}
                    onClick={() => handleSubmitApplication(true)}
                    className="px-4 py-2 rounded-xl border border-teal-600 text-teal-600 font-bold hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={submittingApp}
                    onClick={() => handleSubmitApplication(false)}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {submittingApp ? "Submitting..." : "Submit Application for Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENTOR SUPPORT (Both Physical & Virtual - Historical Data Always Accessible) */}
        {activeTab === "mentor-support" && (
          !isApproved ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Mentor Support Requires Approved Application</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                1-on-1 advisor sessions and technical mentorship calls are reserved for approved incubator startups. Please submit your application first.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("view-application")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
              >
                <span>Submit Incubation Application</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              {/* Overdue Warning Banner (Still allows viewing past sessions) */}
              {isOverdue && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>
                      <strong>Action Suspended (Payment Overdue):</strong> You can review your past mentorship calls below. Booking new 1-on-1 calls requires settling monthly dues in the Payment section.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("payment")}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Pay Dues
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Incubation Mentorship &amp; 1-on-1 Advisory
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Book private strategy sessions with domain experts in fundraising, AI, legal compliance, and GTM.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mentors Catalog */}
              {mentors.length === 0 ? (
                <div className="py-12 px-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center max-w-lg mx-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto">
                    <Users size={28} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Mentor Assignment in Progress</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your incubation application is officially approved! The incubation committee has not yet assigned a dedicated mentor to your startup.
                    As soon as your mentor is assigned by the admin, their profile, booking calendar, and direct contact options will appear right here.
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-bold">
                      <Sparkles size={13} />
                      <span>Status: Awaiting Mentor Assignment by Admin</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mentors.map((mentor) => (
                    <div
                      key={mentor._id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 overflow-hidden">
                              {mentor.avatarUrl && mentor.avatarUrl !== "/default_user.png" ? (
                                <img src={mentor.avatarUrl} alt={mentor.name} className="w-full h-full object-cover" />
                              ) : (
                                mentor.name?.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{mentor.name}</div>
                              <div className="text-[11.5px] text-teal-600 font-semibold truncate">{mentor.role || mentor.designation}</div>
                              <div className="text-[10.5px] text-slate-400 truncate">{mentor.company}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Star size={12} className="fill-amber-500" />
                            <span>{mentor.rating || 4.9}</span>
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-slate-600 dark:text-slate-400 text-[11.5px] line-clamp-3 leading-relaxed">{mentor.bio}</p>

                        {/* Mentorship Domains */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(mentor.expertiseAreas || mentor.mentorshipDomains)?.slice(0, 4).map((area, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-lg text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                              {area}
                            </span>
                          ))}
                        </div>

                        {/* Direct Contact Links */}
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap gap-2 text-[11px]">
                          {mentor.email && (
                            <a
                              href={`mailto:${mentor.email}`}
                              title="Send Direct Email"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition"
                            >
                              <Mail size={12} className="text-teal-600" />
                              <span>Email</span>
                            </a>
                          )}
                          {mentor.phone && (
                            <a
                              href={`tel:${mentor.phone}`}
                              title="Call or WhatsApp"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition"
                            >
                              <Phone size={12} className="text-teal-600" />
                              <span>Call</span>
                            </a>
                          )}
                          <a
                            href={`/connect/mentor/${mentor._id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Platform Profile & Chat"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition ml-auto"
                          >
                            <ExternalLink size={12} className="text-teal-600" />
                            <span>Connect / Profile</span>
                          </a>
                        </div>
                      </div>

                      {/* Primary Action Button */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (isOverdue) {
                              toast.error("Action Suspended: Payment is overdue. Settle monthly dues in Payment to book new calls.");
                              return;
                            }
                            setSelectedMentor(mentor);
                            setShowMentorModal(true);
                          }}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs ${
                            isOverdue
                              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                              : "bg-teal-600 hover:bg-teal-700 text-white"
                          }`}
                        >
                          <Calendar size={14} />
                          <span>Book 1-on-1 Call</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Complete Scheduled & Past Calls History */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mentorship Call History ({myMentorSessions.length} Sessions)
                  </h4>
                  <span className="text-[11px] text-slate-400">Past &amp; upcoming sessions are always preserved</span>
                </div>

                {myMentorSessions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-slate-500 text-xs">
                    No mentorship calls scheduled yet. Click "Book 1-on-1 Call" above to reserve a session with a mentor.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                          <th className="pb-2.5">Booking ID</th>
                          <th className="pb-2.5">Mentor</th>
                          <th className="pb-2.5">Date &amp; Slot</th>
                          <th className="pb-2.5">Discussion Topic</th>
                          <th className="pb-2.5">Meeting Link</th>
                          <th className="pb-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {myMentorSessions.map((s) => (
                          <tr key={s._id}>
                            <td className="py-3 font-mono font-bold">{s.bookingId}</td>
                            <td className="py-3 font-semibold text-slate-900 dark:text-white">{s.mentorName || s.mentor?.name}</td>
                            <td className="py-3 text-slate-500">{s.date} · {s.timeSlot}</td>
                            <td className="py-3 font-medium">{s.topic}</td>
                            <td className="py-3">
                              <a
                                href={s.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-teal-600 font-bold hover:underline"
                              >
                                <Video size={13} />
                                <span>Join Google Meet</span>
                              </a>
                            </td>
                            <td className="py-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* TAB 3: INFRASTRUCTURE BOOKING & CALENDAR (Physical Only - History Always Accessible) */}
        {activeTab === "infrastructure-booking" && (
          appType === "virtual" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                <Laptop size={32} />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Virtual Incubation Plan
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Physical Infrastructure Not Included</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your startup is enrolled in <strong>Virtual Incubation</strong> (Smart Attendance &amp; 1-on-1 Mentor Support). Physical desk allocations, boardrooms, and AI lab reservations are exclusive to <strong>Physical Incubation</strong>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("mentor-support")}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
                >
                  Access Mentor Support Instead
                </button>
              </div>
            </div>
          ) : !isApproved ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Infrastructure Booking Requires Approved Application</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Workspace reservation and boardroom slots are reserved for approved incubator startups. Please submit your application first.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("view-application")}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
              >
                Submit Incubation Application
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              {/* Overdue Warning Banner */}
              {isOverdue && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>
                      <strong>Action Suspended (Payment Overdue):</strong> You can view all facility calendars and your booking history below. Reserving new slots requires settling dues in Payment.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("payment")}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Pay Dues
                  </button>
                </div>
              )}

              {/* 1. Facility Selector Pills */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 size={15} className="text-teal-600" />
                    <span>1. Select Infrastructure Facility</span>
                  </h3>
                  <span className="text-xs text-slate-400">Choose a facility to view live availability calendar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {infrastructureList.map((infra) => {
                    const isSelected = selectedFacility?._id === infra._id;
                    return (
                      <button
                        key={infra._id}
                        type="button"
                        onClick={() => setSelectedFacility(infra)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 ring-2 ring-teal-500/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="text-[10px] font-bold uppercase text-teal-600">{infra.type?.replace(/_/g, " ")}</div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white mt-0.5 line-clamp-1">{infra.title}</div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10.5px] flex justify-between items-center text-slate-500">
                          <span>{infra.capacity} Seats</span>
                          <span className="font-bold text-emerald-600">
                            {infra.availabilityType === "24_7" ? "24/7" : "Weekdays"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Monthly Usage Limits Meter for Selected Facility */}
              {selectedFacility && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[10.5px] uppercase font-bold">Selected Facility</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedFacility.title}</div>
                    <div className="text-[11px] text-slate-500">{selectedFacility.location}</div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10.5px] uppercase font-bold">Startup Monthly Booking Limit</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {selectedFacility.usedBookingsThisMonth || 0} / {selectedFacility.monthlyBookingLimit || 20}
                      </div>
                      <span className="text-[11px] text-teal-600 font-semibold">Bookings used this month</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10.5px] uppercase font-bold">Startup Monthly Hours Limit</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {selectedFacility.usedHoursThisMonth || 0} / {selectedFacility.monthlyHoursLimit || 20}
                      </div>
                      <span className="text-[11px] text-teal-600 font-semibold">Hours utilized this month</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Interactive Availability Calendar & Slot Picker */}
              {selectedFacility && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar size={16} className="text-teal-600" />
                        <span>2. Availability Calendar &amp; Slot Reservation</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Operational:{" "}
                        <strong className="text-teal-600">
                          {selectedFacility.availabilityType === "24_7"
                            ? "24/7 Access (All Days & Hours)"
                            : (selectedFacility.availableDays || []).join(", ") || "Weekdays"}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Booked / Closed
                      </span>
                    </div>
                  </div>

                  {/* Calendar Date Picker & Day Select Box Controls */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                      {/* Day Select Box */}
                      <div className="flex-1 min-w-[170px]">
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Day Select Box:
                        </label>
                        <select
                          value={selectedDayFilter}
                          onChange={(e) => handleSelectDayOfWeek(e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold cursor-pointer"
                        >
                          <option value="">Jump to Day of Week...</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>

                      {/* Calendar Date Input */}
                      <div className="flex-1 min-w-[170px]">
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Calendar Date Input:
                        </label>
                        <input
                          type="date"
                          min={todayStr}
                          value={calendarDate}
                          onChange={(e) => {
                            setCalendarDate(e.target.value);
                            setSelectedDayFilter("");
                          }}
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Quick Today / Tomorrow Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center sm:pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarDate(todayStr);
                          setSelectedDayFilter("");
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs border cursor-pointer ${
                          calendarDate === todayStr
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tmr = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                          setCalendarDate(tmr);
                          setSelectedDayFilter("");
                        }}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>

                  {/* 14-Day Date Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {next14Days.map((d) => {
                      const isSelected = calendarDate === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => {
                            setCalendarDate(d.dateStr);
                            setSelectedDayFilter("");
                          }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[65px] transition cursor-pointer ${
                            isSelected
                              ? "bg-teal-600 text-white border-teal-600 shadow-sm font-bold"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[10px] uppercase">{d.dayName}</span>
                          <span className="text-base font-extrabold">{d.dayNum}</span>
                          <span className="text-[9.5px] opacity-80">{d.monthName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Closed Day Alert Banner */}
                  {!slotAvailabilityMeta.isDayOpen && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                        <div>
                          <strong>{selectedFacility.title} is closed on {slotAvailabilityMeta.dayName}s.</strong>
                          <span className="block text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                            Standard operating days: {(slotAvailabilityMeta.availableDays || []).join(", ") || "Weekdays"}.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={jumpToNextAvailableDay}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        Jump to Next Open Day
                      </button>
                    </div>
                  )}

                  {/* Mode Tabs: Pre-set Time Slots vs Custom Time Input */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span>Time Slots for {calendarDate} ({slotAvailabilityMeta.dayName}):</span>
                      </div>

                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setSlotBookingMode("preset")}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            slotBookingMode === "preset"
                              ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Configured Slots ({availableSlots.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlotBookingMode("custom")}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            slotBookingMode === "custom"
                              ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Custom Time Input
                        </button>
                      </div>
                    </div>

                    {/* Pre-set Slots Grid */}
                    {slotBookingMode === "preset" && (
                      <div>
                        {loadingSlots ? (
                          <div className="py-8 text-center text-xs text-slate-400">Loading slot availability...</div>
                        ) : availableSlots.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                            No pre-configured slots found for this facility. You can use the "Custom Time Input" tab above.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {availableSlots.map((slotObj, idx) => {
                              const isSelected = selectedSlot?.startTime === slotObj.startTime && selectedSlot?.endTime === slotObj.endTime;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={!slotObj.isAvailable}
                                  onClick={() => setSelectedSlot(slotObj)}
                                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col justify-between ${
                                    isSelected
                                      ? "bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-500/30"
                                      : slotObj.isAvailable
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                                  }`}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <span>{slotObj.slot}</span>
                                    {slotObj.isAvailable ? (
                                      <CheckCircle size={14} className={isSelected ? "text-white" : "text-emerald-600"} />
                                    ) : (
                                      <XCircle size={14} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center mt-1 text-[10px] opacity-85 font-normal">
                                    <span>
                                      {slotObj.isBooked
                                        ? "Reserved by Incubatee"
                                        : slotObj.isAvailable
                                        ? `Available (${slotObj.durationHours || 2}h)`
                                        : "Center Closed"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Time Input Section */}
                    {slotBookingMode === "custom" && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Clock size={14} className="text-teal-600" />
                              <span>Select Custom Hours for {calendarDate}:</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Input your preferred start and end times to reserve the facility.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div>
                              <span className="block text-[10px] text-slate-400 mb-0.5">Start Time:</span>
                              <input
                                type="time"
                                value={customStartTime}
                                onChange={(e) => setCustomStartTime(e.target.value)}
                                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                              />
                            </div>
                            <span className="text-slate-400 pt-3">to</span>
                            <div>
                              <span className="block text-[10px] text-slate-400 mb-0.5">End Time:</span>
                              <input
                                type="time"
                                value={customEndTime}
                                onChange={(e) => setCustomEndTime(e.target.value)}
                                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                              />
                            </div>
                            <div className="pt-3">
                              <button
                                type="button"
                                onClick={handleApplyCustomTime}
                                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-xs"
                              >
                                Select This Time
                              </button>
                            </div>
                          </div>
                        </div>

                        {selectedSlot && (
                          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 flex items-center justify-between text-xs">
                            <span className="font-semibold text-teal-800 dark:text-teal-200">
                              Active selection: {selectedSlot.slot} ({selectedSlot.durationHours || 2} hours)
                            </span>
                            <span className="text-emerald-600 font-bold">Ready to confirm below</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slot Booking Submission Form */}
                  {selectedSlot && (
                    <form
                      onSubmit={handleBookSlotFromCalendar}
                      className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Reserve {selectedFacility.title} on {calendarDate} ({selectedSlot.slot})
                        </span>
                        <span className="font-bold text-emerald-600">
                          {selectedFacility.remainingFreeQuota > 0
                            ? "Free Trial Quota Slot (1 quota credit)"
                            : `₹${Math.round((selectedFacility.pricePerHour || 0) * (selectedSlot.durationHours || 2))} for ${selectedSlot.durationHours || 2} hrs`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block font-bold mb-1">Purpose / Meeting Agenda *:</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Investor pitch practice with mentors"
                            value={bookingPurpose}
                            onChange={(e) => setBookingPurpose(e.target.value)}
                            className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Attendees Count:</label>
                          <input
                            type="number"
                            min="1"
                            max={selectedFacility.capacity}
                            value={attendeesCount}
                            onChange={(e) => setAttendeesCount(Number(e.target.value))}
                            className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSlot(null)}
                          className="px-4 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingBooking || isOverdue}
                          className={`px-5 py-2 rounded-xl font-bold cursor-pointer text-white shadow-xs ${
                            isOverdue ? "bg-slate-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
                          }`}
                        >
                          {submittingBooking ? "Reserving Slot..." : isOverdue ? "Booking Suspended (Pay Dues)" : "Confirm Slot Reservation"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 4. Complete History of Infrastructure Bookings */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Infrastructure Booking History ({myBookings.length} Records)
                    </h4>
                    <p className="text-[11px] text-slate-400">All historical facility usage and past bookings are permanently maintained</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {["All", "Confirmed", "Completed", "Cancelled"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setHistoryFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition ${
                          historyFilter === f
                            ? "bg-teal-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-slate-500 text-xs">
                    No bookings found matching filter "{historyFilter}".
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                          <th className="pb-2.5">Booking Ref</th>
                          <th className="pb-2.5">Facility &amp; Type</th>
                          <th className="pb-2.5">Date &amp; Timeslot</th>
                          <th className="pb-2.5">Hours</th>
                          <th className="pb-2.5">Purpose</th>
                          <th className="pb-2.5">Billing</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredBookings.map((b) => (
                          <tr key={b._id}>
                            <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400">{b.bookingId}</td>
                            <td className="py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{b.facilityName}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold">{b.facilityType?.replace(/_/g, " ")}</div>
                            </td>
                            <td className="py-3 text-slate-500">{b.date}, {b.startTime} - {b.endTime}</td>
                            <td className="py-3 font-semibold">{b.durationHours || 2} hrs</td>
                            <td className="py-3 font-medium max-w-xs truncate">{b.purpose}</td>
                            <td className="py-3 font-bold text-emerald-600">
                              {b.isFreeTrial ? "Free Quota" : `₹${b.amount}`}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  b.status === "Confirmed"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : b.status === "Cancelled"
                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              {b.status === "Confirmed" && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Cancel reservation ${b.bookingId}?`)) {
                                      await axios.delete(`/incubation/bookings/${b._id}`);
                                      toast.info("Booking cancelled");
                                      loadInfrastructure();
                                    }
                                  }}
                                  className="text-rose-500 hover:underline font-bold text-[11px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* TAB 4: QR INCUBATEE ATTENDANCE (Historical Data Always Accessible) */}
        {activeTab === "attendance" && (
          !isApproved ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Attendance Requires Approved Application</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                QR turnstile and virtual attendance logging are available exclusively to approved incubator startups. Please submit your application first.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("view-application")}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
              >
                Submit Incubation Application
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              {/* Overdue Warning Banner */}
              {isOverdue && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>
                      <strong>Action Suspended (Payment Overdue):</strong> You can review your presence history below. Recording new daily check-ins requires settling monthly dues.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("payment")}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Pay Dues
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600">
                    <QrCode size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Smart QR Incubatee Attendance &amp; Presence Records
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mark presence via {appType === "virtual" ? "virtual workspace session" : "campus turnstile QR code"}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={markingAttendance || isOverdue}
                  onClick={handleToggleAttendance}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition ${
                    isOverdue
                      ? "bg-slate-400 cursor-not-allowed"
                      : attendanceData.isCheckedIn
                      ? "bg-amber-600 hover:bg-amber-700 cursor-pointer"
                      : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  }`}
                >
                  <QrCode size={15} />
                  <span>
                    {markingAttendance
                      ? "Recording..."
                      : isOverdue
                      ? "Check-In Suspended"
                      : attendanceData.isCheckedIn
                      ? "Record Check-Out"
                      : "Record Check-In"}
                  </span>
                </button>
              </div>

              {/* QR Visual & Presence Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mb-3">
                    <div className="w-36 h-36 border-2 border-slate-900 dark:border-white p-2 rounded-lg flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-xs" />
                        <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-xs" />
                      </div>
                      <div className="flex justify-center items-center py-2">
                        <span className="text-[9px] font-black text-teal-600 tracking-tighter">REALBELL-QR</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-xs" />
                        <div className="w-4 h-4 bg-teal-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {appType === "virtual" ? "Virtual Workspace Check-In" : "Chandlai Turnstile Scanner"}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">DIPP172504-{user?._id?.substring(0, 6)}</div>
                </div>

                <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-semibold">Today's Presence Status</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          attendanceData.isCheckedIn
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {attendanceData.isCheckedIn ? "Checked In Active" : "Checked Out"}
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      {attendanceData.todayRecord?.checkInTime
                        ? `In-Time: ${new Date(attendanceData.todayRecord.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : "No active check-in today"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {appType === "virtual" ? "Remote Session Logged · Verified via Web Platform" : "Gate 1 Turnstile Scanner · Chandlai Innovation Center"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Days Present</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {attendanceData.stats?.daysPresent} Days
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Compliance Rate</div>
                      <div className="text-lg font-black text-emerald-600 mt-1">
                        {attendanceData.stats?.compliancePercent}%
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Avg Hours / Day</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {attendanceData.stats?.avgHoursPerDay || 6.5} Hrs
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Historical Logs Table */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Attendance Logs &amp; History ({attendanceData.logs?.length || 0} Days Logged)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5">Check-In Time</th>
                        <th className="pb-2.5">Check-Out Time</th>
                        <th className="pb-2.5">Hours</th>
                        <th className="pb-2.5">Location</th>
                        <th className="pb-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendanceData.logs?.map((l) => (
                        <tr key={l._id}>
                          <td className="py-3 font-semibold">{l.dateStr}</td>
                          <td className="py-3 font-mono text-emerald-600 font-semibold">
                            {new Date(l.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3 font-mono text-slate-400">
                            {l.checkOutTime ? new Date(l.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                          </td>
                          <td className="py-3 font-semibold">
                            {l.durationMinutes ? `${(l.durationMinutes / 60).toFixed(1)} hrs` : "In Progress"}
                          </td>
                          <td className="py-3 text-slate-500">{l.location}</td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 5: INCUBATION PAYMENT */}
        {activeTab === "payment" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Incubation Billing, Subscription &amp; Payments
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All payment related records, invoices, free trial countdown, and monthly dues settlement.
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isOverdue
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    : myApp?.subscriptionStatus === "trial"
                    ? "bg-teal-500/10 text-teal-600 border-teal-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                }`}
              >
                {isOverdue ? "Payment Overdue" : myApp?.subscriptionStatus === "trial" ? "Free Trial Period" : "Active Subscription"}
              </span>
            </div>

            {/* Monthly Subscription Status Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/5 to-transparent border border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-teal-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                    {appType.toUpperCase()} Incubation Monthly Package
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Full Service Package: Attendance, {appType === "physical" ? "Infrastructure, " : ""}Mentors
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                  {myApp?.dueDate
                    ? `Next payment due date: ${new Date(myApp.dueDate).toLocaleDateString()} (${countdown.days}d : ${countdown.hours}h : ${countdown.minutes}m : ${countdown.seconds}s remaining)`
                    : "Payment cycle starts upon application approval by admin."}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{myApp?.monthlyFee || (appType === "physical" ? 5000 : 2500)}
                    <span className="text-xs font-normal text-slate-500"> / month</span>
                  </div>
                  <div className={`text-[10.5px] font-bold ${isOverdue ? "text-rose-500" : "text-teal-600"}`}>
                    {isOverdue ? "Suspended (Pay to reactivate)" : "Active Access"}
                  </div>
                </div>

                {isApproved && (
                  <button
                    type="button"
                    disabled={payingDues}
                    onClick={handlePayMonthlyDues}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {payingDues ? "Processing..." : `Pay Monthly Dues (₹${myApp?.monthlyFee || (appType === "physical" ? 5000 : 2500)})`}
                  </button>
                )}
              </div>
            </div>

            {/* Invoices Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                All Invoices &amp; Transaction Receipts
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px] font-bold">
                      <th className="pb-2.5">Invoice #</th>
                      <th className="pb-2.5">Billing Period / Item</th>
                      <th className="pb-2.5">Gross Amount</th>
                      <th className="pb-2.5">Net Paid</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {accountingData.invoices?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No paid invoices yet. Free trial or pending invoices will appear here.
                        </td>
                      </tr>
                    ) : (
                      accountingData.invoices?.map((inv) => (
                        <tr key={inv._id}>
                          <td className="py-3 font-mono font-bold">{inv.invoiceNumber}</td>
                          <td className="py-3 font-semibold">{inv.billingPeriod}</td>
                          <td className="py-3 text-slate-500">₹{inv.grossAmount}</td>
                          <td className="py-3 font-bold">₹{inv.netAmount}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {inv.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => toast.success(`Receipt for ${inv.invoiceNumber} downloaded!`)}
                              className="text-teal-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Download size={12} /> Receipt
                            </button>
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

        {/* BOOK MENTOR CALL MODAL */}
        {showMentorModal && selectedMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl relative text-xs space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold">Book 1-on-1 with {selectedMentor.name}</h3>
                <button onClick={() => setShowMentorModal(false)} className="text-lg font-bold text-slate-400">✕</button>
              </div>

              <form onSubmit={handleBookMentorSession} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <div className="font-bold text-teal-700 dark:text-teal-300">{selectedMentor.role}</div>
                  <div className="text-[11px] text-slate-500">{selectedMentor.company}</div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">Date:</label>
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Time Slot:</label>
                    <select
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    >
                      <option value="11:00 AM - 11:45 AM">11:00 AM - 11:45 AM</option>
                      <option value="02:00 PM - 02:45 PM">02:00 PM - 02:45 PM</option>
                      <option value="04:00 PM - 04:45 PM">04:00 PM - 04:45 PM</option>
                      <option value="06:00 PM - 06:45 PM">06:00 PM - 06:45 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Discussion Topic / Agenda *:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Valuation review for upcoming seed round"
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Pre-call Notes / Context:</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific questions, deck link, or metrics..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowMentorModal(false)} className="flex-1 py-2 rounded-xl border border-slate-300 font-bold">Cancel</button>
                  <button type="submit" disabled={bookingMentor} className="flex-1 py-2 rounded-xl bg-teal-600 text-white font-bold">
                    {bookingMentor ? "Booking..." : "Confirm Mentorship Call"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

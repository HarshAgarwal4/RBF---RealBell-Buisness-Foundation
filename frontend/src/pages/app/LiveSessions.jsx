import React, { useState, useEffect, useMemo } from "react";
import {
  Radio,
  Search,
  Plus,
  Users,
  Clock,
  Share2,
  Trash2,
  Lock,
  Globe,
  EyeOff,
  Sparkles,
  X,
  Video,
  Settings,
  Check,
  ChevronRight,
  ShieldCheck,
  Copy,
  AlertCircle,
  Play,
  UserCheck,
  UserX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";

export default function LiveSessions() {
  const navigate = useNavigate();
  const { user } = useStore();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // "all" | "mine"
  const [search, setSearch] = useState("");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxQueueSize: 20,
    avgConsultationMins: 10,
    maxDurationLimitMins: 15,
    sessionFormat: "1-to-1 Queue",
    visibility: "public",
    requirePasscode: false,
    passcode: "",
    autoAdmit: true,
  });

  // Manage / Waiting Room Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPasscode, setJoinPasscode] = useState("");
  const [joining, setJoining] = useState(false);

  // Fetch live sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/live-sessions", {
        params: { tab, search },
      });
      if (res.data?.status === 1) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error("Error fetching live sessions:", err);
      toast.error(err?.response?.data?.msg || "Failed to load live sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [tab, search]);

  // Handle Form Change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Create Session Handler
  const handleCreateSession = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a session title");
      return;
    }

    if (formData.requirePasscode && !formData.passcode.trim()) {
      toast.error("Please provide a meeting passcode");
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post("/live-sessions", formData);
      if (res.data?.status === 1) {
        toast.success("Live session created successfully!");
        setShowCreateModal(false);
        // Reset form
        setFormData({
          title: "",
          description: "",
          maxQueueSize: 20,
          avgConsultationMins: 10,
          maxDurationLimitMins: 15,
          sessionFormat: "1-to-1 Queue",
          visibility: "public",
          requirePasscode: false,
          passcode: "",
          autoAdmit: true,
        });
        await fetchSessions();
      } else {
        toast.error(res.data?.msg || "Failed to create session");
      }
    } catch (err) {
      console.error("Error creating session:", err);
      toast.error(err?.response?.data?.msg || "Failed to create live session");
    } finally {
      setCreating(false);
    }
  };

  // Delete Session Handler
  const handleDeleteSession = async (sessionId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to end and delete this live session?")) {
      return;
    }

    try {
      const res = await axios.delete(`/live-sessions/${sessionId}`);
      if (res.data?.status === 1) {
        toast.success("Live session deleted");
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        if (selectedSession?._id === sessionId) {
          setShowManageModal(false);
          setSelectedSession(null);
        }
      } else {
        toast.error(res.data?.msg || "Failed to delete session");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      toast.error(err?.response?.data?.msg || "Failed to delete session");
    }
  };

  // Share session link
  const handleShareSession = (session, e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/live_sessions?session=${session._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Session link copied to clipboard!");
    } else {
      toast.info(`Session Link: ${url}`);
    }
  };

  // Join Queue Handler
  const handleJoinQueue = async () => {
    if (!selectedSession) return;

    if (selectedSession.requirePasscode && !joinPasscode.trim()) {
      toast.error("Please enter the meeting passcode");
      return;
    }

    try {
      setJoining(true);
      const res = await axios.post(`/live-sessions/${selectedSession._id}/join-queue`, {
        passcode: joinPasscode.trim(),
      });
      if (res.data?.status === 1) {
        toast.success(res.data.msg || "Joined waiting queue");
        setJoinPasscode("");
        setShowJoinModal(false);
        await fetchSessions();
      } else {
        toast.error(res.data?.msg || "Failed to join queue");
      }
    } catch (err) {
      console.error("Error joining queue:", err);
      toast.error(err?.response?.data?.msg || "Failed to join queue");
    } finally {
      setJoining(false);
    }
  };

  // Leave Queue Handler
  const handleLeaveQueue = async (sessionId) => {
    try {
      const res = await axios.post(`/live-sessions/${sessionId}/leave-queue`);
      if (res.data?.status === 1) {
        toast.info("You left the waiting queue");
        await fetchSessions();
        if (selectedSession?._id === sessionId) {
          setShowManageModal(false);
        }
      }
    } catch (err) {
      console.error("Error leaving queue:", err);
      toast.error("Failed to leave queue");
    }
  };

  // Helper to format host initials
  const getHostInitials = (host) => {
    const name = host?.name || host?.company_name || "Host";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <>
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-[#0F172A] dark:text-slate-100">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#132034] dark:text-white tracking-tight flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-[#E11D48] animate-pulse" />
                Live Sessions & Waiting Queues
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
                Join expert live consultation queues, team video calls, and one-to-one breakout sessions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] text-white font-bold text-sm shadow-xs transition active:scale-98 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus size={18} />
              Host Live Session
            </button>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            {/* Pill Filters */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("all")}
                className={`px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition cursor-pointer ${
                  tab === "all"
                    ? "bg-[#8E1B2E] text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                All Live & Scheduled
              </button>
              <button
                type="button"
                onClick={() => setTab("mine")}
                className={`px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm transition cursor-pointer ${
                  tab === "mine"
                    ? "bg-[#8E1B2E] text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                My Hosted Sessions
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions or hosts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-xs sm:text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition shadow-xs"
              />
            </div>
          </div>

          {/* Sessions Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-[#8E1B2E] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-500">Loading live sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            /* Clean Empty State (No Dummy Data) */
            <div className="py-16 px-6 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#8E1B2E] flex items-center justify-center mx-auto mb-4">
                <Radio size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">No live sessions right now</h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
                {tab === "mine"
                  ? "You haven't hosted any live sessions yet. Start a session to provide consultations, mentorship, or team queues."
                  : "There are currently no active live consultation queues. Be the first to host one!"}
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] text-white font-bold text-sm shadow-xs transition cursor-pointer"
              >
                <Plus size={16} />
                Host Live Session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sessions.map((session) => {
                const isHost = String(session.host?._id || session.host) === String(user?._id || user?.id);
                const waitingCount = session.queue?.filter((q) => q.status === "waiting").length || 0;
                const userInQueue = session.queue?.find(
                  (q) => String(q.user?._id || q.user) === String(user?._id || user?.id) && (q.status === "waiting" || q.status === "in_consultation")
                );

                return (
                  <div
                    key={session._id}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Top Row: LIVE Badge & Action Icons */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40 dark:text-rose-400 tracking-wide uppercase">
                          <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                          LIVE
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleShareSession(session, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Share Session Link"
                          >
                            <Share2 size={16} />
                          </button>
                          {isHost && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session._id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                              title="Delete Session"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Session Title & Description */}
                      <div className="mt-4">
                        <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-snug line-clamp-1">
                          {session.title}
                        </h2>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                          {session.description || "Live Consultation & Breakout Queue"}
                        </p>
                      </div>

                      {/* Host Profile Info Card */}
                      <div className="mt-4 bg-[#F8FAFC] dark:bg-slate-900/60 rounded-2xl p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-800">
                        {session.host?.account?.image ? (
                          <img
                            src={session.host.account.image}
                            alt={session.host.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#0B1528] dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
                            {getHostInitials(session.host)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white truncate">
                            {session.host?.name || session.host?.company_name || "Host"}
                          </h4>
                          <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                            {session.host?.account?.designation ||
                              session.host?.company_name ||
                              "Organizer"}
                          </p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 font-semibold px-1 mt-4">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-[#8E1B2E]" />
                          <span>Waiting: {waitingCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>Avg: {session.avgConsultationMins}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="mt-5 pt-2">
                      {isHost ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/live_sessions/${session._id}`)}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#0B1528] hover:bg-[#15233D] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                        >
                          <Settings size={16} />
                          Manage Session (Host)
                        </button>
                      ) : session.sessionFormat === "Group Call" ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/live_sessions/${session._id}`)}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                        >
                          <Video size={16} />
                          Join Group Meeting &gt;
                        </button>
                      ) : userInQueue ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/live_sessions/${session._id}`)}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                        >
                          <UserX size={16} />
                          View Waiting Room ({userInQueue.status === "in_consultation" ? "Admitted" : "In Queue"})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/live_sessions/${session._id}`)}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                        >
                          <Video size={16} />
                          Enter Waiting Room &gt;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CREATE LIVE SESSION & QUEUE MODAL (Matches Image 2 exactly)
        ═══════════════════════════════════════════════════════════════ */}
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-xl sm:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-7 max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#8E1B2E] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                    Create Live Session & Queue
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateSession} className="mt-5 space-y-4 sm:space-y-5">
                {/* Session Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Session Title <span className="text-[#E11D48]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g. 1-on-1 Mentorship & Pitch Review"
                    className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xs sm:text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition"
                  />
                </div>

                {/* Description / Agenda */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                    Description / Agenda
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe what users should prepare for before entering queue..."
                    className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xs sm:text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition resize-none"
                  />
                </div>

                {/* 2x2 Grid of Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Max Queue Size */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                      Max Queue Size
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.maxQueueSize}
                      onChange={(e) => handleInputChange("maxQueueSize", e.target.value)}
                      placeholder="20"
                      className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xs sm:text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition"
                    />
                  </div>

                  {/* Avg Consultation (mins) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                      Avg Consultation (mins)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.avgConsultationMins}
                      onChange={(e) => handleInputChange("avgConsultationMins", e.target.value)}
                      placeholder="10"
                      className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xs sm:text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition"
                    />
                  </div>

                  {/* Max Duration Limit (mins) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                      Max Duration Limit (mins)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.maxDurationLimitMins}
                      onChange={(e) => handleInputChange("maxDurationLimitMins", e.target.value)}
                      placeholder="15"
                      className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xs sm:text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition"
                    />
                  </div>

                  {/* Session Format */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-1.5">
                      Session Format
                    </label>
                    <select
                      value={formData.sessionFormat}
                      onChange={(e) => handleInputChange("sessionFormat", e.target.value)}
                      className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-xs sm:text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 focus:border-[#8E1B2E] transition cursor-pointer"
                    >
                      <option value="1-to-1 Queue">1-to-1 Queue</option>
                      <option value="Group Call">Group Call</option>
                    </select>
                  </div>
                </div>

                {/* Session Visibility */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#1E293B] dark:text-slate-200 mb-2">
                    Session Visibility <span className="text-[#E11D48]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Public Option */}
                    <div
                      onClick={() => handleInputChange("visibility", "public")}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        formData.visibility === "public"
                          ? "border-[#8E1B2E] bg-rose-50/20 dark:bg-rose-950/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300"
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            formData.visibility === "public"
                              ? "border-[#8E1B2E] bg-white"
                              : "border-slate-400"
                          }`}
                        >
                          {formData.visibility === "public" && (
                            <div className="w-2 h-2 rounded-full bg-[#8E1B2E]" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Globe size={15} className="text-[#E11D48]" />
                          <span className="font-bold text-xs sm:text-sm text-[#0F172A] dark:text-white">
                            Public Session
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                          Listed live in directory for all members to discover.
                        </p>
                      </div>
                    </div>

                    {/* Private Option */}
                    <div
                      onClick={() => handleInputChange("visibility", "private")}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        formData.visibility === "private"
                          ? "border-[#8E1B2E] bg-rose-50/20 dark:bg-rose-950/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300"
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            formData.visibility === "private"
                              ? "border-[#8E1B2E] bg-white"
                              : "border-slate-400"
                          }`}
                        >
                          {formData.visibility === "private" && (
                            <div className="w-2 h-2 rounded-full bg-[#8E1B2E]" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <EyeOff size={15} className="text-slate-500" />
                          <span className="font-bold text-xs sm:text-sm text-[#0F172A] dark:text-white">
                            Private Session
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                          Hidden from directory. Accessible by direct link or connection invite.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Require Meeting Passcode Box */}
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
                        <Lock size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                          Require Meeting Passcode
                        </h4>
                        <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400">
                          Participants must enter this password to join the waiting room
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requirePasscode}
                        onChange={(e) => handleInputChange("requirePasscode", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B1528] dark:peer-checked:bg-[#8E1B2E]" />
                    </label>
                  </div>

                  {formData.requirePasscode && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-900/40">
                      <input
                        type="text"
                        required={formData.requirePasscode}
                        value={formData.passcode}
                        onChange={(e) => handleInputChange("passcode", e.target.value)}
                        placeholder="Enter meeting passcode (e.g. 123456)"
                        className="w-full rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Auto-admit Next Participant Checkbox */}
                <div
                  onClick={() => handleInputChange("autoAdmit", !formData.autoAdmit)}
                  className="flex items-center gap-3 cursor-pointer select-none py-1"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      formData.autoAdmit
                        ? "bg-[#8E1B2E] border-[#8E1B2E] text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {formData.autoAdmit && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#334155] dark:text-slate-300">
                    Auto-admit next participant when current consultation ends
                  </span>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#8E1B2E] hover:bg-[#721524] shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Session"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PASSCODE ENTRY MODAL (When participant joins passcode session)
        ═══════════════════════════════════════════════════════════════ */}
        {showJoinModal && selectedSession && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <div
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Lock size={16} />
                  </div>
                  <h3 className="font-bold text-[#0F172A] dark:text-white">Enter Meeting Passcode</h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                This live session is passcode protected by the host. Please enter the passcode to enter the waiting queue.
              </p>

              <div className="mt-4">
                <input
                  type="password"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={joining}
                  onClick={handleJoinQueue}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8E1B2E] hover:bg-[#721524] shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {joining ? "Joining..." : "Enter Queue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MANAGE SESSION MODAL (For Host)
        ═══════════════════════════════════════════════════════════════ */}
        {showManageModal && selectedSession && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setShowManageModal(false)}
          >
            <div
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0B1528] text-white flex items-center justify-center">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] dark:text-white text-lg">
                      {selectedSession.title}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Host Queue Management ({selectedSession.sessionFormat})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Session Overview Stats */}
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Waiting</span>
                  <div className="text-lg font-extrabold text-[#8E1B2E]">
                    {selectedSession.queue?.filter((q) => q.status === "waiting").length || 0}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Max Limit</span>
                  <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedSession.maxQueueSize}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Avg Duration</span>
                  <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {selectedSession.avgConsultationMins}m
                  </div>
                </div>
              </div>

              {/* Waiting Queue List */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Live Waiting Queue
                </h4>
                {selectedSession.queue?.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Users size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-medium text-slate-500">
                      No participants currently in waiting queue.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSession.queue?.map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#8E1B2E] text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                              {item.user?.name || item.user?.company_name || "User"}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Status: <span className="capitalize font-semibold text-[#8E1B2E]">{item.status}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              toast.info(`Calling ${item.user?.name || "participant"}...`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0B1528] text-white text-xs font-bold hover:bg-[#15233D] cursor-pointer flex items-center gap-1"
                          >
                            <Play size={12} /> Admit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Host Actions Footer */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => handleShareSession(selectedSession, e)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 size={14} /> Copy Invite Link
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(selectedSession._id, e)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> End & Delete Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

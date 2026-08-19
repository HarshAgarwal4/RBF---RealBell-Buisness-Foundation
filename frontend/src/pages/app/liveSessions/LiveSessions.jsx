import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Video,
  Users,
  Clock,
  Plus,
  Play,
  Settings,
  ShieldCheck,
  Search,
  ExternalLink,
  Radio,
  X,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Share2,
  Copy,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Check,
  Globe,
  EyeOff,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import ShareMeetingModal from "../../../components/ShareMeetingModal";
import axios from "../../../services/axios";
import { useStore } from "../../../zustand/store";
import { toast } from "react-toastify";

export default function LiveSessions() {
  const navigate = useNavigate();
  const { user } = useStore();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";
  const [tab, setTab] = useState("active"); // "active" | "mine"
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareModalSession, setShareModalSession] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const socketRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const url = tab === "mine" ? "/live-sessions/my-sessions" : "/live-sessions";
      const res = await axios.get(url);
      if (res.data?.status === 1) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
      toast.error("Failed to load live sessions");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time socket listener for global live session state changes
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(backendUrl, {
      auth: { userId: user?._id },
      query: { userId: user?._id },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("session:started", (data) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === data.sessionId ? { ...s, status: "LIVE" } : s))
      );
    });

    socket.on("session:ended", (data) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === data.sessionId ? { ...s, status: "ENDED" } : s))
      );
    });

    socket.on("session:deleted", (data) => {
      setSessions((prev) => prev.filter((s) => s._id !== data.sessionId));
    });

    socket.on("session:paused", (data) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === data.sessionId ? { ...s, status: "PAUSED" } : s))
      );
    });

    socket.on("session:resumed", (data) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === data.sessionId ? { ...s, status: "LIVE" } : s))
      );
    });

    socket.on("queue:update", (data) => {
      if (data.sessionId && data.waitingCount !== undefined) {
        setSessions((prev) =>
          prev.map((s) =>
            s._id === data.sessionId ? { ...s, waitingCount: data.waitingCount } : s
          )
        );
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, backendUrl]);

  const handleDeleteSession = async (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this live session? All active queues will be cancelled.")) {
      return;
    }

    try {
      setDeletingId(sessionId);
      const res = await axios.delete(`/live-sessions/${sessionId}`);
      if (res.data?.status === 1) {
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        toast.success("Session deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = (sessionId, e) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/live-sessions/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success("Direct meeting link copied to clipboard!");
  };

  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.hostId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.hostId?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-3 sm:px-6 lg:px-8 pb-10 min-h-screen bg-[#F5F7FB] max-w-full overflow-hidden">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">
                Live Sessions & Waiting Queues
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Join expert live consultation queues, team video calls, and one-to-one breakout sessions.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#b03052] px-4 py-3 text-sm font-semibold text-white hover:bg-[#96263f] transition shadow-md cursor-pointer"
          >
            <Plus size={18} />
            Host Live Session
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTab("active")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                tab === "active"
                  ? "bg-[#b03052] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Live & Scheduled
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                tab === "mine"
                  ? "bg-[#b03052] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              My Hosted Sessions
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sessions or hosts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* SESSIONS GRID */}
        {loading ? (
          <div className="mt-8 rounded-3xl bg-white border border-dashed border-gray-200 p-16 text-center text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full text-[#b03052] mb-3"></div>
            <p className="text-sm font-medium">Loading live sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white border border-dashed border-gray-200 p-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#b03052] mb-4">
              <Radio size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800">No live sessions found</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              {tab === "mine"
                ? "You haven't hosted any live sessions yet. Click 'Host Live Session' to start one."
                : "There are currently no active or upcoming live sessions. Check back soon or create your own!"}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredSessions.map((s) => {
              const isHost = String(s.hostId?._id || s.hostId) === String(user?._id);
              const isLive = s.status === "LIVE";
              const isPaused = s.status === "PAUSED";
              const isEnded = s.status === "ENDED";

              return (
                <div
                  key={s._id}
                  className="rounded-3xl bg-white border border-gray-100 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Status & Type */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isLive
                              ? "bg-rose-100 text-rose-700 animate-pulse"
                              : isPaused
                              ? "bg-amber-100 text-amber-800"
                              : isEnded
                              ? "bg-gray-100 text-gray-600"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />}
                          {s.status}
                        </span>

                        {s.isPasswordProtected && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                            <Lock size={11} /> Passcode
                          </span>
                        )}

                        {s.visibility === "private" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-100 border border-gray-200/80 px-2 py-0.5 rounded-full">
                            <EyeOff size={11} /> Private
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareModalSession(s);
                          }}
                          title="Share direct meeting link"
                          className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                          <Share2 size={15} />
                        </button>
                        {isHost && (
                          <button
                            onClick={(e) => handleDeleteSession(s._id, e)}
                            disabled={deletingId === s._id}
                            title="Delete session"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{s.title}</h3>
                    {s.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{s.description}</p>
                    )}

                    {/* Host Details */}
                    <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <img
                        src={
                          s.hostId?.account?.image ||
                          s.hostId?.profile?.logo ||
                          `https://placehold.co/100x100/18213A/FFFFFF?text=${encodeURIComponent(
                            (s.hostId?.name || "Host").slice(0, 2).toUpperCase()
                          )}`
                        }
                        alt="Host"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {s.hostId?.name || "Host"}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {s.hostId?.company_name || s.hostId?.email || "Organizer"}
                        </p>
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                        <Users size={14} className="text-[#b03052]" />
                        <span>
                          Waiting: <strong className="text-gray-900">{s.waitingCount || 0}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                        <Clock size={14} className="text-[#0b1a3a]" />
                        <span>
                          Avg: <strong className="text-gray-900">{s.averageConsultationDuration || 10}m</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
                    {isHost ? (
                      <button
                        onClick={() => navigate(`/live-sessions/${s._id}/host`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0b1a3a] text-white text-xs sm:text-sm font-semibold hover:bg-[#132b5c] transition cursor-pointer"
                      >
                        <Settings size={15} />
                        Manage Session (Host)
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/live-sessions/${s._id}`)}
                        disabled={isEnded}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                          isEnded
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#b03052] text-white hover:bg-[#96263f] shadow-xs"
                        }`}
                      >
                        <Video size={15} />
                        {isEnded ? "Session Ended" : "Enter Waiting Room"}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <CreateLiveSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchSessions();
          }}
        />
      )}

      {/* SHARE MEETING MODAL */}
      {shareModalSession && (
        <ShareMeetingModal
          session={shareModalSession}
          onClose={() => setShareModalSession(null)}
        />
      )}
    </>
  );
}

function CreateLiveSessionModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    sessionType: "one-to-one",
    maxQueueSize: 20,
    maxConsultationDuration: 15,
    averageConsultationDuration: 10,
    autoNextParticipant: true,
    isPasswordProtected: false,
    passcode: "",
    visibility: "public",
  });
  const [submitting, setSubmitting] = useState(false);

  const generateRandomPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleTogglePassword = (e) => {
    const checked = e.target.checked;
    setForm({
      ...form,
      isPasswordProtected: checked,
      passcode: checked ? form.passcode || generateRandomPin() : "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a session title");
      return;
    }

    if (form.isPasswordProtected && !form.passcode.trim()) {
      toast.error("Please enter a meeting passcode or disable password protection");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/live-sessions", form);
      if (res.data?.status === 1) {
        toast.success("Live session created successfully!");
        onCreated();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-fade-in text-gray-900 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#b03052] flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xl font-bold">Create Live Session & Queue</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Session Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 1-on-1 Mentorship & Pitch Review"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b03052]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Agenda
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what users should prepare for before entering queue..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b03052] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Max Queue Size
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={form.maxQueueSize}
                onChange={(e) => setForm({ ...form, maxQueueSize: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Avg Consultation (mins)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={form.averageConsultationDuration}
                onChange={(e) => setForm({ ...form, averageConsultationDuration: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Max Duration Limit (mins)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={form.maxConsultationDuration}
                onChange={(e) => setForm({ ...form, maxConsultationDuration: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Session Format
              </label>
              <select
                value={form.sessionType}
                onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
              >
                <option value="one-to-one">1-to-1 Queue</option>
                <option value="group">Team Group Call</option>
              </select>
            </div>
          </div>

          {/* VISIBILITY (PUBLIC VS PRIVATE) */}
          <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-gray-900 mb-1">
              Session Visibility <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  form.visibility === "public"
                    ? "bg-white border-[#b03052] ring-1 ring-[#b03052]"
                    : "bg-gray-50/80 border-gray-200 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={form.visibility === "public"}
                  onChange={() => setForm({ ...form, visibility: "public" })}
                  className="mt-0.5 text-[#b03052] focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                    <Globe size={13} className="text-rose-600" />
                    Public Session
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                    Listed live in directory for all members to discover.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  form.visibility === "private"
                    ? "bg-white border-[#b03052] ring-1 ring-[#b03052]"
                    : "bg-gray-50/80 border-gray-200 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={form.visibility === "private"}
                  onChange={() => setForm({ ...form, visibility: "private" })}
                  className="mt-0.5 text-[#b03052] focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                    <EyeOff size={13} className="text-amber-600" />
                    Private Session
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                    Hidden from directory. Accessible by direct link or connection invite.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* PASSWORD PROTECTION TOGGLE */}
          <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-600" />
                <div>
                  <span className="text-xs font-bold text-gray-900">Require Meeting Passcode</span>
                  <p className="text-[11px] text-gray-500">
                    Participants must enter this password to join the waiting room
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.isPasswordProtected}
                onChange={handleTogglePassword}
                className="w-4 h-4 text-[#b03052] rounded focus:ring-0 cursor-pointer"
              />
            </label>

            {form.isPasswordProtected && (
              <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.passcode}
                    onChange={(e) => setForm({ ...form, passcode: e.target.value })}
                    placeholder="Enter meeting passcode or PIN"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, passcode: generateRandomPin() })}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Generate PIN
                </button>
              </div>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.autoNextParticipant}
                onChange={(e) => setForm({ ...form, autoNextParticipant: e.target.checked })}
                className="w-4 h-4 text-[#b03052] rounded focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-gray-700 font-medium">
                Auto-admit next participant when current consultation ends
              </span>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#b03052] text-white text-xs font-semibold hover:bg-[#96263f] transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

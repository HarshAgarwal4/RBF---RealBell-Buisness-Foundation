import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Users,
  Video,
  Play,
  Pause,
  StopCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  PhoneCall,
  PhoneOff,
  UserCheck,
  UserX,
  Radio,
  Share2,
  Copy,
  Lock,
  KeyRound,
  Trash2,
  Check,
  X,
  BarChart2,
  FastForward,
  RefreshCw,
  Settings,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import ShareMeetingModal from "../../../components/ShareMeetingModal";
import axios from "../../../services/axios";
import { useStore } from "../../../zustand/store";
import { toast } from "react-toastify";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function HostDashboard() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";

  const [session, setSession] = useState(null);
  const [queue, setQueue] = useState([]);
  const [liveMembersCount, setLiveMembersCount] = useState(1);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [currentQueueEntry, setCurrentQueueEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [consultationSeconds, setConsultationSeconds] = useState(0);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  const fetchSessionAndQueue = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionRes, queueRes] = await Promise.all([
        axios.get(`/live-sessions/${sessionId}`),
        axios.get(`/live-sessions/${sessionId}/queue`),
      ]);

      if (sessionRes.data?.status === 1) {
        setSession(sessionRes.data.session);
      }

      if (queueRes.data?.status === 1) {
        setQueue(queueRes.data.queue || []);
        setCurrentParticipant(queueRes.data.currentParticipant || null);
        setCurrentQueueEntry(queueRes.data.currentQueueEntry || null);
      }
    } catch (err) {
      console.error("Failed to load host dashboard data:", err);
      toast.error("Failed to load session details");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionAndQueue();
  }, [fetchSessionAndQueue]);

  // Consultation duration timer
  useEffect(() => {
    if (currentParticipant) {
      if (timerRef.current) clearInterval(timerRef.current);
      setConsultationSeconds(0);
      timerRef.current = setInterval(() => {
        setConsultationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setConsultationSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentParticipant]);

  // Socket setup for real-time queue & consultation events
  useEffect(() => {
    if (!sessionId) return;

    const socket = io(backendUrl, {
      auth: { userId: user?._id },
      query: { userId: user?._id },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit("session:join", { sessionId: String(sessionId) });
    };

    socket.on("connect", joinRoom);
    if (socket.connected) {
      joinRoom();
    }

    socket.on("session:members:update", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setLiveMembersCount(data.count || 1);
      }
    });

    socket.on("queue:update", (data) => {
      if (String(data?.sessionId) === String(sessionId) && Array.isArray(data.queue)) {
        setQueue(data.queue);
      }
    });

    socket.on("participant:admitted", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setCurrentParticipant(data.participant || null);
        setCurrentQueueEntry(data.queueEntry || null);
        toast.success(`Participant admitted to consultation`);
      }
    });

    socket.on("consultation:started", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setCurrentParticipant(data.participant || null);
      }
    });

    socket.on("consultation:ended", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setCurrentParticipant(null);
        setCurrentQueueEntry(null);
      }
    });

    socket.on("session:started", (data) => {
      if (!data?.sessionId || String(data.sessionId) === String(sessionId)) {
        setSession((prev) => (prev ? { ...prev, status: "LIVE", queuePaused: false } : null));
      }
    });

    socket.on("session:paused", (data) => {
      if (!data?.sessionId || String(data.sessionId) === String(sessionId)) {
        setSession((prev) => (prev ? { ...prev, status: "PAUSED", queuePaused: true } : null));
      }
    });

    socket.on("session:resumed", (data) => {
      if (!data?.sessionId || String(data.sessionId) === String(sessionId)) {
        setSession((prev) => (prev ? { ...prev, status: "LIVE", queuePaused: false } : null));
      }
    });

    socket.on("session:ended", (data) => {
      if (!data?.sessionId || String(data.sessionId) === String(sessionId)) {
        setSession((prev) => (prev ? { ...prev, status: "ENDED" } : null));
      }
    });

    // Background auto-sync every 4s for zero-refresh resilience
    const syncInterval = setInterval(async () => {
      try {
        const queueRes = await axios.get(`/live-sessions/${sessionId}/queue`);
        if (queueRes.data?.status === 1 && Array.isArray(queueRes.data.queue)) {
          setQueue(queueRes.data.queue);
          if (queueRes.data.currentParticipant !== undefined) {
            setCurrentParticipant(queueRes.data.currentParticipant);
          }
          if (queueRes.data.currentQueueEntry !== undefined) {
            setCurrentQueueEntry(queueRes.data.currentQueueEntry);
          }
        }
      } catch (_) {}
    }, 4000);

    return () => {
      clearInterval(syncInterval);
      socket.emit("session:leave", { sessionId: String(sessionId) });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, user?._id, backendUrl]);

  /* ── Host Actions ── */

  const handleStartSession = async () => {
    try {
      setActionLoading(true);
      const res = await axios.patch(`/live-sessions/${sessionId}/start`);
      if (res.data?.status === 1) {
        setSession(res.data.session);
        toast.success("Live session started!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to start session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async () => {
    try {
      setActionLoading(true);
      const nextState = !session?.queuePaused;
      const res = await axios.patch(`/live-sessions/${sessionId}/queue-pause`, {
        pause: nextState,
      });
      if (res.data?.status === 1) {
        setSession((prev) => ({ ...prev, queuePaused: res.data.queuePaused }));
        toast.info(res.data.queuePaused ? "Queue paused" : "Queue resumed");
      }
    } catch (err) {
      toast.error("Failed to toggle queue pause");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this live session? All queued participants will be notified.")) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await axios.patch(`/live-sessions/${sessionId}/end`);
      if (res.data?.status === 1) {
        setSession(res.data.session);
        toast.success("Session ended successfully");
      }
    } catch (err) {
      toast.error("Failed to end session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this live session? All active queues will be cancelled.")) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await axios.delete(`/live-sessions/${sessionId}`);
      if (res.data?.status === 1) {
        toast.success("Live session deleted successfully");
        navigate("/live-sessions", { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Failed to delete session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdmit = async (entryId) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/live-sessions/${sessionId}/queue/${entryId}/admit`);
      if (res.data?.status === 1) {
        setCurrentParticipant(res.data.entry?.userId || null);
        setCurrentQueueEntry(res.data.entry || null);
        toast.success("Participant admitted!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to admit participant");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (entryId) => {
    try {
      const res = await axios.post(`/live-sessions/${sessionId}/queue/${entryId}/reject`);
      if (res.data?.status === 1) {
        toast.info("Participant rejected");
      }
    } catch (err) {
      toast.error("Failed to reject participant");
    }
  };

  const handleEndConsultation = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/live-sessions/${sessionId}/consultation/end`);
      if (res.data?.status === 1) {
        setCurrentParticipant(null);
        setCurrentQueueEntry(null);
        toast.success("Consultation ended");
        if (res.data.autoNextTriggered && res.data.nextParticipant) {
          toast.info(`Auto-admitted next user: ${res.data.nextParticipant.userId?.name || "Participant"}`);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to end consultation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextParticipant = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/live-sessions/${sessionId}/next`);
      if (res.data?.status === 1) {
        if (res.data.nextEntry) {
          toast.success("Moved to next participant!");
        } else {
          toast.info("Queue is empty");
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to advance queue");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterCallRoom = () => {
    navigate(`/live-sessions/${sessionId}/room`);
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-4 pb-10 min-h-screen bg-[#F5F7FB] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin inline-block w-10 h-10 border-4 border-current border-t-transparent rounded-full text-[#b03052] mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading Host Dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Sidebar />
        <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-4 pb-10 min-h-screen bg-[#F5F7FB] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
            <h2 className="text-lg font-bold">Session not found</h2>
            <button onClick={() => navigate("/live-sessions")} className="mt-4 px-4 py-2 bg-black text-white rounded-xl text-xs">
              Back to Sessions
            </button>
          </div>
        </div>
      </>
    );
  }

  const isLive = session.status === "LIVE";
  const maxDurationSec = (session.maxConsultationDuration || 15) * 60;
  const isNearDurationLimit = consultationSeconds >= Math.max(0, maxDurationSec - 120);

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-3 sm:px-6 lg:px-8 pb-12 min-h-screen bg-[#F5F7FB] text-gray-900 max-w-full overflow-hidden">
        {/* HEADER BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-100 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  isLive
                    ? "bg-rose-100 text-rose-700 animate-pulse"
                    : session.status === "PAUSED"
                    ? "bg-amber-100 text-amber-800"
                    : session.status === "ENDED"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isLive && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />}
                {session.status}
              </span>
              <span className="text-xs text-gray-400 font-medium">Host Console</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                {liveMembersCount} Active in Session
              </span>
              {session.isPasswordProtected && session.passcode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <Lock size={12} className="text-amber-700" />
                  PIN: {session.passcode}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{session.title}</h1>
            <p className="text-xs text-gray-500">
              Max duration: {session.maxConsultationDuration}m • Avg duration: {session.averageConsultationDuration}m
            </p>
          </div>

          {/* Lifecycle & Utility Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition shadow-2xs cursor-pointer"
            >
              <Share2 size={14} className="text-[#b03052]" /> Share Link
            </button>

            {!isLive && session.status !== "ENDED" && (
              <button
                onClick={handleStartSession}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
              >
                <Play size={14} /> Start Session
              </button>
            )}

            {isLive && (
              <button
                onClick={handleTogglePause}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-xs cursor-pointer"
              >
                <Pause size={14} /> {session.queuePaused ? "Resume Queue" : "Pause Queue"}
              </button>
            )}

            {session.status !== "ENDED" && (
              <button
                onClick={handleEndSession}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition shadow-xs cursor-pointer"
              >
                <StopCircle size={14} /> End Session
              </button>
            )}

            <button
              onClick={handleDeleteSession}
              disabled={actionLoading}
              title="Delete session"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition shadow-2xs cursor-pointer"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: LIVE CONSULTATION (LEFT) & WAITING QUEUE (RIGHT) */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: CURRENT CONSULTATION CARD */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {session?.sessionType === "group" ? (
              /* GROUP SESSION / TEAM CALL HOST CARD */
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100 animate-fade-in">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Team Video Call Room
                    </h2>
                  </div>
                  <span className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
                    Group Session
                  </span>
                </div>

                <div className="py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-[#b03052] mx-auto flex items-center justify-center mb-3 shadow-xs">
                    <Users size={32} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    Multi-Participant Video Room
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {isLive
                      ? `Team call is LIVE with ${liveMembersCount} participant(s) in session. Click below to enter the video conference.`
                      : "Start the session from the top bar to open the team call for all participants."}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 max-w-md mx-auto">
                    <button
                      onClick={handleEnterCallRoom}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video size={18} /> Enter Group Video Call
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={14} className="text-[#b03052]" /> Invite Connections & Share
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 1-TO-1 CONSULTATION HOST CARD */
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Live Consultation
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {formatDuration(consultationSeconds)} / {formatDuration(maxDurationSec)}
                  </span>
                </div>

                {isNearDurationLimit && currentParticipant && (
                  <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs font-semibold animate-pulse">
                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                    <span>Warning: Max consultation duration will be reached in under 2 minutes.</span>
                  </div>
                )}

                {currentParticipant ? (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <img
                        src={
                          currentParticipant?.account?.image ||
                          currentParticipant?.profile?.logo ||
                          `https://placehold.co/100x100/0F3D4A/FFFFFF?text=${encodeURIComponent(
                            (currentParticipant?.name || "User").slice(0, 2).toUpperCase()
                          )}`
                        }
                        alt="Current Participant"
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {currentParticipant.name || "Participant"}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {currentParticipant.company_name || currentParticipant.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                          In Consultation
                        </span>
                      </div>
                    </div>

                    {/* Consultation Controls */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={handleEnterCallRoom}
                        className="col-span-2 py-3 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Video size={16} /> Enter Video Call Room
                      </button>

                      <button
                        onClick={handleEndConsultation}
                        disabled={actionLoading}
                        className="py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PhoneOff size={14} /> End Consultation
                      </button>

                      <button
                        onClick={handleNextParticipant}
                        disabled={actionLoading || queue.length === 0}
                        className="py-2.5 rounded-xl bg-[#0b1a3a] text-white text-xs font-bold hover:bg-[#132b5c] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <FastForward size={14} /> Next Participant
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center mb-3">
                      <Users size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700">No active consultation</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      {queue.length > 0
                        ? "Admit a waiting participant from the queue on the right to start consultation."
                        : "The waiting queue is currently empty."}
                    </p>

                    {queue.length > 0 && (
                      <button
                        onClick={() => handleAdmit(queue[0]._id)}
                        className="mt-5 px-6 py-2.5 rounded-xl bg-[#b03052] text-white text-xs font-bold hover:bg-[#96263f] transition shadow-xs cursor-pointer"
                      >
                        Admit #1 ({queue[0].userId?.name || "Participant"})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Session Stats */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <BarChart2 size={14} /> Session Performance
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-lg font-extrabold text-gray-900">
                    {session.stats?.totalCompleted || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">Completed</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-lg font-extrabold text-gray-900">
                    {session.stats?.totalAdmitted || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">Total Admitted</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-lg font-extrabold text-gray-900">
                    {queue.length}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">In Queue</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: WAITING QUEUE CARD */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100 min-h-[500px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                      Waiting Queue ({queue.length})
                    </h2>
                    <p className="text-xs text-gray-500">Ordered by arrival time & priority</p>
                  </div>

                  <button
                    onClick={fetchSessionAndQueue}
                    title="Refresh Queue"
                    className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>

                {queue.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-500">No users in waiting queue</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Users who join this session's waiting room will appear here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {queue.map((entry) => {
                      const participantName = entry.userId?.name || "Participant";
                      const participantAvatar =
                        entry.userId?.account?.image ||
                        entry.userId?.profile?.logo ||
                        `https://placehold.co/80x80/18213A/FFFFFF?text=${encodeURIComponent(
                          participantName.slice(0, 2).toUpperCase()
                        )}`;

                      return (
                        <div
                          key={entry._id}
                          className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Position pill */}
                            <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-900 font-extrabold text-xs flex items-center justify-center shadow-2xs flex-shrink-0">
                              #{entry.position}
                            </div>

                            <img
                              src={participantAvatar}
                              alt={participantName}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                            />

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">
                                {participantName}
                              </h4>
                              <p className="text-[11px] text-gray-500 truncate">
                                {entry.userId?.company_name || entry.userId?.email}
                              </p>
                            </div>
                          </div>

                          {/* Admit & Reject buttons */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleAdmit(entry._id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-[#b03052] text-white text-xs font-semibold hover:bg-[#96263f] transition shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Admit to Consultation"
                            >
                              <UserCheck size={13} /> Admit
                            </button>
                            <button
                              onClick={() => handleReject(entry._id)}
                              disabled={actionLoading}
                              className="px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Reject User"
                            >
                              <UserX size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom auto-next indicator */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Auto-next:{" "}
                  <strong>{session.autoNextParticipant ? "Enabled" : "Disabled"}</strong>
                </span>
                <span>
                  Queue status:{" "}
                  <strong className={session.queuePaused ? "text-amber-600" : "text-emerald-600"}>
                    {session.queuePaused ? "Paused" : "Active"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareMeetingModal
          session={session}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}

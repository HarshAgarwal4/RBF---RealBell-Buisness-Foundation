import React, { useState, useEffect, useRef } from "react";
import {
  Share2,
  Pause,
  Play,
  Power,
  Trash2,
  Video,
  UserCheck,
  UserX,
  RotateCcw,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  PhoneOff,
  Sparkles,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import axios from "../../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";
import { useVideoCall } from "../../../context/VideoCallContext";

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function LiveSessionHostConsole({ session: initialSession, socket, onSessionUpdate, onSessionDeleted }) {
  const { user } = useStore();
  const { initiateCall } = useVideoCall();

  const [session, setSession] = useState(initialSession);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Sync state
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  // Consultation elapsed timer
  useEffect(() => {
    if (session?.activeConsultation?.user && session?.activeConsultation?.startedAt) {
      const startTime = new Date(session.activeConsultation.startedAt).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diff);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [session?.activeConsultation]);

  // Listen for socket queue & state updates
  useEffect(() => {
    if (!socket || !session?._id) return;

    const handleStateUpdate = (data) => {
      if (data?.session) {
        setSession(data.session);
        if (onSessionUpdate) onSessionUpdate(data.session);
      }
    };

    const handleQueueUpdate = (data) => {
      setSession((prev) => ({
        ...prev,
        queue: data.queue,
        stats: data.stats || prev.stats,
      }));
    };

    const handleQueuePaused = (data) => {
      setSession((prev) => ({ ...prev, isPaused: data.isPaused }));
    };

    socket.on("live-session:state:updated", handleStateUpdate);
    socket.on("live-session:queue:updated", handleQueueUpdate);
    socket.on("live-session:queue:paused", handleQueuePaused);

    return () => {
      socket.off("live-session:state:updated", handleStateUpdate);
      socket.off("live-session:queue:updated", handleQueueUpdate);
      socket.off("live-session:queue:paused", handleQueuePaused);
    };
  }, [socket, session?._id, onSessionUpdate]);

  // Fast background polling fallback (every 2 seconds)
  useEffect(() => {
    if (!session?._id) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/live-sessions/${session._id}`);
        if (res.data?.status === 1 && res.data.session) {
          setSession((prev) => {
            const queueChanged = JSON.stringify(prev?.queue) !== JSON.stringify(res.data.session.queue);
            const activeChanged = JSON.stringify(prev?.activeConsultation) !== JSON.stringify(res.data.session.activeConsultation);
            const statsChanged = JSON.stringify(prev?.stats) !== JSON.stringify(res.data.session.stats);
            if (queueChanged || activeChanged || statsChanged) {
              if (onSessionUpdate) onSessionUpdate(res.data.session);
              return res.data.session;
            }
            return prev;
          });
        }
      } catch (_) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [session?._id, onSessionUpdate]);

  // Host Action: Admit Participant
  const handleAdmit = async (participantId) => {
    try {
      if (socket) {
        socket.emit("live-session:admit", { sessionId: session._id, participantId });
      }
      const res = await axios.post(`/live-sessions/${session._id}/admit`, { participantId });
      if (res.data?.status === 1) {
        setSession(res.data.session);
        if (onSessionUpdate) onSessionUpdate(res.data.session);
        toast.success("Participant admitted into consultation!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to admit participant");
    }
  };

  // Host Action: End Consultation
  const handleEndConsultation = async () => {
    try {
      if (socket) {
        socket.emit("live-session:end-consultation", { sessionId: session._id });
      }
      const res = await axios.post(`/live-sessions/${session._id}/end-consultation`);
      if (res.data?.status === 1) {
        setSession(res.data.session);
        if (onSessionUpdate) onSessionUpdate(res.data.session);
        toast.info("Consultation completed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to end consultation");
    }
  };

  // Host Action: Next Participant
  const handleNextParticipant = async () => {
    await handleEndConsultation();
  };

  // Host Action: Toggle Pause Queue
  const handleTogglePause = async () => {
    try {
      const res = await axios.post(`/live-sessions/${session._id}/pause-queue`);
      if (res.data?.status === 1) {
        setSession((prev) => ({ ...prev, isPaused: res.data.isPaused }));
        toast.info(res.data.isPaused ? "Queue has been paused" : "Queue is now active");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to toggle queue pause");
    }
  };

  // Host Action: End Session
  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this live session for everyone?")) return;
    try {
      const res = await axios.delete(`/live-sessions/${session._id}`);
      if (res.data?.status === 1) {
        toast.success("Live session ended");
        if (onSessionDeleted) onSessionDeleted();
      }
    } catch (err) {
      toast.error("Failed to end session");
    }
  };

  // Share session link
  const handleShare = () => {
    const url = `${window.location.origin}/live_sessions/${session._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Session link copied to clipboard!");
    } else {
      toast.info(`Session URL: ${url}`);
    }
  };

  // Trigger Video Call
  const handleEnterCallRoom = () => {
    const activeUserId = session.activeConsultation?.user?._id || session.activeConsultation?.user;
    if (!activeUserId) {
      toast.warn("No active participant in consultation");
      return;
    }
    const participantObj = session.activeConsultation?.user || { _id: activeUserId, name: "Participant" };
    initiateCall(participantObj, "video");
  };

  const waitingQueue = session.queue?.filter((q) => q.status === "waiting") || [];
  const activeUser = session.activeConsultation?.user;
  const activeName = activeUser?.name || activeUser?.company_name || (activeUser ? "Admitted Participant" : null);
  const activeSubtitle = activeUser?.account?.designation || activeUser?.company_name || "Guest";
  const activeInitials = activeName ? activeName.substring(0, 2).toUpperCase() : "DR";

  return (
    <>
      <Sidebar />

      <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 pb-12">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
          {/* Top Header Card matching Image 1 */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                  LIVE
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                  Host Console
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {activeUser ? "1 Active in Session" : "0 Active in Session"}
                </span>
              </div>

              {/* Session Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
                {session.title}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Max duration: {session.maxDurationLimitMins}m • Avg duration: {session.avgConsultationMins}m
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Share2 size={14} />
                Share Link
              </button>

              <button
                type="button"
                onClick={handleTogglePause}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  session.isPaused
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                }`}
              >
                {session.isPaused ? <Play size={14} /> : <Pause size={14} />}
                {session.isPaused ? "Resume Queue" : "Pause Queue"}
              </button>

              <button
                type="button"
                onClick={handleEndSession}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0B1528] hover:bg-[#182640] text-white shadow-xs transition cursor-pointer"
              >
                <Power size={14} />
                End Session
              </button>

              <button
                type="button"
                onClick={handleEndSession}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>

          {/* Main 2-Column Grid matching Image 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* LIVE CONSULTATION CARD */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-5">
                {/* Header with Live Dot & Timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0F172A] dark:text-white">
                      LIVE CONSULTATION
                    </h2>
                  </div>

                  <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    {formatTimer(elapsedSeconds)} / {session.maxDurationLimitMins}:00
                  </div>
                </div>

                {/* Active Participant Box */}
                {activeUser ? (
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {activeUser.account?.image ? (
                        <img
                          src={activeUser.account.image}
                          alt={activeName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#0B1528] dark:bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
                          {activeInitials}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white">
                          {activeName}
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-slate-400">
                          {activeSubtitle}
                        </p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
                          In Consultation
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <Users size={24} className="mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No active consultation right now.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Admit a participant from the waiting queue on the right to start consultation.
                    </p>
                  </div>
                )}

                {/* Big Green Action Button */}
                <button
                  type="button"
                  onClick={handleEnterCallRoom}
                  disabled={!activeUser}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Video size={18} />
                  Enter Video Call Room
                </button>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleEndConsultation}
                    disabled={!activeUser}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200/60 dark:border-rose-900/40 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <PhoneOff size={14} />
                    End Consultation
                  </button>

                  <button
                    type="button"
                    onClick={handleNextParticipant}
                    disabled={waitingQueue.length === 0}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <UserCheck size={14} />
                    Next Participant
                  </button>
                </div>
              </div>

              {/* SESSION PERFORMANCE CARD */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-slate-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    SESSION PERFORMANCE
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-2xl font-extrabold text-[#0F172A] dark:text-white">
                      {session.stats?.completedCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">Completed</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-2xl font-extrabold text-[#0F172A] dark:text-white">
                      {session.stats?.totalAdmittedCount || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">Total Admitted</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-2xl font-extrabold text-[#8E1B2E]">
                      {waitingQueue.length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">In Queue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: WAITING QUEUE (Span 5) */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-xs h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#0F172A] dark:text-white tracking-wide uppercase">
                        WAITING QUEUE ({waitingQueue.length})
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ordered by arrival time & priority
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toast.info("Refreshed waiting queue");
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Refresh"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>

                  {/* Queue Items */}
                  <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto">
                    {waitingQueue.length === 0 ? (
                      <div className="py-14 text-center">
                        <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          No users in waiting queue
                        </h4>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                          Users who join this session's waiting room will appear here in real time.
                        </p>
                      </div>
                    ) : (
                      waitingQueue.map((item, index) => {
                        const qUser = item.user;
                        const qName = qUser?.name || qUser?.company_name || "User";
                        const qSub = qUser?.account?.designation || qUser?.company_name || "Member";
                        const qInitials = qName.substring(0, 2).toUpperCase();

                        return (
                          <div
                            key={item._id || index}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-[#8E1B2E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {index + 1}
                              </span>
                              {qUser?.account?.image ? (
                                <img
                                  src={qUser.account.image}
                                  alt={qName}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#0B1528] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {qInitials}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                                  {qName}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {qSub}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleAdmit(qUser?._id)}
                                className="px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                              >
                                <Play size={11} fill="white" />
                                Admit
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Queue Footer status */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div>
                    Auto-next: <span className="font-bold text-slate-700 dark:text-slate-200">{session.autoAdmit ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    Queue status:{" "}
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        session.isPaused ? "text-amber-500" : "text-emerald-600"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          session.isPaused ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      {session.isPaused ? "Paused" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

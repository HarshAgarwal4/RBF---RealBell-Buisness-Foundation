import React, { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Clock,
  Users,
  Video,
  Lock,
  UserCheck,
  UserX,
  Bell,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import axios from "../../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";
import { useVideoCall } from "../../../context/VideoCallContext";

export default function LiveSessionWaitingRoom({ session: initialSession, socket, onSessionUpdate }) {
  const { user } = useStore();
  const { initiateCall } = useVideoCall();

  const [session, setSession] = useState(initialSession);
  const [passcode, setPasscode] = useState("");
  const [joining, setJoining] = useState(false);
  const [isAdmitted, setIsAdmitted] = useState(false);

  // Sync state
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  // Audio chime notification
  const playAdmitChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
          ctx.close();
        } catch (_) {}
      }, 900);
    } catch (_) {}
  }, []);

  // Check if current user is admitted
  useEffect(() => {
    const activeUserId = session?.activeConsultation?.user?._id || session?.activeConsultation?.user;
    if (activeUserId && String(activeUserId) === String(user?._id)) {
      setIsAdmitted(true);
    } else {
      setIsAdmitted(false);
    }
  }, [session?.activeConsultation, user?._id]);

  // Sockets listening
  useEffect(() => {
    if (!socket || !session?._id) return;

    const handleAdmitted = (data) => {
      const activeId = data?.session?.activeConsultation?.user?._id || data?.session?.activeConsultation?.user || data?.participantId;
      if (activeId && String(activeId) === String(user?._id)) {
        setIsAdmitted(true);
        playAdmitChime();
        toast.success("🎉 The host has admitted you! Click below to enter the video call room.");
      }
      if (data?.session) {
        setSession(data.session);
        if (onSessionUpdate) onSessionUpdate(data.session);
      }
    };

    const handleConsultationEnded = () => {
      setIsAdmitted(false);
      toast.info("Consultation completed with host.");
    };

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

    socket.on("live-session:admitted", handleAdmitted);
    socket.on("live-session:consultation-ended", handleConsultationEnded);
    socket.on("live-session:state:updated", handleStateUpdate);
    socket.on("live-session:queue:updated", handleQueueUpdate);
    socket.on("live-session:queue:paused", handleQueuePaused);

    return () => {
      socket.off("live-session:admitted", handleAdmitted);
      socket.off("live-session:consultation-ended", handleConsultationEnded);
      socket.off("live-session:state:updated", handleStateUpdate);
      socket.off("live-session:queue:updated", handleQueueUpdate);
      socket.off("live-session:queue:paused", handleQueuePaused);
    };
  }, [socket, session?._id, user?._id, playAdmitChime, onSessionUpdate]);

  // Background polling backup (every 2 seconds)
  useEffect(() => {
    if (!session?._id) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/live-sessions/${session._id}`);
        if (res.data?.status === 1 && res.data.session) {
          const newSession = res.data.session;
          const activeUserId = newSession.activeConsultation?.user?._id || newSession.activeConsultation?.user;
          const wasAdmitted = activeUserId && String(activeUserId) === String(user?._id);

          setSession((prev) => {
            const queueChanged = JSON.stringify(prev?.queue) !== JSON.stringify(newSession.queue);
            const activeChanged = JSON.stringify(prev?.activeConsultation) !== JSON.stringify(newSession.activeConsultation);
            if (queueChanged || activeChanged) {
              if (onSessionUpdate) onSessionUpdate(newSession);
              return newSession;
            }
            return prev;
          });

          if (wasAdmitted && !isAdmitted) {
            setIsAdmitted(true);
            playAdmitChime();
            toast.success("🎉 The host has admitted you! Click below to enter the video call room.");
          } else if (!wasAdmitted && isAdmitted) {
            setIsAdmitted(false);
          }
        }
      } catch (_) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [session?._id, user?._id, isAdmitted, playAdmitChime, onSessionUpdate]);

  // Join Queue
  const handleJoinQueue = async () => {
    if (session?.requirePasscode && !passcode.trim()) {
      toast.error("Please enter the meeting passcode");
      return;
    }

    try {
      setJoining(true);
      const res = await axios.post(`/live-sessions/${session._id}/join-queue`, {
        passcode: passcode.trim(),
      });
      if (res.data?.status === 1) {
        setSession(res.data.session);
        if (onSessionUpdate) onSessionUpdate(res.data.session);
        toast.success("Joined waiting queue!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to join queue");
    } finally {
      setJoining(false);
    }
  };

  // Leave Queue
  const handleLeaveQueue = async () => {
    try {
      const res = await axios.post(`/live-sessions/${session._id}/leave-queue`);
      if (res.data?.status === 1) {
        setSession(res.data.session);
        if (onSessionUpdate) onSessionUpdate(res.data.session);
        setIsAdmitted(false);
        toast.info("Left waiting queue");
      }
    } catch (err) {
      toast.error("Failed to leave queue");
    }
  };

  // Enter Video Call Room
  const handleEnterCall = () => {
    const hostObj = session.host || { _id: session.host, name: "Host" };
    initiateCall(hostObj, "video");
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

  const waitingQueue = session.queue?.filter((q) => q.status === "waiting") || [];
  const userQueueIndex = waitingQueue.findIndex(
    (q) => String(q.user?._id || q.user) === String(user?._id || user?.id)
  );
  const inQueue = userQueueIndex !== -1;
  const queuePosition = userQueueIndex + 1;
  const estimatedWait = queuePosition * (session.avgConsultationMins || 10);

  const hostName = session.host?.name || "Host";
  const hostCompany = session.host?.company_name || session.host?.account?.designation || "RBF";
  const hostInitials = hostName.substring(0, 2).toUpperCase();

  return (
    <>
      <Sidebar />

      <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 pb-16">
        <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
          {/* Top Session Overview Card matching Image 2 */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-slate-700 shadow-xs space-y-6">
            {/* Header info row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {session.host?.account?.image ? (
                  <img
                    src={session.host.account.image}
                    alt={hostName}
                    className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#0B1528] dark:bg-slate-700 text-white flex items-center justify-center font-extrabold text-base tracking-wider shadow-xs">
                    {hostInitials}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40 dark:text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                      LIVE
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      1-on-1 Consultation
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
                    {session.title}
                  </h1>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Hosted by <span className="font-bold text-slate-800 dark:text-slate-200">{hostName}</span> • {hostCompany}
                  </p>
                </div>
              </div>

              {/* Top right badges & Share */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <Share2 size={13} />
                  Share
                </button>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ACTIVE NOW <span className="font-normal opacity-80">{session.activeConsultation?.user ? "1 live" : "0 live"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700">
                  IN QUEUE <span className="font-normal opacity-80">{waitingQueue.length} waiting</span>
                </span>
              </div>
            </div>

            {/* Description */}
            {session.description && (
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                {session.description}
              </p>
            )}

            {/* 3 Info Pills Row matching Image 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Avg Duration</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                    ~{session.avgConsultationMins} minutes
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Capacity Limit</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                    Max {session.maxQueueSize} queued
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Video size={16} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Provider</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                    In Built-Webrtc
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Waiting Card / Action Box matching Image 2 */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-[#E2E8F0] dark:border-slate-700 shadow-xs text-center">
            {isAdmitted ? (
              /* ADMITTED STATE */
              <div className="max-w-md mx-auto space-y-5 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-100 dark:ring-emerald-900/30">
                  <CheckCircle2 size={40} className="animate-bounce" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">
                    You're Admitted!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
                    {hostName} is waiting for you in the video consultation room.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEnterCall}
                  className="w-full py-4 px-6 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98 cursor-pointer"
                >
                  <Video size={20} />
                  Enter Video Call Room Now
                </button>
              </div>
            ) : inQueue ? (
              /* IN QUEUE WAITING STATE */
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#8E1B2E] flex items-center justify-center mx-auto">
                  <Clock size={36} className="animate-spin" />
                </div>

                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFE4E6] dark:bg-rose-950/40 text-[#8E1B2E] font-extrabold text-xs tracking-wide uppercase mb-2">
                    Position #{queuePosition} in Queue
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
                    Waiting for {hostName}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed">
                    Estimated wait time: <span className="font-bold text-slate-800 dark:text-slate-200">~{estimatedWait} mins</span>. Keep this tab open. You will receive an audio chime and notification the moment you are admitted.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 text-left">
                  <Bell size={16} className="shrink-0 text-amber-500" />
                  <span>Chime notification sound is active on this page.</span>
                </div>

                <button
                  type="button"
                  onClick={handleLeaveQueue}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Leave Waiting Queue
                </button>
              </div>
            ) : (
              /* NOT IN QUEUE STATE matching Image 2 */
              <div className="max-w-lg mx-auto space-y-5">
                {/* Camera Icon in Soft Rose Circle */}
                <div className="w-16 h-16 rounded-full bg-[#FFE4E6] dark:bg-rose-950/40 text-[#8E1B2E] flex items-center justify-center mx-auto">
                  <Video size={28} />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
                    Ready to consult with {hostName}?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
                    Join the waiting queue below. When the host admits you, you'll receive a real-time chime notification and direct access to enter the video call.
                  </p>
                </div>

                {/* Passcode Input if Required */}
                {session?.requirePasscode && (
                  <div className="max-w-xs mx-auto text-left">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Meeting Passcode Required
                    </label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passcode"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E1B2E]/20"
                    />
                  </div>
                )}

                {/* Join Waiting Queue Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={joining || session?.isPaused}
                    onClick={handleJoinQueue}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#8E1B2E] hover:bg-[#721524] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-900/10 transition active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Users size={18} />
                        Join Waiting Queue
                      </>
                    )}
                  </button>
                </div>

                {session?.isPaused && (
                  <p className="text-xs text-amber-600 font-semibold mt-2">
                    ⚠️ The host has temporarily paused new entries to the queue.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

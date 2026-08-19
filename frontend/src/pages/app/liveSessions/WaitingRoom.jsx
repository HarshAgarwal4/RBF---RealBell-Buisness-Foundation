import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Users,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Volume2,
  RefreshCw,
  HelpCircle,
  Share2,
  Copy,
  Lock,
  KeyRound,
  Check,
  X,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import ShareMeetingModal from "../../../components/ShareMeetingModal";
import axios from "../../../services/axios";
import { useStore } from "../../../zustand/store";
import { toast } from "react-toastify";

export default function WaitingRoom() {
  const { id: sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState(null); // null | { status, position, estimatedWaitTime }
  const [waitingCount, setWaitingCount] = useState(0);
  const [liveMembersCount, setLiveMembersCount] = useState(1);
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [admissionGrant, setAdmissionGrant] = useState(null);
  const [joiningQueue, setJoiningQueue] = useState(false);

  // Passcode verification state
  const [passcodeInput, setPasscodeInput] = useState(searchParams.get("pwd") || "");
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const socketRef = useRef(null);

  // Play auditory chimes via Web Audio API
  const playAlertSound = useCallback((type = "chime") => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === "admit") {
        // High double-beep for admission
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      } else {
        // Subtle chime for position movement
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 900);
    } catch {
      // Audio fallback ignored
    }
  }, []);

  const handleVerifyPasscode = async (codeToVerify) => {
    const code = typeof codeToVerify === "string" ? codeToVerify : passcodeInput;
    if (!code || !code.trim()) {
      toast.error("Please enter the meeting passcode");
      return false;
    }

    try {
      setVerifyingPasscode(true);
      const res = await axios.post(`/live-sessions/${sessionId}/verify-passcode`, {
        passcode: code.trim(),
      });
      if (res.data?.status === 1) {
        setIsPasscodeUnlocked(true);
        toast.success("Passcode unlocked!");
        return true;
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Incorrect meeting passcode");
      return false;
    } finally {
      setVerifyingPasscode(false);
    }
  };

  const fetchSessionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/live-sessions/${sessionId}`);
      if (res.data?.status === 1) {
        const fetchedSession = res.data.session;
        setSession(fetchedSession);
        setWaitingCount(res.data.waitingCount || 0);

        if (res.data.isHost) {
          // Redirect host directly to their host dashboard
          navigate(`/live-sessions/${sessionId}/host`, { replace: true });
          return;
        }

        // Check password protection
        const urlPwd = searchParams.get("pwd");
        if (!fetchedSession.isPasswordProtected) {
          setIsPasscodeUnlocked(true);
        } else if (urlPwd) {
          try {
            const vRes = await axios.post(`/live-sessions/${sessionId}/verify-passcode`, {
              passcode: urlPwd.trim(),
            });
            if (vRes.data?.status === 1) {
              setIsPasscodeUnlocked(true);
            }
          } catch (_) {}
        }

        if (res.data.myQueueEntry) {
          setMyEntry(res.data.myQueueEntry);
          setIsPasscodeUnlocked(true);
          if (
            res.data.myQueueEntry.status === "ADMITTED" ||
            res.data.myQueueEntry.status === "IN_CALL"
          ) {
            setIsAdmitted(true);
          }
        } else {
          setMyEntry(null);
        }
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      toast.error("Failed to load live session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate, searchParams]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  // Socket setup for real-time queue position, admission, and live members
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

    socket.on("session:deleted", () => {
      toast.warn("This live session has been deleted by the host.");
      navigate("/live-sessions", { replace: true });
    });

    socket.on("session:members:update", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setLiveMembersCount(data.count || 1);
      }
    });

    socket.on("queue:position-updated", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        if (data.status === "CANCELLED" || data.status === "REJECTED" || data.status === "EXPIRED") {
          setMyEntry(null);
          toast.info(data.reason || "You have left the queue.");
        } else {
          setMyEntry((prev) => {
            if (prev && prev.position !== data.position) {
              playAlertSound("chime");
              toast.info(`Your queue position updated: #${data.position}`);
            }
            return {
              ...(prev || {}),
              position: data.position,
              estimatedWaitTime: data.estimatedWaitTime,
              status: data.status,
            };
          });
        }
      }
    });

    socket.on("queue:update", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setWaitingCount(data.waitingCount || 0);

        // Update local user's entry if in queue
        if (Array.isArray(data.queue) && user?._id) {
          const matched = data.queue.find(
            (e) => String(e.userId?._id || e.userId) === String(user._id)
          );
          if (matched) {
            setMyEntry((prev) => ({
              ...(prev || {}),
              ...matched,
            }));
          }
        }
      }
    });

    socket.on("participant:admitted", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setIsAdmitted(true);
        setAdmissionGrant(data.grant || null);
        playAlertSound("admit");
        toast.success("It's your turn! The host has admitted you to the call.");
      }
    });

    socket.on("participant:rejected", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setMyEntry(null);
        setIsAdmitted(false);
        toast.warn(data.reason || "Your queue request was rejected by the host.");
      }
    });

    socket.on("consultation:ended", (data) => {
      if (String(data?.sessionId) === String(sessionId)) {
        setIsAdmitted(false);
        setMyEntry(null);
        toast.info("Your consultation has concluded.");
      }
    });

    socket.on("session:ended", () => {
      setSession((prev) => (prev ? { ...prev, status: "ENDED" } : null));
      setMyEntry(null);
      setIsAdmitted(false);
      toast.warn("The live session has ended.");
    });

    socket.on("session:paused", () => {
      setSession((prev) => (prev ? { ...prev, queuePaused: true, status: "PAUSED" } : null));
      toast.info("The host has paused the queue.");
    });

    socket.on("session:resumed", () => {
      setSession((prev) => (prev ? { ...prev, queuePaused: false, status: "LIVE" } : null));
      toast.success("The host has resumed the queue.");
    });

    // Background auto-sync every 4s for zero-refresh resilience
    const syncInterval = setInterval(async () => {
      try {
        const res = await axios.get(`/live-sessions/${sessionId}`);
        if (res.data?.status === 1) {
          setSession(res.data.session);
          setWaitingCount(res.data.waitingCount || 0);
          if (res.data.myQueueEntry) {
            setMyEntry(res.data.myQueueEntry);
            if (
              res.data.myQueueEntry.status === "ADMITTED" ||
              res.data.myQueueEntry.status === "IN_CALL"
            ) {
              setIsAdmitted(true);
            }
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
  }, [sessionId, user?._id, backendUrl, playAlertSound]);

  const handleJoinQueue = async () => {
    try {
      setJoiningQueue(true);
      const res = await axios.post(`/live-sessions/${sessionId}/queue`, {
        priority: 0,
        passcode: passcodeInput,
      });
      if (res.data?.status === 1) {
        setMyEntry(res.data.entry);
        toast.success(`Joined queue! You are #${res.data.position}`);
        playAlertSound("chime");
      }
    } catch (err) {
      console.error("Failed to join queue:", err);
      toast.error(err?.response?.data?.msg || "Unable to join queue");
    } finally {
      setJoiningQueue(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!window.confirm("Are you sure you want to leave the queue? You will lose your current spot.")) {
      return;
    }

    try {
      const res = await axios.delete(`/live-sessions/${sessionId}/queue`);
      if (res.data?.status === 1) {
        setMyEntry(null);
        toast.info("You have left the queue.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to leave queue");
    }
  };

  const handleEnterCall = () => {
    navigate(`/live-sessions/${sessionId}/room`);
  };

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-4 pb-10 min-h-screen bg-[#F5F7FB] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin inline-block w-10 h-10 border-4 border-current border-t-transparent rounded-full text-[#b03052] mb-3" />
            <p className="text-sm font-semibold text-gray-700">Connecting to Waiting Room...</p>
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
          <div className="bg-white p-8 rounded-3xl shadow-sm max-w-md text-center">
            <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold">Session Not Found</h2>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              This live session does not exist or has been removed.
            </p>
            <button
              onClick={() => navigate("/live-sessions")}
              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </>
    );
  }

  const isLive = session.status === "LIVE";
  const inQueue = myEntry && (myEntry.status === "WAITING" || myEntry.status === "ADMITTED" || myEntry.status === "IN_CALL");
  const position = myEntry?.position || 1;
  const peopleAhead = Math.max(0, position - 1);
  const estimatedWait = myEntry?.estimatedWaitTime ?? peopleAhead * (session.averageConsultationDuration || 10);

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-3 sm:px-6 lg:px-8 pb-12 min-h-screen bg-[#F5F7FB] text-gray-900 max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* TOP SESSION BANNER */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <img
                  src={
                    session.hostId?.account?.image ||
                    session.hostId?.profile?.logo ||
                    `https://placehold.co/120x120/18213A/FFFFFF?text=${encodeURIComponent(
                      (session.hostId?.name || "Host").slice(0, 2).toUpperCase()
                    )}`
                  }
                  alt="Host Avatar"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isLive
                          ? "bg-rose-100 text-rose-700 animate-pulse"
                          : session.status === "PAUSED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />}
                      {session.status}
                    </span>
                    {session.isPasswordProtected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                        <Lock size={11} /> Passcode Protected
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-medium">
                      {session.sessionType === "one-to-one" ? "1-on-1 Consultation" : "Team Meeting"}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {session.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Hosted by <strong className="text-gray-800">{session.hostId?.name || "Expert"}</strong>
                    {session.hostId?.company_name ? ` • ${session.hostId?.company_name}` : ""}
                  </p>
                </div>
              </div>

              {/* Utility and Live Count Badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  <Share2 size={14} className="text-[#b03052]" /> Share
                </button>

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <div className="text-left">
                    <div className="text-[10px] text-emerald-600 font-semibold uppercase">Active Now</div>
                    <div className="text-xs font-bold">{liveMembersCount} live</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-gray-50 px-3.5 py-2 rounded-2xl">
                  <Users className="text-[#b03052]" size={16} />
                  <div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">In Queue</div>
                    <div className="text-xs font-bold text-gray-900">{waitingCount} waiting</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {session.description && (
              <p className="mt-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                {session.description}
              </p>
            )}

            {/* Session Attributes */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <Clock size={12} /> Avg Duration
                </div>
                <div className="text-sm font-bold text-gray-800 mt-0.5">
                  ~{session.averageConsultationDuration || 10} minutes
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl">
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={12} /> Capacity Limit
                </div>
                <div className="text-sm font-bold text-gray-800 mt-0.5">
                  Max {session.maxQueueSize || 20} queued
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl col-span-2 sm:col-span-1">
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <Video size={12} /> Provider
                </div>
                <div className="text-sm font-bold text-gray-800 mt-0.5 capitalize">
                  {session.videoProvider.replace("-", " ")}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN INTERACTIVE CARD: PASSCODE GATE, WAITING, OR JOIN */}
          {session.isPasswordProtected && !isPasscodeUnlocked ? (
            /* PASSCODE PROMPT CARD */
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-amber-200 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4">
                <Lock size={30} />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Meeting Passcode Required
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                This live session is password-protected. Please enter the meeting passcode provided by the host to access the waiting room.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyPasscode();
                }}
                className="mt-6 max-w-sm mx-auto flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter passcode or PIN"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyingPasscode}
                  className="px-6 py-3 rounded-2xl bg-[#b03052] text-white text-xs font-bold hover:bg-[#96263f] transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {verifyingPasscode ? "Verifying..." : "Unlock"}
                </button>
              </form>
            </div>
          ) : !inQueue ? (
            /* PRE-JOIN WAITING ROOM */
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-[#b03052] mx-auto flex items-center justify-center mb-4">
                <Video size={30} />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Ready to consult with {session.hostId?.name || "the Host"}?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
                Join the waiting queue below. When the host admits you, you'll receive a real-time chime notification and direct access to enter the video call.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleJoinQueue}
                  disabled={joiningQueue || !isLive || session.queuePaused}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#b03052] text-white text-sm font-bold hover:bg-[#96263f] transition shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Users size={18} />
                  {joiningQueue
                    ? "Joining Queue..."
                    : !isLive
                    ? "Waiting for Host to Start"
                    : session.queuePaused
                    ? "Queue is Paused"
                    : "Join Waiting Queue"}
                </button>
              </div>

              {!isLive && (
                <p className="mt-4 text-xs font-medium text-amber-600">
                  ⚠️ This session is currently scheduled. You will be able to join as soon as the host starts.
                </p>
              )}
              {session.queuePaused && (
                <p className="mt-4 text-xs font-medium text-amber-600">
                  ⏸ The host has temporarily paused queue admissions.
                </p>
              )}
            </div>
          ) : (
            /* IN QUEUE STATUS & LIVE POSITION TRACKER */
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-gray-100">
              {/* PROGRESS STEPPER */}
              <div className="mb-8">
                <div className="flex items-center justify-between max-w-md mx-auto relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                      ✓
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 mt-1.5">Joined</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        isAdmitted
                          ? "bg-emerald-500 text-white"
                          : "bg-[#b03052] text-white animate-pulse"
                      }`}
                    >
                      {isAdmitted ? "✓" : "2"}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 mt-1.5">Waiting</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        isAdmitted
                          ? "bg-emerald-500 text-white animate-bounce"
                          : "bg-gray-100 border-2 border-gray-300 text-gray-400"
                      }`}
                    >
                      <Video size={14} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 mt-1.5">Call</span>
                  </div>
                </div>
              </div>

              {/* BIG POSITION CALLOUT */}
              {!isAdmitted ? (
                <div className="text-center py-6 px-4 bg-gradient-to-b from-[#F6E9EB]/60 to-transparent rounded-3xl border border-[#F6E9EB]">
                  <div className="inline-block px-3 py-1 bg-[#b03052]/10 text-[#b03052] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    Live Queue Position
                  </div>

                  <div className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight my-2">
                    #{position}
                  </div>

                  <p className="text-sm font-semibold text-gray-700">
                    {peopleAhead === 0
                      ? "You're next in line! The host will admit you shortly."
                      : `${peopleAhead} ${peopleAhead === 1 ? "person" : "people"} ahead of you`}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-600">
                    <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-100">
                      <Clock size={14} className="text-[#b03052]" />
                      Estimated Wait: <strong>~{estimatedWait} minutes</strong>
                    </span>
                    <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-100">
                      <Volume2 size={14} className="text-emerald-600" />
                      Sound alerts enabled
                    </span>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={handleLeaveQueue}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition cursor-pointer"
                    >
                      <LogOut size={14} />
                      Leave Queue
                    </button>
                  </div>

                  <p className="mt-4 text-[11px] text-gray-400">
                    Please keep this browser tab open. We will automatically notify you when it's your turn.
                  </p>
                </div>
              ) : (
                /* ADMISSION CELEBRATION CARD */
                <div className="text-center py-8 px-4 bg-emerald-50 rounded-3xl border-2 border-emerald-300 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
                    <PhoneCall size={30} />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-950">
                    It's your turn!
                  </h3>
                  <p className="mt-2 text-sm font-medium text-emerald-800 max-w-md mx-auto">
                    The host is ready and has admitted you to the consultation room. Click below to start your live video call.
                  </p>

                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      onClick={handleEnterCall}
                      className="px-8 py-4 rounded-2xl bg-emerald-600 text-white text-base font-bold hover:bg-emerald-700 transition shadow-xl hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Video size={20} />
                      Join Call Now
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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

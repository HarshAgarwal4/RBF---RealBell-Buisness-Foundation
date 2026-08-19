import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  ShieldCheck,
  AlertTriangle,
  Users,
  Clock,
} from "lucide-react";
import axios from "../../../services/axios";
import { useStore } from "../../../zustand/store";
import { toast } from "react-toastify";

const ICE_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
    {
      urls: [
        "stun:stun.cloudflare.com:3478",
        "stun:stun.cloudflare.com:19302",
      ],
    },
    {
      urls: [
        "stun:global.stun.twilio.com:3478",
      ],
    },
    {
      urls: [
        "stun:stun.services.mozilla.com",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function LiveCallRoom() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";

  const [loading, setLoading] = useState(true);
  const [accessGrant, setAccessGrant] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerMediaState, setPeerMediaState] = useState({
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const timerRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  /* Helper to attach stream and guarantee playback across Brave / Edge / Safari */
  const attachStreamToVideo = useCallback((videoEl, stream, isMutedTrack = false) => {
    if (!videoEl || !stream) return;
    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    videoEl.muted = isMutedTrack;
    videoEl.playsInline = true;
    videoEl.autoplay = true;

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Video playback requires user gesture or is recovering:", err.name);
      });
    }
  }, []);

  /* ── 1. Authenticate Call Access Guard ── */
  const verifyCallAccess = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/live-sessions/${sessionId}/call-access`);
      if (res.data?.status === 1 && res.data?.grant?.authorized) {
        setAccessGrant(res.data.grant);
        setSessionData(res.data.session);
        setIsHost(res.data.isHost);
      } else {
        toast.error(res.data?.msg || "You are not authorized to join this call room.");
        navigate(`/live-sessions/${sessionId}`, { replace: true });
      }
    } catch (err) {
      console.error("Access verification failed:", err);
      toast.error(err?.response?.data?.msg || "Call room access denied.");
      navigate(`/live-sessions/${sessionId}`, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    verifyCallAccess();
  }, [verifyCallAccess]);

  /* ── 2. WebRTC Peer Connection & Media Setup ── */

  const flushPendingIceCandidates = useCallback(async (pc) => {
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("session:room:signal", {
          sessionId,
          signalData: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteVideoRef.current) {
          attachStreamToVideo(remoteVideoRef.current, event.streams[0], false);
        }
        setPeerConnected(true);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setPeerConnected(false);
      } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setPeerConnected(true);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId, attachStreamToVideo]);

  /* Resilient cross-browser media acquisition with Brave/Edge fallback cascade */
  const acquireMedia = useCallback(async () => {
    let stream = null;

    // Attempt 1: Standard constraints with audio processing
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
    } catch (err1) {
      console.warn("Retrying with relaxed video constraints due to:", err1.name);

      // Attempt 2: Unconstrained video + audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err2) {
        console.warn("Retrying with audio-only fallback due to:", err2.name);

        // Attempt 3: Audio only fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          setIsVideoOff(true);
          toast.warn("Camera could not be accessed on this browser. Connected with audio only.");
        } catch (finalErr) {
          console.error("All media permission attempts failed:", finalErr);
          toast.error("Microphone or Camera access is blocked. Please check browser permissions.");
          throw finalErr;
        }
      }
    }

    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    if (localVideoRef.current) {
      attachStreamToVideo(localVideoRef.current, stream, true);
    }
    return stream;
  }, [attachStreamToVideo]);

  /* ── 3. Socket Room Signaling ── */
  useEffect(() => {
    if (!accessGrant || !user?._id || !sessionId) return;

    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Join room
    socket.emit("session:room:join", {
      sessionId,
      token: accessGrant.token,
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Initialize local media and setup signaling
    acquireMedia()
      .then((stream) => {
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // If Host, create WebRTC offer
        if (isHost) {
          pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit("session:room:signal", {
                sessionId,
                signalData: { type: "offer", offer: pc.localDescription },
              });
            })
            .catch((err) => console.error("Error creating WebRTC offer:", err));
        }
      })
      .catch((err) => {
        console.error("Failed to acquire local media:", err);
      });

    // Signal handler (Offer / Answer / Candidate) with collision rollback handling
    socket.on("session:room:signal", async ({ senderId, signalData }) => {
      if (String(senderId) === String(user._id)) return;

      try {
        const pc = pcRef.current;
        if (!pc) return;

        if (signalData.type === "offer") {
          // Handle offer collision gracefully
          if (pc.signalingState !== "stable") {
            if (!isHost) {
              await pc.setLocalDescription({ type: "rollback" });
            } else {
              return;
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
          await flushPendingIceCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("session:room:signal", {
            sessionId,
            signalData: { type: "answer", answer: pc.localDescription },
          });
        } else if (signalData.type === "answer") {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
            await flushPendingIceCandidates(pc);
            setPeerConnected(true);
          }
        } else if (signalData.type === "candidate" && signalData.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } else {
            pendingIceCandidatesRef.current.push(signalData.candidate);
          }
        }
      } catch (signalErr) {
        console.error("Signaling error:", signalErr);
      }
    });

    socket.on("session:room:peer-joined", () => {
      toast.info("Participant joined the call room.");
      // Re-send offer if host
      if (isHost && pcRef.current) {
        pcRef.current
          .createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then((offer) => pcRef.current.setLocalDescription(offer))
          .then(() => {
            socket.emit("session:room:signal", {
              sessionId,
              signalData: { type: "offer", offer: pcRef.current.localDescription },
            });
          })
          .catch(() => {});
      }
    });

    socket.on("session:room:peer-left", () => {
      setPeerConnected(false);
      toast.info("Peer left the consultation room.");
    });

    socket.on("session:room:media-state", (state) => {
      setPeerMediaState(state);
    });

    socket.on("session:room:ended", () => {
      toast.info("The consultation session has ended.");
      handleCleanupAndExit();
    });

    socket.on("consultation:ended", () => {
      toast.info("The consultation has been concluded by the host.");
      handleCleanupAndExit();
    });

    return () => {
      handleCleanup();
    };
  }, [accessGrant, user?._id, sessionId, isHost, backendUrl, acquireMedia, createPeerConnection]);

  const handleCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit("session:room:leave", { sessionId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleCleanupAndExit = () => {
    handleCleanup();
    if (isHost) {
      navigate(`/live-sessions/${sessionId}/host`, { replace: true });
    } else {
      navigate(`/live-sessions/${sessionId}`, { replace: true });
    }
  };

  const handleEndCall = async () => {
    if (isHost) {
      if (window.confirm("End this consultation and move to next?")) {
        try {
          await axios.post(`/live-sessions/${sessionId}/consultation/end`);
        } catch (err) {
          console.error(err);
        }
        handleCleanupAndExit();
      }
    } else {
      handleCleanupAndExit();
    }
  };

  /* ── Media Controls ── */
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextState = !audioTrack.enabled;
      setIsMuted(nextState);
      notifyMediaState(nextState, isVideoOff, isScreenSharing);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const nextState = !videoTrack.enabled;
      setIsVideoOff(nextState);
      notifyMediaState(isMuted, nextState, isScreenSharing);
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (isScreenSharing) {
      try {
        const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender && cameraTrackRef.current) {
          await videoSender.replaceTrack(cameraTrackRef.current);
        }
        setIsScreenSharing(false);
        notifyMediaState(isMuted, isVideoOff, false);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        setIsScreenSharing(true);
        notifyMediaState(isMuted, isVideoOff, true);

        screenTrack.onended = async () => {
          if (videoSender && cameraTrackRef.current) {
            await videoSender.replaceTrack(cameraTrackRef.current);
          }
          setIsScreenSharing(false);
          notifyMediaState(isMuted, isVideoOff, false);
        };
      } catch (err) {
        toast.error("Screen sharing cancelled.");
      }
    }
  };

  const notifyMediaState = (muted, videoOff, screenSharing) => {
    if (socketRef.current) {
      socketRef.current.emit("session:room:media-state", {
        sessionId,
        isMuted: muted,
        isVideoOff: videoOff,
        isScreenSharing: screenSharing,
      });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090D16] text-white">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-current border-t-transparent rounded-full text-rose-500 mb-3" />
          <p className="text-sm font-semibold">Validating Call Access Grant...</p>
        </div>
      </div>
    );
  }

  const maxDurationSec = (sessionData?.maxConsultationDuration || 15) * 60;
  const isNearLimit = callDuration >= Math.max(0, maxDurationSec - 120);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#090D16] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* TOP FLOATING HEADER */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <VideoIcon size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
              {sessionData?.title || "Live Consultation"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatDuration(callDuration)}
              </span>
              <span className="text-xs text-slate-400">
                (Limit: {sessionData?.maxConsultationDuration || 15}m)
              </span>
            </div>
          </div>
        </div>

        {/* Warning & Controls */}
        <div className="flex items-center gap-3">
          {isNearLimit && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-semibold animate-pulse">
              <AlertTriangle size={14} /> &lt;2 mins remaining
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer text-slate-300 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* VIDEO TILES AREA */}
      <div className="relative flex-1 flex items-center justify-center bg-[#070A10] overflow-hidden p-2 sm:p-4">
        {/* Remote Video Stream */}
        {peerMediaState.isVideoOff ? (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-slate-400 font-bold text-2xl mb-3 shadow-2xl">
              <Users size={40} />
            </div>
            <p className="text-sm font-semibold text-slate-300">Peer turned off camera</p>
          </div>
        ) : (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain rounded-2xl"
          />
        )}

        {!peerConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-10 text-center p-6">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-white">Connecting with peer...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Waiting for the other participant to establish video stream.
            </p>
          </div>
        )}

        {/* Local Video Stream (PiP Window) */}
        <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 z-20 h-36 sm:h-48 w-48 sm:w-64 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900 shadow-2xl transition hover:scale-105">
          {isVideoOff ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
              <VideoOff size={24} className="mb-1" />
              <span className="text-[11px] text-slate-400">Camera Off</span>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            {isMuted ? <MicOff size={10} className="text-red-400" /> : <Mic size={10} className="text-emerald-400" />}
            <span>You ({isHost ? "Host" : "User"})</span>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS DOCK */}
      <div className="relative z-30 flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition shadow-lg cursor-pointer ${
            isMuted
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition shadow-lg cursor-pointer ${
            isVideoOff
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
          }`}
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition shadow-lg cursor-pointer ${
            isScreenSharing
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
          }`}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          {isScreenSharing ? <MonitorOff size={22} /> : <MonitorUp size={22} />}
        </button>

        {/* Leave / End Call */}
        <button
          onClick={handleEndCall}
          className="flex h-12 w-16 sm:h-14 sm:w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition hover:bg-red-700 hover:scale-105 active:scale-95 cursor-pointer"
          title={isHost ? "End Consultation" : "Leave Call"}
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}

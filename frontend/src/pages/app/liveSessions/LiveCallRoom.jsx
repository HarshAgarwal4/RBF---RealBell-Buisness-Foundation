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
  MessageSquare,
  Info,
  Send,
  X,
  LayoutGrid,
  Square,
  Sparkles,
  Radio,
  Volume2,
  VolumeX,
} from "lucide-react";
import axios from "../../../services/axios";
import { useStore } from "../../../zustand/store";
import { toast } from "react-toastify";

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:openrelay.metered.ca:80" },
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
  const [peerInfo, setPeerInfo] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Call States
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

  // UI Modes (Zoom / Google Meet Style)
  const [layoutMode, setLayoutMode] = useState("grid"); // "grid" | "spotlight"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null); // null | 'chat' | 'info' | 'people'
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Media Streams State
  const [localStreamState, setLocalStreamState] = useState(null);
  const [remoteStreamState, setRemoteStreamState] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  const chatBottomRef = useRef(null);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const timerRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);

  // Callback ref for remote video — guarantees srcObject is attached the exact millisecond video DOM node mounts
  const setRemoteVideoRef = useCallback((node) => {
    remoteVideoRef.current = node;
    if (node && remoteStreamRef.current) {
      if (node.srcObject !== remoteStreamRef.current) {
        node.srcObject = remoteStreamRef.current;
      }
      node.playsInline = true;
      node.autoplay = true;
      node.muted = false;
      node.play().catch((e) => console.warn("Remote play err on callback ref:", e));
    }
  }, []);

  // Callback ref for local video
  const setLocalVideoRef = useCallback((node) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      if (node.srcObject !== localStreamRef.current) {
        node.srcObject = localStreamRef.current;
      }
      node.playsInline = true;
      node.autoplay = true;
      node.muted = true;
      node.play().catch((e) => console.warn("Local play err on callback ref:", e));
    }
  }, []);

  // Auto-scroll chat drawer to bottom
  useEffect(() => {
    if (activeDrawer === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeDrawer]);

  // Sync local stream on change
  useEffect(() => {
    if (localVideoRef.current && localStreamState) {
      if (localVideoRef.current.srcObject !== localStreamState) {
        localVideoRef.current.srcObject = localStreamState;
      }
      localVideoRef.current.playsInline = true;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStreamState, isVideoOff, layoutMode]);

  // Sync remote stream on change
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamState) {
      if (remoteVideoRef.current.srcObject !== remoteStreamState) {
        remoteVideoRef.current.srcObject = remoteStreamState;
      }
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStreamState, peerMediaState.isVideoOff, peerConnected, layoutMode]);

  /* ── 1. Authenticate Call Access Guard ── */
  const verifyCallAccess = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/live-sessions/${sessionId}/call-access`);
      if (res.data?.status === 1 && res.data?.grant?.authorized) {
        setAccessGrant(res.data.grant);
        setSessionData(res.data.session);
        setPeerInfo(res.data.peerInfo);
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

  /* ── 2. Helper to Flush Queued ICE Candidates ── */
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

  /* ── 3. Send WebRTC Offer ── */
  const sendOffer = useCallback(async () => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    if (!pc || !socket) return;

    try {
      if (pc.signalingState === "have-local-offer" && pc.localDescription) {
        socket.emit("session:room:signal", {
          sessionId,
          targetPeerId: peerInfo?._id,
          signalData: { type: "offer", offer: pc.localDescription },
        });
        return;
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socket.emit("session:room:signal", {
        sessionId,
        targetPeerId: peerInfo?._id,
        signalData: { type: "offer", offer: pc.localDescription },
      });
    } catch (err) {
      console.error("Error generating WebRTC offer:", err);
    }
  }, [sessionId, peerInfo?._id]);

  /* ── 4. Process Incoming Offer ── */
  const handleIncomingOffer = useCallback(
    async (offer) => {
      const pc = pcRef.current;
      const socket = socketRef.current;
      if (!pc || !socket) {
        pendingOfferRef.current = offer;
        return;
      }

      try {
        if (pc.signalingState !== "stable") {
          if (!isHost) {
            await pc.setLocalDescription({ type: "rollback" });
          } else {
            return;
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingIceCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("session:room:signal", {
          sessionId,
          targetPeerId: peerInfo?._id,
          signalData: { type: "answer", answer: pc.localDescription },
        });
      } catch (err) {
        console.error("Error answering WebRTC offer:", err);
      }
    },
    [sessionId, isHost, peerInfo?._id, flushPendingIceCandidates]
  );

  /* ── 5. Create Peer Connection ── */
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("session:room:signal", {
          sessionId,
          targetPeerId: peerInfo?._id,
          signalData: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      let stream = (event.streams && event.streams[0]) || remoteStreamRef.current;
      if (!stream) {
        stream = new MediaStream();
        remoteStreamRef.current = stream;
      }
      if (!stream.getTracks().some((t) => t.id === event.track.id)) {
        stream.addTrack(event.track);
      }
      remoteStreamRef.current = stream;

      setRemoteStreamState(new MediaStream(stream.getTracks()));
      setPeerConnected(true);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.playsInline = true;
        remoteVideoRef.current.autoplay = true;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().catch((e) => console.warn("Remote ontrack play:", e));
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        setPeerConnected(true);
      } else if (state === "failed" || state === "disconnected") {
        setPeerConnected(false);
        if (isHost) {
          sendOffer();
        }
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId, isHost, peerInfo?._id, sendOffer]);

  /* ── 6. Resilient cross-browser media acquisition ── */
  const acquireMedia = useCallback(async () => {
    let stream = null;

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
      console.warn("Retrying with standard video + audio due to:", err1.name);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err2) {
        console.warn("Retrying with audio-only fallback due to:", err2.name);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          setIsVideoOff(true);
          toast.warn("Camera access unavailable. Connected with audio only.");
        } catch (finalErr) {
          console.error("All media permission attempts failed:", finalErr);
          toast.error("Microphone or Camera access blocked in browser.");
          throw finalErr;
        }
      }
    }

    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    setLocalStreamState(new MediaStream(stream.getTracks()));
    return stream;
  }, []);

  /* ── 7. Socket Signaling Lifecycle ── */
  useEffect(() => {
    if (!accessGrant || !user?._id || !sessionId) return;

    const socket = io(backendUrl, {
      auth: { userId: user?._id },
      query: { userId: user?._id },
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

    // Initialize media and create peer connection
    acquireMedia()
      .then(async (stream) => {
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Signal ready to other peers in room
        socket.emit("session:room:ready", { sessionId });

        // If there was a pending offer queued while media was initializing, process it now
        if (pendingOfferRef.current) {
          const offer = pendingOfferRef.current;
          pendingOfferRef.current = null;
          await handleIncomingOffer(offer);
        } else if (isHost) {
          await sendOffer();
        }
      })
      .catch((err) => {
        console.error("Failed to acquire local media:", err);
      });

    // Signal handler (Offer / Answer / Candidate)
    socket.on("session:room:signal", async ({ senderId, signalData }) => {
      if (String(senderId) === String(user._id)) return;

      try {
        const pc = pcRef.current;

        if (signalData.type === "offer") {
          await handleIncomingOffer(signalData.offer);
        } else if (signalData.type === "answer") {
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
            await flushPendingIceCandidates(pc);
            setPeerConnected(true);
          }
        } else if (signalData.type === "candidate" && signalData.candidate) {
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } else {
            pendingIceCandidatesRef.current.push(signalData.candidate);
          }
        }
      } catch (signalErr) {
        console.error("Signaling error:", signalErr);
      }
    });

    // In-room chat messages
    socket.on("session:room:chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // When peer becomes ready or joins
    socket.on("session:room:peer-ready", (data) => {
      if (data?.peerId && String(data.peerId) !== String(user._id)) {
        if (!peerInfo) setPeerInfo({ _id: data.peerId, name: data.peerName, account: { image: data.peerAvatar } });
        if (isHost && pcRef.current) {
          sendOffer();
        }
      }
    });

    socket.on("session:room:peer-joined", (data) => {
      if (data?.peerId && String(data.peerId) !== String(user._id)) {
        if (!peerInfo) setPeerInfo({ _id: data.peerId, name: data.peerName, account: { image: data.peerAvatar } });
        if (isHost && pcRef.current) {
          sendOffer();
        }
      }
    });

    socket.on("session:room:peer-left", () => {
      setPeerConnected(false);
      setRemoteStreamState(null);
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
  }, [
    accessGrant,
    user?._id,
    sessionId,
    isHost,
    backendUrl,
    acquireMedia,
    createPeerConnection,
    sendOffer,
    handleIncomingOffer,
    flushPendingIceCandidates,
  ]);

  /* ── 8. Self-Healing Negotiation Loop ── */
  useEffect(() => {
    if (!accessGrant || !sessionId || peerConnected) return;

    const interval = setInterval(() => {
      if (!remoteStreamRef.current || remoteStreamRef.current.getTracks().length === 0) {
        if (isHost && pcRef.current && socketRef.current) {
          sendOffer();
        } else if (!isHost && socketRef.current) {
          socketRef.current.emit("session:room:ready", { sessionId });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [accessGrant, sessionId, peerConnected, isHost, sendOffer]);

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

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit("session:room:chat", {
      sessionId,
      message: chatInput.trim(),
    });
    setChatInput("");
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
          <div className="animate-spin inline-block w-10 h-10 border-4 border-current border-t-transparent rounded-full text-[#b03052] mb-3" />
          <p className="text-sm font-semibold">Validating Call Access Grant...</p>
        </div>
      </div>
    );
  }

  const maxDurationSec = (sessionData?.maxConsultationDuration || 15) * 60;
  const isNearLimit = callDuration >= Math.max(0, maxDurationSec - 120);

  const peerDisplayName = peerInfo?.name || (isHost ? "Admitted Participant" : sessionData?.hostId?.name || "Host");
  const peerCompany = peerInfo?.company_name || peerInfo?.profile?.company_name || "";
  const peerAvatar =
    peerInfo?.account?.image ||
    peerInfo?.profile?.logo ||
    `https://placehold.co/120x120/18213A/FFFFFF?text=${encodeURIComponent(
      peerDisplayName.slice(0, 2).toUpperCase()
    )}`;

  const myAvatar =
    user?.account?.image ||
    `https://placehold.co/120x120/18213A/FFFFFF?text=${encodeURIComponent(
      (user?.name || "Me").slice(0, 2).toUpperCase()
    )}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#121620] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* ── GOOGLE MEET / ZOOM TOP FLOATING HEADER ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 sm:p-5 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1">
                {sessionData?.title || "Live Consultation"}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck size={11} /> P2P Secure
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-300">
                {formatDuration(callDuration)}
              </span>
              <span className="text-xs text-slate-400">
                / {sessionData?.maxConsultationDuration || 15}m
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Action Pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isNearLimit && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-semibold animate-pulse">
              <AlertTriangle size={13} /> &lt;2 mins left
            </div>
          )}

          {/* Layout Mode Toggle */}
          <button
            type="button"
            onClick={() => setLayoutMode(layoutMode === "grid" ? "spotlight" : "grid")}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-slate-300 hover:text-white"
            title={layoutMode === "grid" ? "Switch to Spotlight View" : "Switch to Grid View"}
          >
            {layoutMode === "grid" ? <Square size={17} /> : <LayoutGrid size={17} />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-slate-300 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </div>

      {/* ── GOOGLE MEET / ZOOM DUAL VIDEO GRID STAGE ── */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-5 pt-16 sm:pt-20 pb-24 overflow-hidden">
        {/* GRID VIEW (50/50 Equal Dual Cards) */}
        {layoutMode === "grid" ? (
          <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center justify-center">
            {/* TILE 1: SELF VIDEO CARD */}
            <div className="relative w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-[#1a2130] border border-white/10 shadow-2xl flex items-center justify-center group">
              {/* Permanent Local Video Element */}
              <video
                ref={setLocalVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
              />

              {/* Camera Off Avatar Overlay */}
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#1a2130] animate-fade-in z-10">
                  <img
                    src={myAvatar}
                    alt={user?.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-3"
                  />
                  <h4 className="text-sm font-bold text-white">{user?.name || "You"}</h4>
                  <span className="text-[11px] text-slate-400 mt-0.5">Camera Off</span>
                </div>
              )}

              {/* Self Video Top/Bottom Overlays */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>You ({isHost ? "Host" : "Participant"})</span>
              </div>

              <div className="absolute top-3 right-3 z-20">
                <div
                  className={`p-2 rounded-xl backdrop-blur-md border ${
                    isMuted
                      ? "bg-red-600/80 border-red-500 text-white"
                      : "bg-black/50 border-white/10 text-emerald-400"
                  }`}
                >
                  {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </div>
              </div>
            </div>

            {/* TILE 2: PEER VIDEO CARD */}
            <div className="relative w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-[#1a2130] border border-white/10 shadow-2xl flex items-center justify-center group">
              {/* Permanent Remote Video Element */}
              <video
                ref={setRemoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${
                  peerMediaState.isVideoOff || !peerConnected ? "opacity-0 absolute" : "opacity-100"
                }`}
              />

              {/* Camera Off / Connecting State Overlay */}
              {(peerMediaState.isVideoOff || !peerConnected) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#1a2130] animate-fade-in z-10">
                  <div className="relative mb-3">
                    <img
                      src={peerAvatar}
                      alt={peerDisplayName}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                    />
                    {!peerConnected && (
                      <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">{peerDisplayName}</h4>
                  {peerCompany && <p className="text-xs text-slate-400">{peerCompany}</p>}
                  <p className="text-[11px] font-semibold text-rose-400 mt-1">
                    {!peerConnected
                      ? "Connecting video stream..."
                      : "Peer camera is off"}
                  </p>
                </div>
              )}

              {/* Peer Video Top/Bottom Overlays */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/10">
                <span
                  className={`w-2 h-2 rounded-full ${
                    peerConnected ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                  }`}
                />
                <span>{peerDisplayName} ({isHost ? "Participant" : "Host"})</span>
              </div>

              <div className="absolute top-3 right-3 z-20">
                <div
                  className={`p-2 rounded-xl backdrop-blur-md border ${
                    peerMediaState.isMuted
                      ? "bg-red-600/80 border-red-500 text-white"
                      : "bg-black/50 border-white/10 text-emerald-400"
                  }`}
                >
                  {peerMediaState.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SPOTLIGHT VIEW (Main Peer Spotlight + Self PiP) */
          <div className="relative w-full h-full max-w-6xl rounded-3xl overflow-hidden bg-[#1a2130] border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Permanent Remote Video in Spotlight */}
            <video
              ref={setRemoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                peerMediaState.isVideoOff || !peerConnected ? "opacity-0 absolute" : "opacity-100"
              }`}
            />

            {(peerMediaState.isVideoOff || !peerConnected) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#1a2130] z-10">
                <img
                  src={peerAvatar}
                  alt={peerDisplayName}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-3"
                />
                <h4 className="text-base font-bold text-white">{peerDisplayName}</h4>
                <p className="text-xs text-rose-400 mt-1">
                  {!peerConnected ? "Connecting video stream..." : "Camera is turned off"}
                </p>
              </div>
            )}

            {/* Spotlight Name Overlay */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{peerDisplayName}</span>
            </div>

            {/* Small Self Floating Tile */}
            <div className="absolute bottom-4 right-4 z-30 h-36 w-52 sm:h-44 sm:w-60 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900 shadow-2xl">
              <video
                ref={setLocalVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${isVideoOff ? "hidden" : "block"}`}
              />

              {isVideoOff && (
                <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-2">
                  <img
                    src={myAvatar}
                    alt="You"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20 mb-1"
                  />
                  <span className="text-[10px] text-slate-400">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/60 px-2 py-0.5 rounded-md text-[10px] text-white">
                You
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── GOOGLE MEET / ZOOM BOTTOM CONTROLS DOCK ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="flex items-center gap-2.5 sm:gap-4 bg-[#1e2433]/90 backdrop-blur-xl border border-white/15 p-2 sm:p-2.5 rounded-3xl shadow-2xl">
          {/* Microphone Toggle */}
          <button
            onClick={toggleAudio}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              isMuted
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              isVideoOff
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              isScreenSharing
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
          </button>

          {/* In-Call Live Chat Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "chat" ? null : "chat")}
            className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              activeDrawer === "chat"
                ? "bg-rose-600 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Meeting Chat"
          >
            <MessageSquare size={20} />
            {messages.length > 0 && activeDrawer !== "chat" && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold rounded-full flex items-center justify-center text-white">
                {messages.length}
              </span>
            )}
          </button>

          {/* Meeting Info Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "info" ? null : "info")}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              activeDrawer === "info"
                ? "bg-rose-600 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Meeting Details"
          >
            <Info size={20} />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          {/* Red End Call Pill Button */}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-6 rounded-2xl bg-red-600 text-white font-bold text-xs sm:text-sm hover:bg-red-700 shadow-xl transition active:scale-95 cursor-pointer"
            title={isHost ? "End Consultation" : "Leave Meeting"}
          >
            <PhoneOff size={18} />
            <span>{isHost ? "End Session" : "Leave"}</span>
          </button>
        </div>
      </div>

      {/* ── GOOGLE MEET / ZOOM SLIDE-OUT SIDEBAR DRAWERS ── */}
      {activeDrawer && (
        <div className="fixed top-16 bottom-24 right-4 z-40 w-full max-w-sm bg-[#18202f]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col animate-fade-in text-white overflow-hidden">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {activeDrawer === "chat" && <MessageSquare size={16} className="text-rose-400" />}
              {activeDrawer === "info" && <Info size={16} className="text-rose-400" />}
              {activeDrawer === "chat" ? "In-Call Messages" : "Session Details"}
            </h3>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* DRAWER CONTENT: CHAT */}
          {activeDrawer === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                    <MessageSquare size={28} className="text-slate-600 mb-2" />
                    <p className="text-xs font-semibold">No messages yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Messages sent here are visible to call participants.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = String(m.senderId) === String(user._id);
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-1 px-1">
                          {isMe ? "You" : m.senderName}
                        </span>
                        <div
                          className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-medium ${
                            isMe
                              ? "bg-rose-600 text-white rounded-br-xs"
                              : "bg-white/10 text-slate-100 rounded-bl-xs"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChat}
                className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#121620]"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message to everyone..."
                  className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-40 cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* DRAWER CONTENT: INFO */}
          {activeDrawer === "info" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Topic & Agenda
                </span>
                <h4 className="text-sm font-bold text-white mb-1">{sessionData?.title}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {sessionData?.description || "1-on-1 private live video consultation session."}
                </p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duration Limit</span>
                  <span className="font-bold text-white font-mono">
                    {sessionData?.maxConsultationDuration || 15} mins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Encryption</span>
                  <span className="font-bold text-emerald-400">WebRTC DTLS/SRTP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role</span>
                  <span className="font-bold text-rose-300">{isHost ? "Host" : "Admitted Participant"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

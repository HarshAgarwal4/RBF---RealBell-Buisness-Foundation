import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Users,
  MessageSquare,
  Hand,
  PhoneOff,
  Maximize2,
  Minimize2,
  Grid,
  User,
  Send,
  X,
  Share2,
  Shield,
  Smile,
  Volume2,
  MoreVertical,
  Check,
  UserX,
  Clock,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function GroupVideoCallRoom({ session, socket, onLeave }) {
  const navigate = useNavigate();
  const { user } = useStore();

  const isHost = String(session.host?._id || session.host) === String(user?._id || user?.id);

  const [isAdmitted, setIsAdmitted] = useState(isHost); // Host is always admitted immediately
  const [peers, setPeers] = useState([]);
  const [lobbyUsers, setLobbyUsers] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [peerId]: MediaStream }

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "speaker"

  // Drawers
  const [activeDrawer, setActiveDrawer] = useState(null); // null | "participants" | "chat"
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Call timer
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const roomContainerRef = useRef(null);
  const chatBottomRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { [peerId]: RTCPeerConnection }

  // 1. Initialize local media stream
  useEffect(() => {
    let mounted = true;
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local tracks to any existing peer connections
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        });
      } catch (err) {
        console.warn("Could not access camera/mic:", err);
        toast.warn("Could not access camera/mic. Joined with media disabled.");
        setIsVideoOff(true);
        setIsMuted(true);
      }
    }
    startMedia();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    };
  }, []);

  // 2. Call duration timer
  useEffect(() => {
    if (!isAdmitted) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAdmitted]);

  // Create Peer Connection helper
  const createPeerConnection = useCallback((peerId, peerSocketId) => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerId] = pc;

    // Send local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: event.streams[0],
        }));
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("live-session:group:signal", {
          sessionId: session._id,
          to: peerId,
          toSocketId: peerSocketId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    return pc;
  }, [socket, session?._id]);

  // 3. Socket Group Setup
  useEffect(() => {
    if (!socket || !session?._id) return;

    // Join group room
    socket.emit(
      "live-session:group:join",
      {
        sessionId: session._id,
        userInfo: {
          name: user?.name || "Participant",
          avatar: user?.account?.image || "",
          company: user?.company_name || "",
          isMuted,
          isVideoOff,
        },
      },
      (res) => {
        if (res?.status === 1) {
          if (res.isAdmitted) {
            setIsAdmitted(true);
            setPeers(res.peers || []);
            if (res.lobby) setLobbyUsers(res.lobby);
            // Connect with existing peers
            (res.peers || []).forEach(async (peer) => {
              const pc = createPeerConnection(peer._id, peer.socketId);
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("live-session:group:signal", {
                  sessionId: session._id,
                  to: peer._id,
                  toSocketId: peer.socketId,
                  signal: { type: "offer", sdp: offer },
                });
              } catch (e) {
                console.error("Error creating initial offer:", e);
              }
            });
          } else {
            setIsAdmitted(false);
          }
        }
      }
    );

    // Host admitted self
    const handleSelfAdmitted = (data) => {
      setIsAdmitted(true);
      toast.success("The host admitted you to the meeting!");
      setPeers(data.peers || []);
      (data.peers || []).forEach(async (peer) => {
        const pc = createPeerConnection(peer._id, peer.socketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("live-session:group:signal", {
            sessionId: session._id,
            to: peer._id,
            toSocketId: peer.socketId,
            signal: { type: "offer", sdp: offer },
          });
        } catch (e) {
          console.error("Error creating offer on admittance:", e);
        }
      });
    };

    // Host denied self
    const handleSelfDenied = () => {
      toast.warn("The host declined your entry to this meeting.");
      if (onLeave) onLeave();
      else navigate("/live_sessions");
    };

    // User joined
    const handleUserJoined = async ({ participant }) => {
      setPeers((prev) => {
        if (prev.some((p) => String(p._id) === String(participant._id))) return prev;
        return [...prev, participant];
      });
      setLobbyUsers((prev) => prev.filter((p) => String(p._id) !== String(participant._id)));
      toast.info(`${participant.name} joined the meeting`);
    };

    // User left
    const handleUserLeft = ({ userId }) => {
      setPeers((prev) => prev.filter((p) => String(p._id) !== String(userId)));
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    // Lobby updated (for Host)
    const handleLobbyUpdated = ({ lobby }) => {
      if (isHost) {
        setLobbyUsers(lobby || []);
      }
    };

    // Remote Host Mute
    const handleRemoteMute = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      setIsMuted(true);
      toast.info("The host has muted your microphone.");
      socket.emit("live-session:group:media-state", {
        sessionId: session._id,
        isMuted: true,
        isVideoOff,
        isScreenSharing,
      });
    };

    // Remote Host Stop Video
    const handleRemoteStopVideo = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      setIsVideoOff(true);
      toast.info("The host has turned off your video camera.");
      socket.emit("live-session:group:media-state", {
        sessionId: session._id,
        isMuted,
        isVideoOff: true,
        isScreenSharing,
      });
    };

    // Kicked by Host
    const handleKicked = ({ reason }) => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      toast.error(reason || "You were removed from the meeting by the host.");
      if (onLeave) onLeave();
      else navigate("/live_sessions");
    };

    // WebRTC Signaling Mesh
    const handleSignal = async ({ from, fromSocketId, signal }) => {
      const pc = createPeerConnection(from, fromSocketId);

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("live-session:group:signal", {
          sessionId: session._id,
          to: from,
          toSocketId: fromSocketId,
          signal: { type: "answer", sdp: answer },
        });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === "candidate" && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn("Error adding ICE candidate:", e);
        }
      }
    };

    // Peer media state
    const handlePeerMediaState = ({ userId, isMuted: peerMuted, isVideoOff: peerVideoOff, isScreenSharing: peerScreenSharing }) => {
      setPeers((prev) =>
        prev.map((p) =>
          String(p._id) === String(userId)
            ? { ...p, isMuted: peerMuted !== undefined ? peerMuted : p.isMuted, isVideoOff: peerVideoOff !== undefined ? peerVideoOff : p.isVideoOff, isScreenSharing: peerScreenSharing !== undefined ? peerScreenSharing : p.isScreenSharing }
            : p
        )
      );
    };

    // Hand raise
    const handleHandRaised = ({ userId, raised }) => {
      setPeers((prev) =>
        prev.map((p) =>
          String(p._id) === String(userId) ? { ...p, handRaised: raised } : p
        )
      );
    };

    // In-meeting chat
    const handleChatMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
      if (activeDrawer !== "chat") {
        setUnreadChatCount((prev) => prev + 1);
      }
    };

    socket.on("live-session:group:admitted", handleSelfAdmitted);
    socket.on("live-session:group:denied", handleSelfDenied);
    socket.on("live-session:group:user-joined", handleUserJoined);
    socket.on("live-session:group:user-left", handleUserLeft);
    socket.on("live-session:group:lobby-updated", handleLobbyUpdated);
    socket.on("live-session:group:remote-mute", handleRemoteMute);
    socket.on("live-session:group:remote-stop-video", handleRemoteStopVideo);
    socket.on("live-session:group:kicked", handleKicked);
    socket.on("live-session:group:signal", handleSignal);
    socket.on("live-session:group:peer-media-state", handlePeerMediaState);
    socket.on("live-session:group:hand-raised", handleHandRaised);
    socket.on("live-session:group:chat-message", handleChatMessage);

    return () => {
      socket.emit("live-session:group:leave", { sessionId: session._id });
      socket.off("live-session:group:admitted", handleSelfAdmitted);
      socket.off("live-session:group:denied", handleSelfDenied);
      socket.off("live-session:group:user-joined", handleUserJoined);
      socket.off("live-session:group:user-left", handleUserLeft);
      socket.off("live-session:group:lobby-updated", handleLobbyUpdated);
      socket.off("live-session:group:remote-mute", handleRemoteMute);
      socket.off("live-session:group:remote-stop-video", handleRemoteStopVideo);
      socket.off("live-session:group:kicked", handleKicked);
      socket.off("live-session:group:signal", handleSignal);
      socket.off("live-session:group:peer-media-state", handlePeerMediaState);
      socket.off("live-session:group:hand-raised", handleHandRaised);
      socket.off("live-session:group:chat-message", handleChatMessage);
    };
  }, [socket, session?._id, user, isHost, createPeerConnection, isMuted, isVideoOff, isScreenSharing, activeDrawer, onLeave, navigate]);

  // Attach remote streams to video tags
  useEffect(() => {
    peers.forEach((peer) => {
      const stream = remoteStreams[peer._id];
      const videoEl = document.getElementById(`peer-video-${peer._id}`);
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [peers, remoteStreams]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeDrawer === "chat") {
      setUnreadChatCount(0);
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeDrawer, chatMessages]);

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      if (socket) {
        socket.emit("live-session:group:media-state", {
          sessionId: session._id,
          isMuted: !isMuted,
          isVideoOff,
          isScreenSharing,
        });
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
      if (socket) {
        socket.emit("live-session:group:media-state", {
          sessionId: session._id,
          isMuted,
          isVideoOff: !isVideoOff,
          isScreenSharing,
        });
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(camTrack);
        });
        setIsScreenSharing(false);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (err) {
        toast.error("Screen sharing cancelled or unsupported.");
      }
    }
  };

  // Raise Hand
  const toggleRaiseHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (socket) {
      socket.emit("live-session:group:raise-hand", {
        sessionId: session._id,
        raised: nextState,
      });
    }
  };

  // Send Chat Message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit("live-session:group:chat", {
      sessionId: session._id,
      text: chatInput.trim(),
    });
    setChatInput("");
  };

  // Host Action: Admit One
  const handleHostAdmit = (participantId) => {
    if (!socket) return;
    socket.emit("live-session:group:admit", {
      sessionId: session._id,
      participantId,
    });
  };

  // Host Action: Admit All
  const handleHostAdmitAll = () => {
    if (!socket) return;
    socket.emit("live-session:group:admit-all", { sessionId: session._id });
  };

  // Host Action: Deny One
  const handleHostDeny = (participantId) => {
    if (!socket) return;
    socket.emit("live-session:group:deny", {
      sessionId: session._id,
      participantId,
    });
  };

  // Host Action: Kick
  const handleHostKick = (participantId) => {
    if (!window.confirm("Are you sure you want to remove this participant from the meeting?")) return;
    if (!socket) return;
    socket.emit("live-session:group:kick", {
      sessionId: session._id,
      participantId,
    });
  };

  // Host Action: Remote Mute
  const handleHostMute = (participantId) => {
    if (!socket) return;
    socket.emit("live-session:group:host-mute", {
      sessionId: session._id,
      participantId,
    });
    toast.info("Sent mute command to participant");
  };

  // Host Action: Remote Stop Video
  const handleHostStopVideo = (participantId) => {
    if (!socket) return;
    socket.emit("live-session:group:host-stop-video", {
      sessionId: session._id,
      participantId,
    });
    toast.info("Sent stop-video command to participant");
  };

  // Host Action: Mute All
  const handleHostMuteAll = () => {
    if (!socket) return;
    socket.emit("live-session:group:host-mute-all", { sessionId: session._id });
    toast.info("Muted all participants");
  };

  // Share session link
  const handleShare = () => {
    const url = `${window.location.origin}/live_sessions/${session._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Meeting link copied to clipboard!");
    } else {
      toast.info(`Session URL: ${url}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      roomContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const totalInMeeting = 1 + peers.length;
  const hostName = session.host?.name || "Host";

  /* ═══════════════════════════════════════════════════════════════
     WAITING LOBBY OVERLAY (If Participant is not admitted yet)
  ═══════════════════════════════════════════════════════════════ */
  if (!isAdmitted && !isHost) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B101B] text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-[#161D2B] rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl text-center space-y-6 animate-fade-in">
          {/* Animated Host Halo */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-[#8E1B2E]/30 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-[#8E1B2E] flex items-center justify-center text-white text-3xl font-black shadow-xl">
              {hostName.substring(0, 2).toUpperCase()}
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
              <Clock size={13} className="animate-spin" />
              WAITING ROOM
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Please wait, the host will let you in soon
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              You are in the waiting lobby for <span className="text-slate-200 font-bold">{session.title}</span>. <br />
              <span className="text-slate-300 font-semibold">{hostName}</span> has been notified of your request to join.
            </p>
          </div>

          {/* Quick Media Pre-check in Lobby */}
          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-center gap-4 border border-white/5">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition cursor-pointer ${
                isMuted ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition cursor-pointer ${
                isVideoOff ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white"
              }`}
              title={isVideoOff ? "Turn on Camera" : "Turn off Camera"}
            >
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onLeave) onLeave();
              else navigate("/live_sessions");
            }}
            className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            Leave Waiting Lobby
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LIVE GROUP CALL MEETING ROOM
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div
      ref={roomContainerRef}
      className="fixed inset-0 z-50 bg-[#0B101B] text-slate-100 flex flex-col font-sans select-none overflow-hidden"
    >
      {/* ── TOP HEADER ── */}
      <header className="h-16 bg-[#161D2B]/90 backdrop-blur border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#8E1B2E] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            {session.title?.substring(0, 2).toUpperCase() || "GC"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {session.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE4E6] text-[#8E1B2E] tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8E1B2E] animate-pulse" />
                GROUP CALL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Hosted by <span className="font-semibold text-slate-300">{hostName}</span>
            </p>
          </div>
        </div>

        {/* Center Elapsed Timer */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-wider text-slate-300">
          <Clock size={13} className="text-emerald-400" />
          <span>{formatDuration(callDuration)}</span>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 transition cursor-pointer"
            title="Copy Meeting Link"
          >
            <Share2 size={16} />
          </button>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                viewMode === "grid" ? "bg-[#8E1B2E] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid size={13} />
              Grid
            </button>
            <button
              onClick={() => setViewMode("speaker")}
              className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                viewMode === "speaker" ? "bg-[#8E1B2E] text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <User size={13} />
              Speaker
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT (VIDEO GRID + DRAWERS) ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Tiles Area */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto flex items-center justify-center">
          <div
            className={`w-full h-full max-h-[85vh] grid gap-3 sm:gap-4 transition-all duration-300 ${
              totalInMeeting === 1
                ? "grid-cols-1"
                : totalInMeeting === 2
                ? "grid-cols-1 md:grid-cols-2"
                : totalInMeeting <= 4
                ? "grid-cols-2"
                : totalInMeeting <= 6
                ? "grid-cols-2 md:grid-cols-3"
                : "grid-cols-3 md:grid-cols-4"
            }`}
          >
            {/* SELF VIDEO TILE */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1D2536] border-2 border-transparent hover:border-slate-600 transition flex items-center justify-center shadow-lg group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"} ${
                  !isScreenSharing ? "scale-x-[-1]" : ""
                }`}
              />

              {isVideoOff && (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#8E1B2E] text-white font-extrabold text-2xl flex items-center justify-center shadow-xl">
                  {(user?.name || "You").substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Top-Right Badges */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                {isHost && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-500/40">
                    <Crown size={11} />
                    Host
                  </span>
                )}
                {handRaised && (
                  <div className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 animate-bounce">
                    <Hand size={13} />
                    Hand Raised
                  </div>
                )}
              </div>

              {/* Bottom Overlay Label */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs text-xs font-semibold text-white flex items-center gap-2 z-10">
                {isMuted ? <MicOff size={13} className="text-rose-400" /> : <Mic size={13} className="text-emerald-400" />}
                <span>You ({user?.name || "Me"})</span>
              </div>
            </div>

            {/* PEER VIDEO TILES */}
            {peers.map((peer) => {
              const pInitials = (peer.name || "User").substring(0, 2).toUpperCase();
              const peerIsHost = String(session.host?._id || session.host) === String(peer._id);

              return (
                <div
                  key={peer._id || peer.socketId}
                  className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#1D2536] border-2 border-transparent hover:border-slate-600 transition flex items-center justify-center shadow-lg group"
                >
                  <video
                    id={`peer-video-${peer._id}`}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${peer.isVideoOff ? "hidden" : "block"}`}
                  />

                  {peer.isVideoOff && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-xl">
                      {pInitials}
                    </div>
                  )}

                  {/* Top-Right Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {peerIsHost && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center gap-1 border border-amber-500/40">
                        <Crown size={11} />
                        Host
                      </span>
                    )}
                    {peer.handRaised && (
                      <div className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 animate-bounce">
                        <Hand size={13} />
                        Hand Raised
                      </div>
                    )}
                  </div>

                  {/* Host Quick Controls on Hover Tile */}
                  {isHost && (
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-xl z-20">
                      <button
                        onClick={() => handleHostMute(peer._id)}
                        className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-rose-400 transition cursor-pointer"
                        title="Mute Mic"
                      >
                        <MicOff size={13} />
                      </button>
                      <button
                        onClick={() => handleHostStopVideo(peer._id)}
                        className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-rose-400 transition cursor-pointer"
                        title="Stop Video"
                      >
                        <VideoOff size={13} />
                      </button>
                      <button
                        onClick={() => handleHostKick(peer._id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Remove from Meeting"
                      >
                        <UserX size={13} />
                      </button>
                    </div>
                  )}

                  {/* Bottom Overlay Label */}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs text-xs font-semibold text-white flex items-center gap-2 z-10">
                    {peer.isMuted ? (
                      <MicOff size={13} className="text-rose-400" />
                    ) : (
                      <Mic size={13} className="text-emerald-400" />
                    )}
                    <span>{peer.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* ── PARTICIPANTS & HOST LOBBY DRAWER ── */}
        {activeDrawer === "participants" && (
          <aside className="w-80 bg-[#161D2B] border-l border-white/10 flex flex-col z-40 animate-slide-in">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Users size={16} className="text-[#8E1B2E]" />
                Participants ({totalInMeeting})
              </h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-4">
              {/* ── HOST ONLY: WAITING LOBBY SECTION ── */}
              {isHost && lobbyUsers.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} />
                      Waiting Room ({lobbyUsers.length})
                    </span>
                    <button
                      onClick={handleHostAdmitAll}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] transition cursor-pointer"
                    >
                      Admit All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lobbyUsers.map((item) => (
                      <div
                        key={item._id}
                        className="p-2.5 rounded-xl bg-[#161D2B] border border-amber-500/30 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(item.name || "U").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">Waiting to join</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleHostAdmit(item._id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                            title="Admit Participant"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => handleHostDeny(item._id)}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                            title="Deny Entry"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── IN MEETING PARTICIPANTS LIST ── */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  In Meeting ({totalInMeeting})
                </div>

                {/* Self */}
                <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#8E1B2E] text-white flex items-center justify-center font-bold text-xs">
                      {(user?.name || "You").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        You {isHost ? "(Host)" : ""}
                        {isHost && <Crown size={12} className="text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {isMuted ? <MicOff size={14} className="text-rose-400" /> : <Mic size={14} className="text-emerald-400" />}
                    {isVideoOff ? <VideoOff size={14} className="text-rose-400" /> : <Video size={14} />}
                  </div>
                </div>

                {/* Peers */}
                {peers.map((peer) => {
                  const peerIsHost = String(session.host?._id || session.host) === String(peer._id);

                  return (
                    <div
                      key={peer._id || peer.socketId}
                      className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between border border-white/5 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(peer.name || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                            {peer.name}
                            {peerIsHost && <Crown size={12} className="text-amber-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {peerIsHost ? "Meeting Host" : "Participant"}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5">
                        {isHost && !peerIsHost && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleHostMute(peer._id)}
                              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Mute Mic"
                            >
                              <MicOff size={13} />
                            </button>
                            <button
                              onClick={() => handleHostStopVideo(peer._id)}
                              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Stop Video"
                            >
                              <VideoOff size={13} />
                            </button>
                            <button
                              onClick={() => handleHostKick(peer._id)}
                              className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Remove"
                            >
                              <UserX size={13} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-slate-400 pl-1">
                          {peer.isMuted ? <MicOff size={14} className="text-rose-400" /> : <Mic size={14} className="text-emerald-400" />}
                          {peer.isVideoOff ? <VideoOff size={14} className="text-rose-400" /> : <Video size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Host Mute All Footer */}
            {isHost && (
              <div className="p-3 border-t border-white/10 bg-white/5">
                <button
                  onClick={handleHostMuteAll}
                  className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-rose-500/30"
                >
                  <MicOff size={14} />
                  Mute All Participants
                </button>
              </div>
            )}
          </aside>
        )}

        {/* ── CHAT DRAWER ── */}
        {activeDrawer === "chat" && (
          <aside className="w-80 bg-[#161D2B] border-l border-white/10 flex flex-col z-40 animate-slide-in">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-[#8E1B2E]" />
                In-Meeting Chat
              </h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No messages yet. Send a message to everyone in the meeting.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === String(user?._id || user?.id);
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-semibold">
                        {isMe ? "You" : msg.senderName}
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                          isMe ? "bg-[#8E1B2E] text-white rounded-br-none" : "bg-white/10 text-slate-100 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#8E1B2E]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] disabled:opacity-40 text-white transition cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* ── BOTTOM FLOATING ZOOM DOCK ── */}
      <footer className="h-20 bg-[#181F2E]/95 backdrop-blur border-t border-white/10 px-4 sm:px-8 flex items-center justify-between z-30 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Shield size={14} className="text-emerald-400" />
          <span>Encrypted WebRTC</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-2xl transition cursor-pointer ${
              isMuted ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span className="text-[10px] mt-0.5 font-semibold">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-2xl transition cursor-pointer ${
              isVideoOff ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            <span className="text-[10px] mt-0.5 font-semibold">{isVideoOff ? "Start" : "Stop"}</span>
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-2xl transition cursor-pointer ${
              isScreenSharing ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {isScreenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
            <span className="text-[10px] mt-0.5 font-semibold">{isScreenSharing ? "Sharing" : "Share"}</span>
          </button>

          {/* Participants */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "participants" ? null : "participants")}
            className={`relative flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-2xl transition cursor-pointer ${
              activeDrawer === "participants" ? "bg-[#8E1B2E] text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Users size={18} />
            <span className="text-[10px] mt-0.5 font-semibold">People</span>
            {isHost && lobbyUsers.length > 0 ? (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] animate-pulse">
                {lobbyUsers.length}
              </span>
            ) : (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-[#8E1B2E] text-[9px] font-bold">
                {totalInMeeting}
              </span>
            )}
          </button>

          {/* Chat */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "chat" ? null : "chat")}
            className={`relative flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-2xl transition cursor-pointer ${
              activeDrawer === "chat" ? "bg-[#8E1B2E] text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[10px] mt-0.5 font-semibold">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full bg-[#E11D48] text-white font-bold text-[9px] animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleRaiseHand}
            className={`flex flex-col items-center justify-center w-12 sm:w-14 h-12 rounded-2xl transition cursor-pointer ${
              handRaised ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Hand size={18} />
            <span className="text-[10px] mt-0.5 font-semibold">{handRaised ? "Lower" : "Raise"}</span>
          </button>

          {/* Leave Call */}
          <button
            onClick={() => {
              if (onLeave) onLeave();
              else navigate("/live_sessions");
            }}
            className="flex flex-col items-center justify-center w-14 sm:w-16 h-12 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white transition cursor-pointer shadow-lg shadow-rose-900/30 active:scale-95 ml-2 sm:ml-4"
          >
            <PhoneOff size={18} />
            <span className="text-[10px] mt-0.5 font-bold">Leave</span>
          </button>
        </div>

        {/* Right Session Status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Connected ({totalInMeeting})</span>
        </div>
      </footer>
    </div>
  );
}

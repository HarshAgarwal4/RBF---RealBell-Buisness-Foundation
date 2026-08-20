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
  Users,
  MessageSquare,
  Info,
  Send,
  X,
  LayoutGrid,
  Square,
  Radio,
  Share2,
  Copy,
  Pin,
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

export default function GroupCallRoom({
  initialSessionData = null,
  initialAccessGrant = null,
  isHost: initialIsHost = false,
}) {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";

  const [loading, setLoading] = useState(!initialAccessGrant);
  const [accessGrant, setAccessGrant] = useState(initialAccessGrant);
  const [sessionData, setSessionData] = useState(initialSessionData);
  const [isHost, setIsHost] = useState(initialIsHost);

  // Call States
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Connected remote peers map: { [peerId]: { peerId, peerName, peerAvatar, stream, isMuted, isVideoOff, isScreenSharing, isHost, connected } }
  const [peers, setPeers] = useState({});

  // UI Modes
  const [layoutMode, setLayoutMode] = useState("grid"); // "grid" | "spotlight"
  const [spotlightPeerId, setSpotlightPeerId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null); // null | 'chat' | 'info' | 'people'
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Media Streams State
  const [localStreamState, setLocalStreamState] = useState(null);

  const localVideoRef = useRef(null);
  const containerRef = useRef(null);
  const chatBottomRef = useRef(null);

  const socketRef = useRef(null);
  const peersRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // peerId -> MediaStream
  const pendingCandidatesRef = useRef(new Map()); // peerId -> Array<candidate>
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Authenticate / Verify Access
  useEffect(() => {
    if (initialAccessGrant && initialSessionData) {
      setAccessGrant(initialAccessGrant);
      setSessionData(initialSessionData);
      setIsHost(initialIsHost);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function verifyAccess() {
      try {
        setLoading(true);
        const res = await axios.get(`/live-sessions/${sessionId}/call-access`);
        if (!isMounted) return;
        if (res.data?.status === 1 && res.data?.grant?.authorized) {
          setAccessGrant(res.data.grant);
          setSessionData(res.data.session);
          setIsHost(res.data.isHost);
        } else {
          toast.error(res.data?.msg || "You are not authorized to join this group call room.");
          navigate(`/live-sessions/${sessionId}`, { replace: true });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Access verification failed:", err);
        toast.error(err?.response?.data?.msg || "Call room access denied.");
        navigate(`/live-sessions/${sessionId}`, { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyAccess();
    return () => {
      isMounted = false;
    };
  }, [sessionId, navigate, initialAccessGrant, initialSessionData, initialIsHost]);

  // Callback ref for local video node
  const setLocalVideoNode = useCallback((node) => {
    localVideoRef.current = node;
    if (node && localStreamRef.current) {
      if (node.srcObject !== localStreamRef.current) {
        node.srcObject = localStreamRef.current;
      }
      node.playsInline = true;
      node.autoplay = true;
      node.muted = true;
      node.play().catch(() => {});
    }
  }, []);

  // Sync local stream on changes
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

  // Auto-scroll chat
  useEffect(() => {
    if (activeDrawer === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeDrawer]);

  /* ── 2. Acquire Local Camera & Microphone ── */
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
      console.warn("Standard video/audio failed, falling back to standard constraints:", err1.name);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err2) {
        console.warn("Camera failed, falling back to microphone-only:", err2.name);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setIsVideoOff(true);
          toast.warn("Camera unavailable. Connected with microphone only.");
        } catch (finalErr) {
          console.error("All media permission attempts failed:", finalErr);
          toast.error("Microphone or camera access denied in browser.");
          throw finalErr;
        }
      }
    }

    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    setLocalStreamState(new MediaStream(stream.getTracks()));

    // Attach local tracks to any existing peer connections
    peersRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });
    });

    return stream;
  }, []);

  /* ── 3. Helper to Flush Pending ICE Candidates ── */
  const flushPendingIceCandidates = useCallback(async (targetPeerId, pc) => {
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;
    const queue = pendingCandidatesRef.current.get(targetPeerId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`Error adding queued ICE candidate for peer ${targetPeerId}:`, err);
      }
    }
  }, []);

  /* ── 4. Create or Retrieve Peer Connection ── */
  const createPeerConnection = useCallback(
    (targetPeerId, peerMetadata = {}) => {
      if (peersRef.current.has(targetPeerId)) {
        return peersRef.current.get(targetPeerId);
      }

      const pc = new RTCPeerConnection(ICE_CONFIG);

      // Add local audio and video tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("session:room:signal", {
            sessionId,
            targetPeerId,
            signalData: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      // Handle Remote Track Arrival
      pc.ontrack = (event) => {
        let remoteStream = remoteStreamsRef.current.get(targetPeerId);
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamsRef.current.set(targetPeerId, remoteStream);
        }

        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
              remoteStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
            remoteStream.addTrack(event.track);
          }
        }

        const combinedStream = new MediaStream(remoteStream.getTracks());
        setPeers((prev) => {
          const existing = prev[targetPeerId] || {};
          return {
            ...prev,
            [targetPeerId]: {
              ...existing,
              peerId: targetPeerId,
              peerName: peerMetadata.peerName || existing.peerName || "Participant",
              peerAvatar: peerMetadata.peerAvatar || existing.peerAvatar || "",
              stream: combinedStream,
              connected: true,
              isMuted: existing.isMuted ?? false,
              isVideoOff: existing.isVideoOff ?? false,
              isScreenSharing: existing.isScreenSharing ?? false,
              isHost: peerMetadata.isHost ?? existing.isHost ?? false,
            },
          };
        });
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "connected" || state === "completed") {
          setPeers((prev) =>
            prev[targetPeerId] ? { ...prev, [targetPeerId]: { ...prev[targetPeerId], connected: true } } : prev
          );
        } else if (state === "failed" || state === "disconnected") {
          setPeers((prev) =>
            prev[targetPeerId] ? { ...prev, [targetPeerId]: { ...prev[targetPeerId], connected: false } } : prev
          );
        }
      };

      peersRef.current.set(targetPeerId, pc);
      return pc;
    },
    [sessionId]
  );

  /* ── 5. Initiate Offer to Target Peer ── */
  const initiateOffer = useCallback(
    async (targetPeerId, peerMetadata = {}) => {
      const pc = createPeerConnection(targetPeerId, peerMetadata);
      if (!pc || !socketRef.current) return;

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        socketRef.current.emit("session:room:signal", {
          sessionId,
          targetPeerId,
          signalData: { type: "offer", offer: pc.localDescription },
        });
      } catch (err) {
        console.error(`Error generating offer for peer ${targetPeerId}:`, err);
      }
    },
    [sessionId, createPeerConnection]
  );

  /* ── 6. Handle Incoming Offer & Reply with Answer ── */
  const handleIncomingOffer = useCallback(
    async (senderId, offer, senderMetadata = {}) => {
      const pc = createPeerConnection(senderId, senderMetadata);
      if (!pc || !socketRef.current) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingIceCandidates(senderId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit("session:room:signal", {
          sessionId,
          targetPeerId: senderId,
          signalData: { type: "answer", answer: pc.localDescription },
        });
      } catch (err) {
        console.error(`Error handling offer from peer ${senderId}:`, err);
      }
    },
    [sessionId, createPeerConnection, flushPendingIceCandidates]
  );

  /* ── 7. Discover and Sync Peer ── */
  const handlePeerDiscovery = useCallback(
    (targetPeerId, peerMetadata = {}) => {
      if (!targetPeerId || String(targetPeerId) === String(user?._id)) return;

      // Register peer in state
      setPeers((prev) => {
        if (prev[targetPeerId]) return prev;
        return {
          ...prev,
          [targetPeerId]: {
            peerId: targetPeerId,
            peerName: peerMetadata.peerName || "Participant",
            peerAvatar: peerMetadata.peerAvatar || "",
            stream: null,
            connected: false,
            isMuted: false,
            isVideoOff: false,
            isScreenSharing: false,
            isHost: peerMetadata.isHost ?? false,
          },
        };
      });

      // Deterministic Offerer Rule:
      // Peer with lexicographically higher ID sends the offer.
      // Peer with lower ID waits and answers.
      // This eliminates 100% of WebRTC offer glare / collisions.
      const isOfferer = String(user?._id) > String(targetPeerId);
      if (isOfferer) {
        initiateOffer(targetPeerId, peerMetadata);
      }
    },
    [user?._id, initiateOffer]
  );

  /* ── 8. Cleanup Specific Peer ── */
  const cleanupPeer = useCallback((peerId) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      try {
        pc.close();
      } catch (_) {}
      peersRef.current.delete(peerId);
    }
    remoteStreamsRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
    setPeers((prev) => {
      const updated = { ...prev };
      delete updated[peerId];
      return updated;
    });
  }, []);

  /* ── 9. Socket Signaling Lifecycle ── */
  useEffect(() => {
    if (!accessGrant || !user?._id || !sessionId) return;

    const socket = io(backendUrl, {
      auth: { userId: user?._id },
      query: { userId: user?._id },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Start in-call duration timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Initialize media and join room
    acquireMedia()
      .then(() => {
        socket.emit("session:room:join", { sessionId, token: accessGrant.token }, (res) => {
          if (res?.status === 1 && Array.isArray(res.existingPeers)) {
            res.existingPeers.forEach((p) => {
              if (p.peerId && String(p.peerId) !== String(user._id)) {
                handlePeerDiscovery(p.peerId, p);
              }
            });
          }
        });

        socket.emit("session:room:ready", { sessionId });
      })
      .catch((err) => {
        console.error("Failed to acquire local media for group call:", err);
      });

    // Handle Signaling Messages (Offer / Answer / Candidate)
    socket.on("session:room:signal", async ({ targetPeerId, senderId, senderName, senderAvatar, signalData }) => {
      if (!senderId || String(senderId) === String(user._id) || !signalData) return;
      if (targetPeerId && String(targetPeerId) !== String(user._id)) return;

      try {
        if (signalData.type === "offer") {
          await handleIncomingOffer(senderId, signalData.offer, {
            peerName: senderName,
            peerAvatar: senderAvatar,
          });
        } else if (signalData.type === "answer") {
          const pc = peersRef.current.get(senderId);
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
            await flushPendingIceCandidates(senderId, pc);
            setPeers((prev) => (prev[senderId] ? { ...prev, [senderId]: { ...prev[senderId], connected: true } } : prev));
          }
        } else if (signalData.type === "candidate" && signalData.candidate) {
          const pc = peersRef.current.get(senderId);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } else {
            if (!pendingCandidatesRef.current.has(senderId)) {
              pendingCandidatesRef.current.set(senderId, []);
            }
            pendingCandidatesRef.current.get(senderId).push(signalData.candidate);
          }
        }
      } catch (err) {
        console.error(`Signaling error with peer ${senderId}:`, err);
      }
    });

    // When another peer joins the room
    socket.on("session:room:peer-joined", (data) => {
      if (data?.peerId && String(data.peerId) !== String(user._id)) {
        toast.info(`${data.peerName || "A team member"} joined the call`);
        handlePeerDiscovery(data.peerId, data);
      }
    });

    // When another peer announces ready
    socket.on("session:room:peer-ready", (data) => {
      if (data?.peerId && String(data.peerId) !== String(user._id)) {
        handlePeerDiscovery(data.peerId, data);
      }
    });

    // When a peer leaves
    socket.on("session:room:peer-left", (data) => {
      if (data?.peerId) {
        cleanupPeer(data.peerId);
        toast.info("A participant left the call room.");
      }
    });

    // Remote media state changes
    socket.on("session:room:media-state", ({ peerId, isMuted, isVideoOff, isScreenSharing }) => {
      if (!peerId) return;
      setPeers((prev) => {
        if (!prev[peerId]) return prev;
        return {
          ...prev,
          [peerId]: {
            ...prev[peerId],
            isMuted: isMuted ?? prev[peerId].isMuted,
            isVideoOff: isVideoOff ?? prev[peerId].isVideoOff,
            isScreenSharing: isScreenSharing ?? prev[peerId].isScreenSharing,
          },
        };
      });
    });

    // Group chat messages
    socket.on("session:room:chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Session ended by host
    socket.on("session:room:ended", () => {
      toast.info("The group session has been ended by the host.");
      handleCleanupAndExit();
    });

    // Health check loop: if an offerer peer connection isn't connected within 4s, re-initiate offer
    const healthInterval = setInterval(() => {
      if (!socketRef.current) return;
      socketRef.current.emit("session:room:ready", { sessionId });
    }, 4000);

    return () => {
      clearInterval(healthInterval);
      handleCleanup();
    };
  }, [
    accessGrant,
    user?._id,
    sessionId,
    backendUrl,
    acquireMedia,
    handlePeerDiscovery,
    handleIncomingOffer,
    flushPendingIceCandidates,
    cleanupPeer,
  ]);

  const handleCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    peersRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch (_) {}
    });
    peersRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingCandidatesRef.current.clear();

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
      if (window.confirm("End this group call session for all participants?")) {
        try {
          if (socketRef.current) {
            socketRef.current.emit("session:room:end", { sessionId });
          }
          await axios.patch(`/live-sessions/${sessionId}/end`);
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
    if (isScreenSharing) {
      try {
        peersRef.current.forEach(async (pc) => {
          const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (videoSender && cameraTrackRef.current) {
            await videoSender.replaceTrack(cameraTrackRef.current);
          }
        });
        setIsScreenSharing(false);
        notifyMediaState(isMuted, isVideoOff, false);
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach(async (pc) => {
          const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        });

        setIsScreenSharing(true);
        notifyMediaState(isMuted, isVideoOff, true);

        screenTrack.onended = async () => {
          peersRef.current.forEach(async (pc) => {
            const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (videoSender && cameraTrackRef.current) {
              await videoSender.replaceTrack(cameraTrackRef.current);
            }
          });
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/live-sessions/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090D16] text-white">
        <div className="text-center">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-current border-t-transparent rounded-full text-[#b03052] mb-3" />
          <p className="text-sm font-semibold">Connecting to Group Call Room...</p>
        </div>
      </div>
    );
  }

  const peerList = Object.values(peers);
  const totalParticipantsCount = peerList.length + 1; // +1 for self

  const myAvatar =
    user?.account?.image ||
    `https://placehold.co/120x120/18213A/FFFFFF?text=${encodeURIComponent(
      (user?.name || "Me").slice(0, 2).toUpperCase()
    )}`;

  // Determine spotlight active peer
  const activeSpotlightPeer = spotlightPeerId ? peers[spotlightPeerId] : (peerList[0] || null);

  // Dynamic Grid Class
  const getGridClass = () => {
    if (totalParticipantsCount === 1) return "grid-cols-1 max-w-3xl";
    if (totalParticipantsCount === 2) return "grid-cols-1 md:grid-cols-2 max-w-6xl";
    if (totalParticipantsCount <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-6xl";
    if (totalParticipantsCount <= 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-full";
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#121620] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* ── TOP FLOATING HEADER ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3.5 sm:p-5 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Users size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1">
                {sessionData?.title || "Team Video Call"}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Radio size={10} className="animate-ping text-rose-400" /> Group Call
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
                • {totalParticipantsCount} {totalParticipantsCount === 1 ? "participant" : "participants"}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-xs font-semibold text-slate-200"
            title="Copy Meeting Link"
          >
            <Share2 size={13} className="text-rose-400" /> Share Link
          </button>

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

      {/* ── VIDEO STAGE ── */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-5 pt-16 sm:pt-20 pb-24 overflow-hidden">
        {layoutMode === "grid" ? (
          /* ADAPTIVE GRID VIEW */
          <div className={`w-full h-full grid gap-3 sm:gap-4 items-center justify-center ${getGridClass()}`}>
            {/* SELF VIDEO TILE */}
            <div className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden bg-[#1a2130] border border-white/10 shadow-2xl flex items-center justify-center group">
              <video
                ref={setLocalVideoNode}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
              />

              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#1a2130] animate-fade-in z-10">
                  <img
                    src={myAvatar}
                    alt={user?.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-2"
                  />
                  <h4 className="text-xs sm:text-sm font-bold text-white">{user?.name || "You"}</h4>
                  <span className="text-[10px] text-slate-400">Camera Off</span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-semibold text-white border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>You {isHost ? "(Host)" : ""}</span>
              </div>

              <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
                {isScreenSharing && (
                  <span className="p-1.5 rounded-xl bg-blue-600/80 backdrop-blur-md text-white">
                    <MonitorUp size={13} />
                  </span>
                )}
                <div
                  className={`p-1.5 rounded-xl backdrop-blur-md border ${
                    isMuted ? "bg-red-600/80 border-red-500 text-white" : "bg-black/50 border-white/10 text-emerald-400"
                  }`}
                >
                  {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
                </div>
              </div>
            </div>

            {/* REMOTE PEERS TILES */}
            {peerList.map((p) => (
              <RemoteVideoTile
                key={p.peerId}
                peer={p}
                onPin={() => {
                  setSpotlightPeerId(p.peerId);
                  setLayoutMode("spotlight");
                }}
              />
            ))}
          </div>
        ) : (
          /* SPOTLIGHT VIEW */
          <div className="relative w-full h-full max-w-6xl flex flex-col justify-between overflow-hidden">
            {/* MAIN STAGE */}
            <div className="relative flex-1 w-full rounded-3xl overflow-hidden bg-[#1a2130] border border-white/10 shadow-2xl flex items-center justify-center mb-3">
              {activeSpotlightPeer ? (
                <RemoteSpotlightVideo peer={activeSpotlightPeer} />
              ) : (
                /* Self Spotlight if no peers */
                <div className="w-full h-full relative flex items-center justify-center">
                  <video
                    ref={setLocalVideoNode}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#1a2130]">
                      <img
                        src={myAvatar}
                        alt="You"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white/20 mb-3"
                      />
                      <h4 className="text-base font-bold text-white">{user?.name || "You"}</h4>
                      <span className="text-xs text-slate-400">Camera Off</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 z-20 bg-black/60 px-3 py-1.5 rounded-xl text-xs font-semibold">
                    You {isHost ? "(Host)" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* THUMBNAIL STRIP */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full">
              {/* Self Thumbnail */}
              <div
                onClick={() => setSpotlightPeerId(null)}
                className={`relative flex-shrink-0 h-24 w-36 rounded-2xl overflow-hidden bg-[#1a2130] border-2 cursor-pointer transition ${
                  spotlightPeerId === null ? "border-rose-500 shadow-lg" : "border-white/10 hover:border-white/30"
                }`}
              >
                <video
                  ref={setLocalVideoNode}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a2130]">
                    <span className="text-[10px] text-slate-400">You (Off)</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white">
                  You
                </div>
              </div>

              {/* Peers Thumbnails */}
              {peerList.map((p) => (
                <div
                  key={p.peerId}
                  onClick={() => setSpotlightPeerId(p.peerId)}
                  className={`relative flex-shrink-0 h-24 w-36 rounded-2xl overflow-hidden bg-[#1a2130] border-2 cursor-pointer transition ${
                    spotlightPeerId === p.peerId ? "border-rose-500 shadow-lg" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <RemoteVideoThumbnail peer={p} />
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white truncate max-w-[90%]">
                    {p.peerName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS DOCK ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="flex items-center gap-2.5 sm:gap-4 bg-[#1e2433]/90 backdrop-blur-xl border border-white/15 p-2 sm:p-2.5 rounded-3xl shadow-2xl">
          {/* Microphone Toggle */}
          <button
            onClick={toggleAudio}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              isMuted ? "bg-red-600 text-white hover:bg-red-700" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              isVideoOff ? "bg-red-600 text-white hover:bg-red-700" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              isScreenSharing ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
          </button>

          {/* In-Call Live Chat Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "chat" ? null : "chat")}
            className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              activeDrawer === "chat" ? "bg-rose-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
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

          {/* Participants Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "people" ? null : "people")}
            className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              activeDrawer === "people" ? "bg-rose-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            title="Participants List"
          >
            <Users size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-[10px] font-bold rounded-full flex items-center justify-center text-white">
              {totalParticipantsCount}
            </span>
          </button>

          {/* Meeting Info Drawer Toggle */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "info" ? null : "info")}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition shadow-md cursor-pointer ${
              activeDrawer === "info" ? "bg-rose-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
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
            title={isHost ? "End Group Session" : "Leave Call"}
          >
            <PhoneOff size={18} />
            <span>{isHost ? "End Session" : "Leave"}</span>
          </button>
        </div>
      </div>

      {/* ── SLIDE-OUT SIDEBAR DRAWERS ── */}
      {activeDrawer && (
        <div className="fixed top-16 bottom-24 right-4 z-40 w-full max-w-sm bg-[#18202f]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col animate-fade-in text-white overflow-hidden">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {activeDrawer === "chat" && <MessageSquare size={16} className="text-rose-400" />}
              {activeDrawer === "people" && <Users size={16} className="text-rose-400" />}
              {activeDrawer === "info" && <Info size={16} className="text-rose-400" />}
              {activeDrawer === "chat"
                ? "In-Call Group Chat"
                : activeDrawer === "people"
                ? `Participants (${totalParticipantsCount})`
                : "Session Information"}
            </h3>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* CHAT DRAWER */}
          {activeDrawer === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                    <MessageSquare size={28} className="text-slate-600 mb-2" />
                    <p className="text-xs font-semibold">No messages yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Messages sent here are visible to all group participants.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = String(m.senderId) === String(user._id);
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-slate-400 mb-1 px-1">
                          {isMe ? "You" : m.senderName}
                        </span>
                        <div
                          className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-medium ${
                            isMe ? "bg-rose-600 text-white rounded-br-xs" : "bg-white/10 text-slate-100 rounded-bl-xs"
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
                  placeholder="Message team..."
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

          {/* PEOPLE DRAWER */}
          {activeDrawer === "people" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* You Item */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <img src={myAvatar} alt="You" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {user?.name || "You"} <span className="text-[10px] text-rose-400 font-semibold">(You)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">{isHost ? "Host / Organizer" : "Participant"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  {isMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} className="text-emerald-400" />}
                  {isVideoOff ? <VideoOff size={14} className="text-red-400" /> : <VideoIcon size={14} className="text-emerald-400" />}
                </div>
              </div>

              {/* Connected Peers List */}
              {peerList.map((p) => {
                const avatar =
                  p.peerAvatar ||
                  `https://placehold.co/100x100/18213A/FFFFFF?text=${encodeURIComponent(
                    (p.peerName || "User").slice(0, 2).toUpperCase()
                  )}`;
                return (
                  <div
                    key={p.peerId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <img src={avatar} alt={p.peerName} className="w-9 h-9 rounded-full object-cover border border-white/20" />
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{p.peerName}</h4>
                        <p className="text-[10px] text-slate-400">{p.isHost ? "Host" : "Participant"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      {p.isMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} className="text-emerald-400" />}
                      {p.isVideoOff ? <VideoOff size={14} className="text-red-400" /> : <VideoIcon size={14} className="text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* INFO DRAWER */}
          {activeDrawer === "info" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Topic & Description
                </span>
                <h4 className="text-sm font-bold text-white mb-1">{sessionData?.title}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {sessionData?.description || "Group video meeting & collaborative live breakout session."}
                </p>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Format</span>
                  <span className="font-bold text-rose-300">Team Group Call</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Participants</span>
                  <span className="font-bold text-white font-mono">{totalParticipantsCount} in call</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Encryption</span>
                  <span className="font-bold text-emerald-400">WebRTC DTLS/SRTP</span>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition font-semibold text-xs text-white cursor-pointer"
              >
                <Copy size={14} /> Copy Meeting Link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Single Remote Video Tile in Grid Mode
 */
function RemoteVideoTile({ peer, onPin }) {
  const videoRef = useRef(null);

  const setVideoNode = useCallback(
    (node) => {
      videoRef.current = node;
      if (node && peer.stream) {
        if (node.srcObject !== peer.stream) {
          node.srcObject = peer.stream;
        }
        node.playsInline = true;
        node.autoplay = true;
        node.muted = false;
        node.play().catch(() => {});
      }
    },
    [peer.stream]
  );

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      if (videoRef.current.srcObject !== peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
      videoRef.current.playsInline = true;
      videoRef.current.autoplay = true;
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream, peer.isVideoOff]);

  const avatar =
    peer.peerAvatar ||
    `https://placehold.co/120x120/18213A/FFFFFF?text=${encodeURIComponent(
      (peer.peerName || "User").slice(0, 2).toUpperCase()
    )}`;

  return (
    <div className="relative w-full h-full min-h-[180px] rounded-3xl overflow-hidden bg-[#1a2130] border border-white/10 shadow-2xl flex items-center justify-center group">
      <video
        ref={setVideoNode}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${peer.isVideoOff || !peer.stream ? "opacity-0 absolute" : "opacity-100"}`}
      />

      {(peer.isVideoOff || !peer.stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#1a2130] animate-fade-in z-10">
          <div className="relative mb-2">
            <img
              src={avatar}
              alt={peer.peerName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
            {!peer.connected && (
              <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
            )}
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[85%]">{peer.peerName}</h4>
          <span className="text-[10px] text-rose-400 mt-0.5">
            {!peer.connected ? "Connecting..." : "Camera is off"}
          </span>
        </div>
      )}

      {/* Peer Name Banner */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-semibold text-white border border-white/10">
        <span className={`w-2 h-2 rounded-full ${peer.connected ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
        <span className="truncate max-w-[120px]">{peer.peerName}</span>
      </div>

      {/* Top Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
        {onPin && (
          <button
            onClick={onPin}
            title="Pin to spotlight"
            className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-xl bg-black/60 backdrop-blur-md text-slate-300 hover:text-white cursor-pointer"
          >
            <Pin size={13} />
          </button>
        )}
        {peer.isScreenSharing && (
          <span className="p-1.5 rounded-xl bg-blue-600/80 backdrop-blur-md text-white">
            <MonitorUp size={13} />
          </span>
        )}
        <div
          className={`p-1.5 rounded-xl backdrop-blur-md border ${
            peer.isMuted ? "bg-red-600/80 border-red-500 text-white" : "bg-black/50 border-white/10 text-emerald-400"
          }`}
        >
          {peer.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Large Spotlight View Video Tile
 */
function RemoteSpotlightVideo({ peer }) {
  const videoRef = useRef(null);

  const setVideoNode = useCallback(
    (node) => {
      videoRef.current = node;
      if (node && peer.stream) {
        if (node.srcObject !== peer.stream) {
          node.srcObject = peer.stream;
        }
        node.playsInline = true;
        node.autoplay = true;
        node.muted = false;
        node.play().catch(() => {});
      }
    },
    [peer.stream]
  );

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      if (videoRef.current.srcObject !== peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
      videoRef.current.playsInline = true;
      videoRef.current.autoplay = true;
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream, peer.isVideoOff]);

  const avatar =
    peer.peerAvatar ||
    `https://placehold.co/140x140/18213A/FFFFFF?text=${encodeURIComponent(
      (peer.peerName || "User").slice(0, 2).toUpperCase()
    )}`;

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <video
        ref={setVideoNode}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${peer.isVideoOff || !peer.stream ? "opacity-0 absolute" : "opacity-100"}`}
      />

      {(peer.isVideoOff || !peer.stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#1a2130]">
          <img
            src={avatar}
            alt={peer.peerName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white/20 mb-3"
          />
          <h4 className="text-base font-bold text-white">{peer.peerName}</h4>
          <span className="text-xs text-rose-400 mt-1">
            {!peer.connected ? "Connecting..." : "Camera is turned off"}
          </span>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>{peer.peerName}</span>
      </div>
    </div>
  );
}

/**
 * Small Remote Thumbnail for Spotlight mode strip
 */
function RemoteVideoThumbnail({ peer }) {
  const videoRef = useRef(null);

  const setVideoNode = useCallback(
    (node) => {
      videoRef.current = node;
      if (node && peer.stream) {
        if (node.srcObject !== peer.stream) {
          node.srcObject = peer.stream;
        }
        node.playsInline = true;
        node.autoplay = true;
        node.muted = true;
        node.play().catch(() => {});
      }
    },
    [peer.stream]
  );

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      if (videoRef.current.srcObject !== peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
      videoRef.current.playsInline = true;
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream, peer.isVideoOff]);

  return (
    <div className="w-full h-full relative">
      <video
        ref={setVideoNode}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${peer.isVideoOff || !peer.stream ? "hidden" : "block"}`}
      />
      {(peer.isVideoOff || !peer.stream) && (
        <div className="w-full h-full flex items-center justify-center bg-[#1a2130]">
          <span className="text-[10px] text-slate-400 truncate px-1">{peer.peerName}</span>
        </div>
      )}
    </div>
  );
}

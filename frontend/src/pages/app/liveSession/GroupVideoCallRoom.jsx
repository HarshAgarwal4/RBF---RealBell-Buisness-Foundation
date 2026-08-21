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
  Layout,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Crown,
  Search,
  Settings,
  MoreVertical,
  Check,
  X,
  Copy,
  Share2,
  Sparkles,
  Smile,
  Volume2,
  VolumeX,
  Pin,
  ChevronDown,
  AlertCircle,
  Clock,
  Send,
  UserPlus,
  UserX,
  Radio,
  Eye,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";

export default function GroupVideoCallRoom({ session, socket, onLeave }) {
  const navigate = useNavigate();
  const { user } = useStore();

  const isHost = String(session?.host?._id || session?.host) === String(user?._id || user?.id);

  // Core Room States
  const [isAdmitted, setIsAdmitted] = useState(isHost); // Host admitted immediately
  const [hasRequestedJoin, setHasRequestedJoin] = useState(isHost); // Non-host starts with button to join
  const [requestingJoin, setRequestingJoin] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "speaker" | "sidebar"
  const [pinnedPeerId, setPinnedPeerId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Local Media States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState(null); // null | "participants" | "chat" | "security" | "invite"
  const [participantSearch, setParticipantSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatRecipient, setChatRecipient] = useState("everyone"); // "everyone" | peerId
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);

  // Security Settings (Host)
  const [securitySettings, setSecuritySettings] = useState({
    lockMeeting: false,
    waitingRoomEnabled: true,
    allowScreenShare: true,
    allowChat: true,
    allowUnmuteSelf: true,
    allowRename: true,
  });

  // Active Participants List (Initialized with Host & peers)
  const [peers, setPeers] = useState([]);

  // Waiting Room Lobby (Host sees pending requests)
  const [lobbyUsers, setLobbyUsers] = useState([]);

  // In-Meeting Chat Messages
  const [chatMessages, setChatMessages] = useState([
    {
      id: "msg_welcome",
      senderId: "system",
      senderName: "System",
      text: `Welcome to "${session?.title || "Group Video Meeting"}". Meeting is secured.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // WebRTC Multi-Peer Mesh State & Refs
  const [remoteStreams, setRemoteStreams] = useState({}); // peerId -> MediaStream
  const peerConnectionsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // peerId -> MediaStream
  const pendingIceCandidatesRef = useRef(new Map()); // peerId -> Array of candidates

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const roomContainerRef = useRef(null);
  const chatBottomRef = useRef(null);

  const ICE_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // Ensure local media tracks are available
  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current && localStreamRef.current.getTracks().some((t) => t.readyState === "live")) {
      return localStreamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current && !screenStreamRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Attach to any existing peer connections
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const hasSender = senders.some((s) => s.track && s.track.kind === track.kind);
          if (!hasSender) {
            try {
              pc.addTrack(track, stream);
            } catch (_) {}
          }
        });
      });
      return stream;
    } catch (err) {
      console.warn("Could not access media devices:", err);
      return null;
    }
  }, []);

  // WebRTC Helper: Create or get RTCPeerConnection for a peer (Deterministic Glare-Free Mesh)
  const createPeerConnection = useCallback((targetUserId) => {
    if (!targetUserId) return null;
    const targetId = String(targetUserId);
    const myId = String(user?._id || user?.id || "");
    if (!myId || targetId === myId) return null;

    // Deterministic rule: The peer with lexicographically larger ID initiates offer
    const isInitiator = myId > targetId;

    if (peerConnectionsRef.current.has(targetId)) {
      const existingPc = peerConnectionsRef.current.get(targetId);
      if (existingPc.signalingState !== "closed") {
        const activeVideoStream = screenStreamRef.current || localStreamRef.current;
        if (activeVideoStream) {
          activeVideoStream.getTracks().forEach((track) => {
            const senders = existingPc.getSenders();
            const hasSender = senders.some((s) => s.track && s.track.kind === track.kind);
            if (!hasSender) {
              try {
                existingPc.addTrack(track, activeVideoStream);
              } catch (_) {}
            }
          });
        }
        if (isInitiator && existingPc.signalingState === "stable") {
          sendOffer(targetId, existingPc);
        }
        return existingPc;
      }
    }

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerConnectionsRef.current.set(targetId, pc);

    // 1. Add all local tracks (Audio & Video / Screen share)
    const activeVideoStream = screenStreamRef.current || localStreamRef.current;
    if (activeVideoStream) {
      activeVideoStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, activeVideoStream);
        } catch (e) {
          console.warn("Could not add track to PC:", e);
        }
      });
    }
    // Also ensure audio from localStream is attached if screen sharing
    if (screenStreamRef.current && localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const hasAudio = pc.getSenders().some((s) => s.track && s.track.kind === "audio");
        if (!hasAudio) {
          try {
            pc.addTrack(audioTrack, localStreamRef.current);
          } catch (_) {}
        }
      }
    }

    // 2. ICE Candidate exchange
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && session?._id) {
        socket.emit("live-session:group:signal", {
          sessionId: session._id,
          targetUserId: targetId,
          signalData: {
            type: "candidate",
            candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          },
        });
      }
    };

    // 3. Track received (Remote Peer Audio & Video Stream)
    pc.ontrack = (event) => {
      let stream = remoteStreamsRef.current.get(targetId);
      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current.set(targetId, stream);
      }
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!stream.getTracks().some((t) => t.id === track.id)) {
            stream.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!stream.getTracks().some((t) => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
      }
      const freshStream = new MediaStream(stream.getTracks());
      setRemoteStreams((prev) => ({ ...prev, [targetId]: freshStream }));
    };

    // 4. Clean up on disconnect
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        remoteStreamsRef.current.delete(targetId);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
      }
    };

    // 5. If initiator, send offer
    if (isInitiator) {
      sendOffer(targetId, pc);
    }

    return pc;
  }, [socket, session?._id, user?._id, user?.id]);

  const sendOffer = async (targetId, pc) => {
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      if (socket && session?._id) {
        socket.emit("live-session:group:signal", {
          sessionId: session._id,
          targetUserId: targetId,
          signalData: {
            type: "offer",
            sdp: offer,
          },
        });
      }
    } catch (err) {
      console.error(`Error creating WebRTC offer for peer ${targetId}:`, err);
    }
  };

  // WebRTC Helper: Close peer connection
  const closePeerConnection = useCallback((targetUserId) => {
    if (!targetUserId) return;
    const targetId = String(targetUserId);
    const pc = peerConnectionsRef.current.get(targetId);
    if (pc) {
      try {
        pc.close();
      } catch (_) {}
      peerConnectionsRef.current.delete(targetId);
    }
    remoteStreamsRef.current.delete(targetId);
    pendingIceCandidatesRef.current.delete(targetId);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  }, []);

  // WebRTC Signalling Message Processor
  const handleSignal = useCallback(async ({ senderUserId, signalData }) => {
    if (!senderUserId || !signalData) return;
    const senderId = String(senderUserId);

    try {
      if (signalData.type === "offer") {
        await ensureLocalStream();
        const pc = createPeerConnection(senderId);
        if (!pc) return;

        // If in have-local-offer (collision), rollback or process appropriately
        if (pc.signalingState !== "stable") {
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch (_) {}
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

        // Process any queued candidates
        if (pendingIceCandidatesRef.current.has(senderId)) {
          const candidates = pendingIceCandidatesRef.current.get(senderId) || [];
          for (const cand of candidates) {
            try {
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn("Error adding queued ICE candidate:", e);
            }
          }
          pendingIceCandidatesRef.current.delete(senderId);
        }

        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(answer);

        if (socket && session?._id) {
          socket.emit("live-session:group:signal", {
            sessionId: session._id,
            targetUserId: senderId,
            signalData: {
              type: "answer",
              sdp: answer,
            },
          });
        }
      } else if (signalData.type === "answer") {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

          if (pendingIceCandidatesRef.current.has(senderId)) {
            const candidates = pendingIceCandidatesRef.current.get(senderId) || [];
            for (const cand of candidates) {
              try {
                if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn("Error adding queued ICE candidate:", e);
              }
            }
            pendingIceCandidatesRef.current.delete(senderId);
          }
        }
      } else if (signalData.type === "candidate") {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            if (signalData.candidate) await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (e) {
            console.warn("Error adding ICE candidate:", e);
          }
        } else if (signalData.candidate) {
          const list = pendingIceCandidatesRef.current.get(senderId) || [];
          list.push(signalData.candidate);
          pendingIceCandidatesRef.current.set(senderId, list);
        }
      }
    } catch (err) {
      console.error("Error processing WebRTC signal:", err);
    }
  }, [createPeerConnection, ensureLocalStream, socket, session?._id]);

  // 1. Timer
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 2. Socket Listeners for Group Video Call, Redis Sync & WebRTC Mesh
  useEffect(() => {
    if (!socket || !session?._id) return;

    // Host automatically joins immediately; Participant joins when they click "Enter Meeting"
    const joinRoom = async () => {
      if (!isHost && !hasRequestedJoin) return;
      await ensureLocalStream();
      socket.emit(
        "live-session:group:join",
        {
          sessionId: session._id,
          userInfo: {
            name: user?.name || "Participant",
            avatar: user?.account?.image || "",
            company: user?.account?.designation || "",
            isMuted,
            isVideoOff,
          },
        },
        (res) => {
          if (res?.status === 1) {
            if (res.isHost || res.isAdmitted) {
              setIsAdmitted(true);
              if (res.peers) {
                setPeers(res.peers);
                // Connect WebRTC to all existing peers in meeting
                res.peers.forEach((peer) => {
                  createPeerConnection(peer._id);
                });
              }
              if (res.lobby) setLobbyUsers(res.lobby);
            } else {
              setIsAdmitted(false);
            }
          }
        }
      );
    };

    if (isHost || hasRequestedJoin) {
      joinRoom();
    }
    socket.on("connect", joinRoom);

    // Host receives waiting lobby updates
    const handleLobbyUpdated = (data) => {
      if (data?.lobby) {
        setLobbyUsers(data.lobby);
      }
    };

    // Participant is admitted by host -> Automatically start video call immediately
    const handleAdmitted = async (data) => {
      setIsAdmitted(true);
      await ensureLocalStream();

      if (data?.peers && data.peers.length > 0) {
        setPeers(data.peers);
        // Connect WebRTC to all existing peers immediately
        data.peers.forEach((peer) => {
          createPeerConnection(peer._id);
        });
      }
      socket.emit("live-session:group:join-room", { sessionId: session._id });
      toast.success("🎉 Admitted to meeting! Video call started.");
    };

    // Participant denied entry
    const handleDenied = () => {
      toast.error("The host denied entry to this meeting.");
      setHasRequestedJoin(false);
      if (onLeave) onLeave();
      else navigate("/live_sessions");
    };

    // Participant kicked
    const handleKicked = (data) => {
      toast.error(data?.reason || "You were removed from the meeting by the host.");
      setHasRequestedJoin(false);
      if (onLeave) onLeave();
      else navigate("/live_sessions");
    };

    // Meeting ended by host
    const handleMeetingEnded = (data) => {
      toast.info(data?.reason || "The host has ended the meeting.");
      setHasRequestedJoin(false);
      if (onLeave) onLeave();
      else navigate("/live_sessions");
    };

    // Peer joined active meeting -> Immediately start WebRTC video connection
    const handleUserJoined = async (data) => {
      if (data?.participant) {
        const pId = String(data.participant._id);
        const myId = String(user?._id || user?.id);
        if (pId !== myId) {
          setPeers((prev) => {
            const filtered = prev.filter((p) => String(p._id) !== pId);
            return [...filtered, data.participant];
          });
          await ensureLocalStream();
          // Immediately establish WebRTC connection with the joining participant
          createPeerConnection(pId);
          toast.info(`${data.participant.name || "A participant"} joined the meeting`, { autoClose: 2000 });
        }
      }
    };

    // Peer left active meeting
    const handleUserLeft = (data) => {
      if (data?.userId) {
        const uId = String(data.userId);
        setPeers((prev) => prev.filter((p) => String(p._id) !== uId));
        closePeerConnection(uId);
      }
    };

    // Peer media state update
    const handlePeerMediaState = (data) => {
      if (data?.userId) {
        setPeers((prev) =>
          prev.map((p) =>
            String(p._id) === String(data.userId)
              ? {
                  ...p,
                  ...(data.isMuted !== undefined && { isMuted: data.isMuted }),
                  ...(data.isVideoOff !== undefined && { isVideoOff: data.isVideoOff }),
                  ...(data.isScreenSharing !== undefined && { isScreenSharing: data.isScreenSharing }),
                }
              : p
          )
        );
      }
    };

    // Hand raised update
    const handleHandRaised = (data) => {
      if (data?.userId) {
        const uId = String(data.userId);
        const myId = String(user?._id || user?.id);
        if (uId === myId) {
          setHandRaised(Boolean(data.raised));
        }
        setPeers((prev) =>
          prev.map((p) =>
            String(p._id) === uId ? { ...p, handRaised: Boolean(data.raised) } : p
          )
        );
        if (data.raised && uId !== myId) {
          toast.info(`✋ ${data.userName || "A participant"} raised their hand`);
        }
      }
    };

    // Chat message received
    const handleChatMessage = (data) => {
      if (data) {
        setChatMessages((prev) => [...prev, data]);
        if (activeDrawer !== "chat") {
          setUnreadChatCount((prev) => prev + 1);
        }
      }
    };

    // Floating reaction received
    const handleReaction = (data) => {
      if (data?.emoji) {
        const id = data.id || Date.now() + Math.random();
        setFloatingReactions((prev) => [...prev, { id, emoji: data.emoji, name: data.userName }]);
        setTimeout(() => {
          setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
        }, 2500);
      }
    };

    // Force Muted by Host
    const handleForceMute = (data) => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = false;
      }
      setIsMuted(true);
      toast.warn(data?.reason || "You have been muted by the host.");
      if (socket && session?._id) {
        socket.emit("live-session:group:media-state", {
          sessionId: session._id,
          isMuted: true,
          isVideoOff,
          isScreenSharing,
        });
      }
    };

    // Force Stopped Video by Host
    const handleForceStopVideo = (data) => {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = false;
      }
      setIsVideoOff(true);
      toast.warn(data?.reason || "The host has turned off your camera.");
      if (socket && session?._id) {
        socket.emit("live-session:group:media-state", {
          sessionId: session._id,
          isMuted,
          isVideoOff: true,
          isScreenSharing,
        });
      }
    };

    socket.on("live-session:group:lobby-updated", handleLobbyUpdated);
    socket.on("live-session:group:admitted", handleAdmitted);
    socket.on("live-session:group:denied", handleDenied);
    socket.on("live-session:group:kicked", handleKicked);
    socket.on("live-session:group:ended", handleMeetingEnded);
    socket.on("live-session:group:user-joined", handleUserJoined);
    socket.on("live-session:group:user-left", handleUserLeft);
    socket.on("live-session:group:peer-media-state", handlePeerMediaState);
    socket.on("live-session:group:hand-raised", handleHandRaised);
    socket.on("live-session:group:chat-message", handleChatMessage);
    socket.on("live-session:group:reaction", handleReaction);
    socket.on("live-session:group:force-mute", handleForceMute);
    socket.on("live-session:group:force-stop-video", handleForceStopVideo);
    socket.on("live-session:group:signal", handleSignal);

    // Host periodic lobby & active peers sync
    let syncInterval;
    if (isHost) {
      syncInterval = setInterval(() => {
        socket.emit("live-session:group:get-lobby", { sessionId: session._id }, (res) => {
          if (res?.status === 1) {
            if (Array.isArray(res.lobby)) setLobbyUsers(res.lobby);
            if (Array.isArray(res.peers)) {
              const myId = String(user?._id || user?.id);
              const activePeers = res.peers.filter((p) => String(p._id) !== myId);
              setPeers((prev) => {
                const prevMap = new Map(prev.map((p) => [String(p._id), p]));
                return activePeers.map((p) => {
                  const existing = prevMap.get(String(p._id));
                  if (!existing) return p;
                  return {
                    ...p,
                    handRaised: p.handRaised !== undefined ? p.handRaised : existing.handRaised,
                    isMuted: p.isMuted !== undefined ? p.isMuted : existing.isMuted,
                    isVideoOff: p.isVideoOff !== undefined ? p.isVideoOff : existing.isVideoOff,
                  };
                });
              });
            }
          }
        });
      }, 2500);
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval);
      socket.off("connect", joinRoom);
      socket.off("live-session:group:lobby-updated", handleLobbyUpdated);
      socket.off("live-session:group:admitted", handleAdmitted);
      socket.off("live-session:group:denied", handleDenied);
      socket.off("live-session:group:kicked", handleKicked);
      socket.off("live-session:group:ended", handleMeetingEnded);
      socket.off("live-session:group:user-joined", handleUserJoined);
      socket.off("live-session:group:user-left", handleUserLeft);
      socket.off("live-session:group:peer-media-state", handlePeerMediaState);
      socket.off("live-session:group:hand-raised", handleHandRaised);
      socket.off("live-session:group:chat-message", handleChatMessage);
      socket.off("live-session:group:reaction", handleReaction);
      socket.off("live-session:group:force-mute", handleForceMute);
      socket.off("live-session:group:force-stop-video", handleForceStopVideo);
      socket.off("live-session:group:signal", handleSignal);

      if (isHost || hasRequestedJoin) {
        socket.emit("live-session:group:leave", { sessionId: session._id });
      }

      // Close all peer connections on unmount
      peerConnectionsRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch (_) {}
      });
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      pendingIceCandidatesRef.current.clear();

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [socket, session?._id, isHost, hasRequestedJoin, createPeerConnection, closePeerConnection, handleSignal, user?._id, user?.id]);

  // Participant clicks "Enter Meeting" / "Ask to Join"
  const handleRequestJoin = () => {
    if (!socket || !session?._id) {
      toast.error("Connecting to server, please wait a moment...");
      return;
    }
    setRequestingJoin(true);
    setHasRequestedJoin(true);
    socket.emit(
      "live-session:group:join",
      {
        sessionId: session._id,
        userInfo: {
          name: user?.name || "Participant",
          avatar: user?.account?.image || "",
          company: user?.account?.designation || "",
          isMuted,
          isVideoOff,
        },
      },
      (res) => {
        setRequestingJoin(false);
        if (res?.status === 1) {
          if (res.isHost || res.isAdmitted) {
            setIsAdmitted(true);
            if (res.peers) setPeers(res.peers);
            if (res.lobby) setLobbyUsers(res.lobby);
          } else {
            setIsAdmitted(false);
            toast.info("Request sent! Waiting for host to admit you...");
          }
        } else {
          toast.error(res?.msg || "Could not join waiting room");
        }
      }
    );
  };

  const handleCancelJoinRequest = () => {
    setHasRequestedJoin(false);
    if (socket && session?._id) {
      socket.emit("live-session:group:leave", { sessionId: session._id });
    }
    toast.info("Cancelled join request");
  };

  // 3. Initialize Local Camera / Mic Preview
  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Could not access media devices automatically:", err);
      }
    }
    startCamera();
    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Ensure local video element has stream attached whenever admission changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isAdmitted]);

  // 4. Media Controls
  const toggleMute = () => {
    const nextMute = !isMuted;
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !nextMute;
      }
    }
    setIsMuted(nextMute);
    if (socket && session?._id) {
      socket.emit("live-session:group:media-state", {
        sessionId: session._id,
        isMuted: nextMute,
        isVideoOff,
        isScreenSharing,
      });
    }
    toast.info(nextMute ? "Microphone muted" : "Microphone unmuted", { autoClose: 1500 });
  };

  const toggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !nextVideoOff;
      }
    }
    setIsVideoOff(nextVideoOff);
    if (socket && session?._id) {
      socket.emit("live-session:group:media-state", {
        sessionId: session._id,
        isMuted,
        isVideoOff: nextVideoOff,
        isScreenSharing,
      });
    }
    toast.info(nextVideoOff ? "Camera turned off" : "Camera turned on", { autoClose: 1500 });
  };

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore camera track to all peers
    if (localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      if (camTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(camTrack).catch((err) => console.warn("replaceTrack error:", err));
          }
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    if (socket && session?._id) {
      socket.emit("live-session:group:media-state", {
        sessionId: session._id,
        isMuted,
        isVideoOff,
        isScreenSharing: false,
      });
    }
    toast.info("Screen sharing ended");
  }, [socket, session?._id, isMuted, isVideoOff]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) return;

      // Replace video track with screen track across all WebRTC connections
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack).catch((err) => console.warn("replaceTrack error:", err));
        } else {
          try {
            pc.addTrack(screenTrack, screenStream);
          } catch (_) {}
        }
      });

      // Show screen share in local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      if (socket && session?._id) {
        socket.emit("live-session:group:media-state", {
          sessionId: session._id,
          isMuted,
          isVideoOff,
          isScreenSharing: true,
        });
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      toast.success("🖥️ Screen sharing started");
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  const toggleRaiseHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (socket && session?._id) {
      socket.emit("live-session:group:raise-hand", {
        sessionId: session._id,
        raised: nextState,
      });
    }
    toast.info(nextState ? "✋ You raised your hand" : "Hand lowered", { autoClose: 1500 });
  };

  const handleSendReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, name: "You" }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
    if (socket && session?._id) {
      socket.emit("live-session:group:reaction", {
        sessionId: session._id,
        emoji,
      });
    }
    setShowReactions(false);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (socket && session?._id) {
      socket.emit("live-session:group:chat", {
        sessionId: session._id,
        text: chatInput.trim(),
      });
    }
    setChatInput("");
  };

  // Host Actions
  const handleAdmitLobbyUser = async (participantId) => {
    if (!socket || !session?._id || !participantId) return;
    const pId = String(participantId);
    await ensureLocalStream();
    const candidate = lobbyUsers.find((u) => String(u._id) === pId);
    if (candidate) {
      setPeers((prev) => {
        const filtered = prev.filter((p) => String(p._id) !== pId);
        return [...filtered, { ...candidate, isMuted: false, isVideoOff: false }];
      });
      // Start video call connection immediately with admitted participant
      createPeerConnection(pId);
    }
    socket.emit("live-session:group:admit", { sessionId: session._id, participantId: pId }, (res) => {
      if (res?.status === 1) {
        if (res.lobby) setLobbyUsers(res.lobby);
        if (res.peers) {
          const myId = String(user?._id || user?.id);
          const otherPeers = res.peers.filter((p) => String(p._id) !== myId);
          setPeers(otherPeers);
          otherPeers.forEach((p) => createPeerConnection(p._id));
        }
      }
    });
    setLobbyUsers((prev) => prev.filter((u) => String(u._id) !== pId));
    toast.success("Admitted participant - video call starting...");
  };

  const handleAdmitAll = async () => {
    if (!socket || !session?._id) return;
    await ensureLocalStream();
    lobbyUsers.forEach((u) => {
      createPeerConnection(u._id);
    });
    setPeers((prev) => [...prev, ...lobbyUsers.map((u) => ({ ...u, isMuted: false, isVideoOff: false }))]);
    setLobbyUsers([]);
    socket.emit("live-session:group:admit-all", { sessionId: session._id });
    toast.success("Admitted all participants - video call starting...");
  };

  const handleDenyLobbyUser = (participantId) => {
    if (!socket || !session?._id || !participantId) return;
    const pId = String(participantId);
    socket.emit("live-session:group:deny", { sessionId: session._id, participantId: pId });
    setLobbyUsers((prev) => prev.filter((u) => String(u._id) !== pId));
    toast.info("Participant denied entry");
  };

  const handleKickParticipant = (peerId) => {
    if (!window.confirm("Are you sure you want to remove this participant?")) return;
    if (!socket || !session?._id || !peerId) return;
    const pId = String(peerId);
    socket.emit("live-session:group:kick", { sessionId: session._id, participantId: pId });
    setPeers((prev) => prev.filter((p) => String(p._id) !== pId));
    closePeerConnection(pId);
    toast.error("Participant removed from meeting");
  };

  const handleMuteParticipant = (peerId) => {
    if (!socket || !session?._id || !peerId) return;
    const pId = String(peerId);
    socket.emit("live-session:group:host-mute-peer", {
      sessionId: session._id,
      targetUserId: pId,
    });
    setPeers((prev) =>
      prev.map((p) => (String(p._id) === pId ? { ...p, isMuted: true } : p))
    );
    toast.info("Mute command sent to participant");
  };

  const handleStopParticipantVideo = (peerId) => {
    if (!socket || !session?._id || !peerId) return;
    const pId = String(peerId);
    socket.emit("live-session:group:host-stop-video-peer", {
      sessionId: session._id,
      targetUserId: pId,
    });
    setPeers((prev) =>
      prev.map((p) => (String(p._id) === pId ? { ...p, isVideoOff: true } : p))
    );
    toast.info("Stop camera command sent to participant");
  };

  const handleMuteAll = () => {
    if (socket && session?._id) {
      socket.emit("live-session:group:host-mute-all", { sessionId: session._id });
    }
    setPeers((prev) => prev.map((p) => ({ ...p, isMuted: true })));
    toast.info("All participants muted");
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Meeting link copied to clipboard!");
  };

  // Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      roomContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Combined Participants
  const allParticipantsCount = 1 + peers.length;
  const filteredPeers = peers.filter((p) =>
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────
  // 1. PARTICIPANT WAITING ROOM / PRE-JOIN SCREEN (NON-HOST BEFORE ADMISSION)
  // ─────────────────────────────────────────────────────────────
  if (!isAdmitted) {
    return (
      <div className="fixed inset-0 bg-[#0B0F17] text-white flex flex-col items-center justify-center p-4 z-50 overflow-hidden font-sans">
        {/* Background gradient glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#8E1B2E]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[#161D2B]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#8E1B2E]/20 text-[#8E1B2E] border border-[#8E1B2E]/30">
              {hasRequestedJoin ? "Waiting Room" : "Ready to Join?"}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2.5">
              {session?.title || "Group Video Meeting"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hosted by <span className="text-white font-semibold">{session?.host?.name || "Host"}</span>
            </p>
          </div>

          {/* Camera / Mic test preview */}
          <div className="relative w-full aspect-video bg-black/60 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center group shadow-inner">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? "hidden" : "block"}`}
            />
            {isVideoOff && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-[#8E1B2E] text-white font-black text-xl flex items-center justify-center shadow-lg">
                  {(user?.name || "U").substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-slate-400 font-semibold">Camera is off</span>
              </div>
            )}

            {/* In-preview controls */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-2.5 rounded-xl transition cursor-pointer ${
                  isMuted ? "bg-rose-600 text-white" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-2.5 rounded-xl transition cursor-pointer ${
                  isVideoOff ? "bg-rose-600 text-white" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
                }`}
                title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
              </button>
            </div>
          </div>

          {/* User info display */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#8E1B2E] text-white flex items-center justify-center font-bold text-xs">
                {(user?.name || "U").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{user?.name || "Participant"}</div>
                <div className="text-[10px] text-slate-400">Joining as attendee</div>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </div>
          </div>

          {/* Action button: Pre-join vs In Waiting Room */}
          {!hasRequestedJoin ? (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleRequestJoin}
                disabled={requestingJoin}
                className="w-full py-3.5 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#8E1B2E]/30 transition active:scale-98 cursor-pointer"
              >
                <Video size={18} />
                <span>{requestingJoin ? "Entering..." : "Enter Meeting"}</span>
              </button>

              <button
                type="button"
                onClick={() => onLeave ? onLeave() : navigate("/live_sessions")}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs transition cursor-pointer"
              >
                Back to Sessions
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Clock size={14} className="animate-spin" />
                  Waiting for host to admit you...
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  We've notified the host. You will automatically enter the meeting as soon as they admit you.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelJoinRequest}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MAIN ACTIVE GROUP VIDEO CALL ROOM (ZOOM-STYLE)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={roomContainerRef}
      className="fixed inset-0 bg-[#0B0F17] text-white flex flex-col z-50 overflow-hidden font-sans select-none"
    >
      {/* ── TOP NAV BAR ── */}
      <header className="h-14 bg-[#111723]/95 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-extrabold text-white tracking-wide truncate max-w-[200px] sm:max-w-xs">
              {session?.title || "Group Video Meeting"}
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8E1B2E]/20 text-[#8E1B2E] border border-[#8E1B2E]/30">
            <Radio size={10} className="animate-pulse" /> LIVE
          </span>

          <div className="hidden md:flex items-center gap-1 text-slate-400 text-xs font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Clock size={12} className="text-slate-400" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Center: Security Badge & Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveDrawer(activeDrawer === "security" ? null : "security")}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
            title="Meeting Security Settings"
          >
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">End-to-End Encrypted</span>
          </button>
        </div>

        {/* Right: Layout & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === "grid" ? "bg-[#8E1B2E] text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid size={14} />
              <span className="hidden md:inline text-[11px]">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("speaker")}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === "speaker" ? "bg-[#8E1B2E] text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
              title="Speaker View"
            >
              <Layout size={14} />
              <span className="hidden md:inline text-[11px]">Speaker</span>
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── MAIN BODY (VIDEO TILES + OPTIONAL DRAWERS) ── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Floating Reactions on Canvas */}
        <div className="absolute bottom-20 left-6 sm:left-10 pointer-events-none z-50 flex flex-col gap-2">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-2xl animate-bounce"
            >
              <span className="text-2xl sm:text-3xl">{r.emoji}</span>
              {r.name && <span className="text-xs font-extrabold text-white pr-1">{r.name}</span>}
            </div>
          ))}
        </div>

        {/* Floating Waiting Room Notification for Host */}
        {isHost && lobbyUsers.length > 0 && activeDrawer !== "participants" && (
          <div className="absolute top-4 right-4 z-40 bg-amber-500/90 hover:bg-amber-500 text-black font-extrabold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-amber-300 animate-slide-in cursor-pointer">
            <Clock size={16} />
            <span className="text-xs">{lobbyUsers.length} participant(s) in waiting room</span>
            <button
              onClick={() => setActiveDrawer("participants")}
              className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-bold hover:bg-black/80 transition"
            >
              View
            </button>
            <button
              onClick={handleAdmitAll}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold hover:bg-emerald-800 transition"
            >
              Admit All
            </button>
          </div>
        )}

        {/* ── VIDEO CANVAS ── */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col items-center justify-center bg-[#070A10]">
          {viewMode === "grid" ? (
            /* ── GRID VIEW ── */
            <div
              className={`w-full h-full grid gap-3 sm:gap-4 max-w-7xl mx-auto items-center justify-center ${
                allParticipantsCount === 1
                  ? "grid-cols-1 max-w-3xl"
                  : allParticipantsCount === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : allParticipantsCount <= 4
                  ? "grid-cols-2"
                  : allParticipantsCount <= 6
                  ? "grid-cols-2 md:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {/* Tile: Self (Local) */}
              <div className="relative w-full h-full min-h-[180px] max-h-[70vh] aspect-video bg-[#161D2B] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-xl group flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${isScreenSharing ? "object-contain bg-black" : "object-cover -scale-x-100"} ${isVideoOff && !isScreenSharing ? "hidden" : "block"}`}
                />
                {isVideoOff && !isScreenSharing && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8E1B2E] text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg">
                      {(user?.name || "You").substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Camera is off</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-bold text-white flex items-center gap-2 border border-white/10 z-10">
                  {isMuted ? <MicOff size={13} className="text-rose-400" /> : <Mic size={13} className="text-emerald-400" />}
                  <span>You {isHost ? "(Host)" : ""}</span>
                  {isHost && <Crown size={12} className="text-amber-400" />}
                </div>

                {isScreenSharing && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-blue-600/90 text-white text-xs font-black flex items-center gap-1.5 shadow-lg z-10">
                    <MonitorUp size={14} /> Screen Sharing
                  </div>
                )}

                {handRaised && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-amber-500/90 text-black text-xs font-black flex items-center gap-1 shadow-lg animate-bounce z-10">
                    <Hand size={14} /> Hand Raised
                  </div>
                )}
              </div>

              {/* Tiles: Remote Peers (WebRTC Connected) */}
              {peers.map((peer) => (
                <GroupPeerTile
                  key={peer._id}
                  peer={peer}
                  stream={remoteStreams[String(peer._id)]}
                  isHost={isHost}
                  onMute={handleMuteParticipant}
                  onStopVideo={handleStopParticipantVideo}
                  onKick={handleKickParticipant}
                />
              ))}
            </div>
          ) : (
            /* ── SPEAKER VIEW ── */
            <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-3">
              {/* Main Spotlight Video */}
              <div className="flex-1 w-full bg-[#161D2B] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? "hidden" : "block"}`}
                />
                {isVideoOff && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-[#8E1B2E] text-white flex items-center justify-center text-3xl font-black shadow-2xl">
                      {(user?.name || "You").substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-slate-400">Active Speaker</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-sm font-extrabold text-white flex items-center gap-2 border border-white/10">
                  {isMuted ? <MicOff size={15} className="text-rose-400" /> : <Mic size={15} className="text-emerald-400" />}
                  <span>You {isHost ? "(Host)" : ""}</span>
                  {isHost && <Crown size={14} className="text-amber-400" />}
                </div>
              </div>

              {/* Bottom Thumbnail Strip */}
              {peers.length > 0 && (
                <div className="h-28 flex items-center gap-3 overflow-x-auto p-1 scrollbar-thin">
                  {peers.map((peer) => (
                    <GroupPeerThumbnail
                      key={peer._id}
                      peer={peer}
                      stream={remoteStreams[String(peer._id)]}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── PARTICIPANTS & WAITING ROOM DRAWER ── */}
        {activeDrawer === "participants" && (
          <aside className="w-80 sm:w-96 bg-[#111723] border-l border-white/10 flex flex-col z-40 animate-slide-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Users size={16} className="text-[#8E1B2E]" />
                Participants ({allParticipantsCount})
              </h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#8E1B2E]"
                />
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-4">
              {/* Host Waiting Room Section */}
              {isHost && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} />
                      Waiting Room ({lobbyUsers.length})
                    </span>
                    {lobbyUsers.length > 0 && (
                      <button
                        onClick={handleAdmitAll}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Check size={12} /> Admit All
                      </button>
                    )}
                  </div>

                  {lobbyUsers.length === 0 ? (
                    <div className="py-3 px-2 text-center text-[11px] text-slate-400 bg-white/5 rounded-xl border border-white/5">
                      No participants currently in waiting room.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lobbyUsers.map((item) => (
                        <div
                          key={item._id}
                          className="p-2.5 rounded-xl bg-[#161D2B] border border-amber-500/30 flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {(item.name || "U").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{item.name}</div>
                              <div className="text-[10px] text-amber-300 font-medium truncate">Waiting in lobby</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAdmitLobbyUser(item._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Check size={13} /> Admit
                            </button>
                            <button
                              onClick={() => handleDenyLobbyUser(item._id)}
                              className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-700 text-white transition cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* In-Meeting List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  In Meeting ({allParticipantsCount})
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
                {filteredPeers.map((peer) => (
                  <div
                    key={peer._id}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between border border-white/5 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 relative">
                        {(peer.name || "U").substring(0, 2).toUpperCase()}
                        {peer.handRaised && (
                          <span className="absolute -top-1 -right-1 text-xs">✋</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{peer.name}</span>
                          {peer.handRaised && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-extrabold border border-amber-500/30 animate-pulse">
                              ✋ Hand Raised
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Participant</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      {peer.isMuted ? <MicOff size={14} className="text-rose-400" /> : <Mic size={14} className="text-emerald-400" />}
                      {peer.isVideoOff ? <VideoOff size={14} className="text-rose-400" /> : <Video size={14} />}

                      {/* Host Actions Dropdown/Buttons */}
                      {isHost && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleMuteParticipant(peer._id)}
                            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Mute Participant"
                          >
                            <VolumeX size={13} />
                          </button>
                          <button
                            onClick={() => handleStopParticipantVideo(peer._id)}
                            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Stop Participant Camera"
                          >
                            <VideoOff size={13} />
                          </button>
                          <button
                            onClick={() => handleKickParticipant(peer._id)}
                            className="p-1 rounded-md hover:bg-rose-600/30 text-rose-400 hover:text-rose-200 cursor-pointer"
                            title="Remove Participant"
                          >
                            <UserX size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            {isHost && (
              <div className="p-3 border-t border-white/10 flex items-center justify-between gap-2 bg-[#0B0F17]">
                <button
                  onClick={handleMuteAll}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <VolumeX size={14} /> Mute All
                </button>
                <button
                  onClick={copyMeetingLink}
                  className="flex-1 py-2 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Share2 size={14} /> Invite Link
                </button>
              </div>
            )}
          </aside>
        )}

        {/* ── CHAT DRAWER ── */}
        {activeDrawer === "chat" && (
          <aside className="w-80 sm:w-96 bg-[#111723] border-l border-white/10 flex flex-col z-40 animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
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

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === user?._id || msg.senderId === "self";
                const isSys = msg.senderId === "system";

                if (isSys) {
                  return (
                    <div key={msg.id} className="p-2 rounded-xl bg-white/5 border border-white/5 text-center text-[11px] text-slate-400 font-medium">
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">{msg.senderName}</span>
                      <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-[#8E1B2E] text-white rounded-tr-xs shadow-md"
                          : "bg-white/10 text-slate-100 rounded-tl-xs border border-white/5"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-[#0B0F17]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#8E1B2E]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 rounded-xl bg-[#8E1B2E] hover:bg-[#721524] disabled:opacity-40 text-white transition cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </aside>
        )}

        {/* ── SECURITY DRAWER (HOST ONLY) ── */}
        {activeDrawer === "security" && (
          <aside className="w-80 sm:w-96 bg-[#111723] border-l border-white/10 flex flex-col z-40 animate-slide-in">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                Security & Room Settings
              </h3>
              <button
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Lock & Access
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10">
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Lock Meeting</div>
                      <div className="text-[10px] text-slate-400">Prevent new participants from joining</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securitySettings.lockMeeting}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({ ...prev, lockMeeting: e.target.checked }))
                    }
                    className="accent-[#8E1B2E] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10">
                  <div className="flex items-center gap-2.5">
                    <Clock size={15} className="text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Enable Waiting Room</div>
                      <div className="text-[10px] text-slate-400">Hold participants until host admits</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={securitySettings.waitingRoomEnabled}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({ ...prev, waitingRoomEnabled: e.target.checked }))
                    }
                    className="accent-[#8E1B2E] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Allow Participants To:
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10">
                  <span className="text-xs font-medium text-slate-200">Share Screen</span>
                  <input
                    type="checkbox"
                    checked={securitySettings.allowScreenShare}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({ ...prev, allowScreenShare: e.target.checked }))
                    }
                    className="accent-[#8E1B2E] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10">
                  <span className="text-xs font-medium text-slate-200">Chat with Everyone</span>
                  <input
                    type="checkbox"
                    checked={securitySettings.allowChat}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({ ...prev, allowChat: e.target.checked }))
                    }
                    className="accent-[#8E1B2E] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10">
                  <span className="text-xs font-medium text-slate-200">Unmute Themselves</span>
                  <input
                    type="checkbox"
                    checked={securitySettings.allowUnmuteSelf}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({ ...prev, allowUnmuteSelf: e.target.checked }))
                    }
                    className="accent-[#8E1B2E] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── BOTTOM DOCK CONTROLS (ZOOM-STYLE) ── */}
      <footer className="h-20 bg-[#111723]/95 backdrop-blur-xl border-t border-white/10 px-4 sm:px-8 flex items-center justify-between z-30 shrink-0">
        {/* Left: Audio & Video controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Button + Dropdown */}
          <div className="flex items-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 p-1">
            <button
              onClick={toggleMute}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isMuted ? "bg-rose-600/90 text-white" : "text-slate-200 hover:text-white"
              }`}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} className="text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mute"}</span>
            </button>
          </div>

          {/* Video Button + Dropdown */}
          <div className="flex items-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 p-1">
            <button
              onClick={toggleVideo}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isVideoOff ? "bg-rose-600/90 text-white" : "text-slate-200 hover:text-white"
              }`}
            >
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} className="text-emerald-400" />}
              <span className="hidden sm:inline">{isVideoOff ? "Start Video" : "Stop Video"}</span>
            </button>
          </div>
        </div>

        {/* Center: Meeting Actions (Security, Participants, Chat, Share Screen, Raise Hand) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Security (Host only) */}
          {isHost && (
            <button
              onClick={() => setActiveDrawer(activeDrawer === "security" ? null : "security")}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition cursor-pointer ${
                activeDrawer === "security" ? "bg-[#8E1B2E] text-white" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Shield size={18} />
              <span className="text-[10px] font-bold hidden md:inline">Security</span>
            </button>
          )}

          {/* Participants */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "participants" ? null : "participants")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition cursor-pointer relative ${
              activeDrawer === "participants" ? "bg-[#8E1B2E] text-white" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Users size={18} />
            <span className="text-[10px] font-bold hidden md:inline">Participants</span>
            {lobbyUsers.length > 0 && isHost && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                {lobbyUsers.length}
              </span>
            )}
          </button>

          {/* Chat */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === "chat" ? null : "chat")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition cursor-pointer relative ${
              activeDrawer === "chat" ? "bg-[#8E1B2E] text-white" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-[10px] font-bold hidden md:inline">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#8E1B2E] text-white text-[9px] font-black flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Share Screen */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition cursor-pointer ${
              isScreenSharing ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            {isScreenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
            <span className="text-[10px] font-bold hidden md:inline">
              {isScreenSharing ? "Stop Sharing" : "Share"}
            </span>
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleRaiseHand}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition cursor-pointer ${
              handRaised ? "bg-amber-500 text-black" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Hand size={18} />
            <span className="text-[10px] font-bold hidden md:inline">
              {handRaised ? "Hand Up" : "Raise Hand"}
            </span>
          </button>

          {/* Reactions Flyout */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-slate-300 hover:bg-white/10 transition cursor-pointer"
            >
              <Smile size={18} />
              <span className="text-[10px] font-bold hidden md:inline">Reactions</span>
            </button>

            {showReactions && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#161D2B] border border-white/15 p-2 rounded-2xl shadow-2xl flex items-center gap-2 z-50 animate-scale-in">
                {["👏", "👍", "❤️", "😂", "😮", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="text-2xl hover:scale-125 transition p-1.5 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Leave / End Meeting Button */}
        <div>
          <button
            onClick={() => setShowEndModal(true)}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/30 transition active:scale-95 cursor-pointer"
          >
            <PhoneOff size={16} />
            <span>{isHost ? "End" : "Leave"}</span>
          </button>
        </div>
      </footer>

      {/* ── END / LEAVE MEETING CONFIRMATION MODAL ── */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="max-w-sm w-full bg-[#161D2B] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto">
              <PhoneOff size={22} />
            </div>

            <div>
              <h4 className="text-lg font-black text-white">
                {isHost ? "End Meeting" : "Leave Meeting"}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {isHost
                  ? "Do you want to end the meeting for all participants or just leave?"
                  : "Are you sure you want to leave this meeting?"}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {isHost && (
                <button
                  onClick={() => {
                    if (socket && session?._id) {
                      socket.emit("live-session:group:end", { sessionId: session._id });
                    }
                    toast.info("Meeting ended for all");
                    if (onLeave) onLeave();
                    else navigate("/live_sessions");
                  }}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition cursor-pointer"
                >
                  End Meeting for All
                </button>
              )}

              <button
                onClick={() => {
                  toast.info("You left the meeting");
                  if (onLeave) onLeave();
                  else navigate("/live_sessions");
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition cursor-pointer"
              >
                Leave Meeting
              </button>

              <button
                onClick={() => setShowEndModal(false)}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupPeerTile({
  peer,
  stream,
  isHost,
  onMute,
  onStopVideo,
  onKick,
}) {
  const videoRef = useRef(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});

      const updateTrackStatus = () => {
        const vTracks = stream.getVideoTracks();
        setHasVideoTrack(vTracks.length > 0 && vTracks.some((t) => t.readyState === "live" && t.enabled));
      };

      updateTrackStatus();
      stream.onaddtrack = updateTrackStatus;
      stream.onremovetrack = updateTrackStatus;
    } else {
      videoRef.current.srcObject = null;
      setHasVideoTrack(false);
    }
  }, [stream]);

  const hasVideo = (!peer.isVideoOff || peer.isScreenSharing) && (hasVideoTrack || Boolean(stream?.getVideoTracks?.()?.length));

  return (
    <div className="relative w-full h-full min-h-[180px] max-h-[70vh] aspect-video bg-[#161D2B] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-xl group flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full ${peer.isScreenSharing ? "object-contain bg-black" : "object-cover -scale-x-100"} ${hasVideo ? "block" : "hidden"}`}
      />

      {!hasVideo && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1E293B] border-2 border-white/10 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg">
            {(peer.name || "U").substring(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {peer.isVideoOff ? "Camera is off" : "Connecting video..."}
          </span>
        </div>
      )}

      {/* Badges */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-bold text-white flex items-center gap-2 border border-white/10 z-10">
        {peer.isMuted ? <MicOff size={13} className="text-rose-400" /> : <Mic size={13} className="text-emerald-400" />}
        <span>{peer.name || "Participant"}</span>
        {peer.isHost && <Crown size={12} className="text-amber-400" />}
      </div>

      {peer.isScreenSharing && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-blue-600/90 text-white text-xs font-black flex items-center gap-1.5 shadow-lg z-10">
          <MonitorUp size={14} /> Screen Sharing
        </div>
      )}

      {peer.handRaised && (
        <div className={`absolute ${peer.isScreenSharing ? "top-11" : "top-3"} left-3 px-2.5 py-1 rounded-xl bg-amber-500/90 text-black text-xs font-black flex items-center gap-1 shadow-lg animate-bounce z-10`}>
          <Hand size={14} /> Hand Raised
        </div>
      )}

      {/* Host Quick Actions Hover */}
      {isHost && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-20">
          <button
            type="button"
            onClick={() => onMute(peer._id)}
            className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title={peer.isMuted ? "Unmute" : "Mute"}
          >
            {peer.isMuted ? <MicOff size={13} className="text-rose-400" /> : <Mic size={13} />}
          </button>
          <button
            type="button"
            onClick={() => onStopVideo(peer._id)}
            className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title={peer.isVideoOff ? "Ask to start video" : "Stop Video"}
          >
            {peer.isVideoOff ? <VideoOff size={13} className="text-rose-400" /> : <Video size={13} />}
          </button>
          <button
            type="button"
            onClick={() => onKick(peer._id)}
            className="p-1.5 rounded-lg hover:bg-rose-600/40 text-rose-400 hover:text-rose-200 transition cursor-pointer"
            title="Remove Participant"
          >
            <UserX size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function GroupPeerThumbnail({ peer, stream }) {
  const videoRef = useRef(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});

      const updateTrackStatus = () => {
        const vTracks = stream.getVideoTracks();
        setHasVideoTrack(vTracks.length > 0 && vTracks.some((t) => t.readyState === "live" && t.enabled));
      };

      updateTrackStatus();
      stream.onaddtrack = updateTrackStatus;
      stream.onremovetrack = updateTrackStatus;
    } else {
      videoRef.current.srcObject = null;
      setHasVideoTrack(false);
    }
  }, [stream]);

  const hasVideo = (!peer.isVideoOff || peer.isScreenSharing) && (hasVideoTrack || Boolean(stream?.getVideoTracks?.()?.length));

  return (
    <div className="h-full aspect-video bg-[#1E293B] rounded-2xl border border-white/10 relative overflow-hidden shrink-0 flex items-center justify-center shadow-md cursor-pointer hover:border-[#8E1B2E]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full ${peer.isScreenSharing ? "object-contain bg-black" : "object-cover -scale-x-100"} ${hasVideo ? "block" : "hidden"}`}
      />
      {!hasVideo && (
        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
          {(peer.name || "U").substring(0, 2).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/70 text-[10px] font-bold text-white truncate max-w-[90%] z-10">
        {peer.name || "Participant"}
      </div>
    </div>
  );
}

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useStore } from "../zustand/store";

const VideoCallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const VideoCallProvider = ({ children }) => {
  const user = useStore((state) => state.user);
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";

  const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callDetails, setCallDetails] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerMediaState, setPeerMediaState] = useState({
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  });
  const [callDuration, setCallDuration] = useState(0);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const timerRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  const [localStreamState, setLocalStreamState] = useState(null);
  const [remoteStreamState, setRemoteStreamState] = useState(null);

  // Sound effects using Web Audio API
  const playRingtone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 800);
    } catch {
      // AudioContext fallback ignored
    }
  };

  // Socket Connection Management
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("webrtc:incoming-call", ({ callId, callerId, callerName, callerAvatar, offer, callType }) => {
      if (callStatus !== "idle") {
        socket.emit("webrtc:decline-call", { callId, callerId });
        return;
      }
      playRingtone();
      setCallDetails({
        callId,
        peerId: callerId,
        peerName: callerName,
        peerAvatar: callerAvatar,
        offer,
        callType,
        isCaller: false,
      });
      setCallStatus("incoming");
    });

    socket.on("webrtc:call-answered", async ({ answer }) => {
      try {
        if (pcRef.current && answer) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          // Process any queued ICE candidates
          while (pendingIceCandidatesRef.current.length > 0) {
            const cand = pendingIceCandidatesRef.current.shift();
            await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
          }
        }
        setCallStatus("connected");
        startTimer();
      } catch (err) {
        console.error("Error setting remote description on call answer:", err);
        toast.error("Failed to establish video connection.");
        cleanupCall();
      }
    });

    socket.on("webrtc:call-declined", () => {
      toast.info("Call was declined.");
      cleanupCall();
    });

    socket.on("webrtc:call-busy", () => {
      toast.info("User is currently on another call.");
      cleanupCall();
    });

    socket.on("webrtc:ice-candidate", async ({ candidate }) => {
      if (!candidate) return;
      try {
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    socket.on("webrtc:media-state", ({ isMuted, isVideoOff, isScreenSharing }) => {
      setPeerMediaState({ isMuted, isVideoOff, isScreenSharing });
    });

    socket.on("webrtc:call-ended", ({ reason }) => {
      if (reason === "disconnected") {
        toast.info("Peer disconnected.");
      } else {
        toast.info("Call ended.");
      }
      cleanupCall();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, backendUrl]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const createPeerConnection = (targetUserId, callId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc:ice-candidate", {
          targetId: targetUserId,
          candidate: event.candidate,
          callId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStreamState(event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        toast.warn("Call connection lost.");
        cleanupCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const acquireLocalMedia = async (audioOnly = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !audioOnly,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStreamState(stream);
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      return stream;
    } catch (err) {
      console.error("Media permission error:", err);
      toast.error("Microphone/Camera access required for call.");
      throw err;
    }
  };

  const initiateCall = async (peerProfile, callType = "video") => {
    const peerId = peerProfile?._id || peerProfile?.profile?._id;
    if (!peerId) {
      toast.error("Invalid call recipient.");
      return;
    }

    const peerName =
      peerProfile?.name ||
      peerProfile?.company_name ||
      peerProfile?.profile?.company_name ||
      peerProfile?.profile?.name ||
      "User";

    const peerAvatar =
      peerProfile?.account?.image ||
      peerProfile?.profile?.account?.image ||
      "";

    try {
      const stream = await acquireLocalMedia(callType === "audio");
      setCallDetails({
        peerId: String(peerId),
        peerName,
        peerAvatar,
        callType,
        isCaller: true,
      });
      setCallStatus("calling");

      const pc = createPeerConnection(String(peerId), null);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit(
        "webrtc:call-user",
        {
          targetId: String(peerId),
          offer,
          callType,
        },
        (res) => {
          if (res?.status === 1) {
            setCallDetails((prev) => ({ ...prev, callId: res.callId }));
          } else {
            toast.error(res?.msg || "Failed to connect call.");
            cleanupCall();
          }
        }
      );
    } catch (err) {
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!callDetails?.offer || !callDetails?.peerId || !callDetails?.callId) return;

    try {
      const stream = await acquireLocalMedia(callDetails.callType === "audio");
      const pc = createPeerConnection(callDetails.peerId, callDetails.callId);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callDetails.offer));

      // Add any ice candidates received before remote description was set
      while (pendingIceCandidatesRef.current.length > 0) {
        const cand = pendingIceCandidatesRef.current.shift();
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit(
        "webrtc:answer-call",
        {
          callId: callDetails.callId,
          callerId: callDetails.peerId,
          answer,
        },
        (res) => {
          if (res?.status === 1) {
            setCallStatus("connected");
            startTimer();
          } else {
            toast.error(res?.msg || "Failed to answer call.");
            cleanupCall();
          }
        }
      );
    } catch (err) {
      console.error("Error answering call:", err);
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (callDetails?.callId && callDetails?.peerId) {
      socketRef.current?.emit("webrtc:decline-call", {
        callId: callDetails.callId,
        callerId: callDetails.peerId,
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (callDetails?.peerId) {
      socketRef.current?.emit("webrtc:end-call", {
        targetId: callDetails.peerId,
        callId: callDetails.callId,
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    remoteStreamRef.current = null;
    cameraTrackRef.current = null;
    pendingIceCandidatesRef.current = [];

    setLocalStreamState(null);
    setRemoteStreamState(null);
    setCallStatus("idle");
    setCallDetails(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setPeerMediaState({ isMuted: false, isVideoOff: false, isScreenSharing: false });
    setCallDuration(0);
  };

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
      // Revert back to camera track
      try {
        const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (videoSender && cameraTrackRef.current) {
          await videoSender.replaceTrack(cameraTrackRef.current);
        }
        setIsScreenSharing(false);
        notifyMediaState(isMuted, isVideoOff, false);
      } catch (err) {
        console.error("Error stopping screen share:", err);
      }
    } else {
      // Start screen sharing
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
        console.error("Error starting screen share:", err);
        toast.error("Could not share screen.");
      }
    }
  };

  const notifyMediaState = (muted, videoOff, screenSharing) => {
    if (callDetails?.peerId && socketRef.current) {
      socketRef.current.emit("webrtc:media-state", {
        targetId: callDetails.peerId,
        isMuted: muted,
        isVideoOff: videoOff,
        isScreenSharing: screenSharing,
      });
    }
  };

  return (
    <VideoCallContext.Provider
      value={{
        socket: socketRef.current,
        callStatus,
        callDetails,
        localStream: localStreamState,
        remoteStream: remoteStreamState,
        isMuted,
        isVideoOff,
        isScreenSharing,
        peerMediaState,
        callDuration,
        initiateCall,
        answerCall,
        declineCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
};

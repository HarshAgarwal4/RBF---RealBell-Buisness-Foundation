import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useStore } from "../zustand/store";

const VideoCallContext = createContext(null);

const ICE_SERVERS = {
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
  const [sessionInvite, setSessionInvite] = useState(null);

  const [localStreamState, setLocalStreamState] = useState(null);
  const [remoteStreamState, setRemoteStreamState] = useState(null);

  // References to keep socket listeners fresh without reconnecting
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const timerRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  const callStatusRef = useRef("idle");
  const callDetailsRef = useRef(null);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    callDetailsRef.current = callDetails;
  }, [callDetails]);

  // Sound effects using Web Audio API
  const playRingtone = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch (_) {}
      }, 800);
    } catch (_) {}
  }, []);

  const flushPendingIceCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;
    while (pendingIceCandidatesRef.current.length > 0) {
      const cand = pendingIceCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn("Error adding queued ICE candidate:", err);
      }
    }
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const cleanupCall = useCallback(() => {
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
  }, []);

  // Persistent Socket Connection Management
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(backendUrl, {
      auth: { userId: user?._id },
      query: { userId: user?._id },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("liveSession:invite", (inviteData) => {
      setSessionInvite(inviteData);
      playRingtone();
    });

    socket.on("webrtc:incoming-call", ({ callId, callerId, callerName, callerAvatar, offer, callType }) => {
      // If busy, reject automatically
      if (callStatusRef.current !== "idle") {
        socket.emit("webrtc:decline-call", { callId, callerId, targetId: callerId });
        return;
      }

      playRingtone();
      setCallDetails({
        callId,
        peerId: callerId,
        peerName: callerName || "User",
        peerAvatar: callerAvatar || "",
        offer,
        callType: callType || "video",
        isCaller: false,
      });
      setCallStatus("incoming");
    });

    socket.on("webrtc:call-answered", async ({ answer }) => {
      try {
        const pc = pcRef.current;
        if (pc && answer) {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushPendingIceCandidates(pc);
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
        const pc = pcRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.warn("Error adding ICE candidate:", err);
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
  }, [user?._id, backendUrl, playRingtone, startTimer, cleanupCall]);

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
        toast.warn("Call connection ended.");
        cleanupCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  /* Cross-browser media acquisition with automatic graceful fallback */
  const acquireLocalMedia = async (audioOnly = false) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Your browser does not support media devices.");
      throw new Error("mediaDevices unsupported");
    }

    let stream = null;

    if (!audioOnly) {
      // 1. Try standard video + audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err1) {
        console.warn("Retrying basic video/audio due to:", err1.name);

        // 2. Try unconstrained video + audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (err2) {
          console.warn("Retrying audio-only fallback due to:", err2.name);

          // 3. Fallback to audio-only if camera is unavailable/denied
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            setIsVideoOff(true);
            toast.warn("Camera could not be accessed. Continuing call with microphone only.");
          } catch (err3) {
            console.error("All media permission attempts failed:", err3);
            toast.error("Microphone or camera permission was not granted. Please check browser permissions.");
            throw err3;
          }
        }
      }
    } else {
      // Audio only call
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
      } catch (err) {
        console.error("Microphone permission error:", err);
        toast.error("Microphone permission was not granted.");
        throw err;
      }
    }

    localStreamRef.current = stream;
    setLocalStreamState(stream);
    cameraTrackRef.current = stream?.getVideoTracks()[0] || null;
    return stream;
  };

  const initiateCall = async (peerProfile, callType = "video") => {
    const peerId =
      peerProfile?._id ||
      peerProfile?.profile?._id ||
      peerProfile?.userId?._id ||
      peerProfile?.userId ||
      (typeof peerProfile === "string" ? peerProfile : null);

    if (!peerId) {
      toast.error("Invalid call recipient.");
      return;
    }

    if (String(peerId) === String(user?._id)) {
      toast.info("You cannot call yourself.");
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

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);

      socketRef.current?.emit(
        "webrtc:call-user",
        {
          targetId: String(peerId),
          offer: pc.localDescription,
          callType,
        },
        (res) => {
          if (res?.status === 1) {
            setCallDetails((prev) => ({ ...prev, callId: res.callId }));
          } else {
            toast.error(res?.msg || "User is unavailable or offline.");
            cleanupCall();
          }
        }
      );
    } catch (err) {
      console.error("Failed to initiate call:", err);
      cleanupCall();
    }
  };

  const answerCall = async () => {
    const details = callDetailsRef.current;
    if (!details?.offer || !details?.peerId || !details?.callId) return;

    try {
      const stream = await acquireLocalMedia(details.callType === "audio");
      const pc = createPeerConnection(details.peerId, details.callId);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(details.offer));
      await flushPendingIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit(
        "webrtc:answer-call",
        {
          callId: details.callId,
          callerId: details.peerId,
          targetId: details.peerId,
          answer: pc.localDescription,
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
    const details = callDetailsRef.current;
    if (details?.callId && details?.peerId) {
      socketRef.current?.emit("webrtc:decline-call", {
        callId: details.callId,
        callerId: details.peerId,
        targetId: details.peerId,
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    const details = callDetailsRef.current;
    if (details?.peerId) {
      socketRef.current?.emit("webrtc:end-call", {
        targetId: details.peerId,
        callId: details.callId,
      });
    }
    cleanupCall();
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

  const toggleVideo = async () => {
    if (!localStreamRef.current) return;

    let videoTrack = localStreamRef.current.getVideoTracks()[0];

    if (!videoTrack) {
      // If user started without video, dynamically request camera access
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        cameraTrackRef.current = newTrack;
        if (pcRef.current) {
          pcRef.current.addTrack(newTrack, localStreamRef.current);
        }
        setIsVideoOff(false);
        setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()));
        notifyMediaState(isMuted, false, isScreenSharing);
        return;
      } catch (err) {
        toast.error("Could not access camera.");
        return;
      }
    }

    videoTrack.enabled = !videoTrack.enabled;
    const nextState = !videoTrack.enabled;
    setIsVideoOff(nextState);
    notifyMediaState(isMuted, nextState, isScreenSharing);
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
    const details = callDetailsRef.current;
    if (details?.peerId && socketRef.current) {
      socketRef.current.emit("webrtc:media-state", {
        targetId: details.peerId,
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
        sessionInvite,
        dismissSessionInvite: () => setSessionInvite(null),
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

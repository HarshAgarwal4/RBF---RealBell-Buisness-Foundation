import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  PhoneCall,
  Maximize2,
  Minimize2,
  Volume2,
} from "lucide-react";
import { useVideoCall } from "../context/VideoCallContext";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function VideoCallModal() {
  const {
    callStatus,
    callDetails,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    peerMediaState,
    callDuration,
    answerCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useVideoCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (callStatus === "idle") return null;

  const avatarUrl =
    callDetails?.peerAvatar ||
    `https://placehold.co/160x160/0F3D4A/FFFFFF?text=${encodeURIComponent(
      (callDetails?.peerName || "User").slice(0, 2).toUpperCase()
    )}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all">
      {/* INCOMING CALL MODAL */}
      {callStatus === "incoming" && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#161B26] p-8 text-center shadow-2xl animate-fade-in">
          <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#34C759]/20 animate-ping" />
            <img
              src={avatarUrl}
              alt={callDetails?.peerName || "Caller"}
              className="relative h-24 w-24 rounded-full object-cover border-4 border-[#34C759] shadow-lg"
            />
          </div>

          <h3 className="text-2xl font-bold text-white tracking-tight">
            {callDetails?.peerName || "Incoming Call"}
          </h3>
          <p className="mt-1 text-sm font-medium text-emerald-400">
            Incoming Video Call...
          </p>

          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={declineCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 hover:scale-105 active:scale-95"
              title="Decline Call"
            >
              <PhoneOff size={28} />
            </button>

            <button
              type="button"
              onClick={answerCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600 hover:scale-105 active:scale-95 animate-bounce"
              title="Answer Call"
            >
              <PhoneCall size={28} />
            </button>
          </div>
        </div>
      )}

      {/* OUTGOING CALLING MODAL */}
      {callStatus === "calling" && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#161B26] p-8 text-center shadow-2xl animate-fade-in">
          <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-pulse" />
            <img
              src={avatarUrl}
              alt={callDetails?.peerName || "Recipient"}
              className="relative h-24 w-24 rounded-full object-cover border-4 border-rose-500/80 shadow-lg"
            />
          </div>

          <h3 className="text-2xl font-bold text-white tracking-tight">
            {callDetails?.peerName || "Calling..."}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Calling... Waiting for response
          </p>

          <div className="mt-8 flex items-center justify-center">
            <button
              type="button"
              onClick={endCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 hover:scale-105 active:scale-95"
              title="Cancel Call"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE CALL WINDOW */}
      {callStatus === "connected" && (
        <div
          ref={containerRef}
          className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A] shadow-2xl"
        >
          {/* Header Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6">
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt={callDetails?.peerName}
                className="h-10 w-10 rounded-full object-cover border border-white/30"
              />
              <div>
                <h4 className="text-base font-semibold text-white">
                  {callDetails?.peerName}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400 font-mono">
                    {formatDuration(callDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-3">
              {peerMediaState.isMuted && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs text-red-300">
                  <MicOff size={14} /> Peer Muted
                </span>
              )}
              {peerMediaState.isScreenSharing && (
                <span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-1 text-xs text-blue-300">
                  <MonitorUp size={14} /> Peer Sharing Screen
                </span>
              )}

              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          {/* Video Streams Container */}
          <div className="relative flex-1 bg-[#090D16] overflow-hidden flex items-center justify-center">
            {/* Remote Video Stream */}
            {peerMediaState.isVideoOff ? (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <img
                  src={avatarUrl}
                  alt={callDetails?.peerName}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-4"
                />
                <p className="text-slate-400 text-sm font-medium">
                  {callDetails?.peerName} turned off camera
                </p>
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
            )}

            {/* Local Video Stream (PiP Window) */}
            <div className="absolute bottom-24 right-6 z-20 h-44 w-60 overflow-hidden rounded-2xl border-2 border-white/20 bg-black/70 shadow-2xl transition-all duration-300 hover:scale-105">
              {isVideoOff ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-center p-2">
                  <VideoOff size={24} className="text-slate-500 mb-1" />
                  <span className="text-xs text-slate-400">Camera Off</span>
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
                {isMuted ? (
                  <MicOff size={10} className="text-red-400" />
                ) : (
                  <Mic size={10} className="text-emerald-400" />
                )}
                <span>You</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-6 pt-4">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition shadow-lg ${
                isMuted
                  ? "bg-red-600/90 text-white hover:bg-red-700"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Video Toggle */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition shadow-lg ${
                isVideoOff
                  ? "bg-red-600/90 text-white hover:bg-red-700"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
              }`}
              title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition shadow-lg ${
                isScreenSharing
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
              }`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              {isScreenSharing ? <MonitorOff size={24} /> : <MonitorUp size={24} />}
            </button>

            {/* End Call */}
            <button
              type="button"
              onClick={endCall}
              className="flex h-14 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition hover:bg-red-700 hover:scale-105 active:scale-95"
              title="End Call"
            >
              <PhoneOff size={26} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

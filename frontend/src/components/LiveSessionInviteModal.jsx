import React from "react";
import { useNavigate } from "react-router-dom";
import { Video, Lock, Globe, Sparkles, X, ArrowRight, Radio } from "lucide-react";
import { useVideoCall } from "../context/VideoCallContext";

export default function LiveSessionInviteModal() {
  const navigate = useNavigate();
  const { sessionInvite, dismissSessionInvite } = useVideoCall();

  if (!sessionInvite) return null;

  const handleJoin = () => {
    const { sessionId, passcode } = sessionInvite;
    dismissSessionInvite();
    const url = `/live-sessions/${sessionId}${
      passcode ? `?pwd=${encodeURIComponent(passcode)}` : ""
    }`;
    navigate(url);
  };

  const isPrivate = sessionInvite.visibility === "private";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 text-gray-900 relative overflow-hidden animate-scale-up">
        {/* Top decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#b03052] via-rose-400 to-[#0b1a3a]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#b03052] flex items-center justify-center shadow-xs">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#b03052] uppercase tracking-wider block">
                Live Meeting Invitation
              </span>
              <h3 className="text-sm font-bold text-gray-900">Incoming Invite</h3>
            </div>
          </div>
          <button
            onClick={dismissSessionInvite}
            className="p-1 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Host Profile Info */}
        <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
          <img
            src={
              sessionInvite.hostAvatar ||
              `https://placehold.co/100x100/18213A/FFFFFF?text=${encodeURIComponent(
                (sessionInvite.hostName || "Host").slice(0, 2).toUpperCase()
              )}`
            }
            alt={sessionInvite.hostName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-gray-900 truncate">
              {sessionInvite.hostName}
            </h4>
            {sessionInvite.hostCompany && (
              <p className="text-xs text-gray-500 truncate">{sessionInvite.hostCompany}</p>
            )}
            <p className="text-[11px] text-[#b03052] font-semibold mt-0.5">
              invited you to join a live session
            </p>
          </div>
        </div>

        {/* Session Details Box */}
        <div className="space-y-3 p-4 bg-gray-50/70 border border-gray-200/70 rounded-2xl mb-6">
          <h2 className="text-base font-bold text-gray-900 leading-snug">
            {sessionInvite.sessionTitle}
          </h2>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isPrivate
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {isPrivate ? <Lock size={10} /> : <Globe size={10} />}
              {isPrivate ? "Private Session" : "Public Session"}
            </span>

            <span className="text-[11px] font-medium text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
              {sessionInvite.sessionType === "one-to-one" ? "1-on-1 Queue" : "Group Call"}
            </span>

            {sessionInvite.isPasswordProtected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                <Lock size={10} /> Passcode Included
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={dismissSessionInvite}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#b03052] text-white text-xs font-bold hover:bg-[#96263f] transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Video size={14} /> Join Meeting <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
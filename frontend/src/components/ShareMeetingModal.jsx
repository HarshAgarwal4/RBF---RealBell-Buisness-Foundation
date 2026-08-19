import React, { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  KeyRound,
  Users,
  Search,
  Send,
  Lock,
  Globe,
  Radio,
  CheckSquare,
  Square,
} from "lucide-react";
import axios from "../services/axios";
import { toast } from "react-toastify";

export default function ShareMeetingModal({ session, onClose }) {
  const [tab, setTab] = useState("link"); // 'link' | 'invite'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Direct Connections Invitation State
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(false);

  const directLink = `${window.location.origin}/live-sessions/${session._id}${
    session.isPasswordProtected && session.passcode ? `?pwd=${encodeURIComponent(session.passcode)}` : ""
  }`;

  const cleanLink = `${window.location.origin}/live-sessions/${session._id}`;

  const hostName = session.hostId?.name || "Host";
  const fullInvite = `Topic: ${session.title}
Host: ${hostName}${session.hostId?.company_name ? ` (${session.hostId.company_name})` : ""}
Join Live Session & Waiting Queue: ${cleanLink}${
    session.isPasswordProtected && session.passcode
      ? `\nMeeting Passcode: ${session.passcode}`
      : ""
  }`;

  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    toast.success("Direct meeting link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFullInvite = () => {
    navigator.clipboard.writeText(fullInvite);
    setCopiedInvite(true);
    toast.success("Full meeting invitation copied!");
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  // Load connections for direct invitation
  useEffect(() => {
    if (tab === "invite" && connections.length === 0) {
      const fetchConnections = async () => {
        try {
          setLoadingConnections(true);
          const res = await axios.get("/live-sessions/connections");
          if (res.data?.status === 1) {
            setConnections(res.data.connections || []);
          }
        } catch (err) {
          console.error("Failed to load connections:", err);
          toast.error("Could not load connections list");
        } finally {
          setLoadingConnections(false);
        }
      };
      fetchConnections();
    }
  }, [tab, connections.length]);

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    const filtered = filteredConnections.map((c) => c._id);
    if (selectedUserIds.length === filtered.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filtered);
    }
  };

  const handleSendInvites = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one connection to invite");
      return;
    }

    try {
      setSendingInvites(true);
      const res = await axios.post(`/live-sessions/${session._id}/invite`, {
        recipientUserIds: selectedUserIds,
      });

      if (res.data?.status === 1) {
        toast.success(`Live meeting invitations dispatched to ${selectedUserIds.length} connection(s)!`);
        setSelectedUserIds([]);
        setTab("link");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Failed to send invitations");
    } finally {
      setSendingInvites(false);
    }
  };

  const filteredConnections = connections.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-gray-100 animate-fade-in text-gray-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#b03052] flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Share Meeting & Invite</h2>
              <p className="text-xs text-gray-500 truncate max-w-xs">{session.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl mb-5">
          <button
            onClick={() => setTab("link")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === "link"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Copy size={14} /> Link & Invitation
          </button>
          <button
            onClick={() => setTab("invite")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === "invite"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users size={14} /> Invite Connections (Live Screen Popup)
          </button>
        </div>

        {/* TAB 1: LINK & PASSCODE */}
        {tab === "link" && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Visibility Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  session.visibility === "private"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {session.visibility === "private" ? <Lock size={11} /> : <Globe size={11} />}
                {session.visibility === "private"
                  ? "Private Session (Hidden from Directory)"
                  : "Public Session (Listed Live)"}
              </span>
            </div>

            {/* Direct Link Box */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Direct Meeting Link
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={directLink}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyDirectLink}
                  className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Passcode section if applicable */}
            {session.isPasswordProtected && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-amber-700" />
                  <div>
                    <div className="text-xs font-bold text-amber-900">Meeting Passcode</div>
                    <div className="text-[11px] text-amber-700">
                      {session.passcode ? "Share this passcode with attendees" : "Passcode required to enter"}
                    </div>
                  </div>
                </div>
                {session.passcode && (
                  <div className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-sm font-mono font-bold text-amber-900 select-all">
                    {session.passcode}
                  </div>
                )}
              </div>
            )}

            {/* Full Invitation Preview */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Full Invitation Text
              </div>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-white p-3 rounded-xl border border-gray-200 select-all max-h-28 overflow-y-auto">
                {fullInvite}
              </pre>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleCopyFullInvite}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b03052] text-white text-xs font-semibold hover:bg-[#96263f] transition shadow-md cursor-pointer"
              >
                {copiedInvite ? <Check size={15} /> : <Copy size={15} />}
                {copiedInvite ? "Invitation Copied!" : "Copy Full Invitation"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECT INVITE CONNECTIONS (LIVE POPUP ON THEIR SCREEN) */}
        {tab === "invite" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <p className="text-xs text-gray-500">
              Select connections to receive a live real-time invitation popup directly on their screen with 1-click meeting entry.
            </p>

            {/* Search and Select All Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search connection by name, company, or email..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#b03052]"
                />
              </div>

              {filteredConnections.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition shrink-0 cursor-pointer"
                >
                  {selectedUserIds.length === filteredConnections.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {/* Connection List Container */}
            <div className="flex-1 overflow-y-auto max-h-64 space-y-2 border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
              {loadingConnections ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-[#b03052] border-t-transparent rounded-full mb-2" />
                  <p>Loading your connections...</p>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  <Users size={24} className="mx-auto mb-2 text-gray-300" />
                  <p>No connections found.</p>
                </div>
              ) : (
                filteredConnections.map((conn) => {
                  const isSelected = selectedUserIds.includes(conn._id);
                  const avatar =
                    conn.account?.image ||
                    conn.profile?.logo ||
                    `https://placehold.co/80x80/18213A/FFFFFF?text=${encodeURIComponent(
                      (conn.name || "User").slice(0, 2).toUpperCase()
                    )}`;

                  return (
                    <div
                      key={conn._id}
                      onClick={() => toggleSelectUser(conn._id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition ${
                        isSelected
                          ? "bg-rose-50/70 border-rose-300 shadow-2xs"
                          : "bg-white border-gray-200/70 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={avatar}
                          alt={conn.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{conn.name}</h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            {conn.company_name || conn.email}
                          </p>
                        </div>
                      </div>

                      <div className="text-[#b03052] pl-2 shrink-0">
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send Invites Button Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-600">
                {selectedUserIds.length} connection(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInvites}
                  disabled={selectedUserIds.length === 0 || sendingInvites}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#b03052] text-white text-xs font-bold hover:bg-[#96263f] transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  {sendingInvites ? "Sending..." : `Send Invites (${selectedUserIds.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
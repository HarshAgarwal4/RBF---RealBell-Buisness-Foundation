import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  ShieldAlert,
  Smile,
  Mic,
  Square,
  UserRound,
  Users,
  XCircle,
  Send,
  FileText,
  Video,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";
import { ScheduleMeetingModal } from "./meetings.jsx";
import { io } from "socket.io-client";
import { useVideoCall } from "../../context/VideoCallContext";


function timeAgo(value) {
  if (!value) return "just now";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatTypeLabel(value = "") {
  const text = String(value).replace(/[-_]/g, " ").trim();
  if (!text) return "Connection";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeTypePath(type = "") {
  const value = String(type).toLowerCase().trim();

  if (value === "startup") return "startups";
  if (value === "investor") return "investors";
  if (value === "mentor") return "mentors";
  return "startups";
}

function connectionName(connection) {
  return (
    connection?.profile?.company_name ||
    connection?.profile?.name ||
    connection?.company_name ||
    connection?.name ||
    "Anonymous"
  );
}

function connectionMeta(connection) {
  return (
    connection?.profile?.account?.designation ||
    connection?.account?.designation ||
    formatTypeLabel(connection?.profile?.company_type || connection?.company_type) ||
    "Community member"
  );
}

function initialsFor(connection) {
  const source = connectionName(connection) || "Connection";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function avatarFor(connection) {
  const image = connection?.profile?.account?.image || connection?.account?.image;
  if (image) return image;

  return `https://placehold.co/160x160/0F3D4A/FFFFFF?text=${encodeURIComponent(
    initialsFor(connection)
  )}`;
}

function formatChatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatChatDay(value) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupMessagesByDay(messages = []) {
  const groups = [];
  let currentLabel = "";

  messages
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((message) => {
      const label = formatChatDay(message.createdAt);
      if (!groups.length || label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, messages: [message] });
        return;
      }

      groups[groups.length - 1].messages.push(message);
    });

  return groups;
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-[17px] font-medium transition ${
        active
          ? "bg-[#F8F8FB] text-[#B52B2B] shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
          : "text-[#6A6F8D] hover:bg-[#f7f8fb]"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, description }) {
  const Icon = icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-[#A1A8BD]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#ABB1C5] text-[#A4A9BA]">
        <Icon size={40} strokeWidth={2.4} />
      </div>
      <p className="mt-8 text-[22px] font-medium text-[#A1A8BD]">{title}</p>
      {description ? <p className="mt-2 text-[15px]">{description}</p> : null}
    </div>
  );
}

function MiniConnectionRow({ connection, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#EEF1F6] bg-white px-3 py-3 text-left transition hover:bg-[#FBFCFF]"
    >
      <img
        src={avatarFor(connection)}
        alt={connectionName(connection)}
        className="h-12 w-12 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-[#18213A]">
          {connectionName(connection)}
        </div>
        <div className="truncate text-sm text-[#8390AA]">{connectionMeta(connection)}</div>
      </div>
      {connection?.is_online ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[#34C759]" />
      ) : (
        <span className="text-xs font-semibold text-[#9AA2B8]">Away</span>
      )}
    </button>
  );
}

function ConnectionCard({
  connection,
  variant,
  onViewProfile,
  onChat,
  onVideoCall,
  onSchedule,
  onRespond,
  onReconnect,
  busyKey,
}) {
  const isIncomingPending = connection.status === "pending" && connection.direction === "received";
  const isOutgoingPending = connection.status === "pending" && connection.direction === "sent";
  const isBusy = (key) => busyKey === `${connection.profile._id}:${key}`;

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#EEF1F6] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-[#F0F2F7] px-4 py-3">
        <span className="rounded-full bg-[#F7F8FB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9FA6BB]">
          {formatTypeLabel(connection?.profile?.company_name || connection?.profile?.company_type)}
        </span>
        <button
          type="button"
          onClick={() => onViewProfile(connection)}
          className="rounded-full p-1.5 text-[#9DA4B8] transition hover:bg-[#F5F7FB] hover:text-[#0F3D4A]"
          aria-label={`View ${connectionName(connection)}`}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="px-4 pb-4 pt-5">
        <div className="flex flex-col items-center text-center">
          <img
            src={avatarFor(connection)}
            alt={connectionName(connection)}
            className="h-20 w-20 rounded-full border border-[#E5EAF3] object-cover"
          />
          <h3 className="mt-4 text-[24px] font-bold tracking-tight text-[#18213A]">
            {connectionName(connection)}
          </h3>
          <p className="mt-1 text-[16px] text-[#2C3550]">{connectionMeta(connection)}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#667089]">
              {connection.status === "accepted" ? (
                <CheckCircle2 size={14} className="text-[#1F9D55]" />
              ) : connection.status === "pending" ? (
                <Clock3 size={14} className="text-[#C38B00]" />
              ) : (
                <ShieldAlert size={14} className="text-[#B23A3A]" />
              )}
              {connection.status === "accepted"
                ? "Active"
                : connection.status === "pending" && connection.direction === "received"
                  ? "Pending request"
                  : connection.status === "pending"
                    ? "Request sent"
                    : "Rejected"}
            </span>

            {connection.is_online ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECF9F0] px-3 py-1 text-xs font-semibold text-[#179B4B]">
                <span className="h-2 w-2 rounded-full bg-[#34C759]" />
                Online
              </span>
            ) : null}
          </div>

          {variant === "active" ? (
            <div className="mt-5 grid w-full grid-cols-3 divide-x divide-[#E8ECF4] overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6]">
              <button
                type="button"
                onClick={() => onChat(connection)}
                className="inline-flex items-center justify-center gap-1.5 px-2 py-4 text-[14px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <MessageCircle size={17} />
                Chat
              </button>
              <button
                type="button"
                onClick={() => onVideoCall && onVideoCall(connection)}
                className="inline-flex items-center justify-center gap-1.5 px-2 py-4 text-[14px] font-medium text-[#179B4B] transition hover:bg-[#F2FAF4]"
              >
                <Video size={17} />
                Video Call
              </button>
              <button
                type="button"
                onClick={() => onSchedule(connection)}
                className="inline-flex items-center justify-center gap-1.5 px-2 py-4 text-[14px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <CalendarDays size={17} />
                Schedule
              </button>
            </div>
          ) : variant === "pending" ? (
            <div className="mt-5 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6]">
              <button
                type="button"
                onClick={() => onViewProfile(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <UserRound size={18} />
                View
              </button>
              {isIncomingPending ? (
                <div className="grid grid-cols-2 divide-x divide-[#E8ECF4]">
                  <button
                    type="button"
                    disabled={isBusy("reject")}
                    onClick={() => onRespond(connection, "reject")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#B23A3A] transition hover:bg-[#FFF7F7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isBusy("accept")}
                    onClick={() => onRespond(connection, "accept")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={18} />
                    Accept
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#8891A7] disabled:cursor-not-allowed"
                >
                  <Clock3 size={18} />
                  Requested
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6]">
              <button
                type="button"
                disabled={isBusy("reconnect")}
                onClick={() => onReconnect(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Users size={18} />
                Reconnect
              </button>
              <button
                type="button"
                onClick={() => onViewProfile(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <UserRound size={18} />
                View
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#F0F2F7] pt-4 text-sm text-[#7A849A]">
          <span>
            {isOutgoingPending
              ? `Sent ${timeAgo(connection.requestedAt)}`
              : connection.status === "accepted"
                ? `Connected ${timeAgo(connection.respondedAt || connection.requestedAt)}`
                : `Updated ${timeAgo(connection.respondedAt || connection.requestedAt)}`}
          </span>
          <span className="inline-flex items-center gap-1">
            {connection.profile.email ? (
              <>
                <Mail size={14} />
                {connection.profile.email}
              </>
            ) : connection.profile.phone ? (
              <>
                <Phone size={14} />
                {connection.profile.phone}
              </>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ title, emptyTitle, emptyDescription, items, onItemClick, icon }) {
  const Icon = icon;

  return (
    <div className="rounded-[24px] border border-[#EEF1F6] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-[28px] font-bold tracking-tight text-[#172033]">{title}</h3>
      <div className="mt-5 border-t border-[#EEF2F8]" />
      {items.length === 0 ? (
        <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="mt-4 space-y-3">
          {items.slice(0, 4).map((item) => (
            <MiniConnectionRow
              key={item.profile._id}
              connection={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatWorkspace({
  currentUserId,
  currentUserName,
  chatConnection,
  onClose,
  onSchedule,
}) {
  const { initiateCall } = useVideoCall();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || window.location.origin;
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [activePeerId, setActivePeerId] = useState(chatConnection?.profile?._id || chatConnection?._id || "");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingSecondsRef = useRef(0);
  const activePeerRef = useRef(activePeerId);
  const threadsRef = useRef([]);
  const messagesEndRef = useRef(null);

  const emojiList = ["😀", "😁", "😂", "🙂", "😍", "🙏", "👏", "🔥", "✅", "🎉", "🤝", "💬"];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    activePeerRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const activeThread = useMemo(
    () => threads.find((thread) => String(thread.profile?._id) === String(activePeerId)) || null,
    [threads, activePeerId]
  );

  const filteredThreads = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return threads;

    return threads.filter((thread) => {
      const haystack = [
        connectionName(thread),
        connectionMeta(thread),
        thread.profile?.company_name,
        thread.profile?.name,
        thread.profile?.email,
        thread.profile?.phone,
        thread.lastMessage?.text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [threads, search]);

  const updateThreadPreview = (message) => {
    setThreads((prev) =>
      prev
        .map((thread) => {
          const otherId = String(thread.profile?._id);
          if (otherId !== String(message.senderId) && otherId !== String(message.recipientId)) {
            return thread;
          }

          const isActive = String(activePeerRef.current) === otherId;
          const unreadCount =
            isActive || String(message.senderId) === String(currentUserId)
              ? 0
              : (thread.unreadCount || 0) + 1;

          return {
            ...thread,
            lastMessage: message,
            unreadCount,
            is_online:
              String(message.senderId) === String(currentUserId)
                ? thread.is_online
                : thread.is_online,
          };
        })
        .sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0))
    );
  };

  const loadThreads = async (preferredPeerId = null) => {
    setThreadsLoading(true);
    setError("");
    try {
      const res = await axios.get("/chat/threads");
      const list = res.data?.threads || [];
      setThreads(list);

      const preferredId =
        preferredPeerId ||
        chatConnection?.profile?._id ||
        chatConnection?._id ||
        list[0]?.profile?._id ||
        "";

      if (preferredId) {
        setActivePeerId(String(preferredId));
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Unable to load chats");
    } finally {
      setThreadsLoading(false);
    }
  };

  const loadMessages = async (peerId) => {
    if (!peerId) return;

    setMessagesLoading(true);
    setError("");
    try {
      const res = await axios.get(`/chat/threads/${peerId}/messages?limit=100`);
      const list = [...(res.data?.messages || [])].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(list);
      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.profile?._id) === String(peerId)
            ? {
                ...thread,
                is_online: res.data?.is_online ?? thread.is_online,
                unreadCount: 0,
              }
            : thread
        )
      );

      const lastMessageId = list[list.length - 1]?.id || null;
      await axios.post(`/chat/threads/${peerId}/read`, {
        messageId: lastMessageId,
      });
    } catch (err) {
      setError(err?.response?.data?.msg || "Unable to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadThreads(chatConnection?.profile?._id || chatConnection?._id || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatConnection?.profile?._id, chatConnection?._id]);

  useEffect(() => {
    if (!activePeerId) return;
    loadMessages(activePeerId);
    socketRef.current?.emit("chat:thread:join", { otherId: activePeerId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeerId]);

  useEffect(() => {
    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("chat:presence:update", ({ userId, online }) => {
      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.profile?._id) === String(userId)
            ? { ...thread, is_online: online }
            : thread
        )
      );
    });

    socket.on("chat:message:new", (message) => {
      updateThreadPreview(message);
      if (String(activePeerRef.current) === String(message.senderId) || String(activePeerRef.current) === String(message.recipientId)) {
        setMessages((prev) =>
          prev.some((item) => String(item.id) === String(message.id))
            ? prev.map((item) => (String(item.id) === String(message.id) ? message : item))
            : [...prev, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }
    });

    socket.on("chat:message:delivered", (message) => {
      setThreads((prev) =>
        prev.map((thread) =>
          String(thread.profile?._id) === String(message.senderId) ||
          String(thread.profile?._id) === String(message.recipientId)
            ? {
                ...thread,
                lastMessage:
                  String(thread.lastMessage?.id) === String(message.id)
                    ? { ...thread.lastMessage, deliveredAt: message.deliveredAt }
                    : thread.lastMessage,
              }
            : thread
        )
      );

      setMessages((prev) =>
        prev.map((item) =>
          String(item.id) === String(message.id)
            ? { ...item, deliveredAt: message.deliveredAt, status: item.status === "read" ? "read" : "delivered" }
            : item
        )
      );
    });

    socket.on("chat:ready", ({ deliveredCount }) => {
      if (deliveredCount > 0 && activePeerRef.current) {
        loadThreads(activePeerRef.current);
        loadMessages(activePeerRef.current);
      }
    });

    socket.on("chat:message:read", ({ threadId, readerId, readAt }) => {
      const active = threadsRef.current.find(
        (thread) => String(thread.profile?._id) === String(activePeerRef.current)
      );

      if (!active || String(active.threadId) !== String(threadId)) return;

      setMessages((prev) =>
        prev.map((item) => {
          if (String(item.senderId) !== String(currentUserId)) return item;
          if (!item.createdAt || new Date(item.createdAt).getTime() > new Date(readAt).getTime()) {
            return item;
          }
          return { ...item, status: "read", readAt };
        })
      );

      if (String(readerId) !== String(currentUserId)) {
        setThreads((prev) =>
          prev.map((thread) =>
            String(thread.threadId) === String(threadId)
              ? { ...thread, unreadCount: 0 }
              : thread
          )
        );
      }
    });

    socket.on("connect_error", (err) => {
      setError(err?.message || "Chat connection failed");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [backendUrl, currentUserId]);

  useEffect(() => {
    if (chatConnection?.profile?._id && String(chatConnection.profile._id) !== String(activePeerId)) {
      setActivePeerId(String(chatConnection.profile._id));
    }
  }, [activePeerId, chatConnection]);

  const activePeerProfile =
    activeThread?.profile || chatConnection?.profile || chatConnection || null;
  const scheduleTarget =
    activeThread || chatConnection || (activePeerProfile ? { profile: activePeerProfile } : null);

  const openPeer = async (peerId) => {
    if (!peerId) return;
    setActivePeerId(String(peerId));
    setEmojiOpen(false);
    socketRef.current?.emit("chat:thread:join", { otherId: peerId });
  };

  const sendTextMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activePeerId || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await axios.post("/chat/messages/text", {
        otherId: activePeerId,
        text,
      });

      if (res.data?.status !== 1) {
        throw new Error(res.data?.msg || "Unable to send message");
      }

      const savedMessage = res.data?.message;
      if (savedMessage) {
        setMessages((prev) =>
          prev.some((item) => String(item.id) === String(savedMessage.id))
            ? prev.map((item) => (String(item.id) === String(savedMessage.id) ? savedMessage : item))
            : [...prev, savedMessage].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }

      setDraft("");
      setEmojiOpen(false);
    } catch (err) {
      setError(err?.message || err?.response?.data?.msg || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async (file, kind = "file", duration = null) => {
    if (!file || !activePeerId) return;

    setSending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("otherId", activePeerId);
      formData.append("file", file);
      formData.append("kind", kind);
      formData.append("text", draft.trim());
      if (duration !== null && duration !== undefined) {
        formData.append("duration", String(duration));
      }

      const res = await axios.post("/chat/messages/attachment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status !== 1) {
        throw new Error(res.data?.msg || "Unable to send attachment");
      }

      const savedMessage = res.data?.message;
      if (savedMessage) {
        setMessages((prev) =>
          prev.some((item) => String(item.id) === String(savedMessage.id))
            ? prev.map((item) => (String(item.id) === String(savedMessage.id) ? savedMessage : item))
            : [...prev, savedMessage].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
      }

      setDraft("");
      setEmojiOpen(false);
    } catch (err) {
      setError(err?.message || err?.response?.data?.msg || "Unable to send attachment");
    } finally {
      setSending(false);
    }
  };

  const emojiButton = (emoji) => (
    <button
      key={emoji}
      type="button"
      onClick={() => setDraft((prev) => `${prev}${emoji}`)}
      className="rounded-lg px-2 py-1 text-lg transition hover:bg-[#F1F4FB]"
    >
      {emoji}
    </button>
  );

  const startRecording = async () => {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current = [];
      setRecording(true);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      timerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        const duration = Math.max(1, recordingSecondsRef.current);
        await sendAttachment(file, "voice", duration);
        setRecording(false);
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
      };

      recorder.start();
    } catch (err) {
      setError(err?.message || "Unable to access microphone");
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
    }
  };

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await sendAttachment(file, file.type.startsWith("audio/") ? "voice" : "file");
  };

  const renderAttachment = (message) => {
    const attachment = message.attachment;
    if (!attachment) return null;

    const isImage = attachment.mimeType?.startsWith("image/");
    const isAudio = attachment.mimeType?.startsWith("audio/") || message.kind === "voice";

    if (isImage) {
      return (
        <a href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
          <img src={attachment.url} alt={attachment.name || "attachment"} className="max-h-64 w-full rounded-2xl object-cover" />
        </a>
      );
    }

    if (isAudio) {
      return (
        <audio controls className="w-full">
          <source src={attachment.url} type={attachment.mimeType || "audio/webm"} />
        </audio>
      );
    }

    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-2xl border border-[#DDE4F0] bg-white px-4 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#F8FAFD]"
      >
        <FileText size={16} />
        {attachment.name || "Open file"}
      </a>
    );
  };

  const formatBubbleStatus = (message) => {
    if (String(message.senderId) !== String(currentUserId)) return null;
    const status = message.status || (message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent");
    if (status === "read") return "Read";
    if (status === "delivered") return "Delivered";
    return "Sent";
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-100px)] max-h-[900px]">
      <div className="grid h-full grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="flex flex-col h-full overflow-hidden rounded-[24px] border border-[#E7ECF5] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-[28px] font-bold tracking-tight text-[#172033]">Chats</h2>
              <p className="mt-1 text-sm text-[#7A849A]">Accepted connections only.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#E6EBF4] px-3 py-2 text-sm font-medium text-[#28324B] transition hover:bg-[#F8FAFD]"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          <div className="relative mt-5 shrink-0">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B9CC]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats"
              className="h-[54px] w-full rounded-2xl border border-[#DDE4F0] bg-[#F8FAFE] pl-11 pr-4 text-[15px] text-[#1A2540] outline-none placeholder:text-[#A4ADC1] focus:ring-2 focus:ring-[#8E1B2E]/10"
            />
          </div>

          <div className="mt-5 flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
            {threadsLoading ? (
              <div className="rounded-2xl border border-dashed border-[#E4E9F2] px-4 py-8 text-center text-sm text-[#8E97AD]">
                Loading chats...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E4E9F2] px-4 py-8 text-center text-sm text-[#8E97AD]">
                No chats found.
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.threadId || thread.profile?._id}
                  type="button"
                  onClick={() => openPeer(thread.profile?._id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                    String(activePeerId) === String(thread.profile?._id)
                      ? "border-[#B52B2B] bg-[#FFF7F7]"
                      : "border-[#EEF1F6] bg-white hover:bg-[#FBFCFF]"
                  }`}
                >
                  <img
                    src={avatarFor(thread)}
                    alt={connectionName(thread)}
                    className="h-12 w-12 rounded-2xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-[15px] font-semibold text-[#18213A]">
                        {connectionName(thread)}
                      </div>
                      {thread.unreadCount ? (
                        <span className="rounded-full bg-[#B52B2B] px-2 py-0.5 text-xs font-semibold text-white shrink-0">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-sm text-[#8390AA]">
                      {thread.lastMessage?.text
                        ? thread.lastMessage.text
                        : thread.lastMessage?.kind === "file"
                          ? "File attachment"
                          : "Start a chat"}
                    </div>
                  </div>
                  {thread.is_online ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#34C759] shrink-0" />
                  ) : (
                    <span className="text-xs font-semibold text-[#9AA2B8] shrink-0">Away</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <section className="flex flex-col h-full overflow-hidden rounded-[24px] border border-[#E7ECF5] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)] min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F8] px-6 py-4 shrink-0">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={avatarFor(activePeerProfile || chatConnection || {})}
                alt={connectionName(activePeerProfile || chatConnection || {})}
                className="h-12 w-12 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <h3 className="truncate text-[20px] font-bold tracking-tight text-[#172033]">
                  {connectionName(activePeerProfile || chatConnection || {})}
                </h3>
                <p className="truncate text-xs text-[#7A849A]">
                  {connectionMeta(activePeerProfile || chatConnection || {})}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {activeThread?.is_online ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#ECF9F0] px-3 py-1.5 text-xs font-semibold text-[#179B4B]">
                  <span className="h-2 w-2 rounded-full bg-[#34C759]" />
                  Online
                </span>
              ) : (
                <span className="rounded-full bg-[#F7F8FB] px-3 py-1.5 text-xs font-semibold text-[#8891A7]">
                  Away
                </span>
              )}

              <button
                type="button"
                onClick={() => initiateCall(activePeerProfile || chatConnection)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#179B4B] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#13823E]"
              >
                <Video size={16} />
                <span className="hidden sm:inline">Video Call</span>
              </button>

              <button
                type="button"
                onClick={() => onSchedule(scheduleTarget)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#B52B2B] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#972222]"
              >
                <CalendarDays size={16} />
                <span className="hidden sm:inline">Schedule meeting</span>
              </button>
            </div>
          </div>

          {error ? (
            <div className="border-b border-[#F2D6D6] bg-[#FFF6F6] px-6 py-2 text-sm text-[#B23A3A] shrink-0">
              {error}
            </div>
          ) : null}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto bg-[#FBFCFF] px-6 py-6 space-y-4 min-h-0">
            {messagesLoading ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[#D9E0EE] bg-white px-6 py-16 text-center text-[#8E97AD]">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[#D9E0EE] bg-white px-6 py-16 text-center text-[#8E97AD]">
                Start the conversation from here.
              </div>
            ) : (
              groupMessagesByDay(messages).map((group) => (
                <div key={group.label} className="space-y-4">
                  <div className="flex items-center justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8E97AD] shadow-sm">
                      {group.label}
                    </span>
                  </div>
                  {group.messages.map((message) => {
                    const isMine = String(message.senderId) === String(currentUserId);
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] sm:max-w-[65%] min-w-0 ${isMine ? "text-right" : "text-left"}`}>
                          <div className={`mb-1 text-xs font-semibold text-[#172033] ${isMine ? "pr-2" : "pl-2"}`}>
                            {isMine ? currentUserName || "You" : connectionName(activePeerProfile || chatConnection || {})}
                          </div>
                          <div
                            className={`space-y-2 rounded-3xl px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed shadow-sm break-words overflow-hidden ${
                              isMine
                                ? "bg-[#B52B2B] text-white"
                                : "bg-[#EEF4FB] text-[#172033]"
                            }`}
                          >
                            {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                            {renderAttachment(message)}
                          </div>
                          <div className={`mt-1 text-[11px] text-[#8E97AD] ${isMine ? "pr-2" : "pl-2"}`}>
                            {formatChatTime(message.createdAt)}
                            {formatBubbleStatus(message) ? ` • ${formatBubbleStatus(message)}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Area */}
          <form onSubmit={sendTextMessage} className="border-t border-[#EEF2F8] bg-white px-6 py-4 shrink-0">
            <div className="relative flex items-center gap-2 sm:gap-3 rounded-full border border-[#E0E6F0] bg-[#FBFCFF] px-3 sm:px-4 py-2 sm:py-2.5">
              {emojiOpen ? (
                <div className="absolute bottom-full left-4 mb-3 rounded-2xl border border-[#E6EBF4] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                  <div className="grid grid-cols-6 gap-2">{emojiList.map(emojiButton)}</div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setEmojiOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667089] transition hover:bg-[#EEF2F8] shrink-0"
                aria-label="Add emoji"
              >
                <Smile size={20} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667089] transition hover:bg-[#EEF2F8] shrink-0"
                aria-label="Attach file"
              >
                <Paperclip size={18} />
              </button>

              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition shrink-0 ${
                  recording ? "bg-[#B52B2B] text-white" : "text-[#667089] hover:bg-[#EEF2F8]"
                }`}
                aria-label="Voice note"
              >
                {recording ? <Square size={16} /> : <Mic size={18} />}
              </button>

              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={recording ? `Recording ${recordingSeconds}s...` : "Type a message..."}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-[#172033] outline-none placeholder:text-[#9AA3B8]"
                disabled={recording}
              />

              <button
                type="submit"
                disabled={sending || recording || (!draft.trim() && !recording)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#B52B2B] text-white transition hover:bg-[#972222] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const { initiateCall } = useVideoCall();
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState({
    active: 0,
    pending: 0,
    rejected: 0,
    pending_requests: 0,
    online: 0,
  });
  const [groups, setGroups] = useState({
    active: [],
    pending: [],
    rejected: [],
    pending_requests: [],
    online: [],
  });
  const [busyKey, setBusyKey] = useState("");
  const [chatConnection, setChatConnection] = useState(null);
  const [scheduleConnection, setScheduleConnection] = useState(null);

  const loadConnections = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get("/connect/connections");
      if (res.data?.status === 1) {
        setSummary(
          res.data?.summary || {
            active: 0,
            pending: 0,
            rejected: 0,
            pending_requests: 0,
            online: 0,
          }
        );
        setGroups(
          res.data?.connections || {
            active: [],
            pending: [],
            rejected: [],
            pending_requests: [],
            online: [],
          }
        );
      } else {
        setError(res.data?.msg || "Unable to load connections");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Unable to load connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  // Auto-open chat panel when navigated via ?section=chat
  useEffect(() => {
    if (searchParams.get("section") === "chat" && !loading && !chatConnection) {
      const firstActive = groups?.active?.[0];
      if (firstActive) {
        setChatConnection(firstActive);
      }
    }
  }, [searchParams, loading, groups]);

  const currentItems = useMemo(() => {
    const source = groups[tab] || [];
    const value = search.trim().toLowerCase();
    if (!value) return source;

    return source.filter((connection) => {
      const haystack = [
        connectionName(connection),
        connectionMeta(connection),
        connection.profile.company_name,
        connection.profile.name,
        connection.profile.email,
        connection.profile.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [groups, search, tab]);

  const pageCountLabel = useMemo(() => {
    const count = summary[tab] || 0;
    if (tab === "active") {
      return `You have ${count} active connection${count === 1 ? "" : "s"}`;
    }
    if (tab === "pending") {
      return `You have ${count} pending connection${count === 1 ? "" : "s"}`;
    }
    return `You have ${count} rejected connection${count === 1 ? "" : "s"}`;
  }, [summary, tab]);

  const openProfile = (connection) => {
    const type = normalizeTypePath(connection?.profile?.company_type);
    navigate(`/connect/${type}/${connection?.profile?._id}`);
  };

  const scheduleCall = (connection) => {
    setScheduleConnection(connection);
  };

  const openChat = (connection) => {
    setChatConnection(connection);
  };

  const closeChat = () => {
    setChatConnection(null);
  };

  const respondToConnection = async (connection, action) => {
    const id = connection?.profile?._id;
    if (!id || busyKey) return;

    setBusyKey(`${id}:${action}`);
    try {
      const res = await axios.post(`/connect/${id}/respond`, { action });
      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Connection updated");
        await loadConnections();
      } else {
        toast.error(res.data?.msg || "Unable to update connection");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to update connection");
    } finally {
      setBusyKey("");
    }
  };

  const reconnect = async (connection) => {
    const id = connection?.profile?._id;
    if (!id || busyKey) return;

    setBusyKey(`${id}:reconnect`);
    try {
      const res = await axios.post(`/connect/${id}/connect`);
      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Connection request sent");
        await loadConnections();
      } else {
        toast.error(res.data?.msg || "Unable to send connection request");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to send connection request");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <>
      <Sidebar />

      <div className="min-h-screen bg-[linear-gradient(180deg,#F7F9FD_0%,#EEF3F8_100%)] lg:ml-75">
        <div className="sticky top-0 z-20 border-b border-[#E4E9F1] bg-white/95 backdrop-blur">
          <div className="flex flex-col gap-5 px-6 py-5 xl:flex-row xl:items-center xl:justify-between xl:px-10">
            <h1 className="text-[30px] font-bold tracking-tight text-[#111827]">
              Connections
            </h1>

            <div className="flex flex-wrap gap-3">
              <TabButton active={tab === "active"} onClick={() => setTab("active")}>
                Active
              </TabButton>
              <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
                Pending
              </TabButton>
              <TabButton active={tab === "rejected"} onClick={() => setTab("rejected")}>
                Rejected
              </TabButton>
            </div>
          </div>
        </div>

        {chatConnection ? (
          <ChatWorkspace
            currentUserId={user?._id}
            currentUserName={user?.name}
            chatConnection={chatConnection}
            onClose={closeChat}
            onSchedule={scheduleCall}
          />
        ) : (
          <div className="grid gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_446px] xl:px-10">
            <main className="space-y-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <p className="text-[22px] font-medium tracking-tight text-[#12213D]">
                  {pageCountLabel}
                </p>

                <div className="relative w-full xl:max-w-[490px]">
                  <Search
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B9CC]"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search a connection"
                    className="h-[54px] w-full rounded-2xl border border-[#DDE4F0] bg-white pl-12 pr-4 text-[16px] text-[#1A2540] outline-none placeholder:text-[#A4ADC1] focus:ring-2 focus:ring-[#8E1B2E]/10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="rounded-[24px] border border-[#E7ECF5] bg-white p-10 text-center text-[#607086] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  Loading connections...
                </div>
              ) : error ? (
                <div className="rounded-[24px] border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  {error}
                </div>
              ) : currentItems.length === 0 ? (
                <div className="rounded-[24px] border border-[#E7ECF5] bg-white p-10 text-center text-[#607086] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  No connections found for this view.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {currentItems.map((connection) => (
                    <ConnectionCard
                      key={connection.profile._id}
                      connection={connection}
                      variant={tab}
                      onViewProfile={openProfile}
                      onChat={openChat}
                      onVideoCall={initiateCall}
                      onSchedule={scheduleCall}
                      onRespond={respondToConnection}
                      onReconnect={reconnect}
                      busyKey={busyKey}
                    />
                  ))}
                </div>
              )}
            </main>

            <aside className="space-y-6 self-start xl:sticky xl:top-28">
              <SummaryCard
                title="Pending Requests"
                emptyTitle="No pending requests found"
                emptyDescription="Pending requests will show up here when someone reaches out."
                items={groups.pending_requests || []}
                onItemClick={openProfile}
                icon={AlertCircle}
              />

              <SummaryCard
                title="Online Connections"
                emptyTitle="No connections online right now."
                emptyDescription="When a connection is available, they appear here."
                items={groups.online || []}
                onItemClick={openProfile}
                icon={Users}
              />
            </aside>
          </div>
        )}
      </div>

      {scheduleConnection ? (
        <ScheduleMeetingModal
          connections={groups.active || []}
          selectedConnection={scheduleConnection.profile}
          onClose={() => setScheduleConnection(null)}
          onScheduled={() => setScheduleConnection(null)}
        />
      ) : null}
    </>
  );
}
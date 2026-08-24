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
      className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer ${
        active
          ? "bg-white dark:bg-slate-800 text-[#B52B2B] dark:text-red-400 shadow-xs border border-gray-200 dark:border-slate-700"
          : "text-[#6A6F8D] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, description }) {
  const Icon = icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-[#A1A8BD] dark:text-slate-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#ABB1C5] dark:border-slate-700 text-[#A4A9BA] dark:text-slate-500">
        <Icon size={40} strokeWidth={2.4} />
      </div>
      <p className="mt-8 text-[22px] font-medium text-[#A1A8BD] dark:text-slate-400">{title}</p>
      {description ? <p className="mt-2 text-[15px] text-gray-500 dark:text-slate-400">{description}</p> : null}
    </div>
  );
}

function MiniConnectionRow({ connection, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#EEF1F6] dark:border-slate-800 bg-white dark:bg-[#151D2E] px-3 py-3 text-left transition hover:bg-[#FBFCFF] dark:hover:bg-slate-800/80 cursor-pointer"
    >
      <img
        src={avatarFor(connection)}
        alt={connectionName(connection)}
        className="h-12 w-12 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-[#18213A] dark:text-slate-100">
          {connectionName(connection)}
        </div>
        <div className="truncate text-sm text-[#8390AA] dark:text-slate-400">{connectionMeta(connection)}</div>
      </div>
      {connection?.is_online ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[#34C759]" />
      ) : (
        <span className="text-xs font-semibold text-[#9AA2B8] dark:text-slate-500">Away</span>
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
    <article className="overflow-hidden rounded-2xl border border-[#EEF1F6] dark:border-slate-800 bg-white dark:bg-[#151D2E] shadow-xs">
      <div className="flex items-center justify-between border-b border-[#F0F2F7] dark:border-slate-800 px-3.5 py-2.5">
        <span className="rounded-full bg-[#F7F8FB] dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A93AA] dark:text-slate-400 truncate max-w-[180px]">
          {formatTypeLabel(connection?.profile?.company_name || connection?.profile?.company_type)}
        </span>
        <button
          type="button"
          onClick={() => onViewProfile(connection)}
          className="rounded-full p-1 text-[#9DA4B8] dark:text-slate-400 transition hover:bg-[#F5F7FB] dark:hover:bg-slate-800 hover:text-[#0F3D4A] dark:hover:text-white cursor-pointer"
          aria-label={`View ${connectionName(connection)}`}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="p-3.5 sm:p-4">
        <div className="flex flex-col items-center text-center">
          <img
            src={avatarFor(connection)}
            alt={connectionName(connection)}
            className="h-14 w-14 rounded-full border border-[#E5EAF3] dark:border-slate-700 object-cover"
          />
          <h3 className="mt-2.5 text-base sm:text-lg font-bold tracking-tight text-[#18213A] dark:text-slate-100 truncate max-w-full">
            {connectionName(connection)}
          </h3>
          <p className="mt-0.5 text-xs text-[#525E7A] dark:text-slate-400 truncate max-w-full">{connectionMeta(connection)}</p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-[#667089] dark:text-slate-300">
              {connection.status === "accepted" ? (
                <CheckCircle2 size={13} className="text-[#1F9D55]" />
              ) : connection.status === "pending" ? (
                <Clock3 size={13} className="text-[#C38B00]" />
              ) : (
                <ShieldAlert size={13} className="text-[#B23A3A]" />
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
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECF9F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#179B4B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
                Online
              </span>
            ) : null}
          </div>

          {variant === "active" ? (
            <div className="mt-4 grid w-full grid-cols-3 divide-x divide-[#E8ECF4] dark:divide-slate-700 overflow-hidden rounded-xl border border-[#EEF1F6] dark:border-slate-700">
              <button
                type="button"
                onClick={() => onChat(connection)}
                className="inline-flex items-center justify-center gap-1 px-1.5 py-2.5 text-xs font-semibold text-[#111827] dark:text-slate-200 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-800 cursor-pointer"
              >
                <MessageCircle size={14} />
                Chat
              </button>
              <button
                type="button"
                onClick={() => onVideoCall && onVideoCall(connection)}
                className="inline-flex items-center justify-center gap-1 px-1.5 py-2.5 text-xs font-semibold text-[#179B4B] dark:text-emerald-400 transition hover:bg-[#F2FAF4] dark:hover:bg-slate-800 cursor-pointer"
              >
                <Video size={14} />
                Call
              </button>
              <button
                type="button"
                onClick={() => onSchedule(connection)}
                className="inline-flex items-center justify-center gap-1 px-1.5 py-2.5 text-xs font-semibold text-[#111827] dark:text-slate-200 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-800 cursor-pointer"
              >
                <CalendarDays size={14} />
                Meet
              </button>
            </div>
          ) : variant === "pending" ? (
            <div className="mt-4 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] dark:divide-slate-700 overflow-hidden rounded-xl border border-[#EEF1F6] dark:border-slate-700">
              <button
                type="button"
                onClick={() => onViewProfile(connection)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#111827] dark:text-slate-200 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-800 cursor-pointer"
              >
                <UserRound size={15} />
                View
              </button>
              {isIncomingPending ? (
                <div className="grid grid-cols-2 divide-x divide-[#E8ECF4] dark:divide-slate-700">
                  <button
                    type="button"
                    disabled={isBusy("reject")}
                    onClick={() => onRespond(connection, "reject")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#B23A3A] dark:text-red-400 transition hover:bg-[#FFF7F7] dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isBusy("accept")}
                    onClick={() => onRespond(connection, "accept")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    Accept
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#8891A7] dark:text-slate-500 disabled:cursor-not-allowed"
                >
                  <Clock3 size={18} />
                  Requested
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] dark:divide-slate-700 overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6] dark:border-slate-700">
              <button
                type="button"
                disabled={isBusy("reconnect")}
                onClick={() => onReconnect(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <Users size={18} />
                Reconnect
              </button>
              <button
                type="button"
                onClick={() => onViewProfile(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] dark:text-slate-200 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-800 cursor-pointer"
              >
                <UserRound size={18} />
                View
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#F0F2F7] dark:border-slate-800 pt-4 text-sm text-[#7A849A] dark:text-slate-400">
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
    <div className="rounded-[24px] border border-[#EEF1F6] dark:border-slate-800 bg-white dark:bg-[#151D2E] px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#172033] dark:text-slate-100">{title}</h3>
      <div className="mt-5 border-t border-[#EEF2F8] dark:border-slate-800" />
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
  allConnections = [],
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
  const [showMobileChat, setShowMobileChat] = useState(!!(chatConnection?.profile?._id || chatConnection?._id));
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

  // Combine loaded chat threads with active accepted connections so user can message any connection
  const mergedThreads = useMemo(() => {
    const map = new Map();
    threads.forEach((t) => {
      if (t.profile?._id) map.set(String(t.profile._id), t);
    });

    allConnections.forEach((conn) => {
      const id = String(conn.profile?._id || conn._id || "");
      if (id && !map.has(id)) {
        map.set(id, {
          profile: conn.profile || conn,
          lastMessage: null,
          unreadCount: 0,
          is_online: conn.is_online || false,
        });
      }
    });

    return Array.from(map.values());
  }, [threads, allConnections]);

  const activeThread = useMemo(
    () => mergedThreads.find((thread) => String(thread.profile?._id) === String(activePeerId)) || null,
    [mergedThreads, activePeerId]
  );

  const filteredThreads = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return mergedThreads;

    return mergedThreads.filter((thread) => {
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
  }, [mergedThreads, search]);

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

  const renderStatusTicks = (message) => {
    if (String(message.senderId) !== String(currentUserId)) return null;
    const status = message.status || (message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent");
    if (status === "read") {
      return (
        <span title="Read" className="text-[#53bdeb] font-bold text-xs inline-flex ml-1.5 align-middle select-none">
          ✓✓
        </span>
      );
    }
    if (status === "delivered") {
      return (
        <span title="Delivered" className="text-[#8696a0] font-bold text-xs inline-flex ml-1.5 align-middle select-none">
          ✓✓
        </span>
      );
    }
    return (
      <span title="Sent" className="text-[#8696a0] font-bold text-xs inline-flex ml-1.5 align-middle select-none">
        ✓
      </span>
    );
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] max-h-[900px]">
      <div className="flex h-full gap-4 overflow-hidden min-h-0 rounded-[20px] lg:rounded-[24px] border border-[#E7ECF5] dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        {/* Chat List Pane */}
        <aside
          className={`flex flex-col h-full overflow-hidden border-r border-[#EEF2F8] dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 w-full lg:w-[360px] shrink-0 ${
            showMobileChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#172033] dark:text-white">Chats</h2>
              <p className="mt-0.5 text-xs sm:text-sm text-[#7A849A] dark:text-slate-400">All accepted connections</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6EBF4] dark:border-slate-700 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#28324B] dark:text-slate-200 transition hover:bg-[#F8FAFD] dark:hover:bg-slate-700 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Close
            </button>
          </div>

          <div className="relative mt-4 shrink-0">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B3B9CC] dark:text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats..."
              className="h-11 w-full rounded-xl border border-[#DDE4F0] dark:border-slate-700 bg-[#F8FAFE] dark:bg-slate-900 pl-10 pr-4 text-sm text-[#1A2540] dark:text-slate-100 outline-none placeholder:text-[#A4ADC1] dark:placeholder:text-slate-400 focus:ring-2 focus:ring-[#8E1B2E]/10"
            />
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {threadsLoading ? (
              <div className="rounded-xl border border-dashed border-[#E4E9F2] dark:border-slate-700 px-4 py-8 text-center text-sm text-[#8E97AD] dark:text-slate-400">
                Loading chats...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E4E9F2] dark:border-slate-700 px-4 py-8 text-center text-sm text-[#8E97AD] dark:text-slate-400">
                No chats found.
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.threadId || thread.profile?._id}
                  type="button"
                  onClick={() => openPeer(thread.profile?._id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition cursor-pointer ${
                    String(activePeerId) === String(thread.profile?._id)
                      ? "border-[#B52B2B] bg-[#FFF7F7] dark:bg-red-950/40"
                      : "border-[#EEF1F6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#FBFCFF] dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatarFor(thread)}
                      alt={connectionName(thread)}
                      className="h-12 w-12 rounded-full object-cover border border-gray-100 dark:border-slate-700"
                    />
                    {thread.is_online ? (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#34C759] border-2 border-white dark:border-slate-800" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-[#18213A] dark:text-white">
                        {connectionName(thread)}
                      </div>
                      {thread.unreadCount ? (
                        <span className="rounded-full bg-[#25D366] px-2 py-0.5 text-[11px] font-bold text-white shrink-0">
                          {thread.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-[#8390AA] dark:text-slate-400 mt-0.5">
                      {thread.lastMessage?.text
                        ? thread.lastMessage.text
                        : thread.lastMessage?.kind === "file"
                        ? "📎 Attachment"
                        : "Start chatting"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Conversation Pane (WhatsApp Wallpaper & Bubble Styling) */}
        <section
          className={`flex flex-col h-full overflow-hidden w-full flex-1 bg-[#efeae2] dark:bg-slate-950 bg-[radial-gradient(#00000008_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] ${
            showMobileChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#E0E5EC] dark:border-slate-800 bg-[#f0f2f5] dark:bg-slate-900 px-4 py-3 shrink-0 shadow-2xs">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMobileChat(false)}
                className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-full text-[#54656f] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                aria-label="Back to chats list"
              >
                <ArrowLeft size={20} />
              </button>
              <img
                src={avatarFor(activePeerProfile || chatConnection || {})}
                alt={connectionName(activePeerProfile || chatConnection || {})}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover shrink-0 border border-white dark:border-slate-700"
              />
              <div className="min-w-0">
                <h3 className="truncate text-base sm:text-lg font-bold tracking-tight text-[#111b21] dark:text-white">
                  {connectionName(activePeerProfile || chatConnection || {})}
                </h3>
                <p className="truncate text-xs text-[#667781] dark:text-slate-400">
                  {activeThread?.is_online ? "online" : connectionMeta(activePeerProfile || chatConnection || {})}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => initiateCall(activePeerProfile || chatConnection, "audio")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0284c7] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0369a1] shadow-xs cursor-pointer"
                title="Voice Call"
              >
                <Phone size={15} />
                <span className="hidden sm:inline">Voice Call</span>
              </button>

              <button
                type="button"
                onClick={() => initiateCall(activePeerProfile || chatConnection, "video")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#179B4B] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#13823E] shadow-xs cursor-pointer"
                title="Video Call"
              >
                <Video size={15} />
                <span className="hidden sm:inline">Video Call</span>
              </button>

              <button
                type="button"
                onClick={() => onSchedule(scheduleTarget)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#B52B2B] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#972222]"
                title="Schedule meeting"
              >
                <CalendarDays size={15} />
                <span className="hidden sm:inline">Schedule</span>
              </button>
            </div>
          </div>

          {error ? (
            <div className="border-b border-[#F2D6D6] dark:border-red-900 bg-[#FFF6F6] dark:bg-red-950/40 px-4 py-2 text-xs text-[#B23A3A] dark:text-red-300 shrink-0">
              {error}
            </div>
          ) : null}

          {/* WhatsApp Messages Canvas */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 min-h-0">
            {messagesLoading ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-6 py-12 text-center text-sm text-[#54656f] dark:text-slate-300 shadow-xs">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-6 py-12 text-center text-sm text-[#54656f] dark:text-slate-300 shadow-xs">
                🔒 Messages end-to-end encrypted. Say Hi to start chatting!
              </div>
            ) : (
              groupMessagesByDay(messages).map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="flex items-center justify-center my-2">
                    <span className="rounded-lg bg-white/90 dark:bg-slate-800/90 px-3 py-1 text-[11px] font-semibold text-[#54656f] dark:text-slate-300 shadow-2xs uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.messages.map((message) => {
                    const isMine = String(message.senderId) === String(currentUserId);
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`relative max-w-[85%] sm:max-w-[70%] min-w-[120px] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] break-words overflow-hidden ${
                            isMine
                              ? "bg-[#d9fdd3] dark:bg-emerald-950 text-[#111b21] dark:text-emerald-100 rounded-tr-xs"
                              : "bg-white dark:bg-slate-800 text-[#111b21] dark:text-slate-100 rounded-tl-xs"
                          }`}
                        >
                          {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                          {renderAttachment(message)}
                          <div className="mt-1 flex items-center justify-end text-[10px] text-[#667781] dark:text-slate-400 select-none">
                            <span>{formatChatTime(message.createdAt)}</span>
                            {renderStatusTicks(message)}
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

          {/* WhatsApp Form Input Bar */}
          <form onSubmit={sendTextMessage} className="border-t border-[#e9edef] dark:border-slate-800 bg-[#f0f2f5] dark:bg-slate-900 px-3 sm:px-4 py-3 shrink-0">
            <div className="relative flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 px-3 py-1.5 shadow-2xs border border-[#e9edef] dark:border-slate-700">
              {emojiOpen ? (
                <div className="absolute bottom-full left-2 mb-3 rounded-2xl border border-[#E6EBF4] dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xl z-30">
                  <div className="grid grid-cols-6 gap-2">{emojiList.map(emojiButton)}</div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setEmojiOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] dark:text-slate-300 transition hover:bg-black/5 dark:hover:bg-white/5 shrink-0 cursor-pointer"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] dark:text-slate-300 transition hover:bg-black/5 dark:hover:bg-white/5 shrink-0 cursor-pointer"
                aria-label="Attach file"
              >
                <Paperclip size={19} />
              </button>

              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition shrink-0 cursor-pointer ${
                  recording ? "bg-[#B52B2B] text-white" : "text-[#54656f] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                aria-label="Voice note"
              >
                {recording ? <Square size={16} /> : <Mic size={19} />}
              </button>

              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={recording ? `Recording ${recordingSeconds}s...` : "Type a message..."}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#111b21] dark:text-slate-100 outline-none placeholder:text-[#8696a0] dark:placeholder:text-slate-400"
                disabled={recording}
              />

              <button
                type="submit"
                disabled={sending || recording || (!draft.trim() && !recording)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-white transition hover:bg-[#008f70] disabled:cursor-not-allowed disabled:opacity-50 shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send size={16} />
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

  // Sync chat panel with ?section=chat
  useEffect(() => {
    if (searchParams.get("section") === "chat") {
      if (!chatConnection) {
        const firstActive = groups?.active?.[0] || { profile: { _id: "" } };
        setChatConnection(firstActive);
      }
    } else {
      // Not in chat mode: immediately close chat section so connections page displays
      setChatConnection(null);
    }
  }, [searchParams, groups]);

  const currentItems = useMemo(() => {
    const source = groups[tab] || [];
    const value = search.trim().toLowerCase();
    if (!value) return source;

    return source.filter((connection) => {
      const haystack = [
        connectionName(connection),
        connectionMeta(connection),
        connection.profile?.company_name,
        connection.profile?.name,
        connection.profile?.email,
        connection.profile?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [groups, search, tab]);

  const pageCountLabel = useMemo(() => {
    const count = summary[tab] || (tab === "pending" ? summary.pending_requests : 0) || 0;
    if (tab === "active") {
      return `You have ${count} active connection${count === 1 ? "" : "s"}`;
    }
    if (tab === "online") {
      return `You have ${count} online connection${count === 1 ? "" : "s"}`;
    }
    if (tab === "pending") {
      return `You have ${count} pending connection request${count === 1 ? "" : "s"}`;
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
    navigate("/connections?section=chat");
  };

  const closeChat = () => {
    setChatConnection(null);
    navigate("/connections");
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

      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-gray-800 dark:text-slate-100 lg:ml-75 pt-16 lg:pt-0">
        <div className="sticky top-0 z-20 border-b border-gray-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#151D2E]/95 backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 xl:flex-row xl:items-center xl:justify-between xl:px-10">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Connections
            </h1>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 w-full xl:w-auto">
              <TabButton active={tab === "active"} onClick={() => setTab("active")}>
                Active ({summary.active || 0})
              </TabButton>
              <TabButton active={tab === "online"} onClick={() => setTab("online")}>
                Online ({summary.online || 0})
              </TabButton>
              <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
                Pending ({summary.pending_requests || summary.pending || 0})
              </TabButton>
              <TabButton active={tab === "rejected"} onClick={() => setTab("rejected")}>
                Rejected ({summary.rejected || 0})
              </TabButton>
            </div>
          </div>
        </div>

        {chatConnection ? (
          <ChatWorkspace
            currentUserId={user?._id}
            currentUserName={user?.name}
            chatConnection={chatConnection}
            allConnections={groups.active || []}
            onClose={closeChat}
            onSchedule={scheduleCall}
          />
        ) : (
          <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:px-10 max-w-full overflow-hidden">
            <main className="space-y-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <p className="text-[22px] font-medium tracking-tight text-[#12213D] dark:text-slate-200">
                  {pageCountLabel}
                </p>

                <div className="relative w-full xl:max-w-[490px]">
                  <Search
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B9CC] dark:text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search a connection"
                    className="h-[54px] w-full rounded-2xl border border-[#DDE4F0] dark:border-slate-700 bg-white dark:bg-[#151D2E] pl-12 pr-4 text-[16px] text-[#1A2540] dark:text-slate-100 outline-none placeholder:text-[#A4ADC1] dark:placeholder:text-slate-400 focus:ring-2 focus:ring-[#8E1B2E]/10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="rounded-[24px] border border-[#E7ECF5] dark:border-slate-800 bg-white dark:bg-[#151D2E] p-10 text-center text-[#607086] dark:text-slate-400 shadow-xs">
                  Loading connections...
                </div>
              ) : error ? (
                <div className="rounded-[24px] border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-10 text-center text-red-700 dark:text-red-400 shadow-xs">
                  {error}
                </div>
              ) : currentItems.length === 0 ? (
                <div className="rounded-[24px] border border-[#E7ECF5] dark:border-slate-800 bg-white dark:bg-[#151D2E] p-10 text-center text-[#607086] dark:text-slate-400 shadow-xs">
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
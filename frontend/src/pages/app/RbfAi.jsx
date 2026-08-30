import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Copy,
  Check,
  Loader2,
  MessageSquare,
  Clock,
  Shield,
  Layers,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ThumbsUp,
  ThumbsDown,
  X,
  ArrowDown,
  Edit3,
  Square,
  Lock,
  Crown,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import { io } from "socket.io-client";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import { toast } from "react-toastify";
import { COLORS } from "../../components/colors";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { isModuleLocked } from "../../config/subscriptionModules";

// ─────────────────────────────────────────────────────────────
// PERSISTENT IN-MEMORY CACHE (PREVENTS RE-FETCH ON RE-RENDERS)
// ─────────────────────────────────────────────────────────────
let cachedSessionsList = null;
let cachedBotInfo = null;
const messagesMemoryCache = new Map(); // sessionId -> messages[]

const QUICK_PROMPTS = [
  {
    title: "Valuation & Cap Table",
    prompt: "How do I calculate a defensible valuation for my pre-revenue startup before raising seed funding?",
    icon: "💰",
    category: "Fundraising",
  },
  {
    title: "Claim Booster Cloud Perks",
    prompt: "Explain what cloud credits and tools are included in the RealBell Business Booster Kit and how to claim them.",
    icon: "⚡",
    category: "Booster Perks",
  },
  {
    title: "Incubation Pitch Review",
    prompt: "What are the key evaluation criteria for top incubation and accelerator program applications?",
    icon: "🏆",
    category: "Incubation",
  },
  {
    title: "SAFE & Term Sheet Clauses",
    prompt: "What are the standard founder-friendly clauses to look for in a SAFE / convertible note term sheet?",
    icon: "⚖️",
    category: "Legal",
  },
];

export default function RbfAi() {
  const { user } = useStore();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";

  // Check if AI module is locked for current user tier (Free tier or non-subscribed)
  const isLocked = isModuleLocked(user, "rbf_ai");

  const [sessions, setSessions] = useState(() => cachedSessionsList || []);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return cachedSessionsList && cachedSessionsList.length > 0 ? cachedSessionsList[0]._id : null;
  });
  const [messages, setMessages] = useState(() => {
    const initialId = cachedSessionsList && cachedSessionsList.length > 0 ? cachedSessionsList[0]._id : null;
    return initialId && messagesMemoryCache.has(initialId) ? messagesMemoryCache.get(initialId) : [];
  });
  const [inputValue, setInputValue] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(() => !cachedSessionsList && !isLocked);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [botInfo, setBotInfo] = useState(() => cachedBotInfo || {
    botName: "Mr. Doom",
    provider: "groq",
    modelName: "gpt-oss 120b",
  });
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  // Responsive Sidebar States (ChatGPT Style)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const socketRef = useRef(null);
  const activeTempIdRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    document.title = "RBF-AI • Mr. Doom Strategic Intelligence | RealBell Business Foundation";
  }, []);

  // ─────────────────────────────────────────────────────────────
  // SOCKET.IO REAL-TIME STREAMING SETUP (REDIS-BACKED)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLocked) return;

    const socket = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: {
        userId: user?._id,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Socket connected
    });

    // Real-time token chunk received from LLM
    socket.on("ai:chat:chunk", ({ sessionId, tempId, chunk, accumulated }) => {
      setMessages((prev) => {
        const existingIdx = prev.findIndex(
          (m) => m._id === `stream-${tempId}` || m.tempId === tempId
        );

        let updated;
        if (existingIdx !== -1) {
          updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            content: accumulated,
            isStreaming: true,
          };
        } else {
          updated = [
            ...prev,
            {
              _id: `stream-${tempId}`,
              tempId,
              role: "assistant",
              content: accumulated,
              isStreaming: true,
              createdAt: new Date().toISOString(),
            },
          ];
        }

        if (sessionId) {
          messagesMemoryCache.set(sessionId, updated);
        }
        return updated;
      });
    });

    // Stream completed and persisted
    socket.on("ai:chat:done", ({ sessionId, tempId, userMessage, assistantMessage, session }) => {
      setSending(false);
      activeTempIdRef.current = null;

      const targetSessionId = session?._id || sessionId;

      if (session?._id) {
        setActiveSessionId(session._id);
        setSessions((prev) => {
          const exists = prev.some((s) => s._id === session._id);
          const next = !exists ? [session, ...prev] : prev.map((s) => (s._id === session._id ? session : s));
          cachedSessionsList = next;
          return next;
        });
      }

      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => m._id !== `temp-${tempId}` && m._id !== `stream-${tempId}` && m.tempId !== tempId
        );
        const finalMessages = [...filtered, userMessage, assistantMessage];
        if (targetSessionId) {
          messagesMemoryCache.set(targetSessionId, finalMessages);
        }
        return finalMessages;
      });
    });

    socket.on("ai:chat:stopped", () => {
      setSending(false);
      activeTempIdRef.current = null;
      setMessages((prev) => {
        const updated = prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m));
        if (activeSessionId) {
          messagesMemoryCache.set(activeSessionId, updated);
        }
        return updated;
      });
    });

    socket.on("ai:chat:error", ({ msg, code }) => {
      setSending(false);
      activeTempIdRef.current = null;
      if (code === "SUBSCRIPTION_REQUIRED") {
        toast.error("RBF-AI is a Premium feature. Please upgrade your subscription.");
      } else {
        toast.error(msg || "Streaming failed");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [backendUrl, user?._id, isLocked, activeSessionId]);

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (!isLocked) {
      scrollToBottom(true);
    }
  }, [messages, sending, isLocked]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isUp);
  };

  // ─────────────────────────────────────────────────────────────
  // INITIAL DATA FETCH (RUNS ONCE, SUBSEQUENT RENDERS USE CACHE)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLocked) return;

    // 1. Fetch Bot Info (only if not already cached)
    if (!cachedBotInfo) {
      axios
        .get("/ai/info")
        .then((res) => {
          if (res.data?.status === 1) {
            cachedBotInfo = res.data.bot;
            setBotInfo(res.data.bot);
          }
        })
        .catch((e) => console.warn("Bot info load warn", e));
    }

    // 2. Fetch Sessions List (only if not already cached)
    if (!cachedSessionsList) {
      setLoadingSessions(true);
      axios
        .get("/ai/sessions")
        .then((res) => {
          if (res.data?.status === 1) {
            const list = res.data.sessions || [];
            cachedSessionsList = list;
            setSessions(list);
            if (list.length > 0) {
              setActiveSessionId((prev) => prev || list[0]._id);
            }
          }
        })
        .catch((e) => console.error("Error fetching sessions", e))
        .finally(() => setLoadingSessions(false));
    }
  }, [isLocked]);

  // ─────────────────────────────────────────────────────────────
  // LOAD MESSAGES FOR ACTIVE SESSION (WITH INSTANT MEMORY CACHE)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSessionId || isLocked) {
      if (!activeSessionId) setMessages([]);
      return;
    }

    // Check Memory Cache First: Instant 0ms Load
    if (messagesMemoryCache.has(activeSessionId)) {
      setMessages(messagesMemoryCache.get(activeSessionId));
      return;
    }

    // If Not in Cache, Fetch from API and Store in Cache
    setLoadingMessages(true);
    axios
      .get(`/ai/sessions/${activeSessionId}/messages`)
      .then((res) => {
        if (res.data?.status === 1) {
          const msgs = res.data.messages || [];
          messagesMemoryCache.set(activeSessionId, msgs);
          setMessages(msgs);
        }
      })
      .catch((e) => console.error("Error loading messages", e))
      .finally(() => setLoadingMessages(false));
  }, [activeSessionId, isLocked]);

  const handleCreateNewSession = async () => {
    if (isLocked) {
      navigate("/subscription");
      return;
    }
    try {
      const res = await axios.post("/ai/sessions", { title: "New Strategy Session" });
      if (res.data?.status === 1) {
        const newSession = res.data.session;
        const updatedList = [newSession, ...sessions];
        cachedSessionsList = updatedList;
        setSessions(updatedList);
        setActiveSessionId(newSession._id);
        messagesMemoryCache.set(newSession._id, []);
        setMessages([]);
        setMobileDrawerOpen(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to create new conversation");
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat thread?")) return;
    try {
      const res = await axios.delete(`/ai/sessions/${sessionId}`);
      if (res.data?.status === 1) {
        const remaining = sessions.filter((s) => s._id !== sessionId);
        cachedSessionsList = remaining;
        setSessions(remaining);
        messagesMemoryCache.delete(sessionId);

        if (activeSessionId === sessionId) {
          const nextId = remaining[0]?._id || null;
          setActiveSessionId(nextId);
          setMessages(nextId && messagesMemoryCache.has(nextId) ? messagesMemoryCache.get(nextId) : []);
        }
        toast.success("Conversation deleted");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete conversation");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // REAL-TIME STREAMING MESSAGE DISPATCH
  // ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (customPrompt) => {
    if (isLocked) {
      navigate("/subscription");
      return;
    }

    const textToSend = customPrompt || inputValue;
    if (!textToSend || !textToSend.trim() || sending) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }

    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    activeTempIdRef.current = tempId;

    const optimisticUserMsg = {
      _id: `temp-${tempId}`,
      role: "user",
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    const optimisticStreamMsg = {
      _id: `stream-${tempId}`,
      tempId,
      role: "assistant",
      content: "",
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, optimisticUserMsg, optimisticStreamMsg];
      if (activeSessionId) {
        messagesMemoryCache.set(activeSessionId, next);
      }
      return next;
    });
    setSending(true);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(
        "ai:chat:stream",
        {
          sessionId: activeSessionId,
          message: textToSend.trim(),
          tempId,
        },
        (ack) => {
          if (ack && ack.status === 0) {
            toast.error(ack.msg || "Failed to initiate stream");
            setSending(false);
          }
        }
      );
    } else {
      try {
        const res = await axios.post("/ai/chat", {
          sessionId: activeSessionId,
          message: textToSend.trim(),
        });

        if (res.data?.status === 1) {
          const targetSessionId = res.data.session?._id || activeSessionId;

          if (!activeSessionId || activeSessionId !== res.data.session?._id) {
            setActiveSessionId(res.data.session._id);
            setSessions((prev) => {
              const exists = prev.some((s) => s._id === res.data.session._id);
              const next = !exists ? [res.data.session, ...prev] : prev.map((s) => (s._id === res.data.session._id ? res.data.session : s));
              cachedSessionsList = next;
              return next;
            });
          }

          setMessages((prev) => {
            const next = [
              ...prev.filter((m) => m._id !== optimisticUserMsg._id && m._id !== optimisticStreamMsg._id),
              res.data.userMessage,
              res.data.assistantMessage,
            ];
            if (targetSessionId) {
              messagesMemoryCache.set(targetSessionId, next);
            }
            return next;
          });
        }
      } catch (err) {
        console.error("HTTP chat error:", err);
        toast.error(err.response?.data?.msg || "Failed to send message");
      } finally {
        setSending(false);
        activeTempIdRef.current = null;
      }
    }
  };

  const handleStopStreaming = () => {
    if (!sending) return;
    const socket = socketRef.current;
    if (socket && socket.connected && activeTempIdRef.current) {
      socket.emit("ai:chat:stop", { tempId: activeTempIdRef.current });
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleFeedback = (msgId, type) => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));
    toast.info(type === "up" ? "Thanks for your feedback!" : "Feedback recorded.");
  };

  const filteredSessions = sessions.filter((s) =>
    (s.title || "").toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col font-sans antialiased text-gray-800 dark:text-slate-200">

        {/* ═══════════════════════════════════════════════════════════════════════
            PREMIUM SUBSCRIPTION PAYWALL (WHEN USER IS ON FREE TIER)
           ═══════════════════════════════════════════════════════════════════════ */}
        {isLocked ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl w-full rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 shadow-2xl p-6 sm:p-10 text-center space-y-7 relative overflow-hidden animate-fadeIn">

              {/* Glowing Ambient Aura */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#8B1D2C]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#8B1D2C]/15 to-amber-500/15 text-[#8B1D2C] dark:text-rose-400 border border-[#8B1D2C]/30 shadow-xs">
                <Crown size={14} className="text-amber-500 fill-amber-500" />
                <span>Premium AI Copilot Exclusive</span>
              </div>

              {/* Central Lock & Bot Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#8B1D2C] via-[#6a1522] to-[#3a0810] text-white shadow-2xl shadow-[#8B1D2C]/35">
                    <Bot size={44} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md font-bold">
                    <Lock size={15} />
                  </div>
                </div>
              </div>

              {/* Headings */}
              <div className="space-y-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
                  Unlock <span className="text-[#8B1D2C] dark:text-rose-400">{botInfo.botName || "Mr. Doom"}</span> Strategic AI
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Real-time AI startup valuation modeling, pitch deck reviews, cloud booster strategy, and investor matchmaking intelligence is exclusively available on <strong>Pro Growth</strong> and <strong>Enterprise VIP</strong> subscription plans.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200/70 dark:border-slate-800">
                  <div className="text-lg mb-1.5">💡</div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 mb-1">
                    Startup Strategist
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    Valuation, term sheets, cap table analysis & pitch coaching.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200/70 dark:border-slate-800">
                  <div className="text-lg mb-1.5">⚡</div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 mb-1">
                    Booster Kit Perks
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    ₹25L+ in AWS, Google Cloud & Stripe credit navigation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200/70 dark:border-slate-800">
                  <div className="text-lg mb-1.5">🤝</div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 mb-1">
                    Investor Matchmaking
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                    Personalized matchmaking & customized outreach memos.
                  </p>
                </div>
              </div>

              {/* Current Tier Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-500 shrink-0" />
                  <span>Current Tier: <strong>{user?.subscription?.planName || "Starter Free"}</strong> (AI Copilot Gated)</span>
                </div>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Free Tier
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate("/subscription")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl py-3.5 px-8 font-bold text-xs sm:text-sm text-white transition shadow-lg shadow-[#8B1D2C]/25 hover:opacity-95 active:scale-[0.98] cursor-pointer"
                  style={{ background: COLORS.primary }}
                >
                  <Sparkles size={16} className="text-amber-300 fill-amber-300" />
                  <span>Upgrade Subscription to Unlock</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto rounded-2xl py-3.5 px-6 font-bold text-xs sm:text-sm text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Instant Activation
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Secure Razorpay
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Cancel Anytime
                </span>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden min-h-0 h-full w-full relative">

            {/* ═══════════════════════════════════════════════════════════════════════
                DESKTOP & MOBILE SIDEBAR (CHATGPT DRAWER)
               ═══════════════════════════════════════════════════════════════════════ */}
            <aside
              className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-[#111827] border-r border-gray-200/80 dark:border-slate-800/90 flex flex-col h-full max-h-full overflow-hidden transition-all duration-300 ease-in-out lg:static ${
                mobileDrawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
              } ${
                desktopSidebarOpen ? "lg:w-72 xl:w-80" : "lg:w-0 lg:border-r-0 lg:overflow-hidden"
              }`}
            >
              {/* Drawer Header */}
              <div className="p-3.5 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8B1D2C]/15 border border-[#8B1D2C]/30 text-[#8B1D2C] dark:text-rose-400">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100 truncate">
                      {botInfo.botName || "Mr. Doom"}
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      RBF Strategy AI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                    title="Close sidebar"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={() => setDesktopSidebarOpen(false)}
                    className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </div>
              </div>

              {/* "+ New Chat" Button */}
              <div className="p-3 shrink-0">
                <button
                  onClick={handleCreateNewSession}
                  className="w-full flex items-center justify-between rounded-xl py-2.5 px-3.5 font-bold text-xs text-white transition shadow-sm hover:opacity-95 active:scale-[0.98] cursor-pointer"
                  style={{ background: COLORS.primary }}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>New Conversation</span>
                  </div>
                  <Edit3 size={14} className="opacity-80" />
                </button>
              </div>

              {/* Search Threads */}
              <div className="px-3 pb-2 shrink-0">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search past threads..."
                    className="w-full rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 pl-8 pr-3 py-1.5 text-xs text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              {/* Conversation Threads List */}
              <div className="flex-1 overflow-y-auto min-h-0 px-2 space-y-1 py-1 custom-scrollbar">
                <div className="px-3 pb-1 text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Recent Chats
                </div>

                {loadingSessions ? (
                  <div className="p-6 text-center text-xs text-gray-400 dark:text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-[#8B1D2C]" />
                    <span>Loading history...</span>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 dark:text-slate-500 italic">
                    {sessionSearch ? "No matching chats found." : "No conversations yet."}
                  </div>
                ) : (
                  filteredSessions.map((sess) => {
                    const isActive = sess._id === activeSessionId;
                    return (
                      <div
                        key={sess._id}
                        onClick={() => {
                          setActiveSessionId(sess._id);
                          setMobileDrawerOpen(false);
                        }}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                          isActive
                            ? "bg-[#8B1D2C]/10 text-[#8B1D2C] dark:text-rose-400 border border-[#8B1D2C]/25 shadow-2xs"
                            : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <MessageSquare size={14} className="shrink-0 opacity-70" />
                          <span className="truncate">{sess.title || "Strategy Session"}</span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSession(e, sess._id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-1 cursor-pointer shrink-0"
                          title="Delete chat"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Provider & Model Footer Badge */}
              <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/60 text-[11px] text-gray-500 dark:text-slate-400 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="truncate font-semibold uppercase">{botInfo.provider}</span>
                  <span>•</span>
                  <span className="truncate font-mono text-[10px] text-gray-400">{botInfo.modelName}</span>
                </div>
              </div>
            </aside>

            {/* Backdrop on mobile */}
            {mobileDrawerOpen && (
              <div
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
              />
            )}

            {/* ═══════════════════════════════════════════════════════════════════════
                MAIN: CHAT STREAM & FLOATING INPUT (CHATGPT STYLE)
               ═══════════════════════════════════════════════════════════════════════ */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19] relative">

              {/* Top Navbar Header */}
              <header className="h-14 px-3 sm:px-6 border-b border-gray-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#151D2E]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setMobileDrawerOpen(true)}
                    className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition"
                    title="Open chat sidebar"
                  >
                    <PanelLeftOpen size={17} />
                  </button>

                  {!desktopSidebarOpen && (
                    <button
                      onClick={() => setDesktopSidebarOpen(true)}
                      className="hidden lg:flex p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition"
                      title="Expand sidebar"
                    >
                      <PanelLeftOpen size={17} />
                    </button>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B1D2C] to-[#590e19] text-white shadow-md shadow-[#8B1D2C]/20 shrink-0">
                      <Bot size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100">
                          {botInfo.botName || "Mr. Doom"}
                        </h2>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#8B1D2C]/10 text-[#8B1D2C] dark:text-rose-400 border border-[#8B1D2C]/20 uppercase tracking-wider">
                          <Sparkles size={10} className="text-amber-400 fill-amber-400" />
                          <span>Streaming Active</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span>Redis Stream Ready</span>
                        <span className="text-gray-300 dark:text-slate-600">•</span>
                        <span className="truncate">{botInfo.modelName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateNewSession}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">New Chat</span>
                  </button>
                </div>
              </header>

              {/* Message Stream Feed */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6 custom-scrollbar"
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C] mx-auto mb-3" />
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                      Loading conversation history...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  /* Empty Greeting State (ChatGPT Style) */
                  <div className="max-w-2xl mx-auto py-8 sm:py-16 text-center space-y-8 animate-fadeIn">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#8B1D2C] via-[#6e1524] to-[#400a12] text-white shadow-xl shadow-[#8B1D2C]/25 mb-4">
                        <Bot size={32} />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
                        Greetings, {user?.name || "Founder"}. I am {botInfo.botName || "Mr. Doom"}.
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                        Your strategic startup advisor and ecosystem intelligence copilot. Ask me about venture fundraising, valuation, incubation cohorts, booster perks, and legal compliance.
                      </p>
                    </div>

                    {/* Quick Starter Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {QUICK_PROMPTS.map((qp, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSendMessage(qp.prompt)}
                          className="group p-4 rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 hover:border-[#8B1D2C]/40 dark:hover:border-[#8B1D2C]/40 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-lg">{qp.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                              {qp.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#8B1D2C] dark:group-hover:text-rose-400 transition mb-1">
                            {qp.title}
                          </h4>
                          <p className="text-[11.5px] text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {qp.prompt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message Bubbles */
                  <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((msg, index) => {
                      const isUser = msg.role === "user";
                      const isStreamingThis = msg.isStreaming && !msg.content;

                      return (
                        <div
                          key={msg._id || index}
                          className={`flex items-start gap-2.5 sm:gap-4 ${
                            isUser ? "justify-end" : "justify-start"
                          } animate-fadeIn`}
                        >
                          {/* Avatar (Left on Assistant) */}
                          {!isUser && (
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B1D2C] to-[#590e19] text-white shadow-md shadow-[#8B1D2C]/20 shrink-0 mt-0.5">
                              <Bot size={17} />
                            </div>
                          )}

                          {/* Bubble Container */}
                          <div
                            className={`relative max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-xs ${
                              isUser
                                ? "bg-[#8B1D2C] text-white rounded-tr-xs"
                                : "bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 text-gray-800 dark:text-slate-200 rounded-tl-xs w-full"
                            }`}
                          >
                            {/* Top Tag for Assistant */}
                            {!isUser && (
                              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-gray-100 dark:border-slate-800/80 text-[10.5px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 text-[#8B1D2C] dark:text-rose-400 font-extrabold">
                                  <Sparkles size={11} className="text-amber-400 fill-amber-400" />
                                  <span>{botInfo.botName || "Mr. Doom"}</span>
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                  {msg.modelUsed || botInfo.modelName}
                                </span>
                              </div>
                            )}

                            {/* Content */}
                            {isUser ? (
                              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {msg.content}
                              </div>
                            ) : isStreamingThis ? (
                              <div className="flex items-center gap-2 py-1 text-xs text-gray-400 dark:text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-[#8B1D2C] animate-bounce" />
                                <span className="h-2 w-2 rounded-full bg-[#8B1D2C] animate-bounce [animation-delay:0.2s]" />
                                <span className="h-2 w-2 rounded-full bg-[#8B1D2C] animate-bounce [animation-delay:0.4s]" />
                                <span className="ml-1 font-semibold">{botInfo.botName || "Mr. Doom"} is thinking...</span>
                              </div>
                            ) : (
                              <div className="relative">
                                <MarkdownRenderer content={msg.content} />
                                {msg.isStreaming && (
                                  <span className="inline-block w-2 h-4 ml-1 bg-[#8B1D2C] animate-pulse rounded-xs align-middle" />
                                )}
                              </div>
                            )}

                            {/* Action Footer for Assistant Response */}
                            {!isUser && !msg.isStreaming && (
                              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-gray-400 text-xs">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleCopyMessage(msg._id || index, msg.content)}
                                    className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-[11px] font-medium transition cursor-pointer text-gray-500 dark:text-slate-400"
                                    title="Copy response"
                                  >
                                    {copiedId === (msg._id || index) ? (
                                      <>
                                        <Check size={12} className="text-emerald-500" />
                                        <span className="text-emerald-500 font-bold">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span className="hidden sm:inline">Copy</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleFeedback(msg._id || index, "up")}
                                    className={`p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                                      feedbackGiven[msg._id || index] === "up" ? "text-emerald-500" : ""
                                    }`}
                                    title="Good response"
                                  >
                                    <ThumbsUp size={12} />
                                  </button>

                                  <button
                                    onClick={() => handleFeedback(msg._id || index, "down")}
                                    className={`p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                                      feedbackGiven[msg._id || index] === "down" ? "text-rose-500" : ""
                                    }`}
                                    title="Poor response"
                                  >
                                    <ThumbsDown size={12} />
                                  </button>
                                </div>

                                <div className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1 font-medium">
                                  <Clock size={10} />
                                  <span>
                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString("en-IN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Timestamp on user msg */}
                            {isUser && (
                              <div className="text-[9.5px] mt-1.5 text-rose-200 font-medium flex items-center justify-end gap-1">
                                <Clock size={10} />
                                <span>
                                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Avatar (Right on User) */}
                          {isUser && (
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-xs shrink-0 mt-0.5">
                              <User size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Floating "Scroll to Bottom" Button */}
              {showScrollBottom && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-24 right-6 sm:right-10 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#151D2E] border border-gray-200 dark:border-slate-700 shadow-lg text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all cursor-pointer animate-bounce"
                  title="Scroll to latest message"
                >
                  <ArrowDown size={16} />
                </button>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════
                  FLOATING BOTTOM PROMPT BAR WITH STOP / SEND BUTTON
                 ═══════════════════════════════════════════════════════════════════════ */}
              <div className="p-3 sm:p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent dark:from-[#0B0F19] dark:via-[#0B0F19] dark:to-transparent shrink-0">
                <div className="max-w-3xl mx-auto">
                  <div className="relative flex items-end gap-2 rounded-3xl border border-gray-200/90 dark:border-slate-700/80 bg-white dark:bg-[#151D2E] p-2 sm:p-3 shadow-lg shadow-gray-200/50 dark:shadow-black/40 focus-within:border-[#8B1D2C] focus-within:ring-2 focus-within:ring-[#8B1D2C]/15 transition">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = "48px";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${botInfo.botName || "Mr. Doom"}...`}
                      className="flex-1 max-h-44 min-h-[44px] resize-none bg-transparent py-2 px-3 text-xs sm:text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none leading-relaxed custom-scrollbar"
                    />

                    {sending ? (
                      <button
                        onClick={handleStopStreaming}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl font-bold bg-slate-800 text-white transition shadow-sm shrink-0 cursor-pointer hover:bg-slate-700 active:scale-95"
                        title="Stop generating"
                      >
                        <Square size={15} className="fill-white" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl font-bold text-white transition shadow-sm shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                        style={{ background: COLORS.primary }}
                        title="Send message (Enter)"
                      >
                        <Send size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </main>
          </div>
        )}

      </div>
    </>
  );
}

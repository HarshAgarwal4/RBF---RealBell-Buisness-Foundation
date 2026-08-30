import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar.jsx";
import { useWebNotifications } from "../../hooks/useWebNotifications.js";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Megaphone,
  AlertCircle,
  ExternalLink,
  Trash2,
  Eye,
  FileText,
  Video,
  Download,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCheck,
  X,
} from "lucide-react";

const TYPE_CONFIG = {
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    colorClass: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
    borderLeft: "border-l-purple-500",
  },
  info: {
    label: "Information",
    icon: Info,
    colorClass: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60",
    borderLeft: "border-l-sky-500",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    colorClass: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
    borderLeft: "border-l-amber-500",
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    borderLeft: "border-l-emerald-500",
  },
  error: {
    label: "Alert / Urgent",
    icon: AlertCircle,
    colorClass: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60",
    borderLeft: "border-l-rose-500",
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  normal: { label: "Normal", className: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50" },
  high: { label: "High", className: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50" },
  urgent: { label: "Urgent", className: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50" },
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const {
    permission,
    requestPermission,
    notifications,
    unreadCount,
    loading,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useWebNotifications({ autoPoll: true, pollInterval: 30000 });

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState(null); // { type: 'image' | 'video', url: string, name: string }

  // Refetch when filter or search changes
  useEffect(() => {
    fetchNotifications({
      page,
      limit: 15,
      unreadOnly: activeTab === "unread",
      type: activeTab !== "all" && activeTab !== "unread" ? activeTab : "",
      search: searchQuery,
    });
  }, [activeTab, searchQuery, page, fetchNotifications]);

  const handleEnableWebNotifs = async () => {
    const res = await requestPermission();
    if (res === "granted") {
      new Notification("Browser Notifications Enabled", {
        body: "You will now receive desktop alerts for important RealBell announcements!",
        icon: "/logo.png",
      });
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Remove this notification from your inbox?")) {
      await dismissNotification(id);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-0 lg:ml-75 pt-20 lg:pt-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 sm:p-8 font-sans antialiased text-gray-800 dark:text-slate-200">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200/80 dark:border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8B1D2C]/10 text-[#8B1D2C] dark:text-[#f87171] shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
                      Notifications
                    </h1>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8B1D2C] text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    System broadcasts, updates, programs, and direct messages.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {permission !== "granted" && permission !== "unsupported" && (
                <button
                  type="button"
                  onClick={handleEnableWebNotifs}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Enable Desktop Alerts</span>
                </button>
              )}

              {permission === "granted" && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Desktop Alerts Active</span>
                </div>
              )}

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#151D2E] text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mark All as Read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fetchNotifications({ page, search: searchQuery })}
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-[#151D2E] text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                title="Refresh Notifications"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#8B1D2C]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All", count: null },
                { id: "unread", label: "Unread", count: unreadCount },
                { id: "announcement", label: "Announcements" },
                { id: "info", label: "Info" },
                { id: "warning", label: "Warnings" },
                { id: "success", label: "Success" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#8B1D2C] text-white shadow-xs"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white text-[#8B1D2C]"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0B0F19] text-xs text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Notifications Feed Container */}
          <div className="space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-16 text-center border border-gray-100 dark:border-slate-800 shadow-xs">
                <RefreshCw className="w-8 h-8 animate-spin text-[#8B1D2C] mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Loading your notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white dark:bg-[#151D2E] rounded-2xl p-16 text-center border border-gray-100 dark:border-slate-800 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-slate-500">
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">
                  No Notifications Found
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery || activeTab !== "all"
                    ? "No notifications matching your search or active filter."
                    : "You are all caught up! There are no unread broadcasts."}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
                const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
                const IconComponent = typeCfg.icon;

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (!item.isRead) markAsRead(item._id);
                    }}
                    className={`group relative rounded-2xl p-5 sm:p-6 transition-all border ${
                      item.isRead
                        ? "bg-white dark:bg-[#151D2E] border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
                        : `bg-white dark:bg-[#151D2E] border-gray-200 dark:border-slate-700 border-l-4 ${typeCfg.borderLeft} shadow-sm`
                    }`}
                  >
                    {/* Top Row: Category, Priority, Unread Dot, Timestamp, Dismiss */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Type Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeCfg.colorClass}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{typeCfg.label}</span>
                        </span>

                        {/* Priority Badge */}
                        {item.priority && item.priority !== "normal" && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${priorityCfg.className}`}
                          >
                            {priorityCfg.label}
                          </span>
                        )}

                        {/* New indicator */}
                        {!item.isRead && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8B1D2C] dark:text-rose-400">
                            <span className="h-2 w-2 rounded-full bg-[#8B1D2C] dark:bg-rose-500 animate-pulse" />
                            New
                          </span>
                        )}
                      </div>

                      {/* Time & Dismiss */}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(item.createdAt)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item._id, e)}
                          title="Dismiss notification"
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">
                      {item.title}
                    </h3>

                    {/* Message Body */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">
                      {item.message}
                    </p>

                    {/* Attached Files (Images, Videos, PDFs, Docs) */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mb-4 rounded-xl border border-gray-200/70 dark:border-slate-800 bg-gray-50/70 dark:bg-[#0B0F19]/60 p-3.5">
                        <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <span>📎 Attachments ({item.attachments.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {item.attachments.map((att, idx) => {
                            const isImg =
                              att.file_type === "image" ||
                              /\.(png|jpe?g|webp|gif|svg)$/i.test(att.url);
                            const isVid =
                              att.file_type === "video" ||
                              /\.(mp4|webm|ogg|mov)$/i.test(att.url);
                            const isPdf =
                              att.file_type === "pdf" || /\.pdf$/i.test(att.url);

                            return (
                              <div
                                key={idx}
                                className="group/att overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] flex flex-col justify-between transition hover:shadow-xs"
                              >
                                {isImg ? (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMedia({
                                        type: "image",
                                        url: att.url,
                                        name: att.file_name,
                                      });
                                    }}
                                    className="relative h-28 bg-slate-900 cursor-pointer overflow-hidden"
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.file_name || "Attachment"}
                                      className="h-full w-full object-cover transition group-hover/att:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye className="w-5 h-5" />
                                    </div>
                                  </div>
                                ) : isVid ? (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMedia({
                                        type: "video",
                                        url: att.url,
                                        name: att.file_name,
                                      });
                                    }}
                                    className="relative h-28 bg-slate-900 cursor-pointer flex items-center justify-center text-sky-400"
                                  >
                                    <Video className="w-8 h-8" />
                                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                                      Video
                                    </span>
                                  </div>
                                ) : (
                                  <div className="h-20 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center text-[#8B1D2C] dark:text-[#f87171]">
                                    <FileText className="w-8 h-8" />
                                  </div>
                                )}

                                <div className="p-2.5">
                                  <div
                                    className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate"
                                    title={att.file_name}
                                  >
                                    {att.file_name || "Attachment"}
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                                    <span>{formatBytes(att.file_size)}</span>
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 font-bold text-[#8B1D2C] dark:text-[#f87171] hover:underline"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action URL Button */}
                    {item.action_url && (
                      <div className="pt-1">
                        <a
                          href={item.action_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C2340] dark:bg-[#8B1D2C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#151A31] dark:hover:bg-[#721724] transition-all shadow-xs active:scale-95"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#151D2E] text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ← Previous
              </button>

              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                Page {page} of {pagination.pages}
              </span>

              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#151D2E] text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Media Viewer Modal */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-between text-white px-2">
              <span className="text-sm font-semibold truncate max-w-[80%]">
                {selectedMedia.name || "Attachment Preview"}
              </span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/60 shadow-2xl">
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="max-h-[75vh] max-w-full object-contain rounded-2xl"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-2xl"
                />
              )}
            </div>

            <a
              href={selectedMedia.url}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

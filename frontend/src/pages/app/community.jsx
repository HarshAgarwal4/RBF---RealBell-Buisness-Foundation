import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  Eye,
  File,
  FileText,
  Film,
  Flame,
  Globe,
  Hash,
  Heart,
  ImagePlus,
  MessageCircle,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";

function timeAgo(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initialsFor(post) {
  const source = post?.author?.company_name || post?.author?.name || "Community";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function avatarFor(post) {
  return (
    post?.author?.account?.image ||
    `https://placehold.co/120x120/0F3D4A/FFFFFF?text=${encodeURIComponent(
      initialsFor(post)
    )}`
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ATTACHMENT VIEWER FOR ALL MEDIA, PDF, & DOCUMENT OBJECTS
function AttachmentIframeViewer({ attachment }) {
  if (!attachment?.url) return null;

  const type = attachment.file_type || "document";

  const badgeColorMap = {
    image: "bg-emerald-600 text-white",
    video: "bg-purple-600 text-white",
    pdf: "bg-rose-600 text-white",
    document: "bg-blue-600 text-white",
  };

  const badgeTextMap = {
    image: "PHOTO ATTACHMENT",
    video: "VIDEO ATTACHMENT",
    pdf: "PDF OBJECT",
    document: "DOCUMENT OBJECT",
  };

  const titleMap = {
    image: "Community Photo Attachment",
    video: "Community Video Demo",
    pdf: "Community Pitch Deck (PDF)",
    document: "Community Document Attachment",
  };

  // Render Images: Full view, appear good, no scrollbars or scrollable iframe area!
  if (type === "image") {
    return (
      <div 
        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-3 sm:p-4 shadow-xs space-y-3 select-none backdrop-blur-xs"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${badgeColorMap[type]}`}>
            {badgeTextMap[type]}
          </span>
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {titleMap[type]}
          </h4>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 ml-auto shrink-0 uppercase tracking-widest">
            VIEW ONLY
          </span>
        </div>

        <div className="w-full flex justify-center items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950/80 p-1 sm:p-2 overflow-hidden shadow-inner">
          <img
            src={attachment.url}
            alt="Community Post Attachment"
            className="w-full h-auto max-h-[600px] object-contain rounded-lg shadow-sm"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  // Render Videos: Clean video player, full view, no scrollbars
  if (type === "video") {
    return (
      <div 
        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-3 sm:p-4 shadow-xs space-y-3 select-none backdrop-blur-xs"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${badgeColorMap[type]}`}>
            {badgeTextMap[type]}
          </span>
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {titleMap[type]}
          </h4>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 ml-auto shrink-0 uppercase tracking-widest">
            VIEW ONLY
          </span>
        </div>

        <div className="w-full flex justify-center items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-1 sm:p-2 overflow-hidden shadow-inner">
          <video
            src={attachment.url}
            controls
            controlsList="nodownload"
            className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-sm"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  // Render PDFs & Documents via Google Docs iframe viewer
  const iframeUrl = `https://docs.google.com/gview?url=${encodeURIComponent(attachment.url)}&embedded=true`;

  return (
    <div 
      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 p-4 shadow-xs space-y-3 select-none backdrop-blur-xs"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${badgeColorMap[type] || "bg-slate-600 text-white"}`}>
          {badgeTextMap[type] || "ATTACHMENT OBJECT"}
        </span>
        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
          {titleMap[type] || "Community Attachment Viewer"}
        </h4>
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 ml-auto shrink-0 uppercase tracking-widest">
          VIEW ONLY
        </span>
      </div>

      <div className="w-full h-[380px] sm:h-[460px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 relative shadow-inner">
        <iframe
          src={iframeUrl}
          className="w-full h-full border-none"
          title="Community Attachment Viewer"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

function roleAccent(companyType = "") {
  const type = (companyType || "").toLowerCase();
  if (type.includes("investor")) {
    return {
      label: "ANGEL INVESTOR",
      borderLeft: "border-l-4 border-l-emerald-500",
      badge: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
      ring: "ring-2 ring-emerald-500/50 shadow-xs",
      verified: true,
    };
  }
  if (type.includes("mentor")) {
    return {
      label: "EXPERT MENTOR",
      borderLeft: "border-l-4 border-l-amber-500",
      badge: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
      ring: "ring-2 ring-amber-500/50 shadow-xs",
      verified: true,
    };
  }
  if (type.includes("startup") || type.includes("founder")) {
    return {
      label: "STARTUP FOUNDER",
      borderLeft: "border-l-4 border-l-cyan-500",
      badge: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900",
      ring: "ring-2 ring-cyan-500/50 shadow-xs",
      verified: true,
    };
  }
  if (type.includes("incubator") || type.includes("accelerator")) {
    return {
      label: "INCUBATOR / ACCELERATOR",
      borderLeft: "border-l-4 border-l-purple-500",
      badge: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900",
      ring: "ring-2 ring-purple-500/50 shadow-xs",
      verified: true,
    };
  }
  return {
    label: "ECOSYSTEM MEMBER",
    borderLeft: "border-l-4 border-l-rose-500",
    badge: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    ring: "ring-2 ring-rose-500/50 shadow-xs",
    verified: false,
  };
}

function emptyComposer() {
  return {
    content: "",
    post_type: "text",
    poll_question: "",
    poll_options: ["", "", "", ""],
    attachedFile: null,
    filePreview: "",
    fileType: "",
    fileName: "",
    fileSize: 0,
  };
}

function StatCard({ label, value, icon: Icon, color = "rose" }) {
  const colorMap = {
    rose: "bg-rose-50 dark:bg-rose-950/50 text-[#8E1B2E] dark:text-rose-400 border-rose-100 dark:border-rose-900/60",
    cyan: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/60",
    purple: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/60",
    emerald: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-4 shadow-xs transition duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, children, onClick, count, id }) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition duration-150 cursor-pointer shrink-0 ${
        active
          ? "bg-[#8E1B2E] text-white shadow-xs"
          : "bg-white dark:bg-[#151D2E] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
      }`}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
            active
              ? "bg-white/20 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ComposerModal({
  open,
  onClose,
  value,
  setValue,
  onSubmit,
  submitting,
  onPickFile,
  onRemoveFile,
  fileInputRef,
}) {
  if (!open) return null;

  const canPostText = value.content.trim().length > 0;
  const pollOptions = value.poll_options.map((option) => option.trim()).filter(Boolean);
  const canPostPoll = value.poll_question.trim().length > 0 && pollOptions.length >= 2;
  const canSubmit = value.post_type === "poll" ? canPostPoll : canPostText || !!value.attachedFile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-modal-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <span className="text-[9px] font-black uppercase text-[#8E1B2E] dark:text-rose-400 tracking-widest">
              COMMUNITY COMPOSER
            </span>
            <h3 id="composer-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Create Community Announcement
            </h3>
          </div>
          <button
            id="composer-modal-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close Composer Modal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 mb-4">
            <button
              id="composer-tab-text"
              type="button"
              onClick={() => setValue((prev) => ({ ...prev, post_type: "text" }))}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                value.post_type !== "poll"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              📝 Standard / Media Post
            </button>
            <button
              id="composer-tab-poll"
              type="button"
              onClick={() => setValue((prev) => ({ ...prev, poll: true, post_type: "poll" }))}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                value.post_type === "poll"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              📊 Interactive Poll
            </button>
          </div>

          <textarea
            id="composer-content-textarea"
            value={value.content}
            onChange={(e) => setValue((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Share pitch updates, video demos, PDF pitch decks, or mentorship questions with the ecosystem..."
            className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#8E1B2E]/20 placeholder:text-slate-400"
          />

          {value.attachedFile ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {value.fileType === "image" && <ImagePlus size={20} className="text-emerald-500 shrink-0" />}
                  {value.fileType === "video" && <Film size={20} className="text-purple-500 shrink-0" />}
                  {value.fileType === "pdf" && <FileText size={20} className="text-rose-500 shrink-0" />}
                  {value.fileType === "document" && <File size={20} className="text-blue-500 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
                      Attachment Loaded
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {value.fileType.toUpperCase()} OBJECT
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
                  aria-label="Remove attached file"
                >
                  <X size={14} />
                </button>
              </div>

              {value.fileType === "image" && value.filePreview && (
                <img
                  src={value.filePreview}
                  alt="Attachment Preview"
                  className="mt-3 max-h-[240px] w-full rounded-xl object-cover"
                />
              )}

              {value.fileType === "video" && value.filePreview && (
                <video
                  src={value.filePreview}
                  controls
                  controlsList="nodownload"
                  className="mt-3 max-h-[240px] w-full rounded-xl bg-black object-contain"
                />
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                id="composer-attach-image-btn"
                type="button"
                onClick={() => onPickFile("image/*")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                <ImagePlus size={16} className="text-emerald-500" />
                Image
              </button>
              <button
                id="composer-attach-video-btn"
                type="button"
                onClick={() => onPickFile("video/*")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                <Film size={16} className="text-purple-500" />
                Video MP4
              </button>
              <button
                id="composer-attach-pdf-btn"
                type="button"
                onClick={() => onPickFile(".pdf")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                <FileText size={16} className="text-rose-500" />
                PDF Deck
              </button>
              <button
                id="composer-attach-doc-btn"
                type="button"
                onClick={() => onPickFile(".doc,.docx,.txt,.csv,.xlsx,.zip")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
              >
                <File size={16} className="text-blue-500" />
                Document
              </button>
            </div>
          )}

          {value.post_type === "poll" && (
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
              <input
                id="composer-poll-question-input"
                value={value.poll_question}
                onChange={(e) =>
                  setValue((prev) => ({ ...prev, poll_question: e.target.value }))
                }
                placeholder="Poll Question..."
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {value.poll_options.map((opt, i) => (
                  <input
                    key={i}
                    id={`composer-poll-option-${i}`}
                    value={opt}
                    onChange={(e) =>
                      setValue((prev) => {
                        const next = [...prev.poll_options];
                        next[i] = e.target.value;
                        return { ...prev, poll_options: next };
                      })
                    }
                    placeholder={`Option ${i + 1}`}
                    className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-100 outline-none"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              id="composer-cancel-btn"
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="composer-submit-btn"
              type="button"
              onClick={onSubmit}
              disabled={submitting || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8E1B2E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#721724] transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send size={15} />
              {submitting ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageLightboxModal({ open, onClose, imageUrl, title }) {
  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image Preview Lightbox"
        className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Image Preview"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-black transition cursor-pointer"
        >
          <X size={18} />
        </button>
        <img
          src={imageUrl}
          alt={title || "Enlarged Image Preview"}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}

// POST CARD WITH IFRAME ATTACHMENT VIEWER FOR ALL MEDIA AND DOCUMENTS
function PostCard({
  post,
  currentUserId,
  voteBusy,
  commentDraft,
  onReactionClick,
  onVote,
  onCommentChange,
  onCommentSubmit,
  onViewImage,
  onDeletePost,
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const attachment = post.attachment || (post.image?.url ? {
    url: post.image.url,
    file_type: "image",
    original_name: "Image Attachment",
    size: 0
  } : null);

  const role = roleAccent(post?.author?.company_type);
  const isOwner = String(post?.author?._id) === String(currentUserId);

  return (
    <article
      id={`post-card-${post._id}`}
      className={`overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2E] shadow-xs transition duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md ${role.borderLeft}`}
    >
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 px-5 sm:px-6 py-4 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={avatarFor(post)}
                alt={post?.author?.company_name || post?.author?.name || "Author Avatar"}
                className={`h-12 w-12 rounded-2xl object-cover ${role.ring}`}
              />
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {post?.author?.company_name || post?.author?.name || "Ecosystem Member"}
                </h3>

                {role.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 shrink-0" title="Verified Member">
                    <UserCheck size={14} />
                  </span>
                )}

                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black tracking-wider uppercase border ${role.badge}`}>
                  {role.label}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {post?.author?.account?.designation || post?.author?.company_type || "Community Member"} • {timeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                📌 Pinned
              </span>
            )}

            {/* Delete button visible ONLY to the post's author */}
            {isOwner && (
              <button
                id={`post-${post._id}-delete-btn`}
                type="button"
                onClick={() => onDeletePost(post._id)}
                title="Delete your post"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer border border-rose-200 dark:border-rose-900/60"
                aria-label="Delete Post"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6">
        {post.content ? (
          <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
            {post.content}
          </p>
        ) : null}

        {/* ATTACHMENT OBJECT RENDERING: COVER FOR MEDIA, IFRAME FOR DOCUMENTS */}
        {attachment?.url ? (
          <div className={`${post.content ? "mt-4 sm:mt-5" : ""}`}>
            <AttachmentIframeViewer attachment={attachment} onViewImage={onViewImage} />
          </div>
        ) : null}

        {/* Poll Object */}
        {post.post_type === "poll" && post.poll ? (
          <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <BarChart3 size={15} />
              Interactive Poll
            </div>
            <h4 className="mt-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
              {post.poll.question}
            </h4>

            <div className="mt-4 space-y-3">
              {post.poll.options.map((option, index) => {
                const total = post.poll.total_votes || 0;
                const percent = total ? Math.round((option.votes / total) * 100) : 0;
                const selected = post.poll.user_vote_index === index;

                return (
                  <button
                    key={`${post._id}-${index}`}
                    type="button"
                    onClick={() => onVote(post._id, index)}
                    disabled={voteBusy === `${post._id}:${index}`}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${
                      selected
                        ? "border-[#8E1B2E] bg-rose-50 dark:bg-rose-950/40"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        {option.label}
                      </span>
                      <span className="text-xs font-extrabold text-slate-400">
                        {option.votes} vote{option.votes === 1 ? "" : "s"} ({percent}%)
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8E1B2E] via-rose-600 to-amber-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              {post.poll.total_votes || 0} total votes recorded
            </p>
          </div>
        ) : null}

        {/* Reaction Bar */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <button
            id={`post-${post._id}-like-btn`}
            type="button"
            onClick={() => onReactionClick(post._id, "like")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
              post.user_reaction_kind === "like"
                ? "bg-[#8E1B2E] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <ThumbsUp size={15} />
            <span>{post.user_reaction_kind === "like" ? "Liked" : "Like"}</span>
          </button>

          <button
            id={`post-${post._id}-support-btn`}
            type="button"
            onClick={() => onReactionClick(post._id, "support")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
              post.user_reaction_kind === "support"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Sparkles size={15} />
            <span>{post.user_reaction_kind === "support" ? "Supporting" : "Support"}</span>
          </button>

          <button
            id={`post-${post._id}-comments-toggle-btn`}
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>Comments ({post.comments})</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 ml-auto">
            <Heart size={14} className="text-[#8E1B2E]" /> {post.reactions}
          </span>
        </div>

        {/* Comments Accordion */}
        {commentsOpen || (post.comment_items || []).length > 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
            <div className="space-y-2.5">
              {(post.comment_items || []).length > 0 ? (
                post.comment_items.map((c, i) => (
                  <div
                    key={`${post._id}-c-${i}`}
                    className="rounded-xl bg-white dark:bg-[#151D2E] p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                      <span>{c?.author?.company_name || c?.author?.name || "Member"}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onCommentSubmit(post._id);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                id={`post-${post._id}-comment-input`}
                value={commentDraft}
                onChange={(e) => onCommentChange(post._id, e.target.value)}
                placeholder="Write a response..."
                className="h-10 flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151D2E] px-3.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#8E1B2E]/20"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#8E1B2E] px-4 text-xs font-bold text-white hover:bg-[#721724] transition shrink-0 cursor-pointer shadow-xs"
              >
                <Send size={14} />
                Send
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function CommunityWall() {
  const user = useStore((state) => state.user);
  const fileInputRef = useRef(null);
  const reactionTimersRef = useRef({});

  const [acceptTypes, setAcceptTypes] = useState("*");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composer, setComposer] = useState(emptyComposer());
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteBusy, setVoteBusy] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const [imageModal, setImageModal] = useState({ open: false, url: "", title: "" });

  const loadCommunity = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get("/community");
      if (res.data?.status === 1) {
        setPosts(res.data?.posts || []);
      } else {
        setPosts([]);
        setError(res.data?.msg || "Unable to load community wall");
      }
    } catch (err) {
      setPosts([]);
      setError(err?.response?.data?.msg || "Unable to load community wall");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunity();

    return () => {
      Object.values(reactionTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    document.title = "Community Wall & Ecosystem Feed | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Discover community announcements, startup pitch decks, video demos, and mentorship polls on the RealBell Ecosystem Community Wall."
    );
  }, []);

  const processedPosts = useMemo(() => {
    let result = posts.filter((post) => {
      if (filter === "mine" && String(post?.author?._id) !== String(user?._id)) {
        return false;
      }
      if (filter === "polls" && post.post_type !== "poll") {
        return false;
      }
      if (filter === "videos" && post.attachment?.file_type !== "video") {
        return false;
      }
      if (
        filter === "docs" &&
        post.attachment?.file_type !== "pdf" &&
        post.attachment?.file_type !== "document"
      ) {
        return false;
      }
      if (
        filter === "active" &&
        (post.reactions || 0) + (post.comments || 0) === 0
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = (post.content || "").toLowerCase().includes(q);
        const authorMatch =
          (post.author?.name || "").toLowerCase().includes(q) ||
          (post.author?.company_name || "").toLowerCase().includes(q);
        const fileMatch = (post.attachment?.original_name || "").toLowerCase().includes(q);
        const pollMatch = (post.poll?.question || "").toLowerCase().includes(q);

        if (!contentMatch && !authorMatch && !fileMatch && !pollMatch) {
          return false;
        }
      }

      return true;
    });

    if (sortBy === "popular") {
      result = [...result].sort((a, b) => (b.reactions || 0) - (a.reactions || 0));
    } else if (sortBy === "discussed") {
      result = [...result].sort((a, b) => (b.comments || 0) - (a.comments || 0));
    }

    return result;
  }, [filter, posts, searchQuery, sortBy, user?._id]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      mine: posts.filter((post) => String(post?.author?._id) === String(user?._id)).length,
      polls: posts.filter((post) => post.post_type === "poll").length,
      videos: posts.filter((post) => post.attachment?.file_type === "video").length,
      docs: posts.filter(
        (post) =>
          post.attachment?.file_type === "pdf" ||
          post.attachment?.file_type === "document"
      ).length,
      reacted: posts.filter((post) => post.user_reacted).length,
    };
  }, [posts, user?._id]);

  // SILENT 5-SECOND DEBOUNCED REACTION HANDLER
  const handleReactionClick = (postId, kind) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;

        const currentKind = p.user_reaction_kind;
        let newKind = null;
        let diffReactions = 0;

        if (currentKind === kind) {
          newKind = null;
          diffReactions = -1;
        } else if (currentKind) {
          newKind = kind;
          diffReactions = 0;
        } else {
          newKind = kind;
          diffReactions = 1;
        }

        return {
          ...p,
          user_reacted: !!newKind,
          user_reaction_kind: newKind,
          reactions: Math.max(0, (p.reactions || 0) + diffReactions),
        };
      })
    );

    if (reactionTimersRef.current[postId]) {
      clearTimeout(reactionTimersRef.current[postId]);
    }

    reactionTimersRef.current[postId] = setTimeout(async () => {
      try {
        const res = await axios.post(`/community/${postId}/reactions`, { kind });
        if (res.data?.status !== 1) {
          toast.error(res.data?.msg || "Unable to save reaction");
          await loadCommunity();
        }
      } catch (err) {
        console.error(err);
        await loadCommunity();
      } finally {
        delete reactionTimersRef.current[postId];
      }
    }, 5000);
  };

  const handleCreate = async () => {
    const content = composer.content.trim();
    const post_type = composer.post_type;
    const poll_question = composer.poll_question.trim();
    const poll_options = composer.poll_options.map((item) => item.trim()).filter(Boolean);

    if (post_type === "poll" && poll_question.length === 0) {
      toast.error("Polls need a question");
      return;
    }

    if (post_type === "poll" && poll_options.length < 2) {
      toast.error("Polls need at least two options");
      return;
    }

    if (post_type !== "poll" && !content && !composer.attachedFile) {
      toast.error("Post content or an attachment is required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", post_type);
      formData.append("poll_question", poll_question);
      formData.append("poll_options", JSON.stringify(poll_options));

      if (composer.attachedFile) {
        formData.append("attachment", composer.attachedFile);
      }

      const res = await axios.post("/community", formData);

      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Post created successfully");
        setComposer(emptyComposer());
        setShowComposer(false);
        await loadCommunity();
      } else {
        toast.error(res.data?.msg || "Unable to create post");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to create post");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE OWN POST HANDLER
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete your post? This cannot be undone.")) {
      return;
    }

    try {
      const res = await axios.delete(`/community/${postId}`);
      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Post deleted successfully");
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        toast.error(res.data?.msg || "Unable to delete post");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to delete post");
    }
  };

  const handlePickFile = (acceptPattern = "*") => {
    setAcceptTypes(acceptPattern);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mime = file.type || "";
    const name = file.name || "";
    const ext = name.split(".").pop().toLowerCase();

    let fileType = "document";
    if (mime.startsWith("image/")) fileType = "image";
    else if (mime.startsWith("video/")) fileType = "video";
    else if (mime === "application/pdf" || ext === "pdf") fileType = "pdf";

    const previewUrl = fileType === "image" || fileType === "video" ? URL.createObjectURL(file) : "";

    setComposer((prev) => ({
      ...prev,
      attachedFile: file,
      filePreview: previewUrl,
      fileType,
      fileName: name,
      fileSize: file.size,
    }));

    event.target.value = "";
  };

  const handleRemoveFile = () => {
    setComposer((prev) => ({
      ...prev,
      attachedFile: null,
      filePreview: "",
      fileType: "",
      fileName: "",
      fileSize: 0,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVote = async (postId, optionIndex) => {
    setVoteBusy(`${postId}:${optionIndex}`);
    try {
      const res = await axios.post(`/community/${postId}/vote`, {
        option_index: optionIndex,
      });

      if (res.data?.status === 1) {
        await loadCommunity();
      } else {
        toast.error(res.data?.msg || "Unable to submit vote");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to submit vote");
    } finally {
      setVoteBusy("");
    }
  };

  const handleComment = async (postId) => {
    const text = String(commentDrafts[postId] || "").trim();
    if (!text) return;

    try {
      const res = await axios.post(`/community/${postId}/comments`, { text });
      if (res.data?.status === 1) {
        setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
        await loadCommunity();
      } else {
        toast.error(res.data?.msg || "Unable to add comment");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to add comment");
    }
  };

  return (
    <>
      <Sidebar />

      <div className="relative ml-0 lg:ml-75 pt-16 lg:pt-0 min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 font-sans pb-16 overflow-hidden">
        <div className="pointer-events-none absolute left-10 top-0 h-96 w-96 rounded-full bg-rose-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute right-10 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[150px]" />

        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#070A10]/95 backdrop-blur-2xl px-4 sm:px-8 py-4 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#8E1B2E]/10 dark:bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#8E1B2E] dark:text-rose-400 border border-[#8E1B2E]/20 dark:border-white/15">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>RealBell Ecosystem Network</span>
              </div>

              <h1 id="community-wall-title" className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Community Wall & Media Feed
              </h1>

              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-normal">
                Share pitch updates, video demos, PDF pitch decks, and connect with mentors and angel investors.
              </p>
            </div>

            <button
              id="community-post-composer-btn"
              type="button"
              onClick={() => setShowComposer(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#8E1B2E] px-5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#721724] cursor-pointer shrink-0 self-start md:self-auto"
            >
              <Plus size={16} />
              Create Announcement
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#131B2E]/80 p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[#8E1B2E] dark:text-rose-400" />
                <h2 id="activity-feed-heading" className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  Activity Feed
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="community-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts, decks, names..."
                    className="h-8 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#8E1B2E]/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear Search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  id="community-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="latest">Latest First</option>
                  <option value="popular">Most Liked</option>
                  <option value="discussed">Most Discussed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 flex-nowrap border-t border-slate-200/60 dark:border-slate-800/80 pt-2.5">
              <FilterChip id="community-filter-all" active={filter === "all"} onClick={() => setFilter("all")} count={stats.total}>
                🌐 All Feed
              </FilterChip>
              <FilterChip id="community-filter-mine" active={filter === "mine"} onClick={() => setFilter("mine")} count={stats.mine}>
                👤 My Posts
              </FilterChip>
              <FilterChip id="community-filter-videos" active={filter === "videos"} onClick={() => setFilter("videos")} count={stats.videos}>
                🎥 Video Demos
              </FilterChip>
              <FilterChip id="community-filter-docs" active={filter === "docs"} onClick={() => setFilter("docs")} count={stats.docs}>
                📄 PDF Decks
              </FilterChip>
              <FilterChip id="community-filter-polls" active={filter === "polls"} onClick={() => setFilter("polls")} count={stats.polls}>
                📊 Polls
              </FilterChip>
              <FilterChip id="community-filter-active" active={filter === "active"} onClick={() => setFilter("active")}>
                🔥 Trending
              </FilterChip>
            </div>
          </div>
        </header>

        <div className="relative z-10 grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:px-10 max-w-full">
          <main className="space-y-6 min-w-0">

            <div id="community-posts-feed-scroll" className="h-[90vh] max-h-[90vh] overflow-y-auto pr-1 sm:pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {loading ? (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-12 text-center text-slate-500 shadow-xs">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#8E1B2E] border-t-transparent mb-3" />
                  <p className="text-sm font-bold">Loading activity feed...</p>
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-8 text-center text-xs font-bold text-red-700 dark:text-red-400 shadow-xs">
                  {error}
                </div>
              ) : processedPosts.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-14 text-center text-slate-500 shadow-xs">
                  <Users size={36} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-base font-extrabold text-slate-900 dark:text-slate-200">No posts match this filter</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting search parameters or filter tabs.</p>
                </div>
              ) : (
                processedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={user?._id}
                    voteBusy={voteBusy}
                    commentDraft={commentDrafts[post._id] || ""}
                    onReactionClick={handleReactionClick}
                    onVote={handleVote}
                    onCommentChange={(postId, value) =>
                      setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
                    }
                    onCommentSubmit={handleComment}
                    onViewImage={(url, title) => setImageModal({ open: true, url, title })}
                    onDeletePost={handleDeletePost}
                  />
                ))
              )}
            </div>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-24 self-start">
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#131B2E]/90 p-5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#8E1B2E] dark:text-rose-400 mb-1">
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">ECOSYSTEM PULSE</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Live Analytics</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect and engage with founders, mentors, and angel investors across cohorts.
              </p>
            </div>

            <StatCard label="Total Wall Posts" value={stats.total} icon={MessageCircle} color="rose" />
            <StatCard label="My Published Posts" value={stats.mine} icon={Users} color="cyan" />
            <StatCard label="Videos Uploaded" value={stats.videos} icon={Film} color="purple" />
            <StatCard label="PDF Decks & Files" value={stats.docs} icon={FileText} color="emerald" />

            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-[#131B2E]/90 p-5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-500 mb-3">
                <Flame size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TRENDING TOPICS</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["#StartupFunding", "#PitchDecks", "#Mentorship", "#AI", "#SaaS", "#AngelInvestors"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag.replace("#", ""))}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          className="hidden"
        />

        <ComposerModal
          open={showComposer}
          onClose={() => setShowComposer(false)}
          value={composer}
          setValue={setComposer}
          onSubmit={handleCreate}
          submitting={submitting}
          onPickFile={handlePickFile}
          onRemoveFile={handleRemoveFile}
          fileInputRef={fileInputRef}
        />

        <ImageLightboxModal
          open={imageModal.open}
          onClose={() => setImageModal({ open: false, url: "", title: "" })}
          imageUrl={imageModal.url}
          title={imageModal.title}
        />
      </div>
    </>
  );
}

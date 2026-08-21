import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Hash,
  ImagePlus,
  Link2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";

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

function emptyComposer() {
  return {
    content: "",
    post_type: "text",
    poll_question: "",
    poll_options: ["", "", "", ""],
    imageFile: null,
    imagePreview: "",
  };
}

function StatCard({ label, value, icon, tone = "bg-white dark:bg-slate-800" }) {
  const Icon = icon;

  return (
    <div className={`rounded-[22px] border border-[#E7ECF5] dark:border-slate-700 ${tone} px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#93A0B8] dark:text-slate-400">
            <Icon size={15} />
            <span>{label}</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-[#152033] dark:text-white">{value}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F6FB] dark:bg-slate-700 text-[#0F3D4A] dark:text-slate-100">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#0F3D4A] dark:bg-slate-700 text-white shadow-sm"
          : "bg-white dark:bg-slate-800 text-[#536075] dark:text-slate-300 hover:bg-[#f3f6fb] dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ComposerCard({
  value,
  setValue,
  onSubmit,
  submitting,
  onPickImage,
  onRemoveImage,
  onImageChange,
  fileInputRef,
}) {
  const canPostText = value.content.trim().length > 0;
  const pollOptions = value.poll_options.map((option) => option.trim()).filter(Boolean);
  const canPostPoll = value.poll_question.trim().length > 0 && pollOptions.length >= 2;
  const canSubmit = value.post_type === "poll" ? canPostPoll : canPostText || !!value.imageFile;

  return (
    <div className="rounded-[28px] border border-[#E7ECF5] dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8E1B2E]">
            Start a conversation
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#142036] dark:text-white">Community Post</h2>
        </div>
        <div className="flex rounded-full bg-[#F4F6FB] dark:bg-slate-900 p-1">
          <FilterChip
            active={value.post_type === "text"}
            onClick={() => setValue((prev) => ({ ...prev, post_type: "text" }))}
          >
            Update
          </FilterChip>
          <FilterChip
            active={value.post_type === "poll"}
            onClick={() => setValue((prev) => ({ ...prev, post_type: "poll" }))}
          >
            Poll
          </FilterChip>
        </div>
      </div>

      <textarea
        value={value.content}
        onChange={(event) =>
          setValue((prev) => ({ ...prev, content: event.target.value }))
        }
        placeholder="Share something useful with the community..."
        className="mt-5 min-h-[150px] w-full resize-none rounded-[24px] border border-[#E6EBF4] dark:border-slate-700 bg-[#FBFCFF] dark:bg-slate-900 px-5 py-4 text-[16px] leading-7 text-[#1D2940] dark:text-slate-100 outline-none placeholder:text-[#A6AEC0] dark:placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F3D4A]/10"
      />

      {value.imagePreview ? (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-[#E6EBF4] bg-[#FBFCFF]">
          <div className="flex items-center justify-between gap-4 border-b border-[#EEF2F8] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#1B263D]">Attached image</p>
              <p className="text-xs text-[#8892A7]">This will upload with your post.</p>
            </div>
            <button
              type="button"
              onClick={onRemoveImage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8B96AA] transition hover:bg-[#F4F6FB] hover:text-[#0F3D4A]"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
          <img
            src={value.imagePreview}
            alt="Selected preview"
            className="max-h-[320px] w-full object-cover"
          />
        </div>
      ) : null}

      {value.post_type === "poll" ? (
        <div className="mt-4 rounded-[24px] border border-[#E6EBF4] bg-[#FBFCFF] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#8A95AB]">
            <BarChart3 size={16} />
            Poll details
          </div>

          <input
            value={value.poll_question}
            onChange={(event) =>
              setValue((prev) => ({ ...prev, poll_question: event.target.value }))
            }
            placeholder="Poll question"
            className="mt-4 h-12 w-full rounded-2xl border border-[#E6EBF4] bg-white px-4 outline-none focus:ring-2 focus:ring-[#0F3D4A]/10"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {value.poll_options.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(event) =>
                  setValue((prev) => {
                    const next = [...prev.poll_options];
                    next[index] = event.target.value;
                    return { ...prev, poll_options: next };
                  })
                }
                placeholder={`Option ${index + 1}`}
                className="h-12 rounded-2xl border border-[#E6EBF4] bg-white px-4 outline-none focus:ring-2 focus:ring-[#0F3D4A]/10"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 border-t border-[#EEF2F8] pt-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2 text-[#99A4B8]">
          <button
            type="button"
            onClick={onPickImage}
            className="rounded-xl p-2 transition hover:bg-[#F4F6FB]"
            title="Add image"
          >
            <ImagePlus size={18} />
          </button>
          <button
            type="button"
            className="rounded-xl p-2 transition hover:bg-[#F4F6FB]"
            title="Add link"
          >
            <Link2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setValue((prev) => ({ ...prev, post_type: "poll" }))}
            className="rounded-xl p-2 transition hover:bg-[#F4F6FB]"
            title="Switch to poll"
          >
            <Hash size={18} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={onImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !canSubmit}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0F3D4A] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0b313b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

function PostCard({
  post,
  reactionBusy,
  voteBusy,
  commentDraft,
  onReaction,
  onVote,
  onCommentChange,
  onCommentSubmit,
}) {
  return (
    <article className="overflow-hidden rounded-[30px] border border-[#E7ECF5] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#EEF2F8] px-6 py-5">
        <div className="flex items-start gap-4">
          <img
            src={avatarFor(post)}
            alt={post?.author?.company_name || post?.author?.name || "Author"}
            className="h-16 w-16 rounded-2xl border border-[#E7ECF5] object-cover"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-[18px] font-bold text-[#172033]">
                {post?.author?.company_name || post?.author?.name || "Anonymous"}
              </h3>
              <span className="text-sm font-semibold text-[#A4AABB]">
                {timeAgo(post.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#70819B]">
              {post?.author?.account?.designation ||
                post?.author?.company_type ||
                "Community member"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {post.content ? (
          <p className="whitespace-pre-wrap text-[16px] leading-8 text-[#3E4A62]">
            {post.content}
          </p>
        ) : null}

        {post.image?.url ? (
          <div className={`${post.content ? "mt-5" : ""} overflow-hidden rounded-[24px] border border-[#E6EBF4] bg-[#FBFCFF]`}>
            <img
              src={post.image.url}
              alt="Post attachment"
              className="max-h-[520px] w-full object-cover"
            />
          </div>
        ) : null}

        {post.post_type === "poll" && post.poll ? (
          <div className="mt-6 rounded-[26px] bg-[#FBFCFF] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#8A95AB]">
              <BarChart3 size={16} />
              Poll
            </div>
            <h4 className="mt-3 text-[18px] font-bold text-[#1C2740]">
              {post.poll.question}
            </h4>

            <div className="mt-5 space-y-3">
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
                    className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[#0F3D4A] bg-[#F2F9FA]"
                        : "border-[#E2E8F2] bg-white hover:bg-[#FCFDFF]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[15px] font-medium text-[#26314B]">
                        {option.label}
                      </span>
                      <span className="text-xs font-semibold text-[#9AA2B6]">
                        {option.votes} vote{option.votes === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF2F8]">
                      <div
                        className="h-full rounded-full bg-[#0F3D4A]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-sm text-[#8C94A8]">
              {post.poll.total_votes || 0} votes
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#EEF2F8] bg-[#FBFCFF] p-3 sm:p-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#3B4660] shadow-xs">
            <MessageCircle size={14} className="text-[#A4ACBE]" />
            {post.comments} comments
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#3B4660] shadow-xs">
            <ThumbsUp size={14} className="text-[#A4ACBE]" />
            {post.reactions} reactions
          </span>

          <button
            type="button"
            onClick={() => onReaction(post._id, "like")}
            disabled={reactionBusy === post._id}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              post.user_reaction_kind === "like"
                ? "bg-[#F0F8F9] text-[#0F3D4A]"
                : "bg-white text-[#667089] hover:bg-[#F4F6FB]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <ThumbsUp size={14} />
            {post.user_reaction_kind === "like" ? "Liked" : "Like"}
          </button>

          <button
            type="button"
            onClick={() => onReaction(post._id, "support")}
            disabled={reactionBusy === post._id}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              post.user_reaction_kind === "support"
                ? "bg-[#FFF4EA] text-[#9B4A13]"
                : "bg-white text-[#667089] hover:bg-[#F4F6FB]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <ThumbsUp size={14} />
            {post.user_reaction_kind === "support" ? "Supporting" : "Support"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#EEF2F8] bg-[#FBFCFF] p-3 sm:p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8A95AB]">
            <Users size={14} />
            Comments
          </div>

          <div className="mt-3 space-y-2.5">
            {(post.comment_items || []).length > 0 ? (
              post.comment_items.map((comment, index) => (
                <div
                  key={`${post._id}-comment-${index}`}
                  className="rounded-xl border border-[#E6EBF4] bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#1C2740]">
                        {comment?.author?.company_name || comment?.author?.name || "Community member"}
                      </p>
                      <p className="text-[11px] text-[#9AA2B6]">{timeAgo(comment.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#40506A] break-words">{comment.text}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#E3E8F2] bg-white p-3 text-xs sm:text-sm text-[#94A0B6]">
                No comments yet. Be the first to respond.
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCommentSubmit(post._id);
            }}
            className="mt-3 flex gap-2 sm:gap-3"
          >
            <input
              value={commentDraft}
              onChange={(event) => onCommentChange(post._id, event.target.value)}
              placeholder="Write a comment..."
              className="h-10 sm:h-11 flex-1 min-w-0 rounded-xl border border-[#E3E8F2] bg-white px-3 sm:px-4 text-xs sm:text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#0F3D4A]/10"
            />
            <button
              type="submit"
              className="inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-xl bg-[#8E1B2E] px-4 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#741728] shrink-0 cursor-pointer"
            >
              <Send size={15} />
              Post
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

export default function CommunityWall() {
  const user = useStore((state) => state.user);
  const fileInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composer, setComposer] = useState(emptyComposer());
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reactionBusy, setReactionBusy] = useState("");
  const [voteBusy, setVoteBusy] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [filter, setFilter] = useState("all");

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
  }, []);

  useEffect(() => {
    if (!composer.imagePreview) return undefined;

    return () => {
      URL.revokeObjectURL(composer.imagePreview);
    };
  }, [composer.imagePreview]);

  useEffect(() => {
    if (!showComposer) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowComposer(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showComposer]);

  const filteredPosts = useMemo(() => {
    if (filter === "mine") {
      return posts.filter((post) => String(post?.author?._id) === String(user?._id));
    }

    if (filter === "polls") {
      return posts.filter((post) => post.post_type === "poll");
    }

    if (filter === "active") {
      return posts.filter((post) => (post.reactions || 0) + (post.comments || 0) > 0);
    }

    return posts;
  }, [filter, posts, user?._id]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      mine: posts.filter((post) => String(post?.author?._id) === String(user?._id)).length,
      polls: posts.filter((post) => post.post_type === "poll").length,
      reacted: posts.filter((post) => post.user_reacted).length,
    };
  }, [posts, user?._id]);

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

    if (post_type !== "poll" && !content && !composer.imageFile) {
      toast.error("Post content or an image is required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", post_type);
      formData.append("poll_question", poll_question);
      formData.append("poll_options", JSON.stringify(poll_options));

      if (composer.imageFile) {
        formData.append("image", composer.imageFile);
      }

      const res = await axios.post("/community", formData);

      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Post created successfully");
        setComposer(emptyComposer());
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

  const handleReaction = async (postId, kind) => {
    setReactionBusy(postId);
    try {
      const res = await axios.post(`/community/${postId}/reactions`, { kind });
      if (res.data?.status === 1) {
        await loadCommunity();
      } else {
        toast.error(res.data?.msg || "Unable to update reaction");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to update reaction");
    } finally {
      setReactionBusy("");
    }
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setComposer((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));

    event.target.value = "";
  };

  const handleRemoveImage = () => {
    setComposer((prev) => ({
      ...prev,
      imageFile: null,
      imagePreview: "",
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

      <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,61,74,0.07),_transparent_25%),linear-gradient(180deg,_#F6F8FC_0%,_#EEF3F8_100%)]">
        <div className="sticky top-0 z-20 border-b border-[#E4E9F1] bg-white/95 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 xl:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8E1B2E]">
                Community Wall
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[#132034]">
                Feed, Polls & Discussions
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setShowComposer((prev) => !prev)}
              aria-expanded={showComposer}
              className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-xl bg-[#0F3D4A] px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#0b313b] cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus size={16} />
              {showComposer ? "Close Form" : "Create Post"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:px-10 max-w-full overflow-hidden">
          <main className="space-y-6 min-w-0">
            <div className="rounded-2xl sm:rounded-[28px] border border-[#E5EAF3] bg-white p-4 sm:p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A95AB]">
                    Ecosystem Feed
                  </p>
                  <h2 className="mt-1 text-lg sm:text-xl font-bold text-[#152033]">All Community Posts</h2>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6E7B92]">
                    Browse every update, poll, and discussion from founders, investors, and mentors across the RealBell ecosystem.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 w-full lg:w-auto flex-nowrap">
                  <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                    All Posts
                  </FilterChip>
                  <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")}>
                    My Posts
                  </FilterChip>
                  <FilterChip active={filter === "polls"} onClick={() => setFilter("polls")}>
                    Polls
                  </FilterChip>
                  <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>
                    Trending
                  </FilterChip>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[28px] border border-[#E5EAF3] bg-white p-8 text-center text-[#607086] shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
                Loading community wall...
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
                {error}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-[28px] border border-[#E5EAF3] bg-white p-10 text-center text-[#607086] shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
                No posts match this filter yet.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  reactionBusy={reactionBusy}
                  voteBusy={voteBusy}
                  commentDraft={commentDrafts[post._id] || ""}
                  onReaction={handleReaction}
                  onVote={handleVote}
                  onCommentChange={(postId, value) =>
                    setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
                  }
                  onCommentSubmit={handleComment}
                />
              ))
            )}
          </main>

          <aside className="space-y-5 xl:sticky xl:top-28 self-start">
            <div className="rounded-[28px] border border-[#E5EAF3] bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8A95AB]">
                Dashboard
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#152033]">Your community pulse</h2>
              <p className="mt-3 text-sm leading-7 text-[#6E7B92]">
                Track your own activity and keep an eye on what the community is discussing right now.
              </p>
            </div>

            <StatCard label="Total Posts" value={stats.total} icon={MessageCircle} />
            <StatCard label="My Posts" value={stats.mine} icon={Users} />
            <StatCard label="Polls" value={stats.polls} icon={BarChart3} />
            <StatCard label="My Reactions" value={stats.reacted} icon={ThumbsUp} />

            <div className="rounded-[28px] border border-[#E5EAF3] bg-[#0F3D4A] p-5 text-white shadow-[0_18px_42px_rgba(15,23,42,0.1)]">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                <Sparkles size={15} />
                Quick filters
              </div>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Use the buttons in the feed to switch between everything, your posts, polls, and active threads.
              </p>
            </div>
          </aside>
        </div>

        {showComposer ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
            onClick={() => setShowComposer(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Create community post"
              className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-[#E5EAF3] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EEF2F8] bg-white px-6 py-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8A95AB]">
                    Community Wall
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-[#142036]">Create a post</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F6FB] text-[#526079] transition hover:bg-[#e9eef7] hover:text-[#0F3D4A]"
                  aria-label="Close composer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <ComposerCard
                  value={composer}
                  setValue={setComposer}
                  onSubmit={handleCreate}
                  submitting={submitting}
                  onPickImage={handlePickImage}
                  onRemoveImage={handleRemoveImage}
                  onImageChange={handleImageChange}
                  fileInputRef={fileInputRef}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

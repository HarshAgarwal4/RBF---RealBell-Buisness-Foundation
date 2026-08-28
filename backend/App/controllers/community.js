import CommunityPostModel from "../models/community.js";
import { uploadFileToCloud, deleteImageByPublicId } from "../../services/upload.js";

function normalizePollOptions(options = []) {
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => String(option || "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((label) => ({
      label,
      votes: [],
    }));
}

function normalizeListField(value = []) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function buildAuthor(author) {
  if (!author) return null;

  return {
    _id: author._id,
    name: author.name,
    company_name: author.company_name,
    email: author.email,
    company_type: author.company_type,
    account: author.account,
  };
}

function buildComment(comment) {
  return {
    text: comment?.text,
    createdAt: comment?.createdAt,
    author: buildAuthor(comment?.user),
  };
}

function serializePost(post, currentUserId) {
  const reactions = post.reactions || [];
  const comments = post.comments || [];
  const pollOptions = post.poll?.options || [];
  const totalPollVotes = pollOptions.reduce(
    (count, option) => count + (option?.votes?.length || 0),
    0
  );

  const userReaction = reactions.find(
    (reaction) => String(reaction.user) === String(currentUserId)
  );

  const userVoteIndex = pollOptions.findIndex((option) =>
    (option?.votes || []).some(
      (vote) => String(vote) === String(currentUserId)
    )
  );

  const commentedByMe = comments.some(
    (comment) => String(comment.user) === String(currentUserId)
  );

  let attachment = null;
  if (post.attachment?.url) {
    attachment = {
      url: post.attachment.url,
      public_id: post.attachment.public_id || "",
      file_type: post.attachment.file_type || "other",
      original_name: post.attachment.original_name || "",
      mime_type: post.attachment.mime_type || "",
      size: post.attachment.size || 0,
    };
  } else if (post.image?.url) {
    attachment = {
      url: post.image.url,
      public_id: post.image.public_id || "",
      file_type: "image",
      original_name: "Attachment Image",
      mime_type: "image/jpeg",
      size: 0,
    };
  }

  return {
    _id: post._id,
    author: buildAuthor(post.author),
    content: post.content,
    image: post.image?.url
      ? {
          url: post.image.url,
          public_id: post.image.public_id || "",
        }
      : attachment?.file_type === "image"
      ? {
          url: attachment.url,
          public_id: attachment.public_id || "",
        }
      : null,
    attachment,
    post_type: post.post_type,
    poll: post.poll
      ? {
          question: post.poll.question,
          ends_at: post.poll.ends_at,
          options: pollOptions.map((option) => ({
            label: option.label,
            votes: option.votes?.length || 0,
          })),
          total_votes: totalPollVotes,
          user_vote_index: userVoteIndex,
        }
      : null,
    comments: comments.length,
    commented_by_me: commentedByMe,
    comment_items: comments.map(buildComment),
    reactions: reactions.length,
    user_reacted: !!userReaction,
    user_reaction_kind: userReaction?.kind || null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    is_pinned: post.is_pinned,
    tags: post.tags || [],
  };
}

async function fetchCommunityPosts(req, res) {
  try {
    const posts = await CommunityPostModel.find({})
      .sort({ is_pinned: -1, createdAt: -1 })
      .populate("author", "name company_name email company_type account")
      .populate("comments.user", "name company_name email company_type account");

    return res.send({
      status: 1,
      posts: posts.map((post) => serializePost(post, req.user?._id)),
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 0,
      msg: "Unable to fetch community wall",
    });
  }
}

async function createCommunityPost(req, res) {
  try {
    const content = String(req.body?.content || "").trim();
    const poll_question = String(req.body?.poll_question || "").trim();
    const poll_options = normalizePollOptions(
      normalizeListField(req.body?.poll_options || [])
    );
    const tags = normalizeListField(req.body?.tags)
      .map((tag) => String(tag || "").trim())
      .filter(Boolean);

    let image = null;
    let attachment = null;

    if (req.file) {
      const mime = req.file.mimetype || "";
      const ext = (req.file.originalname || "").split(".").pop().toLowerCase();

      let file_type = "other";
      let resourceType = "auto";

      if (mime.startsWith("image/")) {
        file_type = "image";
        resourceType = "image";
      } else if (mime.startsWith("video/")) {
        file_type = "video";
        resourceType = "video";
      } else if (mime === "application/pdf" || ext === "pdf") {
        file_type = "pdf";
        resourceType = "image"; // Uploading PDFs as 'image' resource type forces inline delivery in Cloudinary (no download popups)
      } else {
        file_type = "document";
        resourceType = "auto";
      }

      const uploaded = await uploadFileToCloud(
        req.file.buffer,
        req.file.originalname,
        {
          folder: "RBF/community_wall",
          resourceType,
        }
      );
      console.log(uploaded.secure_url)
      attachment = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id || "",
        file_type,
        original_name: req.file.originalname || `attachment.${ext}`,
        mime_type: mime,
        size: req.file.size || 0,
      };

      if (file_type === "image") {
        image = {
          url: uploaded.secure_url,
          public_id: uploaded.public_id || "",
        };
      }
    }

    let post_type = req.body?.post_type || "text";
    if (post_type !== "poll") {
      if (attachment) {
        if (attachment.file_type === "image" || attachment.file_type === "video") {
          post_type = "media";
        } else {
          post_type = "document";
        }
      } else {
        post_type = "text";
      }
    }

    if (!content && !attachment && !image && post_type !== "poll") {
      return res.send({
        status: 7,
        msg: "Post content or an attachment is required",
      });
    }

    if (post_type === "poll" && (!poll_question || poll_options.length < 2)) {
      return res.send({
        status: 7,
        msg: "Polls need a question and at least two options",
      });
    }

    const newPost = await CommunityPostModel.create({
      author: req.user._id,
      content,
      post_type,
      image,
      attachment,
      poll:
        post_type === "poll"
          ? {
              question: poll_question,
              options: poll_options,
            }
          : {
              question: "",
              options: [],
            },
      tags,
    });

    const populated = await CommunityPostModel.findById(newPost._id).populate(
      "author",
      "name company_name email company_type account"
    );

    return res.send({
      status: 1,
      msg: "Post created successfully",
      post: serializePost(populated, req.user._id),
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 0,
      msg: "Unable to create post",
    });
  }
}

async function addCommunityComment(req, res) {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.send({
        status: 7,
        msg: "Comment text is required",
      });
    }

    const post = await CommunityPostModel.findById(req.params.id);

    if (!post) {
      return res.send({
        status: 4,
        msg: "Post not found",
      });
    }

    post.comments.push({
      user: req.user._id,
      text,
    });

    await post.save();

    return res.send({
      status: 1,
      msg: "Comment added successfully",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 0,
      msg: "Unable to add comment",
    });
  }
}

async function toggleCommunityReaction(req, res) {
  try {
    const post = await CommunityPostModel.findById(req.params.id);

    if (!post) {
      return res.send({
        status: 4,
        msg: "Post not found",
      });
    }

    const requestedKind =
      String(req.body?.kind || "like").toLowerCase() === "support"
        ? "support"
        : "like";

    const existingIndex = post.reactions.findIndex(
      (reaction) => String(reaction.user) === String(req.user._id)
    );

    if (existingIndex >= 0 && post.reactions[existingIndex].kind === requestedKind) {
      post.reactions.splice(existingIndex, 1);
    } else {
      if (existingIndex >= 0) {
        post.reactions[existingIndex].kind = requestedKind;
        post.reactions[existingIndex].reactedAt = new Date();
      } else {
        post.reactions.push({
          user: req.user._id,
          kind: requestedKind,
        });
      }
    }

    await post.save();

    const finalReaction = post.reactions.find(
      (reaction) => String(reaction.user) === String(req.user._id)
    );

    return res.send({
      status: 1,
      msg: "Reaction updated",
      reacted: !!finalReaction,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 0,
      msg: "Unable to update reaction",
    });
  }
}

async function voteCommunityPoll(req, res) {
  try {
    const optionIndex = Number(req.body?.option_index);

    if (!Number.isInteger(optionIndex)) {
      return res.send({
        status: 7,
        msg: "A valid option is required",
      });
    }

    const post = await CommunityPostModel.findById(req.params.id);

    if (!post) {
      return res.send({
        status: 4,
        msg: "Post not found",
      });
    }

    if (post.post_type !== "poll" || !post.poll?.options?.length) {
      return res.send({
        status: 7,
        msg: "This post does not contain a poll",
      });
    }

    if (!post.poll.options[optionIndex]) {
      return res.send({
        status: 7,
        msg: "Poll option not found",
      });
    }

    post.poll.options.forEach((option) => {
      option.votes = option.votes.filter(
        (vote) => String(vote) !== String(req.user._id)
      );
    });

    post.poll.options[optionIndex].votes.push(req.user._id);

    await post.save();

    return res.send({
      status: 1,
      msg: "Vote recorded",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 0,
      msg: "Unable to submit vote",
    });
  }
}

async function deleteCommunityPost(req, res) {
  try {
    const { id } = req.params;
    const post = await CommunityPostModel.findById(id);

    if (!post) {
      return res.send({
        status: 0,
        msg: "Post not found",
      });
    }

    // Check ownership: user can only delete their own post
    if (String(post.author) !== String(req.user._id)) {
      return res.send({
        status: 0,
        msg: "Unauthorized: You can only delete your own posts",
      });
    }

    // Delete attachment from Cloudinary if exists
    if (post.attachment?.public_id) {
      await deleteImageByPublicId(post.attachment.public_id).catch(() => {});
    } else if (post.image?.public_id) {
      await deleteImageByPublicId(post.image.public_id).catch(() => {});
    }

    await CommunityPostModel.findByIdAndDelete(id);

    return res.send({
      status: 1,
      msg: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.send({
      status: 0,
      msg: "Unable to delete post",
    });
  }
}

export {
  addCommunityComment,
  createCommunityPost,
  deleteCommunityPost,
  fetchCommunityPosts,
  toggleCommunityReaction,
  voteCommunityPoll,
};

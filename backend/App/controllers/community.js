import CommunityPostModel from "../models/community.js";
import { uploadFileToCloud } from "../../services/upload.js";

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

  return {
    _id: post._id,
    author: buildAuthor(post.author),
    content: post.content,
    image: post.image?.url
      ? {
          url: post.image.url,
          public_id: post.image.public_id || "",
        }
      : null,
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
    const post_type = req.body?.post_type === "poll" ? "poll" : "text";
    const poll_question = String(req.body?.poll_question || "").trim();
    const poll_options = normalizePollOptions(
      normalizeListField(req.body?.poll_options || [])
    );
    const tags = normalizeListField(req.body?.tags)
      .map((tag) => String(tag || "").trim())
      .filter(Boolean);

    let image = null;
    if (req.file) {
      const uploaded = await uploadFileToCloud(
        req.file.buffer,
        req.file.originalname
      );
      image = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id || "",
      };
    }

    if (!content && !image) {
      return res.send({
        status: 7,
        msg: "Post content or an image is required",
      });
    }

    if (post_type === "poll" && (!poll_question || poll_options.length < 2)) {
      return res.send({
        status: 7,
        msg: "Polls need a question and at least two options",
      });
    }

    const post = await CommunityPostModel.create({
      author: req.user._id,
      content,
      image,
      post_type,
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

    const populated = await post.populate(
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

export {
  addCommunityComment,
  createCommunityPost,
  fetchCommunityPosts,
  toggleCommunityReaction,
  voteCommunityPoll,
};

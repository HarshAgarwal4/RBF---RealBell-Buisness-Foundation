import mongoose from "mongoose";

const CommunityPollOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    votes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Organization",
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const CommunityCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CommunityReactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    kind: {
      type: String,
      enum: ["like", "support"],
      default: "like",
    },
    reactedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CommunityAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
    },
    public_id: {
      type: String,
      default: "",
    },
    file_type: {
      type: String,
      enum: ["image", "video", "pdf", "document", "other"],
      default: "other",
    },
    original_name: {
      type: String,
      default: "",
    },
    mime_type: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const CommunityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    content: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    image: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },
    attachment: {
      type: CommunityAttachmentSchema,
      default: null,
    },
    post_type: {
      type: String,
      enum: ["text", "poll", "media", "document"],
      default: "text",
    },
    poll: {
      question: {
        type: String,
        trim: true,
        default: "",
      },
      options: {
        type: [CommunityPollOptionSchema],
        default: [],
      },
      ends_at: {
        type: Date,
        default: null,
      },
    },
    comments: {
      type: [CommunityCommentSchema],
      default: [],
    },
    reactions: {
      type: [CommunityReactionSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const CommunityPostModel = mongoose.model("CommunityPost", CommunityPostSchema);

export default CommunityPostModel;

import mongoose from "mongoose";

const QualitativeTaskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const QuantitativeTaskSchema = new mongoose.Schema(
  {
    parameter: {
      type: String,
      required: true,
      trim: true,
    },
    quantifiedValue: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
      default: "",
    },
    achievedValue: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const MilestoneSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    reviewers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Organization",
        },
      ],
      default: [],
    },

    qualitativeTasks: {
      type: [QualitativeTaskSchema],
      default: [],
    },

    quantitativeTasks: {
      type: [QuantitativeTaskSchema],
      default: [],
    },

    startDate: {
      type: Date,
      required: true,
    },

    targetDate: {
      type: Date,
      required: true,
    },

    progressReporting: {
      type: String,
      enum: ["Every Week", "Every Month", "Every Quarter"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "overdue", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const MilestoneModel = mongoose.model("Milestone", MilestoneSchema);

export default MilestoneModel;
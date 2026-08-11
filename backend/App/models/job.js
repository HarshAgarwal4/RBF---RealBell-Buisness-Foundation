import mongoose from "mongoose";

/* ======================= Attachment Schema ======================= */
const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, default: "" },
    original_name: { type: String, default: "" },
  },
  { _id: true }
);

/* ======================= Interview Schema ======================= */
const InterviewSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    job_title: {
      type: String,
      default: "",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    candidate_name: {
      type: String,
      required: true,
      trim: true,
    },
    candidate_email: {
      type: String,
      required: true,
      trim: true,
    },
    round_name: {
      type: String,
      default: "Technical Round 1",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    interviewer_name: {
      type: String,
      trim: true,
      default: "",
    },
    meeting_link: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Rescheduled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

/* ======================= Application Schema ======================= */
const ApplicationSchema = new mongoose.Schema(
  {
    candidate_name: { type: String, required: true },
    candidate_email: { type: String, required: true },
    candidate_phone: { type: String, default: "" },
    resume_url: { type: String, default: "" },
    cover_letter: { type: String, default: "" },
    appliedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Rejected", "Hired"],
      default: "Applied",
    },
  },
  { _id: true }
);

/* ======================= Job Schema ======================= */
const JobSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    job_overview: {
      type: String,
      required: [true, "Job overview is required"],
    },

    employment_type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      required: [true, "Employment type is required"],
    },

    workplace_type: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      required: [true, "Workplace type is required"],
    },

    industry: {
      type: String,
      required: [true, "Industry is required"],
    },

    position_open: {
      type: Number,
      required: [true, "Position open is required"],
      min: 1,
      default: 1,
    },

    locations: {
      type: [String],
      default: [],
    },

    required_skills: {
      type: [String],
      default: [],
    },

    good_to_have_skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: String,
      required: [true, "Experience is required"],
    },

    salary: {
      min_ctc: { type: Number, default: 0 },
      max_ctc: { type: Number, default: 0 },
      hide_salary: { type: Boolean, default: false },
    },

    expiry_date: {
      type: Date,
      required: [true, "Expiry date is required"],
    },

    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },

    applications: {
      type: [ApplicationSchema],
      default: [],
    },

    interviews: {
      type: [InterviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const JobModel = mongoose.models.Job || mongoose.model("Job", JobSchema);
const InterviewModel = mongoose.models.Interview || mongoose.model("Interview", InterviewSchema);

export { JobModel as default, InterviewModel, JobSchema, InterviewSchema };

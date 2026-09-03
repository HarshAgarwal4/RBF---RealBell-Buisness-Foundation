import mongoose from "mongoose";

const IncubationMentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "RealBell Ecosystem",
    },
    bio: {
      type: String,
      default: "",
    },
    expertiseAreas: [{ type: String }],
    email: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    sessionsCount: {
      type: Number,
      default: 24,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const IncubationMentorModel = mongoose.model("IncubationMentor", IncubationMentorSchema);
export default IncubationMentorModel;

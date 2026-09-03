import mongoose from "mongoose";

const IncubationAttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    dateStr: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    checkInMethod: {
      type: String,
      enum: ["qr_scan", "kiosk", "manual_admin"],
      default: "qr_scan",
    },
    location: {
      type: String,
      default: "Gate 1 Turnstile - Chandlai Center, Jaipur",
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Present", "Half Day", "Excused"],
      default: "Present",
    },
  },
  { timestamps: true }
);

// One attendance record per user per date
IncubationAttendanceSchema.index({ user: 1, dateStr: 1 }, { unique: true });

const IncubationAttendanceModel = mongoose.model("IncubationAttendance", IncubationAttendanceSchema);
export default IncubationAttendanceModel;

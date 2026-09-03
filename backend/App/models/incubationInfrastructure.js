import mongoose from "mongoose";

const IncubationInfrastructureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["desk", "meeting_room", "boardroom", "lab", "studio", "event_space"],
      default: "meeting_room",
      index: true,
    },
    capacity: {
      type: Number,
      default: 4,
    },
    location: {
      type: String,
      default: "Floor 1, Chandlai Innovation Park, Jaipur",
    },
    description: {
      type: String,
      default: "",
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Availability Settings (24/7, specific days, time slots)
    availabilityType: {
      type: String,
      enum: ["24_7", "specific_days", "time_slots"],
      default: "24_7",
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    availableTimeSlots: {
      type: [String],
      default: [
        "09:00 AM - 11:00 AM",
        "11:30 AM - 01:30 PM",
        "02:30 PM - 04:30 PM",
        "05:00 PM - 07:00 PM",
      ],
    },
    // Monthly Usage Limits for a Startup
    monthlyBookingLimit: {
      type: Number,
      default: 20, // Max 20 times per month per startup
    },
    monthlyHoursLimit: {
      type: Number,
      default: 20, // Max 20 hours per month per startup
    },
    // Dynamic Pricing & Free Quota Rules
    isFreeForNewProfiles: {
      type: Boolean,
      default: true,
    },
    freeQuotaPerUser: {
      type: Number,
      default: 3,
    },
    pricePerHour: {
      type: Number,
      default: 0,
    },
    pricePerDay: {
      type: Number,
      default: 0,
    },
    pricePerMonth: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const IncubationInfrastructureModel = mongoose.model("IncubationInfrastructure", IncubationInfrastructureSchema);
export default IncubationInfrastructureModel;

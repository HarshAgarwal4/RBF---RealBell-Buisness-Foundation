import mongoose from "mongoose";

const DayAvailabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },

    not_available: {
      type: Boolean,
      default: false,
    },

    from: {
      type: String,
      default: null,
    },

    to: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const DateAvailabilitySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
    },

    not_available: {
      type: Boolean,
      default: false,
    },

    from: {
      type: String,
      default: null,
    },

    to: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

/* ======================= Account Schema ======================= */

const AccountSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },

    designation: {
      type: String,
    },

    availability: {
      type: {
        type: String,
        enum: [
          "Anytime",
          "Temporary Unavailable",
          "Specific Days",
        ],
        default: "Anytime",
      },

      // Used when "Specific Days" option is selected
      weekly_schedule: {
        type: [DayAvailabilitySchema],
        default: [],
      },

      // Used for custom dates
      specific_dates: {
        type: [DateAvailabilitySchema],
        default: [],
      },

      // Used when "Temporary Unavailable" is selected
      unavailable_from: {
        type: Date,
        default: null,
      },

      unavailable_to: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        trim: true,
        default: "",
      },

      promotion_email: {
        type: Boolean,
        default: false,
      }
    },
  },
  {
    _id: false,
  }
);

/* ======================= Organization Schema ======================= */

const SavedProfileSchema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ConnectionSchema = new mongoose.Schema(
  {
    with: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    direction: {
      type: String,
      enum: ["sent", "received"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const OrganizationSchema = new mongoose.Schema(
  {
    company_type: {
      type: String,
      enum: ["startup", "investor", "mentor", "incubator/accelerator"],
      required: true,
    },

    investing_as: {
      type: String,
      enum: ["organization", "individual", "syndicate"],
      required: function () {
        return this.company_type === "investor";
      },
    },

    company_name: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 13,
      trim: true,
    },

    agree: {
      type: Boolean,
      default: true,
    },

    // Role-based access control
    role: {
      type: String,
      enum: ["normal", "admin", "super_admin"],
      default: "normal",
    },

    // Embedded Account Schema
    account: {
      type: AccountSchema,
      default: {},
    },

    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    saved_profiles: {
      type: [SavedProfileSchema],
      default: [],
    },

    connections: {
      type: [ConnectionSchema],
      default: [],
    },

    sessions: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const OrganizationModel = mongoose.model(
  "Organization",
  OrganizationSchema
);

export default OrganizationModel;

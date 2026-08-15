import mongoose from "mongoose";

const AuthSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "auth_config",
    },
    loginMethod: {
      type: String,
      enum: ["otp", "password", "both"],
      default: "both",
    },
    description: {
      type: String,
      default: "Global login authentication method configuration",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AuthSettingModel = mongoose.model("AuthSetting", AuthSettingSchema);

export default AuthSettingModel;

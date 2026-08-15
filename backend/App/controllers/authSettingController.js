import AuthSettingModel from "../models/authSetting.js";

export async function getEffectiveLoginMethod() {
  try {
    let setting = await AuthSettingModel.findOne({ key: "auth_config" });
    if (!setting) {
      setting = await AuthSettingModel.create({
        key: "auth_config",
        loginMethod: "both",
      });
    }
    return setting.loginMethod || "both";
  } catch (err) {
    console.error("Error fetching effective login method:", err);
    return "both";
  }
}

export async function getPublicAuthSettings(req, res) {
  try {
    const loginMethod = await getEffectiveLoginMethod();
    return res.json({
      status: 1,
      loginMethod,
    });
  } catch (err) {
    console.error("Error in getPublicAuthSettings:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
      loginMethod: "both",
    });
  }
}

export async function getAdminAuthSettings(req, res) {
  try {
    let setting = await AuthSettingModel.findOne({ key: "auth_config" }).populate(
      "updatedBy",
      "name email company_name"
    );
    if (!setting) {
      setting = await AuthSettingModel.create({
        key: "auth_config",
        loginMethod: "both",
      });
    }
    return res.json({
      status: 1,
      setting,
    });
  } catch (err) {
    console.error("Error in getAdminAuthSettings:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
    });
  }
}

export async function updateAuthSettings(req, res) {
  try {
    const { loginMethod, description } = req.body;

    if (!loginMethod || !["otp", "password", "both"].includes(loginMethod)) {
      return res.status(400).json({
        status: 7,
        msg: "Invalid login method. Allowed values: 'otp', 'password', 'both'",
      });
    }

    let setting = await AuthSettingModel.findOneAndUpdate(
      { key: "auth_config" },
      {
        loginMethod,
        ...(description ? { description } : {}),
        updatedBy: req.user?._id || null,
      },
      { new: true, upsert: true }
    );

    return res.json({
      status: 1,
      msg: `Authentication method updated to '${loginMethod}' successfully`,
      setting,
    });
  } catch (err) {
    console.error("Error in updateAuthSettings:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
    });
  }
}

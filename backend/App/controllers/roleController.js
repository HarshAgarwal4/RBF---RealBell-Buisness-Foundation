import RoleModel from "../models/role.js";
import OrganizationModel from "../models/organization.js";

// Default built-in roles seeded on startup if not present
const DEFAULT_ROLES = [
  {
    key: "startup",
    label: "Startup",
    description: "Founders and early-stage companies seeking funding, mentorship, and growth.",
    icon: "Rocket",
    isBuiltIn: true,
    hasSubtypes: false,
    profileSchema: {
      steps: [
        {
          stepId: "basic",
          title: "Startup Overview",
          description: "Basic company information and pitch",
          fields: [
            { key: "tagline", label: "Tagline", type: "text", required: true, placeholder: "One line pitch" },
            { key: "sector", label: "Sector / Industry", type: "text", required: true, placeholder: "e.g. FinTech, HealthTech" },
            { key: "stage", label: "Current Stage", type: "select", required: true, options: ["Idea", "MVP", "Early Revenue", "Scaling"] },
            { key: "website", label: "Website", type: "url", required: false, placeholder: "https://example.com" }
          ]
        }
      ]
    }
  },
  {
    key: "investor",
    label: "Investor",
    description: "Angel investors, VCs, and funds backing high-growth startups.",
    icon: "TrendingUp",
    isBuiltIn: true,
    hasSubtypes: true,
    subtypes: [
      { id: "organization", label: "Organization" },
      { id: "individual", label: "Individual Investor" },
      { id: "syndicate", label: "Syndicate" }
    ],
    profileSchema: {
      steps: [
        {
          stepId: "overview",
          title: "Investment Preferences",
          description: "Fund details and investment thesis",
          fields: [
            { key: "check_size", label: "Average Check Size", type: "text", required: false, placeholder: "$25k - $100k" },
            { key: "target_sectors", label: "Preferred Sectors", type: "text", required: false, placeholder: "SaaS, AI, BioTech" }
          ]
        }
      ]
    }
  },
  {
    key: "mentor",
    label: "Mentor",
    description: "Experienced advisors and domain experts offering guidance.",
    icon: "Users",
    isBuiltIn: true,
    hasSubtypes: false,
    profileSchema: {
      steps: [
        {
          stepId: "expertise",
          title: "Mentorship Area",
          description: "Areas of expertise and guidance",
          fields: [
            { key: "expertise_areas", label: "Key Expertise", type: "text", required: true, placeholder: "Product Management, Fundraising, Growth" },
            { key: "bio", label: "Short Bio", type: "textarea", required: false, placeholder: "Tell founders about your background..." }
          ]
        }
      ]
    }
  },
  {
    key: "incubator",
    label: "Incubator",
    description: "Organizations providing early-stage cohort programs, workspace, and resources.",
    icon: "Building2",
    isBuiltIn: true,
    hasSubtypes: false,
    profileSchema: {
      steps: [
        {
          stepId: "program",
          title: "Program Info",
          description: "Incubation program details",
          fields: [
            { key: "cohort_size", label: "Annual Cohort Size", type: "number", required: false, placeholder: "10" },
            { key: "location", label: "HQ Location", type: "text", required: false, placeholder: "City, Country" }
          ]
        }
      ]
    }
  },
  {
    key: "accelerator",
    label: "Accelerator",
    description: "Organizations running fixed-term, cohort-based growth and investment acceleration programs.",
    icon: "Building2",
    isBuiltIn: true,
    hasSubtypes: false,
    profileSchema: {
      steps: [
        {
          stepId: "program",
          title: "Program Info",
          description: "Acceleration program details",
          fields: [
            { key: "cohort_size", label: "Annual Cohort Size", type: "number", required: false, placeholder: "10" },
            { key: "location", label: "HQ Location", type: "text", required: false, placeholder: "City, Country" }
          ]
        }
      ]
    }
  }
];

export async function seedDefaultRoles() {
  try {
    // Migration: Clean up legacy combined role if present
    const legacyRole = await RoleModel.findOne({ key: "incubator/accelerator" });
    if (legacyRole) {
      await RoleModel.deleteOne({ key: "incubator/accelerator" });
    }

    // Ensure all default roles exist and have up-to-date labels/isBuiltIn flags
    for (const defRole of DEFAULT_ROLES) {
      const existing = await RoleModel.findOne({ key: defRole.key });
      if (!existing) {
        await RoleModel.create(defRole);
      } else {
        await RoleModel.updateOne(
          { key: defRole.key },
          { $set: { isBuiltIn: true, label: defRole.label, description: defRole.description } }
        );
      }
    }
    console.log("✅ Built-in roles verified and seeded.");
  } catch (err) {
    console.error("Error seeding default roles:", err);
  }
}

export async function getRoles(req, res) {
  try {
    const roles = await RoleModel.find().sort({ isBuiltIn: -1, createdAt: 1 });
    
    // Attach user count per role
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const count = await OrganizationModel.countDocuments({ company_type: role.key });
        return {
          ...role.toObject(),
          userCount: count
        };
      })
    );

    return res.json({ status: 1, roles: rolesWithUserCount });
  } catch (err) {
    console.error("getRoles error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

export async function createRole(req, res) {
  try {
    const { label, key, description, icon, hasSubtypes, subtypes, profileSchema, uiConfig } = req.body;

    if (!label || !key) {
      return res.status(400).json({ status: 7, msg: "Role label and unique key are required" });
    }

    const formattedKey = String(key).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");

    const existing = await RoleModel.findOne({ key: formattedKey });
    if (existing) {
      return res.status(400).json({ status: 3, msg: `Role key "${formattedKey}" already exists` });
    }

    const newRole = new RoleModel({
      key: formattedKey,
      label: label.trim(),
      description: description ? description.trim() : "",
      icon: icon || "Building2",
      isBuiltIn: false,
      hasSubtypes: Boolean(hasSubtypes),
      subtypes: Array.isArray(subtypes) ? subtypes : [],
      profileSchema: profileSchema || { steps: [] },
      uiConfig: uiConfig || {
        accentColor: "#d97706",
        stepperStyle: "horizontal_tabs",
        bannerTitle: "",
        bannerSubtitle: "",
        cardStyle: "bordered"
      }
    });

    await newRole.save();

    return res.json({ status: 1, msg: `Role "${label}" created successfully`, role: newRole });
  } catch (err) {
    console.error("createRole error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { label, description, icon, hasSubtypes, subtypes, profileSchema, uiConfig } = req.body;

    const role = await RoleModel.findById(id);
    if (!role) {
      return res.status(404).json({ status: 9, msg: "Role not found" });
    }

    if (label) role.label = label.trim();
    if (description !== undefined) role.description = description.trim();
    if (icon) role.icon = icon;
    if (hasSubtypes !== undefined) role.hasSubtypes = Boolean(hasSubtypes);
    if (subtypes) role.subtypes = subtypes;
    if (profileSchema) role.profileSchema = profileSchema;
    if (uiConfig) role.uiConfig = { ...role.uiConfig, ...uiConfig };

    await role.save();

    return res.json({ status: 1, msg: `Role "${role.label}" updated successfully`, role });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

export async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const { reassignTo } = req.body; // target role key to reassign users to

    const role = await RoleModel.findById(id);
    if (!role) {
      return res.status(404).json({ status: 9, msg: "Role not found" });
    }

    if (role.isBuiltIn) {
      return res.status(400).json({ status: 7, msg: "Built-in roles (Startup, Investor, Mentor, Incubator, Accelerator) cannot be deleted" });
    }

    // Check existing users in this role
    const userCount = await OrganizationModel.countDocuments({ company_type: role.key });

    if (userCount > 0) {
      if (!reassignTo) {
        return res.status(400).json({
          status: 8,
          msg: `This role has ${userCount} active user(s). Please specify a target role to reassign them to before deletion.`,
          userCount
        });
      }

      // Check if target role exists
      const targetRole = await RoleModel.findOne({ key: reassignTo });
      if (!targetRole) {
        return res.status(400).json({ status: 7, msg: `Target reassignment role "${reassignTo}" does not exist` });
      }

      if (targetRole.key === role.key) {
        return res.status(400).json({ status: 7, msg: "Target reassignment role must be different from the deleted role" });
      }

      // Reassign all users
      await OrganizationModel.updateMany(
        { company_type: role.key },
        { company_type: targetRole.key }
      );
    }

    await RoleModel.findByIdAndDelete(id);

    return res.json({
      status: 1,
      msg: `Role "${role.label}" deleted successfully. ${userCount > 0 ? `${userCount} user(s) reassigned to "${reassignTo}".` : ""}`
    });
  } catch (err) {
    console.error("deleteRole error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

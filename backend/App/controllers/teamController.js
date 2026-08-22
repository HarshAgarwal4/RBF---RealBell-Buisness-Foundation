import TeamModel from "../models/team.js";
import OrganizationModel from "../models/organization.js";
import { PERMISSION_MODULES, ALL_PERMISSIONS } from "../../services/permissions.js";
import { logAudit } from "../../services/auditLogger.js";

const DEFAULT_TEAMS = [
  {
    name: "HR",
    slug: "hr",
    department: "Human Resources",
    description: "Human resources managing recruitment, job postings, and user accounts",
    status: "active",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.create",
      "users.update",
      "jobs.view",
      "jobs.create",
      "jobs.update",
      "jobs.delete",
    ],
  },
  {
    name: "Cashier",
    slug: "cashier",
    department: "Finance",
    description: "Financial clerk managing subscription plans, invoices, and transaction logs",
    status: "active",
    permissions: [
      "dashboard.view",
      "subscriptions.view",
      "payments.view",
    ],
  },
  {
    name: "Manager",
    slug: "manager",
    department: "Operations",
    description: "Team manager with oversight of users, tickets, jobs, and community moderation",
    status: "active",
    permissions: [
      "dashboard.view",
      "users.view",
      "users.create",
      "users.update",
      "teams.view",
      "jobs.view",
      "jobs.update",
      "tickets.view",
      "tickets.update",
      "community.view",
      "community.moderate",
      "analytics.view",
      "reports.view",
    ],
  },
  {
    name: "Support Executive",
    slug: "support_executive",
    department: "Customer Helpdesk",
    description: "Helpdesk specialist handling user inquiries and support ticket resolutions",
    status: "active",
    permissions: [
      "dashboard.view",
      "tickets.view",
      "tickets.update",
      "users.view",
    ],
  },
  {
    name: "Doctor",
    slug: "doctor",
    department: "Clinical & Consulting",
    description: "Medical consultants and advisory specialists",
    status: "active",
    permissions: [
      "dashboard.view",
      "events.view",
      "resources.view",
    ],
  },
  {
    name: "Receptionist",
    slug: "receptionist",
    department: "Front Desk & Coordination",
    description: "Front desk coordination, visitor support, and event check-ins",
    status: "active",
    permissions: [
      "dashboard.view",
      "users.view",
      "tickets.view",
      "events.view",
      "events.attendees_view",
    ],
  },
];

export async function seedDefaultTeams() {
  try {
    for (const defTeam of DEFAULT_TEAMS) {
      const exists = await TeamModel.findOne({ slug: defTeam.slug });
      if (!exists) {
        await TeamModel.create(defTeam);
      }
    }
    console.log("✅ Default Organizational Teams verified and initialized.");
  } catch (err) {
    console.error("seedDefaultTeams error:", err.message);
  }
}

/**
 * Return all permission modules and valid permissions
 */
export function getAvailablePermissions(req, res) {
  return res.json({
    status: 1,
    modules: PERMISSION_MODULES,
    allPermissions: ALL_PERMISSIONS,
  });
}

/**
 * Get all teams with user counts and leader info
 */
export async function getTeams(req, res) {
  try {
    const teams = await TeamModel.find()
      .populate("leader", "name email account.image")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await OrganizationModel.countDocuments({ team: team._id });
        return {
          ...team.toObject(),
          memberCount,
        };
      })
    );

    return res.json({
      status: 1,
      teams: teamsWithMemberCount,
    });
  } catch (err) {
    console.error("getTeams error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch teams" });
  }
}

/**
 * Create a new team with permissions
 */
export async function createTeam(req, res) {
  try {
    const { name, description, department, leader, permissions, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 7, msg: "Team name is required" });
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    const existing = await TeamModel.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
        { slug },
      ],
    });

    if (existing) {
      return res.status(400).json({ status: 3, msg: `A team named "${trimmedName}" already exists` });
    }

    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => p === "*" || ALL_PERMISSIONS.includes(p))
      : [];

    const team = new TeamModel({
      name: trimmedName,
      slug,
      description: description ? description.trim() : "",
      department: department ? department.trim() : "Operations",
      leader: leader || null,
      permissions: validPermissions,
      status: status || "active",
      created_by: req.user._id,
    });

    await team.save();

    await logAudit({
      action: "TEAM_CREATED",
      performedBy: req.user,
      targetType: "Team",
      targetId: team._id,
      details: {
        name: team.name,
        department: team.department,
        permissionsCount: validPermissions.length,
        status: team.status,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({
      status: 1,
      msg: `Team "${team.name}" created successfully`,
      team,
    });
  } catch (err) {
    console.error("createTeam error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to create team" });
  }
}

/**
 * Update an existing team
 */
export async function updateTeam(req, res) {
  try {
    const { id } = req.params;
    const { name, description, department, leader, permissions, status } = req.body;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ status: 9, msg: "Team not found" });
    }

    if (name && name.trim().toLowerCase() !== team.name.toLowerCase()) {
      const trimmedName = name.trim();
      const existing = await TeamModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });
      if (existing) {
        return res.status(400).json({ status: 3, msg: `A team named "${trimmedName}" already exists` });
      }
      team.name = trimmedName;
      team.slug = trimmedName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    }

    if (description !== undefined) team.description = description.trim();
    if (department !== undefined) team.department = department.trim();
    if (leader !== undefined) team.leader = leader || null;
    if (status !== undefined) team.status = status;

    if (Array.isArray(permissions)) {
      team.permissions = permissions.filter((p) => p === "*" || ALL_PERMISSIONS.includes(p));
    }

    await team.save();

    await logAudit({
      action: "TEAM_UPDATED",
      performedBy: req.user,
      targetType: "Team",
      targetId: team._id,
      details: {
        name: team.name,
        department: team.department,
        permissionsCount: team.permissions.length,
        status: team.status,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({
      status: 1,
      msg: `Team "${team.name}" updated successfully`,
      team,
    });
  } catch (err) {
    console.error("updateTeam error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to update team" });
  }
}

/**
 * Delete a team with optional user reassignment
 */
export async function deleteTeam(req, res) {
  try {
    const { id } = req.params;
    const { reassignToTeamId } = req.body;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ status: 9, msg: "Team not found" });
    }

    const assignedCount = await OrganizationModel.countDocuments({ team: id });

    if (assignedCount > 0) {
      if (!reassignToTeamId) {
        return res.status(400).json({
          status: 8,
          msg: `This team has ${assignedCount} active user(s). Please specify a target team to reassign them to before deleting.`,
          assignedCount,
        });
      }

      const targetTeam = await TeamModel.findById(reassignToTeamId);
      if (!targetTeam || String(targetTeam._id) === String(id)) {
        return res.status(400).json({ status: 7, msg: "Invalid target reassignment team selected" });
      }

      await OrganizationModel.updateMany(
        { team: id },
        { $set: { team: targetTeam._id } }
      );
    }

    await TeamModel.findByIdAndDelete(id);

    await logAudit({
      action: "TEAM_DELETED",
      performedBy: req.user,
      targetType: "Team",
      targetId: id,
      details: {
        name: team.name,
        assignedCount,
        reassignedTo: reassignToTeamId || null,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({
      status: 1,
      msg: `Team "${team.name}" deleted successfully. ${assignedCount > 0 ? `${assignedCount} members reassigned.` : ""}`,
    });
  } catch (err) {
    console.error("deleteTeam error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to delete team" });
  }
}

/**
 * Get all members belonging to a team
 */
export async function getTeamMembers(req, res) {
  try {
    const { id } = req.params;
    const members = await OrganizationModel.find({ team: id })
      .select("name email phone company_name role team accountStatus createdAt")
      .populate("team", "name slug description permissions status");

    return res.json({
      status: 1,
      members,
    });
  } catch (err) {
    console.error("getTeamMembers error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch team members" });
  }
}

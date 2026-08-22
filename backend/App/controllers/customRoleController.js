import CustomRoleModel from "../models/customRole.js";
import OrganizationModel from "../models/organization.js";
import { PERMISSION_MODULES, ALL_PERMISSIONS } from "../../services/permissions.js";
import { logAudit } from "../../services/auditLogger.js";

const DEFAULT_RBAC_ROLES = [
  {
    name: "Manager",
    slug: "manager",
    description: "Team manager with oversight of users, tickets, jobs, and community moderation",
    isBuiltIn: false,
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
    name: "Cashier",
    slug: "cashier",
    description: "Financial clerk managing subscription plans, invoices, and transaction logs",
    isBuiltIn: false,
    status: "active",
    permissions: [
      "dashboard.view",
      "subscriptions.view",
      "payments.view",
    ],
  },
  {
    name: "HR",
    slug: "hr",
    description: "Human resources managing recruitment, job postings, and user accounts",
    isBuiltIn: false,
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
    name: "Support Executive",
    slug: "support_executive",
    description: "Helpdesk specialist handling user inquiries and support ticket resolutions",
    isBuiltIn: false,
    status: "active",
    permissions: [
      "dashboard.view",
      "tickets.view",
      "tickets.update",
      "users.view",
    ],
  },
];

export async function seedDefaultRBACRoles() {
  try {
    for (const defRole of DEFAULT_RBAC_ROLES) {
      const exists = await CustomRoleModel.findOne({ slug: defRole.slug });
      if (!exists) {
        await CustomRoleModel.create(defRole);
      }
    }
    console.log("✅ RBAC Custom Roles verified and initialized.");
  } catch (err) {
    console.error("seedDefaultRBACRoles error:", err.message);
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
 * Get all custom roles with user counts
 */
export async function getCustomRoles(req, res) {
  try {
    const roles = await CustomRoleModel.find()
      .populate("team", "name department")
      .populate("created_by", "name email")
      .sort({ createdAt: -1 });

    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const assignedUsersCount = await OrganizationModel.countDocuments({ customRole: role._id });
        return {
          ...role.toObject(),
          assignedUsersCount,
        };
      })
    );

    return res.json({
      status: 1,
      roles: rolesWithCounts,
    });
  } catch (err) {
    console.error("getCustomRoles error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch custom roles" });
  }
}

/**
 * Create a new custom role
 */
export async function createCustomRole(req, res) {
  try {
    const { name, description, team, permissions, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 7, msg: "Role name is required" });
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    const existing = await CustomRoleModel.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
        { slug },
      ],
    });

    if (existing) {
      return res.status(400).json({ status: 3, msg: `A role named "${trimmedName}" already exists` });
    }

    // Filter valid permissions or allow wildcard
    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => p === "*" || ALL_PERMISSIONS.includes(p))
      : [];

    const customRole = new CustomRoleModel({
      name: trimmedName,
      slug,
      description: description ? description.trim() : "",
      team: team || null,
      permissions: validPermissions,
      status: status || "active",
      created_by: req.user._id,
    });

    await customRole.save();

    await logAudit({
      action: "ROLE_CREATED",
      performedBy: req.user,
      targetType: "CustomRole",
      targetId: customRole._id,
      details: {
        name: customRole.name,
        permissionsCount: validPermissions.length,
        permissions: validPermissions,
        status: customRole.status,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({
      status: 1,
      msg: `Role "${customRole.name}" created successfully`,
      role: customRole,
    });
  } catch (err) {
    console.error("createCustomRole error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to create role" });
  }
}

/**
 * Update an existing custom role
 */
export async function updateCustomRole(req, res) {
  try {
    const { id } = req.params;
    const { name, description, team, permissions, status } = req.body;

    const role = await CustomRoleModel.findById(id);
    if (!role) {
      return res.status(404).json({ status: 9, msg: "Role not found" });
    }

    if (name && name.trim().toLowerCase() !== role.name.toLowerCase()) {
      const trimmedName = name.trim();
      const existing = await CustomRoleModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });
      if (existing) {
        return res.status(400).json({ status: 3, msg: `A role named "${trimmedName}" already exists` });
      }
      role.name = trimmedName;
      role.slug = trimmedName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    }

    if (description !== undefined) role.description = description.trim();
    if (team !== undefined) role.team = team || null;
    if (status !== undefined) role.status = status;

    if (Array.isArray(permissions)) {
      role.permissions = permissions.filter((p) => p === "*" || ALL_PERMISSIONS.includes(p));
    }

    await role.save();

    await logAudit({
      action: "ROLE_UPDATED",
      performedBy: req.user,
      targetType: "CustomRole",
      targetId: role._id,
      details: {
        name: role.name,
        permissionsCount: role.permissions.length,
        permissions: role.permissions,
        status: role.status,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({
      status: 1,
      msg: `Role "${role.name}" updated successfully`,
      role,
    });
  } catch (err) {
    console.error("updateCustomRole error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to update role" });
  }
}

/**
 * Delete a custom role
 */
export async function deleteCustomRole(req, res) {
  try {
    const { id } = req.params;
    const { reassignToRoleId } = req.body;

    const role = await CustomRoleModel.findById(id);
    if (!role) {
      return res.status(404).json({ status: 9, msg: "Role not found" });
    }

    if (role.isBuiltIn) {
      return res.status(400).json({ status: 7, msg: "System built-in roles cannot be deleted" });
    }

    const assignedCount = await OrganizationModel.countDocuments({ customRole: id });

    if (assignedCount > 0) {
      if (!reassignToRoleId) {
        return res.status(400).json({
          status: 8,
          msg: `This role is currently assigned to ${assignedCount} user(s). Please specify a target role to reassign them to before deleting.`,
          assignedCount,
        });
      }

      const targetRole = await CustomRoleModel.findById(reassignToRoleId);
      if (!targetRole || String(targetRole._id) === String(id)) {
        return res.status(400).json({ status: 7, msg: "Invalid target reassignment role selected" });
      }

      await OrganizationModel.updateMany(
        { customRole: id },
        { $set: { customRole: targetRole._id } }
      );
    }

    await CustomRoleModel.findByIdAndDelete(id);

    await logAudit({
      action: "ROLE_DELETED",
      performedBy: req.user,
      targetType: "CustomRole",
      targetId: id,
      details: {
        name: role.name,
        assignedCount,
        reassignedTo: reassignToRoleId || null,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"],
    });

    return res.json({
      status: 1,
      msg: `Role "${role.name}" deleted successfully. ${assignedCount > 0 ? `${assignedCount} users reassigned.` : ""}`,
    });
  } catch (err) {
    console.error("deleteCustomRole error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to delete role" });
  }
}

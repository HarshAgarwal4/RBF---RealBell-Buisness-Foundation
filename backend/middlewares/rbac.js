import OrganizationModel from "../App/models/organization.js";

/**
 * Check if a user object has a specific permission
 */
export function userHasPermission(user, requiredPermission) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.accountStatus === "disabled") return false;

  const permissions =
    user.team?.permissions ||
    user.customRole?.permissions ||
    user.permissions ||
    [];

  if (permissions.includes("*")) return true;

  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((perm) => permissions.includes(perm));
  }

  return permissions.includes(requiredPermission);
}

/**
 * Middleware: Enforces that the user has at least one of the specified permissions,
 * or is a super_admin.
 * 
 * @param {string|string[]} permissions - Single permission string or array of permissions
 */
export function authorize(permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 0, msg: "Unauthorized: Please log in" });
      }

      // Check account status
      if (req.user.accountStatus === "disabled") {
        return res.status(403).json({ status: 0, msg: "Access Forbidden: Your account has been disabled" });
      }

      // Super admin has full unrestricted access
      if (req.user.role === "super_admin") {
        return next();
      }

      // Ensure team is populated
      let user = req.user;
      if (
        (user.team && typeof user.team === "object" && !user.team.permissions) ||
        (user.team && typeof user.team !== "object")
      ) {
        user = await OrganizationModel.findById(user._id)
          .populate("team", "name slug description department permissions status");
        req.user = user;
      }

      // Check if team is inactive
      if (user.team && user.team.status === "inactive") {
        return res.status(403).json({ status: 0, msg: "Access Forbidden: Your assigned team is currently inactive" });
      }

      const userPerms =
        user.team?.permissions ||
        user.customRole?.permissions ||
        user.permissions ||
        [];

      // If user has wildcard, permit
      if (userPerms.includes("*")) {
        return next();
      }

      const permsToCheck = Array.isArray(permissions) ? permissions : [permissions];
      
      // If no permissions specified, just check if admin/super_admin or in a team
      if (permsToCheck.length === 0) {
        if (user.role === "admin" || user.role === "super_admin" || user.team || user.customRole) {
          return next();
        }
        return res.status(403).json({ status: 0, msg: "Forbidden: Admin access required" });
      }

      const hasRequiredPermission = permsToCheck.some((perm) => userPerms.includes(perm));

      if (!hasRequiredPermission) {
        return res.status(403).json({
          status: 0,
          msg: "Access Forbidden: You do not have permission to access this module",
          required: permsToCheck,
        });
      }

      next();
    } catch (err) {
      console.error("RBAC Middleware Error:", err);
      return res.status(500).json({ status: 0, msg: "Internal server error during authorization check" });
    }
  };
}

/**
 * Middleware: Restrict access exclusively to super_admin
 */
export function isSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ status: 0, msg: "Unauthorized: Please log in" });
  }
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ status: 0, msg: "Access Forbidden: Super Admin privileges required" });
  }
  next();
}

/**
 * Middleware: Allow any admin, team member, or custom role user
 */
export async function isAdminOrCustomRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ status: 0, msg: "Unauthorized: Please log in" });
  }
  if (req.user.accountStatus === "disabled") {
    return res.status(403).json({ status: 0, msg: "Access Forbidden: Account is disabled" });
  }
  if (req.user.role === "super_admin" || req.user.role === "admin" || req.user.team || req.user.customRole) {
    return next();
  }
  return res.status(403).json({ status: 0, msg: "Access Forbidden: Admin access required" });
}

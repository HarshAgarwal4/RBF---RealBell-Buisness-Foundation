import { authorize, isSuperAdmin, isAdminOrCustomRole, userHasPermission } from "./rbac.js";

/**
 * Middleware: Allow admin, super_admin, or custom-role users
 */
async function isAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ status: 0, msg: "Unauthorized: Not logged in" });
    }
    if (req.user.accountStatus === "disabled") {
        return res.status(403).json({ status: 0, msg: "Forbidden: Account has been disabled" });
    }
    if (req.user.role === "admin" || req.user.role === "super_admin" || req.user.customRole || Boolean(req.user.team)) {
        return next();
    }
    return res.status(403).json({ status: 0, msg: "Forbidden: Admin access required" });
}

export { isAdmin, isSuperAdmin, authorize, isAdminOrCustomRole, userHasPermission };

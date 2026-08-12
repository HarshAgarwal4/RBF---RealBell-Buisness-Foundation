import OrganizationModel from "../App/models/organization.js";

/**
 * Middleware: Allow only admin or super_admin roles
 */
async function isAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ status: 0, msg: "Unauthorized: Not logged in" });
    }
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
        return res.status(403).json({ status: 0, msg: "Forbidden: Admin access required" });
    }
    next();
}

/**
 * Middleware: Allow only super_admin role
 */
async function isSuperAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ status: 0, msg: "Unauthorized: Not logged in" });
    }
    if (req.user.role !== "super_admin") {
        return res.status(403).json({ status: 0, msg: "Forbidden: Super admin access required" });
    }
    next();
}

export { isAdmin, isSuperAdmin };

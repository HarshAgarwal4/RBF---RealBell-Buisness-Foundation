import userModel from "../App/models/organization.js";
import { getUser } from "../services/Auth.js";

/**
 * Helper to get normalized route path from request
 */
function getRoutePath(req) {
  const raw = req.originalUrl || req.url || req.path || "";
  return raw.split("?")[0];
}

/**
 * Helper to identify routes that unauthenticated guests can access
 */
function isPublicRoute(req) {
  const path = getRoutePath(req);
  const method = req.method;

  // Root endpoint
  if (path === "/" && method === "GET") return true;

  // Unauthenticated authentication endpoints
  if (
    method === "POST" &&
    (path === "/signup" ||
      path === "/signup/send-otp" ||
      path === "/login" ||
      path === "/sendotp" ||
      path === "/forgot-password/send-otp" ||
      path === "/forgot-password/reset")
  ) {
    return true;
  }

  // Public GET endpoints (for signup dropdowns, landing pages, etc.)
  if (
    method === "GET" &&
    (path === "/roles" ||
      path === "/auth-settings" ||
      path === "/plans" ||
      path.startsWith("/page-content") ||
      path.startsWith("/events/public") ||
      path.startsWith("/programs/public") ||
      path.startsWith("/resources/public") ||
      path.startsWith("/jobs/public") ||
      path.startsWith("/legal-compliance/services") ||
      path.startsWith("/legal-compliances/services"))
  ) {
    return true;
  }

  return false;
}

/**
 * Helper to identify endpoints accessible to authenticated users awaiting approval
 */
function isAllowedDuringApproval(req) {
  const path = getRoutePath(req);
  if (
    path === "/me" ||
    path === "/logout" ||
    path.startsWith("/approvals/my-status") ||
    path.startsWith("/approvals/my-submission") ||
    path.startsWith("/approvals/upload-document") ||
    path.startsWith("/my-status") ||
    path.startsWith("/my-submission") ||
    path.startsWith("/upload-document")
  ) {
    return true;
  }
  return false;
}

/**
 * Authentication middleware
 * Validates JWT session cookie UID, attaches req.user, and enforces approval checks
 */
async function isLoggedIn(req, res, next) {
  req.user = null;
  const token = req.cookies?.UID;

  if (token) {
    try {
      const decoded = getUser(token);
      if (decoded && decoded.id) {
        const findUser = await userModel.findById(decoded.id)
          .populate("customRole", "name slug permissions status")
          .populate("team", "name slug description department permissions status")
          .populate("approvalSubmission");
        if (findUser) {
          if (findUser.accountStatus === "disabled") {
            res.clearCookie("UID");
            return res.status(403).json({ status: 54, msg: "Access Forbidden: Account is disabled" });
          }
          const hasSession =
            findUser.sessions &&
            (findUser.sessions.some((s) => s.token === token) ||
              findUser.sessions[0]?.token === token);
          if (hasSession) {
            req.user = findUser;

            // Auto-grant approval for super_admin
            if (findUser.role === "super_admin" && findUser.approvalStatus !== "Approved") {
              findUser.approvalStatus = "Approved";
              await findUser.save();
            }

            // Enforce Approval restriction on protected dashboard APIs
            if (
              findUser.role !== "super_admin" &&
              findUser.approvalStatus !== "Approved" &&
              !isPublicRoute(req) &&
              !isAllowedDuringApproval(req)
            ) {
              return res.status(403).json({
                status: 403,
                code: "APPROVAL_REQUIRED",
                approvalStatus: findUser.approvalStatus || "Pending Form",
                msg: "Dashboard access is restricted until your application is approved by Super Admin.",
              });
            }

            return next();
          }
        }
      }
    } catch (err) {
      console.error("Auth middleware error:", err);
    }
  }

  // If unauthenticated, allow public routes to pass with req.user = null
  if (isPublicRoute(req)) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ status: 50, msg: "No token found" });
  }

  return res.status(401).json({ status: 53, msg: "Unauthorized: Invalid credentials or session expired" });
}

export { isLoggedIn };
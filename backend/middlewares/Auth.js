import userModel from "../App/models/organization.js";
import { getUser } from "../services/Auth.js";

/**
 * Helper to identify routes that unauthenticated guests can access
 */
function isPublicRoute(req) {
  const path = req.path;
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
 * Authentication middleware
 * Validates JWT session cookie UID and attaches req.user
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
          .populate("team", "name slug description department permissions status");
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
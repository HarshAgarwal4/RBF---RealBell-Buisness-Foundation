import PlanModel from "../App/models/plan.js";

/**
 * Backend Subscription Guard Middleware
 * 
 * Verifies that the authenticated user has an active subscription
 * and that the requested module is enabled in their assigned subscription plan.
 * 
 * Super Admins, Admins, and Team Staff automatically bypass these checks.
 */
export function requireSubscription(moduleKey) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          status: 0,
          code: "UNAUTHORIZED",
          msg: "Authentication required.",
        });
      }

      // Super Admins, Admins, and Staff bypass subscription restrictions
      if (user.role === "super_admin" || user.role === "admin" || Boolean(user.team)) {
        return next();
      }

      const subscription = user.subscription;
      const hasExpired = subscription?.endDate && new Date(subscription.endDate) < new Date();
      const isSubActive = subscription?.status === "active" && !hasExpired;
      const planKey = isSubActive ? (subscription?.planKey || "free") : "free";

      if (!isSubActive) {
        return res.status(403).json({
          status: 0,
          code: hasExpired ? "SUBSCRIPTION_EXPIRED" : "SUBSCRIPTION_REQUIRED",
          msg: hasExpired
            ? `Your subscription expired on ${new Date(subscription.endDate).toLocaleDateString("en-IN")}. Please renew your plan to continue.`
            : `An active subscription is required to perform this action (${moduleKey}). Please upgrade your plan.`,
        });
      }

      // Check module inclusion from plan document in database
      const planDoc = await PlanModel.findOne({ key: planKey, is_deleted: { $ne: true } }).lean();

      if (!planDoc) {
        // Fallback for hardcoded seed tiers if plan doc is not found
        if (planKey === "enterprise_vip") return next();
        if (planKey === "pro_growth") {
          const proBlocked = ["booster", "legal_compliance", "certificates"];
          if (!proBlocked.includes(moduleKey)) return next();
        }

        return res.status(403).json({
          status: 0,
          code: "MODULE_RESTRICTED",
          msg: `Your current subscription plan (${planKey}) does not include access to the '${moduleKey}' module.`,
        });
      }

      // Check if module is explicitly included and enabled in the plan
      const isIncluded = Array.isArray(planDoc.included_modules) && planDoc.included_modules.some(
        (m) => m.module_key === moduleKey && m.is_enabled !== false
      );

      if (!isIncluded) {
        return res.status(403).json({
          status: 0,
          code: "MODULE_RESTRICTED",
          msg: `Access denied: Your current plan "${planDoc.name}" does not include access to ${moduleKey}. Please upgrade your subscription.`,
        });
      }

      return next();
    } catch (err) {
      console.error("Subscription guard middleware error:", err);
      return res.status(500).json({ status: 0, msg: "Internal subscription verification error" });
    }
  };
}

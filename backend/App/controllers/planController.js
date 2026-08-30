import PlanModel from "../models/plan.js";
import TransactionModel from "../models/transaction.js";
import OrganizationModel from "../models/organization.js";
import { DEFAULT_SUBSCRIPTION_MODULES } from "../../services/subscriptionModules.js";

/**
 * Seed 3 default subscription plans with rich predefined module access lines
 */
export async function seedDefaultPlans() {
  try {
    const count = await PlanModel.countDocuments({ is_deleted: { $ne: true } });
    if (count > 0) return;

    const defaultPlans = [
      {
        key: "free",
        name: "Starter Free",
        description: "Essential access for new startups, mentors, and community exploration.",
        price: 0,
        currency: "INR",
        interval: "monthly",
        tier_rank: 1,
        badge: "Free Forever",
        accentColor: "#64748b",
        status: "active",
        isActive: true,
        included_modules: [
          {
            module_key: "community",
            module_name: "Community Wall",
            access_line: "View Ecosystem Announcements & Public Founder Pitch Wall",
            is_enabled: true,
          },
          {
            module_key: "jobs",
            module_name: "Job Opportunities",
            access_line: "Browse Active Startup Jobs & Internships",
            is_enabled: true,
          },
          {
            module_key: "resources",
            module_name: "Resource Library",
            access_line: "Access Free Startup Guides & Industry Glossary",
            is_enabled: true,
          },
          {
            module_key: "tickets",
            module_name: "Support Helpdesk",
            access_line: "Standard Community Support Desk",
            is_enabled: true,
          },
        ],
        custom_features: ["Up to 5 Connection Requests / month", "Public Profile Directory Listing"],
        features: [
          "View Ecosystem Announcements & Public Founder Pitch Wall",
          "Browse Active Startup Jobs & Internships",
          "Access Free Startup Guides & Industry Glossary",
          "Standard Community Support Desk",
          "Up to 5 Connection Requests / month",
        ],
      },
      {
        key: "pro_growth",
        name: "Pro Growth",
        description: "Accelerated features for active founders, scaling ventures, and mentors.",
        price: 1999,
        currency: "INR",
        interval: "monthly",
        tier_rank: 2,
        badge: "Most Popular",
        accentColor: "#6366f1",
        status: "active",
        isActive: true,
        included_modules: [
          {
            module_key: "connections",
            module_name: "My Connections",
            access_line: "Unlimited Ecosystem Connections & Direct Matchmaking",
            is_enabled: true,
          },
          {
            module_key: "messages",
            module_name: "Direct Messaging",
            access_line: "Direct 1-on-1 Messaging & Founder Chat Threads",
            is_enabled: true,
          },
          {
            module_key: "meetings",
            module_name: "Scheduled Meetings",
            access_line: "Live Meetings & 1-on-1 Advisory Consultations",
            is_enabled: true,
          },
          {
            module_key: "live_sessions",
            module_name: "Live Sessions & Rooms",
            access_line: "Virtual Live Sessions, Pitch Rooms & Stage Access",
            is_enabled: true,
          },
          {
            module_key: "milestones",
            module_name: "Milestone Tracking",
            access_line: "Startup Milestone Accountability & KPI Tracking",
            is_enabled: true,
          },
          {
            module_key: "programs",
            module_name: "Incubation Programs",
            access_line: "Priority Incubation & Cohort Grant Applications",
            is_enabled: true,
          },
          {
            module_key: "events",
            module_name: "Events & Workshops",
            access_line: "Priority RSVP for Ecosystem Events & Workshops",
            is_enabled: true,
          },
          {
            module_key: "assessments",
            module_name: "Tests & Assessments",
            access_line: "Skill Assessments, Testing Suite & Growth Analytics",
            is_enabled: true,
          },
          {
            module_key: "community",
            module_name: "Community Wall",
            access_line: "Publish Pitch Updates & Interact on Community Wall",
            is_enabled: true,
          },
          {
            module_key: "tickets",
            module_name: "Support Helpdesk",
            access_line: "Priority Technical Helpdesk & Ticket Support",
            is_enabled: true,
          },
        ],
        custom_features: ["Priority Listing in Directory", "24/7 Priority Support"],
        features: [
          "Unlimited Ecosystem Connections & Direct Matchmaking",
          "Direct 1-on-1 Messaging & Founder Chat Threads",
          "Live Meetings & 1-on-1 Advisory Consultations",
          "Virtual Live Sessions, Pitch Rooms & Stage Access",
          "Startup Milestone Accountability & KPI Tracking",
          "Priority Incubation & Cohort Grant Applications",
          "Skill Assessments, Testing Suite & Growth Analytics",
        ],
      },
      {
        key: "enterprise_vip",
        name: "Enterprise VIP",
        description: "Unlimited corporate, investor syndicate, and VIP ecosystem suite.",
        price: 4999,
        currency: "INR",
        interval: "monthly",
        tier_rank: 3,
        badge: "Best Value",
        accentColor: "#f59e0b",
        status: "active",
        isActive: true,
        included_modules: DEFAULT_SUBSCRIPTION_MODULES.map((m) => ({ ...m })),
        custom_features: [
          "Dedicated Account Manager",
          "Custom Profile Schema & Brand Verification",
          "Syndicate & Deal Flow Matchmaking",
        ],
        features: [
          "All Pro Growth Services & Priority Stage Access",
          "₹25,00,000+ Partner Cloud Credits, Discounts & Toolkits",
          "Legal Compliance Filing & Statutory Document Vault",
          "Automated Verifiable Digital Certificates",
          "Dedicated Account Manager & Deal Flow Access",
        ],
      },
    ];

    await PlanModel.insertMany(defaultPlans);
    console.log("Default subscription plans seeded with module access lines.");
  } catch (err) {
    console.error("Error seeding default plans:", err);
  }
}

/**
 * Get active plans (Public / User)
 * - Returns all 'active' plans for new purchases.
 * - If the current logged-in user holds a 'disabled' plan, includes it with is_legacy: true so they can see their plan.
 */
export async function getActivePlans(req, res) {
  try {
    const activePlans = await PlanModel.find({
      is_deleted: { $ne: true },
      status: "active",
    })
      .sort({ tier_rank: 1, price: 1 })
      .lean();

    let userLegacyPlan = null;
    const userPlanKey = req.user?.subscription?.planKey;

    if (userPlanKey && req.user?.subscription?.status === "active") {
      const isAlreadyActive = activePlans.some((p) => p.key === userPlanKey);
      if (!isAlreadyActive) {
        // User owns a disabled/legacy plan
        const legacyDoc = await PlanModel.findOne({
          key: userPlanKey,
          is_deleted: { $ne: true },
        }).lean();

        if (legacyDoc) {
          userLegacyPlan = {
            ...legacyDoc,
            is_legacy: true,
            badge: legacyDoc.badge || "Legacy Subscription",
          };
        }
      }
    }

    return res.json({
      status: 1,
      plans: activePlans,
      userLegacyPlan,
      defaultModules: DEFAULT_SUBSCRIPTION_MODULES,
    });
  } catch (err) {
    console.error("Error fetching active plans:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Get all plans (Admin) with live purchase statistics and subscriber counts
 */
export async function getAllPlansAdmin(req, res) {
  try {
    const plans = await PlanModel.find({ is_deleted: { $ne: true } })
      .sort({ tier_rank: 1, price: 1 })
      .lean();

    // Enrich each plan with exact live subscriber counts
    const enriched = await Promise.all(
      plans.map(async (p) => {
        const [txnPurchases, activeSubscribers] = await Promise.all([
          TransactionModel.countDocuments({
            $or: [{ plan: p._id }, { planKey: p.key }],
            status: "paid",
          }),
          OrganizationModel.countDocuments({
            "subscription.planKey": p.key,
            "subscription.status": "active",
          }),
        ]);

        const totalPurchases = Math.max(p.purchased_count || 0, txnPurchases);

        return {
          ...p,
          purchased_count: totalPurchases,
          active_subscribers: activeSubscribers,
          can_delete: totalPurchases === 0 && activeSubscribers === 0,
        };
      })
    );

    return res.json({
      status: 1,
      plans: enriched,
      defaultModules: DEFAULT_SUBSCRIPTION_MODULES,
    });
  } catch (err) {
    console.error("Error fetching admin plans:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Create a new plan (Admin)
 */
export async function createPlan(req, res) {
  try {
    const {
      key,
      name,
      description,
      price,
      currency,
      interval,
      tier_rank,
      badge,
      accentColor,
      status,
      included_modules,
      custom_features,
    } = req.body;

    if (!key || !name) {
      return res.status(400).json({ status: 0, msg: "Plan key and name are required" });
    }

    const cleanKey = key.toLowerCase().trim().replace(/\s+/g, "_");
    const existing = await PlanModel.findOne({ key: cleanKey, is_deleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({ status: 0, msg: "Plan with this key already exists" });
    }

    // Process included modules
    const modulesArray = Array.isArray(included_modules)
      ? included_modules.map((m) => ({
          module_key: m.module_key,
          module_name: m.module_name || m.module_key,
          access_line: m.access_line || "Access Available",
          is_enabled: m.is_enabled !== false,
        }))
      : [];

    // Compile display features
    const compiledFeatures = [
      ...modulesArray.filter((m) => m.is_enabled).map((m) => m.access_line),
      ...(Array.isArray(custom_features) ? custom_features : []),
    ];

    const plan = await PlanModel.create({
      key: cleanKey,
      name: name.trim(),
      description: description ? description.trim() : "",
      price: Math.max(0, parseFloat(price) || 0),
      currency: currency || "INR",
      interval: interval || "monthly",
      tier_rank: parseInt(tier_rank, 10) || 1,
      badge: badge ? badge.trim() : "",
      accentColor: accentColor || "#6366f1",
      status: status || "active",
      isActive: status !== "disabled",
      included_modules: modulesArray,
      custom_features: Array.isArray(custom_features) ? custom_features : [],
      features: compiledFeatures,
    });

    return res.json({
      status: 1,
      msg: "Subscription plan created successfully",
      plan,
    });
  } catch (err) {
    console.error("Error creating plan:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Update an existing plan (Admin)
 */
export async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    const plan = await PlanModel.findOne({ _id: id, is_deleted: { $ne: true } });
    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Plan not found" });
    }

    const {
      name,
      description,
      price,
      currency,
      interval,
      tier_rank,
      badge,
      accentColor,
      status,
      included_modules,
      custom_features,
    } = req.body;

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description.trim();
    if (price !== undefined) plan.price = Math.max(0, parseFloat(price) || 0);
    if (currency) plan.currency = currency;
    if (interval) plan.interval = interval;
    if (tier_rank !== undefined) plan.tier_rank = parseInt(tier_rank, 10) || plan.tier_rank;
    if (badge !== undefined) plan.badge = badge.trim();
    if (accentColor) plan.accentColor = accentColor;
    if (status) {
      plan.status = status;
      plan.isActive = status === "active";
    }

    if (Array.isArray(included_modules)) {
      plan.included_modules = included_modules.map((m) => ({
        module_key: m.module_key,
        module_name: m.module_name || m.module_key,
        access_line: m.access_line || "Access Available",
        is_enabled: m.is_enabled !== false,
      }));
    }

    if (Array.isArray(custom_features)) {
      plan.custom_features = custom_features.filter(Boolean);
    }

    // Sync features string list
    plan.features = [
      ...plan.included_modules.filter((m) => m.is_enabled).map((m) => m.access_line),
      ...(plan.custom_features || []),
    ];

    await plan.save();

    return res.json({
      status: 1,
      msg: "Subscription plan updated successfully",
      plan,
    });
  } catch (err) {
    console.error("Error updating plan:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Toggle plan status (Enable / Disable)
 */
export async function togglePlanStatus(req, res) {
  try {
    const { id } = req.params;
    const plan = await PlanModel.findOne({ _id: id, is_deleted: { $ne: true } });
    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Plan not found" });
    }

    const newStatus = plan.status === "active" ? "disabled" : "active";
    plan.status = newStatus;
    plan.isActive = newStatus === "active";
    await plan.save();

    return res.json({
      status: 1,
      msg: `Plan is now ${newStatus === "active" ? "Active (Available for purchases)" : "Disabled (Legacy for existing owners)"}`,
      plan,
    });
  } catch (err) {
    console.error("Error toggling plan status:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Delete a plan (Admin)
 * Rule:
 * - If never purchased by any user (0 transactions & 0 subscribers), can delete permanently.
 * - If already purchased by 1 or more users, reject deletion and instruct to disable.
 */
export async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    const plan = await PlanModel.findById(id);
    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Plan not found" });
    }

    // Check purchase history & active users
    const [purchaseCount, activeSubscribers] = await Promise.all([
      TransactionModel.countDocuments({
        $or: [{ plan: plan._id }, { planKey: plan.key }],
        status: "paid",
      }),
      OrganizationModel.countDocuments({
        "subscription.planKey": plan.key,
      }),
    ]);

    const totalPurchased = Math.max(plan.purchased_count || 0, purchaseCount, activeSubscribers);

    if (totalPurchased > 0) {
      return res.status(400).json({
        status: 0,
        msg: `Cannot delete plan "${plan.name}": It has already been purchased by ${totalPurchased} user(s). You can disable it instead so it remains active for existing owners as a Legacy Subscription.`,
        can_disable: true,
      });
    }

    // Permanently remove plan since no user has ever purchased it
    await PlanModel.findByIdAndDelete(id);

    return res.json({
      status: 1,
      msg: `Plan "${plan.name}" had 0 purchases and was permanently deleted.`,
    });
  } catch (err) {
    console.error("Error deleting plan:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

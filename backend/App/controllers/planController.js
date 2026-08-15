import PlanModel from "../models/plan.js";

/**
 * Seed 3 default subscription plans if database is empty
 */
export async function seedDefaultPlans() {
  try {
    const count = await PlanModel.countDocuments();
    if (count > 0) return;

    const defaultPlans = [
      {
        key: "free",
        name: "Starter Free",
        description: "Essential access for new startups, mentors, and community members.",
        price: 0,
        currency: "INR",
        interval: "monthly",
        badge: "Free Forever",
        accentColor: "#64748b",
        isActive: true,
        features: [
          "Access to Community Wall",
          "Public Profile Listing",
          "Up to 5 Connection Requests / month",
          "Basic Ticket Support",
        ],
      },
      {
        key: "pro_growth",
        name: "Pro Growth",
        description: "Accelerated features for growing startups, active mentors, and investors.",
        price: 1999,
        currency: "INR",
        interval: "monthly",
        badge: "Most Popular",
        accentColor: "#6366f1",
        isActive: true,
        features: [
          "Unlimited Connection Requests",
          "Direct 1-on-1 Messaging & Video Calls",
          "Priority Program & Event Applications",
          "Featured Listing in Directory",
          "24/7 Priority Support",
        ],
      },
      {
        key: "enterprise_vip",
        name: "Enterprise VIP",
        description: "Unlimited corporate, investor syndicate, and VIP ecosystem access.",
        price: 4999,
        currency: "INR",
        interval: "monthly",
        badge: "Best Value",
        accentColor: "#f59e0b",
        isActive: true,
        features: [
          "All Pro Growth Features",
          "Dedicated Account Manager",
          "Custom Profile Schema & Banner Design",
          "Unlimited Booster Kit Downloads",
          "Syndicate & Deal Flow Access",
        ],
      },
    ];

    await PlanModel.insertMany(defaultPlans);
    console.log("Default subscription plans seeded successfully.");
  } catch (err) {
    console.error("Error seeding default plans:", err);
  }
}

/**
 * Get active plans (Public / User)
 */
export async function getActivePlans(req, res) {
  try {
    const plans = await PlanModel.find({ isActive: true }).sort({ price: 1 });
    return res.json({ status: 1, plans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Get all plans (Admin)
 */
export async function getAllPlansAdmin(req, res) {
  try {
    const plans = await PlanModel.find().sort({ createdAt: -1 });
    return res.json({ status: 1, plans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Create a new plan (Admin)
 */
export async function createPlan(req, res) {
  try {
    const { key, name, description, price, currency, interval, features, badge, accentColor, isActive } = req.body;

    if (!key || !name) {
      return res.status(400).json({ status: 0, msg: "Plan key and name are required" });
    }

    const existing = await PlanModel.findOne({ key: key.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ status: 0, msg: "Plan with this key already exists" });
    }

    const plan = await PlanModel.create({
      key: key.toLowerCase().trim(),
      name,
      description,
      price: parseFloat(price) || 0,
      currency: currency || "INR",
      interval: interval || "monthly",
      features: Array.isArray(features) ? features : typeof features === "string" ? features.split(",").map(f => f.trim()) : [],
      badge: badge || "",
      accentColor: accentColor || "#6366f1",
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.json({ status: 1, msg: "Subscription plan created successfully", plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Update an existing plan (Admin)
 */
export async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.features && typeof updates.features === "string") {
      updates.features = updates.features.split(",").map(f => f.trim());
    }

    const plan = await PlanModel.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Plan not found" });
    }

    return res.json({ status: 1, msg: "Plan updated successfully", plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Delete a plan (Admin)
 */
export async function deletePlan(req, res) {
  try {
    const { id } = req.params;
    const plan = await PlanModel.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json({ status: 0, msg: "Plan not found" });
    }
    return res.json({ status: 1, msg: "Plan deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

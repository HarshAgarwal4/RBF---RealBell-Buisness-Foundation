import BoosterKitModel from "../models/boosterKit.js";
import BoosterApplicationModel from "../models/boosterApplication.js";
import { uploadFileToCloud } from "../../services/upload.js";

// Default initial booster kit perks to seed if empty
const DEFAULT_BOOSTER_PERKS = [
  {
    title: "AWS Cloud Activate Credits ($5,000)",
    provider: "Amazon Web Services",
    category: "cloud_devops",
    tagline: "Compute, database, and storage credits for expanding tech businesses",
    description:
      "Get up to $5,000 in AWS promotional credits valid for 1 year, plus 1 year of AWS Business Support (up to $1,500) and 80 credits for self-paced training. Accelerate your cloud infrastructure with enterprise-grade security.",
    perk_value: "$5,000 Credits",
    redemption_type: "manual_review",
    redemption_url: "https://aws.amazon.com/activate/",
    eligibility_criteria: "Incorporated startup or MSME under 5 years old, not previously awarded AWS portfolio credits.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    featured: true,
    status: "active",
  },
  {
    title: "HubSpot for Startups & Scaleups (75% Off)",
    provider: "HubSpot",
    category: "sales_marketing",
    tagline: "All-in-one CRM, Marketing, Sales, and Customer Service Suite",
    description:
      "Access HubSpot's growth platform including CRM, Marketing Automation, Sales Hub, and CMS with 75% off in Year 1 and 50% off in Year 2. Includes 24/7 priority customer support and onboarding consultation.",
    perk_value: "75% Discount",
    redemption_type: "coupon_code",
    redemption_code: "RBF-HUBSPOT-75",
    redemption_url: "https://www.hubspot.com/startups",
    eligibility_criteria: "Active RealBell ecosystem registered business.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/3/3f/HubSpot_Logo.svg",
    featured: true,
    status: "active",
  },
  {
    title: "Razorpay PG & Neo-Banking Suite (Zero Setup Fee)",
    provider: "Razorpay",
    category: "finance_payments",
    tagline: "Zero gateway integration fee, ₹2 Lakhs free transaction credits & corporate card access",
    description:
      "Accept domestic and international payments seamlessly via UPI, Credit Cards, NetBanking, and Wallets. Benefit from waived setup fees, waived annual maintenance charges, and priority onboarding with RazorpayX current account.",
    perk_value: "₹2,00,000 Credits",
    redemption_type: "instant_unlock",
    redemption_code: "RBF-RAZORPAY-BOOST",
    redemption_url: "https://razorpay.com",
    eligibility_criteria: "Indian registered business entity with valid GST or PAN.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg",
    featured: true,
    status: "active",
  },
  {
    title: "Zoho One 1-Year Free Growth Suite",
    provider: "Zoho",
    category: "tools_software",
    tagline: "45+ integrated business applications for accounting, HR, CRM, and operations",
    description:
      "Manage your entire enterprise from a single pane of glass. Zoho One provides Zoho Books (GST accounting), Zoho People (HRMS), Zoho Desk, and Zoho Projects for up to 5 team members free for 1 year.",
    perk_value: "₹1,20,000 Value",
    redemption_type: "manual_review",
    redemption_url: "https://www.zoho.com/one/",
    eligibility_criteria: "Registered MSME or startup on RealBell platform.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Zoho_Corporation_logo.svg",
    featured: false,
    status: "active",
  },
  {
    title: "Legal & IP Trademark Registration Pack",
    provider: "RealBell Legal Services",
    category: "legal_compliance",
    tagline: "Complimentary Trademark Search & 50% discount on Trademark Filing & Founders' Agreement",
    description:
      "Protect your brand identity and solidify your corporate structure. Includes comprehensive Trademark Search Report, drafting Founders' Agreement, Employment Agreement templates, and statutory compliance audit.",
    perk_value: "₹25,000 Value",
    redemption_type: "manual_review",
    redemption_url: "",
    eligibility_criteria: "All early-stage founders and growth businesses.",
    logo_url: "",
    featured: true,
    status: "active",
  },
  {
    title: "Google Cloud Platform Startup Booster ($2,000)",
    provider: "Google Cloud",
    category: "cloud_devops",
    tagline: "Google Cloud compute, Firebase, Google Workspace, and AI Vertex Studio credits",
    description:
      "Deploy scalable applications on Google Cloud Platform with $2,000 in GCP credits, technical guidance from Google engineers, and 12 months of free Google Workspace Business Starter for up to 10 users.",
    perk_value: "$2,000 Credits",
    redemption_type: "manual_review",
    redemption_url: "https://cloud.google.com/startup",
    eligibility_criteria: "Active member of RealBell Business Foundation.",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg",
    featured: false,
    status: "active",
  },
];

// Helper: Seed default perks if database is empty
async function ensureDefaultPerksSeeded() {
  try {
    const count = await BoosterKitModel.countDocuments({ is_deleted: { $ne: true } });
    if (count === 0) {
      await BoosterKitModel.insertMany(DEFAULT_BOOSTER_PERKS);
    }
  } catch (err) {
    console.warn("Could not seed default booster perks:", err.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// USER CONTROLLERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * GET /booster/items
 * Lists all active booster kit items with search & category filters,
 * and attaches current user's claim status.
 */
export async function getBoosterItems(req, res) {
  try {
    await ensureDefaultPerksSeeded();

    const { category, search, featured } = req.query;
    const filter = { is_deleted: { $ne: true }, status: "active" };

    if (category && category !== "all") {
      filter.category = category;
    }
    if (featured === "true") {
      filter.featured = true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { provider: { $regex: q, $options: "i" } },
        { tagline: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const items = await BoosterKitModel.find(filter).sort({ featured: -1, createdAt: -1 }).lean();

    // Attach user application status if user is authenticated
    const userId = req.user?._id;
    let userApplications = [];
    if (userId) {
      userApplications = await BoosterApplicationModel.find({ user_id: userId }).lean();
    }

    const appMap = new Map();
    userApplications.forEach((app) => {
      appMap.set(String(app.booster_id), app);
    });

    const enrichedItems = items.map((item) => {
      const userApp = appMap.get(String(item._id));
      return {
        ...item,
        userApplication: userApp
          ? {
              _id: userApp._id,
              status: userApp.status,
              assigned_code: userApp.assigned_code,
              createdAt: userApp.createdAt,
            }
          : null,
      };
    });

    // Compute category counts
    const allActive = await BoosterKitModel.find({ is_deleted: { $ne: true }, status: "active" }).select("category perk_value").lean();
    const categoryCounts = { all: allActive.length };
    allActive.forEach((item) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    return res.json({
      status: 1,
      items: enrichedItems,
      categoryCounts,
      myApplicationsCount: userApplications.length,
    });
  } catch (error) {
    console.error("Error fetching booster items:", error);
    return res.status(500).json({ status: 0, msg: "Failed to load booster items" });
  }
}

/**
 * GET /booster/items/:id
 * Get single booster kit item details + user claim status
 */
export async function getBoosterItemById(req, res) {
  try {
    const { id } = req.params;
    const item = await BoosterKitModel.findOne({ _id: id, is_deleted: { $ne: true } }).lean();
    if (!item) {
      return res.status(404).json({ status: 0, msg: "Booster perk not found" });
    }

    let userApplication = null;
    if (req.user?._id) {
      userApplication = await BoosterApplicationModel.findOne({
        booster_id: id,
        user_id: req.user._id,
      }).lean();
    }

    return res.json({
      status: 1,
      item: {
        ...item,
        userApplication,
      },
    });
  } catch (error) {
    console.error("Error fetching booster item by ID:", error);
    return res.status(500).json({ status: 0, msg: "Failed to load booster perk" });
  }
}

/**
 * POST /booster/items/:id/apply
 * Apply / Claim a booster kit perk
 */
export async function applyBoosterPerk(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const perk = await BoosterKitModel.findOne({ _id: id, is_deleted: { $ne: true }, status: "active" });
    if (!perk) {
      return res.status(404).json({ status: 0, msg: "Booster perk is no longer available" });
    }

    // Check if user already applied
    const existing = await BoosterApplicationModel.findOne({ booster_id: id, user_id: userId });
    if (existing) {
      return res.status(400).json({
        status: 0,
        msg: `You have already applied for this perk. Status: ${existing.status.toUpperCase()}`,
        application: existing,
      });
    }

    const {
      company_name,
      applicant_name,
      email,
      phone,
      website,
      startup_stage,
      use_case_notes,
    } = req.body;

    // Instant unlock or coupon code perks are auto-approved immediately!
    const isInstant = perk.redemption_type === "instant_unlock" || perk.redemption_type === "coupon_code";
    const initialStatus = isInstant ? "approved" : "pending";
    const assignedCode = isInstant ? perk.redemption_code || "RBF-BOOST-ACTIVE" : "";

    const application = await BoosterApplicationModel.create({
      booster_id: id,
      user_id: userId,
      company_name: company_name || req.user.company_name || req.user.name,
      applicant_name: applicant_name || req.user.name,
      email: email || req.user.email,
      phone: phone || req.user.phone || "",
      website: website || req.user.website || "",
      startup_stage: startup_stage || "Early Stage",
      use_case_notes: use_case_notes || "",
      status: initialStatus,
      assigned_code: assignedCode,
    });

    // Increment claim count on perk
    await BoosterKitModel.findByIdAndUpdate(id, { $inc: { claim_count: 1 } });

    return res.json({
      status: 1,
      msg: isInstant
        ? "Perk unlocked successfully! Your voucher code is ready."
        : "Application submitted successfully! Our team will review and approve your claim shortly.",
      application,
      assigned_code: assignedCode,
    });
  } catch (error) {
    console.error("Error applying for booster perk:", error);
    return res.status(500).json({ status: 0, msg: "Failed to submit perk claim" });
  }
}

/**
 * GET /booster/my-applications
 * List all booster claims made by the current user
 */
export async function getMyBoosterApplications(req, res) {
  try {
    const userId = req.user._id;
    const applications = await BoosterApplicationModel.find({ user_id: userId })
      .populate("booster_id")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      status: 1,
      applications,
    });
  } catch (error) {
    console.error("Error fetching my booster applications:", error);
    return res.status(500).json({ status: 0, msg: "Failed to load your claimed perks" });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// ADMIN CONTROLLERS (Full CRUD & Application Reviews)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * GET /admin/booster/all
 * List all booster items for admin with stats
 */
export async function getAdminBoosterItems(req, res) {
  try {
    await ensureDefaultPerksSeeded();

    const { search, category, status } = req.query;
    const filter = { is_deleted: { $ne: true } };

    if (category && category !== "all") filter.category = category;
    if (status && status !== "all") filter.status = status;
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { provider: { $regex: q, $options: "i" } },
      ];
    }

    const items = await BoosterKitModel.find(filter).sort({ createdAt: -1 }).lean();

    // Aggregation stats
    const totalCount = await BoosterKitModel.countDocuments({ is_deleted: { $ne: true } });
    const activeCount = await BoosterKitModel.countDocuments({ is_deleted: { $ne: true }, status: "active" });
    const totalApplications = await BoosterApplicationModel.countDocuments();
    const pendingApplications = await BoosterApplicationModel.countDocuments({ status: "pending" });

    return res.json({
      status: 1,
      items,
      stats: {
        total: totalCount,
        active: activeCount,
        totalApplications,
        pendingApplications,
      },
    });
  } catch (error) {
    console.error("Error fetching admin booster items:", error);
    return res.status(500).json({ status: 0, msg: "Failed to load booster items" });
  }
}

/**
 * POST /admin/booster/create
 * Create new booster perk with optional file uploads
 */
export async function createAdminBoosterItem(req, res) {
  try {
    const {
      title,
      provider,
      category,
      tagline,
      description,
      perk_value,
      redemption_type,
      redemption_code,
      redemption_url,
      eligibility_criteria,
      logo_url,
      featured,
      status,
    } = req.body;

    if (!title || !provider) {
      return res.status(400).json({ status: 0, msg: "Title and Provider are required" });
    }

    let processedAttachments = [];
    let customLogoUrl = logo_url || "";

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === "logo" || file.mimetype.startsWith("image/")) {
          const cloudRes = await uploadFileToCloud(file.buffer, file.originalname, {
            folder: "rbf_booster_logos",
            resourceType: "image",
          });
          customLogoUrl = cloudRes.secure_url;
        } else {
          const cloudRes = await uploadFileToCloud(file.buffer, file.originalname, {
            folder: "rbf_booster_docs",
            resourceType: "auto",
          });
          processedAttachments.push({
            url: cloudRes.secure_url,
            file_name: file.originalname,
            file_type: "document",
            file_size: file.size || cloudRes.bytes || 0,
            public_id: cloudRes.public_id,
          });
        }
      }
    }

    const item = await BoosterKitModel.create({
      title: title.trim(),
      provider: provider.trim(),
      category: category || "tools_software",
      tagline: tagline ? tagline.trim() : "",
      description: description ? description.trim() : "",
      perk_value: perk_value ? perk_value.trim() : "",
      redemption_type: redemption_type || "manual_review",
      redemption_code: redemption_code ? redemption_code.trim() : "",
      redemption_url: redemption_url ? redemption_url.trim() : "",
      eligibility_criteria: eligibility_criteria ? eligibility_criteria.trim() : "Open to all verified RealBell members",
      logo_url: customLogoUrl,
      attachments: processedAttachments,
      featured: featured === "true" || featured === true,
      status: status || "active",
      created_by: req.user._id,
    });

    return res.json({
      status: 1,
      msg: "Business Booster perk created successfully",
      item,
    });
  } catch (error) {
    console.error("Error creating booster perk:", error);
    return res.status(500).json({ status: 0, msg: "Failed to create booster perk" });
  }
}

/**
 * PUT /admin/booster/:id
 * Update booster perk
 */
export async function updateAdminBoosterItem(req, res) {
  try {
    const { id } = req.params;
    const item = await BoosterKitModel.findOne({ _id: id, is_deleted: { $ne: true } });
    if (!item) {
      return res.status(404).json({ status: 0, msg: "Booster perk not found" });
    }

    const {
      title,
      provider,
      category,
      tagline,
      description,
      perk_value,
      redemption_type,
      redemption_code,
      redemption_url,
      eligibility_criteria,
      logo_url,
      featured,
      status,
    } = req.body;

    if (title) item.title = title.trim();
    if (provider) item.provider = provider.trim();
    if (category) item.category = category;
    if (tagline !== undefined) item.tagline = tagline.trim();
    if (description !== undefined) item.description = description.trim();
    if (perk_value !== undefined) item.perk_value = perk_value.trim();
    if (redemption_type) item.redemption_type = redemption_type;
    if (redemption_code !== undefined) item.redemption_code = redemption_code.trim();
    if (redemption_url !== undefined) item.redemption_url = redemption_url.trim();
    if (eligibility_criteria !== undefined) item.eligibility_criteria = eligibility_criteria.trim();
    if (logo_url !== undefined && logo_url.trim()) item.logo_url = logo_url.trim();
    if (featured !== undefined) item.featured = featured === "true" || featured === true;
    if (status) item.status = status;

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === "logo" || file.mimetype.startsWith("image/")) {
          const cloudRes = await uploadFileToCloud(file.buffer, file.originalname, {
            folder: "rbf_booster_logos",
            resourceType: "image",
          });
          item.logo_url = cloudRes.secure_url;
        } else {
          const cloudRes = await uploadFileToCloud(file.buffer, file.originalname, {
            folder: "rbf_booster_docs",
            resourceType: "auto",
          });
          item.attachments.push({
            url: cloudRes.secure_url,
            file_name: file.originalname,
            file_type: "document",
            file_size: file.size || cloudRes.bytes || 0,
            public_id: cloudRes.public_id,
          });
        }
      }
    }

    await item.save();

    return res.json({
      status: 1,
      msg: "Booster perk updated successfully",
      item,
    });
  } catch (error) {
    console.error("Error updating booster perk:", error);
    return res.status(500).json({ status: 0, msg: "Failed to update booster perk" });
  }
}

/**
 * DELETE /admin/booster/:id
 * Delete booster perk
 */
export async function deleteAdminBoosterItem(req, res) {
  try {
    const { id } = req.params;
    const item = await BoosterKitModel.findByIdAndUpdate(
      id,
      { is_deleted: true, status: "inactive" },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ status: 0, msg: "Booster perk not found" });
    }

    return res.json({
      status: 1,
      msg: "Booster perk removed successfully",
    });
  } catch (error) {
    console.error("Error deleting booster perk:", error);
    return res.status(500).json({ status: 0, msg: "Failed to delete booster perk" });
  }
}

/**
 * GET /admin/booster/applications
 * List all booster applications across users with status/search filter
 */
export async function getAdminBoosterApplications(req, res) {
  try {
    const { status, search, booster_id, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (booster_id) filter.booster_id = booster_id;
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { company_name: { $regex: q, $options: "i" } },
        { applicant_name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await BoosterApplicationModel.countDocuments(filter);
    const applications = await BoosterApplicationModel.find(filter)
      .populate("booster_id")
      .populate("user_id", "name email company_name profile company_type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.json({
      status: 1,
      applications,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching admin booster applications:", error);
    return res.status(500).json({ status: 0, msg: "Failed to load booster applications" });
  }
}

/**
 * PATCH /admin/booster/applications/:id/review
 * Review / Approve / Reject user application
 */
export async function reviewAdminBoosterApplication(req, res) {
  try {
    const { id } = req.params;
    const { status, assigned_code, admin_notes } = req.body;

    if (!["pending", "approved", "redeemed", "rejected"].includes(status)) {
      return res.status(400).json({ status: 0, msg: "Invalid status value" });
    }

    const app = await BoosterApplicationModel.findById(id);
    if (!app) {
      return res.status(404).json({ status: 0, msg: "Application record not found" });
    }

    app.status = status;
    if (assigned_code !== undefined) app.assigned_code = assigned_code.trim();
    if (admin_notes !== undefined) app.admin_notes = admin_notes.trim();
    app.reviewed_by = req.user._id;
    app.reviewed_at = new Date();

    await app.save();

    return res.json({
      status: 1,
      msg: `Application marked as ${status.toUpperCase()}`,
      application: app,
    });
  } catch (error) {
    console.error("Error reviewing booster application:", error);
    return res.status(500).json({ status: 0, msg: "Failed to update application review" });
  }
}

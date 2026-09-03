import IncubationFormModel from "../models/incubationForm.js";
import IncubationApplicationModel from "../models/incubationApplication.js";
import IncubationInfrastructureModel from "../models/incubationInfrastructure.js";
import IncubationBookingModel from "../models/incubationBooking.js";
import IncubationAttendanceModel from "../models/incubationAttendance.js";
import IncubationInvoiceModel from "../models/incubationInvoice.js";
import IncubationMentorModel from "../models/incubationMentor.js";
import IncubationMentorBookingModel from "../models/incubationMentorBooking.js";
import IncubationSettingsModel from "../models/incubationSettings.js";
import NotificationModel from "../models/notification.js";
import OrganizationModel from "../models/organization.js";
import { uploadFileToCloud } from "../../services/upload.js";
import { sendMail } from "../../services/mail.js";

// Helper: Seed default settings if none exist
async function getOrCreateSettings() {
  let settings = await IncubationSettingsModel.findOne();
  if (!settings) {
    settings = await IncubationSettingsModel.create({
      physicalMonthlyFee: 5000,
      physicalTrialDays: 14,
      virtualMonthlyFee: 2500,
      virtualTrialDays: 30,
      defaultTrialDays: 14,
      centerName: "RealBell Vedic Council of Education Research & Training (Chandlai Hub)",
      currency: "INR",
    });
  }
  return settings;
}

// Helper: Seed default mentors if none exist
async function seedDefaultMentors() {
  const count = await IncubationMentorModel.countDocuments();
  if (count === 0) {
    await IncubationMentorModel.insertMany([
      {
        name: "Dr. V. K. Mathur",
        role: "Chief Ecosystem Mentor & AI Advisor",
        company: "Vedic Council & ex-IIT Faculty",
        bio: "Senior advisor in Artificial Intelligence, DeepTech patenting, and national grant schemes with 20+ years of mentoring experience.",
        expertiseAreas: ["AI & DeepTech", "Patent Filing", "DPIIT Seed Fund", "R&D Architecture"],
        email: "vk.mathur@realbell.org",
        rating: 4.95,
        sessionsCount: 38,
      },
      {
        name: "CA Ananya Sharma",
        role: "Startup CFO & Corporate Law Partner",
        company: "Sharma & Associates Legal-Tax",
        bio: "Specialist in startup equity capitalization, ESOP structuring, 42A compliance, and venture debt financing.",
        expertiseAreas: ["Company Valuation", "ESOP Structuring", "Tax & GST", "Due Diligence"],
        email: "ananya.sharma@realbell.org",
        rating: 4.9,
        sessionsCount: 42,
      },
      {
        name: "Rajiv Mehra",
        role: "Managing Partner & Angel Syndicate Lead",
        company: "Rajasthan Angel Network (RAN)",
        bio: "Angel investor with portfolio of 18+ startups. Focuses on product-market fit, unit economics, and Seed-to-Series A fundraising.",
        expertiseAreas: ["Fundraising Pitch", "Investor Relations", "GTM Strategy", "Unit Economics"],
        email: "rajiv.mehra@realbell.org",
        rating: 4.88,
        sessionsCount: 56,
      },
      {
        name: "Priya Deshmukh",
        role: "Head of Product & Growth Architect",
        company: "SaaS ScaleLab",
        bio: "Helps early-stage B2B SaaS startups scale from 0 to ₹1 Cr ARR with product analytics, inbound funnels, and enterprise sales.",
        expertiseAreas: ["B2B SaaS Growth", "Pricing Optimization", "Customer Retention", "Enterprise Sales"],
        email: "priya.deshmukh@realbell.org",
        rating: 4.92,
        sessionsCount: 29,
      },
    ]);
  }
}

// Helper: Seed default form fields if none exist
async function getOrCreateDefaultForm() {
  let form = await IncubationFormModel.findOne({ status: "published" });
  if (!form) {
    form = await IncubationFormModel.create({
      title: "RealBell Startup Incubation & Cohort Application Form",
      description: "Submit your startup profile, business model, DPIIT recognition, and team roster for cohort admission.",
      centerName: "RealBell Vedic Council of Education Research & Training (Chandlai Hub)",
      cohortName: "Cohort 2026-Q1",
      fields: [
        {
          id: "f_pitch",
          key: "pitch_deck",
          label: "Upload Pitch Deck (PDF)",
          type: "file",
          required: true,
          description: "Upload your latest pitch deck or executive deck (PDF, max 25MB)",
          section: "business",
          order: 1,
        },
        {
          id: "f_prototype",
          key: "product_demo_url",
          label: "Product Demo / Video Link",
          type: "url",
          required: false,
          placeholder: "https://youtube.com/... or https://demo.yourstartup.com",
          section: "business",
          order: 2,
        },
        {
          id: "f_funding",
          key: "funding_raised",
          label: "Total Funding Raised Till Date (₹ INR)",
          type: "number",
          required: false,
          placeholder: "e.g. 1500000 (enter 0 if bootstrapped)",
          section: "business",
          order: 3,
        },
        {
          id: "f_mentorship",
          key: "mentorship_areas",
          label: "Key Mentorship Support Needed",
          type: "multiselect",
          required: false,
          options: [
            "Fundraising & Investor Pitching",
            "Legal, IP & Patent Filing",
            "Product Architecture & AI",
            "Enterprise B2B Go-To-Market",
            "DPIIT Seed Fund & State Grants",
          ],
          section: "custom",
          order: 4,
        },
        {
          id: "f_cert",
          key: "incorporation_cert",
          label: "Certificate of Incorporation / DPIIT Certificate",
          type: "file",
          required: false,
          description: "Upload Certificate of Incorporation or DPIIT startup certificate",
          section: "custom",
          order: 5,
        },
      ],
    });
  }
  return form;
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL ACCESS CHECKER: Verified Status + Due Date Expiry + Service Matrix
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyIncubationAccess(userId, feature) {
  // feature: "attendance" | "infrastructure" | "mentor"
  if (!userId) {
    return { allowed: false, statusCode: 401, msg: "Unauthorized" };
  }

  const app = await IncubationApplicationModel.findOne({ user: userId });
  if (!app || app.status === "Draft") {
    return {
      allowed: false,
      statusCode: 403,
      reason: "application_required",
      msg: "Access Denied: Please complete and submit your Incubation Application first.",
    };
  }

  if (app.status !== "Accepted" && app.status !== "Approved") {
    return {
      allowed: false,
      statusCode: 403,
      reason: "not_approved",
      applicationStatus: app.status,
      msg: `Access Denied: Feature is available only to approved incubator startups. Your application status is "${app.status}".`,
    };
  }

  // Check Due Date & Overdue Suspension
  const now = new Date();
  if (app.dueDate && now > new Date(app.dueDate)) {
    if (app.subscriptionStatus !== "active") {
      if (app.subscriptionStatus !== "overdue") {
        app.subscriptionStatus = "overdue";
        await app.save().catch(() => {});
      }
      return {
        allowed: false,
        statusCode: 403,
        reason: "overdue",
        dueDate: app.dueDate,
        msg: "Services Suspended: Incubation monthly payment is overdue. Please settle your dues in the Incubation Payment section to restore full access.",
      };
    }
  }

  // Check Virtual vs Physical Incubation feature matrix
  if (feature === "infrastructure" && app.incubationType === "virtual") {
    return {
      allowed: false,
      statusCode: 403,
      reason: "virtual_restricted",
      msg: "Infrastructure booking is not available for Virtual Incubation. Virtual incubation includes Smart Attendance and Mentor Support only. Please contact admin to upgrade to Physical Incubation.",
    };
  }

  return { allowed: true, app };
}

// ─────────────────────────────────────────────────────────────────────────────
// USER ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Get active application form schema
export const getIncubationForm = async (req, res) => {
  try {
    const form = await getOrCreateDefaultForm();
    const settings = await getOrCreateSettings();
    return res.json({ status: 1, form, settings });
  } catch (err) {
    console.error("getIncubationForm error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load incubation form" });
  }
};

// 2. Get current user's incubation application & status
export const getMyIncubationApplication = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ status: 0, msg: "Unauthorized" });

    let application = await IncubationApplicationModel.findOne({ user: userId })
      .populate("form")
      .populate("user", "name email phone company_name company_type role account profile");

    const settings = await getOrCreateSettings();

    let dueInfo = null;
    if (application && (application.status === "Accepted" || application.status === "Approved")) {
      const now = new Date();
      const due = application.dueDate ? new Date(application.dueDate) : null;
      const isOverdue = due ? now > due : false;
      const remainingMs = due ? Math.max(0, due.getTime() - now.getTime()) : 0;

      const totalSeconds = Math.floor(remainingMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      dueInfo = {
        dueDate: application.dueDate,
        trialEndsAt: application.trialEndsAt,
        subscriptionStatus: isOverdue ? "overdue" : application.subscriptionStatus,
        isOverdue,
        remainingMs,
        countdown: { days, hours, minutes, seconds },
        monthlyFee: application.monthlyFee || (application.incubationType === "physical" ? settings.physicalMonthlyFee : settings.virtualMonthlyFee),
        incubationType: application.incubationType || "physical",
      };
    }

    return res.json({ status: 1, application, settings, dueInfo });
  } catch (err) {
    console.error("getMyIncubationApplication error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load application" });
  }
};

// 3. Save draft or Submit incubation application (Requires Team Members and Incubation Type)
export const submitIncubationApplication = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ status: 0, msg: "Unauthorized" });

    const {
      isDraft = false,
      incubationType = "physical",
      businessDetails = {},
      teamMembers = [],
      customResponses = {},
    } = req.body;

    const parsedBiz = typeof businessDetails === "string" ? JSON.parse(businessDetails) : businessDetails;
    const parsedTeam = typeof teamMembers === "string" ? JSON.parse(teamMembers) : teamMembers;
    const parsedResponses = typeof customResponses === "string" ? JSON.parse(customResponses) : customResponses;

    // Strict Validation for Final Submission
    if (!isDraft) {
      if (!["physical", "virtual"].includes(incubationType)) {
        return res.status(400).json({ status: 0, msg: "Incubation type is required. Please select Physical or Virtual." });
      }

      if (!Array.isArray(parsedTeam) || parsedTeam.length === 0 || !parsedTeam[0]?.name?.trim()) {
        return res.status(400).json({ status: 0, msg: "Team members are required. Please add at least one founder/team member." });
      }
    }

    const form = await getOrCreateDefaultForm();
    const settings = await getOrCreateSettings();

    // Process file uploads if any
    const uploadedDocs = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFileToCloud(file.buffer, file.originalname, {
            folder: "RBF/incubation_documents",
            resourceType: "auto",
          });
          if (uploadResult?.secure_url) {
            uploadedDocs.push({
              fieldKey: file.fieldname,
              fieldLabel: file.fieldname.replace(/_/g, " "),
              fileName: file.originalname,
              fileUrl: uploadResult.secure_url,
              fileType: file.mimetype,
              fileSize: file.size,
              publicId: uploadResult.public_id || "",
              uploadedAt: new Date(),
            });
            parsedResponses[file.fieldname] = uploadResult.secure_url;
          }
        } catch (uploadErr) {
          console.error(`File upload error for ${file.originalname}:`, uploadErr);
        }
      }
    }

    let application = await IncubationApplicationModel.findOne({ user: userId });
    const newStatus = isDraft ? "Draft" : "Submitted";
    const fee = incubationType === "physical" ? settings.physicalMonthlyFee : settings.virtualMonthlyFee;

    if (!application) {
      const appId = `RBF-INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      application = await IncubationApplicationModel.create({
        applicationId: appId,
        user: userId,
        incubationType,
        form: form._id,
        businessDetails: parsedBiz,
        teamMembers: parsedTeam,
        customResponses: parsedResponses,
        documents: uploadedDocs,
        status: newStatus,
        monthlyFee: fee,
      });
    } else {
      application.incubationType = incubationType;
      application.businessDetails = { ...application.businessDetails, ...parsedBiz };
      application.teamMembers = parsedTeam && parsedTeam.length > 0 ? parsedTeam : application.teamMembers;
      application.customResponses = { ...application.customResponses, ...parsedResponses };
      application.monthlyFee = fee;
      if (uploadedDocs.length > 0) {
        application.documents = [...application.documents, ...uploadedDocs];
      }
      if (!isDraft || application.status === "Draft") {
        application.status = newStatus;
      }
      await application.save();
    }

    return res.json({
      status: 1,
      msg: isDraft ? "Application draft saved successfully" : "Application submitted for Incubation Committee review!",
      application,
    });
  } catch (err) {
    console.error("submitIncubationApplication error:", err);
    return res.status(500).json({ status: 0, msg: err.message || "Failed to submit application" });
  }
};

// 4. Founder sends reply message in feedback thread
export const userReplyFeedback = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ status: 0, msg: "Message content cannot be empty" });
    }

    const application = await IncubationApplicationModel.findOne({ user: userId });
    if (!application) {
      return res.status(404).json({ status: 0, msg: "Application not found" });
    }

    application.feedbackMessages.push({
      senderId: userId,
      senderName: req.user?.name || "Founder",
      senderRole: "founder",
      message: message.trim(),
      timestamp: new Date(),
    });

    await application.save();
    return res.json({ status: 1, msg: "Reply sent to admin reviewers", messages: application.feedbackMessages });
  } catch (err) {
    console.error("userReplyFeedback error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to send message" });
  }
};

// 5. MENTOR SUPPORT: Get active mentors
export const getMentorsList = async (req, res) => {
  try {
    await seedDefaultMentors();
    const mentors = await IncubationMentorModel.find({ isActive: true }).sort({ rating: -1 });
    return res.json({ status: 1, mentors });
  } catch (err) {
    console.error("getMentorsList error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load mentors" });
  }
};

// 6. MENTOR SUPPORT: Book a 1-on-1 mentorship session
export const bookMentorSession = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { mentorId, date, timeSlot, topic, notes } = req.body;

    if (!mentorId || !date || !timeSlot || !topic?.trim()) {
      return res.status(400).json({ status: 0, msg: "Mentor, date, timeslot, and discussion topic are required." });
    }

    // Verify Access & Due Date
    const check = await verifyIncubationAccess(userId, "mentor");
    if (!check.allowed) {
      return res.status(check.statusCode).json({
        status: 0,
        reason: check.reason,
        requiresApplication: check.reason === "application_required",
        msg: check.msg,
      });
    }

    const mentor = await IncubationMentorModel.findById(mentorId);
    if (!mentor) return res.status(404).json({ status: 0, msg: "Mentor not found" });

    const bookingId = `MB-${Math.floor(100 + Math.random() * 900)}`;
    const session = await IncubationMentorBookingModel.create({
      bookingId,
      user: userId,
      mentor: mentor._id,
      mentorName: mentor.name,
      date,
      timeSlot,
      topic: topic.trim(),
      notes: notes || "",
      meetingLink: "https://meet.google.com/rbf-incubation-mentor",
      status: "Confirmed",
    });

    mentor.sessionsCount = (mentor.sessionsCount || 0) + 1;
    await mentor.save().catch(() => {});

    return res.json({
      status: 1,
      msg: `Mentorship session booked with ${mentor.name} on ${date} at ${timeSlot}!`,
      session,
    });
  } catch (err) {
    console.error("bookMentorSession error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to book mentor session" });
  }
};

// 7. MENTOR SUPPORT: Get user's mentor sessions
export const getMyMentorSessions = async (req, res) => {
  try {
    const userId = req.user?._id;
    const sessions = await IncubationMentorBookingModel.find({ user: userId })
      .populate("mentor")
      .sort({ createdAt: -1 });

    return res.json({ status: 1, sessions });
  } catch (err) {
    console.error("getMyMentorSessions error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load sessions" });
  }
};

// 8. INFRASTRUCTURE: Get infrastructure list
export const getInfrastructureList = async (req, res) => {
  try {
    const userId = req.user?._id;

    // Seed default facilities if none exist
    let count = await IncubationInfrastructureModel.countDocuments();
    if (count === 0) {
      await IncubationInfrastructureModel.insertMany([
        {
          title: "Chanakya Boardroom (12 Seater)",
          type: "boardroom",
          capacity: 12,
          location: "Floor 1 - Chandlai Center, Jaipur",
          description: "Executive boardroom with 4K display, video conference bar, and motorized whiteboard.",
          amenities: ["Wi-Fi 6", "4K Display", "Video Conferencing", "Whiteboard", "Coffee Bar"],
          isFreeForNewProfiles: true,
          freeQuotaPerUser: 3,
          pricePerHour: 500,
        },
        {
          title: "Meeting Pod A (4 Seater)",
          type: "meeting_room",
          capacity: 4,
          location: "Floor 1 - Chandlai Center, Jaipur",
          description: "Soundproof acoustic meeting pod for investor calls and sprint syncs.",
          amenities: ["Wi-Fi 6", "Acoustic Insulation", "Smart TV Screen", "Power Hub"],
          isFreeForNewProfiles: true,
          freeQuotaPerUser: 5,
          pricePerHour: 200,
        },
        {
          title: "AI & DeepTech High-Compute Lab",
          type: "lab",
          capacity: 6,
          location: "Lab Wing B - Chandlai Center, Jaipur",
          description: "Dedicated workstation stations with NVIDIA RTX GPUs for AI model training and prototyping.",
          amenities: ["NVIDIA RTX Server", "Gigabit LAN", "UPS Backup", "Development Toolchains"],
          isFreeForNewProfiles: true,
          freeQuotaPerUser: 2,
          pricePerHour: 750,
        },
        {
          title: "Podcast & Founder Media Studio",
          type: "studio",
          capacity: 4,
          location: "Media Pod - Chandlai Center, Jaipur",
          description: "Broadcast-grade podcast recording studio with Shure mics and multi-cam setup.",
          amenities: ["Shure SM7B Mics", "Rodecaster Pro", "Studio Lighting", "Soundproofing"],
          isFreeForNewProfiles: true,
          freeQuotaPerUser: 2,
          pricePerHour: 600,
        },
        {
          title: "Dedicated Incubatee Desk #C-12",
          type: "desk",
          capacity: 1,
          location: "Co-Working Floor 1 - Chandlai Center, Jaipur",
          description: "Reserved desk with ergonomic chair, lockable pedestal, and high-speed fiber.",
          amenities: ["Ergonomic Chair", "Locker", "Power Strip", "24/7 Access"],
          isFreeForNewProfiles: true,
          freeQuotaPerUser: 30,
          pricePerMonth: 5000,
        },
      ]);
    }

    const items = await IncubationInfrastructureModel.find({ isActive: true }).sort({ type: 1 });

    const userBookings = userId
      ? await IncubationBookingModel.find({ user: userId, isFreeTrial: true, status: { $ne: "Cancelled" } })
      : [];

    const currentMonthYear = new Date().toISOString().substring(0, 7);
    const monthlyUserBookings = userId
      ? await IncubationBookingModel.find({
          user: userId,
          monthYear: currentMonthYear,
          status: { $ne: "Cancelled" },
        })
      : [];

    const facilitiesWithQuota = items.map((f) => {
      const usedQuota = userBookings.filter((b) => String(b.infrastructure) === String(f._id)).length;
      const maxQuota = f.freeQuotaPerUser || 0;
      const remainingQuota = Math.max(0, maxQuota - usedQuota);

      const thisFacilityBookings = monthlyUserBookings.filter((b) => String(b.infrastructure) === String(f._id));
      const usedBookingsThisMonth = thisFacilityBookings.length;
      const usedHoursThisMonth = thisFacilityBookings.reduce((sum, b) => sum + (b.durationHours || 2), 0);

      return {
        ...f.toObject(),
        usedFreeQuota: usedQuota,
        remainingFreeQuota: remainingQuota,
        isCurrentlyFree: f.isFreeForNewProfiles && remainingQuota > 0,
        monthlyBookingLimit: f.monthlyBookingLimit || 20,
        monthlyHoursLimit: f.monthlyHoursLimit || 20,
        usedBookingsThisMonth,
        usedHoursThisMonth,
        remainingBookingsThisMonth: Math.max(0, (f.monthlyBookingLimit || 20) - usedBookingsThisMonth),
        remainingHoursThisMonth: Math.max(0, (f.monthlyHoursLimit || 20) - usedHoursThisMonth),
      };
    });

    let isUserApproved = false;
    let userApplicationStatus = "not_applied";
    let incubationType = "physical";
    let isOverdue = false;

    if (userId) {
      const userApp = await IncubationApplicationModel.findOne({ user: userId });
      if (userApp) {
        userApplicationStatus = userApp.status;
        isUserApproved = userApp.status === "Accepted" || userApp.status === "Approved";
        incubationType = userApp.incubationType || "physical";
        if (userApp.dueDate && new Date() > new Date(userApp.dueDate) && userApp.subscriptionStatus !== "active") {
          isOverdue = true;
        }
      }
    }

    return res.json({
      status: 1,
      infrastructure: facilitiesWithQuota,
      isUserApproved,
      userApplicationStatus,
      incubationType,
      isOverdue,
    });
  } catch (err) {
    console.error("getInfrastructureList error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load infrastructure" });
  }
};

// 9. INFRASTRUCTURE: Book infrastructure slot
export const bookInfrastructure = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { infrastructureId, date, startTime, endTime, purpose, attendeesCount = 1 } = req.body;

    if (!infrastructureId || !date || !startTime || !endTime || !purpose?.trim()) {
      return res.status(400).json({ status: 0, msg: "All booking details are required." });
    }

    // Verify Access, Due Date, and Physical Incubation requirement
    const check = await verifyIncubationAccess(userId, "infrastructure");
    if (!check.allowed) {
      return res.status(check.statusCode).json({
        status: 0,
        reason: check.reason,
        requiresApplication: check.reason === "application_required",
        msg: check.msg,
      });
    }

    const infra = await IncubationInfrastructureModel.findById(infrastructureId);
    if (!infra) return res.status(404).json({ status: 0, msg: "Facility not found" });

    const monthYear = date.substring(0, 7); // e.g. "2026-09"

    // 1. Enforce Monthly Booking Limits for Startup (max times per month)
    const existingMonthly = await IncubationBookingModel.find({
      user: userId,
      infrastructure: infra._id,
      monthYear,
      status: { $ne: "Cancelled" },
    });

    const maxTimes = infra.monthlyBookingLimit || 20;
    if (existingMonthly.length >= maxTimes) {
      return res.status(400).json({
        status: 0,
        msg: `Monthly limit reached: A startup can reserve ${infra.title} a maximum of ${maxTimes} times per month.`,
      });
    }

    // 2. Enforce Monthly Hours Limit for Startup (max hours per month)
    const durationHours = 2; // Standard 2 hour block
    const hoursUsed = existingMonthly.reduce((acc, b) => acc + (b.durationHours || 2), 0);
    const maxHours = infra.monthlyHoursLimit || 20;
    if (hoursUsed + durationHours > maxHours) {
      return res.status(400).json({
        status: 0,
        msg: `Monthly limit reached: A startup can reserve ${infra.title} a maximum of ${maxHours} hours per month. (Already used: ${hoursUsed} hrs).`,
      });
    }

    // 3. Prevent Double Booking / Slot Collisions
    const collision = await IncubationBookingModel.findOne({
      infrastructure: infra._id,
      date,
      startTime,
      status: { $ne: "Cancelled" },
    });
    if (collision) {
      return res.status(400).json({
        status: 0,
        msg: `The slot ${startTime} - ${endTime} on ${date} is already reserved by another startup. Please pick another available slot.`,
      });
    }

    // Check user's free usage quota
    const usedQuota = await IncubationBookingModel.countDocuments({
      user: userId,
      infrastructure: infra._id,
      isFreeTrial: true,
      status: { $ne: "Cancelled" },
    });

    const isFree = infra.isFreeForNewProfiles && usedQuota < infra.freeQuotaPerUser;
    const amount = isFree ? 0 : infra.pricePerHour || 0;

    const bookingId = `BK-${Math.floor(100 + Math.random() * 900)}`;

    const booking = await IncubationBookingModel.create({
      bookingId,
      user: userId,
      infrastructure: infra._id,
      facilityName: infra.title,
      facilityType: infra.type,
      date,
      monthYear,
      startTime,
      endTime,
      durationHours,
      purpose: purpose.trim(),
      attendeesCount,
      isFreeTrial: isFree,
      amount,
      paymentStatus: isFree ? "free_trial" : "pending",
      status: "Confirmed",
    });

    return res.json({
      status: 1,
      msg: isFree
        ? `Facility booked successfully! (Free Trial: ${usedQuota + 1}/${infra.freeQuotaPerUser} utilized)`
        : `Facility booked successfully. Invoice of ₹${amount} generated.`,
      booking,
    });
  } catch (err) {
    console.error("bookInfrastructure error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to reserve slot" });
  }
};

// 10. INFRASTRUCTURE: Get user's bookings
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?._id;
    const bookings = await IncubationBookingModel.find({ user: userId })
      .populate("infrastructure")
      .sort({ createdAt: -1 });

    return res.json({ status: 1, bookings });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load bookings" });
  }
};

// 11. INFRASTRUCTURE: Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const booking = await IncubationBookingModel.findOne({ _id: id, user: userId });
    if (!booking) return res.status(404).json({ status: 0, msg: "Booking not found" });

    booking.status = "Cancelled";
    await booking.save();

    return res.json({ status: 1, msg: "Booking successfully cancelled" });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to cancel booking" });
  }
};

// 12. ATTENDANCE: Check-in
export const userQrCheckIn = async (req, res) => {
  try {
    const userId = req.user?._id;

    // Verify Access & Due Date
    const check = await verifyIncubationAccess(userId, "attendance");
    if (!check.allowed) {
      return res.status(check.statusCode).json({
        status: 0,
        reason: check.reason,
        requiresApplication: check.reason === "application_required",
        msg: check.msg,
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    let record = await IncubationAttendanceModel.findOne({ user: userId, dateStr: todayStr });
    if (record) {
      return res.json({
        status: 1,
        msg: `Already checked in today at ${new Date(record.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        attendance: record,
      });
    }

    const locationStr = check.app.incubationType === "virtual" ? "Virtual Workspace Session" : "Gate 1 Turnstile - Chandlai Center, Jaipur";

    record = await IncubationAttendanceModel.create({
      user: userId,
      dateStr: todayStr,
      checkInTime: new Date(),
      checkInMethod: "qr_scan",
      location: locationStr,
      status: "Present",
    });

    return res.json({
      status: 1,
      msg: `Attendance successfully verified via QR Scanner! Welcome to incubation.`,
      attendance: record,
    });
  } catch (err) {
    console.error("userQrCheckIn error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to mark QR attendance" });
  }
};

// 13. ATTENDANCE: Check-out
export const userQrCheckOut = async (req, res) => {
  try {
    const userId = req.user?._id;
    const todayStr = new Date().toISOString().split("T")[0];

    let record = await IncubationAttendanceModel.findOne({ user: userId, dateStr: todayStr });
    if (!record) {
      return res.status(400).json({ status: 0, msg: "No check-in record found for today to check out from." });
    }

    const checkOut = new Date();
    const diffMinutes = Math.round((checkOut - new Date(record.checkInTime)) / 60000);

    record.checkOutTime = checkOut;
    record.durationMinutes = Math.max(1, diffMinutes);
    await record.save();

    return res.json({
      status: 1,
      msg: `Check-out recorded at ${checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Total time: ${(diffMinutes / 60).toFixed(1)} hrs.`,
      attendance: record,
    });
  } catch (err) {
    console.error("userQrCheckOut error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to record check-out" });
  }
};

// 14. ATTENDANCE: Get logs
export const getMyAttendanceLogs = async (req, res) => {
  try {
    const userId = req.user?._id;
    const logs = await IncubationAttendanceModel.find({ user: userId }).sort({ dateStr: -1 }).limit(31);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecord = logs.find((l) => l.dateStr === todayStr);

    const daysPresent = logs.length;
    const workingDays = 24;
    const compliancePercent = Math.min(100, Math.round((daysPresent / workingDays) * 100));

    let isUserApproved = false;
    let userApplicationStatus = "not_applied";
    let incubationType = "physical";
    let isOverdue = false;

    if (userId) {
      const userApp = await IncubationApplicationModel.findOne({ user: userId });
      if (userApp) {
        userApplicationStatus = userApp.status;
        isUserApproved = userApp.status === "Accepted" || userApp.status === "Approved";
        incubationType = userApp.incubationType || "physical";
        if (userApp.dueDate && new Date() > new Date(userApp.dueDate) && userApp.subscriptionStatus !== "active") {
          isOverdue = true;
        }
      }
    }

    return res.json({
      status: 1,
      logs,
      todayRecord,
      isCheckedIn: !!todayRecord && !todayRecord.checkOutTime,
      isUserApproved,
      userApplicationStatus,
      incubationType,
      isOverdue,
      stats: {
        daysPresent,
        workingDays,
        compliancePercent,
        avgHoursPerDay: daysPresent > 0 ? (logs.reduce((acc, l) => acc + (l.durationMinutes || 360), 0) / (daysPresent * 60)).toFixed(1) : 0,
      },
    });
  } catch (err) {
    console.error("getMyAttendanceLogs error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load attendance logs" });
  }
};

// 15. PAYMENT: Get accounting & monthly billing info
export const getMyAccounting = async (req, res) => {
  try {
    const userId = req.user?._id;
    const settings = await getOrCreateSettings();

    const app = await IncubationApplicationModel.findOne({ user: userId });
    const invoices = await IncubationInvoiceModel.find({ user: userId }).sort({ createdAt: -1 });

    const totalGross = invoices.reduce((acc, i) => acc + (i.grossAmount || 0), 0);
    const totalSubsidy = invoices.reduce((acc, i) => acc + (i.grantSubsidyAmount || 0), 0);
    const totalNetDue = invoices.filter((i) => i.paymentStatus === "Pending").reduce((acc, i) => acc + (i.netAmount || 0), 0);

    const now = new Date();
    const isOverdue = app?.dueDate ? now > new Date(app.dueDate) && app.subscriptionStatus !== "active" : false;

    return res.json({
      status: 1,
      invoices,
      statement: {
        totalGross,
        totalSubsidy,
        totalNetDue,
        status: isOverdue ? "Payment Overdue" : app?.subscriptionStatus === "trial" ? "Free Trial Active" : "Active Subscription",
      },
      subscription: {
        status: app?.subscriptionStatus || "none",
        dueDate: app?.dueDate,
        trialEndsAt: app?.trialEndsAt,
        monthlyFee: app?.monthlyFee || (app?.incubationType === "physical" ? settings.physicalMonthlyFee : settings.virtualMonthlyFee),
        incubationType: app?.incubationType || "physical",
        isOverdue,
      },
    });
  } catch (err) {
    console.error("getMyAccounting error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load accounting statement" });
  }
};

// 16. PAYMENT: Pay monthly dues (restores/extends subscription by 30 days)
export const payMonthlyDues = async (req, res) => {
  try {
    const userId = req.user?._id;
    const app = await IncubationApplicationModel.findOne({ user: userId });
    if (!app) return res.status(404).json({ status: 0, msg: "Application not found" });

    const settings = await getOrCreateSettings();
    const fee = app.monthlyFee || (app.incubationType === "physical" ? settings.physicalMonthlyFee : settings.virtualMonthlyFee);

    // Calculate next due date: 30 days from current due date (or from now if overdue/missing)
    const baseDate = app.dueDate && new Date(app.dueDate) > new Date() ? new Date(app.dueDate) : new Date();
    const nextDue = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    app.dueDate = nextDue;
    app.subscriptionStatus = "active";
    app.lastPaidDate = new Date();
    await app.save();

    // Create Invoice
    const invoiceNumber = `INV-INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await IncubationInvoiceModel.create({
      invoiceNumber,
      user: userId,
      billingPeriod: `${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()}`,
      category: "seat_fee",
      description: `Monthly ${app.incubationType.toUpperCase()} Incubation Services Access`,
      grossAmount: fee,
      grantSubsidyAmount: 0,
      netAmount: fee,
      paymentStatus: "Paid",
    });

    return res.json({
      status: 1,
      msg: `Payment of ₹${fee} settled successfully! Full incubation services unlocked until ${nextDue.toLocaleDateString()}.`,
      dueDate: nextDue,
      invoice,
    });
  } catch (err) {
    console.error("payMonthlyDues error:", err);
    return res.status(500).json({ status: 0, msg: "Payment failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// 17. Admin: Get all applications
export const getAdminApplications = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.incubationType = type;

    const applications = await IncubationApplicationModel.find(query)
      .populate("user", "name email phone company_name company_type role account profile")
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await IncubationApplicationModel.countDocuments(query);
    const settings = await getOrCreateSettings();

    return res.json({
      status: 1,
      applications,
      settings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getAdminApplications error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to fetch applications" });
  }
};

// 18. Admin: Update application status (triggers notification & mail on approval)
export const updateAdminApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, cohortName, centerAllocated, deskAllocated } = req.body;

    const application = await IncubationApplicationModel.findById(id);
    if (!application) return res.status(404).json({ status: 0, msg: "Application not found" });

    const previousStatus = application.status;
    if (status) application.status = status;
    if (reviewNotes !== undefined) application.reviewNotes = reviewNotes;

    const settings = await getOrCreateSettings();

    // If Approved / Accepted: Initialize Free Trial, Due Date, Dispatch In-App Notification & Email!
    if (status === "Accepted" && previousStatus !== "Accepted") {
      const trialDays = application.incubationType === "virtual"
        ? (settings.virtualTrialDays ?? 30)
        : (settings.physicalTrialDays ?? 14);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      application.approvalDate = now;
      application.trialEndsAt = trialEnd;
      application.dueDate = trialEnd;
      application.subscriptionStatus = "trial";
      application.monthlyFee = application.incubationType === "physical" ? settings.physicalMonthlyFee : settings.virtualMonthlyFee;

      if (cohortName) application.cohortName = cohortName;
      if (centerAllocated) application.centerAllocated = centerAllocated;
      if (deskAllocated) application.deskAllocated = deskAllocated;

      // 1. Create In-App Notification
      await NotificationModel.create({
        title: "Incubation Application Approved!",
        message: `Congratulations! Your startup has been approved for ${application.incubationType.toUpperCase()} Incubation. Your ${trialDays}-day free trial is now active.`,
        type: "success",
        priority: "high",
        action_url: "/incubation",
        target_type: "specific_users",
        target_users: [application.user],
      }).catch((e) => console.error("Notification creation warning:", e));

      // 2. Dispatch Official Email
      const userDoc = await OrganizationModel.findById(application.user);
      if (userDoc?.email) {
        const emailBody = `Dear ${userDoc.name || "Founder"},\n\nCongratulations! We are delighted to inform you that your incubation application (${application.applicationId}) has been officially APPROVED for ${application.incubationType.toUpperCase()} Incubation at RealBell Business Foundation.\n\nYour ${trialDays}-day Free Trial is now active. You have full access to:\n- Smart Attendance & Turnstile Tracking\n${application.incubationType === "physical" ? "- Physical Center Infrastructure & Boardroom Booking\n" : ""}- 1-on-1 Mentorship Sessions\n\nLogin to your dashboard to access services:\n${process.env.FRONTEND_URL || "http://localhost:5173"}/incubation\n\nBest regards,\nIncubation Committee\nRealBell Vedic Council of Education Research & Training`;

        await sendMail(
          userDoc.email,
          `Incubation Application Approved - RealBell Business Foundation`,
          emailBody
        ).catch((err) => console.error("Approval email error:", err));
      }
    }

    application.reviewedBy = req.user?._id;
    application.reviewedAt = new Date();

    await application.save();

    return res.json({ status: 1, msg: `Application status updated to "${status}"`, application });
  } catch (err) {
    console.error("updateAdminApplicationStatus error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to update status" });
  }
};

// 19. Admin: Send feedback message
export const sendAdminFeedbackMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ status: 0, msg: "Feedback message cannot be empty" });
    }

    const application = await IncubationApplicationModel.findById(id);
    if (!application) return res.status(404).json({ status: 0, msg: "Application not found" });

    application.feedbackMessages.push({
      senderId: req.user?._id,
      senderName: req.user?.name || "Admin Reviewer",
      senderRole: "admin",
      message: message.trim(),
      timestamp: new Date(),
    });

    await application.save();

    return res.json({
      status: 1,
      msg: "Feedback message dispatched to founder",
      feedbackMessages: application.feedbackMessages,
    });
  } catch (err) {
    console.error("sendAdminFeedbackMessage error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to dispatch feedback" });
  }
};

// 20. Admin: Get & Update Incubation Settings (Fees, Trial)
export const getAdminIncubationSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ status: 1, settings });
  } catch (err) {
    console.error("getAdminIncubationSettings error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load settings" });
  }
};

export const saveAdminIncubationSettings = async (req, res) => {
  try {
    const {
      physicalMonthlyFee,
      physicalTrialDays,
      virtualMonthlyFee,
      virtualTrialDays,
      defaultTrialDays,
      centerName,
    } = req.body;

    let settings = await IncubationSettingsModel.findOne();
    if (!settings) settings = new IncubationSettingsModel();

    if (physicalMonthlyFee !== undefined) settings.physicalMonthlyFee = Number(physicalMonthlyFee);
    if (physicalTrialDays !== undefined) settings.physicalTrialDays = Number(physicalTrialDays);
    if (virtualMonthlyFee !== undefined) settings.virtualMonthlyFee = Number(virtualMonthlyFee);
    if (virtualTrialDays !== undefined) settings.virtualTrialDays = Number(virtualTrialDays);
    if (defaultTrialDays !== undefined) settings.defaultTrialDays = Number(defaultTrialDays);
    if (centerName) settings.centerName = centerName;

    await settings.save();

    return res.json({ status: 1, msg: "Incubation Pricing & Free Trial settings saved!", settings });
  } catch (err) {
    console.error("saveAdminIncubationSettings error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to save settings" });
  }
};

// 21. Admin: Manage Mentors (Create / Update / Delete)
export const createAdminMentor = async (req, res) => {
  try {
    const { name, role, company, bio, expertiseAreas, email } = req.body;
    if (!name?.trim() || !role?.trim()) {
      return res.status(400).json({ status: 0, msg: "Mentor name and role are required." });
    }

    const mentor = await IncubationMentorModel.create({
      name: name.trim(),
      role: role.trim(),
      company: company || "Ecosystem Mentor",
      bio: bio || "",
      expertiseAreas: Array.isArray(expertiseAreas) ? expertiseAreas : (expertiseAreas || "").split(",").map((s) => s.trim()).filter(Boolean),
      email: email || "",
    });

    return res.json({ status: 1, msg: "Mentor added to incubation roster", mentor });
  } catch (err) {
    console.error("createAdminMentor error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to add mentor" });
  }
};

export const deleteAdminMentor = async (req, res) => {
  try {
    const { id } = req.params;
    await IncubationMentorModel.findByIdAndDelete(id);
    return res.json({ status: 1, msg: "Mentor removed from roster" });
  } catch (err) {
    console.error("deleteAdminMentor error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to delete mentor" });
  }
};

// 22. Admin: Save form builder schema
export const saveAdminIncubationForm = async (req, res) => {
  try {
    const { title, description, centerName, cohortName, fields, status } = req.body;

    let form = await IncubationFormModel.findOne();
    if (!form) form = new IncubationFormModel();

    if (title) form.title = title;
    if (description !== undefined) form.description = description;
    if (centerName) form.centerName = centerName;
    if (cohortName) form.cohortName = cohortName;
    if (status) form.status = status;
    if (Array.isArray(fields)) form.fields = fields;

    form.updatedBy = req.user?._id;
    await form.save();

    return res.json({ status: 1, msg: "Incubation Form updated successfully!", form });
  } catch (err) {
    console.error("saveAdminIncubationForm error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to save incubation form" });
  }
};

// 23. Admin: Infrastructure CRUD
export const createAdminInfrastructure = async (req, res) => {
  try {
    const {
      title,
      type,
      capacity,
      location,
      description,
      amenities,
      isFreeForNewProfiles,
      freeQuotaPerUser,
      pricePerHour,
      pricePerDay,
      pricePerMonth,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ status: 0, msg: "Infrastructure title is required" });
    }

    const item = await IncubationInfrastructureModel.create({
      title: title.trim(),
      type: type || "meeting_room",
      capacity: capacity || 4,
      location: location || "Floor 1, Chandlai Innovation Center, Jaipur",
      description: description || "",
      amenities: Array.isArray(amenities) ? amenities : (amenities || "").split(",").map((s) => s.trim()).filter(Boolean),
      isFreeForNewProfiles: isFreeForNewProfiles !== false,
      freeQuotaPerUser: Number(freeQuotaPerUser) || 3,
      pricePerHour: Number(pricePerHour) || 0,
      pricePerDay: Number(pricePerDay) || 0,
      pricePerMonth: Number(pricePerMonth) || 0,
    });

    return res.json({ status: 1, msg: "Facility added to infrastructure catalog", item });
  } catch (err) {
    console.error("createAdminInfrastructure error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to create infrastructure item" });
  }
};

export const updateAdminInfrastructure = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await IncubationInfrastructureModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ status: 0, msg: "Facility not found" });

    return res.json({ status: 1, msg: "Facility updated successfully", item });
  } catch (err) {
    console.error("updateAdminInfrastructure error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to update facility" });
  }
};

export const deleteAdminInfrastructure = async (req, res) => {
  try {
    const { id } = req.params;
    await IncubationInfrastructureModel.findByIdAndDelete(id);
    return res.json({ status: 1, msg: "Facility deleted from catalog" });
  } catch (err) {
    console.error("deleteAdminInfrastructure error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to delete facility" });
  }
};

// 24. Admin: Attendance monitor
export const getAdminAttendance = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = await IncubationAttendanceModel.find({ dateStr: todayStr })
      .populate("user", "name email company_name role account")
      .sort({ checkInTime: -1 });

    return res.json({
      status: 1,
      todayStr,
      todayCount: todayLogs.length,
      todayLogs,
      centerQrToken: `REALBELL-HUB-CHANDLAI-${todayStr}`,
    });
  } catch (err) {
    console.error("getAdminAttendance error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load attendance records" });
  }
};

// 25. Admin: Accounting overview
export const getAdminAccounting = async (req, res) => {
  try {
    const invoices = await IncubationInvoiceModel.find()
      .populate("user", "name email company_name")
      .sort({ createdAt: -1 });

    const totalRevenue = invoices.filter((i) => i.paymentStatus === "Paid").reduce((acc, i) => acc + (i.netAmount || 0), 0);
    const totalSubsidies = invoices.reduce((acc, i) => acc + (i.grantSubsidyAmount || 0), 0);

    return res.json({
      status: 1,
      invoices,
      summary: {
        totalInvoices: invoices.length,
        totalRevenue,
        totalSubsidies,
      },
    });
  } catch (err) {
    console.error("getAdminAccounting error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load accounting ledger" });
  }
};

// 10B. INFRASTRUCTURE: Get date slot availability for calendar
export const getFacilitySlotAvailability = async (req, res) => {
  try {
    const { infrastructureId, date } = req.query;
    if (!infrastructureId || !date) {
      return res.status(400).json({ status: 0, msg: "Facility ID and date are required" });
    }

    const infra = await IncubationInfrastructureModel.findById(infrastructureId);
    if (!infra) return res.status(404).json({ status: 0, msg: "Facility not found" });

    // Day of week check
    const d = new Date(date + "T00:00:00");
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    const isDayOpen = infra.availabilityType === "24_7" || (infra.availableDays || []).includes(dayName);

    // Booked slots on this date
    const booked = await IncubationBookingModel.find({
      infrastructure: infra._id,
      date,
      status: { $ne: "Cancelled" },
    }).select("startTime endTime bookingId");

    const bookedStarts = booked.map((b) => b.startTime);

    const timeSlots = infra.availableTimeSlots && infra.availableTimeSlots.length > 0
      ? infra.availableTimeSlots
      : [
          "09:00 AM - 11:00 AM",
          "11:30 AM - 01:30 PM",
          "02:30 PM - 04:30 PM",
          "05:00 PM - 07:00 PM",
        ];

    const slotsWithStatus = timeSlots.map((slot) => {
      const start = slot.split(" - ")[0];
      const isBooked = bookedStarts.includes(start);
      return {
        slot,
        startTime: start,
        endTime: slot.split(" - ")[1] || "",
        isAvailable: isDayOpen && !isBooked,
        isBooked,
      };
    });

    return res.json({
      status: 1,
      facilityName: infra.title,
      facilityType: infra.type,
      date,
      dayName,
      isDayOpen,
      availabilityType: infra.availabilityType,
      slots: slotsWithStatus,
    });
  } catch (err) {
    console.error("getFacilitySlotAvailability error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load slot availability" });
  }
};

// 10C. ADMIN: Get all infrastructure bookings history
export const getAdminInfrastructureBookings = async (req, res) => {
  try {
    const { infrastructureId, date, status } = req.query;
    const query = {};
    if (infrastructureId) query.infrastructure = infrastructureId;
    if (date) query.date = date;
    if (status) query.status = status;

    const bookings = await IncubationBookingModel.find(query)
      .populate("user", "name email company_name")
      .populate("infrastructure", "title type location")
      .sort({ createdAt: -1 });

    return res.json({ status: 1, bookings });
  } catch (err) {
    console.error("getAdminInfrastructureBookings error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to load bookings history" });
  }
};

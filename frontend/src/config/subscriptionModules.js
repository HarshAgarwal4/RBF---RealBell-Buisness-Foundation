/**
 * Available sidebar modules + connections + messages with their predefined access lines for subscription configuration
 */
export const AVAILABLE_SUBSCRIPTION_MODULES = [
  {
    module_key: "rbf_ai",
    module_name: "RBF-AI (Mr. Doom)",
    default_line: "Mr. Doom Startup Copilot, Valuation & Strategy AI",
    icon: "Bot",
  },
  {
    module_key: "community",
    module_name: "Community Wall",
    default_line: "Publish Pitch Updates & Interact on Community Wall",
    icon: "Globe",
  },
  {
    module_key: "connect",
    module_name: "Connect with Others",
    default_line: "Startup, Investor & Mentor Networking Directory",
    icon: "Search",
  },
  {
    module_key: "connections",
    module_name: "My Connections",
    default_line: "Unlimited Ecosystem Connections & Founder Matchmaking",
    icon: "Handshake",
  },
  {
    module_key: "messages",
    module_name: "Direct Messaging",
    default_line: "Direct 1-on-1 Messaging & Founder Chat Threads",
    icon: "MessageSquare",
  },
  {
    module_key: "meetings",
    module_name: "Scheduled Meetings",
    default_line: "Live Meetings & 1-on-1 Advisory Consultations",
    icon: "Calendar",
  },
  {
    module_key: "live_sessions",
    module_name: "Live Sessions & Rooms",
    default_line: "Virtual Live Sessions, Pitch Rooms & Stage Access",
    icon: "Radio",
  },
  {
    module_key: "milestones",
    module_name: "Milestone Tracking",
    default_line: "Startup Milestone Accountability & KPI Tracking",
    icon: "Flag",
  },
  {
    module_key: "programs",
    module_name: "Incubation Programs",
    default_line: "Priority Incubation & Cohort Grant Applications",
    icon: "Rocket",
  },
  {
    module_key: "events",
    module_name: "Events & Workshops",
    default_line: "Priority RSVP for Ecosystem Events & Workshops",
    icon: "Megaphone",
  },
  {
    module_key: "legal_compliance",
    module_name: "Legal Compliance",
    default_line: "Legal Compliance Filing & Statutory Document Vault",
    icon: "Scale",
  },
  {
    module_key: "assessments",
    module_name: "Tests & Assessments",
    default_line: "Skill Assessments, Testing Suite & Growth Analytics",
    icon: "GraduationCap",
  },
  {
    module_key: "certificates",
    module_name: "Certificates",
    default_line: "Automated Verifiable Digital Certificates",
    icon: "Award",
  },
  {
    module_key: "booster",
    module_name: "Business Booster Kit",
    default_line: "₹25,00,000+ Partner Cloud Credits, Discounts & Toolkits",
    icon: "Zap",
  },
  {
    module_key: "news",
    module_name: "Industry News",
    default_line: "Real-time Curated Industry News & Market Intelligence",
    icon: "Newspaper",
  },
  {
    module_key: "videos",
    module_name: "Knowledge Videos",
    default_line: "Founder Masterclasses & Expert Knowledge Video Vault",
    icon: "Video",
  },
  {
    module_key: "jobs",
    module_name: "Job Opportunities",
    default_line: "Post & Apply for Startup Ecosystem Job Openings",
    icon: "Briefcase",
  },
  {
    module_key: "resources",
    module_name: "Resource Library",
    default_line: "Full Access to Contracts, Market Reports & Knowledge Vault",
    icon: "BookOpen",
  },
  {
    module_key: "tickets",
    module_name: "Support Helpdesk",
    default_line: "Priority Technical Helpdesk & Ticket Support",
    icon: "Ticket",
  },
];

/**
 * Universal Subscription Module Lock Checker
 * Returns true if the user's active subscription tier DOES NOT include the specified module
 */
export function isModuleLocked(user, moduleKey) {
  if (!moduleKey) return false;
  // Super admins, admins, and staff bypass subscription locks
  if (!user || user.role === "super_admin" || user.role === "admin" || Boolean(user.team)) return false;

  const sub = user.subscription;
  const hasExpired = sub?.endDate && new Date(sub.endDate) < new Date();
  const isSubActive = sub?.status === "active" && !hasExpired;
  const planKey = isSubActive ? (sub?.planKey || "free") : "free";

  if (!isSubActive) return true;

  // Free tier never has access to paid modules
  if (planKey === "free" || !planKey) {
    return true;
  }

  // If user has populated included_modules from their active plan
  if (Array.isArray(sub?.included_modules) && sub.included_modules.length > 0) {
    return !sub.included_modules.some((m) => m.module_key === moduleKey && m.is_enabled !== false);
  }

  // Fallback for seed tiers
  if (planKey === "enterprise_vip") return false;
  if (planKey === "pro_growth") {
    return moduleKey === "booster" || moduleKey === "legal_compliance" || moduleKey === "certificates";
  }
  return false;
}

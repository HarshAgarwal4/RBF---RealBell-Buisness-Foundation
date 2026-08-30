/**
 * Frontend Permissions Registry & Modules
 * Matches the backend permissions catalog
 */

export const PERMISSION_MODULES = [
  {
    module: "dashboard",
    name: "Admin Dashboard",
    icon: "📊",
    description: "System overview, key metrics, and ecosystem statistics",
    permissions: [
      { key: "dashboard.view", label: "View Dashboard", description: "View analytics overview and summary statistics" },
    ],
  },
  {
    module: "users",
    name: "User Management",
    icon: "👥",
    description: "Manage ecosystem organizations, entrepreneurs, and accounts",
    permissions: [
      { key: "users.view", label: "View Users", description: "View user directory, profiles, and account details" },
      { key: "users.create", label: "Create / Invite Users", description: "Invite new users and create accounts directly" },
      { key: "users.update", label: "Edit Users", description: "Update user profile and account details" },
      { key: "users.assign_role", label: "Assign Roles & Teams", description: "Change a user's assigned team and custom role" },
      { key: "users.delete", label: "Delete Users", description: "Delete users and wipe associated platform data" },
    ],
  },
  {
    module: "teams",
    name: "Teams & Role Management",
    icon: "🏢",
    description: "Manage departments, teams, custom roles, and access controls",
    permissions: [
      { key: "teams.view", label: "View Teams & Roles", description: "View teams, custom roles, and assigned permissions" },
      { key: "teams.create", label: "Create Teams", description: "Create new organizational teams and departments" },
      { key: "teams.update", label: "Edit Teams", description: "Update team details and member assignments" },
      { key: "teams.delete", label: "Delete Teams", description: "Remove teams from the organization" },
      { key: "roles.create", label: "Create Custom Roles", description: "Create dynamic roles and configure permissions" },
      { key: "roles.update", label: "Edit Custom Roles", description: "Modify permissions and status of custom roles" },
      { key: "roles.delete", label: "Delete Custom Roles", description: "Delete custom roles with user reassignment" },
    ],
  },
  {
    module: "subscriptions",
    name: "Subscription Plans",
    icon: "💳",
    description: "Manage platform pricing tiers, features, and subscriber limits",
    permissions: [
      { key: "subscriptions.view", label: "View Plans", description: "View all subscription plans and pricing" },
      { key: "subscriptions.create", label: "Create Plans", description: "Create new subscription tiers" },
      { key: "subscriptions.update", label: "Edit Plans", description: "Modify pricing, features, and limits" },
      { key: "subscriptions.delete", label: "Delete Plans", description: "Remove subscription plans" },
    ],
  },
  {
    module: "payments",
    name: "Payments & Transactions",
    icon: "💰",
    description: "View revenue, transaction history, and payment gateway logs",
    permissions: [
      { key: "payments.view", label: "View Transactions", description: "View customer payment records and revenue reports" },
    ],
  },
  {
    module: "analytics",
    name: "Platform Analytics",
    icon: "📈",
    description: "Platform growth metrics, user engagement, and trend reports",
    permissions: [
      { key: "analytics.view", label: "View Analytics", description: "Access platform growth charts, signups, and activity metrics" },
      { key: "reports.view", label: "View Reports", description: "Generate and download administrative reports" },
    ],
  },
  {
    module: "jobs",
    name: "Job Opportunities",
    icon: "💼",
    description: "Moderate ecosystem job listings and applications",
    permissions: [
      { key: "jobs.view", label: "View Jobs", description: "View all posted jobs and applicants" },
      { key: "jobs.create", label: "Post Jobs", description: "Create new job postings on behalf of the platform" },
      { key: "jobs.update", label: "Edit Jobs", description: "Update job details and status" },
      { key: "jobs.delete", label: "Delete Jobs", description: "Remove job postings" },
    ],
  },
  {
    module: "tickets",
    name: "Support Tickets",
    icon: "🎫",
    description: "Customer support tickets, resolution workflows, and helpdesk",
    permissions: [
      { key: "tickets.view", label: "View Tickets", description: "View customer support requests" },
      { key: "tickets.update", label: "Manage Tickets", description: "Update ticket status, respond, and resolve" },
      { key: "tickets.assign", label: "Assign & Forward Tickets", description: "Assign or forward tickets to teams and individual members" },
      { key: "tickets.delete", label: "Delete Tickets", description: "Remove tickets" },
    ],
  },
  {
    module: "community",
    name: "Community Wall",
    icon: "🌐",
    description: "Moderate community posts, feed discussions, and pinned posts",
    permissions: [
      { key: "community.view", label: "View Community", description: "View community feed and member posts" },
      { key: "community.moderate", label: "Moderate & Pin Posts", description: "Pin, unpin, and moderate posts" },
      { key: "community.delete", label: "Delete Posts", description: "Delete inappropriate community content" },
    ],
  },
  {
    module: "resources",
    name: "Resource Library",
    icon: "📚",
    description: "Manage contracts, guides, glossary, reports, and knowledge base",
    permissions: [
      { key: "resources.view", label: "View Resources", description: "View all ecosystem library resources" },
      { key: "resources.create", label: "Add Resources", description: "Publish new guides, contracts, and documents" },
      { key: "resources.update", label: "Edit Resources", description: "Update existing library content" },
      { key: "resources.delete", label: "Delete Resources", description: "Remove documents and articles" },
    ],
  },
  {
    module: "programs",
    name: "Incubation Programs",
    icon: "🏆",
    description: "Manage accelerator & incubation cohort programs and applications",
    permissions: [
      { key: "programs.view", label: "View Programs", description: "View incubation and acceleration programs" },
      { key: "programs.create", label: "Create Programs", description: "Create and publish new programs" },
      { key: "programs.update", label: "Edit Programs", description: "Update program syllabus and details" },
      { key: "programs.delete", label: "Delete Programs", description: "Remove programs" },
      { key: "programs.applications_view", label: "View Applications", description: "Review and approve startup program applications" },
    ],
  },
  {
    module: "events",
    name: "Events & Workshops",
    icon: "📅",
    description: "Manage webinars, demo days, workshops, and attendee registrations",
    permissions: [
      { key: "events.view", label: "View Events", description: "View all scheduled events and workshops" },
      { key: "events.create", label: "Create Events", description: "Publish new ecosystem events and workshops" },
      { key: "events.update", label: "Edit Events", description: "Modify event details and schedules" },
      { key: "events.delete", label: "Delete Events", description: "Cancel or remove events" },
      { key: "events.attendees_view", label: "View Attendees", description: "Access attendee rosters and registrations" },
    ],
  },
  {
    module: "legal_compliance",
    name: "Legal Compliance",
    icon: "⚖️",
    description: "Manage legal services, compliance applications, and document reviews",
    permissions: [
      { key: "legal_compliance.view", label: "View Legal Services", description: "View legal compliance services and applications" },
      { key: "legal_compliance.manage", label: "Manage Applications", description: "Process, review, and update compliance filings" },
    ],
  },
  {
    module: "settings",
    name: "Settings & Authentication",
    icon: "🔐",
    description: "Configure login methods (OTP/Password/2FA) and security settings",
    permissions: [
      { key: "auth_settings.view", label: "View Auth Settings", description: "View configured authentication methods" },
      { key: "auth_settings.update", label: "Update Auth Settings", description: "Change ecosystem login and security methods" },
    ],
  },
  {
    module: "theme",
    name: "Theme Customizer",
    icon: "🎨",
    description: "Customize admin panel theme, styling, and branding",
    permissions: [
      { key: "theme.manage", label: "Customize Theme", description: "Change theme colors, layout, and visual presets" },
    ],
  },
  {
    module: "approvals",
    name: "Onboarding Approvals",
    icon: "🛡️",
    description: "Manage organization onboarding verification forms, approval queues, submissions review, status decisions, and approval settings",
    permissions: [
      { key: "approvals.view", label: "View Applications & Queue", description: "View onboarding submissions, applicant details, status queue, and statistics" },
      { key: "approvals.review", label: "Review & Decide Applications", description: "Approve, reject, or request changes on applicant verification forms" },
      { key: "approvals.manage_forms", label: "Manage Approval Forms", description: "Create, edit, publish, and delete dynamic approval form templates" },
    ],
  },
  {
    module: "frontend_customizer",
    name: "Frontend Customizer",
    icon: "🖥️",
    description: "Customize public pages content (Home, Login, Signup, Legal, Hero, Footer, etc.)",
    permissions: [
      { key: "frontend_customizer.view", label: "View Frontend Customizer", description: "View page content configurations and live preview" },
      { key: "frontend_customizer.update", label: "Modify & Publish Page Content", description: "Edit, publish, and reset frontend page content" },
    ],
  },
  {
    module: "audit_logs",
    name: "Audit Logs",
    icon: "📜",
    description: "Security and administrative activity trail",
    permissions: [
      { key: "audit_logs.view", label: "View Audit Logs", description: "Inspect sensitive administrative actions and changes" },
    ],
  },
  {
    module: "notifications",
    name: "Notifications Hub",
    icon: "🔔",
    description: "Broadcast in-app alerts and notifications to users, teams, and segments",
    permissions: [
      { key: "notifications.view", label: "View Notifications", description: "View notification history and delivery logs" },
      { key: "notifications.send", label: "Send Notifications", description: "Dispatch in-app and email notifications" },
      { key: "notifications.delete", label: "Delete Notifications", description: "Delete notification dispatch logs" },
    ],
  },
  {
    module: "mail",
    name: "Mail Dispatcher",
    icon: "📧",
    description: "Compose and dispatch direct or bulk emails across the ecosystem",
    permissions: [
      { key: "mail.view", label: "View Mail Logs", description: "View mail dispatch history and delivery logs" },
      { key: "mail.send", label: "Send Emails", description: "Compose and broadcast direct and bulk emails" },
      { key: "mail.delete", label: "Delete Mail Logs", description: "Delete mail history logs" },
    ],
  },
  {
    module: "assessments",
    name: "Test & Assessments",
    icon: "📝",
    description: "Create, manage, and evaluate tests, assessments, question banks, and domains",
    permissions: [
      { key: "assessments.view", label: "View Assessments", description: "View tests, questions, domains, question banks, and attempt results" },
      { key: "assessments.create", label: "Create Assessments", description: "Create tests, questions, domains, question banks, and collaborators" },
      { key: "assessments.update", label: "Edit Assessments", description: "Edit tests, questions, domains, and manage publishing/archiving" },
      { key: "assessments.delete", label: "Delete Assessments", description: "Delete or archive tests, questions, domains, and question banks" },
      { key: "assessments.evaluate", label: "Evaluate Answers", description: "Manually evaluate text/descriptive answers and assign marks" },
    ],
  },
  {
    module: "certificates",
    name: "Certificates & Builder",
    icon: "🏅",
    description: "Manage issued certificates, verification audits, certificate builder and templates",
    permissions: [
      { key: "certificates.view", label: "View Issued Certificates", description: "View all issued certificates, verification logs, and search" },
      { key: "certificates.manage", label: "Revoke & Restore Certificates", description: "Revoke, restore, and manage issued certificate statuses" },
      { key: "certificates.templates_view", label: "View Certificate Builder", description: "View certificate builder templates and layouts" },
      { key: "certificates.templates_manage", label: "Manage Certificate Templates", description: "Create, edit, design, and delete certificate builder templates" },
    ],
  },
  {
    module: "booster",
    name: "Business Booster Kit",
    icon: "⚡",
    description: "Manage partner perks (AWS, Razorpay, HubSpot), credits, toolkits, and review user claims",
    permissions: [
      { key: "booster.view", label: "View Booster Perks & Claims", description: "View perks catalog, statistics, and incoming claims" },
      { key: "booster.create", label: "Create Booster Perks", description: "Publish new partner perk offers, credits, and toolkits" },
      { key: "booster.update", label: "Edit Booster Perks", description: "Update existing partner perk details, terms, and redemption links" },
      { key: "booster.delete", label: "Delete Booster Perks", description: "Remove perks and partner toolkits" },
      { key: "booster.review_claims", label: "Review & Assign Claims", description: "Approve, reject user claims, and assign voucher codes" },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key)
);

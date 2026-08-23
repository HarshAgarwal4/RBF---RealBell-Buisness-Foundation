import PageContentModel from "../models/pageContent.js";

export const DEFAULT_PAGE_PRESETS = {
  home: {
    pageKey: "home",
    title: "Home Page",
    description: "Main ecosystem landing page, hero section, capabilities, stats, and footer.",
    data: {
      navbar: {
        brandName: "REALBELL",
        brandHighlight: "BELL",
        subtitle: "Business Foundation",
        navLinks: [
          { label: "Capabilities", href: "#services" },
          { label: "Personas", href: "#personas" },
          { label: "How It Works", href: "#how-it-works" },
          { label: "Cohorts", href: "#demo-days" },
          { label: "FAQ", href: "#faq" },
        ],
        loginButtonText: "Sign In",
        registerButtonText: "Get Started Free",
        showThemeToggle: true,
        showLiveTicker: true,
        tickerText: "🔥 Applications Open for Summer Cohort 2026",
      },
      hero: {
        badgeText: "RealBell Ecosystem • DPIIT & Section 8 Recognized",
        badgeHighlight: "National Network",
        mainHeadline: "Connecting Visionary Founders, Investors & Mentors Under One Ecosystem.",
        headlineHighlight: "One Ecosystem.",
        description: "RealBell Business Foundation powers early-stage startups with capital access, institutional incubation cohorts, legal advisory, and elite founder networks.",
        primaryButtonText: "Get Started Free",
        primaryButtonLink: "/signup",
        secondaryButtonText: "Explore Cohorts",
        secondaryButtonLink: "/programs",
        trustBadgeText: "Trusted by 500+ Indian Startups, Angel Syndicates & Incubators",
        floatingCard1: {
          title: "Total Capital Facilitated",
          value: "₹50Cr+",
          subtext: "+34% YoY Growth",
        },
        floatingCard2: {
          title: "Active Angel Investors",
          value: "120+",
          subtext: "Verified Portfolios",
        },
      },
      stats: [
        { label: "Capital Facilitated", value: "₹50Cr+", subtext: "Across Pre-Seed & Seed rounds" },
        { label: "Startups Accelerated", value: "500+", subtext: "High-growth tech ventures" },
        { label: "Angel Investors & VCs", value: "120+", subtext: "Active institutional check writers" },
        { label: "Compliance Success", value: "98%", subtext: "DPIIT, MCA & legal resolutions" },
      ],
      servicesSection: {
        badge: "Ecosystem Pillars",
        title: "Comprehensive Infrastructure for Every Stage of Growth",
        subtitle: "Everything you need to launch, scale, fund, and govern your venture without friction.",
        cards: [
          {
            title: "Capital & Deal Flow",
            description: "Direct syndication with accredited angels, institutional VCs, and grant programs tailored for Indian innovators.",
            tag: "Funding",
          },
          {
            title: "Cohort Incubation",
            description: "Intensive 12-week acceleration tracks with structured milestones, mentor hours, and demo day showcases.",
            tag: "Programs",
          },
          {
            title: "Legal & Regulatory Compliance",
            description: "Turnkey company formation, DPIIT recognition, 80-IAC tax exemptions, ESOP design, and trademark filings.",
            tag: "Compliance",
          },
          {
            title: "Executive Mentorship",
            description: "1-on-1 strategic guidance from serial founders, domain specialists, and industry veterans.",
            tag: "Network",
          },
        ],
      },
      personasSection: {
        badge: "Stakeholder Tracks",
        title: "Tailored Value for Every Stakeholder",
        subtitle: "Custom dashboards, tools, and verified pipelines designed for every ecosystem stakeholder.",
        cards: [
          {
            id: "startups",
            role: "Startup Founders",
            badge: "Founder Track",
            title: "For Startups & Founders",
            tagline: "Turn groundbreaking concepts into scalable, investment-ready enterprises with institutional backing.",
            points: [
              "Structured cohort incubation with milestone accountability & weekly sprints",
              "Direct access to angel syndicates, micro-VCs & government grant programs",
              "1-on-1 strategic advisory with seasoned founders & industry veterans",
              "Standardized legal vault: term sheets, founder vesting & compliance tools",
            ],
            actionText: "Join as a Startup",
            actionLink: "/signup",
            iconName: "Rocket",
          },
          {
            id: "investors",
            role: "Angel & VC Investors",
            badge: "Investor Track",
            title: "For Angels & VC Investors",
            tagline: "Discover pre-vetted, high-conviction startups and co-invest with verified cap-table transparency.",
            points: [
              "Curated deal flow filtered by metrics, traction & audited revenue",
              "Standardized due-diligence data rooms and compliance verification",
              "Syndicate formation and co-investment management infrastructure",
              "Quarterly private demo days and direct founder pitch sessions",
            ],
            actionText: "Join as an Investor",
            actionLink: "/signup",
            iconName: "TrendingUp",
          },
          {
            id: "mentors",
            role: "Industry Mentors",
            badge: "Mentor Track",
            title: "For Mentors & Advisors",
            tagline: "Guide the next wave of founders, share operational playbooks, and create lasting economic impact.",
            points: [
              "Matched with high-intent founders in your specific domain of expertise",
              "Facilitate masterclasses, workshops, and exclusive 1-on-1 office hour clinics",
              "Standardized advisory equity framework and verified mentor credentials",
              "Network with senior leaders, policymakers, and corporate catalysts",
            ],
            actionText: "Join as a Mentor",
            actionLink: "/signup",
            iconName: "Users",
          },
          {
            id: "incubators",
            role: "Incubators & Accelerators",
            badge: "Partner Track",
            title: "For Incubators & Partners",
            tagline: "Supercharge your cohort management, application evaluation, and cross-ecosystem syndication.",
            points: [
              "End-to-end cohort application and multi-reviewer scoring workflows",
              "Centralized founder milestone tracking and real-time KPI dashboards",
              "Cross-ecosystem syndicate syndication and corporate innovation partnerships",
              "Integrated resource vault, legal frameworks, and knowledge exchange system",
            ],
            actionText: "Join as an Incubator",
            actionLink: "/signup",
            iconName: "Building2",
          },
        ],
      },
      howItWorksSection: {
        badge: "Structured Journey",
        title: "How RealBell Accelerates Your Venture",
        subtitle: "A predictable 4-step framework from profile onboarding to closing capital and scaling.",
        steps: [
          {
            stepNumber: "01",
            title: "Onboard & Define Profile",
            description: "Create your foundation profile as a Startup, Investor, Mentor, or Incubator. Complete stakeholder verification.",
            iconName: "Users",
          },
          {
            stepNumber: "02",
            title: "Smart Ecosystem Matching",
            description: "Get paired with domain mentors, relevant cohorts, and potential investors based on industry and stage.",
            iconName: "Target",
          },
          {
            stepNumber: "03",
            title: "Execute & Accelerate",
            description: "Engage in cohort sprints, access the legal vault, schedule advisory office hours, and track milestones.",
            iconName: "Rocket",
          },
          {
            stepNumber: "04",
            title: "Pitch, Fund & Scale",
            description: "Participate in RBF Demo Days, secure capital, expand your team, and become a mentor for the next generation.",
            iconName: "Award",
          },
        ],
      },
      demoDaysSection: {
        badge: "Live Programs",
        title: "Upcoming Cohorts & Pitch Arenas",
        subtitle: "Apply to active sprints, masterclasses, and private demo day opportunities.",
        highlightTitle: "RBF Seed Sprint Cohort 2026",
        highlightSubtitle: "A hands-on 10-week sprint for early-stage founders to establish PMF, build distribution, and prepare for initial angel rounds.",
        highlightDate: "Applications Open • March 2026",
        highlightLocation: "Hybrid (Pan-India)",
        ctaText: "Apply Now",
        ctaLink: "/signup",
        cohorts: [
          {
            title: "RBF Seed Sprint Cohort 2026",
            category: "Incubation",
            date: "Applications Open • March 2026",
            desc: "A hands-on 10-week sprint for early-stage founders to establish PMF, build distribution, and prepare for initial angel rounds.",
            badge: "Flagship",
            ctaText: "Apply Now",
            ctaLink: "/signup",
          },
          {
            title: "All-India Angel Pitch Marathon",
            category: "Fundraising",
            date: "Bi-monthly • April 15, 2026",
            desc: "Exclusive live pitch arena presenting 12 shortlisted startups to a syndicate of 50+ accredited angel investors and micro-VCs.",
            badge: "Investor Arena",
            ctaText: "Pitch Deck Submission",
            ctaLink: "/signup",
          },
          {
            title: "Masterclass: Compliance & Cap Tables",
            category: "Workshop",
            date: "Live Webinar • Alternate Friday",
            desc: "Expert breakdown of ESOP pools, convertible notes, Section 80-IAC tax exemptions, and founder vesting agreements.",
            badge: "Free for Members",
            ctaText: "Register Free",
            ctaLink: "/signup",
          },
        ],
      },
      testimonialsSection: {
        badge: "Testimonials",
        title: "What Ecosystem Leaders Are Saying",
        subtitle: "Real stories from founders, investors, and incubation directors empowered by RealBell.",
        items: [
          {
            quote: "RealBell helped us close our ₹3.5Cr seed round within 6 weeks and resolved our DPIIT tax exemption effortlessly.",
            author: "Aakash Verma",
            role: "Founder & CEO",
            company: "NeuroStack AI",
          },
          {
            quote: "The quality of curated deal flow and standardized diligence metrics on RBF saves our investment committee dozens of hours.",
            author: "Pooja Singhania",
            role: "Principal Partner",
            company: "VentureCraft Capital",
          },
          {
            quote: "A transformative ecosystem hub. Our university incubator doubled its cohort placement success using RealBell's program tools.",
            author: "Dr. K. R. Ramanathan",
            role: "Director of Incubation",
            company: "TechNova Innovation Labs",
          },
        ],
      },
      faqSection: {
        badge: "FAQ",
        title: "Frequently Asked Questions",
        subtitle: "Have questions about joining or navigating the RealBell Business Foundation?",
        faqs: [
          {
            question: "Who can join the RealBell Business Foundation?",
            answer: "Any registered startup founder, accredited angel investor, VC fund representative, approved mentor, or recognized incubator/accelerator is eligible to apply for platform access.",
          },
          {
            question: "Are the legal compliance templates and advisory free?",
            answer: "Platform members enjoy access to standard legal contracts, NDA templates, and compliance guides. Specialized filings (e.g., 80-IAC, trademark registrations) are facilitated through our vetted legal partners at subsidized foundation rates.",
          },
          {
            question: "How does the cohort selection process work?",
            answer: "Applications are evaluated on innovation, market validation, founder credentials, and scalablity. Shortlisted candidates are invited to interview before final cohort onboarding.",
          },
          {
            question: "Can investors syndicate deals on the platform?",
            answer: "Yes, lead angels and syndicate heads can create private deal rooms, invite co-investors, and manage cap table commitments securely.",
          },
        ],
      },
      ctaBanner: {
        title: "Ready to Accelerate Your Venture?",
        subtitle: "Join hundreds of founders, investors, and mentors building the future together on India's premier startup foundation.",
        buttonText: "Join RealBell Ecosystem Now",
        buttonLink: "/signup",
        secondaryButtonText: "Explore Opportunities",
        secondaryButtonLink: "/jobs",
      },
      footer: {
        brandDescription: "RealBell Business Foundation is a non-profit section 8 innovation catalyst committed to democratizing capital, mentorship, and institutional resources for Indian entrepreneurs.",
        newsletterTitle: "Subscribe to Ecosystem Dispatch",
        newsletterSubtitle: "Bi-weekly insights on venture capital rounds, regulatory updates, and upcoming cohort deadlines.",
        copyrightText: "RealBell Business Foundation. All Rights Reserved.",
        contactEmail: "support@realbell.org",
        contactPhone: "+91 (080) 4567-8900",
        address: "Ecosystem Hub, Indiranagar 100ft Road, Bengaluru, Karnataka 560038",
        socialLinksList: [
          { platform: "twitter", url: "https://twitter.com/realbell", label: "Twitter / X" },
          { platform: "linkedin", url: "https://linkedin.com/company/realbell", label: "LinkedIn" },
          { platform: "instagram", url: "https://instagram.com/realbell", label: "Instagram" },
          { platform: "facebook", url: "https://facebook.com/realbell", label: "Facebook" },
          { platform: "github", url: "https://github.com/realbell", label: "GitHub" },
          { platform: "youtube", url: "https://youtube.com/@realbell", label: "YouTube" },
        ],
        ecosystemLinks: [
          { label: "For Startups", href: "/signup" },
          { label: "For Angel Investors", href: "/signup" },
          { label: "For Mentors & CXOs", href: "/signup" },
          { label: "For Incubators", href: "/signup" },
          { label: "For Accelerators", href: "/signup" },
          { label: "Member Dashboard", href: "/login" },
        ],
        quickLinks: [
          { label: "About Foundation", href: "#" },
          { label: "Incubation Programs", href: "/programs" },
          { label: "Events & Demo Days", href: "/events" },
          { label: "Job Opportunities", href: "/jobs" },
          { label: "Legal Services", href: "/legal-compliances" },
          { label: "Resource Library", href: "/resources/contracts" },
        ],
      },
    },
  },

  login: {
    pageKey: "login",
    title: "Login Page",
    description: "Branding, hero highlights, benefit bullet points, and footer notice on the login page.",
    data: {
      leftPanelBadge: "Welcome to RBF Ecosystem",
      mainTitle: "Welcome Back.",
      titleHighlight: "Let's Continue",
      titleSuffix: "Building.",
      description: "Log in to RealBell Business Foundation to access your dashboard, discover funding cohorts, connect with seasoned mentors, and scale your venture.",
      features: [
        { text: "Direct access to founders & accredited investors" },
        { text: "Curated incubator programs & startup cohorts" },
        { text: "Verified contracts, guides & milestone tracking" },
        { text: "Real-time chat & scheduled pitch sessions" },
      ],
      footerNote: "RealBell Foundation",
      platformStatusText: "Platform Active",
      rightPanelPrompt: "Welcome back! Please enter your credentials.",
      helpText: "Need help accessing your account? Contact admin support.",
    },
  },

  signup: {
    pageKey: "signup",
    title: "Signup Page",
    description: "Left panel branding, highlights, step notes, and policy agreement text for user onboarding.",
    data: {
      leftPanelBadge: "Join India's Growth Foundation",
      mainTitle: "Launch, Scale & Fund",
      titleHighlight: "Your Vision.",
      description: "Join thousands of startups, angel syndicates, venture capitalists, and ecosystem mentors accelerating growth across India.",
      features: [
        { text: "Get discovered by active Angel & VC investors" },
        { text: "Apply to prestigious incubation programs" },
        { text: "Access free legal templates & advisory" },
        { text: "Collaborate on the community wall & hire talent" },
      ],
      footerNote: "RealBell Business Foundation",
      platformStatusText: "Onboarding Open",
      step1Title: "Select Your Persona",
      step1Subtitle: "Choose how you participate in the RealBell ecosystem",
      termsAgreementNote: "By creating an account, you agree to our Terms of Service, Privacy Policy, and Community Code of Conduct.",
    },
  },

  "privacy-policy": {
    pageKey: "privacy-policy",
    title: "Privacy Policy",
    description: "Comprehensive privacy and data protection terms for the ecosystem.",
    data: {
      pageTitle: "Privacy Policy",
      subtitle: "How RealBell Business Foundation collects, uses, and safeguards your data.",
      lastUpdated: "June 2026",
      introduction: "At RealBell Business Foundation (\"RBF\", \"we\", \"our\", or \"us\"), we respect your privacy and are committed to protecting the personal and proprietary information you share with our ecosystem platform. This Privacy Policy outlines our standards for gathering, managing, and storing information across our web applications, APIs, and partner integrations.",
      sections: [
        {
          id: "collection",
          heading: "1. Information We Collect",
          content: "We collect information you provide directly during registration, profile enrichment, program applications, and compliance filings:\n\n• **Account Identifiers**: Name, official email address, phone number, and encrypted authentication tokens.\n• **Venture Data**: Startup registration number (DPIIT/CIN), pitch decks, financials, cap tables, and founder biographies.\n• **Investor Data**: Accreditation status, investment thesis, cheque size ranges, and syndicate affiliations.\n• **Technical & Usage Logs**: IP addresses, browser fingerprint, session activity, and interaction timestamps.",
        },
        {
          id: "use",
          heading: "2. How We Use Your Information",
          content: "We use the information collected exclusively to deliver ecosystem services:\n\n• Facilitating matchmaking between startups, investors, and verified mentors.\n• Processing cohort applications, demo day submissions, and workshop registrations.\n• Verifying organizational identity and preventing fraudulent listings.\n• Delivering essential system alerts, security advisories, and administrative notices.",
        },
        {
          id: "sharing",
          heading: "3. Information Sharing & Third Parties",
          content: "We do not sell, rent, or monetize your personal or proprietary information. Information is shared strictly under the following circumstances:\n\n• **Authorized Stakeholders**: Pitch materials and profiles are visible to verified investors and mentors according to your privacy settings.\n• **Legal & Regulatory Authorities**: When mandated by Indian laws, court orders, or Section 8 compliance audits.\n• **Trusted Service Providers**: Cloud hosting (AWS), transactional email systems (SMTP/SendGrid), and payment gateways under strict Non-Disclosure Agreements.",
        },
        {
          id: "security",
          heading: "4. Data Security & Storage",
          content: "We implement industry-standard administrative, technical, and physical safeguards:\n\n• All communication is encrypted via TLS 1.3 in transit and AES-256 at rest.\n• Role-Based Access Control (RBAC) restricts internal employee access on a least-privilege basis.\n• Regular automated security scans and vulnerability audits.",
        },
        {
          id: "rights",
          heading: "5. Your Rights & Data Portability",
          content: "Under applicable data protection guidelines, you hold the right to:\n\n• Access and request a complete export of your personal profile data.\n• Request correction of outdated or inaccurate venture details.\n• Request deletion or anonymization of your account upon exiting the foundation.\n\nTo exercise these rights, submit a support ticket or contact our Data Privacy Officer.",
        },
        {
          id: "contact",
          heading: "6. Contact Our Privacy Team",
          content: "If you have questions, grievances, or feedback regarding our privacy practices, please contact us:\n\n**Email**: privacy@realbell.org\n**Postal Address**: RealBell Business Foundation, Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India.",
        },
      ],
    },
  },

  "terms-of-service": {
    pageKey: "terms-of-service",
    title: "Terms of Service",
    description: "Terms of service, platform usage governance, and legal agreements.",
    data: {
      pageTitle: "Terms of Service & Foundation Governance",
      subtitle: "The rules and legal covenants governing access to the RealBell Ecosystem.",
      lastUpdated: "June 2026",
      introduction: "Welcome to RealBell Business Foundation. By registering an account, accessing our dashboard, participating in cohorts, or utilizing our compliance tools, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue platform use immediately.",
      sections: [
        {
          id: "eligibility",
          heading: "1. Eligibility & Registration",
          content: "To use the RealBell platform, you must be at least 18 years of age and hold the legal authority to bind the entity (startup, fund, or institution) you represent.\n\nYou agree to provide accurate, truthful, and up-to-date information during onboarding and maintain the security of your authentication credentials.",
        },
        {
          id: "platform-purpose",
          heading: "2. Platform Purpose & Non-Brokerage Disclaimer",
          content: "RealBell Business Foundation operates as a Section 8 non-profit ecosystem facilitator. RBF is not a registered stock exchange, broker-dealer, or investment advisor under SEBI regulations.\n\nAll investment interactions, pitch discussions, and funding syndications are conducted directly between participating parties at their independent discretion. RBF does not guarantee investment outcomes or endorse specific ventures.",
        },
        {
          id: "acceptable-use",
          heading: "3. Acceptable Use & Conduct",
          content: "When using our platform and community forums, you agree that you will not:\n\n• Upload fraudulent, misleading, or plagiarized pitch materials.\n• Harass, defame, spam, or solicit members for unauthorized commercial schemes.\n• Attempt to reverse engineer, scrape, or disrupt platform infrastructure.\n• Circumvent Role-Based Access Controls or access unauthorized private deal rooms.",
        },
        {
          id: "intellectual-property",
          heading: "4. Intellectual Property & Confidentiality",
          content: "Founders retain 100% ownership of their pre-existing intellectual property, inventions, source code, and business plans.\n\nBy uploading materials marked as public, you grant RBF a non-exclusive license to display them to registered members. Materials designated as confidential in private deal rooms are protected under standard platform NDA covenants.",
        },
        {
          id: "termination",
          heading: "5. Suspension & Account Termination",
          content: "RBF reserves the right to suspend or terminate accounts that violate our Code of Conduct, fail identity verification, or engage in malicious activity without prior liability.",
        },
        {
          id: "disputes",
          heading: "6. Governing Law & Dispute Resolution",
          content: "These terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.",
        },
      ],
    },
  },

  "code-of-conduct": {
    pageKey: "code-of-conduct",
    title: "Code of Conduct",
    description: "Ethical standards, community guidelines, and mutual respect principles.",
    data: {
      pageTitle: "Community Code of Conduct",
      subtitle: "Fostering an inclusive, honest, and high-trust ecosystem for all innovators.",
      lastUpdated: "June 2026",
      introduction: "RealBell Business Foundation is dedicated to providing a safe, ethical, and collaborative environment for founders, investors, students, and mentors regardless of background, gender, identity, or stage of growth. We expect all community members to uphold the highest standards of professional integrity.",
      sections: [
        {
          id: "our-pledge",
          heading: "1. Our Core Values",
          content: "• **Mutual Respect**: Treat every peer, founder, and mentor with dignity and constructive empathy.\n• **Intellectual Honesty**: Represent your traction, financials, and cap tables truthfully.\n• **Inclusivity & Equity**: Champion equal opportunity for underrepresented founders across tier-2/3 regions.\n• **Constructive Collaboration**: Share knowledge freely and celebrate the milestones of fellow ecosystem members.",
        },
        {
          id: "unacceptable-behavior",
          heading: "2. Unacceptable Behaviors",
          content: "The following behaviors are strictly prohibited across all virtual and in-person RBF channels:\n\n• Harassment, hate speech, discriminatory jokes, or offensive commentary.\n• Unsolicited spamming of pitch decks in public chat threads or direct messaging.\n• Plagiarizing code, research, or business models from other cohort participants.\n• Predatory deal terms or exploitative advisory equity demands.",
        },
        {
          id: "reporting",
          heading: "3. Reporting & Incident Resolution",
          content: "If you experience or witness behavior that violates this Code of Conduct, please report it immediately through our Support Tickets module or email ethics@realbell.org.\n\nAll reports are handled with strict confidentiality by our Ethics Review Board.",
        },
        {
          id: "enforcement",
          heading: "4. Enforcement Ladder",
          content: "Violations may lead to progressive enforcement actions:\n\n1. **Formal Warning**: Private notification outlining the violation and expected corrective action.\n2. **Temporary Mute/Suspension**: Temporary removal from community chats, event participation, and deal rooms.\n3. **Permanent Expulsion**: Immediate termination of platform access, removal from active cohorts, and revocation of foundation credentials.",
        },
      ],
    },
  },
};

/**
 * Seed default pages if not present in DB
 */
export async function seedDefaultPages() {
  try {
    for (const [key, preset] of Object.entries(DEFAULT_PAGE_PRESETS)) {
      const existing = await PageContentModel.findOne({ pageKey: key });
      if (!existing) {
        await PageContentModel.create(preset);
        console.log(`[FRONTEND CUSTOMIZER] ✅ Seeded default content for page: ${key}`);
      }
    }
  } catch (err) {
    console.error("[FRONTEND CUSTOMIZER] Error seeding default pages:", err);
  }
}

/**
 * Public: Get content of a specific page
 */
export async function getPublicPageContent(req, res) {
  try {
    const { pageKey } = req.params;
    let page = await PageContentModel.findOne({ pageKey });

    if (!page) {
      // Fallback to in-memory preset if database has not seeded yet
      if (DEFAULT_PAGE_PRESETS[pageKey]) {
        return res.json({
          status: 1,
          page: DEFAULT_PAGE_PRESETS[pageKey],
          isDefault: true,
        });
      }
      return res.status(404).json({
        status: 0,
        msg: `Page '${pageKey}' not found`,
      });
    }

    return res.json({
      status: 1,
      page,
      isDefault: false,
    });
  } catch (err) {
    console.error("Error in getPublicPageContent:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error fetching page content",
    });
  }
}

/**
 * Public: Get list of all available pages
 */
export async function getAllPublicPages(req, res) {
  try {
    const pages = await PageContentModel.find({ isPublished: true });

    // Map pages by pageKey and fill missing presets
    const pagesMap = {};
    for (const [key, preset] of Object.entries(DEFAULT_PAGE_PRESETS)) {
      pagesMap[key] = preset.data;
    }
    for (const p of pages) {
      if (p.pageKey && p.data) {
        pagesMap[p.pageKey] = p.data;
      }
    }

    return res.json({
      status: 1,
      pages,
      pagesMap,
    });
  } catch (err) {
    console.error("Error in getAllPublicPages:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error",
    });
  }
}

/**
 * Admin: Get all pages with detailed metadata
 */
export async function getAdminPagesList(req, res) {
  try {
    const pages = await PageContentModel.find()
      .populate("updatedBy", "name email company_name")
      .sort({ createdAt: 1 });

    // If some pages aren't seeded yet, merge with preset keys
    const foundKeys = new Set(pages.map((p) => p.pageKey));
    const mergedList = [...pages];

    for (const [key, preset] of Object.entries(DEFAULT_PAGE_PRESETS)) {
      if (!foundKeys.has(key)) {
        mergedList.push(preset);
      }
    }

    return res.json({
      status: 1,
      pages: mergedList,
    });
  } catch (err) {
    console.error("Error in getAdminPagesList:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error fetching admin pages list",
    });
  }
}

/**
 * Admin: Get full content for editing a page
 */
export async function getAdminPageContent(req, res) {
  try {
    const { pageKey } = req.params;
    let page = await PageContentModel.findOne({ pageKey }).populate(
      "updatedBy",
      "name email company_name"
    );

    if (!page) {
      if (DEFAULT_PAGE_PRESETS[pageKey]) {
        // Auto-create from preset if missing
        page = await PageContentModel.create(DEFAULT_PAGE_PRESETS[pageKey]);
      } else {
        return res.status(404).json({
          status: 0,
          msg: `Page '${pageKey}' not found`,
        });
      }
    }

    return res.json({
      status: 1,
      page,
      preset: DEFAULT_PAGE_PRESETS[pageKey] || null,
    });
  } catch (err) {
    console.error("Error in getAdminPageContent:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error fetching admin page details",
    });
  }
}

/**
 * Admin: Update page content
 */
export async function updatePageContent(req, res) {
  try {
    const { pageKey } = req.params;
    const { title, description, data, isPublished } = req.body;

    if (!DEFAULT_PAGE_PRESETS[pageKey]) {
      return res.status(400).json({
        status: 0,
        msg: `Invalid page key '${pageKey}'`,
      });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({
        status: 0,
        msg: "Content data payload is required and must be an object",
      });
    }

    const updateDoc = {
      data,
      updatedBy: req.user?._id || null,
    };

    if (title) updateDoc.title = title;
    if (description !== undefined) updateDoc.description = description;
    if (isPublished !== undefined) updateDoc.isPublished = Boolean(isPublished);

    const page = await PageContentModel.findOneAndUpdate(
      { pageKey },
      updateDoc,
      { new: true, upsert: true }
    ).populate("updatedBy", "name email company_name");

    return res.json({
      status: 1,
      msg: `Page '${page.title || pageKey}' updated successfully`,
      page,
    });
  } catch (err) {
    console.error("Error in updatePageContent:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error updating page content",
    });
  }
}

/**
 * Admin: Reset page content back to factory default preset
 */
export async function resetPageContent(req, res) {
  try {
    const { pageKey } = req.params;
    const preset = DEFAULT_PAGE_PRESETS[pageKey];

    if (!preset) {
      return res.status(404).json({
        status: 0,
        msg: `Default preset for '${pageKey}' does not exist`,
      });
    }

    const page = await PageContentModel.findOneAndUpdate(
      { pageKey },
      {
        title: preset.title,
        description: preset.description,
        data: preset.data,
        isPublished: true,
        updatedBy: req.user?._id || null,
      },
      { new: true, upsert: true }
    ).populate("updatedBy", "name email company_name");

    return res.json({
      status: 1,
      msg: `Page '${page.title}' has been reset to factory defaults`,
      page,
    });
  } catch (err) {
    console.error("Error in resetPageContent:", err);
    return res.status(500).json({
      status: 0,
      msg: "Internal server error resetting page content",
    });
  }
}

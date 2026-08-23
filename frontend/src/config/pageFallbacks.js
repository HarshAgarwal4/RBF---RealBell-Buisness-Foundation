/**
 * Complete Fallback Data for All Customizable Platform Pages
 * Guarantees zero-blank rendering for every single section across the entire application.
 */

export const DEFAULT_PAGE_FALLBACKS = {
  home: {
    navbar: {
      brandName: "REAL",
      brandHighlight: "BELL",
      subtitle: "Business Foundation",
      navLinks: [
        { label: "Capabilities", href: "#services" },
        { label: "Tracks", href: "#personas" },
        { label: "Roadmap", href: "#how-it-works" },
        { label: "Cohorts", href: "#demo-days" },
        { label: "FAQ", href: "#faq" },
      ],
      loginButtonText: "Login",
      registerButtonText: "Apply For Incubation",
      showThemeToggle: true,
      showLiveTicker: false,
      tickerText: "🔥 Applications Open for Summer Cohort 2026",
    },
    hero: {
      badgeText: "India's Premier Business Incubation Ecosystem",
      badgeHighlight: "National Network",
      mainHeadline: "Where High-Growth",
      headlineHighlight: "Founders & Capital Converge",
      description:
        "RealBell Business Foundation bridges early-stage startups with institutional angel syndicates, veteran CXO mentors, cohort acceleration programs, and verified legal frameworks.",
      primaryButtonText: "Apply For Incubation",
      primaryButtonLink: "/signup",
      secondaryButtonText: "Explore Tracks",
      secondaryButtonLink: "#personas",
      trustBadgeText: "DPIIT & Section 8 Recognized Ecosystem",
    },
    stats: [
      { label: "Ventures Incubated", value: "500+", subtext: "Across 20+ Sectors" },
      { label: "Funding Catalyzed", value: "₹45 Cr+", subtext: "Pre-seed & Seed" },
      { label: "Industry Mentors", value: "150+", subtext: "Founders & CXOs" },
      { label: "Demo Days", value: "40+", subtext: "Pan-India Tracks" },
    ],
    servicesSection: {
      badge: "Full-Stack Acceleration",
      title: "Everything Your Venture Needs to Scale",
      subtitle:
        "A complete institutional suite designed to eliminate roadblocks in fundraising, mentor advisory, compliance, and execution.",
      cards: [
        {
          title: "Cohort Incubation & Acceleration",
          description:
            "Immersive 12-week acceleration programs tailored for seed-stage startups, covering product-market fit, unit economics, and go-to-market execution.",
          tag: "Foundations",
        },
        {
          title: "Capital Connect & Syndicates",
          description:
            "Structured introductions to angel networks, family offices, and institutional venture capital funds aligned with your business model.",
          tag: "Fundraising",
        },
        {
          title: "1-on-1 Strategic Mentorship",
          description:
            "Continuous guidance from vetted operators who have successfully built, scaled, and exited ventures in Indian and global markets.",
          tag: "Advisory",
        },
        {
          title: "Legal, IP & Regulatory Guidance",
          description:
            "Pro-bono and partner legal advisories covering entity structuring, founder vesting, trademark filing, and tax incentive registrations.",
          tag: "Compliance",
        },
        {
          title: "Verified Resource Vault",
          description:
            "Instant access to standardized investor-grade pitch deck templates, term sheet benchmarks, cap table models, and market intelligence reports.",
          tag: "Intelligence",
        },
        {
          title: "Milestone & KPI Accountability",
          description:
            "Track critical product, revenue, and hiring milestones with our built-in progress tracker and monthly investor update tools.",
          tag: "Execution",
        },
      ],
    },
    personasSection: {
      badge: "Stakeholder Tracks",
      title: "Tailored Value for Every Stakeholder",
      subtitle:
        "Choose your role in India's startup growth story and unlock dedicated tooling.",
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
      subtitle:
        "A predictable 4-step framework from profile onboarding to closing capital and scaling.",
      steps: [
        {
          stepNumber: "01",
          title: "Onboard & Define Profile",
          description:
            "Create your foundation profile as a Startup, Investor, Mentor, or Incubator. Complete stakeholder verification.",
          iconName: "Users",
        },
        {
          stepNumber: "02",
          title: "Smart Ecosystem Matching",
          description:
            "Get paired with domain mentors, relevant cohorts, and potential investors based on industry and stage.",
          iconName: "Target",
        },
        {
          stepNumber: "03",
          title: "Execute & Accelerate",
          description:
            "Engage in cohort sprints, access the legal vault, schedule advisory office hours, and track milestones.",
          iconName: "Rocket",
        },
        {
          stepNumber: "04",
          title: "Pitch, Fund & Scale",
          description:
            "Participate in RBF Demo Days, secure capital, expand your team, and become a mentor for the next generation.",
          iconName: "Award",
        },
      ],
    },
    demoDaysSection: {
      badge: "Live Programs",
      title: "Upcoming Cohorts & Pitch Arenas",
      subtitle:
        "Apply to active sprints, masterclasses, and private demo day opportunities.",
      highlightTitle: "RBF Seed Sprint Cohort 2026",
      highlightSubtitle:
        "A hands-on 10-week sprint for early-stage founders to establish PMF, build distribution, and prepare for initial angel rounds.",
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
      badge: "Ecosystem Voices",
      title: "Backed by Founders & Operators",
      subtitle:
        "Discover how ventures across India are leveraging RealBell to build and scale.",
      items: [
        {
          quote:
            "RealBell Business Foundation provided us with the exact regulatory clarity, mentor guidance, and investor introductions we needed to close our ₹1.8 Cr seed round within 8 weeks.",
          author: "Aditya Verma",
          role: "Co-founder & CEO",
          company: "NexusHealth Technologies",
          stage: "Raised Seed • Incubated in RBF",
        },
        {
          quote:
            "As an angel investor, the quality of vetted startups, transparent milestone metrics, and clean diligence data rooms on RBF makes deal discovery 10x faster.",
          author: "Pooja Singhania",
          role: "Managing Partner",
          company: "Apex Angel Syndicate",
          stage: "Active Backer • 12 Portfolio Startups",
        },
        {
          quote:
            "Mentoring high-conviction founders through RBF has been immensely rewarding. The platform's milestone tracking structure ensures actionable outcomes after every advisory session.",
          author: "Dr. Arvind Rao",
          role: "Ex-VP Engineering & Mentor",
          company: "Venture Advisor",
          stage: "15+ Startups Guided",
        },
      ],
    },
    faqSection: {
      badge: "Frequently Asked Questions",
      title: "Everything You Need to Know",
      subtitle:
        "Got questions about RealBell Business Foundation? We have answers.",
      faqs: [
        {
          question: "What is RealBell Business Foundation (RBF)?",
          answer:
            "RealBell Business Foundation is a non-profit and ecosystem initiative dedicated to empowering startups, entrepreneurs, and business leaders in India. We provide incubation support, structured mentorship, angel investment connect, legal resources, and milestone accountability under a single integrated platform.",
        },
        {
          question: "Who can join the RBF platform?",
          answer:
            "RBF is designed for four core stakeholders: (1) Startups & early-stage founders seeking growth and capital, (2) Angel investors, VC funds, and syndicates looking for vetted deal flow, (3) Experienced mentors & CXOs wishing to advise founders, and (4) Regional incubators & accelerators looking to collaborate.",
        },
        {
          question: "Is there any cost to join and register on RBF?",
          answer:
            "Basic registration, profile creation, and access to community networking and foundational resource guides are completely free during our Open Beta preview. Specific premium cohort programs or specialized services may have subsidized fees.",
        },
        {
          question: "How does the mentor matching process work?",
          answer:
            "Once your startup profile and industry domain are submitted, our intelligent matching system and program managers recommend mentors with specific operational background in your sector. You can schedule 1-on-1 advisory sessions and track action items.",
        },
        {
          question: "How can investors access deal flow on RBF?",
          answer:
            "Accredited individual angels, syndicates, and institutional funds can register under the Investor track. Upon profile verification, investors gain access to verified startup profiles, pitch decks, milestone updates, and private demo day invitations.",
        },
      ],
    },
    ctaBanner: {
      title: "Start Building on India's Premier Incubation Network",
      subtitle:
        "Join founders, angel syndicates, and mentors driving the next chapter of enterprise innovation.",
      buttonText: "Create Foundation Account",
      buttonLink: "/signup",
    },
    footer: {
      brandDescription:
        "Empowering India's next generation of entrepreneurial leaders through structured incubation, capital connections, strategic mentorship, and milestone accountability.",
      newsletterTitle: "Stay Updated",
      newsletterSubtitle:
        "Receive cohort announcements and angel pitch notifications.",
      contactEmail: "contact@realbell.org",
      contactPhone: "+91 (0141) 285-4000",
      copyrightText: "RealBell Business Foundation. All Rights Reserved.",
      address:
        "Registered non-profit & ecosystem entity based in Jaipur, Rajasthan, serving founders pan-India.",
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
      resourceLinks: [
        { label: "Legal Contract Vault", href: "/resources/contracts" },
        { label: "Startup Glossary", href: "/resources/glossary" },
        { label: "Market Reports", href: "/resources/reports" },
        { label: "Masterclass Videos", href: "/resources/videos" },
        { label: "Milestone Tracker", href: "/milestones" },
      ],
    },
  },

  login: {
    badgeText: "Secure Ecosystem Gateway",
    mainHeadline: "Welcome Back to RealBell Foundation",
    description:
      "Access your unified startup acceleration portal, investor data rooms, and milestone management tools.",
    featuresList: [
      "Track active cohort milestones and sprint deliverables",
      "Connect with assigned domain mentors and schedule advisory clinics",
      "Access legal document vault, term sheets, and compliance frameworks",
      "Manage angel syndicate pitch decks and investor updates",
    ],
    footerNotice:
      "RealBell Business Foundation • Section 8 Non-Profit Ecosystem Entity",
    troubleHelpText: "Need assistance with your institutional credentials?",
  },

  signup: {
    badgeText: "Join India's Growth Ecosystem",
    mainHeadline: "Start Your Foundation Journey",
    description:
      "Create your free foundation account to unlock structured incubation tracks, capital access, and executive advisory networks.",
    benefits: [
      "Personalized onboarding track for Startups, Angels, Mentors & Incubators",
      "Instant access to open cohort applications and demo day arenas",
      "Curated legal contract vault and compliance guides",
      "Direct networking with vetted industry CXOs and ecosystem leaders",
    ],
    termsNotice:
      "By creating an account, you agree to our Terms of Foundation and Privacy Policy.",
  },

  "privacy-policy": {
    preamble:
      "RealBell Business Foundation ('RBF', 'we', 'our', or 'us') operates as an incubation and entrepreneurship facilitation platform. We are committed to protecting the privacy, confidentiality, and security of all founders, investors, mentors, and partner organizations who use our digital platform and services.",
    sections: [
      {
        heading: "1. Information We Collect",
        body: "We collect information you provide directly during registration and platform usage, including organizational details, founder bios, pitch decks, corporate governance records, financial metrics, and communication logs. We also collect device telemetry, IP addresses, and session timestamps to protect ecosystem security.",
      },
      {
        heading: "2. How We Use Collected Data",
        body: "Data collected is utilized strictly to: (a) facilitate smart mentor-founder matching, (b) conduct due diligence for angel syndicates upon explicit founder permission, (c) manage cohort milestones, (d) process platform notifications, and (e) satisfy regulatory compliance with applicable Indian laws.",
      },
      {
        heading: "3. Data Sharing & Third Parties",
        body: "RBF will never sell your personal or proprietary venture data. Information is shared only with verified stakeholders (such as accredited investors or assigned mentors) according to your explicit platform sharing settings and non-disclosure protocols.",
      },
      {
        heading: "4. Data Security & Retention",
        body: "We deploy enterprise-grade encryption (AES-256 at rest, TLS 1.3 in transit), tokenized sessions, and role-based access control (RBAC). Data is retained as long as your foundation account remains active or as required by statutory non-profit recordkeeping rules.",
      },
      {
        heading: "5. Grievance Officer & Contact",
        body: "In accordance with the Information Technology Act 2000 and Digital Personal Data Protection (DPDP) Act, you may contact our designated Grievance Officer at privacy@realbell.org for data access, rectification, or deletion requests.",
      },
    ],
  },

  "terms-of-service": {
    preamble:
      "These Terms of Foundation constitute a legally binding agreement between you ('Member', 'User', or 'Organization') and RealBell Business Foundation ('RBF'). By accessing our platform, participating in cohorts, or utilizing our legal vaults, you agree to comply with these terms.",
    sections: [
      {
        heading: "1. Ecosystem Eligibility & Verification",
        body: "Users must provide truthful, complete, and verifiable information during onboarding. RBF reserves the right to suspend or terminate accounts that misrepresent cap tables, financial metrics, regulatory status, or institutional credentials.",
      },
      {
        heading: "2. Intellectual Property Rights",
        body: "Startups retain 100% ownership of their intellectual property, business models, proprietary source code, and confidential artifacts uploaded to data rooms. RBF asserts no equity claims or IP ownership by virtue of standard platform usage.",
      },
      {
        heading: "3. Cohort Participation & Milestone Accountability",
        body: "Members enrolled in structured incubation programs agree to adhere to cohort sprint schedules, attend scheduled mentor office hours, and submit periodic milestone KPI updates in good faith.",
      },
      {
        heading: "4. Disclaimer of Investment Returns",
        body: "RBF is an incubation and ecosystem facilitation platform, not a registered stock exchange or broker-dealer. We do not guarantee capital deployment, investment outcomes, or financial returns. All investment decisions are made independently between accredited investors and founders.",
      },
      {
        heading: "5. Governing Law & Jurisdiction",
        body: "These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Jaipur, Rajasthan.",
      },
    ],
  },

  "code-of-conduct": {
    preamble:
      "RealBell Business Foundation is committed to fostering an inclusive, ethical, collaborative, and professional ecosystem for India's startup ecosystem. Every participant—whether a founder, angel investor, seasoned mentor, or community partner—is expected to uphold these standards.",
    sections: [
      {
        heading: "1. Ethical Dealings & Transparency",
        body: "All members must conduct interactions with honesty, fairness, and mutual respect. Founders must represent company health accurately, and investors/mentors must disclose any conflicts of interest before advisory engagements.",
      },
      {
        heading: "2. Zero Tolerance for Harassment & Discrimination",
        body: "We enforce zero tolerance for discrimination or harassment based on gender, race, religion, caste, sexual orientation, disability, or physical appearance. Any discriminatory conduct results in immediate account expulsion.",
      },
      {
        heading: "3. Confidentiality & Non-Disclosure",
        body: "Proprietary information shared during pitch sessions, advisory clinics, or cohort masterclasses must be treated as confidential. Members must not trade on, leak, or plagiarize fellow founders' business ideas or pitch artifacts.",
      },
      {
        heading: "4. Constructive Mentorship & Constructive Feedback",
        body: "Advisors and mentors agree to deliver constructive, actionable, and respectful guidance. Founders agree to engage respectfully and implement actionable feedback to accelerate venture milestones.",
      },
      {
        heading: "5. Reporting Violations & Enforcement",
        body: "If you witness or experience conduct in violation of these standards, please submit a confidential report to ethics@realbell.org. The RBF Ethics Committee will investigate impartially and take appropriate corrective actions.",
      },
    ],
  },
};

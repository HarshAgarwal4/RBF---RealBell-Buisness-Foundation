import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../zustand/store";
import { useTheme } from "../context/ThemeProvider";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Handshake,
  Lightbulb,
  Users,
  Target,
  Rocket,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  TrendingUp,
  Award,
  ShieldCheck,
  Globe,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  FileText,
  Video,
  Check,
  ChevronDown,
  Mail,
  Send,
  Star,
  ExternalLink,
} from "lucide-react";

// Fade in up animation variant
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useStore();
  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePersona, setActivePersona] = useState("startups");
  const [openFaq, setOpenFaq] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const stats = [
    { number: "500+", title: "Ventures Incubated", subtitle: "Across 20+ sectors" },
    { number: "₹45 Cr+", title: "Funding Catalyzed", subtitle: "Pre-seed to Series A" },
    { number: "150+", title: "Industry Mentors", subtitle: "Founders & CXOs" },
    { number: "40+", title: "Demo Days & Cohorts", subtitle: "Active annual tracks" },
  ];

  const personas = {
    startups: {
      id: "startups",
      title: "For Startups & Founders",
      icon: Rocket,
      tagline: "Turn groundbreaking ideas into scalable, investment-ready enterprises.",
      points: [
        "Structured cohort incubation with milestone accountability",
        "Direct access to angel syndicates, micro-VCs & grant programs",
        "1-on-1 advisory with seasoned founders & industry veterans",
        "Ready-to-use legal contracts, term sheets & compliance tools",
      ],
      badge: "Founder Track",
      cta: "Join as a Startup",
      route: "/signup",
    },
    investors: {
      id: "investors",
      title: "For Angels & VC Investors",
      icon: TrendingUp,
      tagline: "Discover pre-vetted, high-potential startups and co-invest with ease.",
      points: [
        "Curated deal flow filtered by metrics, traction & revenue",
        "Standardized due-diligence data rooms and audit trails",
        "Syndicate formation and co-investment management tools",
        "Quarterly private demo days and direct founder pitch sessions",
      ],
      badge: "Investor Track",
      cta: "Join as an Investor",
      route: "/signup",
    },
    mentors: {
      id: "mentors",
      title: "For Mentors & Advisors",
      icon: Users,
      tagline: "Guide the next wave of founders and create lasting economic impact.",
      points: [
        "Matched with high-intent founders in your specific domain",
        "Facilitate masterclasses, workshops, and office hour clinics",
        "Advisory equity framework and verified mentor credentials",
        "Network with senior leaders, policymakers, and corporate catalysts",
      ],
      badge: "Mentor Track",
      cta: "Join as a Mentor",
      route: "/signup",
    },
    incubators: {
      id: "incubators",
      title: "For Incubators & Accelerators",
      icon: Building2,
      tagline: "Supercharge your cohort management, applications, and demo days.",
      points: [
        "End-to-end cohort application and evaluation workflows",
        "Centralized founder milestone tracking and KPI dashboards",
        "Cross-ecosystem syndicate syndication and corporate partnerships",
        "Integrated resource vault and knowledge exchange system",
      ],
      badge: "Partner Track",
      cta: "Join as an Incubator",
      route: "/signup",
    },
  };

  const services = [
    {
      icon: Rocket,
      title: "Cohort Incubation & Acceleration",
      desc: "Immersive 12-week acceleration programs tailored for seed-stage startups, covering product-market fit, unit economics, and go-to-market execution.",
      tag: "Foundations",
    },
    {
      icon: Handshake,
      title: "Capital Connect & Syndicates",
      desc: "Structured introductions to angel networks, family offices, and institutional venture capital funds aligned with your business model.",
      tag: "Fundraising",
    },
    {
      icon: Users,
      title: "1-on-1 Strategic Mentorship",
      desc: "Continuous guidance from vetted operators who have successfully built, scaled, and exited ventures in Indian and global markets.",
      tag: "Advisory",
    },
    {
      icon: ShieldCheck,
      title: "Legal, IP & Regulatory Guidance",
      desc: "Pro-bono and partner legal advisories covering entity structuring, founder vesting, trademark filing, and tax incentive registrations.",
      tag: "Compliance",
    },
    {
      icon: BookOpen,
      title: "Verified Resource Vault",
      desc: "Instant access to standardized investor-grade pitch deck templates, term sheet benchmarks, cap table models, and market intelligence reports.",
      tag: "Intelligence",
    },
    {
      icon: Target,
      title: "Milestone & KPI Accountability",
      desc: "Track critical product, revenue, and hiring milestones with our built-in progress tracker and monthly investor update tools.",
      tag: "Execution",
    },
  ];

  const roadmap = [
    {
      step: "01",
      title: "Onboard & Define Profile",
      desc: "Create your foundation profile as a Startup, Investor, Mentor, or Incubator. Complete stakeholder verification.",
    },
    {
      step: "02",
      title: "Smart Ecosystem Matching",
      desc: "Get paired with domain mentors, relevant cohorts, and potential investors based on industry and stage.",
    },
    {
      step: "03",
      title: "Execute & Accelerate",
      desc: "Engage in cohort sprints, access the legal vault, schedule advisory office hours, and track milestones.",
    },
    {
      step: "04",
      title: "Pitch, Fund & Scale",
      desc: "Participate in RBF Demo Days, secure capital, expand your team, and become a mentor for the next generation.",
    },
  ];

  const upcomingPrograms = [
    {
      title: "RBF Seed Sprint Cohort 2026",
      category: "Incubation",
      date: "Applications Open • Starts March 2026",
      desc: "A hands-on 10-week sprint for early-stage founders to establish PMF and prepare for initial angel rounds.",
      badge: "Flagship",
    },
    {
      title: "All-India Angel Pitch Marathon",
      category: "Fundraising",
      date: "Bi-monthly • Next on April 15, 2026",
      desc: "Exclusive live pitch arena presenting 12 shortlisted startups to a syndicate of 50+ accredited angel investors.",
      badge: "Investor Arena",
    },
    {
      title: "Masterclass: Startup Compliance & Cap Tables",
      category: "Workshop",
      date: "Live Webinar • Every Alternate Friday",
      desc: "Expert breakdown of ESOP pools, convertible notes, Section 80-IAC tax exemptions, and founder agreements.",
      badge: "Free for Members",
    },
  ];

  const testimonials = [
    {
      quote:
        "RealBell Business Foundation provided us with the exact regulatory clarity, mentor guidance, and investor introductions we needed to close our ₹1.8 Cr seed round.",
      author: "Aditya Verma",
      role: "Co-founder & CEO",
      company: "NexusHealth Technologies",
      stage: "Raised Seed • Incubated in RBF",
    },
    {
      quote:
        "As an angel investor, the quality of vetted startups and transparent traction metrics on RBF makes deal discovery and due diligence 10x faster.",
      author: "Pooja Singhania",
      role: "Managing Partner",
      company: "Apex Angel Syndicate",
      stage: "Active Backer • 12 Portfolio Startups",
    },
    {
      quote:
        "Mentoring high-conviction founders through RBF has been incredibly fulfilling. The milestone tracking structure ensures actionable outcomes every week.",
      author: "Dr. Arvind Rao",
      role: "Ex-VP Engineering & Ecosystem Mentor",
      company: "Venture Advisor",
      stage: "15+ Startups Guided",
    },
  ];

  const faqs = [
    {
      q: "What is RealBell Business Foundation (RBF)?",
      a: "RealBell Business Foundation is a non-profit and ecosystem initiative dedicated to empowering startups, entrepreneurs, and business leaders in India. We provide incubation support, structured mentorship, angel investment connect, legal resources, and milestone accountability under a single integrated platform.",
    },
    {
      q: "Who can join the RBF platform?",
      a: "RBF is designed for four core stakeholders: (1) Startups & early-stage founders seeking growth and capital, (2) Angel investors, VC funds, and syndicates looking for vetted deal flow, (3) Experienced mentors & CXOs wishing to advise founders, and (4) Regional incubators & accelerators looking to collaborate.",
    },
    {
      q: "Is there any cost to join and register on RBF?",
      a: "Basic registration, profile creation, and access to community networking and foundational resource guides are completely free during our Open Beta preview. Specific premium cohort programs or specialized services may have subsidized fees.",
    },
    {
      q: "How does the mentor matching process work?",
      a: "Once your startup profile and industry domain are submitted, our intelligent matching system and program managers recommend mentors with specific operational background in your sector. You can schedule 1-on-1 advisory sessions and track action items.",
    },
    {
      q: "How can investors access deal flow on RBF?",
      a: "Accredited individual angels, syndicates, and institutional funds can register under the Investor track. Upon profile verification, investors gain access to verified startup profiles, pitch decks, milestone updates, and private demo day invitations.",
    },
  ];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail && /^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors selection:bg-amber-500/20 selection:text-amber-800 dark:selection:text-amber-200">
      {/* ================= STICKY NAVBAR ================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="RealBell Foundation Logo"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain shadow-md shadow-amber-700/20 group-hover:scale-105 transition-transform bg-white p-1 border border-slate-200 dark:border-slate-700"
            />
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                REAL<span className="text-amber-700 dark:text-amber-500">BELL</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md">
                  Foundation
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Empowering India's Entrepreneurs
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#ecosystem" className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              Ecosystem
            </a>
            <a href="#services" className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              Programs & Services
            </a>
            <a href="#how-it-works" className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              How It Works
            </a>
            <a href="#demo-days" className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              Cohorts & Events
            </a>
            <a href="#faq" className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3.5">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-sm font-bold text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Join RBF</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-6 shadow-xl"
            >
              <div className="flex flex-col gap-4 font-semibold text-slate-700 dark:text-slate-200">
                <a
                  href="#ecosystem"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  Ecosystem
                </a>
                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  Programs & Services
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  How It Works
                </a>
                <a
                  href="#demo-days"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  Cohorts & Events
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  FAQ
                </a>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 text-center"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/signup");
                    }}
                    className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-sm font-bold text-white text-center shadow-md"
                  >
                    Join RBF Ecosystem
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(180,83,9,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(180,83,9,0.22),rgba(15,23,42,0))] pointer-events-none" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="lg:col-span-7 text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-600/30 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-300 shadow-xs mb-6 sm:mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping" />
                  <span>Empowering 500+ Ventures & Founders Across India</span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]"
              >
                Where Startups Scale &amp;{" "}
                <span className="bg-linear-to-r from-amber-700 via-amber-600 to-amber-800 dark:from-amber-400 dark:via-amber-300 dark:to-yellow-500 bg-clip-text text-transparent">
                  Visions Turn Real.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                RealBell Business Foundation is India's dedicated startup ecosystem uniting founders, angel investors, industry mentors, and accelerators with cohort funding, strategic incubation, and verified growth resources.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                custom={3}
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-amber-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Rocket size={18} />
                  <span>Join the Foundation</span>
                  <ArrowRight size={18} />
                </button>

                <a
                  href="#ecosystem"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 py-4 text-base font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                >
                  <span>Explore Programs</span>
                  <ChevronDown size={18} />
                </a>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                variants={fadeInUp}
                custom={4}
                className="mt-10 sm:mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  <span>Vetted Stakeholders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  <span>₹0 Equity Dilution to Browse</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  <span>Pan-India Presence</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Interactive Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              {/* Card Container */}
              <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-linear-to-b from-white via-slate-50 to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 shadow-2xl overflow-hidden">
                {/* Floating Metric 1 */}
                <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
                  <Sparkles size={12} />
                  <span>Cohort 2026 Live</span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <img
                    src="/logo.png"
                    alt="RealBell Logo"
                    className="h-14 w-14 rounded-2xl object-contain bg-white p-1.5 border border-slate-200 dark:border-slate-700 shadow-md"
                  />
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
                      RBF Ecosystem Engine
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time venture orchestration
                    </p>
                  </div>
                </div>

                {/* Simulated Platform Highlights */}
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Capital Catalyzed</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Pre-seed to Series A</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-amber-700 dark:text-amber-400">₹45+ Cr</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400">
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Active Mentors &amp; CXOs</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Domain-vetted leaders</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-blue-700 dark:text-blue-400">150+ Mentors</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Match Success Rate</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Founder-to-Investor</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">98.4%</div>
                  </div>
                </div>

                {/* Mini CTA inside card */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Ready to accelerate?
                  </div>
                  <button
                    onClick={() => navigate("/signup")}
                    className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Get Started Free</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-4 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-700 dark:text-amber-400">
                  {stat.number}
                </div>
                <div className="mt-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {stat.title}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stat.subtitle}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE PERSONA PILLARS ================= */}
      <section id="ecosystem" className="py-20 sm:py-28 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Stakeholder Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
              Built for Every Pillar of the Startup Economy
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Whether you are coding your MVP, backing early-stage rounds, or accelerating cohorts, RealBell Business Foundation provides customized tools.
            </p>
          </div>

          {/* Persona Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
            {Object.values(personas).map((persona) => {
              const Icon = persona.icon;
              const isActive = activePersona === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => setActivePersona(persona.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-700 text-white shadow-md shadow-amber-700/25 scale-105"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Icon size={16} />
                  <span>{persona.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Active Persona Spotlight Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePersona}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-12 shadow-xl"
            >
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-400 mb-4">
                    {personas[activePersona].badge}
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {personas[activePersona].title}
                  </h3>
                  <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    {personas[activePersona].tagline}
                  </p>

                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    {personas[activePersona].points.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 mt-0.5">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                          {pt}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <button
                      onClick={() => navigate(personas[activePersona].route)}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <span>{personas[activePersona].cta}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-700/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 mb-6">
                    {React.createElement(personas[activePersona].icon, { size: 36 })}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    Verified RBF Membership
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    All participants undergo structured onboarding and identity verification to ensure genuine collaborations and safe deal rooms.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                    <span>Open for Registration Across India</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ================= CORE SERVICES & PROGRAMS ================= */}
      <section id="services" className="py-20 sm:py-28 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Foundation Offerings
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
              Comprehensive Support from Day Zero to Scale
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Everything required to launch, govern, fund, and scale a modern business venture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((srv, i) => {
              const Icon = srv.icon;
              return (
                <motion.div
                  key={srv.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs hover:shadow-xl hover:border-amber-700/50 dark:hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                        <Icon size={26} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {srv.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => navigate("/signup")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:underline cursor-pointer"
                    >
                      <span>Explore Offering</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ROADMAP ================= */}
      <section id="how-it-works" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              The RBF Growth Cycle
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
              How RealBell Accelerates Your Journey
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              A structured 4-step framework engineered for high momentum and transparent execution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
            {roadmap.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl font-black text-amber-700/20 dark:text-amber-500/20 font-mono mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= UPCOMING COHORTS & DEMO DAYS ================= */}
      <section id="demo-days" className="py-20 sm:py-28 bg-stone-50 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
            <div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Cohorts &amp; Live Events
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
                Active Cohort Tracks &amp; Pitch Days
              </h2>
            </div>
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <span>View All Foundation Events</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {upcomingPrograms.map((prog, i) => (
              <motion.div
                key={prog.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-400">
                      {prog.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {prog.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {prog.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <Calendar size={14} />
                    <span>{prog.date}</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {prog.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-amber-700 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    Apply for Cohort
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Community Voices
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
              Trusted by Founders, Backers &amp; Mentors
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Hear directly from founders who raised, scaled, and built strong foundations with RBF.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 text-amber-500 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {t.author}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t.role}, {t.company}
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    {t.stage}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE FAQ ACCORDION ================= */}
      <section id="faq" className="py-20 sm:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Clarifications
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about joining and collaborating within the RealBell Foundation.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <ChevronDown
                      size={20}
                      className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-amber-700 dark:text-amber-400" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-6 pb-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HIGH-CONVERSION CTA BANNER ================= */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[36px] overflow-hidden bg-linear-to-r from-amber-900 via-amber-800 to-stone-900 p-8 sm:p-14 lg:p-20 text-center text-white shadow-2xl">
            {/* Background Decorative Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-200 border border-white/15 mb-6">
                <Sparkles size={14} />
                <span>Open Beta Preview • Join the Community</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Ready to Build Your Venture's Foundation?
              </h2>

              <p className="mt-6 text-base sm:text-lg text-amber-100/90 leading-relaxed">
                Connect with vetted founders, angel syndicates, CXO mentors, and regional incubation programs today. Experience the power of collaborative growth.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 hover:bg-amber-50 px-8 py-4 text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>Register Free with RBF</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 hover:bg-white/10 px-8 py-4 text-base font-bold text-white transition-all cursor-pointer"
                >
                  <span>Member Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPREHENSIVE FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Brand column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="RealBell Logo"
                  className="h-11 w-11 rounded-xl object-contain bg-white p-1 border border-slate-700 shadow-md"
                />
                <div>
                  <div className="text-lg font-black tracking-tight text-white">
                    REAL<span className="text-amber-500">BELL</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Business Foundation
                  </div>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                Empowering India's next generation of entrepreneurial leaders through structured incubation, capital connections, strategic mentorship, and milestone accountability.
              </p>

              <div className="pt-2 text-xs text-slate-500">
                Registered non-profit &amp; ecosystem entity based in Jaipur, Rajasthan, serving founders pan-India.
              </div>
            </div>

            {/* Ecosystem Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Ecosystem
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Startups
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Angel Investors
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Mentors &amp; CXOs
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-amber-400 transition-colors">
                    For Accelerators
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Member Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Legal Contract Vault
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Startup Glossary
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Market Reports
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Masterclass Videos
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-amber-400 transition-colors">
                    Milestone Tracker
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter & Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Stay Updated
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Receive cohort announcements and angel pitch notifications.
              </p>

              {newsletterSubscribed ? (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Subscribed to RBF Dispatch!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="founder@venture.com"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Subscribe to Dispatch
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} RealBell Business Foundation. All Rights Reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-400 transition-colors">
                Terms of Foundation
              </a>
              <a href="#" className="hover:text-slate-400 transition-colors">
                Code of Conduct
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
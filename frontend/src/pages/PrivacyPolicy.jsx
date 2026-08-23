import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "../services/axios";
import {
  Shield,
  ArrowLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Lock,
  FileText,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../context/ThemeProvider";
import { useStore } from "../zustand/store";
import { DEFAULT_PAGE_FALLBACKS } from "../config/pageFallbacks";

const FALLBACK_DATA = {
  pageTitle: "Privacy Policy",
  subtitle: "How RealBell Business Foundation collects, uses, and safeguards your data.",
  lastUpdated: "June 2026",
  introduction:
    "At RealBell Business Foundation (\"RBF\", \"we\", \"our\", or \"us\"), we respect your privacy and are committed to protecting the personal and proprietary information you share with our ecosystem platform.",
  sections: [
    {
      id: "collection",
      heading: "1. Information We Collect",
      content:
        "We collect information you provide directly during registration, profile enrichment, program applications, and compliance filings:\n\n• **Account Identifiers**: Name, official email address, phone number, and encrypted authentication tokens.\n• **Venture Data**: Startup registration number (DPIIT/CIN), pitch decks, financials, cap tables, and founder biographies.\n• **Investor Data**: Accreditation status, investment thesis, cheque size ranges, and syndicate affiliations.\n• **Technical & Usage Logs**: IP addresses, browser fingerprint, session activity, and interaction timestamps.",
    },
    {
      id: "use",
      heading: "2. How We Use Your Information",
      content:
        "We use the information collected exclusively to deliver ecosystem services:\n\n• Facilitating matchmaking between startups, investors, and verified mentors.\n• Processing cohort applications, demo day submissions, and workshop registrations.\n• Verifying organizational identity and preventing fraudulent listings.\n• Delivering essential system alerts, security advisories, and administrative notices.",
    },
    {
      id: "sharing",
      heading: "3. Information Sharing & Third Parties",
      content:
        "We do not sell, rent, or monetize your personal or proprietary information. Information is shared strictly under the following circumstances:\n\n• **Authorized Stakeholders**: Pitch materials and profiles are visible to verified investors and mentors according to your privacy settings.\n• **Legal & Regulatory Authorities**: When mandated by Indian laws, court orders, or Section 8 compliance audits.\n• **Trusted Service Providers**: Cloud hosting (AWS), transactional email systems (SMTP/SendGrid), and payment gateways under strict Non-Disclosure Agreements.",
    },
    {
      id: "security",
      heading: "4. Data Security & Storage",
      content:
        "We implement industry-standard administrative, technical, and physical safeguards:\n\n• All communication is encrypted via TLS 1.3 in transit and AES-256 at rest.\n• Role-Based Access Control (RBAC) restricts internal employee access on a least-privilege basis.\n• Regular automated security scans and vulnerability audits.",
    },
    {
      id: "rights",
      heading: "5. Your Rights & Data Portability",
      content:
        "Under applicable data protection guidelines, you hold the right to:\n\n• Access and request a complete export of your personal profile data.\n• Request correction of outdated or inaccurate venture details.\n• Request deletion or anonymization of your account upon exiting the foundation.\n\nTo exercise these rights, submit a support ticket or contact our Data Privacy Officer.",
    },
    {
      id: "contact",
      heading: "6. Contact Our Privacy Team",
      content:
        "If you have questions, grievances, or feedback regarding our privacy practices, please contact us:\n\n**Email**: privacy@realbell.org\n**Postal Address**: RealBell Business Foundation, Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India.",
    },
  ],
};

export default function PrivacyPolicy() {
  const storeData = useStore((state) => state.pageContents?.["privacy-policy"]);
  const [data, setData] = useState(storeData || DEFAULT_PAGE_FALLBACKS["privacy-policy"] || FALLBACK_DATA);
  const [activeSection, setActiveSection] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (storeData) {
      setData(storeData);
    }
  }, [storeData]);

  const sections = data.sections || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="RealBell Logo"
              className="h-9 w-9 rounded-xl object-contain shadow-md shadow-amber-700/20 bg-white p-1 border border-slate-700 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">
                REAL<span className="text-amber-500">BELL</span>
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Business Foundation
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition shadow-md shadow-amber-900/30"
            >
              Join Platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5" />
            Legal & Data Governance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {data.pageTitle || "Privacy Policy"}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-2xl leading-relaxed">
            {data.subtitle}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Last Updated: {data.lastUpdated || "June 2026"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Table of Contents Sidebar */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-24 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Table of Contents
              </div>
              <nav className="space-y-1">
                {sections.map((sec, idx) => (
                  <a
                    key={idx}
                    href={`#section-${idx}`}
                    onClick={() => setActiveSection(`section-${idx}`)}
                    className={`block px-3 py-2 rounded-xl text-xs transition truncate ${
                      activeSection === `section-${idx}`
                        ? "bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    {sec.heading}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Related Governance
                </div>
                <Link
                  to="/terms-of-service"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Terms of Service
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
                <Link
                  to="/code-of-conduct"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                    Code of Conduct
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Reading Document View */}
          <main className="lg:col-span-8 order-1 lg:order-2 space-y-8">
            {/* Introduction Box */}
            {data.introduction && (
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-sm leading-relaxed text-slate-300 font-normal">
                {data.introduction}
              </div>
            )}

            {/* Render Clauses */}
            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  id={`section-${idx}`}
                  className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/70 hover:border-slate-700/70 transition space-y-4"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                      {idx + 1}
                    </span>
                    {sec.heading}
                  </h2>
                  <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line space-y-2">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Contact Footer Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white">Have Privacy Concerns?</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Our Data Protection Officer responds to inquiries within 48 business hours.
                </div>
              </div>
              <a
                href="mailto:privacy@realbell.org"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition shadow-md shadow-amber-900/20 whitespace-nowrap"
              >
                Email Privacy Team
              </a>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-xs text-slate-500 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} RealBell Business Foundation. All Rights Reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-slate-400 hover:text-white transition">Terms of Service</Link>
            <Link to="/code-of-conduct" className="text-slate-400 hover:text-white transition">Code of Conduct</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

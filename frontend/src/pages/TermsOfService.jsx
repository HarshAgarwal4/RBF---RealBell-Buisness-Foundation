import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../services/axios";
import { useStore } from "../zustand/store";
import { DEFAULT_PAGE_FALLBACKS } from "../config/pageFallbacks";
import {
  FileText,
  ArrowLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  Shield,
  HeartHandshake,
} from "lucide-react";

const FALLBACK_DATA = {
  pageTitle: "Terms of Service & Foundation Governance",
  subtitle: "The rules and legal covenants governing access to the RealBell Ecosystem.",
  lastUpdated: "June 2026",
  introduction:
    "Welcome to RealBell Business Foundation. By registering an account, accessing our dashboard, participating in cohorts, or utilizing our compliance tools, you agree to be bound by these Terms of Service.",
  sections: [
    {
      id: "eligibility",
      heading: "1. Eligibility & Registration",
      content:
        "To use the RealBell platform, you must be at least 18 years of age and hold the legal authority to bind the entity (startup, fund, or institution) you represent.\n\nYou agree to provide accurate, truthful, and up-to-date information during onboarding and maintain the security of your authentication credentials.",
    },
    {
      id: "platform-purpose",
      heading: "2. Platform Purpose & Non-Brokerage Disclaimer",
      content:
        "RealBell Business Foundation operates as a Section 8 non-profit ecosystem facilitator. RBF is not a registered stock exchange, broker-dealer, or investment advisor under SEBI regulations.\n\nAll investment interactions, pitch discussions, and funding syndications are conducted directly between participating parties at their independent discretion. RBF does not guarantee investment outcomes or endorse specific ventures.",
    },
    {
      id: "acceptable-use",
      heading: "3. Acceptable Use & Conduct",
      content:
        "When using our platform and community forums, you agree that you will not:\n\n• Upload fraudulent, misleading, or plagiarized pitch materials.\n• Harass, defame, spam, or solicit members for unauthorized commercial schemes.\n• Attempt to reverse engineer, scrape, or disrupt platform infrastructure.\n• Circumvent Role-Based Access Controls or access unauthorized private deal rooms.",
    },
    {
      id: "intellectual-property",
      heading: "4. Intellectual Property & Confidentiality",
      content:
        "Founders retain 100% ownership of their pre-existing intellectual property, inventions, source code, and business plans.\n\nBy uploading materials marked as public, you grant RBF a non-exclusive license to display them to registered members. Materials designated as confidential in private deal rooms are protected under standard platform NDA covenants.",
    },
    {
      id: "termination",
      heading: "5. Suspension & Account Termination",
      content:
        "RBF reserves the right to suspend or terminate accounts that violate our Code of Conduct, fail identity verification, or engage in malicious activity without prior liability.",
    },
    {
      id: "disputes",
      heading: "6. Governing Law & Dispute Resolution",
      content:
        "These terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.",
    },
  ],
};

export default function TermsOfService() {
  const storeData = useStore((state) => state.pageContents?.["terms-of-service"]);
  const [data, setData] = useState(storeData || DEFAULT_PAGE_FALLBACKS["terms-of-service"] || FALLBACK_DATA);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (storeData) {
      setData(storeData);
    }
  }, [storeData]);

  const sections = data.sections || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 font-sans">
      {/* Header Navigation */}
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
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <FileText className="w-3.5 h-3.5" />
            Terms & Governance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {data.pageTitle || "Terms of Service"}
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
          {/* Sidebar */}
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
                  to="/privacy-policy"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Privacy Policy
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
            {data.introduction && (
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-sm leading-relaxed text-slate-300 font-normal">
                {data.introduction}
              </div>
            )}

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

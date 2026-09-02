import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake,
  ArrowLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  Shield,
  FileText,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeProvider";
import { useStore } from "../zustand/store";
import { DEFAULT_PAGE_FALLBACKS } from "../config/pageFallbacks";

const FALLBACK_DATA = {
  pageTitle: "Community Code of Conduct",
  subtitle: "Fostering an inclusive, honest, and high-trust ecosystem for all innovators.",
  lastUpdated: "June 2026",
  introduction:
    "RealBell Business Foundation is dedicated to providing a safe, ethical, and collaborative environment for founders, investors, students, and mentors regardless of background, gender, identity, or stage of growth. We expect all community members to uphold the highest standards of professional integrity.",
  sections: [
    {
      id: "our-pledge",
      heading: "1. Our Core Values",
      content:
        "• **Mutual Respect**: Treat every peer, founder, and mentor with dignity and constructive empathy.\n• **Intellectual Honesty**: Represent your traction, financials, and cap tables truthfully.\n• **Inclusivity & Equity**: Champion equal opportunity for underrepresented founders across tier-2/3 regions.\n• **Constructive Collaboration**: Share knowledge freely and celebrate the milestones of fellow ecosystem members.",
    },
    {
      id: "unacceptable-behavior",
      heading: "2. Unacceptable Behaviors",
      content:
        "The following behaviors are strictly prohibited across all virtual and in-person RBF channels:\n\n• Harassment, hate speech, discriminatory jokes, or offensive commentary.\n• Unsolicited spamming of pitch decks in public chat threads or direct messaging.\n• Plagiarizing code, research, or business models from other cohort participants.\n• Predatory deal terms or exploitative advisory equity demands.",
    },
    {
      id: "reporting",
      heading: "3. Reporting & Incident Resolution",
      content:
        "If you experience or witness behavior that violates this Code of Conduct, please report it immediately through our Support Tickets module or email ethics@realbell.org.\n\nAll reports are handled with strict confidentiality by our Ethics Review Board.",
    },
    {
      id: "enforcement",
      heading: "4. Enforcement Ladder",
      content:
        "Violations may lead to progressive enforcement actions:\n\n1. **Formal Warning**: Private notification outlining the violation and expected corrective action.\n2. **Temporary Mute/Suspension**: Temporary removal from community chats, event participation, and deal rooms.\n3. **Permanent Expulsion**: Immediate termination of platform access, removal from active cohorts, and revocation of foundation credentials.",
    },
  ],
};

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={17} className="text-amber-400" />
      ) : (
        <Moon size={17} className="text-blue-600" />
      )}
    </button>
  );
}

export default function CodeOfConduct() {
  const storeData = useStore((state) => state.pageContents?.["code-of-conduct"]);
  const [data, setData] = useState(storeData || DEFAULT_PAGE_FALLBACKS["code-of-conduct"] || FALLBACK_DATA);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Community Code of Conduct | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Read the official Community Code of Conduct for RealBell Business Foundation (RBF). Our commitment to ethical standards and mutual respect."
    );
    if (storeData) {
      setData(storeData);
    }
  }, [storeData]);

  const sections = data.sections || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-800 dark:text-slate-100 selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-300 font-sans transition-colors">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070B14]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="RealBell Logo"
              className="h-9 w-9 rounded-xl object-contain shadow-md shadow-blue-600/10 bg-white p-1 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                REAL<span className="text-blue-600 dark:text-blue-400">BELL</span>
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Business Foundation
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <ThemeToggleButton />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition shadow-md shadow-blue-600/20"
            >
              Join Platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-[#070B14] py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <HeartHandshake className="w-3.5 h-3.5" />
            Ecosystem Culture & Trust
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {data.pageTitle || "Community Code of Conduct"}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3 max-w-2xl leading-relaxed">
            {data.subtitle}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Last Updated: {data.lastUpdated || "June 2026"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-24 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md space-y-4">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/60"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {sec.heading}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Related Governance
                </div>
                <Link
                  to="/privacy-policy"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Privacy Policy
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                </Link>
                <Link
                  to="/terms-of-service"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Terms of Service
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Reading Document View */}
          <main className="lg:col-span-8 order-1 lg:order-2 space-y-8">
            {data.introduction && (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 shadow-sm text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                {data.introduction}
              </div>
            )}

            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  id={`section-${idx}`}
                  className="scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/70 hover:border-blue-300 dark:hover:border-slate-700 shadow-sm transition space-y-4"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/60">
                      {idx + 1}
                    </span>
                    {sec.heading}
                  </h2>
                  <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line space-y-2">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Reporting Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-slate-100 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 border border-blue-200 dark:border-blue-900/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Witnessed a Violation?</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Report incidents directly to our confidential Ethics Review Board.
                </div>
              </div>
              <a
                href="mailto:ethics@realbell.org"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-md shadow-blue-600/20 whitespace-nowrap"
              >
                Report to Ethics Board
              </a>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-8 bg-white dark:bg-[#070B14] text-xs text-slate-500 dark:text-slate-500 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} RealBell Business Foundation. All Rights Reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition">Terms of Service</Link>
            <Link to="/code-of-conduct" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition">Code of Conduct</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AdminLayout from "./admin/AdminLayout";
import { useStore } from "../zustand/store";
import {
  Home,
  ArrowLeft,
  Search,
  Compass,
  Rocket,
  Users,
  Radio,
  Ticket,
  LayoutDashboard,
  LogIn,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function PageNotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((s) => s.user);

  const isLoggedIn = Boolean(user && user._id);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = Boolean(
    user && (user.role === "admin" || user.role === "super_admin" || Boolean(user.team))
  );

  useEffect(() => {
    document.title = "404 Page Not Found | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "The requested page could not be found on RealBell Business Foundation. Return to the homepage or explore available startup programs."
    );
  }, []);

  const popularShortcuts = [
    {
      title: "Startup Programs",
      desc: "Explore active incubation cohorts & grant programs",
      icon: Rocket,
      path: "/programs",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Community Wall",
      desc: "Discover announcements, founder pitch decks & updates",
      icon: Users,
      path: "/community",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Live Sessions & Events",
      desc: "Join ecosystem workshops and scheduled roundtables",
      icon: Radio,
      path: "/live_sessions",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Support Helpdesk",
      desc: "Raise a support ticket or request technical assistance",
      icon: Ticket,
      path: "/tickets",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: Admin Route 404 (Admin is logged in & within /admin/* path)
  // ══════════════════════════════════════════════════════════════════════════════
  if (isAdminRoute && isLoggedIn && isAdminUser) {
    return (
      <AdminLayout title="404 - Page Not Found">
        <div className="flex items-center justify-center min-h-[75vh] px-4 py-8">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#111624]/90 border border-slate-800/90 p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-6">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Admin Console Error 404</span>
            </div>

            {/* Big 404 Art */}
            <div className="flex items-center justify-center gap-3 text-7xl sm:text-8xl font-black text-slate-100 tracking-tighter mb-4 select-none">
              <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">4</span>
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-500/30 rotate-12 transition transform hover:rotate-0 duration-300">
                <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>
              <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">4</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
              Admin Module Not Found
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
              The administrative endpoint{" "}
              <code className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-rose-300 font-mono text-xs">
                {location.pathname}
              </code>{" "}
              does not match any registered console views or permissions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B1D2C] to-[#B52B43] hover:from-[#721724] hover:to-[#96263F] text-white px-6 py-2.5 text-xs font-bold transition shadow-lg shadow-rose-950/40 active:scale-95 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 px-5 py-2.5 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Users Hub</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 px-5 py-2.5 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Page</span>
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: Logged-in User on User App Route (Docked to Sidebar)
  // ══════════════════════════════════════════════════════════════════════════════
  if (isLoggedIn && !isAdminRoute) {
    return (
      <>
        <Sidebar />
        <div className="ml-0 lg:ml-75 pt-20 lg:pt-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 sm:p-8 font-sans antialiased text-gray-800 dark:text-slate-200">
          <div className="max-w-[1100px] mx-auto space-y-8">

            {/* Main Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-8 sm:p-12 shadow-xl shadow-gray-200/50 dark:shadow-none text-center">
              {/* Background ambient orbs */}
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#8B1D2C]/10 dark:bg-[#8B1D2C]/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8B1D2C]/10 text-[#8B1D2C] dark:text-[#f87171] border border-[#8B1D2C]/20 dark:border-[#8B1D2C]/40 mb-6">
                <Compass className="w-3.5 h-3.5 animate-spin text-[#8B1D2C] dark:text-[#f87171]" style={{ animationDuration: "12s" }} />
                <span>Lost in the Ecosystem?</span>
              </div>

              {/* Stylized 404 Headline */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-7xl sm:text-9xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 select-none">
                <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  4
                </span>
                <div className="flex h-18 w-18 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#8B1D2C] via-[#9e2132] to-[#B52B43] text-white shadow-xl shadow-[#8B1D2C]/30 rotate-6 transition-transform hover:rotate-0 duration-300">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300" />
                </div>
                <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  4
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight mb-2">
                Page Not Found
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                The requested URL{" "}
                <code className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[#8B1D2C] dark:text-rose-300 font-mono text-xs">
                  {location.pathname}
                </code>{" "}
                does not exist or has been relocated within the platform.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white px-6 py-2.5 text-xs sm:text-sm font-bold transition shadow-md shadow-[#8B1D2C]/20 active:scale-95 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#151D2E] hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 px-5 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Homepage</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#151D2E] hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 px-5 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Page</span>
                </button>
              </div>
            </div>

            {/* Popular Ecosystem Destinations Shortcut Grid */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                    Explore Popular Ecosystem Hubs
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Jump straight to active services and community workspaces
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {popularShortcuts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(item.path)}
                      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#8B1D2C]/40 hover:shadow-lg dark:hover:border-rose-500/30 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border mb-3.5 transition-transform group-hover:scale-110 ${item.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover:text-[#8B1D2C] dark:group-hover:text-rose-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#8B1D2C] dark:text-rose-400">
                        <span>Visit</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: Public / Unauthenticated User (Standalone Clean Center Canvas, NO SIDEBAR)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between bg-[#F8FAFC] dark:bg-[#0B0F19] px-4 py-8 font-sans antialiased text-gray-800 dark:text-slate-200 overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#8B1D2C]/10 via-[#8B1D2C]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="RealBell"
            className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="leading-tight">
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: 0.2,
              }}
              className="text-gray-900 dark:text-white"
            >
              REAL<span className="text-[#8B1D2C]">BELL</span>
            </span>
            <span className="block text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              Business Foundation
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-[#151D2E]/80 backdrop-blur-xs px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition active:scale-95 shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            to="/signup"
            className="hidden sm:inline-flex rounded-xl bg-[#8B1D2C] hover:bg-[#721724] px-4 py-2 text-xs font-bold text-white transition active:scale-95 shadow-xs shadow-[#8B1D2C]/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Center 404 Hero Showcase */}
      <main className="relative z-10 w-full max-w-3xl my-auto py-8">
        <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-[#151D2E]/90 border border-gray-200/80 dark:border-slate-800/80 p-8 sm:p-14 shadow-2xl backdrop-blur-xl text-center">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8B1D2C]/10 text-[#8B1D2C] dark:text-[#f87171] border border-[#8B1D2C]/20 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#8B1D2C] animate-ping" />
            <span>404: Route Unavailable</span>
          </div>

          {/* 404 Large Art */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-7xl sm:text-9xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 select-none">
            <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              4
            </span>
            <div className="flex h-18 w-18 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#8B1D2C] via-[#9e2132] to-[#B52B43] text-white shadow-xl shadow-[#8B1D2C]/30 rotate-6 transition-transform hover:rotate-0 duration-300">
              <Compass className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              4
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight mb-3">
            Looking for something on RealBell?
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
            The page you requested <code className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[#8B1D2C] dark:text-rose-300 font-mono text-xs">{location.pathname}</code> does not exist, has expired, or requires an active ecosystem session.
          </p>

          {/* Action Button cluster */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white px-7 py-3 text-xs sm:text-sm font-bold transition shadow-lg shadow-[#8B1D2C]/25 active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#151D2E] hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-6 py-3 text-xs sm:text-sm font-bold transition active:scale-95 shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Account</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-[#151D2E] hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 px-5 py-3 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 w-full max-w-5xl text-center text-xs text-gray-400 dark:text-slate-500 py-2">
        <p>
          © {new Date().getFullYear()} RealBell Business Foundation (RBF). Empowering India's Startup Ecosystem.
        </p>
      </footer>
    </div>
  );
}

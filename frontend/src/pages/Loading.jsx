import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles, Lock, Cpu, Globe } from "lucide-react";

const STATUS_MESSAGES = [
  "Synchronizing security protocols...",
  "Loading platform configuration...",
  "Connecting to RealBell Ecosystem...",
  "Preparing your workspace...",
];

export function AppLoader({
  fullscreen = true,
  message = "Loading RealBell Ecosystem...",
  subtext,
}) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const currentSubtext = subtext || STATUS_MESSAGES[statusIndex];

  return (
    <div
      className={`${
        fullscreen ? "fixed inset-0 z-9999" : "w-full py-16"
      } flex flex-col items-center justify-center bg-stone-50/95 dark:bg-slate-950/95 backdrop-blur-2xl text-slate-900 dark:text-white px-4 transition-colors overflow-hidden select-none`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/15 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 shadow-2xl shadow-amber-950/5 dark:shadow-black/40 backdrop-blur-xl"
      >
        {/* Animated Central Emblem */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer Rotating Segmented Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 sm:-inset-5 rounded-full border-2 border-dashed border-amber-600/30 dark:border-amber-400/30"
          />

          {/* Glowing Gradient Pulse Ring */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-2.5 rounded-full bg-linear-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 blur-md"
          />

          {/* Logo Center Container */}
          <div className="relative h-20 w-20 sm:h-22 sm:w-22 rounded-2xl p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-amber-600/10 flex items-center justify-center group">
            <img
              src="/logo.png"
              alt="RealBell Logo"
              className="h-full w-full object-contain drop-shadow-md animate-pulse"
            />
          </div>

          {/* Floating Micro Icon Badge */}
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white shadow-md shadow-amber-600/30 border-2 border-white dark:border-slate-900"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.div>
        </div>

        {/* Brand Title */}
        <div className="text-center space-y-1">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            REAL<span className="text-amber-700 dark:text-amber-500">BELL</span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Business Foundation
          </div>
        </div>

        {/* Loading Message & Cycling Status */}
        <div className="mt-6 text-center w-full space-y-2">
          <div className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100">
            {message}
          </div>

          <div className="h-5 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentSubtext}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs"
              >
                {currentSubtext}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Animated Shimmering Progress Bar */}
        <div className="mt-6 w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden relative">
          <motion.div
            initial={{ left: "-40%" }}
            animate={{ left: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
            className="absolute top-0 bottom-0 w-2/5 bg-linear-to-r from-transparent via-amber-700 dark:via-amber-500 to-transparent rounded-full"
          />
        </div>

        {/* Security & Verification Badges */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Session</span>
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>RBF Network</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

const FullScreenLoader = (props) => {
  return <AppLoader fullscreen={true} {...props} />;
};

export default FullScreenLoader;
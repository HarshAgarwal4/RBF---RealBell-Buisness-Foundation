import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone/installed mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    // Check if user dismissed prompt in this session
    const isSessionDismissed = sessionStorage.getItem("pwa_prompt_dismissed");
    if (isSessionDismissed === "true") {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback instructions if native prompt isn't directly triggered by browser
      alert(
        "To install RealBell App:\n\n1. Tap the Share or Menu icon in your browser (⋮ / ⎋).\n2. Tap 'Add to Home Screen' or 'Install App'."
      );
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (isStandalone || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
      style={{
        boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
      }}
    >
      <div className="flex items-start gap-3 relative">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#8E1B2E]/10 p-2 flex items-center justify-center shrink-0 border border-[#8E1B2E]/20">
          <img src="/logo.png" alt="RealBell Logo" className="w-full h-full object-contain" />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-sm font-extrabold text-gray-900 leading-tight">
            Install RealBell App
          </h4>
          <p className="text-xs text-gray-600 mt-1 leading-snug">
            Download our app to your home screen for quick & fast access.
          </p>

          <button
            type="button"
            onClick={handleInstallClick}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-[#8E1B2E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-[#6c1423] transition cursor-pointer"
          >
            <Download size={14} /> Install App Automatically
          </button>
        </div>

        {/* Fixed Cross Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          title="Close"
          aria-label="Dismiss app install prompt"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

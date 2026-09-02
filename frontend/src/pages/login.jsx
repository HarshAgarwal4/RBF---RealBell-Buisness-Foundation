import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  KeyRound,
  Layers,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../zustand/store";
import { useTheme } from "../context/ThemeProvider";
import { DEFAULT_PAGE_FALLBACKS } from "../config/pageFallbacks";

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-3 group">
      <img
        src="/logo.png"
        alt="RealBell Logo"
        className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain shadow-md shadow-blue-600/10 group-hover:scale-105 transition-transform bg-white p-1 border border-slate-200 dark:border-slate-700"
      />

      <div>
        <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          REAL<span className="text-blue-600 dark:text-blue-400">BELL</span>
        </div>

        <div className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Business Foundation
        </div>
      </div>
    </Link>
  );
}

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

function LeftPanel({ customData }) {
  const badge = customData?.leftPanelBadge || "Welcome to RBF Ecosystem";
  const mainTitle = customData?.mainTitle || "Welcome Back.";
  const titleHighlight = customData?.titleHighlight || "Let's Continue";
  const titleSuffix = customData?.titleSuffix || "Building.";
  const description =
    customData?.description ||
    "Log in to RealBell Business Foundation to access your dashboard, discover funding cohorts, connect with seasoned mentors, and scale your venture.";
  const features = customData?.features || [
    { text: "Direct access to founders & accredited investors" },
    { text: "Curated incubator programs & startup cohorts" },
    { text: "Verified contracts, guides & milestone tracking" },
  ];
  const footerNote = customData?.footerNote || "RealBell Foundation";
  const statusText = customData?.platformStatusText || "Platform Active";

  return (
    <div className="hidden lg:flex w-full max-w-md xl:max-w-lg flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-10 xl:p-12 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Logo />

        <div className="mt-12 xl:mt-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black leading-tight text-slate-900 dark:text-white">
            {mainTitle}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:to-indigo-400">
              {titleHighlight}
            </span>{" "}
            {titleSuffix}
          </h1>

          <p className="mt-5 text-sm xl:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="mt-8 space-y-3.5">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>© {new Date().getFullYear()} {footerNote}</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {statusText}
        </span>
      </div>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-4 lg:hidden">
      <Logo />
      <div className="flex items-center gap-3">
        <ThemeToggleButton />
        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>Home</span>
        </Link>
        <Link
          to="/signup"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

function TopBar({ step, back }) {
  return (
    <div className="flex items-center justify-between gap-4">
      {step === 2 ? (
        <button
          onClick={back}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      ) : (
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
      )}

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden lg:block">
          <ThemeToggleButton />
        </div>

        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2 decoration-blue-600/40"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Member Login | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Log in to RealBell Business Foundation (RBF) to access your startup dashboard, deal flow, mentorship schedules, and legal compliance tools."
    );
  }, []);

  const fetchUser = useStore((state) => state.fetchUser);
  const user = useStore((state) => state.user);
  const sendOtp = useStore((state) => state.sendOtp);
  const loginMethod = useStore((state) => state.loginMethod || "both");

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const storeLoginData = useStore((state) => state.pageContents?.login);
  const [customData, setCustomData] = useState(storeLoginData || DEFAULT_PAGE_FALLBACKS.login);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (storeLoginData) {
      setCustomData(storeLoginData);
    }
  }, [storeLoginData]);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, timer]);

  const handleStep1Submit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // If method is password only, log in directly
    if (loginMethod === "password") {
      if (!password || !password.trim()) {
        setError("Password is required");
        return;
      }

      setLoading(true);
      try {
        const res = await axios.post("/login", {
          email: email.trim(),
          password: password.trim(),
        });

        const { status, msg } = res.data;

        if (status === 1) {
          toast.success(msg || "Login successful");
          const loggedInUser = await fetchUser();
          if (
            loggedInUser &&
            loggedInUser.role !== "super_admin" &&
            loggedInUser.role !== "admin" &&
            loggedInUser.approvalStatus !== "Approved"
          ) {
            navigate("/approval-center");
          } else {
            navigate("/dashboard");
          }
          return;
        }

        if (status === 2) {
          setError(msg || "Incorrect password");
          return;
        }

        if (status === 9) {
          setError(msg || "No account found with this email");
          return;
        }

        if (status === 12) {
          toast.error(msg || "Password not set for this account.");
          return;
        }

        toast.error(msg || "Failed to log in");
      } catch {
        toast.error("Server error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // If method is 'both', verify password & dispatch OTP
    if (loginMethod === "both") {
      if (!password || !password.trim()) {
        setError("Password is required");
        return;
      }

      setLoading(true);
      try {
        const res = await axios.post("/sendotp", {
          email: email.trim(),
          password: password.trim(),
        });

        const { status, msg } = res.data;

        if (status === 1) {
          toast.success("Password verified! OTP code sent to your email.");
          setOtp(Array(6).fill(""));
          setOtpError("");
          setTimer(30);
          setStep(2);
          return;
        }

        if (status === 2) {
          setError(msg || "Incorrect password");
          return;
        }

        if (status === 9) {
          setError(msg || "No registered account found with this email");
          return;
        }

        if (status === 12) {
          toast.error(msg || "Password not set for this account.");
          return;
        }

        toast.error(msg || "Failed to send verification code");
      } catch {
        toast.error("Server error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // If method is 'otp', dispatch OTP
    setLoading(true);
    try {
      await sendOtp(email.trim());
      setOtp(Array(6).fill(""));
      setOtpError("");
      setTimer(30);
      setStep(2);
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setOtpError("");

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  const resendOTP = async () => {
    if (timer > 0) return;
    setOtp(Array(6).fill(""));
    setOtpError("");
    setTimer(30);
    try {
      if (loginMethod === "both") {
        const res = await axios.post("/sendotp", { email: email.trim(), password });
        if (res.data.status === 1) {
          toast.success("New verification code sent!");
        } else {
          toast.error(res.data.msg || "Failed to resend code");
        }
      } else {
        await sendOtp(email.trim());
        toast.success("New verification code sent!");
      }
      otpRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code");
    }
  };

  const verifyOTP = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/login", {
        email: email.trim(),
        otp: code,
      });

      const { status, msg } = res.data;

      if (status === 1) {
        toast.success(msg || "Login successful");
        const loggedInUser = await fetchUser();
        if (
          loggedInUser &&
          loggedInUser.role !== "super_admin" &&
          loggedInUser.role !== "admin" &&
          loggedInUser.approvalStatus !== "Approved"
        ) {
          navigate("/approval-center");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (status === 2) {
        setOtpError(msg || "Invalid verification code");
        return;
      }

      if (status === 7) {
        toast.error(msg || "Invalid fields");
        return;
      }

      if (status === 9) {
        toast.error(msg || "No user found with this email");
        return;
      }

      if (status === 11) {
        toast.error(msg || "Error creating session, please try again");
        return;
      }

      toast.error(msg || "Internal server error");
    } catch {
      toast.error("Server Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isMultiStep = loginMethod === "otp" || loginMethod === "both";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-800 dark:text-slate-100 transition-colors">
      <LeftPanel customData={customData} />

      <div className="flex flex-1 flex-col justify-between">
        <MobileHeader />

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-lg">
            <TopBar step={step} back={() => setStep(1)} />

            {/* Step Dots */}
            {isMultiStep && (
              <div className="mt-6 sm:mt-8 flex items-center gap-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === 1
                      ? "w-8 bg-blue-600 dark:bg-blue-500"
                      : "w-8 bg-slate-900 dark:bg-slate-300"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === 2
                      ? "w-8 bg-blue-600 dark:bg-blue-500"
                      : "w-6 bg-slate-200 dark:bg-slate-800"
                  }`}
                />
                <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  Step {step} of 2
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ================= STEP 1 FORM ================= */}
              {step === 1 && (
                <motion.div
                  key="login-step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                      Login
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      {loginMethod === "otp"
                        ? "Enter your registered email address to receive a one-time verification code."
                        : loginMethod === "password"
                        ? "Enter your registered email and password to log in."
                        : "Enter your email and password. A verification code will be sent to your email."}
                    </p>
                  </div>

                  <form onSubmit={handleStep1Submit} className="mt-8 space-y-5">
                    {/* Email Input */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          autoFocus
                          placeholder="founder@company.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 pl-11 pr-4 py-3.5 text-sm sm:text-base text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                            error
                              ? "border-red-400 dark:border-red-500 ring-2 ring-red-500/10"
                              : "border-slate-200 dark:border-slate-700/80"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    {(loginMethod === "password" || loginMethod === "both") && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Password
                          </label>
                          <Link
                            to="/forgot-password"
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                            <Lock className="h-5 w-5" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError("");
                            }}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 pl-11 pr-11 py-3.5 text-sm sm:text-base text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                        {error}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {loginMethod === "otp"
                          ? "Passwordless secure login"
                          : loginMethod === "password"
                          ? "Encrypted password login"
                          : "2-Factor Protected Login"}
                      </span>

                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 sm:px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>
                          {loading
                            ? "Verifying..."
                            : loginMethod === "password"
                            ? "Login to RBF"
                            : "Continue"}
                        </span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ================= STEP 2: VERIFY OTP ================= */}
              {step === 2 && isMultiStep && (
                <motion.div
                  key="login-step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Verify your Email
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      We've sent a 6-digit verification code to{" "}
                      <span className="font-bold text-slate-900 dark:text-white break-all">
                        {email}
                      </span>
                    </p>
                  </div>

                  <form onSubmit={verifyOTP} className="mt-8 space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                        6-Digit Security Code
                      </label>
                      <div
                        className="flex items-center justify-between gap-1.5 sm:gap-3"
                        onPaste={handlePaste}
                      >
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            value={digit}
                            autoFocus={index === 0}
                            onChange={(e) => handleOTPChange(index, e.target.value)}
                            onKeyDown={(e) => handleOTPKeyDown(index, e)}
                            maxLength={1}
                            inputMode="numeric"
                            className={`h-12 w-10 sm:h-14 sm:w-14 rounded-xl border bg-white dark:bg-slate-900/90 text-center text-lg sm:text-xl font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                              otpError
                                ? "border-red-400 dark:border-red-500 ring-2 ring-red-500/10"
                                : "border-slate-200 dark:border-slate-700/80"
                            }`}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="mt-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                          {otpError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      {timer > 0 ? (
                        <span className="text-slate-500 dark:text-slate-400">
                          Resend code in <strong className="text-blue-600 dark:text-blue-400">{timer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={resendOTP}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                      >
                        Change Credentials
                      </button>
                    </div>

                    <div className="mt-10 flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={loading}
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{loading ? "Logging in..." : "Login to RBF"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 lg:hidden">
          © {new Date().getFullYear()} RealBell Business Foundation
        </div>
      </div>
    </div>
  );
}

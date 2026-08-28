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
  KeyRound,
  Check,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../zustand/store";

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-3 group">
      <img
        src="/logo.png"
        alt="RealBell Logo"
        className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain shadow-md shadow-amber-700/20 group-hover:scale-105 transition-transform bg-white p-1 border border-slate-200 dark:border-slate-700"
      />

      <div>
        <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          REAL<span className="text-amber-700 dark:text-amber-500">BELL</span>
        </div>

        <div className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Business Foundation
        </div>
      </div>
    </Link>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex w-full max-w-md xl:max-w-lg flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 p-10 xl:p-12 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Logo />

        <div className="mt-12 xl:mt-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Account Security & Recovery</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black leading-tight text-slate-900 dark:text-white">
            Forgot Your
            <br />
            <span className="text-amber-700 dark:text-amber-500">Password?</span>
          </h1>

          <p className="mt-5 text-sm xl:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            No worries! Follow our secure 2-step verification process to verify your email address and regain access to your account in seconds.
          </p>

          <div className="mt-8 space-y-3.5">
            {[
              { icon: KeyRound, text: "Instant 6-digit one-time passcode verification" },
              { icon: ShieldCheck, text: "Bcrypt hashed military-grade password encryption" },
              { icon: Sparkles, text: "Immediate restoration of all platform privileges" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>© {new Date().getFullYear()} RealBell Foundation</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Security Active
        </span>
      </div>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-4 lg:hidden">
      <Logo />
      <div className="flex items-center gap-4">
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>Login</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    document.title = "Reset Password | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Reset your RealBell Business Foundation account password securely via email verification code."
    );
  }, []);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, timer]);

  // STEP 1: Send OTP to email
  const handleSendResetOTP = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/forgot-password/send-otp", {
        email: email.trim(),
      });

      const { status, msg } = res.data;

      if (status === 1) {
        toast.success(msg || "Reset code sent to your email!");
        setOtp(Array(6).fill(""));
        setOtpError("");
        setTimer(30);
        setStep(2);
        return;
      }

      if (status === 9) {
        setError(msg || "No registered account found with this email");
        return;
      }

      toast.error(msg || "Failed to send reset code");
    } catch {
      toast.error("Server error. Please try again.");
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
      const res = await axios.post("/forgot-password/send-otp", {
        email: email.trim(),
      });
      if (res.data.status === 1) {
        toast.success("New reset code sent!");
      } else {
        toast.error(res.data.msg || "Failed to resend code");
      }
      otpRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code");
    }
  };

  // STEP 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setOtpError("");

    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code");
      return;
    }

    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/forgot-password/reset", {
        email: email.trim(),
        otp: code,
        newPassword: password,
      });

      const { status, msg } = res.data;

      if (status === 1) {
        toast.success(msg || "Password reset successfully!");
        setStep(3);
        return;
      }

      if (status === 2) {
        setOtpError(msg || "Invalid or expired verification code");
        return;
      }

      if (status === 7) {
        setError(msg || "Invalid parameters provided");
        return;
      }

      if (status === 9) {
        setError(msg || "No account found with this email");
        return;
      }

      toast.error(msg || "Failed to reset password");
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <LeftPanel />

      <div className="flex flex-1 flex-col justify-between">
        <MobileHeader />

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-lg">
            {/* Top Navigation */}
            <div className="flex items-center justify-between gap-4">
              {step === 2 ? (
                <button
                  onClick={() => setStep(1)}
                  className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                  <span>Back</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                >
                  <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                  <span>Back to Login</span>
                </Link>
              )}

              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-bold text-slate-900 dark:text-white hover:text-amber-700 dark:hover:text-amber-400 underline underline-offset-2 decoration-amber-700/40"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Step Progress Indicators */}
            {step < 3 && (
              <div className="mt-6 sm:mt-8 flex items-center gap-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === 1
                      ? "w-8 bg-amber-700 dark:bg-amber-500"
                      : "w-8 bg-slate-900 dark:bg-slate-300"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === 2
                      ? "w-8 bg-amber-700 dark:bg-amber-500"
                      : "w-6 bg-slate-200 dark:bg-slate-700"
                  }`}
                />
                <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                  Step {step} of 2
                </span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ================= STEP 1: ENTER EMAIL ================= */}
              {step === 1 && (
                <motion.div
                  key="forgot-step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                      Reset Password
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Enter the email address associated with your account and we'll send you a 6-digit verification code.
                    </p>
                  </div>

                  <form onSubmit={handleSendResetOTP} className="mt-8 space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Registered Email Address
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
                          className={`w-full rounded-xl border bg-white dark:bg-slate-900 pl-11 pr-4 py-3.5 text-sm sm:text-base text-slate-900 dark:text-white outline-none transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                            error
                              ? "border-red-400 dark:border-red-500 ring-2 ring-red-500/10"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </div>

                      {error && (
                        <p className="mt-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                          {error}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Link
                        to="/login"
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400"
                      >
                        Return to Login
                      </Link>

                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-6 sm:px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ================= STEP 2: VERIFY OTP & SET PASSWORD ================= */}
              {step === 2 && (
                <motion.div
                  key="forgot-step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Create New Password
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      We've sent a 6-digit code to{" "}
                      <span className="font-bold text-slate-900 dark:text-white break-all">
                        {email}
                      </span>
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
                    {/* OTP 6-Digit input */}
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
                            className={`h-12 w-10 sm:h-14 sm:w-14 rounded-xl border bg-white dark:bg-slate-900 text-center text-lg sm:text-xl font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                              otpError
                                ? "border-red-400 dark:border-red-500 ring-2 ring-red-500/10"
                                : "border-slate-200 dark:border-slate-700"
                            }`}
                          />
                        ))}
                      </div>

                      {otpError && (
                        <p className="mt-2 text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                          {otpError}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs">
                        {timer > 0 ? (
                          <span className="text-slate-500 dark:text-slate-400">
                            Resend code in <strong className="text-amber-700 dark:text-amber-500">{timer}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={resendOTP}
                            className="font-bold text-amber-700 dark:text-amber-500 hover:underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-11 py-3.5 text-sm sm:text-base text-slate-900 dark:text-white outline-none transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
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

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError("");
                          }}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-11 py-3.5 text-sm sm:text-base text-slate-900 dark:text-white outline-none transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                        {error}
                      </p>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{loading ? "Resetting..." : "Reset Password"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ================= STEP 3: SUCCESS STATE ================= */}
              {step === 3 && (
                <motion.div
                  key="forgot-step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 text-center py-6"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mb-6 shadow-lg shadow-emerald-500/10">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Password Reset Complete!
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Your password has been successfully updated. You can now use your new password to sign into RealBell Business Foundation.
                  </p>

                  <div className="mt-8">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Proceed to Login</span>
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="py-4 text-center text-xs text-slate-400 lg:hidden">
          © {new Date().getFullYear()} RealBell Business Foundation
        </div>
      </div>
    </div>
  );
}
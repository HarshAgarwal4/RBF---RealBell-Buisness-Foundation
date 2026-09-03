import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../services/axios";
import { useStore } from "../zustand/store";
import { useTheme } from "../context/ThemeProvider";
import { DEFAULT_PAGE_FALLBACKS } from "../config/pageFallbacks";
import {
  ArrowLeft,
  Bell,
  Rocket,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  Award,
  GraduationCap,
  Globe,
  Loader2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Lock,
  Gift,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
} from "lucide-react";

const ICON_MAP = {
  Rocket: Rocket,
  TrendingUp: TrendingUp,
  Users: Users,
  Building2: Building2,
  Briefcase: Briefcase,
  Award: Award,
  GraduationCap: GraduationCap,
  Globe: Globe,
};

const DEFAULT_USER_TYPES = [
  { id: "startup", label: "Startup", icon: Rocket, desc: "Founders building next-gen products" },
  { id: "investor", label: "Investor", icon: TrendingUp, hasSubtypes: true, desc: "Angels, VCs & Syndicates" },
  { id: "mentor", label: "Mentor", icon: Users, desc: "Industry leaders & advisors" },
  { id: "incubator", label: "Incubator", icon: Building2, desc: "Early-stage incubation & workspace" },
  { id: "accelerator", label: "Accelerator", icon: Building2, desc: "Cohort-based scaling & acceleration" },
];

const INVESTOR_SUBTYPES = [
  { id: "organization", label: "Organization / VC Fund" },
  { id: "individual", label: "Individual Angel Investor" },
  { id: "syndicate", label: "Syndicate / Investment Club" },
];

const COUNTRY_CODES = [
  { code: "+91", label: "+91 (IN)" },
  { code: "+1", label: "+1 (US/CA)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+971", label: "+971 (UAE)" },
  { code: "+65", label: "+65 (SG)" },
];

const TOTAL_STEPS = 3;

function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-3 group">
      <img
        src="/logo.png"
        alt="RealBell Logo"
        className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain shadow-md shadow-blue-600/10 group-hover:scale-105 transition-transform bg-white p-1 border border-slate-200 dark:border-slate-700"
      />
      <div className="leading-tight">
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
  const badge = customData?.leftPanelBadge || "Join India's Growth Foundation";
  const mainTitle = customData?.mainTitle || "Launch, Scale & Fund";
  const titleHighlight = customData?.titleHighlight || "Your Vision.";
  const description =
    customData?.description ||
    "Join a growing foundation where founders, investors, mentors, and incubators unite to build, fund, and scale real businesses.";
  const features = customData?.features || [
    { text: "Connect with a vetted community of founders and backers" },
    { text: "Discover funding cohorts, mentorship, and growth tracks" },
    { text: "Access curated legal contracts, tools, and startup intelligence" },
    { text: "Be part of a foundation built on real relationships" },
  ];
  const footerNote = customData?.footerNote || "RealBell Business Foundation";
  const statusText = customData?.platformStatusText || "Onboarding Open";

  return (
    <div className="hidden w-full max-w-md xl:max-w-lg flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-10 xl:p-12 lg:flex relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Logo />

        <div className="mt-10 xl:mt-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            {mainTitle}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:to-indigo-400">
              {titleHighlight}
            </span>
          </h1>

          <p className="mt-5 text-sm xl:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="mt-8 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 mt-0.5">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
                <span className="leading-snug">{item.text || item}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs xl:text-sm font-medium text-slate-700 dark:text-slate-300">
            An initiative by{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {footerNote}.
            </span>
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <p className="leading-relaxed">
          *Open Beta preview — Empowering the next generation of founders.
        </p>
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap ml-2">
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
          to="/login"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}

function TopBar({ step, onBackStep, showLogin }) {
  return (
    <div className="flex items-center justify-between gap-4">
      {step > 1 && step <= TOTAL_STEPS ? (
        <button
          onClick={onBackStep}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      ) : (
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
      )}

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden lg:block">
          <ThemeToggleButton />
        </div>

        {showLogin && (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2 decoration-blue-600/40"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDots({ step }) {
  if (step > TOTAL_STEPS) return null;
  return (
    <div className="mt-6 sm:mt-8 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? "w-8 bg-blue-600 dark:bg-blue-500"
              : i + 1 < step
              ? "w-8 bg-slate-900 dark:bg-slate-300"
              : "w-6 bg-slate-200 dark:bg-slate-800"
          }`}
        />
      ))}
      <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
  );
}

function TypeCard({ active, label, desc, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 rounded-xl border p-4 sm:p-4.5 text-left transition-all cursor-pointer ${
        active
          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
      }`}
    >
      <div
        className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          active
            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        }`}
      >
        {Icon ? <Icon className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
          {label}
        </div>
        {desc && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {desc}
          </div>
        )}
      </div>

      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
          active
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 dark:border-slate-700 bg-transparent"
        }`}
      >
        {active && <Check className="h-3 w-3 stroke-[3]" />}
      </div>
    </button>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Apply For Incubation & Register | RealBell Business Foundation";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Register on RealBell Business Foundation (RBF). Apply as a Startup Founder, Angel Investor, Expert Mentor, or Incubator partner."
    );
  }, []);

  const { sendSignupOtp, user } = useStore();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [investorType, setInvestorType] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    yourName: "",
    email: "",
    countryCode: "+91",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const storeSignupData = useStore((state) => state.pageContents?.signup);
  const [customData, setCustomData] = useState(storeSignupData || DEFAULT_PAGE_FALLBACKS.signup);
  const otpRefs = useRef([]);

  // Referral State
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [appliedReferral, setAppliedReferral] = useState(null);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [referralFeedback, setReferralFeedback] = useState({ error: "", success: "" });

  const storeRoles = useStore((state) => state.roles);

  // Auto-detect referral code from URL or sessionStorage
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlRef = searchParams.get("ref") || searchParams.get("referral");
      const storedRef = sessionStorage.getItem("rbf_referral_code");
      const initialCode = (urlRef || storedRef || "").trim().toUpperCase();

      if (initialCode) {
        sessionStorage.setItem("rbf_referral_code", initialCode);
        setReferralCodeInput(initialCode);
        setShowReferralInput(true);
        validateAndApplyCode(initialCode, false);
      }
    } catch (e) {
      console.warn("Referral URL parse error:", e);
    }
  }, []);

  const validateAndApplyCode = async (code, isManual = true) => {
    if (!code || !code.trim()) {
      if (isManual) {
        setReferralFeedback({ error: "Please enter a referral code.", success: "" });
      }
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    setValidatingReferral(true);
    setReferralFeedback({ error: "", success: "" });

    try {
      const res = await axios.get(`/referrals/validate/${cleanCode}`);
      if (res.data.status === 1) {
        const referrer = res.data.referrer;
        setAppliedReferral({
          code: cleanCode,
          name: referrer.name,
          company_name: referrer.company_name,
          bonusCredits: res.data.bonusCredits || 250,
        });
        sessionStorage.setItem("rbf_referral_code", cleanCode);
        setReferralFeedback({
          error: "",
          success: `Referral code applied! You will receive ${res.data.bonusCredits || 250} bonus credits upon registration.`,
        });
        if (isManual) {
          toast.success("Referral code applied successfully.");
        }
      } else {
        setAppliedReferral(null);
        setReferralFeedback({ error: res.data.msg || "Invalid referral code.", success: "" });
        if (isManual) {
          toast.error(res.data.msg || "Invalid referral code.");
        }
      }
    } catch (err) {
      setAppliedReferral(null);
      const errMsg = err.response?.data?.msg || "Invalid referral code. Please check and try again.";
      setReferralFeedback({ error: errMsg, success: "" });
      if (isManual) {
        toast.error(errMsg);
      }
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleRemoveReferral = () => {
    setAppliedReferral(null);
    setReferralCodeInput("");
    setReferralFeedback({ error: "", success: "" });
    try {
      sessionStorage.removeItem("rbf_referral_code");
    } catch (_) {}
    toast.info("Referral code removed.");
  };

  useEffect(() => {
    if (storeSignupData) {
      setCustomData(storeSignupData);
    }
  }, [storeSignupData]);

  const userTypes = React.useMemo(() => {
    if (Array.isArray(storeRoles) && storeRoles.length > 0) {
      const sortedRoles = [...storeRoles].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return sortedRoles.map((r) => ({
        id: r.key,
        label: r.label,
        desc: r.description || r.desc,
        icon: ICON_MAP[r.icon] || Building2,
        hasSubtypes: r.hasSubtypes,
        subtypes: r.subtypes,
      }));
    }
    return DEFAULT_USER_TYPES;
  }, [storeRoles]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const selectedRoleObj = userTypes.find((t) => t.id === userType);
  const requiresSubtype = Boolean(selectedRoleObj?.hasSubtypes || userType === "investor");

  const canContinueStep1 = Boolean(
    userType && (!requiresSubtype || investorType)
  );

  const updateForm = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateBasicDetails = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Company or entity name is required";
    if (!form.yourName.trim()) e.yourName = "Your full name is required";
    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^\d{7,12}$/.test(form.mobile))
      e.mobile = "Enter a valid mobile number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (!validateBasicDetails()) return false;
    const code = otp.join("");
    if (!otpSent) {
      setOtpError("Please click 'Send OTP' to verify your email address");
      return false;
    }
    if (code.length < 6) {
      setOtpError("Please enter the 6-digit verification code sent to your email");
      return false;
    }
    setOtpError("");
    return true;
  };

  const validateStep3 = () => {
    const e = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (form.password && form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!agree) e.agree = "Please accept the terms to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToStep2 = () => {
    if (canContinueStep1) setStep(2);
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateBasicDetails()) return;

    setSendingOtp(true);
    setOtpError("");
    try {
      const res = await sendSignupOtp(form.email.trim());
      if (res && res.success) {
        setOtpSent(true);
        setResendTimer(30);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      }
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const goToStep3 = (e) => {
    if (e) e.preventDefault();
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setOtpError("");
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      otpRefs.current[5]?.focus();
    }
  };

  const handleCompleteSignup = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep3()) return;

    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      setStep(2);
      return;
    }

    setVerifying(true);
    try {
      const payload = {
        company_type: userType,
        investing_as: userType === "investor" ? investorType : undefined,
        company_name: form.companyName.trim(),
        name: form.yourName.trim(),
        email: form.email.trim(),
        phone: `${form.countryCode}${form.mobile.trim()}`,
        password: form.password,
        agree,
        otp: code,
        referralCode: appliedReferral
          ? appliedReferral.code
          : referralCodeInput.trim().toUpperCase() || undefined,
      };

      const r = await axios.post("/signup", payload);

      if (r.status === 200) {
        const { status, msg } = r.data;

        if (status === 1) {
          toast.success(msg || "Organization registered successfully");
          setStep(4);
          return;
        }
        if (status === 2) {
          toast.error(msg || "Invalid or expired verification code");
          setStep(2);
          setOtpError(msg || "Invalid verification code. Please check or resend OTP.");
          return;
        }
        if (status === 3) {
          toast.error(msg || "Email already registered");
          setStep(2);
          return;
        }
        if (status === 7) {
          toast.error(msg || "All required fields are mandatory");
          return;
        }
        toast.error(msg || "Internal server error");
      }
    } catch (err) {
      console.error(err);
      toast.error("Internal server error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(Array(6).fill(""));
    setOtpError("");
    setResendTimer(30);
    try {
      await sendSignupOtp(form.email.trim());
      otpRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code");
    }
  };

  const approvalPage = () => {
    navigate("/approval-center");
  };

  // ---------- Step 4: Success / Verification redirect ----------
  if (step === 4) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070B14] px-4 py-12 transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-8 sm:p-10 text-center shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome, {form.yourName.split(" ")[0] || "Founder"}!
          </h2>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your RealBell Business Foundation account has been created. To unlock your ecosystem dashboard, please complete your organization verification form.
          </p>

          <button
            onClick={approvalPage}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Complete Verification Form →
          </button>
        </motion.div>
      </div>
    );
  }

  // ---------- Steps 1–3 Shared Shell ----------
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-800 dark:text-slate-100 transition-colors">
      <LeftPanel customData={customData} />

      <div className="flex flex-1 flex-col justify-between">
        <MobileHeader />

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-xl">
            <TopBar step={step} onBackStep={() => setStep((s) => s - 1)} showLogin />
            <StepDots step={step} />

            <AnimatePresence mode="wait">
              {/* ---------------- STEP 1: ROLE SELECTION ---------------- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                      I am joining as...
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      Select the primary role that best describes your stakeholder profile.
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {userTypes.map((t) => (
                      <TypeCard
                        key={t.id}
                        label={t.label}
                        desc={t.desc}
                        icon={t.icon}
                        active={userType === t.id}
                        onClick={() => {
                          setUserType(t.id);
                          if (!t.hasSubtypes && t.id !== "investor") setInvestorType(null);
                        }}
                      />
                    ))}
                  </div>

                  {userType === "investor" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800"
                    >
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Investing entity type:
                      </h3>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {INVESTOR_SUBTYPES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setInvestorType(t.id)}
                            className={`rounded-xl border p-3 text-xs sm:text-sm font-semibold text-center transition-all cursor-pointer ${
                              investorType === t.id
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 ring-1 ring-blue-600"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Step 1 of 3: Role Definition
                    </div>
                    <button
                      disabled={!canContinueStep1}
                      onClick={goToStep2}
                      className={`inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer ${
                        canContinueStep1
                          ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
                          : "cursor-not-allowed bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 opacity-60"
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ---------------- STEP 2: DETAILS & OTP VERIFICATION ---------------- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Profile & Email Verification
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Fill in your profile details and verify your email address to continue.
                    </p>
                  </div>

                  <form onSubmit={goToStep3} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Company or Project Name
                      </label>
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. NexaTech Innovations"
                        value={form.companyName}
                        onChange={(e) => updateForm("companyName", e.target.value)}
                        className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                          errors.companyName ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700/80"
                        }`}
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={form.yourName}
                          onChange={(e) => updateForm("yourName", e.target.value)}
                          className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                            errors.yourName ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700/80"
                          }`}
                        />
                        {errors.yourName && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                            {errors.yourName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Work Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="rahul.sharma@nexatech.in"
                          value={form.email}
                          onChange={(e) => {
                            updateForm("email", e.target.value);
                            setOtpSent(false);
                            setOtp(Array(6).fill(""));
                            setOtpError("");
                          }}
                          className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                            errors.email ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700/80"
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                        Mobile Number
                      </label>
                      <div className="flex gap-2 sm:gap-3">
                        <select
                          value={form.countryCode}
                          onChange={(e) => updateForm("countryCode", e.target.value)}
                          className="w-28 sm:w-32 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-3 py-3 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={form.mobile}
                          onChange={(e) =>
                            updateForm("mobile", e.target.value.replace(/\D/g, ""))
                          }
                          className={`flex-1 rounded-xl border bg-white dark:bg-slate-900/90 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                            errors.mobile ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700/80"
                          }`}
                        />
                      </div>
                      {errors.mobile && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.mobile}</p>
                      )}
                    </div>

                    {/* Referral Code Section */}
                    <div className="rounded-2xl border border-dashed border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 transition-all">
                      {!showReferralInput && !appliedReferral ? (
                        <button
                          type="button"
                          onClick={() => setShowReferralInput(true)}
                          className="flex items-center justify-between w-full text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                            <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                            <span>Have a referral code? (Earn bonus credits)</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                              <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span>Referral Code</span>
                            </div>
                            {!appliedReferral && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowReferralInput(false);
                                  setReferralFeedback({ error: "", success: "" });
                                }}
                                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                              >
                                Hide
                              </button>
                            )}
                          </div>

                          {appliedReferral ? (
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    Code Applied: <span className="font-mono">{appliedReferral.code}</span>
                                  </div>
                                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    Referred by <strong>{appliedReferral.name}</strong> ({appliedReferral.company_name}).
                                    You will receive <strong>+{appliedReferral.bonusCredits || 250} Bonus Credits</strong> upon registration!
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleRemoveReferral}
                                className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. RBF8K2M1"
                                  value={referralCodeInput}
                                  onChange={(e) => {
                                    setReferralCodeInput(e.target.value.toUpperCase());
                                    setReferralFeedback({ error: "", success: "" });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      validateAndApplyCode(referralCodeInput, true);
                                    }
                                  }}
                                  className="flex-1 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900/90 px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => validateAndApplyCode(referralCodeInput, true)}
                                  disabled={validatingReferral || !referralCodeInput.trim()}
                                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
                                >
                                  {validatingReferral && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                  <span>Apply</span>
                                </button>
                              </div>

                              {referralFeedback.error && (
                                <p className="mt-1 text-xs font-medium text-red-500 dark:text-red-400">
                                  {referralFeedback.error}
                                </p>
                              )}
                              {referralFeedback.success && (
                                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  {referralFeedback.success}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* OTP Trigger & Input Section */}
                    <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                            <span>Email OTP Verification</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {otpSent
                              ? `Code sent to ${form.email}`
                              : "Click Send OTP to receive your 6-digit verification code"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={sendingOtp || (otpSent && resendTimer > 0)}
                          className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex-shrink-0"
                        >
                          {sendingOtp && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          <span>
                            {sendingOtp
                              ? "Sending..."
                              : otpSent
                              ? resendTimer > 0
                                ? `Resend in ${resendTimer}s`
                                : "Resend OTP"
                              : "Send OTP"}
                          </span>
                        </button>
                      </div>

                      {otpSent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Enter 6-Digit Code
                          </label>
                          <div
                            className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-sm"
                            onPaste={handleOtpPaste}
                          >
                            {otp.map((digit, idx) => (
                              <input
                                key={idx}
                                ref={(el) => (otpRefs.current[idx] = el)}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                maxLength={1}
                                inputMode="numeric"
                                className={`h-11 w-10 sm:h-12 sm:w-11 rounded-xl border bg-white dark:bg-slate-900/90 text-center text-lg font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 ${
                                  otpError
                                    ? "border-red-400 dark:border-red-500"
                                    : "border-slate-200 dark:border-slate-700/80"
                                }`}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {otpError && (
                        <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
                          {otpError}
                        </p>
                      )}
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <span>Next: Set Password →</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ---------------- STEP 3: PASSWORD CREATION ---------------- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Set Your Password
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Create a secure password to protect your{" "}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {form.companyName || "organization"}
                      </span>{" "}
                      account.
                    </p>
                  </div>

                  <form onSubmit={handleCompleteSignup} className="mt-6 space-y-5">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Create Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 6 characters"
                            autoFocus
                            value={form.password}
                            onChange={(e) => updateForm("password", e.target.value)}
                            className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                              errors.password ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700/80"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter password"
                            value={form.confirmPassword}
                            onChange={(e) => updateForm("confirmPassword", e.target.value)}
                            className={`w-full rounded-xl border bg-white dark:bg-slate-900/90 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 ${
                              errors.confirmPassword ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700/80"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agree}
                          onChange={(e) => {
                            setAgree(e.target.checked);
                            setErrors((er) => ({ ...er, agree: undefined }));
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                        <span>
                          I agree to the{" "}
                          <Link to="/terms-of-service" target="_blank" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            Terms & Conditions
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy-policy" target="_blank" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            Privacy Policy
                          </Link>{" "}
                          of RealBell Business Foundation.
                        </span>
                      </label>
                      {errors.agree && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.agree}</p>
                      )}
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 sm:px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="submit"
                        disabled={verifying}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                      >
                        {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{verifying ? "Creating Account..." : "Complete Registration"}</span>
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
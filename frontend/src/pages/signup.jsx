import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../services/axios";
import { useStore } from "../zustand/store";
import { AppLoader } from "./Loading";
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
  { id: "incubator/accelerator", label: "Incubator/Accelerator", icon: Building2, desc: "Ecosystem catalysts & programs" },
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
        className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-contain shadow-md shadow-amber-700/20 group-hover:scale-105 transition-transform bg-white p-1 border border-slate-200 dark:border-slate-700"
      />
      <div className="leading-tight">
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
    <div className="hidden w-full max-w-md xl:max-w-lg flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 p-10 xl:p-12 lg:flex relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Logo />

        <div className="mt-10 xl:mt-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Join India's Growth Foundation</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            Ring In Growth,
            <br />
            <span className="text-amber-700 dark:text-amber-500">Together.</span>
          </h1>

          <p className="mt-5 text-sm xl:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            Join a growing foundation where founders, investors, mentors, and incubators unite to build, fund, and scale real businesses.
          </p>

          <div className="mt-8 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
            {[
              "Connect with a vetted community of founders and backers",
              "Discover funding cohorts, mentorship, and growth tracks",
              "Access curated legal contracts, tools, and startup intelligence",
              "Be part of a foundation built on real relationships",
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 mt-0.5">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs xl:text-sm font-medium text-slate-700 dark:text-slate-300">
            An initiative by{" "}
            <span className="font-bold text-amber-700 dark:text-amber-400">
              RealBell Business Foundation.
            </span>
          </p>
        </div>
      </div>

      <div className="relative z-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <p className="leading-relaxed">
          *Open Beta preview — Join us to collaborate and pioneer the future of Indian startup ecosystems.
        </p>
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
          to="/"
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>Home</span>
        </Link>
        <Link
          to="/login"
          className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline"
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
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      ) : (
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
      )}

      {showLogin && (
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-slate-900 dark:text-white hover:text-amber-700 dark:hover:text-amber-400 underline underline-offset-2 decoration-amber-700/40"
          >
            Login
          </Link>
        </div>
      )}
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
              ? "w-8 bg-amber-700 dark:bg-amber-500"
              : i + 1 < step
              ? "w-8 bg-slate-900 dark:bg-slate-300"
              : "w-6 bg-slate-200 dark:bg-slate-700"
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
          ? "border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-700/20 dark:ring-amber-500/20 shadow-xs"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
      }`}
    >
      <div
        className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          active
            ? "bg-amber-700 text-white"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 group-hover:text-amber-700 dark:group-hover:text-amber-400"
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
            ? "border-amber-700 bg-amber-700 text-white"
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
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef([]);

  const storeRoles = useStore((state) => state.roles);

  const userTypes = React.useMemo(() => {
    if (Array.isArray(storeRoles) && storeRoles.length > 0) {
      return storeRoles.map((r) => ({
        id: r.key,
        label: r.label,
        desc: r.desc,
        icon: ICON_MAP[r.icon] || Building2,
        hasSubtypes: r.hasSubtypes,
        subtypes: r.subtypes,
      }));
    }
    return DEFAULT_USER_TYPES;
  }, [storeRoles]);

  useEffect(() => {
    if (step === 3 && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendTimer]);

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

  const validateStep2 = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Company or entity name is required";
    if (!form.yourName.trim()) e.yourName = "Your full name is required";
    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^\d{7,12}$/.test(form.mobile))
      e.mobile = "Enter a valid mobile number";
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

  // Step 2 -> Step 3: validate the form, then trigger the OTP email via zustand
  const goToStep3 = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep2()) return;

    setSendingOtp(true);
    try {
      const res = await sendSignupOtp(form.email.trim());
      if (res && res.success) {
        setOtp(Array(6).fill(""));
        setOtpError("");
        setResendTimer(30);
        setStep(3);
      }
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingOtp(false);
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

  // Step 3 -> Step 4: send everything to POST /signup
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Enter the full 6-digit code sent to your email");
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
          setOtpError(msg || "Invalid verification code");
          return;
        }
        if (status === 3) {
          toast.error(msg || "Email already registered");
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

  const dashboardPage = () => {
    navigate("/dashboard");
  };

  // ---------- Step 4: success / dashboard redirect ----------
  if (step === 4) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            You're all set, {form.yourName.split(" ")[0] || "Founder"}!
          </h2>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your RealBell Business Foundation account has been successfully created. Welcome to the ecosystem.
          </p>

          <button
            onClick={dashboardPage}
            className="mt-8 w-full rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Continue to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ---------- Steps 1–3 shared shell ----------
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <LeftPanel />

      <div className="flex flex-1 flex-col justify-between">
        <MobileHeader />

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-xl">
            <TopBar step={step} onBackStep={() => setStep((s) => s - 1)} showLogin />
            <StepDots step={step} />

            <AnimatePresence mode="wait">
              {/* ---------------- STEP 1 ---------------- */}
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
                                ? "border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-700"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
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
                          ? "bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 shadow-amber-700/20 hover:scale-[1.02] active:scale-[0.98]"
                          : "cursor-not-allowed bg-amber-700/40 opacity-60"
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ---------------- STEP 2 ---------------- */}
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
                      Create Your Profile
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Tell us about yourself and your organization to setup your ecosystem account.
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
                        placeholder="e.g. Acme Tech Innovations"
                        value={form.companyName}
                        onChange={(e) => updateForm("companyName", e.target.value)}
                        className={`w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                          errors.companyName ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
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
                          className={`w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                            errors.yourName ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
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
                          placeholder="rahul@acme.com"
                          value={form.email}
                          onChange={(e) => updateForm("email", e.target.value)}
                          className={`w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                            errors.email ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
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
                          className="w-28 sm:w-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500"
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
                          className={`flex-1 rounded-xl border bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                            errors.mobile ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </div>
                      {errors.mobile && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.mobile}</p>
                      )}
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Create Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={(e) => updateForm("password", e.target.value)}
                            className={`w-full rounded-xl border bg-white dark:bg-slate-900 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                              errors.password ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
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
                            className={`w-full rounded-xl border bg-white dark:bg-slate-900 pl-4 pr-11 py-3 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-all focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:focus:border-amber-500 dark:focus:ring-amber-500/20 ${
                              errors.confirmPassword ? "border-red-400 dark:border-red-500" : "border-slate-200 dark:border-slate-700"
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
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-700 cursor-pointer"
                        />
                        <span>
                          I agree to the{" "}
                          <a href="#" className="font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                            Terms & Conditions
                          </a>{" "}
                          and{" "}
                          <a href="#" className="font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                            Privacy Policy
                          </a>{" "}
                          of RealBell Business Foundation.
                        </span>
                      </label>
                      {errors.agree && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.agree}</p>
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
                        disabled={sendingOtp}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                      >
                        {sendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{sendingOtp ? "Sending Code..." : "Verify Email"}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ---------------- STEP 3 ---------------- */}
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
                      Verify Your Email
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Enter the 6-digit verification code sent to{" "}
                      <span className="font-bold text-slate-900 dark:text-white break-all">
                        {form.email}
                      </span>
                    </p>
                  </div>

                  <form onSubmit={handleVerify} className="mt-8 space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                        6-Digit Security Code
                      </label>
                      <div
                        className="flex items-center justify-between gap-1.5 sm:gap-3"
                        onPaste={handleOtpPaste}
                      >
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpRefs.current[idx] = el)}
                            value={digit}
                            autoFocus={idx === 0}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
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
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      {resendTimer > 0 ? (
                        <span className="text-slate-500 dark:text-slate-400">
                          Resend code in <strong className="text-amber-700 dark:text-amber-500">{resendTimer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="font-bold text-amber-700 dark:text-amber-500 hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>

                    <div className="mt-10 flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-amber-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
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
        <div className="py-4 text-center text-xs text-slate-400 lg:hidden">
          © {new Date().getFullYear()} RealBell Business Foundation
        </div>
      </div>
    </div>
  );
}
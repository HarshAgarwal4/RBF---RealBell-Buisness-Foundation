import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../services/axios";
// NOTE: adjust this import path if your zustand store file lives somewhere
// other than src/zustand/useStore.js
import { useStore } from "../zustand/store";
import {
  ArrowLeft,
  Bell,
  Rocket,
  TrendingUp,
  Users,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const USER_TYPES = [
  { id: "startup", label: "Startup", icon: Rocket },
  { id: "investor", label: "Investor", icon: TrendingUp },
  { id: "mentor", label: "Mentor", icon: Users },
  { id: "incubator", label: "Incubator/Accelerator", icon: Building2 },
];

const INVESTOR_SUBTYPES = [
  { id: "organization", label: "Organization" },
  { id: "individual", label: "Individual Investor" },
  { id: "syndicate", label: "Syndicate" },
];

const COUNTRY_CODES = [{ code: "+91", label: "India (+91)" }];

const TOTAL_STEPS = 3;

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-700">
        <Bell className="h-5 w-5 text-white" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <div className="text-lg font-extrabold tracking-tight text-slate-900">
          REAL<span className="text-amber-700">BELL</span>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Business Foundation
        </div>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden w-full max-w-md flex-col justify-between border-r border-slate-200 bg-stone-50 px-10 py-12 lg:flex">
      <div>
        <Logo />

        <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
          Ring In Growth,
          <br />
          Together.
        </h1>

        <p className="mt-6 text-[15px] leading-relaxed text-slate-600">
          Welcome to RealBell Connect!
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
          Join a growing foundation where founders, investors, mentors and
          incubators come together to build, fund and scale real businesses.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
          Whether you're launching your first venture, backing the next big
          idea, or guiding founders forward, this is your one-stop-shop.
        </p>

        <ul className="mt-4 space-y-2 text-[15px] text-slate-600">
          <li className="flex gap-2">
            <span className="text-amber-700">•</span>
            Connect with a vetted community of founders and backers
          </li>
          <li className="flex gap-2">
            <span className="text-amber-700">•</span>
            Discover funding, mentorship and growth opportunities
          </li>
          <li className="flex gap-2">
            <span className="text-amber-700">•</span>
            Access curated resources, tools and insights
          </li>
          <li className="flex gap-2">
            <span className="text-amber-700">•</span>
            Be part of a foundation built on real relationships
          </li>
        </ul>

        <p className="mt-6 text-[15px] leading-relaxed text-slate-600">
          Your journey starts here. Let's build something real, together.
        </p>

        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
          An initiative brought to you by{" "}
          <span className="font-bold text-slate-900">
            RealBell Business Foundation.
          </span>
        </p>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        *PS: the platform is in open beta (a preview release) — by joining
        you volunteer to help us test it and share feedback on how to make
        it better.
      </p>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="border-b border-slate-200 bg-stone-50 px-6 py-6 lg:hidden">
      <Logo />
    </div>
  );
}

function TopBar({ step, onBackStep, showLogin }) {
  return (
    <div className="flex items-center justify-between">
      {step > 1 && step <= TOTAL_STEPS ? (
        <button
          onClick={onBackStep}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      ) : (
        <span />
      )}

      {showLogin && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-slate-900 hover:text-amber-700"
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
    <div className="mt-8 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${i + 1 === step
              ? "w-8 bg-amber-700"
              : i + 1 < step
                ? "w-8 bg-slate-900"
                : "w-8 bg-slate-200"
            }`}
        />
      ))}
      <span className="ml-2 text-xs font-medium text-slate-400">
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
  );
}

function TypeCard({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors ${active
          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
          : "border-slate-200 hover:border-slate-300"
        }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-amber-700 bg-amber-700" : "border-slate-300 bg-white"
          }`}
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
      </span>
      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      <span className="font-bold text-slate-900">{label}</span>
    </button>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { sendOtp } = useStore();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [investorType, setInvestorType] = useState(null);

  const [form, setForm] = useState({
    companyName: "",
    yourName: "",
    email: "",
    countryCode: "+91",
    mobile: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const { user } = useStore()
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (step === 3 && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, resendTimer]);

  useEffect(() => {
    if (user) navigate("/dashboard")
  }, [user])

  const canContinueStep1 = Boolean(
    userType && (userType !== "investor" || investorType)
  );

  const updateForm = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "This field is required";
    if (!form.yourName.trim()) e.yourName = "This field is required";
    if (!form.email.trim()) e.email = "This field is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.mobile.trim()) e.mobile = "This field is required";
    else if (!/^\d{7,12}$/.test(form.mobile))
      e.mobile = "Enter a valid mobile number";
    if (!agree) e.agree = "Please accept the terms to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToStep2 = () => {
    if (canContinueStep1) setStep(2);
  };

  // Step 2 -> Step 3: validate the form, then trigger the OTP email via zustand
  const goToStep3 = async () => {
    if (!validateStep2()) return;

    setSendingOtp(true);
    try {
      await sendOtp(form.email);
      setOtp(Array(6).fill(""));
      setOtpError("");
      setResendTimer(30);
      setStep(3);
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

  // Step 3 -> Step 4: send everything to POST /signup
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Enter the 6-digit code sent to your email");
      return;
    }

    setVerifying(true);
    try {
      const payload = {
        company_type: userType,
        investing_as: userType === "investor" ? investorType : undefined,
        company_name: form.companyName,
        name: form.yourName,
        email: form.email,
        phone: `${form.countryCode}${form.mobile}`,
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
          setOtpError(msg || "Invalid OTP");
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
        // status 0 or anything unexpected
        toast.error(msg || "Internal server error");
      }
    } catch (err) {
      console.log(err);
      toast.error("Internal server error");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(Array(6).fill(""));
    setOtpError("");
    setResendTimer(30);
    await sendOtp(form.email);
    otpRefs.current[0]?.focus();
  };

  const dashboardPage = () => {
    navigate("/dashboard");
  };

  // ---------- Step 4: success / dashboard redirect ----------
  if (step === 4) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-700/10">
            <CheckCircle2 className="h-9 w-9 text-amber-700" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
            You're all set, {form.yourName.split(" ")[0] || "there"}!
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Your RealBell Business Foundation profile has been created.
          </p>
          <button
            onClick={dashboardPage}
            className="mt-8 w-full rounded-lg bg-amber-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-amber-800"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------- Steps 1–3 shared shell ----------
  return (
    <div className="flex min-h-screen bg-white">
      <LeftPanel />

      <div className="flex flex-1 flex-col">
        <MobileHeader />

        <div className="flex flex-1 justify-center px-6 py-10 lg:px-16 lg:py-16">
          <div className="w-full max-w-xl">
            <TopBar step={step} onBackStep={() => setStep((s) => s - 1)} showLogin />
            <StepDots step={step} />

            {/* ---------------- STEP 1 ---------------- */}
            {step === 1 && (
              <div className="mt-8">
                <h2 className="text-5xl font-extrabold tracking-tight text-slate-900">
                  I am
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {USER_TYPES.map((t) => (
                    <TypeCard
                      key={t.id}
                      label={t.label}
                      icon={t.icon}
                      active={userType === t.id}
                      onClick={() => {
                        setUserType(t.id);
                        if (t.id !== "investor") setInvestorType(null);
                      }}
                    />
                  ))}
                </div>

                {userType === "investor" && (
                  <div className="mt-8">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      investing as
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {INVESTOR_SUBTYPES.map((t) => (
                        <TypeCard
                          key={t.id}
                          label={t.label}
                          active={investorType === t.id}
                          onClick={() => setInvestorType(t.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 flex justify-end">
                  <button
                    disabled={!canContinueStep1}
                    onClick={goToStep2}
                    className={`rounded-lg px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors ${canContinueStep1
                        ? "bg-amber-700 hover:bg-amber-800"
                        : "cursor-not-allowed bg-amber-700/40"
                      }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 2 ---------------- */}
            {step === 2 && (
              <div className="mt-8">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Create Profile
                </h2>

                <div className="mt-6 space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Company name"
                      value={form.companyName}
                      onChange={(e) => updateForm("companyName", e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${errors.companyName ? "border-red-400" : "border-slate-200"
                        }`}
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={form.yourName}
                        onChange={(e) => updateForm("yourName", e.target.value)}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${errors.yourName ? "border-red-400" : "border-slate-200"
                          }`}
                      />
                      {errors.yourName && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.yourName}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${errors.email ? "border-red-400" : "border-slate-200"
                          }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto,1fr] gap-4">
                    <div>
                      <select
                        value={form.countryCode}
                        onChange={(e) => updateForm("countryCode", e.target.value)}
                        className="h-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Mobile number"
                        value={form.mobile}
                        onChange={(e) =>
                          updateForm("mobile", e.target.value.replace(/\D/g, ""))
                        }
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${errors.mobile ? "border-red-400" : "border-slate-200"
                          }`}
                      />
                      {errors.mobile && (
                        <p className="mt-1 text-xs text-red-500">{errors.mobile}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => {
                          setAgree(e.target.checked);
                          setErrors((er) => ({ ...er, agree: undefined }));
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-700"
                      />
                      <span>
                        By checking, you accept the{" "}
                        <a href="#" className="font-medium text-amber-700 hover:underline">
                          terms and conditions
                        </a>{" "}
                        and{" "}
                        <a href="#" className="font-medium text-amber-700 hover:underline">
                          privacy policy
                        </a>{" "}
                        of RealBell Connect.
                      </span>
                    </label>
                    {errors.agree && (
                      <p className="mt-1 text-xs text-red-500">{errors.agree}</p>
                    )}
                  </div>
                </div>

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-lg bg-slate-100 px-8 py-3 text-sm font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToStep3}
                    disabled={sendingOtp}
                    className="flex items-center gap-2 rounded-lg bg-amber-700 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-700/60"
                  >
                    {sendingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                    {sendingOtp ? "Sending OTP" : "Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 3 ---------------- */}
            {step === 3 && (
              <div className="mt-8">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Verify your email
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  We've sent a 6-digit code to{" "}
                  <span className="font-bold text-slate-900">
                    {form.email || "your email"}
                  </span>
                  .
                </p>

                <div className="mt-8 flex gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      maxLength={1}
                      inputMode="numeric"
                      className={`h-14 w-12 rounded-lg border text-center text-lg font-bold text-slate-900 outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 sm:w-14 ${otpError ? "border-red-400" : "border-slate-200"
                        }`}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="mt-2 text-xs text-red-500">{otpError}</p>
                )}

                <div className="mt-5 text-sm text-slate-500">
                  {resendTimer > 0 ? (
                    <span>Resend code in {resendTimer}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="font-bold text-amber-700 hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-lg bg-slate-100 px-8 py-3 text-sm font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="flex items-center gap-2 rounded-lg bg-amber-700 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-700/60"
                  >
                    {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                    {verifying ? "Verifying" : "Verify & Continue"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../zustand/store";

const TOTAL_STEPS = 2;

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-700">
        <Bell className="h-5 w-5 text-white" />
      </div>

      <div>
        <div className="text-lg font-extrabold tracking-tight text-slate-900">
          REAL<span className="text-amber-700">BELL</span>
        </div>

        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Business Foundation
        </div>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex w-full max-w-md flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 px-10 py-12">
      <div>
        <Logo />

        <h1 className="mt-10 text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">
          Welcome Back.
          <br />
          Let's Continue.
        </h1>

        <p className="mt-6 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          Login to RealBell Business Foundation and continue building,
          connecting and growing your startup ecosystem.
        </p>

        <ul className="mt-8 space-y-3 text-[15px] text-slate-600 dark:text-slate-300">
          <li>• Access your dashboard</li>
          <li>• Connect with founders & investors</li>
          <li>• Join programs & events</li>
          <li>• Manage your business profile</li>
        </ul>
      </div>

      <p className="text-xs text-slate-400">
        © RealBell Business Foundation
      </p>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 px-6 py-6 lg:hidden">
      <Logo />
    </div>
  );
}

function TopBar({ step, back }) {
  return (
    <div className="flex items-center justify-between">

      {step > 1 ? (
        <button
          onClick={back}
          className="flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      ) : (
        <span />
      )}

      <div className="text-sm text-slate-600">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="font-bold hover:text-amber-700"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

function StepDots({ step }) {
  return (
    <div className="mt-8 flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-8 rounded-full ${
            i + 1 === step
              ? "bg-amber-700"
              : i + 1 < step
              ? "bg-slate-900"
              : "bg-slate-200"
          }`}
        />
      ))}

      <span className="ml-2 text-xs text-slate-400">
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
  );
}

export default function LoginPage() {

  const navigate = useNavigate();

  const fetchUser = useStore(state => state.fetchUser);

  const user = useStore(state => state.user);

  // pulled straight from the zustand store, same as signup.jsx
  const sendOtp = useStore(state => state.sendOtp);

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [error, setError] = useState("");

  const [otp, setOtp] = useState(Array(6).fill(""));

  const [otpError, setOtpError] = useState("");

  const [timer, setTimer] = useState(30);

  const [loading, setLoading] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user]);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, timer]);

  // STEP 1 -> STEP 2: send the OTP through the zustand store
  const sendOTP = async () => {

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {

      await sendOtp(email);

      setOtp(Array(6).fill(""));

      setOtpError("");

      setTimer(30);

      setStep(2);

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

  const resendOTP = async () => {

    if (timer > 0) return;

    await sendOtp(email);

    setOtp(Array(6).fill(""));

    setOtpError("");

    setTimer(30);

    otpRefs.current[0]?.focus();
  };

  // STEP 2 -> POST /login with { email, otp }
  const verifyOTP = async () => {

    const code = otp.join("");

    if (code.length !== 6) {

      setOtpError("Enter complete OTP");

      return;
    }

    setLoading(true);

    try {

      const res = await axios.post("/login", {

        email,

        otp: code,

      });

      const { status, msg } = res.data;

      if (status === 1) {

        toast.success(msg || "Login successful");

        await fetchUser();

        navigate("/dashboard");

        return;
      }

      if (status === 2) {

        setOtpError(msg || "Invalid OTP");

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

      // status 0 or anything unexpected
      toast.error(msg || "Internal server error");

    } catch (err) {

      toast.error("Server Error");

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="flex min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">

      <LeftPanel />

      <div className="flex flex-1 flex-col">

        <MobileHeader />

        <div className="flex flex-1 justify-center px-6 py-10 lg:px-16 lg:py-16">

          <div className="w-full max-w-xl">

            <TopBar
              step={step}
              back={() => setStep(1)}
            />

            <StepDots step={step} />

            {/* STEP 1 */}

            {step === 1 && (

              <div className="mt-8">

                <h2 className="text-5xl font-extrabold tracking-tight text-slate-900">

                  Login

                </h2>

                <p className="mt-3 text-slate-600">

                  Enter your registered email address to
                  receive a one-time verification code.

                </p>

                <div className="mt-10">

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {

                      setEmail(e.target.value);

                      setError("");

                    }}
                    className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${
                      error
                        ? "border-red-400"
                        : "border-slate-200"
                    }`}
                  />

                  {error && (

                    <p className="mt-2 text-sm text-red-500">

                      {error}

                    </p>

                  )}

                </div>

                <div className="mt-10 flex justify-end">

                  <button
                    onClick={sendOTP}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-amber-700 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-amber-800 disabled:opacity-60"
                  >

                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {loading ? "Sending..." : "Continue"}

                  </button>

                </div>

              </div>

            )}

            {/* STEP 2 */}

            {step === 2 && (

              <div className="mt-8">

                <h2 className="text-2xl font-extrabold text-slate-900">

                  Verify your Email

                </h2>

                <p className="mt-3 text-slate-600">

                  We've sent a verification code to

                  <span className="font-bold text-slate-900">

                    {" "}

                    {email}

                  </span>

                </p>

                <div className="mt-8 flex gap-3">

                  {otp.map((digit, index) => (

                    <input
                      key={index}
                      ref={(el) =>
                        (otpRefs.current[index] = el)
                      }
                      value={digit}
                      onChange={(e) =>
                        handleOTPChange(
                          index,
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleOTPKeyDown(index, e)
                      }
                      maxLength={1}
                      inputMode="numeric"
                      className={`h-14 w-12 rounded-lg border text-center text-lg font-bold outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 ${
                        otpError
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    />

                  ))}

                </div>

                {otpError && (

                  <p className="mt-2 text-sm text-red-500">

                    {otpError}

                  </p>

                )}

                <div className="mt-5 text-sm">

                  {timer > 0 ? (

                    <span className="text-slate-500">

                      Resend OTP in {timer}s

                    </span>

                  ) : (

                    <button
                      onClick={resendOTP}
                      className="font-bold text-amber-700 hover:underline"
                    >

                      Resend OTP

                    </button>

                  )}

                </div>
                                <div className="mt-10 flex justify-between">

                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="rounded-lg bg-slate-100 px-8 py-3 text-sm font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                  >
                    Previous
                  </button>

                  <button
                    onClick={verifyOTP}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-amber-700 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-700/60"
                  >
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {loading ? "Logging In..." : "Login"}
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

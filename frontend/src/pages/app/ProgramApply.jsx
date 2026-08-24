import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle,
  User,
  Building2,
  ChevronRight,
  Loader,
} from "lucide-react";

/* ── Step indicator ── */
function StepIndicator({ currentStep, steps }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 28,
        background: COLORS.card,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
      }}
    >
      {steps.map((step, idx) => {
        const active = idx === currentStep;
        const done = idx < currentStep;
        return (
          <div
            key={idx}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 20px",
              background: active ? COLORS.primary : done ? `${COLORS.primary}18` : COLORS.card,
              borderRight: idx < steps.length - 1 ? `1px solid ${COLORS.border}` : "none",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: done
                  ? COLORS.primary
                  : active
                  ? "#fff"
                  : COLORS.border,
                color: done ? "#fff" : active ? COLORS.primary : COLORS.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {done ? <CheckCircle size={16} color="#fff" /> : idx + 1}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: active ? "#fff" : done ? COLORS.primary : COLORS.ink,
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: active ? "rgba(255,255,255,0.75)" : COLORS.muted,
                  marginTop: 1,
                }}
              >
                {step.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Form field renderer ── */
function FieldRenderer({ field, value, onChange }) {
  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: "var(--color-text-main, #0f172a)",
    fontFamily: "inherit",
    outline: "none",
    background: "var(--color-input-bg, #ffffff)",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const label = (
    <label
      style={{
        display: "block",
        fontWeight: 600,
        fontSize: 13.5,
        color: COLORS.ink,
        marginBottom: 7,
      }}
    >
      {field.label}
      {field.required && (
        <span style={{ color: COLORS.primary, marginLeft: 3 }}>*</span>
      )}
    </label>
  );

  if (field.type === "textarea") {
    return (
      <div style={{ marginBottom: 20 }}>
        {label}
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div style={{ marginBottom: 20 }}>
        {label}
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">Select an option</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div style={{ marginBottom: 20 }}>
        {label}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {field.options?.map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 14,
                color: COLORS.ink,
              }}
            >
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                style={{ accentColor: COLORS.primary, width: 16, height: 16 }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    const checked = Array.isArray(value) ? value : [];
    const toggle = (opt) => {
      const next = checked.includes(opt)
        ? checked.filter((v) => v !== opt)
        : [...checked, opt];
      onChange(next);
    };
    return (
      <div style={{ marginBottom: 20 }}>
        {label}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {field.options?.map((opt) => (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontSize: 14,
                color: COLORS.ink,
              }}
            >
              <input
                type="checkbox"
                checked={checked.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: COLORS.primary, width: 16, height: 16 }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div style={{ marginBottom: 20 }}>
        {label}
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        />
      </div>
    );
  }

  // default: text
  return (
    <div style={{ marginBottom: 20 }}>
      {label}
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
      />
    </div>
  );
}

/* ── Profile info display row ── */
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "11px 0",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <span
        style={{
          width: 160,
          flexShrink: 0,
          fontSize: 13,
          color: COLORS.muted,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 600, flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

export default function ProgramApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const r = await axios.get(`/programs/public/${id}`);
      if (r.data.status === 1) {
        if (r.data.myApplication) {
          toast.info("You have already applied to this program");
          navigate(`/programs/${id}`);
          return;
        }
        setProgram(r.data.program);
      } else {
        navigate("/programs");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validateStep1 = () => true; // Profile is read-only

  const validateStep2 = () => {
    for (const field of program?.custom_form_fields || []) {
      if (field.required) {
        const val = responses[field.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          toast.error(`Please fill in: ${field.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && validateStep1()) setStep(1);
    else if (step === 1 && validateStep2()) handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const custom_responses = (program?.custom_form_fields || []).map((f) => ({
        field_id: f.id,
        label: f.label,
        value: responses[f.id] ?? "",
      }));

      const r = await axios.post(`/programs/apply/${id}`, { custom_responses });
      if (r.data.status === 1) {
        setSubmitted(true);
        toast.success("Application submitted successfully!");
      } else {
        toast.error(r.data.msg || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const p = user?.profile || {};
  const steps = [
    { label: "Basic Information", sub: "Your profile details" },
    { label: program?.title || "Program Details", sub: "Program-specific questions" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
        <Sidebar />
        <main style={{ marginLeft: 300, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: COLORS.muted }}>Loading…</div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <Sidebar />
      <main
        className="ml-0 lg:ml-[300px] flex-1 pt-16 lg:pt-0 min-w-0 pb-16"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Topbar */}
        <div
          style={{
            background: COLORS.card,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "13px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {program?.logo && (
              <img
                src={program.logo}
                alt="logo"
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", border: `1px solid ${COLORS.border}` }}
              />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink }}>
                {program?.title}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                Application Form
              </div>
            </div>
          </div>
          <span
            style={{
              background: "rgba(230, 81, 0, 0.2)",
              color: "#fb923c",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 20,
            }}
          >
            Pending completion
          </span>
        </div>

        {submitted ? (
          <div
            style={{
              maxWidth: 540,
              margin: "80px auto",
              textAlign: "center",
              padding: "0 24px",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(46, 125, 50, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle size={36} color="#4ade80" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: COLORS.ink, margin: "0 0 10px" }}>
              Application Submitted!
            </h2>
            <p style={{ color: COLORS.muted, fontSize: 15, lineHeight: 1.6 }}>
              Your application for <strong>{program?.title}</strong> has been submitted successfully. The admin will review it and notify you.
            </p>
            <button
              onClick={() => navigate("/programs")}
              style={{
                marginTop: 24,
                background: COLORS.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back to Programs
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 36px" }}>
            {/* Step indicator */}
            <StepIndicator currentStep={step} steps={steps} />

            {/* Step 0 — Basic Profile Info */}
            {step === 0 && (
              <div
                style={{
                  background: COLORS.card,
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  padding: "26px 28px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    color: COLORS.ink,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Building2 size={18} color={COLORS.primary} />
                  About Company
                </div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>
                  This information is pulled from your profile and will be shared with the program team.
                </div>

                {/* Logo + basic */}
                <div style={{ display: "flex", gap: 20, marginBottom: 6 }}>
                  {p.logo && (
                    <img
                      src={p.logo}
                      alt="Company Logo"
                      style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: `1px solid ${COLORS.border}`, flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <InfoRow label="Company Name" value={user?.company_name} />
                    <InfoRow label="Your Name" value={user?.name} />
                    <InfoRow label="Email" value={user?.email} />
                    <InfoRow label="Phone" value={user?.phone} />
                    <InfoRow label="Company Type" value={user?.company_type} />
                    <InfoRow label="Company Size" value={p.company_size} />
                    <InfoRow label="Website" value={p.website} />
                    <InfoRow label="Year of Incorporation" value={p.year_of_incorporation?.toString()} />
                    <InfoRow label="Incorporated" value={p.is_incorporated ? "Yes" : "No"} />
                    <InfoRow label="Country" value={p.country} />
                    <InfoRow label="State" value={p.state} />
                    <InfoRow label="City" value={p.city} />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 14px",
                    background: "rgba(100, 116, 139, 0.08)",
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: COLORS.muted,
                    lineHeight: 1.5,
                  }}
                >
                  💡 To update this information, visit your{" "}
                  <span
                    onClick={() => navigate("/profile/edit")}
                    style={{ color: COLORS.primary, cursor: "pointer", fontWeight: 600 }}
                  >
                    profile settings
                  </span>
                  .
                </div>
              </div>
            )}

            {/* Step 1 — Program form fields */}
            {step === 1 && (
              <div
                style={{
                  background: COLORS.card,
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  padding: "26px 28px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    color: COLORS.ink,
                    marginBottom: 4,
                    paddingLeft: 12,
                    borderLeft: `3.5px solid ${COLORS.primary}`,
                  }}
                >
                  {program?.title}
                </div>
                {program?.short_description && (
                  <div style={{ fontSize: 13.5, color: COLORS.muted, marginBottom: 22, marginTop: 6 }}>
                    {program.short_description}
                  </div>
                )}

                {(program?.custom_form_fields || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.muted, fontSize: 14 }}>
                    No additional questions for this program.
                  </div>
                ) : (
                  (program?.custom_form_fields || [])
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={responses[field.id]}
                        onChange={(val) => handleFieldChange(field.id, val)}
                      />
                    ))
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 22,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => (step === 0 ? navigate(`/programs/${id}`) : setStep(0))}
                style={{
                  background: COLORS.card,
                  color: COLORS.ink,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: "12px 22px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {step === 0 ? "Cancel" : "← Previous Step"}
              </button>

              <button
                onClick={handleNext}
                disabled={submitting}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 28px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Loader size={15} style={{ animation: "spin 1s linear infinite" }} />
                    Submitting…
                  </>
                ) : step === 0 ? (
                  "Next Step →"
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

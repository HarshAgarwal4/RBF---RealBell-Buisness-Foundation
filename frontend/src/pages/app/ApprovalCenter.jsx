import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "../../services/axios.jsx";
import { useStore } from "../../zustand/store.jsx";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  UploadCloud,
  File,
  Trash2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Save,
  Send,
  Loader2,
  Sparkles,
  Info,
  LogOut,
  Building2,
  User,
  Mail,
  Phone,
  HelpCircle,
  Check,
} from "lucide-react";

const DEFAULT_FALLBACK_FIELDS = [
  {
    id: "f_legal_name",
    key: "legal_entity_name",
    label: "Registered Legal Entity / Organization Name",
    type: "text",
    placeholder: "e.g. Acme Innovations Pvt Ltd",
    required: true,
    description: "Official legal entity name as per incorporation or registration records.",
    gridCols: 2,
  },
  {
    id: "f_reg_number",
    key: "registration_number",
    label: "CIN / Registration / Tax ID Number",
    type: "text",
    placeholder: "e.g. U72900KA2024PTC123456",
    required: true,
    description: "Official government identification number.",
    gridCols: 2,
  },
  {
    id: "f_primary_sector",
    key: "primary_sector",
    label: "Primary Industry Sector",
    type: "select",
    options: [
      "FinTech & BFSI",
      "HealthTech & Life Sciences",
      "DeepTech & AI/ML",
      "Enterprise SaaS",
      "CleanTech & Energy",
      "AgriTech",
      "EdTech",
      "Consumer & Retail",
      "Logistics & Supply Chain",
      "Other Emerging Sector",
    ],
    required: true,
    description: "Select the primary operating domain.",
    gridCols: 2,
  },
  {
    id: "f_years_operating",
    key: "years_operating",
    label: "Years in Operation / Experience",
    type: "number",
    placeholder: "e.g. 2",
    required: true,
    validation: { min: 0, max: 100 },
    gridCols: 2,
  },
  {
    id: "f_website_url",
    key: "website_url",
    label: "Official Website or Portfolio URL",
    type: "url",
    placeholder: "https://yourventure.com",
    required: false,
    gridCols: 2,
  },
  {
    id: "f_headquarters_address",
    key: "headquarters_address",
    label: "Registered Office Address",
    type: "address",
    placeholder: "Full street address, City, State, PIN Code",
    required: true,
    gridCols: 2,
  },
  {
    id: "f_executive_summary",
    key: "executive_summary",
    label: "Operational Overview & Objective Statement",
    type: "textarea",
    placeholder: "Describe your core operations, value proposition, and key objectives on the platform...",
    required: true,
    validation: { minLength: 10, maxLength: 2000 },
    gridCols: 2,
  },
  {
    id: "f_id_proof",
    key: "identity_proof_doc",
    label: "Primary Authorized Representative ID Document",
    type: "file",
    required: true,
    description: "Upload Government ID (Passport, Aadhaar, Driver License, or Director ID).",
    validation: {
      allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
      maxFileSizeMB: 10,
    },
    gridCols: 2,
  },
  {
    id: "f_incorporation_doc",
    key: "incorporation_certificate",
    label: "Certificate of Incorporation / Registration Proof",
    type: "file",
    required: true,
    description: "Official registration certificate or tax documentation.",
    validation: {
      allowedFileTypes: ["pdf", "jpg", "jpeg", "png"],
      maxFileSizeMB: 15,
    },
    gridCols: 2,
  },
  {
    id: "f_terms_confirmation",
    key: "terms_confirmation",
    label: "I confirm that all information and documents provided are authentic and accurate.",
    type: "terms",
    required: true,
    description: "False representation may lead to immediate deactivation under Foundation Bylaws.",
    gridCols: 2,
  },
];

export default function ApprovalCenter() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);

  const [approvalData, setApprovalData] = useState({
    approvalStatus: "Pending Form",
    form: null,
    submission: null,
  });

  const [responses, setResponses] = useState({});
  const [documents, setDocuments] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/approvals/my-status");
      if (res.data?.status === 1) {
        const data = res.data;
        setApprovalData(data);
        if (data.submission?.responses) {
          setResponses(data.submission.responses);
        }
        if (Array.isArray(data.submission?.documents)) {
          setDocuments(data.submission.documents);
        }
        if (data.user) {
          setUser({ ...user, ...data.user });
        }
      } else {
        toast.error(res.data?.msg || "Failed to load approval status.");
      }
    } catch (err) {
      console.error("Error fetching approval status:", err);
      toast.error("Failed to connect to verification server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFieldChange = (key, val) => {
    setResponses((prev) => ({ ...prev, [key]: val }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleFileUpload = async (fieldKey, fieldLabel, file) => {
    if (!file) return;

    // Check size limit (15MB default)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must not exceed 15MB");
      return;
    }

    setUploadingDocKey(fieldKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldKey", fieldKey);
      formData.append("fieldLabel", fieldLabel);

      const res = await axios.post("/approvals/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === 1 && res.data.document) {
        const newDoc = res.data.document;
        setDocuments((prev) => {
          const filtered = prev.filter((d) => d.fieldKey !== fieldKey);
          return [...filtered, newDoc];
        });
        setResponses((prev) => ({ ...prev, [fieldKey]: newDoc.fileUrl }));
        toast.success(`${fieldLabel} uploaded successfully!`);
        if (formErrors[fieldKey]) {
          setFormErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
        }
      } else {
        toast.error(res.data?.msg || "Failed to upload document");
      }
    } catch (err) {
      console.error("File upload error:", err);
      toast.error("Error uploading file to storage");
    } finally {
      setUploadingDocKey(null);
    }
  };

  const handleRemoveDoc = (fieldKey) => {
    setDocuments((prev) => prev.filter((d) => d.fieldKey !== fieldKey));
    setResponses((prev) => {
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await axios.post("/approvals/my-submission/draft", {
        responses,
        documents,
      });
      if (res.data?.status === 1) {
        toast.success("Draft progress saved successfully.");
      } else {
        toast.error(res.data?.msg || "Failed to save draft.");
      }
    } catch (err) {
      console.error("Save draft error:", err);
      toast.error("Failed to save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const res = await axios.post("/approvals/my-submission/submit", {
        responses,
        documents,
        formId: approvalData.form?._id,
      });

      if (res.data?.status === 1) {
        toast.success(res.data.msg || "Application submitted for Super Admin review!");
        await fetchStatus();
      } else {
        if (res.data?.errors) {
          setFormErrors(res.data.errors);
        }
        toast.error(res.data?.msg || "Please check the form for errors.");
      }
    } catch (err) {
      console.error("Submit approval error:", err);
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
      toast.error(err.response?.data?.msg || "Failed to submit verification form.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
      setUser(null);
      navigate("/login");
    } catch {
      setUser(null);
      navigate("/login");
    }
  };

  const currentStatus = approvalData.approvalStatus || user?.approvalStatus || "Pending Form";
  const rawFields = approvalData.form?.fields;
  const formFields = Array.isArray(rawFields) && rawFields.length > 0 ? rawFields : DEFAULT_FALLBACK_FIELDS;
  const submission = approvalData.submission;

  // Calculate Form Completion %
  const requiredFields = formFields.filter((f) => f.required);
  const completedRequired = requiredFields.filter((f) => {
    if (f.type === "file" || f.type === "image") {
      return documents.some((d) => d.fieldKey === f.key);
    }
    const val = responses[f.key];
    return val !== undefined && val !== null && String(val).trim() !== "";
  });
  const completionPercentage =
    requiredFields.length > 0
      ? Math.round((completedRequired.length / requiredFields.length) * 100)
      : 100;

  // Stepper state
  const steps = [
    { num: 1, label: "Account Created", done: true },
    {
      num: 2,
      label: "Approval Form",
      done: currentStatus !== "Pending Form",
      active: currentStatus === "Pending Form" || currentStatus === "Changes Requested",
    },
    {
      num: 3,
      label: "Admin Review",
      done: currentStatus === "Approved",
      active: currentStatus === "Form Submitted" || currentStatus === "Under Review",
    },
    {
      num: 4,
      label: "Account Approved",
      done: currentStatus === "Approved",
      active: currentStatus === "Approved",
    },
    {
      num: 5,
      label: "Dashboard Access",
      done: currentStatus === "Approved",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading your ecosystem approval center...</p>
      </div>
    );
  }

  const isReadOnly = currentStatus === "Form Submitted" || currentStatus === "Under Review" || currentStatus === "Approved";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="RealBell" className="h-8 w-8 rounded-lg bg-white p-1" />
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              REAL<span className="text-amber-500">BELL</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Approval Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white">{user?.name || "Account"}</span>
            <span className="text-[10px] text-slate-400">{user?.company_name || "Organization"} ({user?.company_type?.toUpperCase() || "STARTUP"})</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Onboarding Progress Stepper */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
                Ecosystem Verification & Approval
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                RealBell Business Foundation operates a verified institutional network. Super Admin approval is required for full ecosystem access.
              </p>
            </div>

            {submission?.applicationId && (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
                <span className="text-[11px] text-slate-400">Application ID:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{submission.applicationId}</span>
              </div>
            )}
          </div>

          {/* Stepper Progress Visualizer */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {steps.map((st) => (
              <div
                key={st.num}
                className={`p-3 rounded-xl border text-center transition-all ${
                  st.done
                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                    : st.active
                    ? "bg-amber-950/40 border-amber-600/60 text-amber-300 ring-1 ring-amber-500/40"
                    : "bg-slate-950/60 border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold mb-1">
                  {st.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : st.active ? (
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-400">
                      {st.num}
                    </span>
                  )}
                  <span>Step {st.num}</span>
                </div>
                <div className="text-[11px] font-medium truncate">{st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS NOTICES */}

        {/* 1. APPROVED STATE BANNER */}
        {currentStatus === "Approved" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4 shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Your Account is Approved!</h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto mt-2">
                Super Admin has verified your organization credentials. You have full access to the RealBell ecosystem dashboard.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <span>Enter Ecosystem Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* 2. UNDER REVIEW / FORM SUBMITTED STATE */}
        {(currentStatus === "Form Submitted" || currentStatus === "Under Review") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-8 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Under Super Admin Review
                  </span>
                  <span className="text-xs text-slate-400">
                    Submitted on {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Verification Application is in the Review Queue
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Your verification form and uploaded credentials have been securely delivered to the Super Admin review desk. Most applications are reviewed within 24–48 business hours. You will receive an automated email as soon as access is granted.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Need urgent clearance? Contact <a href="mailto:support@realbell.org" className="text-amber-400 underline">support@realbell.org</a></span>
              <button
                onClick={fetchStatus}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. CHANGES REQUESTED STATE */}
        {currentStatus === "Changes Requested" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 sm:p-6 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3 shadow-xl"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">
                  Action Required: Information Update Requested
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Super Admin Requested Corrections
                </h3>
                <div className="mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs sm:text-sm text-amber-200 whitespace-pre-wrap font-medium">
                  {submission?.adminFeedback || "Please review and update the required document/field details below."}
                </div>
                <p className="text-xs text-slate-300 pt-1">
                  Please update the highlighted fields below and click <strong>"Update & Resubmit Application"</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. REJECTED STATE */}
        {currentStatus === "Rejected" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-8 rounded-2xl bg-red-950/30 border border-red-500/40 space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  Application Not Approved
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Account Verification Unsuccessful
                </h2>
                <div className="mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-red-500/30 text-xs sm:text-sm text-red-200 whitespace-pre-wrap font-medium">
                  {submission?.rejectionReason || "Credentials provided did not meet the ecosystem minimum compliance criteria."}
                </div>
                <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                  You may update your details below and resubmit for an appeal review, or contact foundation support at <a href="mailto:support@realbell.org" className="text-red-400 underline">support@realbell.org</a>.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* VERIFICATION FORM CONTAINER */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                {approvalData.form?.title || "Organization Verification Form"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {approvalData.form?.description || "Provide verified organizational details and documentation for Super Admin review."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Completion</span>
                <div className="text-xs font-bold text-amber-400">{completionPercentage}% Completed</div>
              </div>
              <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Read-Only Notice if Under Review or Approved */}
          {isReadOnly && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                {currentStatus === "Approved"
                  ? "Your submitted credentials and documentation are verified and active."
                  : "Form is currently locked for review. You can inspect your submitted responses below."}
              </span>
            </div>
          )}

          {/* FORM FIELDS RENDERER */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {formFields.map((field) => {
                const val = responses[field.key];
                const err = formErrors[field.key];
                const gridSpan = field.gridCols === 2 ? "md:col-span-2" : "md:col-span-1";

                return (
                  <div key={field.id || field.key} className={`${gridSpan} space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                        <span>{field.label}</span>
                        {field.required && <span className="text-amber-500">*</span>}
                      </label>
                    </div>

                    {field.description && (
                      <p className="text-[11px] text-slate-400 leading-snug">{field.description}</p>
                    )}

                    {/* TEXT / EMAIL / PHONE / URL */}
                    {(field.type === "text" ||
                      field.type === "email" ||
                      field.type === "phone" ||
                      field.type === "url") && (
                      <input
                        type={field.type === "phone" ? "tel" : field.type}
                        disabled={isReadOnly}
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label}...`}
                        className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition ${
                          err
                            ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
                            : "border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      />
                    )}

                    {/* NUMBER */}
                    {field.type === "number" && (
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || "0"}
                        min={field.validation?.min !== null ? field.validation?.min : undefined}
                        max={field.validation?.max !== null ? field.validation?.max : undefined}
                        className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition ${
                          err
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-800 focus:border-amber-500"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      />
                    )}

                    {/* DATE */}
                    {field.type === "date" && (
                      <input
                        type="date"
                        disabled={isReadOnly}
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    )}

                    {/* TEXTAREA / ADDRESS */}
                    {(field.type === "textarea" || field.type === "address") && (
                      <textarea
                        rows={field.type === "address" ? 2 : 3}
                        disabled={isReadOnly}
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label}...`}
                        className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition ${
                          err
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-800 focus:border-amber-500"
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      />
                    )}

                    {/* SELECT DROPDOWN */}
                    {field.type === "select" && (
                      <select
                        disabled={isReadOnly}
                        value={val !== undefined ? val : ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select an option --</option>
                        {(field.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* MULTISELECT */}
                    {field.type === "multiselect" && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(field.options || []).map((opt, i) => {
                            const selectedList = Array.isArray(val) ? val : [];
                            const isChecked = selectedList.includes(opt);
                            return (
                              <button
                                type="button"
                                key={i}
                                disabled={isReadOnly}
                                onClick={() => {
                                  if (isReadOnly) return;
                                  const next = isChecked
                                    ? selectedList.filter((item) => item !== opt)
                                    : [...selectedList, opt];
                                  handleFieldChange(field.key, next);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  isChecked
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                                } disabled:cursor-not-allowed`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CHECKBOX / RADIO */}
                    {(field.type === "checkbox" || field.type === "radio") && (
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={Boolean(val)}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-slate-300 font-medium">{field.placeholder || "I agree / confirmed"}</span>
                      </label>
                    )}

                    {/* TERMS CONFIRMATION */}
                    {field.type === "terms" && (
                      <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={Boolean(val)}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="mt-0.5 rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-200 leading-relaxed font-medium">
                          {field.label}
                        </span>
                      </label>
                    )}

                    {/* FILE / DOCUMENT / IMAGE UPLOAD */}
                    {(field.type === "file" || field.type === "image") && (
                      <div className="space-y-2">
                        {(() => {
                          const attachedDoc = documents.find((d) => d.fieldKey === field.key);

                          if (attachedDoc) {
                            return (
                              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-600/40 text-xs">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <File className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-semibold text-white">{attachedDoc.fileName}</span>
                                    <span className="text-[10px] text-slate-400 ml-2">
                                      ({Math.round((attachedDoc.fileSize || 0) / 1024)} KB)
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <a
                                    href={attachedDoc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                                    title="View Document"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDoc(field.key)}
                                      className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/60 transition cursor-pointer"
                                      title="Remove / Replace"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div>
                              <label
                                className={`flex flex-col items-center justify-center p-5 rounded-xl border border-dashed text-center transition cursor-pointer ${
                                  err
                                    ? "border-red-500 bg-red-950/10"
                                    : "border-slate-800 bg-slate-950/70 hover:border-amber-500/50 hover:bg-slate-950"
                                } ${isReadOnly ? "opacity-50 pointer-events-none" : ""}`}
                              >
                                {uploadingDocKey === field.key ? (
                                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Uploading to secure cloud vault...</span>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud className="w-6 h-6 text-slate-500 mb-1.5" />
                                    <span className="text-xs font-semibold text-slate-300">
                                      Click to Upload {field.label}
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">
                                      PDF, DOCX, JPG, PNG (Max {field.validation?.maxFileSizeMB || 10}MB)
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  disabled={isReadOnly || uploadingDocKey === field.key}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(field.key, field.label, file);
                                  }}
                                  className="hidden"
                                  accept={
                                    field.type === "image"
                                      ? "image/*,.png,.jpg,.jpeg,.webp"
                                      : ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.csv,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                                  }
                                />
                              </label>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Error text */}
                    {err && <p className="text-[11px] text-red-400 font-medium">{err}</p>}
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTONS (Editable states) */}
            {!isReadOnly && (
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={savingDraft || submitting}
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Draft</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting || savingDraft}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-600/20 transition cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>
                    {currentStatus === "Changes Requested"
                      ? "Update & Resubmit Application"
                      : currentStatus === "Rejected"
                      ? "Appeal & Resubmit Application"
                      : "Submit Verification Form"}
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RealBell Business Foundation. Institutional Gated Ecosystem.
      </footer>
    </div>
  );
}

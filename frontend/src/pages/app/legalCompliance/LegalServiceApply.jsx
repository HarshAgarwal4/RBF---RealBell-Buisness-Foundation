import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import axios from "../../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";
import { COLORS } from "../../../components/colors";
import {
  Scale,
  ArrowLeft,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Lock,
  ChevronRight,
  Info,
  Loader2,
  ExternalLink,
} from "lucide-react";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function LegalServiceApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(""); // "uploading", "payment", "verifying", "success"

  // Form state: { [field_id]: value }
  const [formData, setFormData] = useState({});
  // Form errors: { [field_id]: errorMessage }
  const [formErrors, setFormErrors] = useState({});

  // Document state: { [doc_id]: File }
  const [uploadedFiles, setUploadedFiles] = useState({});
  // Drag over states: { [doc_id]: boolean }
  const [dragOver, setDragOver] = useState({});

  const fileInputRefs = useRef({});

  // Fetch Service Details
  useEffect(() => {
    async function fetchService() {
      try {
        setLoading(true);
        const res = await axios.get(`/legal-compliance/services/detail/${id}`);
        if (res.data?.status === 1) {
          const s = res.data.service;
          setService(s);

          // Prepopulate default form responses from user profile if matched
          const initialData = {};
          (s.form_fields || []).forEach((field) => {
            if (field.name.includes("applicant_name") || field.name.includes("owner_name")) {
              initialData[field.id] = user?.name || "";
            } else if (field.name.includes("business_name") || field.name.includes("enterprise_name") || field.name.includes("company_name")) {
              initialData[field.id] = user?.company_name || "";
            } else if (field.name.includes("phone") || field.name.includes("contact")) {
              initialData[field.id] = user?.phone || "";
            } else if (field.name.includes("email")) {
              initialData[field.id] = user?.email || "";
            } else if (field.type === "checkbox") {
              initialData[field.id] = [];
            } else {
              initialData[field.id] = "";
            }
          });
          setFormData(initialData);
        } else {
          toast.error("Service not found or inactive");
          navigate("/legal-compliances");
        }
      } catch (err) {
        console.error("Failed to load service:", err);
        toast.error("Failed to load service details");
        navigate("/legal-compliances");
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id, user, navigate]);

  // Handle Form Input Change
  const handleFieldChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Handle Checkbox Array Change
  const handleCheckboxChange = (fieldId, option, checked) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, option] };
      } else {
        return { ...prev, [fieldId]: current.filter((item) => item !== option) };
      }
    });
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Handle File Selection
  const handleFileSelect = (docId, file) => {
    if (!file) return;

    const reqDoc = service.required_documents.find((d) => d.id === docId);
    const maxSize = (reqDoc?.max_size_mb || 10) * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`File size exceeds maximum limit of ${reqDoc?.max_size_mb || 10} MB`);
      return;
    }

    setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
  };

  const handleRemoveFile = (docId) => {
    setUploadedFiles((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    if (fileInputRefs.current[docId]) {
      fileInputRefs.current[docId].value = "";
    }
  };

  // Validate entire form & documents
  const validate = () => {
    const errors = {};

    // Validate form fields
    (service.form_fields || []).forEach((field) => {
      const val = formData[field.id];
      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === "" || (Array.isArray(val) && val.length === 0)) {
          errors[field.id] = `"${field.label}" is required`;
        }
      }

      if (val && field.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          errors[field.id] = "Please enter a valid email address";
        }
      }

      if (val && field.type === "phone") {
        const clean = String(val).replace(/\D/g, "");
        if (clean.length < 10 || clean.length > 13) {
          errors[field.id] = "Please enter a valid 10-digit mobile number";
        }
      }
    });

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fill in all required form fields correctly.");
      return false;
    }

    // Validate required documents
    for (const doc of service.required_documents || []) {
      if (doc.required && !uploadedFiles[doc.id]) {
        toast.error(`Please upload the mandatory document: "${doc.name}"`);
        return false;
      }
    }

    return true;
  };

  // Submit Application Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmissionStep("uploading");

    try {
      // 1. Prepare FormData with fields & files
      const payload = new FormData();
      payload.append("service_id", service._id);

      // Structure form responses array
      const responsesArray = (service.form_fields || []).map((f) => ({
        field_id: f.id,
        field_name: f.name,
        label: f.label,
        value: formData[f.id] ?? "",
      }));
      payload.append("form_responses", JSON.stringify(responsesArray));

      // Append documents
      Object.entries(uploadedFiles).forEach(([docId, file]) => {
        // Field name convention matches backend
        payload.append(`doc_${docId}`, file);
      });

      // Submit application
      const res = await axios.post("/legal-compliance/applications", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status !== 1) {
        toast.error(res.data?.msg || "Failed to submit application");
        setSubmitting(false);
        setSubmissionStep("");
        return;
      }

      const createdApp = res.data.application;
      const isPaymentReq = res.data.is_payment_required;

      // If service is free or payment not required:
      if (!isPaymentReq) {
        setSubmissionStep("success");
        toast.success("🎉 Application submitted successfully!");
        setTimeout(() => {
          navigate("/legal-compliances/my-applications");
        }, 1500);
        return;
      }

      // If Payment is required: proceed to Razorpay Checkout
      setSubmissionStep("payment");

      const orderRes = await axios.post("/legal-compliance/applications/payment/order", {
        applicationId: createdApp._id,
      });

      if (orderRes.data?.status !== 1) {
        toast.error(orderRes.data?.msg || "Failed to initialize payment gateway");
        setSubmitting(false);
        setSubmissionStep("");
        return;
      }

      const { order, key_id } = orderRes.data;

      // Load Razorpay Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Please check internet connection.");
        setSubmitting(false);
        setSubmissionStep("");
        return;
      }

      // Open Razorpay Checkout Modal
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "RealBell Business Foundation",
        description: `Legal Compliance: ${service.title}`,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: COLORS.primary,
        },
        modal: {
          ondismiss: () => {
            toast.warn("Payment was not completed. You can retry from My Applications.");
            setSubmitting(false);
            setSubmissionStep("");
            navigate("/legal-compliances/my-applications");
          },
        },
        handler: async function (response) {
          setSubmissionStep("verifying");
          try {
            const verifyRes = await axios.post("/legal-compliance/applications/payment/verify", {
              applicationId: createdApp._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.status === 1) {
              setSubmissionStep("success");
              toast.success("🎉 Payment verified! Application submitted for review.");
              setTimeout(() => {
                navigate("/legal-compliances/my-applications");
              }, 1800);
            } else {
              toast.error(verifyRes.data?.msg || "Payment verification failed");
              setSubmitting(false);
              setSubmissionStep("");
            }
          } catch (err) {
            console.error("Payment verify error:", err);
            toast.error("Failed to verify payment on backend");
            setSubmitting(false);
            setSubmissionStep("");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Application submission error:", err);
      toast.error(err.response?.data?.message || err.response?.data?.msg || "Failed to submit application");
      setSubmitting(false);
      setSubmissionStep("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <Sidebar />
        <main className="flex-1 lg:pl-[300px] flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#B52B2B]" size={36} />
            <div className="text-sm font-semibold text-[#64748B]">Loading compliance application...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!service) return null;

  const isFree = !service.is_payment_required || service.fee === 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#1E293B] dark:text-[#E2E8F0] font-sans">
      <Sidebar />

      <main className="flex-1 lg:pl-[300px] pt-16 lg:pt-0 min-h-screen flex flex-col">
        {/* Top Sticky Header */}
        <div className="bg-white dark:bg-[#111827] border-b border-[#E2E8F0] dark:border-[#1F2937] px-6 lg:px-10 py-5 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/legal-compliances")}
                className="h-9 w-9 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="text-[11px] font-bold text-[#B52B2B] uppercase tracking-wider">
                  {service.category || "Legal Compliance Application"}
                </div>
                <h1 className="text-lg lg:text-xl font-extrabold text-[#0F172A] dark:text-white line-clamp-1">
                  Apply for {service.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Service Fee</div>
                <div className="text-base font-extrabold text-[#0F172A] dark:text-white">
                  {isFree ? <span className="text-[#16A34A]">FREE</span> : `₹${Number(service.fee).toLocaleString("en-IN")}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Form Body */}
        <div className="flex-1 px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Service Summary Card */}
            <div className="rounded-2xl bg-gradient-to-br from-white to-[#FFF5F6] dark:from-[#111827] dark:to-[#181116] border border-[#F0D5D8] dark:border-[#3A1E24] p-6 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                    {service.title}
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                    {service.description || service.short_description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-xs font-semibold text-[#475569] dark:text-[#CBD5E1]">
                    <Clock size={14} className="text-[#B52B2B]" /> {service.processing_time || "3-5 Business Days"}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F6E9EB] text-xs font-bold text-[#B52B2B]">
                    <ShieldCheck size={14} /> Official Filing
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Dynamic Form Fields */}
            {service.form_fields && service.form_fields.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] p-6 lg:p-8 shadow-2xs">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#F1F5F9] dark:border-[#1F2937]">
                  <div className="h-7 w-7 rounded-lg bg-[#F6E9EB] flex items-center justify-center text-[#B52B2B] text-xs font-bold">
                    1
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                    Application Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {service.form_fields.map((field) => {
                    const error = formErrors[field.id];
                    const isFullWidth = field.type === "textarea" || (service.form_fields.length % 2 !== 0 && field.order === service.form_fields.length);

                    return (
                      <div
                        key={field.id}
                        className={`flex flex-col gap-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}
                      >
                        <label className="text-xs font-bold text-[#334155] dark:text-[#CBD5E1] flex items-center justify-between">
                          <span>
                            {field.label} {field.required && <span className="text-[#B52B2B]">*</span>}
                          </span>
                        </label>

                        {/* Input Type Renderers */}
                        {field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" ? (
                          <input
                            type={field.type === "phone" ? "tel" : field.type}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none transition ${
                              error
                                ? "border-red-500 ring-2 ring-red-500/10"
                                : "border-[#CBD5E1] dark:border-[#334155] focus:border-[#B52B2B] focus:ring-2 focus:ring-[#B52B2B]/20"
                            }`}
                          />
                        ) : field.type === "date" ? (
                          <input
                            type="date"
                            value={formData[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none transition ${
                              error
                                ? "border-red-500 ring-2 ring-red-500/10"
                                : "border-[#CBD5E1] dark:border-[#334155] focus:border-[#B52B2B] focus:ring-2 focus:ring-[#B52B2B]/20"
                            }`}
                          />
                        ) : field.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={formData[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || `Enter details for ${field.label.toLowerCase()}`}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none transition resize-y ${
                              error
                                ? "border-red-500 ring-2 ring-red-500/10"
                                : "border-[#CBD5E1] dark:border-[#334155] focus:border-[#B52B2B] focus:ring-2 focus:ring-[#B52B2B]/20"
                            }`}
                          />
                        ) : field.type === "select" ? (
                          <select
                            value={formData[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none transition ${
                              error
                                ? "border-red-500 ring-2 ring-red-500/10"
                                : "border-[#CBD5E1] dark:border-[#334155] focus:border-[#B52B2B] focus:ring-2 focus:ring-[#B52B2B]/20"
                            }`}
                          >
                            <option value="">{field.placeholder || "Select option..."}</option>
                            {(field.options || []).map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "radio" ? (
                          <div className="flex flex-wrap gap-3 mt-1">
                            {(field.options || []).map((opt, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-xs font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer hover:border-[#B52B2B]"
                              >
                                <input
                                  type="radio"
                                  name={field.id}
                                  value={opt}
                                  checked={formData[field.id] === opt}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  className="accent-[#B52B2B]"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : field.type === "checkbox" ? (
                          <div className="flex flex-wrap gap-3 mt-1">
                            {(field.options || []).map((opt, i) => {
                              const isChecked = Array.isArray(formData[field.id]) && formData[field.id].includes(opt);
                              return (
                                <label
                                  key={i}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-xs font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer hover:border-[#B52B2B]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                                    className="accent-[#B52B2B]"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : null}

                        {error && <span className="text-[11px] font-semibold text-red-500">{error}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Dynamic Document Upload Section */}
            {service.required_documents && service.required_documents.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] p-6 lg:p-8 shadow-2xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F1F5F9] dark:border-[#1F2937]">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#F6E9EB] flex items-center justify-center text-[#B52B2B] text-xs font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                        Required Documents & Proofs
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                        Upload clear scanned copies in PDF, JPG, PNG or DOCX format.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.required_documents.map((doc) => {
                    const uploaded = uploadedFiles[doc.id];
                    const isDragging = !!dragOver[doc.id];

                    return (
                      <div
                        key={doc.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver((prev) => ({ ...prev, [doc.id]: true }));
                        }}
                        onDragLeave={() => setDragOver((prev) => ({ ...prev, [doc.id]: false }))}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver((prev) => ({ ...prev, [doc.id]: false }));
                          if (e.dataTransfer.files?.[0]) {
                            handleFileSelect(doc.id, e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative rounded-2xl border p-4 transition flex flex-col justify-between ${
                          uploaded
                            ? "bg-[#F0FDF4] dark:bg-[#052E16]/20 border-[#86EFAC] dark:border-[#15803D]"
                            : isDragging
                            ? "bg-[#F6E9EB] border-[#B52B2B] border-dashed"
                            : "bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] border-dashed hover:border-[#B52B2B]"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                                {doc.name}
                                {doc.required ? (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                    REQUIRED
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    OPTIONAL
                                  </span>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                                  {doc.description}
                                </p>
                              )}
                            </div>

                            {uploaded && (
                              <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
                            )}
                          </div>

                          {/* Uploaded File Info */}
                          {uploaded ? (
                            <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-[#DCFCE7] dark:border-[#166534] flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="text-[#16A34A] shrink-0" />
                                <div className="truncate">
                                  <div className="text-xs font-semibold text-[#0F172A] dark:text-white truncate">
                                    {uploaded.name}
                                  </div>
                                  <div className="text-[10px] text-[#64748B]">
                                    {formatBytes(uploaded.size)}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFile(doc.id)}
                                className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {/* Upload trigger button */}
                        {!uploaded && (
                          <div className="mt-4">
                            <input
                              type="file"
                              ref={(el) => (fileInputRefs.current[doc.id] = el)}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileSelect(doc.id, e.target.files[0]);
                                }
                              }}
                              accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[doc.id]?.click()}
                              className="w-full py-2 px-3 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] text-xs font-bold text-[#334155] dark:text-[#E2E8F0] flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              <UploadCloud size={14} className="text-[#B52B2B]" /> Choose or Drop File
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Summary & Submission / Checkout */}
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1F2937] p-6 lg:p-8 shadow-2xs">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Total Payable Amount
                  </div>
                  <div className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] dark:text-white mt-1 flex items-center gap-2">
                    {isFree ? (
                      <span className="text-[#16A34A]">₹0 (Free Service)</span>
                    ) : (
                      <>
                        ₹{Number(service.fee).toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-[#64748B]">
                          (Inclusive of all taxes & processing)
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-[#16A34A]" /> 256-Bit Encrypted Secure Processing
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate("/legal-compliances")}
                    disabled={submitting}
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-bold text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#B52B2B] hover:bg-[#9B1B2A] text-white text-sm font-extrabold transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        {submissionStep === "uploading"
                          ? "Uploading Documents..."
                          : submissionStep === "payment"
                          ? "Awaiting Payment..."
                          : submissionStep === "verifying"
                          ? "Verifying Payment..."
                          : "Processing..."}
                      </>
                    ) : isFree ? (
                      <>Submit Application</>
                    ) : (
                      <>
                        <CreditCard size={16} /> Pay ₹{Number(service.fee).toLocaleString("en-IN")} & Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

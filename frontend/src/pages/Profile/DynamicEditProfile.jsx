import React, { useState, useEffect } from "react";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Save } from "lucide-react";

export default function DynamicEditProfile({ profile = {}, roleKey }) {
  const { fetchUser } = useStore();
  const [roleData, setRoleData] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let initialData = {};
    if (typeof profile === "string") {
      try {
        initialData = JSON.parse(profile);
      } catch {
        initialData = {};
      }
    } else {
      initialData = profile || {};
    }

    setFormData(initialData);

    async function loadRoleSchema() {
      try {
        setLoadingRole(true);
        const res = await axios.get("/roles");
        if (res.data.status === 1) {
          const matched = res.data.roles.find((r) => r.key === roleKey);
          setRoleData(matched || null);
        }
      } catch (err) {
        console.error("Error loading role schema:", err);
      } finally {
        setLoadingRole(false);
      }
    }

    if (roleKey) {
      loadRoleSchema();
    }
  }, [roleKey, profile]);

  const handleChange = (fieldKey, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleMultiSelectToggle = (fieldKey, option) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : [];
      const exists = current.includes(option);
      const updated = exists ? current.filter((item) => item !== option) : [...current, option];
      return { ...prev, [fieldKey]: updated };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("profile", JSON.stringify(formData));

      const res = await axios.post("/update-profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === 1) {
        toast.success(res.data.msg || "Profile updated successfully!");
        if (fetchUser) fetchUser();
      } else {
        toast.error(res.data.msg || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loadingRole) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    );
  }

  const steps = roleData?.profileSchema?.steps || [];
  const uiConfig = roleData?.uiConfig || {};
  const accentColor = uiConfig.accentColor || "#d97706";
  const bannerTitle = uiConfig.bannerTitle || `${roleData?.label || roleKey} Profile`;
  const bannerSubtitle = uiConfig.bannerSubtitle || "Manage your profile details and information.";

  if (steps.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-800">{bannerTitle}</h3>
          <p className="mt-2 text-sm text-slate-500">
            No specific profile schema configured for role "{roleData?.label || roleKey}".
          </p>
        </div>
      </div>
    );
  }

  const currentStep = steps[activeStepIdx] || steps[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] lg:ml-75 pt-20 lg:pt-10 px-4 sm:px-6 md:px-8 lg:px-10 pb-6 sm:pb-8 font-sans transition-colors">
      {/* Header Banner */}
      <div className="mb-6 sm:mb-8">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: accentColor }}
        >
          {roleData?.label || roleKey}
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{bannerTitle}</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{bannerSubtitle}</p>
      </div>

      {/* Multi-step Navigation Stepper */}
      {steps.length > 1 && (
        <div className="mb-6 sm:mb-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] p-3 sm:p-4 rounded-xl shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-max sm:min-w-0">
            {steps.map((step, idx) => {
              const isActive = idx === activeStepIdx;
              const isCompleted = idx < activeStepIdx;
              return (
                <button
                  key={step.stepId || idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`flex flex-1 items-center gap-3 border-b-2 py-3 px-4 text-left transition-all ${
                    isActive
                      ? "font-bold text-slate-900 dark:text-slate-100"
                      : isCompleted
                      ? "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  style={{
                    borderColor: isActive ? accentColor : undefined,
                  }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-colors"
                    style={{
                      backgroundColor: isActive ? accentColor : isCompleted ? "#334155" : "#64748b",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </span>
                  <span className="truncate text-sm">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Form Container */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] p-6 shadow-sm sm:p-8">
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentStep.title}</h2>
          {currentStep.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentStep.description}</p>}
        </div>

        {/* Dynamic Fields Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {currentStep.fields?.map((field) => {
            const isFullWidth = field.gridCols === 2 || field.type === "textarea" || field.type === "multiselect";
            const val = formData[field.key] ?? "";

            return (
              <div key={field.key} className={isFullWidth ? "sm:col-span-2" : "sm:col-span-1"}>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {/* Text / URL / Date / Number */}
                {["text", "url", "date", "number"].includes(field.type) && (
                  <input
                    type={field.type}
                    value={val}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-2"
                  />
                )}

                {/* Textarea */}
                {field.type === "textarea" && (
                  <textarea
                    rows={4}
                    value={val}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-2"
                  />
                )}

                {/* Select */}
                {field.type === "select" && (
                  <select
                    value={val}
                    required={field.required}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-2"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {/* Multi-Select Tags */}
                {field.type === "multiselect" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {field.options?.map((opt) => {
                      const selected = Array.isArray(val) && val.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleMultiSelectToggle(field.key, opt)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                            selected ? "text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          style={{
                            backgroundColor: selected ? accentColor : undefined,
                          }}
                        >
                          {selected ? `✓ ${opt}` : `+ ${opt}`}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Checkbox */}
                {field.type === "checkbox" && (
                  <label className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleChange(field.key, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                      style={{ accentColor }}
                    />
                    <span className="text-sm font-medium text-slate-700">{field.placeholder || field.label}</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
          <div>
            {activeStepIdx > 0 && (
              <button
                type="button"
                onClick={() => setActiveStepIdx((prev) => prev - 1)}
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeStepIdx < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStepIdx((prev) => prev + 1)}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

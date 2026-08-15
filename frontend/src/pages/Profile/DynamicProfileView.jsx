import React, { useState, useEffect } from "react";
import axios from "../../services/axios";
import { Loader2, Globe, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function DynamicProfileView({ profile = {}, roleKey, isOwn = true }) {
  const [roleData, setRoleData] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [parsedData, setParsedData] = useState({});

  useEffect(() => {
    let data = {};
    if (typeof profile === "string") {
      try {
        data = JSON.parse(profile);
      } catch {
        data = {};
      }
    } else {
      data = profile || {};
    }
    setParsedData(data);

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

  return (
    <div className="min-h-screen bg-[#F4F6F9] lg:ml-75 pt-20 lg:pt-10 px-4 sm:px-6 md:px-8 lg:px-10 pb-6 sm:pb-8 font-sans">
      {/* Profile Banner */}
      <div className="mb-6 sm:mb-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accentColor }}
            >
              {roleData?.label || roleKey}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              {parsedData.company_name || parsedData.name || "Profile Details"}
            </h1>
            {parsedData.tagline && <p className="mt-1 text-base text-slate-600">{parsedData.tagline}</p>}
          </div>

          {isOwn && (
            <Link
              to="/profile/edit"
              className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow transition-colors hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Profile Sections */}
      {steps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No profile steps defined for this role.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={step.stepId || idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">{step.title}</h2>
              {step.description && <p className="mt-1 text-xs text-slate-500">{step.description}</p>}

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {step.fields?.map((field) => {
                  const val = parsedData[field.key];
                  if (val === undefined || val === null || val === "") return null;

                  return (
                    <div
                      key={field.key}
                      className={
                        field.type === "textarea" || field.type === "multiselect" || field.gridCols === 2
                          ? "sm:col-span-2"
                          : "sm:col-span-1"
                      }
                    >
                      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-800">
                        {/* URL field */}
                        {field.type === "url" && (
                          <a
                            href={String(val).startsWith("http") ? val : `https://${val}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 hover:underline"
                            style={{ color: accentColor }}
                          >
                            <Globe className="h-4 w-4" /> {val}
                          </a>
                        )}

                        {/* Multi-select Tags */}
                        {field.type === "multiselect" && Array.isArray(val) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {val.map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200"
                              >
                                <CheckCircle2 className="h-3 w-3" style={{ color: accentColor }} /> {item}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Checkbox */}
                        {field.type === "checkbox" && <span>{val ? "Yes" : "No"}</span>}

                        {/* Plain text / select / number / textarea */}
                        {!["url", "multiselect", "checkbox"].includes(field.type) && (
                          <span className="whitespace-pre-line">{String(val)}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

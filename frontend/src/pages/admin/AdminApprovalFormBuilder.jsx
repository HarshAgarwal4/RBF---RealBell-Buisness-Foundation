import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios.jsx";
import { toast } from "react-toastify";
import {
  Sliders,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  Check,
  FileText,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  CircleDot,
  List,
  UploadCloud,
  Image,
  Link2,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  X,
} from "lucide-react";

const FIELD_PALETTE = [
  { type: "text", label: "Single-line Text", icon: Type, defaultLabel: "New Text Field" },
  { type: "textarea", label: "Multi-line Text", icon: AlignLeft, defaultLabel: "Detailed Description" },
  { type: "number", label: "Numeric Value", icon: Hash, defaultLabel: "Years of Experience / Number" },
  { type: "email", label: "Email Address", icon: Mail, defaultLabel: "Official Contact Email" },
  { type: "phone", label: "Phone / Mobile", icon: Phone, defaultLabel: "Authorized Phone Number" },
  { type: "date", label: "Date Selector", icon: Calendar, defaultLabel: "Incorporation / License Date" },
  { type: "select", label: "Dropdown Select", icon: List, defaultLabel: "Industry Domain", options: ["Option A", "Option B", "Option C"] },
  { type: "multiselect", label: "Multi-Select Tags", icon: List, defaultLabel: "Expertise Domains", options: ["Domain 1", "Domain 2", "Domain 3"] },
  { type: "checkbox", label: "Checkbox (Yes/No)", icon: CheckSquare, defaultLabel: "Compliance Agreement" },
  { type: "radio", label: "Radio Option Group", icon: CircleDot, defaultLabel: "Entity Category", options: ["Individual", "Entity", "Syndicate"] },
  { type: "file", label: "Document Upload", icon: UploadCloud, defaultLabel: "Registration / License Certificate" },
  { type: "image", label: "Image / ID Upload", icon: Image, defaultLabel: "Authorized Representative Photo ID" },
  { type: "url", label: "Website / URL", icon: Link2, defaultLabel: "Official Website or Pitch Link" },
  { type: "address", label: "Physical Address", icon: MapPin, defaultLabel: "Registered Office Address" },
  { type: "terms", label: "Terms Confirmation", icon: ShieldCheck, defaultLabel: "I certify that all details submitted are authentic." },
];

export default function AdminApprovalFormBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryOrg = searchParams.get("org") || "startup";
  const queryRole = searchParams.get("role") || "default";
  const queryFormId = searchParams.get("id");

  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form Configuration State
  const [formConfig, setFormConfig] = useState({
    _id: null,
    organizationType: queryOrg,
    roleKey: queryRole,
    roleLabel: "All Roles",
    title: `${queryOrg.toUpperCase()} Approval & Verification Form`,
    description: "Provide verified organization details for Super Admin review and dashboard access.",
    version: 1,
    status: "published",
    fields: [],
  });

  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);

  // Fetch available organization roles and existing forms
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // 1. Fetch available ecosystem roles
        const rolesRes = await axios.get("/roles");
        if (rolesRes.data?.status === 1) {
          setAvailableRoles(rolesRes.data.roles || []);
        }

        // 2. Fetch existing form if queryFormId or for this org + role
        let fetchedForm = null;
        if (queryFormId) {
          const formRes = await axios.get(`/approvals/forms/${queryFormId}`);
          if (formRes.data?.status === 1) {
            fetchedForm = formRes.data.form;
          }
        } else {
          const formRes = await axios.get("/approvals/forms", {
            params: { organizationType: queryOrg, roleKey: queryRole },
          });
          if (formRes.data?.status === 1 && formRes.data.forms?.length > 0) {
            fetchedForm = formRes.data.forms[0];
          }
        }

        if (fetchedForm) {
          setFormConfig({
            _id: fetchedForm._id,
            organizationType: fetchedForm.organizationType,
            roleKey: fetchedForm.roleKey || "default",
            roleLabel: fetchedForm.roleLabel || "All Roles",
            title: fetchedForm.title,
            description: fetchedForm.description || "",
            version: fetchedForm.version || 1,
            status: fetchedForm.status || "published",
            fields: fetchedForm.fields || [],
          });
        } else {
          // Initialize with sensible starter fields
          setFormConfig((prev) => ({
            ...prev,
            organizationType: queryOrg,
            roleKey: queryRole,
            title: `${queryOrg.toUpperCase()} Onboarding & Verification Form`,
            fields: [
              {
                id: "f_legal_name",
                key: "legal_name",
                label: "Registered Entity / Legal Name",
                type: "text",
                placeholder: "e.g. Acme Ventures Pvt Ltd",
                required: true,
                description: "Official legal entity name.",
                gridCols: 2,
              },
              {
                id: "f_reg_id",
                key: "registration_id",
                label: "Government Registration / CIN / Tax ID",
                type: "text",
                placeholder: "e.g. U72900KA2024PTC123456",
                required: true,
                gridCols: 2,
              },
              {
                id: "f_sector",
                key: "industry_domain",
                label: "Primary Industry Sector",
                type: "select",
                options: ["FinTech", "HealthTech", "DeepTech", "SaaS", "CleanTech", "AgriTech", "Other"],
                required: true,
                gridCols: 2,
              },
              {
                id: "f_cert_doc",
                key: "incorporation_doc",
                label: "Incorporation / Registration Certificate",
                type: "file",
                required: true,
                validation: { allowedFileTypes: ["pdf", "jpg", "png"], maxFileSizeMB: 10 },
                gridCols: 2,
              },
              {
                id: "f_terms",
                key: "declaration_terms",
                label: "I confirm all submitted documents and credentials are true and authentic.",
                type: "terms",
                required: true,
                gridCols: 2,
              },
            ],
          }));
        }
      } catch (err) {
        console.error("Error initializing form builder:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [queryOrg, queryRole, queryFormId]);

  // Add field from palette
  const handleAddField = (paletteItem) => {
    const randomKey = `field_${Date.now().toString().slice(-4)}`;
    const newField = {
      id: `f_${Date.now()}`,
      key: randomKey,
      label: paletteItem.defaultLabel,
      type: paletteItem.type,
      placeholder: "",
      description: "",
      required: false,
      options: paletteItem.options ? [...paletteItem.options] : [],
      validation: {
        min: null,
        max: null,
        minLength: null,
        maxLength: null,
        allowedFileTypes: paletteItem.type === "file" || paletteItem.type === "image" ? ["pdf", "jpg", "png"] : [],
        maxFileSizeMB: 10,
      },
      gridCols: paletteItem.type === "textarea" || paletteItem.type === "address" || paletteItem.type === "terms" ? 2 : 1,
    };

    setFormConfig((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setSelectedFieldIndex(formConfig.fields.length);
  };

  // Remove field
  const handleRemoveField = (index) => {
    setFormConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
    setSelectedFieldIndex(Math.max(0, index - 1));
  };

  // Duplicate field
  const handleDuplicateField = (index) => {
    const original = formConfig.fields[index];
    if (!original) return;

    const copy = {
      ...original,
      id: `f_${Date.now()}`,
      key: `${original.key}_copy`,
      label: `${original.label} (Copy)`,
    };

    const updated = [...formConfig.fields];
    updated.splice(index + 1, 0, copy);

    setFormConfig((prev) => ({ ...prev, fields: updated }));
    setSelectedFieldIndex(index + 1);
  };

  // Move field order
  const handleMoveField = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= formConfig.fields.length) return;

    const updated = [...formConfig.fields];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setFormConfig((prev) => ({ ...prev, fields: updated }));
    setSelectedFieldIndex(targetIdx);
  };

  // Update selected field property
  const handleUpdateSelectedField = (prop, val) => {
    if (selectedFieldIndex < 0 || selectedFieldIndex >= formConfig.fields.length) return;
    const updated = [...formConfig.fields];
    updated[selectedFieldIndex] = {
      ...updated[selectedFieldIndex],
      [prop]: val,
    };
    setFormConfig((prev) => ({ ...prev, fields: updated }));
  };

  // Update validation nested property
  const handleUpdateValidation = (prop, val) => {
    if (selectedFieldIndex < 0 || selectedFieldIndex >= formConfig.fields.length) return;
    const updated = [...formConfig.fields];
    const currentValidation = updated[selectedFieldIndex].validation || {};
    updated[selectedFieldIndex] = {
      ...updated[selectedFieldIndex],
      validation: {
        ...currentValidation,
        [prop]: val,
      },
    };
    setFormConfig((prev) => ({ ...prev, fields: updated }));
  };

  // Save form handler
  const handleSaveForm = async (publishStatus = "published") => {
    if (!formConfig.title.trim()) {
      toast.error("Form title is required.");
      return;
    }
    if (formConfig.fields.length === 0) {
      toast.error("Please add at least one field to the form.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formConfig,
        status: publishStatus,
      };

      const res = await axios.post("/approvals/forms", payload);
      if (res.data?.status === 1) {
        toast.success(res.data.msg || "Approval form published successfully!");
        setFormConfig((prev) => ({
          ...prev,
          _id: res.data.form._id,
          version: res.data.form.version,
          status: publishStatus,
        }));
      } else {
        toast.error(res.data?.msg || "Failed to save form.");
      }
    } catch (err) {
      console.error("Error saving form:", err);
      toast.error("Failed to save approval form.");
    } finally {
      setSaving(false);
    }
  };

  const selectedField = formConfig.fields[selectedFieldIndex];

  if (loading) {
    return (
      <AdminLayout title="Form Builder">
        <div className="py-20 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading Form Builder...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Approval Form Builder">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/approvals"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Back to Approvals"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Approval Form Builder</h1>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                  Version {formConfig.version}
                </span>
                {formConfig.status === "published" ? (
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Live
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-white uppercase">{formConfig.organizationType}</strong> (Role: {formConfig.roleKey})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Org Type Selector */}
            <select
              value={formConfig.organizationType}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, organizationType: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-400 font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="startup">Startup</option>
              <option value="investor">Investor</option>
              <option value="mentor">Mentor</option>
              <option value="incubator">Incubator</option>
              <option value="accelerator">Accelerator</option>
              {availableRoles.map((r) => (
                <option key={r._id} value={r.key}>{r.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveForm("published")}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Publish Form</span>
            </button>
          </div>
        </div>

        {/* 3-PANEL BUILDER WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =========================================================================
              PANEL 1: FIELD TYPES PALETTE (Left - 3 Cols)
              ========================================================================= */}
          <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Field Palette</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Click any field to add to canvas.</p>
            </div>

            <div className="space-y-1.5">
              {FIELD_PALETTE.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddField(item)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-850 border border-slate-800/80 hover:border-amber-500/50 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 text-amber-400 group-hover:text-amber-300">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                        {item.label}
                      </span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              PANEL 2: FORM CANVAS (Center - 5 Cols)
              ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* Form Title & Description Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <input
                type="text"
                value={formConfig.title}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Form Title (e.g. Healthcare Doctor Approval Form)"
                className="w-full text-base font-black text-white bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
              />
              <textarea
                rows={2}
                value={formConfig.description}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Instructions or guidelines shown to applicant..."
                className="w-full text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Canvas Fields List */}
            <div className="space-y-2.5">
              {formConfig.fields.length === 0 ? (
                <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-6">
                  <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">Canvas is empty</p>
                  <p className="text-[11px] mt-0.5">Click any field type on the left palette to add.</p>
                </div>
              ) : (
                formConfig.fields.map((field, idx) => {
                  const isSelected = selectedFieldIndex === idx;
                  return (
                    <div
                      key={field.id || idx}
                      onClick={() => setSelectedFieldIndex(idx)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/30"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {field.label || "Untitled Field"}
                          </span>
                          {field.required && (
                            <span className="text-[10px] text-amber-500 font-bold">*Required</span>
                          )}
                        </div>

                        {/* Quick Controls */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveField(idx, -1)}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formConfig.fields.length - 1}
                            onClick={() => handleMoveField(idx, 1)}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateField(idx)}
                            className="p-1 text-slate-400 hover:text-white transition"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="p-1 text-red-400 hover:text-red-300 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="uppercase tracking-wider font-semibold text-amber-400/80">
                          {field.type}
                        </span>
                        <span className="font-mono">{field.key}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================================================
              PANEL 3: FIELD INSPECTOR (Right - 4 Cols)
              ========================================================================= */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Field Inspector
            </h2>

            {selectedField ? (
              <div className="space-y-4 text-xs">
                {/* Field Label */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label || ""}
                    onChange={(e) => handleUpdateSelectedField("label", e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Internal Key */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Internal Key / API Identifier</label>
                  <input
                    type="text"
                    value={selectedField.key || ""}
                    onChange={(e) => handleUpdateSelectedField("key", e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                {/* Placeholder */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Placeholder Text</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ""}
                    onChange={(e) => handleUpdateSelectedField("placeholder", e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Help Text / Description</label>
                  <textarea
                    rows={2}
                    value={selectedField.description || ""}
                    onChange={(e) => handleUpdateSelectedField("description", e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Required Toggle & Grid Width */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedField.required)}
                      onChange={(e) => handleUpdateSelectedField("required", e.target.checked)}
                      className="rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-300">Mandatory</span>
                  </label>

                  <select
                    value={selectedField.gridCols || 1}
                    onChange={(e) => handleUpdateSelectedField("gridCols", parseInt(e.target.value, 10))}
                    className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-amber-500"
                  >
                    <option value={1}>Half Width (1 Col)</option>
                    <option value={2}>Full Width (2 Cols)</option>
                  </select>
                </div>

                {/* OPTIONS LIST (For Select, Multiselect, Radio) */}
                {(selectedField.type === "select" ||
                  selectedField.type === "multiselect" ||
                  selectedField.type === "radio") && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300">Options List</label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOpts = selectedField.options || [];
                          handleUpdateSelectedField("options", [...currentOpts, `Option ${currentOpts.length + 1}`]);
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(selectedField.options || []).map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...(selectedField.options || [])];
                              updated[i] = e.target.value;
                              handleUpdateSelectedField("options", updated);
                            }}
                            className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (selectedField.options || []).filter((_, idx) => idx !== i);
                              handleUpdateSelectedField("options", updated);
                            }}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VALIDATION SETTINGS */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="font-bold text-slate-300">Validation Rules</label>

                  {selectedField.type === "number" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Min Value</span>
                        <input
                          type="number"
                          value={selectedField.validation?.min ?? ""}
                          onChange={(e) => handleUpdateValidation("min", e.target.value === "" ? null : Number(e.target.value))}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Max Value</span>
                        <input
                          type="number"
                          value={selectedField.validation?.max ?? ""}
                          onChange={(e) => handleUpdateValidation("max", e.target.value === "" ? null : Number(e.target.value))}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {(selectedField.type === "text" || selectedField.type === "textarea") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Min Length</span>
                        <input
                          type="number"
                          value={selectedField.validation?.minLength ?? ""}
                          onChange={(e) => handleUpdateValidation("minLength", e.target.value === "" ? null : Number(e.target.value))}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Max Length</span>
                        <input
                          type="number"
                          value={selectedField.validation?.maxLength ?? ""}
                          onChange={(e) => handleUpdateValidation("maxLength", e.target.value === "" ? null : Number(e.target.value))}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  {(selectedField.type === "file" || selectedField.type === "image") && (
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-500">Max File Size (MB)</span>
                        <input
                          type="number"
                          value={selectedField.validation?.maxFileSizeMB || 10}
                          onChange={(e) => handleUpdateValidation("maxFileSizeMB", Number(e.target.value))}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                Select a field on the canvas to inspect and customize settings.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          LIVE PREVIEW MODAL
          ========================================================================= */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Live Form Preview</h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h2 className="text-lg font-black text-white">{formConfig.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{formConfig.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formConfig.fields.map((f, i) => (
                  <div key={i} className={`space-y-1.5 ${f.gridCols === 2 ? "sm:col-span-2" : "sm:col-span-1"}`}>
                    <label className="text-xs font-bold text-slate-300">
                      {f.label} {f.required && <span className="text-amber-500">*</span>}
                    </label>
                    {f.description && <p className="text-[10px] text-slate-500">{f.description}</p>}
                    <input
                      type="text"
                      disabled
                      placeholder={f.placeholder || `Enter ${f.label}...`}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-400 opacity-80"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-right">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios.jsx";
import {
  Rocket,
  TrendingUp,
  Users,
  Building2,
  Briefcase,
  Award,
  GraduationCap,
  Globe,
  Plus,
  Trash2,
  Edit3,
  Palette,
  Layout,
  Sliders,
  AlertTriangle,
  Loader2,
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

const COLOR_PRESETS = [
  { label: "Amber Gold", hex: "#d97706" },
  { label: "Indigo Blue", hex: "#6366f1" },
  { label: "Emerald Green", hex: "#059669" },
  { label: "Rose Pink", hex: "#e11d48" },
  { label: "Cyan Blue", hex: "#0891b2" },
  { label: "Purple Violet", hex: "#7c3aed" },
];

const STEPPER_STYLES = [
  { id: "horizontal_tabs", label: "Top Horizontal Tabs", desc: "Classic tabs across the top of the form" },
  { id: "vertical_steps", label: "Left Vertical Stepper", desc: "Step sidebar navigation on the left" },
  { id: "pills", label: "Pill Badges", desc: "Rounded pill badges step navigator" },
];

const CARD_STYLES = [
  { id: "bordered", label: "Clean Bordered", desc: "Light border with clean background" },
  { id: "shadow_glow", label: "Elevated Shadow", desc: "Soft drop shadow with rounded corners" },
  { id: "minimal", label: "Minimal Flat", desc: "Subtle flat background without heavy borders" },
];

const FIELD_TYPES = [
  { id: "text", label: "Single-line Text" },
  { id: "textarea", label: "Multi-line Text (Textarea)" },
  { id: "number", label: "Number" },
  { id: "select", label: "Dropdown Select" },
  { id: "multiselect", label: "Multi-Select Tags" },
  { id: "checkbox", label: "Checkbox (Yes/No)" },
  { id: "date", label: "Date" },
  { id: "url", label: "URL Link" },
];

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Edit / Create Modal State
  const [activeTab, setActiveTab] = useState("basic"); // 'basic' | 'schema' | 'ui'
  const [roleModal, setRoleModal] = useState({ open: false, isEdit: false, roleId: null });
  const [roleForm, setRoleForm] = useState({
    label: "",
    key: "",
    description: "",
    icon: "Building2",
    hasSubtypes: false,
    subtypes: [],
    profileSchema: { steps: [] },
    uiConfig: {
      accentColor: "#d97706",
      stepperStyle: "horizontal_tabs",
      bannerTitle: "",
      bannerSubtitle: "",
      cardStyle: "bordered",
    },
  });

  // Delete & Reassign Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, role: null, reassignTo: "" });
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/roles");
      if (res.data.status === 1) {
        setRoles(res.data.roles);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const openCreateModal = () => {
    setActiveTab("basic");
    setRoleForm({
      label: "",
      key: "",
      description: "",
      icon: "Briefcase",
      hasSubtypes: false,
      subtypes: [],
      profileSchema: {
        steps: [
          {
            stepId: "step_1",
            title: "General Information",
            description: "Basic details about the organization or profile",
            fields: [
              {
                key: "tagline",
                label: "Tagline",
                type: "text",
                required: true,
                placeholder: "Brief one-line summary",
                gridCols: 2,
              },
            ],
          },
        ],
      },
      uiConfig: {
        accentColor: "#d97706",
        stepperStyle: "horizontal_tabs",
        bannerTitle: "",
        bannerSubtitle: "",
        cardStyle: "bordered",
      },
    });
    setRoleModal({ open: true, isEdit: false, roleId: null });
  };

  const openEditModal = (role) => {
    setActiveTab("basic");
    setRoleForm({
      label: role.label,
      key: role.key,
      description: role.description || "",
      icon: role.icon || "Building2",
      hasSubtypes: Boolean(role.hasSubtypes),
      subtypes: role.subtypes || [],
      profileSchema: role.profileSchema || { steps: [] },
      uiConfig: role.uiConfig || {
        accentColor: "#d97706",
        stepperStyle: "horizontal_tabs",
        bannerTitle: "",
        bannerSubtitle: "",
        cardStyle: "bordered",
      },
    });
    setRoleModal({ open: true, isEdit: true, roleId: role._id });
  };

  const handleSaveRole = async () => {
    if (!roleForm.label.trim()) {
      showToast("Role name is required", "error");
      return;
    }
    if (!roleForm.key.trim()) {
      showToast("Role key identifier is required", "error");
      return;
    }

    setSaving(true);
    try {
      let res;
      if (roleModal.isEdit) {
        res = await axios.put(`/roles/${roleModal.roleId}`, roleForm);
      } else {
        res = await axios.post("/roles", roleForm);
      }

      if (res.data.status === 1) {
        showToast(res.data.msg || "Role saved successfully");
        setRoleModal({ open: false, isEdit: false, roleId: null });
        loadRoles();
      } else {
        showToast(res.data.msg || "Failed to save role", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || "Server error while saving role", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteModal.role) return;

    if (deleteModal.role.userCount > 0 && !deleteModal.reassignTo) {
      showToast("Please select a target role to reassign existing users", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.delete(`/roles/${deleteModal.role._id}`, {
        data: { reassignTo: deleteModal.reassignTo },
      });

      if (res.data.status === 1) {
        showToast(res.data.msg || "Role deleted successfully");
        setDeleteModal({ open: false, role: null, reassignTo: "" });
        loadRoles();
      } else {
        showToast(res.data.msg || "Failed to delete role", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || "Server error deleting role", "error");
    } finally {
      setSaving(false);
    }
  };

  // Schema builder helpers
  const addStep = () => {
    const newStepIdx = (roleForm.profileSchema?.steps?.length || 0) + 1;
    const newStep = {
      stepId: `step_${newStepIdx}`,
      title: `Step ${newStepIdx}`,
      description: "",
      fields: [],
    };
    setRoleForm((prev) => ({
      ...prev,
      profileSchema: {
        ...prev.profileSchema,
        steps: [...(prev.profileSchema?.steps || []), newStep],
      },
    }));
  };

  const removeStep = (sIdx) => {
    setRoleForm((prev) => ({
      ...prev,
      profileSchema: {
        ...prev.profileSchema,
        steps: prev.profileSchema.steps.filter((_, idx) => idx !== sIdx),
      },
    }));
  };

  const updateStep = (sIdx, field, val) => {
    setRoleForm((prev) => {
      const steps = [...prev.profileSchema.steps];
      steps[sIdx] = { ...steps[sIdx], [field]: val };
      return {
        ...prev,
        profileSchema: { ...prev.profileSchema, steps },
      };
    });
  };

  const addField = (sIdx) => {
    setRoleForm((prev) => {
      const steps = [...prev.profileSchema.steps];
      const newFieldKey = `field_${Date.now()}`;
      const newField = {
        key: newFieldKey,
        label: "New Field",
        type: "text",
        required: false,
        placeholder: "",
        options: [],
        gridCols: 1,
      };
      steps[sIdx].fields = [...(steps[sIdx].fields || []), newField];
      return {
        ...prev,
        profileSchema: { ...prev.profileSchema, steps },
      };
    });
  };

  const removeField = (sIdx, fIdx) => {
    setRoleForm((prev) => {
      const steps = [...prev.profileSchema.steps];
      steps[sIdx].fields = steps[sIdx].fields.filter((_, idx) => idx !== fIdx);
      return {
        ...prev,
        profileSchema: { ...prev.profileSchema, steps },
      };
    });
  };

  const updateField = (sIdx, fIdx, fieldProp, val) => {
    setRoleForm((prev) => {
      const steps = [...prev.profileSchema.steps];
      const fields = [...steps[sIdx].fields];
      fields[fIdx] = { ...fields[fIdx], [fieldProp]: val };
      steps[sIdx].fields = fields;
      return {
        ...prev,
        profileSchema: { ...prev.profileSchema, steps },
      };
    });
  };

  const updateUiConfig = (key, val) => {
    setRoleForm((prev) => ({
      ...prev,
      uiConfig: {
        ...prev.uiConfig,
        [key]: val,
      },
    }));
  };

  return (
    <AdminLayout title="Roles & Profile Designer">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-6 z-50 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-xl ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-white">Roles & Profile Designer</h1>
          <p className="text-xs text-slate-400">
            Create roles, design custom profile schemas, and customize visual UI themes.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="admin-btn admin-btn-primary"
          style={{ padding: "7px 14px", fontSize: "0.8rem" }}
        >
          <Plus className="h-3.5 w-3.5" /> Create New Role
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" /> Loading roles...
        </div>
      ) : (
        <div className="admin-grid-2col">
          {roles.map((role) => {
            const IconComp = ICON_MAP[role.icon] || Building2;
            const stepsCount = role.profileSchema?.steps?.length || 0;
            const fieldsCount =
              role.profileSchema?.steps?.reduce((acc, step) => acc + (step.fields?.length || 0), 0) || 0;
            const themeColor = role.uiConfig?.accentColor || "#d97706";

            return (
              <div
                key={role._id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white flex-shrink-0"
                        style={{ backgroundColor: `${themeColor}22`, color: themeColor }}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{role.label}</h3>
                        <span className="font-mono text-[10px] text-slate-400">Key: {role.key}</span>
                      </div>
                    </div>

                    {role.isBuiltIn ? (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        Built-in Role
                      </span>
                    ) : (
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={{ borderColor: `${themeColor}55`, backgroundColor: `${themeColor}15`, color: themeColor }}
                      >
                        Custom Theme
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                    {role.description || "No description provided."}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2.5 border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-400">
                    <div>
                      <strong className="text-white font-bold">{role.userCount || 0}</strong> Users
                    </div>
                    <div>•</div>
                    <div>
                      <strong className="text-white font-bold">{stepsCount}</strong> Form Steps
                    </div>
                    <div>•</div>
                    <div>
                      <strong className="text-white font-bold">{fieldsCount}</strong> Total Fields
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 pt-2.5 border-t border-slate-800/80">
                  <button
                    onClick={() => openEditModal(role)}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.72rem" }}
                  >
                    <Edit3 className="h-3 w-3" /> Edit Schema & UI
                  </button>

                  {!role.isBuiltIn && (
                    <button
                      onClick={() => setDeleteModal({ open: true, role, reassignTo: "" })}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: "4px 10px", fontSize: "0.72rem" }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role & Schema Builder Modal */}
      {roleModal.open && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: "780px" }}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white">
                {roleModal.isEdit ? `Edit Role & Designer: ${roleForm.label}` : "Create New Role & Designer"}
              </h2>
              <button
                onClick={() => setRoleModal({ open: false, isEdit: false, roleId: null })}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="mt-3 flex border-b border-slate-800 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "basic"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sliders className="h-3 w-3" /> 1. Basic Info
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("schema")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "schema"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layout className="h-3 w-3" /> 2. Profile Schema Builder
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ui")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "ui"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Palette className="h-3 w-3" /> 3. Visual UI & Theme
              </button>
            </div>

            {/* TAB 1: BASIC INFORMATION */}
            {activeTab === "basic" && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Role Name (Display Label)</label>
                    <input
                      type="text"
                      value={roleForm.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        const slug = label.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
                        setRoleForm((p) => ({
                          ...p,
                          label,
                          key: roleModal.isEdit ? p.key : slug,
                        }));
                      }}
                      placeholder="e.g. Service Provider"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Unique Key Identifier</label>
                    <input
                      type="text"
                      disabled={roleModal.isEdit}
                      value={roleForm.key}
                      onChange={(e) => setRoleForm((p) => ({ ...p, key: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                      placeholder="e.g. service_provider"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Description</label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of who belongs to this role..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Role Icon</label>
                    <select
                      value={roleForm.icon}
                      onChange={(e) => setRoleForm((p) => ({ ...p, icon: e.target.value }))}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {Object.keys(ICON_MAP).map((iconKey) => (
                        <option key={iconKey} value={iconKey}>
                          {iconKey}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE SCHEMA BUILDER */}
            {activeTab === "schema" && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Form Steps & Field Definitions
                  </span>
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30"
                  >
                    <Plus className="h-3 w-3" /> Add Step Section
                  </button>
                </div>

                {roleForm.profileSchema?.steps?.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                    No profile steps configured yet. Click "Add Step Section" to define form steps.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roleForm.profileSchema?.steps?.map((step, sIdx) => (
                      <div key={sIdx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Step Title</label>
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => updateStep(sIdx, "title", e.target.value)}
                                placeholder="e.g. Basic Details"
                                className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold uppercase text-slate-500">Step Description</label>
                              <input
                                type="text"
                                value={step.description}
                                onChange={(e) => updateStep(sIdx, "description", e.target.value)}
                                placeholder="e.g. Provide contact info"
                                className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStep(sIdx)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                            title="Remove Step"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Fields inside this step */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">Step Fields</span>
                            <button
                              type="button"
                              onClick={() => addField(sIdx)}
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:underline"
                            >
                              <Plus className="h-3 w-3" /> Add Field
                            </button>
                          </div>

                          {step.fields?.length === 0 ? (
                            <p className="text-[11px] italic text-slate-600">No fields in this step.</p>
                          ) : (
                            step.fields?.map((field, fIdx) => (
                              <div key={fIdx} className="rounded border border-slate-800/80 bg-slate-900 p-2.5 text-xs space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400">Field Label</label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => {
                                        const label = e.target.value;
                                        const key = label.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
                                        updateField(sIdx, fIdx, "label", label);
                                        updateField(sIdx, fIdx, "key", key);
                                      }}
                                      placeholder="e.g. Website URL"
                                      className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400">Field Key</label>
                                    <input
                                      type="text"
                                      value={field.key}
                                      onChange={(e) => updateField(sIdx, fIdx, "key", e.target.value)}
                                      placeholder="e.g. website_url"
                                      className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400">Field Type</label>
                                    <select
                                      value={field.type}
                                      onChange={(e) => updateField(sIdx, fIdx, "type", e.target.value)}
                                      className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white outline-none"
                                    >
                                      {FIELD_TYPES.map((ft) => (
                                        <option key={ft.id} value={ft.id}>
                                          {ft.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex items-center justify-between pt-2">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(field.required)}
                                        onChange={(e) => updateField(sIdx, fIdx, "required", e.target.checked)}
                                        className="accent-indigo-500"
                                      />
                                      <span className="text-[10px] font-medium text-slate-300">Required</span>
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => removeField(sIdx, fIdx)}
                                      className="text-slate-500 hover:text-red-400"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VISUAL UI & THEME DESIGNER */}
            {activeTab === "ui" && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Accent Theme Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => updateUiConfig("accentColor", preset.hex)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                          roleForm.uiConfig?.accentColor === preset.hex
                            ? "border-white bg-slate-800 text-white"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.hex }} />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Stepper Style</label>
                    <select
                      value={roleForm.uiConfig?.stepperStyle || "horizontal_tabs"}
                      onChange={(e) => updateUiConfig("stepperStyle", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                    >
                      {STEPPER_STYLES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Card Style</label>
                    <select
                      value={roleForm.uiConfig?.cardStyle || "bordered"}
                      onChange={(e) => updateUiConfig("cardStyle", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                    >
                      {CARD_STYLES.map((cs) => (
                        <option key={cs.id} value={cs.id}>
                          {cs.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "ui" ? "schema" : "basic")}
                className="admin-btn admin-btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.78rem" }}
              >
                Previous Tab
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRoleModal({ open: false, isEdit: false, roleId: null })}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveRole}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: "6px 16px", fontSize: "0.78rem", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : "Save Role Design"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.role && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: "420px" }}>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Delete Role: {deleteModal.role.label}</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this role? This action cannot be undone.
            </p>

            {deleteModal.role.userCount > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-xs font-bold text-amber-300">
                  ⚠️ This role currently has {deleteModal.role.userCount} active user(s).
                </p>
                <select
                  value={deleteModal.reassignTo}
                  onChange={(e) => setDeleteModal((p) => ({ ...p, reassignTo: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  <option value="">Select Replacement Role</option>
                  {roles
                    .filter((r) => r.key !== deleteModal.role.key)
                    .map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label} ({r.key})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, role: null, reassignTo: "" })}
                className="admin-btn admin-btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.78rem" }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteRole}
                className="admin-btn admin-btn-danger"
                style={{ padding: "6px 14px", fontSize: "0.78rem" }}
              >
                {saving ? "Deleting..." : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

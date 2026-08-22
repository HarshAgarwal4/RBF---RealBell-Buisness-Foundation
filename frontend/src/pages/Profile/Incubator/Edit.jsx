import React, { useState, useEffect, useMemo } from "react";
import axios from "../../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";

const ORG_TYPES = ["Incubator", "Accelerator", "Association/Organization"];
const YEAR_OPTIONS = Array.from({ length: 40 }, (_, i) => String(2026 - i));
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Germany", "UAE", "Other"];

const INDUSTRY_DOMAINS = [
  "Big Data",
  "Buy Now Pay Later (BNPL)",
  "CFO Suite",
  "Commerce Enablers",
  "Consumer Banking and Lending",
  "Cyber Security",
  "Embedded Finance",
  "Enterprise SaaS",
  "ESG / Sustainability",
  "Fraud Detection",
  "Gaming",
  "Hardware",
  "Inclusive lending",
  "InsurTech",
  "Lending / CreditTech",
  "Money Movement",
  "Open Banking",
  "Other",
  "Payments & Payment Infrastructure",
  "Real Estate FinTech",
  "Regulatory Tech (RegTech)",
  "Retail",
  "Risk and Identity",
  "Supply Chain & Logistics",
  "Supply Chain Finance",
  "Telecom",
  "Web3",
  "Others",
];

const PROGRAM_BENEFITS = [
  "Co-working Space",
  "Seed Funding / Grants",
  "Mentorship & Guidance",
  "Corporate Connections",
  "Investor Demo Days",
  "Fab Lab / Prototyping",
  "Legal & Accounting Support",
  "Cloud Credits",
];

const STARTUP_STAGES = ["Idea / PoC Stage", "Validation / MVP Stage", "Early Traction", "Scaling & Growth"];

export default function IncubatorEditProfile({ profile = {} }) {
  const fetchUser = useStore((state) => state.fetchUser);
  const user = useStore((state) => state.user);

  const [activeTab, setActiveTab] = useState(0); // 0: Basic Info, 1: Industry/Technology
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(profile?.logo || profile?.photo || user?.account?.image || "");

  const [form, setForm] = useState({
    organizationName: profile?.organizationName || profile?.companyName || user?.company_name || "",
    tagline: profile?.tagline || "",
    establishedIn: profile?.establishedIn || "2020",
    organizationType: profile?.organizationType || (user?.company_type === "accelerator" ? "Accelerator" : "Incubator"),
    headline: profile?.headline || "",
    about: profile?.about || "",
    country: profile?.country || "India",
    state: profile?.state || "",
    city: profile?.city || "",
    socialLinks: {
      website: profile?.socialLinks?.website || profile?.websiteUrl || "",
      linkedin: profile?.socialLinks?.linkedin || profile?.linkedinUrl || "",
      x: profile?.socialLinks?.x || profile?.xUrl || "",
      youtube: profile?.socialLinks?.youtube || profile?.youtubeUrl || "",
      facebook: profile?.socialLinks?.facebook || profile?.facebookUrl || "",
      instagram: profile?.socialLinks?.instagram || profile?.instagramUrl || "",
    },
    industryDomains: Array.isArray(profile?.industryDomains) ? profile.industryDomains : [],
    programBenefits: Array.isArray(profile?.programBenefits) ? profile.programBenefits : [],
    targetStages: Array.isArray(profile?.targetStages) ? profile.targetStages : [],
  });

  useEffect(() => {
    if (profile) {
      setLogoPreview(profile?.logo || profile?.photo || user?.account?.image || "");
    }
  }, [profile, user]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const toggleArrayItem = (key, item) => {
    setForm((prev) => {
      const current = prev[key] || [];
      if (current.includes(item)) {
        return { ...prev, [key]: current.filter((i) => i !== item) };
      }
      return { ...prev, [key]: [...current, item] };
    });
  };

  const completionPercentage = useMemo(() => {
    let fields = [
      form.organizationName,
      form.tagline,
      form.headline,
      form.about,
      form.country,
      form.city,
      logoPreview,
    ];
    let filled = fields.filter(Boolean).length;
    if (form.industryDomains.length > 0) filled += 1;
    if (form.programBenefits.length > 0) filled += 1;
    return Math.min(100, Math.round((filled / 9) * 100));
  }, [form, logoPreview]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      const payload = {
        ...form,
        logo: logoPreview,
        photo: logoPreview,
      };

      formData.append("profile", JSON.stringify(payload));
      if (logoFile) {
        formData.append("logo", logoFile);
        formData.append("photo", logoFile);
      }

      const res = await axios.post("/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === 1) {
        toast.success(`${form.organizationType || "Profile"} updated successfully!`);
        await fetchUser({ silent: true });
      } else {
        toast.error(res.data?.msg || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] lg:ml-75 pt-20 lg:pt-10 px-4 sm:px-6 md:px-8 lg:px-10 pb-6 sm:pb-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">Edit Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage {form.organizationType || "Organization"} program profile</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-gray-600">Profile completion</span>
            <div className="w-24 sm:w-32 bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#34C759] h-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#172033]">{completionPercentage}%</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#8E1B2E] text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-[#721524] transition disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? "SAVING..." : "SUBMIT"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`pb-4 px-2 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap flex-shrink-0 ${
            activeTab === 0 ? "text-[#8E1B2E] border-b-2 border-[#8E1B2E]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Basic Information {completionPercentage > 40 ? "✓" : "!"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`pb-4 px-2 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap flex-shrink-0 ${
            activeTab === 1 ? "text-[#8E1B2E] border-b-2 border-[#8E1B2E]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Industry/Technology {form.industryDomains.length > 0 ? "✓" : "!"}
        </button>
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-sm space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Logo Upload */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <label className="text-sm font-bold text-gray-700 self-start mb-3">
                Logo <span className="text-red-500">*</span>
              </label>
              <div className="relative group w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#8E1B2E] transition">
                {logoPreview ? (
                  <img src={logoPreview} alt="Organization Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-500">UPLOAD</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                Allowed file types: png, jpg, jpeg and max size of 10mb.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Organization name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    placeholder="Enter organization name"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Tagline/Slogan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    placeholder="Enter tagline"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Established in <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.establishedIn}
                    onChange={(e) => setForm({ ...form, establishedIn: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E] bg-white"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Organization Type Radio */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3">
                  Organization type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ORG_TYPES.map((type) => {
                    const selected = form.organizationType === type;
                    return (
                      <label
                        key={type}
                        onClick={() => setForm({ ...form, organizationType: type })}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition select-none text-xs font-semibold ${
                          selected ? "border-[#8E1B2E] bg-[#FFF8F8] text-[#8E1B2E]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input type="radio" checked={selected} readOnly className="accent-[#8E1B2E]" />
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Headline (max. 300 characters) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Enter short description"
                  className="w-full p-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  About your organization <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  placeholder="Describe your organization's mission and history"
                  className="w-full p-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Location */}
          <div>
            <h3 className="text-sm font-bold text-[#8E1B2E] mb-4">Where are you located?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E] bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Enter state"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Enter city"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-bold text-[#8E1B2E] mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Website URL</label>
                <input
                  type="text"
                  value={form.socialLinks.website}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, website: e.target.value } })}
                  placeholder="Enter website URL"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={form.socialLinks.linkedin}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })}
                  placeholder="LinkedIn Url"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 bg-[#B25C68] text-white font-bold text-sm rounded-xl hover:bg-[#994d57] transition disabled:opacity-50"
            >
              SAVE
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className="px-8 py-3 bg-[#161F33] text-white font-bold text-sm rounded-xl hover:bg-[#0c1220] transition"
            >
              NEXT STEP
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INDUSTRY/TECHNOLOGY */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 shadow-sm space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-lg font-bold text-[#8E1B2E] mb-2">Focus Industry Domains</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {INDUSTRY_DOMAINS.map((domain) => {
                const checked = form.industryDomains.includes(domain);
                return (
                  <label
                    key={domain}
                    onClick={() => toggleArrayItem("industryDomains", domain)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none text-xs font-semibold ${
                      checked ? "border-[#8E1B2E] bg-[#FFF8F8] text-[#8E1B2E]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded accent-[#8E1B2E]" />
                    <span>{domain}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Program Offerings & Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {PROGRAM_BENEFITS.map((benefit) => {
                const checked = form.programBenefits.includes(benefit);
                return (
                  <label
                    key={benefit}
                    onClick={() => toggleArrayItem("programBenefits", benefit)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none text-xs font-semibold ${
                      checked ? "border-[#8E1B2E] bg-[#FFF8F8] text-[#8E1B2E]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded accent-[#8E1B2E]" />
                    <span>{benefit}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Target Startup Stages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {STARTUP_STAGES.map((stage) => {
                const checked = form.targetStages.includes(stage);
                return (
                  <label
                    key={stage}
                    onClick={() => toggleArrayItem("targetStages", stage)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none text-xs font-semibold ${
                      checked ? "border-[#8E1B2E] bg-[#FFF8F8] text-[#8E1B2E]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded accent-[#8E1B2E]" />
                    <span>{stage}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 bg-[#B25C68] text-white font-bold text-sm rounded-xl hover:bg-[#994d57] transition disabled:opacity-50"
            >
              SAVE
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(0)}
              className="px-8 py-3 bg-[#161F33] text-white font-bold text-sm rounded-xl hover:bg-[#0c1220] transition"
            >
              PREVIOUS STEP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import axios from "../../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../../zustand/store";

const MENTOR_DOMAINS = [
  "Business Operations / Supply Chain",
  "Business Strategy",
  "Channel Sales / Distribution",
  "Design Thinking",
  "Enterprise Sales",
  "Financial Management",
  "Fund Raising",
  "Go-To-Market",
  "Legal / Compliance",
  "Marketing",
  "Resource Management",
  "SaaS Strategy",
  "Team Building",
  "Technology",
];

const INDUSTRY_SPECIALISATIONS = [
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

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Germany", "UAE", "Other"];

export default function MentorEditProfile({ profile = {} }) {
  const fetchUser = useStore((state) => state.fetchUser);
  const user = useStore((state) => state.user);

  const [activeTab, setActiveTab] = useState(0); // 0: Basic Info, 1: Domain Expertise
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.photo || profile?.logo || user?.account?.image || "");

  const [form, setForm] = useState({
    name: profile?.name || user?.name || "",
    currentOrganization: profile?.currentOrganization || user?.company_name || "",
    designation: profile?.designation || user?.account?.designation || "",
    headline: profile?.headline || "",
    about: profile?.about || profile?.aboutYou || "",
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
    mentorshipDomains: Array.isArray(profile?.mentorshipDomains) ? profile.mentorshipDomains : [],
    industrySpecialisations: Array.isArray(profile?.industrySpecialisations) ? profile.industrySpecialisations : [],
  });

  useEffect(() => {
    if (profile) {
      setPhotoPreview(profile?.photo || profile?.logo || user?.account?.image || "");
    }
  }, [profile, user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const toggleDomain = (domain) => {
    setForm((prev) => {
      const current = prev.mentorshipDomains;
      if (current.includes(domain)) {
        return { ...prev, mentorshipDomains: current.filter((d) => d !== domain) };
      }
      if (current.length >= 5) {
        toast.warn("You can select maximum 5 options");
        return prev;
      }
      return { ...prev, mentorshipDomains: [...current, domain] };
    });
  };

  const toggleIndustry = (industry) => {
    setForm((prev) => {
      const current = prev.industrySpecialisations;
      if (current.includes(industry)) {
        return { ...prev, industrySpecialisations: current.filter((i) => i !== industry) };
      }
      if (current.length >= 5) {
        toast.warn("You can select maximum 5 options");
        return prev;
      }
      return { ...prev, industrySpecialisations: [...current, industry] };
    });
  };

  const completionPercentage = useMemo(() => {
    let fields = [
      form.name,
      form.currentOrganization,
      form.designation,
      form.headline,
      form.about,
      form.country,
      form.city,
      photoPreview,
    ];
    let filled = fields.filter(Boolean).length;
    if (form.mentorshipDomains.length > 0) filled += 1;
    if (form.industrySpecialisations.length > 0) filled += 1;
    return Math.min(100, Math.round((filled / 10) * 100));
  }, [form, photoPreview]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      const payload = {
        ...form,
        photo: photoPreview,
        logo: photoPreview,
      };

      formData.append("profile", JSON.stringify(payload));
      if (photoFile) {
        formData.append("photo", photoFile);
        formData.append("logo", photoFile);
      }

      const res = await axios.post("/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === 1) {
        toast.success("Mentor profile updated successfully!");
        await fetchUser({ silent: true });
      } else {
        toast.error(res.data?.msg || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving mentor profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] lg:ml-75 p-6 md:p-10 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Edit profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your mentor profile information & domain expertise</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">Profile completion</span>
            <div className="w-32 bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#34C759] h-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-sm font-bold text-[#172033]">{completionPercentage}%</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-[#8E1B2E] text-white font-semibold text-sm rounded-xl hover:bg-[#721524] transition disabled:opacity-50"
          >
            {saving ? "SAVING..." : "SUBMIT"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 0 ? "text-[#8E1B2E] border-b-2 border-[#8E1B2E]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Basic Information {completionPercentage > 40 ? "✓" : "!"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${
            activeTab === 1 ? "text-[#8E1B2E] border-b-2 border-[#8E1B2E]" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Domain Expertise {form.mentorshipDomains.length > 0 ? "✓" : "!"}
        </button>
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Photo / Logo Upload */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <label className="text-sm font-bold text-gray-700 self-start mb-3">
                Photo/Logo <span className="text-red-500">*</span>
              </label>
              <div className="relative group w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#8E1B2E] transition">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
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
                  onChange={handlePhotoChange}
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
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Current Organization</label>
                  <input
                    type="text"
                    value={form.currentOrganization}
                    onChange={(e) => setForm({ ...form, currentOrganization: e.target.value })}
                    placeholder="Current Organization"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Designation"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Headline <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Serial Entrepreneur | Technology Evangelist | Story Teller etc..."
                  className="w-full p-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  About you <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  placeholder="Write about your key interests and past experience"
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
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
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
                  placeholder="Choose or enter state"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Choose or enter city"
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">X URL</label>
                <input
                  type="text"
                  value={form.socialLinks.x}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, x: e.target.value } })}
                  placeholder="X Url"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">YouTube URL</label>
                <input
                  type="text"
                  value={form.socialLinks.youtube}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, youtube: e.target.value } })}
                  placeholder="Youtube Url"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={form.socialLinks.facebook}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, facebook: e.target.value } })}
                  placeholder="Facebook Url"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#8E1B2E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={form.socialLinks.instagram}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, instagram: e.target.value } })}
                  placeholder="Instagram Url"
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

      {/* TAB 2: DOMAIN EXPERTISE */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-8">
          {/* Mentorship Domains */}
          <div>
            <h2 className="text-lg font-bold text-[#8E1B2E] mb-2">Domain Expertise</h2>
            <p className="text-sm font-semibold text-gray-700 mb-4">
              I am interested in providing mentorship to startups in the following domains: <span className="text-red-500">*</span>
              <span className="block text-xs font-normal text-gray-400 mt-0.5">Select maximum 5 options</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MENTOR_DOMAINS.map((domain) => {
                const checked = form.mentorshipDomains.includes(domain);
                return (
                  <label
                    key={domain}
                    onClick={() => toggleDomain(domain)}
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

          {/* Industry Specialisations */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Industry specialisation <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs font-normal text-gray-400 mb-4">Select maximum 5 options</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {INDUSTRY_SPECIALISATIONS.map((industry) => {
                const checked = form.industrySpecialisations.includes(industry);
                return (
                  <label
                    key={industry}
                    onClick={() => toggleIndustry(industry)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none text-xs font-semibold ${
                      checked ? "border-[#8E1B2E] bg-[#FFF8F8] text-[#8E1B2E]" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded accent-[#8E1B2E]" />
                    <span>{industry}</span>
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

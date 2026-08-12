import React, { useState, useEffect } from "react";
import { useStore } from "../../../zustand/store";

const Tag = ({ children }) => (
  <span className="inline-block px-3.5 py-1.5 mr-2 mb-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
    {children}
  </span>
);

const SectionHeader = ({ children }) => (
  <div className="flex items-center mb-4">
    <span className="w-1.5 h-5 bg-[#8E1B2E] rounded-sm mr-3" />
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
  </div>
);

export default function IncubatorProfile() {
  const { user } = useStore();
  const [profile, setProfile] = useState({});

  useEffect(() => {
    try {
      const raw = user?.profile?.profile;
      setProfile(raw ? JSON.parse(raw) : user?.profile || {});
    } catch {
      setProfile(user?.profile || {});
    }
  }, [user]);

  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ");
  const avatar = profile?.logo || profile?.photo || user?.account?.image || "/default_user.png";

  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks)
        .filter(([_, url]) => Boolean(url))
        .map(([key, url]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          url,
        }))
    : [];

  return (
    <div className="min-h-screen bg-[#F4F6F9] lg:ml-75 p-6 md:p-10 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <img
            src={avatar}
            alt="Incubator Logo"
            className="w-24 h-24 rounded-2xl object-cover border border-gray-200 bg-gray-50 shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-bold text-[#172033]">
              {profile?.organizationName || profile?.companyName || user?.company_name || "Incubator / Accelerator"}
            </h1>
            <p className="text-sm font-semibold text-[#8E1B2E] mt-1">
              {profile?.organizationType || "Incubator"} {profile?.establishedIn ? `• Estd. ${profile.establishedIn}` : ""}
            </p>
            {location && <p className="text-xs text-gray-500 mt-1">📍 {location}</p>}
          </div>
        </div>

        <a
          href="/profile/edit"
          className="px-6 py-3 bg-[#8E1B2E] text-white font-bold text-sm rounded-xl hover:bg-[#721524] transition text-center shadow-sm"
        >
          Edit Profile
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tagline & Headline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            {profile?.tagline && (
              <p className="text-base font-semibold text-[#8E1B2E] mb-4">
                "{profile.tagline}"
              </p>
            )}

            <SectionHeader>Overview</SectionHeader>
            <p className="text-sm text-gray-800 font-medium mb-4">
              {profile?.headline || "No summary provided."}
            </p>

            <SectionHeader>About Organization</SectionHeader>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {profile?.about || "No detailed description provided."}
            </p>
          </div>

          {/* Focus Industry Domains */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <SectionHeader>Focus Industry Domains</SectionHeader>
            <div>
              {profile?.industryDomains?.length ? (
                profile.industryDomains.map((ind) => <Tag key={ind}>{ind}</Tag>)
              ) : (
                <p className="text-xs text-gray-400">No industry domains specified.</p>
              )}
            </div>
          </div>

          {/* Program Offerings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <SectionHeader>Program Benefits & Offerings</SectionHeader>
            <div>
              {profile?.programBenefits?.length ? (
                profile.programBenefits.map((b) => <Tag key={b}>{b}</Tag>)
              ) : (
                <p className="text-xs text-gray-400">No program benefits specified.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <SectionHeader>Target Stages</SectionHeader>
            <div>
              {profile?.targetStages?.length ? (
                profile.targetStages.map((s) => <Tag key={s}>{s}</Tag>)
              ) : (
                <p className="text-xs text-gray-400">All startup stages.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <SectionHeader>Social Links</SectionHeader>
            <div className="space-y-3">
              {socialLinks.length ? (
                socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-[#8E1B2E] hover:underline"
                  >
                    <span>🔗</span> {s.label}
                  </a>
                ))
              ) : (
                <p className="text-xs text-gray-400">No social links added.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

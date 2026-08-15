import React, { useState, useEffect } from "react";
import { useStore } from "../../../zustand/store";

const Tag = ({ children }) => (
  <span className="inline-block px-3.5 py-1.5 mr-2 mb-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
    {children}
  </span>
);

const SectionHeader = ({ children }) => (
  <div className="flex items-center mb-4">
    <span className="w-1.5 h-5 bg-[#8E1B2E] rounded-sm mr-3 flex-shrink-0" />
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
  </div>
);

export default function MentorProfile() {
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
  const avatar = profile?.photo || profile?.logo || user?.account?.image || "/default_user.png";

  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks)
        .filter(([_, url]) => Boolean(url))
        .map(([key, url]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          url,
        }))
    : [];

  return (
    <div className="min-h-screen bg-[#F4F6F9] lg:ml-75 pt-20 lg:pt-10 px-4 sm:px-6 md:px-8 lg:px-10 pb-6 sm:pb-8 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 mb-6 sm:mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <img
            src={avatar}
            alt="Mentor Logo"
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl object-cover border border-gray-200 bg-gray-50 shadow-sm flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
              {profile?.name || user?.name || "Mentor Name"}
            </h1>
            <p className="text-sm font-semibold text-[#8E1B2E] mt-1">
              {profile?.designation ? `${profile.designation} at ` : ""}
              {profile?.currentOrganization || user?.company_name || "Mentor"}
            </p>
            {location && <p className="text-xs text-gray-500 mt-1">📍 {location}</p>}
          </div>
        </div>

        <a
          href="/profile/edit"
          className="self-start sm:self-auto flex-shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#8E1B2E] text-white font-bold text-sm rounded-xl hover:bg-[#721524] transition text-center shadow-sm whitespace-nowrap"
        >
          Edit Profile
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Headline & About */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
            <SectionHeader>Headline</SectionHeader>
            <p className="text-base font-semibold text-gray-800 italic mb-6 leading-relaxed">
              &ldquo;{profile?.headline || "No headline provided."}&rdquo;
            </p>

            <SectionHeader>About</SectionHeader>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {profile?.about || "No about information provided."}
            </p>
          </div>

          {/* Mentorship Domains */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
            <SectionHeader>Mentorship Domains</SectionHeader>
            <div>
              {profile?.mentorshipDomains?.length ? (
                profile.mentorshipDomains.map((domain) => <Tag key={domain}>{domain}</Tag>)
              ) : (
                <p className="text-xs text-gray-400">No mentorship domains specified.</p>
              )}
            </div>
          </div>

          {/* Industry Specialisations */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
            <SectionHeader>Industry Specialisations</SectionHeader>
            <div>
              {profile?.industrySpecialisations?.length ? (
                profile.industrySpecialisations.map((ind) => <Tag key={ind}>{ind}</Tag>)
              ) : (
                <p className="text-xs text-gray-400">No industry specialisations specified.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 shadow-sm">
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



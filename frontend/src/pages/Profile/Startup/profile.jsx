import React, { useState, useEffect } from "react";
import { useStore } from '../../../zustand/store';

const Tag = ({ children }) => (
  <span className="inline-block px-4 py-2 mr-3 mb-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
    {children}
  </span>
);

const SectionHeader = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      <span className="w-1.5 h-6 bg-red-700 rounded-sm mr-3" />
      <h2 className="text-xl font-bold text-gray-900">{children}</h2>
    </div>
    {action}
  </div>
);

const Field = ({ label, value }) => (
  <div className="mb-5">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-base font-semibold text-gray-900">{value ?? "—"}</p>
  </div>
);

const TeamMember = ({ initial, name, role, linkedinUrl }) => (
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-lg font-bold text-blue-900 flex-shrink-0">
      {initial || "?"}
    </div>
    <div>
      <p className="font-bold text-gray-900">{name || "—"}</p>
      {role && <p className="text-sm text-gray-500 -mt-0.5">{role}</p>}
      {linkedinUrl ? (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-red-700 hover:underline"
        >
          LinkedIn
        </a>
      ) : null}
    </div>
  </div>
);

export default function StartupProfile() {
  const { user } = useStore();
  const [profile, setProfile] = useState({})
  const [pitchDeckFullScreen, setPitchDeckFullScreen] = useState(false);

  useEffect(() => {
    try {
      const profile = user?.profile?.profile;
      setProfile(profile ? JSON.parse(profile) : {});
    } catch (err) {
      console.error("Invalid profile JSON:", err);
      setProfile({});
    }
  }, [user]);

  const location = [profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(", ") || '';

  const socialLinks = profile?.socialLinks
    ? Object.entries(profile.socialLinks)
      .filter(([_, url]) => Boolean(url))
      .map(([key, url]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        url,
      }))
    : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 lg:ml-75 pt-20 lg:pt-0 flex items-center justify-center text-gray-400 p-6">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-75 pt-20 lg:pt-0">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-white rounded-xl border border-gray-100 p-5 sm:p-8 mb-6 gap-4">
          <div className="flex flex-col xs:flex-row gap-4 sm:gap-6">
            <img
              src={profile?.logo || "/default_user.png"}
              alt="logo"
              className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl object-cover bg-gray-50 border border-gray-200 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 leading-tight uppercase break-words">
                {profile?.companyName || user?.company_name || 'No Company Name'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-6 mt-2 text-gray-600 text-sm font-medium">
                {location && <span>{location}</span>}
                {profile?.yearOfIncorporation && <span>Estd. in {profile.yearOfIncorporation}</span>}
                {profile?.isIncorporated && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Incorporated</span>
                )}
              </div>
            </div>
          </div>

          <a
            href="/profile/edit"
            className="self-start sm:self-auto flex-shrink-0 flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-sm whitespace-nowrap"
          >
            Edit Profile
          </a>
        </div>

        {!profile ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12 text-center text-red-600 font-semibold text-lg">
            Profile details not found. Please click &ldquo;Edit Profile&rdquo; above.
          </div>
        ) : (
          <>
            {/* Elevator Pitch */}
            {profile?.elevatorPitch && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 mb-6 text-center">
                <p className="italic font-semibold text-gray-800 text-base sm:text-lg leading-relaxed">
                  &ldquo;{profile.elevatorPitch}&rdquo;
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-8">
                <SectionHeader>Company Metrics</SectionHeader>
                <Field label="Revenue Stage" value={profile?.revenueStage} />
                <Field label="Time to Commercialise" value={profile?.timeToCommercialise} />
                <Field label="Funding Stage" value={profile?.fundingStage} />
                <Field label="Currently Raising Funds?" value={profile?.isRaisingFunds ? "Yes" : "No"} />

                <SectionHeader>Business Details</SectionHeader>
                <Field label="Product Stage" value={profile?.productStage} />
                <Field label="Company Size" value={profile?.companySize} />
                <Field label="TRL Level" value={profile?.technologyReadinessLevel} />

                <p className="text-sm text-gray-500 mb-2">Business Models</p>
                <div className="mb-5">
                  {profile?.businessModels?.length
                    ? profile.businessModels.map((m) => <Tag key={m}>{m}</Tag>)
                    : "—"}
                </div>

                <SectionHeader>Intellectual Property</SectionHeader>
                <Field label="Has IP?" value={profile?.hasIP ? "Yes" : "No"} />
                <Field label="IP Status" value={profile?.ipStatus} />
                <Field label="Registered In" value={profile?.ipRegisteredIn} />

                <SectionHeader>Industry & Tech</SectionHeader>
                <p className="text-sm text-gray-500 mb-2">Industry Domains</p>
                <div className="mb-4">
                  {profile?.industryDomains?.length
                    ? profile.industryDomains.map((d) => <Tag key={d}>{d}</Tag>)
                    : "—"}
                </div>
                <p className="text-sm text-gray-500 mb-2">Technology Domains</p>
                <div className="mb-5">
                  {profile?.technologyDomains?.length
                    ? profile.technologyDomains.map((d) => <Tag key={d}>{d}</Tag>)
                    : "—"}
                </div>

                <SectionHeader>Online Presence</SectionHeader>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.length
                    ? socialLinks.map((s) => (
                      <a
                        key={s.label}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 font-medium hover:underline flex items-center gap-1"
                      >
                        — {s.label}
                      </a>
                    ))
                    : "—"}
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-8">
                  <SectionHeader
                    action={
                      profile?.pitchDeckUrl ? (
                        <button
                          onClick={() => setPitchDeckFullScreen(true)}
                          className="flex items-center gap-1 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                        >
                          ⛶ Full Screen
                        </button>
                      ) : null
                    }
                  >
                    Pitch Deck
                  </SectionHeader>
                  {profile?.pitchDeckUrl ? (
                    <iframe
                      src={profile.pitchDeckUrl}
                      title="Pitch Deck Preview"
                      className="w-full h-64 sm:h-80 lg:h-96 rounded-lg border border-gray-200"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm italic">No pitch deck available.</p>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-8">
                  <SectionHeader>Leadership Team</SectionHeader>
                  <div className="flex flex-col gap-6 mb-8">
                    {profile?.leadershipTeam?.length ? (
                      profile.leadershipTeam.map((member, idx) => (
                        <TeamMember
                          key={idx}
                          initial={member.name?.charAt(0)}
                          name={member.name}
                          role={member.designation || member.role}
                          linkedinUrl={member.linkedin}
                        />
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">No leadership team details.</p>
                    )}
                  </div>

                  <SectionHeader>Advisory Board</SectionHeader>
                  <div className="flex flex-col gap-6">
                    {profile?.advisoryBoard?.length ? (
                      profile.advisoryBoard.map((member, idx) => (
                        <TeamMember
                          key={idx}
                          initial={member.name?.charAt(0)}
                          name={member.name}
                          linkedinUrl={member.linkedin}
                        />
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">No advisory board members.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-8">
                  <SectionHeader>Company Brief</SectionHeader>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {profile?.companyBrief || "No company brief provided."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <footer className="text-center text-xs text-gray-400 mt-10">
          Copyright © {new Date().getFullYear()} ecosystem.firstwingsconnect.com. All rights reserved.
        </footer>
      </div>

      {/* Fullscreen Modal */}
      {pitchDeckFullScreen && profile?.pitchDeckUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPitchDeckFullScreen(false)}
        >
          <div className="relative w-full h-full max-w-6xl">
            <iframe
              src={profile.pitchDeckUrl}
              title="Pitch Deck Full Screen"
              className="w-full h-full rounded-lg border-0 bg-white"
            />
            <button
              onClick={() => setPitchDeckFullScreen(false)}
              className="absolute -top-10 sm:-top-12 right-0 text-white text-2xl sm:text-3xl font-bold"
            >
              × Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

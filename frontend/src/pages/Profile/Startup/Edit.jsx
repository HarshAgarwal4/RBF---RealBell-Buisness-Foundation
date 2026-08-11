import React, { useMemo, useState } from "react";
import axios from "../../../services/axios";

/**
 * EditProfile
 * ---------------------------------------------------------------------------
 * Multi-tab editable form (Basic Information / Industry & Technology /
 * Financials / Pitch Deck) that updates a startup profile.
 *
 * SECURITY NOTES (why this is safe against DOM tampering / devtools editing):
 *
 * 1. No FormData/DOM scraping. Every input is a *controlled* React element
 *    bound to a named key in the `form` state object declared below. We never
 *    read `event.target.form` or serialize the raw <form>, so adding a hidden
 *    input, renaming an input's `name` attribute, or unhiding a disabled
 *    field in devtools has **no effect** — there is no code path that turns
 *    arbitrary DOM nodes into request data.
 *
 * 2. Explicit whitelist. `buildPayload()` constructs the request body field
 *    by field, by name, from `EDITABLE_FIELDS` (simple fields) plus a set of
 *    hand-written validation blocks for the richer, structured fields (team,
 *    advisory board, social links, IP, etc). Any property that exists on
 *    `form` but isn't explicitly handled is dropped. There's no `...form`
 *    spread sent to the API.
 *
 * 3. Enum revalidation. For select/radio/checkbox fields we re-check the
 *    submitted value against the same allowed-options array the UI was built
 *    from, right before sending. This catches the case where someone forces
 *    a <select> or radio input into a value that was never a legitimate
 *    <option> by editing the DOM directly.
 *
 * 4. This is defense-in-depth, not a substitute for server-side
 *    authorization. A malicious client can always bypass the browser
 *    entirely and call the API directly with curl/Postman, so the backend
 *    for POST /update-profile MUST independently: verify the authenticated
 *    session owns this profile, re-apply the same whitelist + enum
 *    validation server-side, and ignore/reject any unexpected keys. The
 *    frontend whitelist below only prevents *accidental or DOM-tampering*
 *    payload injection from this UI — it cannot enforce security by itself.
 */

// ----- Fixed option sets (single source of truth for both UI + validation) -----

const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "500+"];

const TRL_OPTIONS = [
    "TRL 1 - Basic principles observed",
    "TRL 2 - Technology concept formulated",
    "TRL 3 - Experimental proof of concept",
    "TRL 4 - Technology validated in lab",
    "TRL 5 - Technology validated in relevant environment",
    "TRL 6 - Technology demonstrated in relevant environment",
    "TRL 7 - System prototype demonstrated",
    "TRL 8 - System complete and qualified",
    "TRL 9 - Actual system proven in operational environment",
];

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

const INDUSTRY_DOMAIN_OPTIONS = [
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

const TECHNOLOGY_DOMAIN_OPTIONS = [
    "3D Printing",
    "5G",
    "AI/ML",
    "Analytics",
    "API",
    "AR-VR-MR",
    "Big Data",
    "Biometrics Tech",
    "Blockchain",
    "Cloud Computing",
    "Computer Vision",
    "Data Infrastructure",
    "Embedded Finance",
    "Energy Storage",
    "Genomics Tech",
    "Geospatial & Space Tech",
    "IAAS",
    "IoT",
    "Mobile App",
    "Nanotechnology",
    "NLP/ Deep Learning",
    "Open Banking",
    "PAAS",
    "Quantum Computing",
    "RegTech",
    "Renewable Energy",
    "Robotics",
    "SAAS",
    "Web Platform",
    "Others",
];

const FUNDING_STAGE_OPTIONS = [
    "Bootstrapped",
    "Friends and Family",
    "Seed/Angel Funded",
    "Pre Series",
    "Series A or beyond",
];

const REVENUE_STAGE_OPTIONS = ["Pre Revenue", "Post Revenue"];

const TIME_TO_COMMERCIALISE_OPTIONS = [
    "0-6 months",
    "6-12 months",
    "12-36 months",
    "More than 36 months",
];

// NOTE: This is a representative list, not exhaustive. Extend as needed.
// State/City are left as free-text inputs below since a full
// country -> state -> city cascade needs a reference dataset this
// component doesn't have; swap in real cascading selects if you have one.
const COUNTRY_OPTIONS = [
    "India",
    "United States",
    "United Kingdom",
    "United Arab Emirates",
    "Singapore",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Netherlands",
    "Japan",
    "China",
    "Brazil",
    "South Africa",
    "Other",
];

const PRODUCT_STAGE_OPTIONS = [
    "Idea",
    "MVP or POC",
    "Early Revenues",
    "Growth stage",
];

const BUSINESS_MODEL_OPTIONS = ["B2B", "B2B2C", "B2C", "B2G", "D2C"];

const TEAM_ROLE_OPTIONS = [
    "Founder",
    "Co-Founder",
    "CEO",
    "CFO",
    "CTO",
    "COO",
    "CMO",
    "Other",
];

const IP_STATUS_OPTIONS = ["Applied", "Granted", "Yet to apply"];

const IP_REGISTERED_OPTIONS = ["India", "US", "Other"];

const ELEVATOR_PITCH_MAX = 300;
const MAX_DOMAIN_SELECTIONS = 5;

const EDITABLE_FIELDS = {
    companyName: { type: "string" },
    companySize: { type: "enum", options: COMPANY_SIZE_OPTIONS },
    technologyReadinessLevel: { type: "enum", options: TRL_OPTIONS },
    isIncorporated: { type: "boolean" },
    yearOfIncorporation: { type: "enum", options: YEAR_OPTIONS },
    industryDomains: {
        type: "enumArray",
        options: INDUSTRY_DOMAIN_OPTIONS,
        max: MAX_DOMAIN_SELECTIONS,
    },
    technologyDomains: {
        type: "enumArray",
        options: TECHNOLOGY_DOMAIN_OPTIONS,
        max: MAX_DOMAIN_SELECTIONS,
    },
    fundingStage: { type: "enum", options: FUNDING_STAGE_OPTIONS },
    isRaisingFunds: { type: "boolean" },
    revenueStage: { type: "enum", options: REVENUE_STAGE_OPTIONS },
    timeToCommercialise: {
        type: "enum",
        options: TIME_TO_COMMERCIALISE_OPTIONS,
    },
};

const EMPTY_TEAM_MEMBER = { name: "", linkedin: "", role: "", designation: "" };
const EMPTY_ADVISORY_MEMBER = { name: "", linkedin: "" };

const INITIAL_FORM = {
    companyName: "",
    companySize: "",
    technologyReadinessLevel: "",
    isIncorporated: true,
    yearOfIncorporation: "",
    industryDomains: [],
    technologyDomains: [],
    fundingStage: "",
    isRaisingFunds: false,
    revenueStage: "",
    timeToCommercialise: "",

    // --- Place of incorporation ---
    country: "",
    state: "",
    city: "",

    // --- Pitch / brief ---
    elevatorPitch: "",
    companyBrief: "",

    // --- Product / business model ---
    productStage: "",
    businessModels: [],

    // --- Team ---
    leadershipTeam: [{ ...EMPTY_TEAM_MEMBER }],
    advisoryBoard: [],

    // --- Social links ---
    socialLinks: {
        website: "",
        linkedin: "",
        twitter: "",
        youtube: "",
        facebook: "",
        instagram: "",
    },

    // --- Intellectual property ---
    hasIP: false,
    ipStatus: "",
    ipRegisteredIn: "",
};

const TABS = [
    "Basic Information",
    "Industry/Technology",
    "Financials",
    "Pitch Deck",
];

// Loose but real URL validation (protects against garbage/non-URL strings
// without pretending to fully verify a live, reachable link).
const isValidUrl = (value) => {
    if (!value) return false;
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

const ToggleYesNo = ({ value, onChange }) => (
    <div className="flex rounded-lg overflow-hidden border border-gray-300 w-fit">
        <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-6 py-2.5 text-sm font-semibold ${value ? "bg-gray-900 text-white" : "bg-white text-gray-700"
                }`}
        >
            Yes
        </button>

        <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-6 py-2.5 text-sm font-semibold ${!value ? "bg-gray-900 text-white" : "bg-white text-gray-700"
                }`}
        >
            No
        </button>
    </div>
);

const RadioCard = ({ label, checked, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`flex items-center gap-3 border rounded-lg px-4 py-3.5 text-left flex-1 min-w-45 ${checked ? "border-red-700" : "border-gray-200"
            }`}
    >
        <span
            className={`w-4 h-4 rounded-full border-2 shrink-0 ${checked ? "border-red-700" : "border-gray-300"
                }`}
        >
            {checked && (
                <span className="block w-2 h-2 m-0.5 rounded-full bg-red-700" />
            )}
        </span>

        <span className="text-sm font-medium text-gray-800">{label}</span>
    </button>
);

const CheckboxGrid = ({ options, selected, onToggle, max }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
        {options.map((option) => {
            const checked = selected.includes(option);
            const disabled = !checked && max != null && selected.length >= max;

            return (
                <label
                    key={option}
                    className={`flex items-center gap-2 text-sm ${disabled ? "text-gray-300" : "text-gray-700"
                        }`}
                >
                    <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(option)}
                        className="w-4 h-4 accent-red-700"
                    />

                    {option}
                </label>
            );
        })}
    </div>
);

export default function EditProfile({ profile }) {
    const [form, setForm] = useState(() => ({
        ...INITIAL_FORM,
        ...profile,
        // Deep-guard nested defaults in case `profile` only partially overrides them.
        socialLinks: {
            ...INITIAL_FORM.socialLinks,
            ...(profile?.socialLinks || {}),
        },
        leadershipTeam:
            profile?.leadershipTeam?.length > 0
                ? profile.leadershipTeam
                : [{ ...EMPTY_TEAM_MEMBER }],
        advisoryBoard: profile?.advisoryBoard || [],
    }));

    const [activeTab, setActiveTab] = useState(0);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [logoFile, setLogoFile] = useState(null);
    const [pitchDeckFile, setPitchDeckFile] = useState(null);

    const updateField = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateSocialLink = (key, value) => {
        setForm((prev) => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [key]: value,
            },
        }));
    };

    const toggleDomain = (fieldKey, option, max) => {
        setForm((prev) => {
            const current = prev[fieldKey];
            const exists = current.includes(option);

            if (exists) {
                return {
                    ...prev,
                    [fieldKey]: current.filter((o) => o !== option),
                };
            }

            if (max != null && current.length >= max) return prev;

            return {
                ...prev,
                [fieldKey]: [...current, option],
            };
        });
    };

    // --- Leadership team helpers ---
    const updateTeamMember = (index, key, value) => {
        setForm((prev) => {
            const next = [...prev.leadershipTeam];
            next[index] = { ...next[index], [key]: value };
            return { ...prev, leadershipTeam: next };
        });
    };

    const addTeamMember = () => {
        setForm((prev) => ({
            ...prev,
            leadershipTeam: [...prev.leadershipTeam, { ...EMPTY_TEAM_MEMBER }],
        }));
    };

    const removeTeamMember = (index) => {
        setForm((prev) => ({
            ...prev,
            leadershipTeam: prev.leadershipTeam.filter((_, i) => i !== index),
        }));
    };

    // --- Advisory board helpers ---
    const updateAdvisoryMember = (index, key, value) => {
        setForm((prev) => {
            const next = [...prev.advisoryBoard];
            next[index] = { ...next[index], [key]: value };
            return { ...prev, advisoryBoard: next };
        });
    };

    const addAdvisoryMember = () => {
        setForm((prev) => ({
            ...prev,
            advisoryBoard: [...prev.advisoryBoard, { ...EMPTY_ADVISORY_MEMBER }],
        }));
    };

    const removeAdvisoryMember = (index) => {
        setForm((prev) => ({
            ...prev,
            advisoryBoard: prev.advisoryBoard.filter((_, i) => i !== index),
        }));
    };

    const buildPayload = () => {
        const payload = {};

        // --- Simple, generically-validated fields ---
        for (const [key, rule] of Object.entries(EDITABLE_FIELDS)) {
            const value = form[key];

            if (rule.type === "enum") {
                if (value && !rule.options.includes(value)) {
                    throw new Error(`Invalid value for ${key}`);
                }

                payload[key] = value || null;
            } else if (rule.type === "enumArray") {
                const clean = (value || []).filter((v) =>
                    rule.options.includes(v)
                );

                if (clean.length > rule.max) {
                    throw new Error(`Too many selections for ${key}`);
                }

                payload[key] = clean;
            } else if (rule.type === "boolean") {
                payload[key] = Boolean(value);
            } else {
                payload[key] =
                    typeof value === "string" ? value.trim() : "";
            }
        }

        // --- Place of incorporation ---
        if (!form.country) {
            throw new Error("Country is required.");
        }
        if (!COUNTRY_OPTIONS.includes(form.country)) {
            throw new Error("Invalid country selected.");
        }
        payload.country = form.country;
        payload.state = (form.state || "").trim();
        payload.city = (form.city || "").trim();

        // --- Elevator pitch ---
        const elevatorPitch = (form.elevatorPitch || "").trim();
        if (!elevatorPitch) {
            throw new Error("Elevator pitch is required.");
        }
        if (elevatorPitch.length > ELEVATOR_PITCH_MAX) {
            throw new Error(
                `Elevator pitch must be ${ELEVATOR_PITCH_MAX} characters or fewer.`
            );
        }
        payload.elevatorPitch = elevatorPitch;

        // --- Company brief ---
        const companyBrief = (form.companyBrief || "").trim();
        if (!companyBrief) {
            throw new Error("Company brief is required.");
        }
        payload.companyBrief = companyBrief;

        // --- Product stage ---
        if (!form.productStage) {
            throw new Error("Product stage is required.");
        }
        if (!PRODUCT_STAGE_OPTIONS.includes(form.productStage)) {
            throw new Error("Invalid product stage selected.");
        }
        payload.productStage = form.productStage;

        // --- Business models ---
        const businessModels = (form.businessModels || []).filter((m) =>
            BUSINESS_MODEL_OPTIONS.includes(m)
        );
        if (businessModels.length === 0) {
            throw new Error("Select at least one business model.");
        }
        payload.businessModels = businessModels;

        // --- Leadership team ---
        const leadershipTeam = (form.leadershipTeam || []).map((member, idx) => {
            const name = (member.name || "").trim();
            if (!name) {
                throw new Error(
                    `Leadership team member #${idx + 1} needs a name.`
                );
            }

            const linkedin = (member.linkedin || "").trim();
            if (linkedin && !isValidUrl(linkedin)) {
                throw new Error(
                    `Leadership team member #${idx + 1} has an invalid LinkedIn URL.`
                );
            }

            const role = member.role || "";
            if (role && !TEAM_ROLE_OPTIONS.includes(role)) {
                throw new Error(
                    `Leadership team member #${idx + 1} has an invalid role.`
                );
            }

            return {
                name,
                linkedin,
                role,
                designation: (member.designation || "").trim(),
            };
        });

        if (leadershipTeam.length === 0) {
            throw new Error("At least one leadership team member is required.");
        }
        payload.leadershipTeam = leadershipTeam;

        // --- Advisory board (rows only count if something was entered) ---
        const advisoryBoard = (form.advisoryBoard || [])
            .filter(
                (member) =>
                    (member.name || "").trim() || (member.linkedin || "").trim()
            )
            .map((member, idx) => {
                const name = (member.name || "").trim();
                if (!name) {
                    throw new Error(
                        `Advisory board member #${idx + 1} needs a name.`
                    );
                }

                const linkedin = (member.linkedin || "").trim();
                if (linkedin && !isValidUrl(linkedin)) {
                    throw new Error(
                        `Advisory board member #${idx + 1} has an invalid LinkedIn URL.`
                    );
                }

                return { name, linkedin };
            });
        payload.advisoryBoard = advisoryBoard;

        // --- Social links ---
        const socialLinkKeys = [
            "website",
            "linkedin",
            "twitter",
            "youtube",
            "facebook",
            "instagram",
        ];
        const socialLinks = {};
        for (const key of socialLinkKeys) {
            const raw = (form.socialLinks?.[key] || "").trim();
            if (raw && !isValidUrl(raw)) {
                throw new Error(`${key} URL is invalid.`);
            }
            socialLinks[key] = raw;
        }
        payload.socialLinks = socialLinks;

        // --- Intellectual property (conditional block) ---
        payload.hasIP = Boolean(form.hasIP);

        if (payload.hasIP) {
            if (!IP_STATUS_OPTIONS.includes(form.ipStatus)) {
                throw new Error("Select the current status of your IP.");
            }
            if (!IP_REGISTERED_OPTIONS.includes(form.ipRegisteredIn)) {
                throw new Error("Select where the IP is registered.");
            }
            payload.ipStatus = form.ipStatus;
            payload.ipRegisteredIn = form.ipRegisteredIn;
        } else {
            // Clearing these out when hasIP is false prevents stale/spoofed
            // IP status values from a previous "Yes" state being persisted.
            payload.ipStatus = null;
            payload.ipRegisteredIn = null;
        }

        return payload;
    };

    const saveTab = async () => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const payload = buildPayload();

            const formData = new FormData();
            formData.append("profile", JSON.stringify(payload));

            if (logoFile) {
                formData.append("logo", logoFile);
            }

            if (pitchDeckFile) {
                formData.append("pitchDeck", pitchDeckFile);
            }

            const res = await axios.post("/update-profile", formData);
            void res.data;

            setSaveSuccess(true);
        } catch (err) {
            setSaveError(
                err?.response?.data?.message ||
                err.message ||
                "Failed to save profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const tabValid = useMemo(() => {
        try {
            buildPayload();
            return true;
        } catch {
            return false;
        }
    }, [form]);

    const elevatorPitchLength = (form.elevatorPitch || "").length;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <div className="ml-75 w-full px-10 py-8">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
                    Edit Startup Details
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 bg-white rounded-xl border border-gray-100 p-2 mb-6">
                    {TABS.map((tab, i) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(i)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold ${activeTab === i
                                ? "bg-gray-50 text-red-700"
                                : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            {tab}

                            <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">
                                ✓
                            </span>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-8 min-h-105">
                    {/* --- Basic Information --- */}
                    {activeTab === 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-6">
                                Company Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Logo
                                    </label>

                                    <label className="block w-28 h-28 bg-yellow-400 rounded-xl cursor-pointer relative overflow-hidden">
                                        {logoFile && (
                                            <img
                                                src={URL.createObjectURL(logoFile)}
                                                alt="Logo preview"
                                                className="w-full h-full object-cover"
                                            />
                                        )}

                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            className="hidden"
                                            onChange={(e) =>
                                                setLogoFile(e.target.files?.[0] || null)
                                            }
                                        />
                                    </label>

                                    <p className="text-xs text-gray-400 mt-2">
                                        File types: png, jpg, jpeg and max size of 512kb.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name *
                                    </label>

                                    <input
                                        type="text"
                                        value={form.companyName}
                                        onChange={(e) =>
                                            updateField("companyName", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company size
                                    </label>

                                    <select
                                        value={form.companySize}
                                        onChange={(e) =>
                                            updateField("companySize", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    >
                                        <option value="">Select company size</option>

                                        {COMPANY_SIZE_OPTIONS.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Technology Readiness Level (TRL)
                                    </label>

                                    <select
                                        value={form.technologyReadinessLevel}
                                        onChange={(e) =>
                                            updateField(
                                                "technologyReadinessLevel",
                                                e.target.value
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    >
                                        <option value="">Select your TRL</option>

                                        {TRL_OPTIONS.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Is your startup incorporated?
                                    </label>

                                    <ToggleYesNo
                                        value={form.isIncorporated}
                                        onChange={(v) =>
                                            updateField("isIncorporated", v)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Year of Incorporation *
                                    </label>

                                    <select
                                        value={form.yearOfIncorporation}
                                        onChange={(e) =>
                                            updateField(
                                                "yearOfIncorporation",
                                                e.target.value
                                            )
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    >
                                        <option value="">Select year</option>

                                        {YEAR_OPTIONS.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ---------------------------------------------------- */}
                            {/* Everything below is new: added under Incorporation   */}
                            {/* ---------------------------------------------------- */}

                            {/* Place of Incorporation */}
                            <p className="font-semibold text-red-700 mb-3">
                                Place of Incorporation
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country *
                                    </label>

                                    <select
                                        value={form.country}
                                        onChange={(e) =>
                                            updateField("country", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    >
                                        <option value="">Select country</option>

                                        {COUNTRY_OPTIONS.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        value={form.state}
                                        onChange={(e) =>
                                            updateField("state", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) =>
                                            updateField("city", e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Elevator pitch */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Elevator pitch (not more than {ELEVATOR_PITCH_MAX}{" "}
                                    characters) *
                                </label>

                                <textarea
                                    value={form.elevatorPitch}
                                    maxLength={ELEVATOR_PITCH_MAX}
                                    onChange={(e) =>
                                        updateField("elevatorPitch", e.target.value)
                                    }
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-y"
                                />

                                <p
                                    className={`text-xs mt-1 ${elevatorPitchLength > ELEVATOR_PITCH_MAX
                                        ? "text-red-600"
                                        : "text-gray-400"
                                        }`}
                                >
                                    {elevatorPitchLength}/{ELEVATOR_PITCH_MAX} characters
                                </p>
                            </div>

                            {/* Company brief */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Brief *
                                </label>

                                <textarea
                                    value={form.companyBrief}
                                    onChange={(e) =>
                                        updateField("companyBrief", e.target.value)
                                    }
                                    rows={5}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-y"
                                />
                            </div>

                            {/* Product stage */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    Product Stage *
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    {PRODUCT_STAGE_OPTIONS.map((option) => (
                                        <RadioCard
                                            key={option}
                                            label={option}
                                            checked={form.productStage === option}
                                            onChange={() =>
                                                updateField("productStage", option)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Business models */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    Business Models *
                                </p>

                                <CheckboxGrid
                                    options={BUSINESS_MODEL_OPTIONS}
                                    selected={form.businessModels}
                                    max={null}
                                    onToggle={(o) =>
                                        toggleDomain("businessModels", o, null)
                                    }
                                />
                            </div>

                            {/* Leadership Team */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <p className="font-semibold text-gray-800 mb-4">
                                    Leadership Team *
                                </p>

                                <div className="flex flex-col gap-4">
                                    {form.leadershipTeam.map((member, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start bg-gray-50 border border-gray-100 rounded-lg p-4"
                                        >
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.name}
                                                    onChange={(e) =>
                                                        updateTeamMember(
                                                            idx,
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    LinkedIn profile
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.linkedin}
                                                    onChange={(e) =>
                                                        updateTeamMember(
                                                            idx,
                                                            "linkedin",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="https://www.linkedin.com/in/..."
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Select Role
                                                </label>
                                                <select
                                                    value={member.role}
                                                    onChange={(e) =>
                                                        updateTeamMember(
                                                            idx,
                                                            "role",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                                                >
                                                    <option value="">Select role</option>
                                                    {TEAM_ROLE_OPTIONS.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.designation}
                                                    onChange={(e) =>
                                                        updateTeamMember(
                                                            idx,
                                                            "designation",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. CEO, CFO, CTO, CMO etc."
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                                                />
                                            </div>

                                            <div className="flex items-end gap-2 h-full">
                                                <button
                                                    type="button"
                                                    onClick={() => removeTeamMember(idx)}
                                                    disabled={form.leadershipTeam.length <= 1}
                                                    className="bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg px-4 py-2.5 text-sm"
                                                >
                                                    X
                                                </button>

                                                {idx === form.leadershipTeam.length - 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={addTeamMember}
                                                        className="bg-gray-900 text-white font-bold rounded-lg px-4 py-2.5 text-sm"
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Advisory Board */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <p className="font-semibold text-gray-800 mb-4">
                                    Advisory board
                                </p>

                                <div className="flex flex-col gap-4">
                                    {form.advisoryBoard.map((member, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                                        >
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.name}
                                                    onChange={(e) =>
                                                        updateAdvisoryMember(
                                                            idx,
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Linkedin profile
                                                </label>
                                                <input
                                                    type="text"
                                                    value={member.linkedin}
                                                    onChange={(e) =>
                                                        updateAdvisoryMember(
                                                            idx,
                                                            "linkedin",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeAdvisoryMember(idx)}
                                                className="bg-red-700 text-white font-bold rounded-lg px-4 py-2.5 text-sm w-fit"
                                            >
                                                X
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addAdvisoryMember}
                                        className="bg-gray-900 text-white font-semibold rounded-lg px-4 py-2.5 text-sm w-fit"
                                    >
                                        + Add advisor
                                    </button>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="mb-8 pb-8 border-b border-gray-100">
                                <p className="font-semibold text-red-700 mb-3">
                                    Social Links
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={form.socialLinks.website}
                                        onChange={(e) =>
                                            updateSocialLink("website", e.target.value)
                                        }
                                        placeholder="Enter website URL"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />

                                    <input
                                        type="text"
                                        value={form.socialLinks.linkedin}
                                        onChange={(e) =>
                                            updateSocialLink("linkedin", e.target.value)
                                        }
                                        placeholder="Linkedin Url"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />

                                    <input
                                        type="text"
                                        value={form.socialLinks.twitter}
                                        onChange={(e) =>
                                            updateSocialLink("twitter", e.target.value)
                                        }
                                        placeholder="X/Twitter Url"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />

                                    <input
                                        type="text"
                                        value={form.socialLinks.youtube}
                                        onChange={(e) =>
                                            updateSocialLink("youtube", e.target.value)
                                        }
                                        placeholder="Youtube Url"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />

                                    <input
                                        type="text"
                                        value={form.socialLinks.facebook}
                                        onChange={(e) =>
                                            updateSocialLink("facebook", e.target.value)
                                        }
                                        placeholder="Facebook URL"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />

                                    <input
                                        type="text"
                                        value={form.socialLinks.instagram}
                                        onChange={(e) =>
                                            updateSocialLink("instagram", e.target.value)
                                        }
                                        placeholder="Instagram Url"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Intellectual Property */}
                            <div>
                                <p className="font-semibold text-red-700 mb-3">
                                    Intellectual Property (IP)
                                </p>

                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Do you have any intellectual property (IP)?
                                </p>

                                <ToggleYesNo
                                    value={form.hasIP}
                                    onChange={(v) => {
                                        updateField("hasIP", v);
                                        if (!v) {
                                            updateField("ipStatus", "");
                                            updateField("ipRegisteredIn", "");
                                        }
                                    }}
                                />

                                {form.hasIP && (
                                    <div className="mt-6">
                                        <p className="text-sm font-medium text-gray-700 mb-3">
                                            Current Status of IP
                                        </p>

                                        <div className="flex flex-wrap gap-4 mb-6">
                                            {IP_STATUS_OPTIONS.map((option) => (
                                                <RadioCard
                                                    key={option}
                                                    label={option}
                                                    checked={form.ipStatus === option}
                                                    onChange={() =>
                                                        updateField("ipStatus", option)
                                                    }
                                                />
                                            ))}
                                        </div>

                                        <p className="text-sm font-medium text-gray-700 mb-3">
                                            Where is the IP registered?
                                        </p>

                                        <div className="flex flex-wrap gap-4">
                                            {IP_REGISTERED_OPTIONS.map((option) => (
                                                <RadioCard
                                                    key={option}
                                                    label={option}
                                                    checked={form.ipRegisteredIn === option}
                                                    onChange={() =>
                                                        updateField(
                                                            "ipRegisteredIn",
                                                            option
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Industry / Technology --- */}
                    {activeTab === 1 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">
                                Industry/Technology
                            </h2>

                            <p className="font-semibold text-gray-800 mt-6 mb-1">
                                Choose Industry Domains{" "}
                                <span className="text-red-600 font-normal text-sm">
                                    (max {MAX_DOMAIN_SELECTIONS})
                                </span>
                            </p>

                            <CheckboxGrid
                                options={INDUSTRY_DOMAIN_OPTIONS}
                                selected={form.industryDomains}
                                max={MAX_DOMAIN_SELECTIONS}
                                onToggle={(o) =>
                                    toggleDomain(
                                        "industryDomains",
                                        o,
                                        MAX_DOMAIN_SELECTIONS
                                    )
                                }
                            />

                            <p className="font-semibold text-gray-800 mt-8 mb-1">
                                Choose Technology Domains{" "}
                                <span className="text-red-600 font-normal text-sm">
                                    (max {MAX_DOMAIN_SELECTIONS})
                                </span>
                            </p>

                            <CheckboxGrid
                                options={TECHNOLOGY_DOMAIN_OPTIONS}
                                selected={form.technologyDomains}
                                max={MAX_DOMAIN_SELECTIONS}
                                onToggle={(o) =>
                                    toggleDomain(
                                        "technologyDomains",
                                        o,
                                        MAX_DOMAIN_SELECTIONS
                                    )
                                }
                            />
                        </div>
                    )}

                    {/* --- Financials --- */}
                    {activeTab === 2 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-6">
                                Financials
                            </h2>

                            <p className="font-semibold text-gray-800 mb-3">
                                Funding stage *
                            </p>

                            <div className="flex flex-wrap gap-4 mb-8">
                                {FUNDING_STAGE_OPTIONS.map((option) => (
                                    <RadioCard
                                        key={option}
                                        label={option}
                                        checked={form.fundingStage === option}
                                        onChange={() =>
                                            updateField("fundingStage", option)
                                        }
                                    />
                                ))}
                            </div>

                            <p className="font-semibold text-gray-800 mb-3">
                                Are you raising funds?
                            </p>

                            <ToggleYesNo
                                value={form.isRaisingFunds}
                                onChange={(v) =>
                                    updateField("isRaisingFunds", v)
                                }
                            />

                            <p className="font-semibold text-gray-800 mt-8 mb-3">
                                Current revenue stage *
                            </p>

                            <div className="flex flex-wrap gap-4 mb-8">
                                {REVENUE_STAGE_OPTIONS.map((option) => (
                                    <RadioCard
                                        key={option}
                                        label={option}
                                        checked={form.revenueStage === option}
                                        onChange={() =>
                                            updateField("revenueStage", option)
                                        }
                                    />
                                ))}
                            </div>

                            <p className="font-semibold text-gray-800 mb-3">
                                Time to commercialise?
                            </p>

                            <div className="flex flex-wrap gap-4">
                                {TIME_TO_COMMERCIALISE_OPTIONS.map((option) => (
                                    <RadioCard
                                        key={option}
                                        label={option}
                                        checked={form.timeToCommercialise === option}
                                        onChange={() =>
                                            updateField("timeToCommercialise", option)
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Pitch Deck --- */}
                    {activeTab === 3 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-6">
                                Your pitch deck
                            </h2>

                            <label className="block font-semibold text-gray-800 mb-2">
                                Upload Pitch Deck *
                            </label>

                            <p className="text-xs text-gray-400 mb-3">
                                Your pitch deck is private and visible only to your
                                connections.
                            </p>

                            <input
                                type="file"
                                accept=".pdf,.ppt,.pptx"
                                onChange={(e) =>
                                    setPitchDeckFile(e.target.files?.[0] || null)
                                }
                                className="block w-full text-sm border border-gray-300 rounded-lg px-4 py-3 mb-4"
                            />
                        </div>
                    )}
                </div>

                {/* Status messages */}
                <div className="mt-3 min-h-5">
                    {saveError && (
                        <p className="text-sm text-red-600 font-medium">
                            {saveError}
                        </p>
                    )}

                    {saveSuccess && !saveError && (
                        <p className="text-sm text-green-600 font-medium">
                            Saved successfully.
                        </p>
                    )}

                    {!tabValid && (
                        <p className="text-sm text-amber-600 font-medium">
                            Some values look invalid and won't be saved as shown.
                        </p>
                    )}
                </div>

                {/* Nav / Save controls */}
                <div className="flex items-center justify-between mt-6">
                    <div>
                        {activeTab > 0 && (
                            <button
                                type="button"
                                onClick={() => setActiveTab((prev) => prev - 1)}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Previous
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab < TABS.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setActiveTab((prev) => prev + 1)}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={saveTab}
                                disabled={saving || !tabValid}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving..." : "Save Profile"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
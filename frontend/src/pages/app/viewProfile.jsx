import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, Check, ArrowLeft, Send, Clock3 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../services/axios";
import Sidebar from "../../components/Sidebar";
import { useStore } from "../../zustand/store";

function formatLabel(key = "") {
    return String(key)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
    );
}

function isEmptyValue(value) {
    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (isPlainObject(value)) return Object.keys(value).length === 0;
    return false;
}

function renderPrimitive(value) {
    if (value === null || value === undefined || value === "") {
        return <span className="text-slate-400">--</span>;
    }

    if (typeof value === "boolean") {
        return (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {value ? "Yes" : "No"}
            </span>
        );
    }

    if (value instanceof Date) {
        return value.toLocaleString();
    }

    return <span className="break-words break-all text-slate-800 leading-relaxed">{String(value)}</span>;
}

function DynamicNode({ label, value, depth = 0 }) {
    const hasNested =
        Array.isArray(value) || isPlainObject(value) || value instanceof Date;

    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white p-4 ${depth > 0 ? "shadow-none" : "shadow-sm"
                }`}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8E1B2E]">
                    {formatLabel(label)}
                </h3>
            </div>
            <div className="text-sm leading-7 text-slate-700">
                {hasNested ? (
                    <NodeRenderer value={value} depth={depth + 1} />
                ) : (
                    renderPrimitive(value)
                )}
            </div>
        </div>
    );
}

function NodeRenderer({ value, depth = 0 }) {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <span className="text-slate-400">--</span>;
        }

        return (
            <div className="space-y-3">
                {value.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                        {isPlainObject(item) ? (
                            <div className="space-y-3">
                                {Object.entries(item).map(([childKey, childValue]) => (
                                    <div
                                        key={childKey}
                                        className="grid gap-1 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4"
                                    >
                                        <p className="text-sm font-medium text-slate-500">
                                            {formatLabel(childKey)}
                                        </p>
                                        <div className="text-sm text-slate-800">
                                            <NodeRenderer value={childValue} depth={depth + 1} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            renderPrimitive(item)
                        )}
                    </div>
                ))}
            </div>
        );
    }

    if (isPlainObject(value)) {
        const entries = Object.entries(value);

        if (entries.length === 0) {
            return <span className="text-slate-400">--</span>;
        }

        return (
            <div className="space-y-3">
                {entries.map(([key, childValue]) => (
                    <div
                        key={key}
                        className={`grid gap-2 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 ${depth > 0 ? "md:grid-cols-[180px_minmax(0,1fr)]" : "md:grid-cols-[220px_minmax(0,1fr)]"
                            }`}
                    >
                        <p className="text-sm font-medium text-slate-500">
                            {formatLabel(key)}
                        </p>
                        <div className="text-sm text-slate-800">
                            <NodeRenderer value={childValue} depth={depth + 1} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return renderPrimitive(value);
}

const FALLBACK_SECTIONS = [
    {
        title: "Business Details",
        fields: {
            "Business Model": "--",
            "Industry Domain": "--",
            "Product Stage": "--",
        },
    },
    {
        title: "Product Information",
        fields: {
            "Company Brief": "--",
            "Target Customers": "--",
            "Traction": "--",
        },
    },
    {
        title: "Social Links",
        fields: {
            Website: "--",
            LinkedIn: "--",
            Twitter: "--",
        },
    },
    {
        title: "Other Details",
        fields: {
            "Founding Year": "--",
            "Location": "--",
            "Funding Stage": "--",
        },
    },
];

function getSavedState(user, profileId) {
    return !!user?.saved_profiles?.some(
        (item) => String(item.profile) === String(profileId)
    );
}

function getConnectionState(user, profileId) {
    const entry = user?.connections?.find(
        (item) => String(item.with) === String(profileId)
    );

    if (!entry) {
        return {
            label: "Connect",
            status: "none",
            icon: Send,
        };
    }

    if (entry.status === "accepted") {
        return {
            label: "Connected",
            status: "accepted",
            icon: Check,
        };
    }

    if (entry.status === "pending" && entry.direction === "sent") {
        return {
            label: "Request Sent",
            status: "pending-sent",
            icon: Clock3,
        };
    }

    if (entry.status === "pending" && entry.direction === "received") {
        return {
            label: "Accept Request",
            status: "pending-received",
            icon: Send,
        };
    }

    return {
        label: "Connect",
        status: "none",
        icon: Send,
    };
}

export default function ViewProfile() {
    const { type, id } = useParams();
    const { user, fetchUser } = useStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function fetchProfile() {
            setLoading(true);
            setError("");

            try {
                const res = await axios.get(`/connect/profile/${id}`);
                if (ignore) return;

                if (res.data?.status === 1) {
                    try {
                        const raw = res.data?.profile?.profile?.profile;
                        setProfile(raw ? JSON.parse(raw) : {});
                    } catch (err) {
                        console.error(err);
                        setProfile({});
                    }
                } else {
                    setProfile({});
                    setError(res.data?.msg || "Unable to fetch profile");
                }
            } catch (err) {
                if (ignore) return;
                setProfile({});
                setError(
                    err?.response?.data?.msg ||
                    "Unable to fetch profile right now"
                );
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        if (id) {
            fetchProfile();
        } else {
            setLoading(false);
            setError("Missing profile id");
        }

        return () => {
            ignore = true;
        };
    }, [id]);

    useEffect(() => {
        console.log('profile =', profile)
    }, [profile])

    const profileData = profile || {};
    const hasProfileData = useMemo(() => {
        if (!isPlainObject(profileData)) return !isEmptyValue(profileData);
        return Object.keys(profileData).length > 0;
    }, [profileData]);

    const saved = getSavedState(user, id);
    const connectionState = getConnectionState(user, id);
    const ConnectionIcon = connectionState.icon;

    const handleSave = async () => {
        if (!id || saving) return;
        setSaving(true);
        try {
            const res = await axios.post(`/connect/${id}/save`);
            if (res.data?.status === 1) {
                toast.success(res.data?.msg || "Updated save status");
                await fetchUser();
            } else {
                toast.error(res.data?.msg || "Unable to update save status");
            }
        } catch (err) {
            toast.error(
                err?.response?.data?.msg || "Unable to update save status"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleConnect = async () => {
        if (!id || connecting) return;
        setConnecting(true);
        try {
            const res = await axios.post(`/connect/${id}/connect`);
            if (res.data?.status === 1) {
                toast.success(res.data?.msg || "Connection updated");
                await fetchUser();
            } else {
                toast.error(res.data?.msg || "Unable to update connection");
            }
        } catch (err) {
            toast.error(
                err?.response?.data?.msg || "Unable to update connection"
            );
        } finally {
            setConnecting(false);
        }
    };

    return (
        <>
            <Sidebar />
            <div className="min-h-screen bg-[#f5f7fb] lg:ml-75 pt-16 lg:pt-0">
                <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 xl:px-10">
                        <Link
                            to={type ? `/connect/${type}` : "/connections"}
                            className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            <ArrowLeft size={15} />
                            {type ? `Back to ${type}` : "Back to Connections"}
                        </Link>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || !profile}
                                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl border border-[#8E1B2E] bg-white px-3.5 text-xs sm:text-sm font-semibold text-[#8E1B2E] transition hover:bg-[#fcf5f6] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                <Bookmark size={16} />
                                {saved ? "Saved" : saving ? "Saving..." : "Save"}
                            </button>

                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={connecting || !profile}
                                className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-[#8E1B2E] px-4 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#741728] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                <ConnectionIcon size={16} />
                                {connecting
                                    ? "Please wait..."
                                    : connectionState.label}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8 xl:px-10">
                    {loading ? (
                        <div className="rounded-2xl border bg-white p-8 text-center text-gray-600 shadow-sm">
                            Loading profile...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
                            {error}
                        </div>
                    ) : profile ? (
                        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] xl:p-7">
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8E1B2E]">
                                    Profile
                                </p>
                            </div>

                            {hasProfileData ? (
                                <div className="space-y-5">
                                    {Object.entries(profileData).map(([key, value]) => (
                                        <DynamicNode key={key} label={key} value={value} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-5 xl:grid-cols-2">
                                    {FALLBACK_SECTIONS.map((section) => (
                                        <section
                                            key={section.title}
                                            className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5"
                                        >
                                            <h2 className="text-lg font-bold text-slate-900">
                                                {section.title}
                                            </h2>
                                            <div className="mt-4 space-y-4">
                                                {Object.entries(section.fields).map(
                                                    ([fieldLabel, fieldValue]) => (
                                                        <div
                                                            key={fieldLabel}
                                                            className="grid gap-2 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[180px_minmax(0,1fr)]"
                                                        >
                                                            <p className="text-sm font-medium text-slate-500">
                                                                {fieldLabel}
                                                            </p>
                                                            <p className="text-sm text-slate-400">
                                                                {fieldValue}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}

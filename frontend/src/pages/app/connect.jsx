import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../services/axios";
import { Search, ChevronDown, Bookmark, UserCircle2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";

function formatTypeLabel(type = "") {
    const value = String(type).replace(/-/g, " ").trim();
    if (!value) return "Connect";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getProfileMeta(profile) {
    return [
        profile?.company_name,
        profile?.name,
        profile?.account?.designation,
        profile?.email,
        profile?.phone,
    ]
        .filter(Boolean)
        .join(" • ");
}

function getProfileImage(profile) {
    return (
        profile?.account?.image ||
        "https://placehold.co/600x480?text=Profile"
    );
}

function ProfileCard({ profile, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="block h-full w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left shadow-sm border border-gray-100 dark:border-slate-700 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
        >
            <div className="relative h-48 sm:h-56">
                <img
                    src={getProfileImage(profile)}
                    alt={profile?.company_name || profile?.name || "Profile"}
                    className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                    <h3 className="truncate text-base sm:text-lg font-bold text-white">
                        {profile?.company_name || profile?.name || "Unnamed Profile"}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-white/85">
                        {profile?.account?.designation || profile?.company_type || "Connected profile"}
                    </p>
                </div>
            </div>

            <div className="space-y-2 p-3.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
                    <UserCircle2 size={14} className="shrink-0 text-gray-400 dark:text-slate-400" />
                    <span className="truncate">{getProfileMeta(profile) || "No additional details"}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 px-2.5 py-0.5 text-xs capitalize text-gray-700 dark:text-slate-200 font-medium">
                        {profile?.company_type || "member"}
                    </span>
                </div>
            </div>
        </button>
    );
}

export default function Connect() {
    const { type } = useParams();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const titleLabel = formatTypeLabel(type);
        document.title = `Explore ${titleLabel} Directory | RealBell Business Foundation`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute(
            "content",
            `Connect with verified ${titleLabel} leaders, founders, investors, and mentors on RealBell Business Foundation.`
        );
    }, [type]);

    useEffect(() => {
        let ignore = false;

        async function fetchProfiles() {
            setLoading(true);
            setError("");

            try {
                const res = await axios.get(`/connect/${type}`);
                if (ignore) return;

                if (res.data?.status === 1) {
                    setProfiles(res.data?.profiles || []);
                } else {
                    setProfiles([]);
                    setError(res.data?.msg || "Unable to fetch profiles");
                }
            } catch (err) {
                if (ignore) return;
                setProfiles([]);
                setError(
                    err?.response?.data?.msg || "Unable to fetch profiles"
                );
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchProfiles();
        return () => {
            ignore = true;
        };
    }, [type]);

    const filteredProfiles = useMemo(() => {
        const value = search.trim().toLowerCase();
        if (!value) return profiles;

        return profiles.filter((profile) => {
            const haystack = [
                profile?.company_name,
                profile?.name,
                profile?.account?.designation,
                profile?.company_type,
                profile?.email,
                profile?.phone,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(value);
        });
    }, [profiles, search]);

    return (
        <>
            <Sidebar />
            <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-900 lg:ml-75 pt-16 lg:pt-0 text-slate-800 dark:text-slate-100">
                <div className="sticky top-0 z-20 border-b border-gray-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 xl:px-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold capitalize tracking-tight text-gray-900 dark:text-white">
                                {formatTypeLabel(type)}
                            </h1>

                            <div className="relative w-full sm:w-72 lg:w-96">
                                <Search
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
                                    size={16}
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={`Search ${type || "profiles"}...`}
                                    className="h-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 pl-10 pr-4 text-xs sm:text-sm text-gray-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-red-500/20"
                                />
                            </div>
                        </div>

                        <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-700 px-4 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer self-start sm:self-auto shrink-0">
                            <Bookmark size={16} />
                            SAVED PROFILES
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800 px-4 py-3 sm:px-6 xl:px-10 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm sm:text-base font-bold text-gray-800 dark:text-slate-200">
                                Refine Results:
                            </h2>
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                {filteredProfiles.length} profiles found
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="h-9 rounded-xl bg-[#0B1639] dark:bg-slate-700 px-3.5 text-xs font-semibold text-white hover:bg-[#152352] dark:hover:bg-slate-600 transition cursor-pointer">
                                + ADD FILTER
                            </button>
                            <button className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer">
                                Trending
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 xl:p-8">
                    {loading ? (
                        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-8 text-center text-sm text-gray-500 dark:text-slate-400 shadow-xs">
                            Loading profiles...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-8 text-center text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-8 text-center text-sm text-gray-500 dark:text-slate-400 shadow-xs">
                            No profiles found for this search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProfiles.map((profile) => (
                                <ProfileCard
                                    key={profile._id}
                                    profile={profile}
                                    onClick={() =>
                                        navigate(`/connect/${type}/${profile._id}`)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

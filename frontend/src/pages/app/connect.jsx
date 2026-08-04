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
            className="block h-full w-full overflow-hidden rounded-2xl bg-white text-left shadow-md transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        >
            <div className="relative h-77.5">
                <img
                    src={getProfileImage(profile)}
                    alt={profile?.company_name || profile?.name || "Profile"}
                    className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/70 to-transparent p-5">
                    <h3 className="truncate text-2xl font-bold text-white">
                        {profile?.company_name || profile?.name || "Unnamed Profile"}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-white/85">
                        {profile?.account?.designation || profile?.company_type || "Connected profile"}
                    </p>
                </div>
            </div>

            <div className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserCircle2 size={16} />
                    <span className="truncate">{getProfileMeta(profile) || "No additional details"}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg border px-3 py-1 text-sm capitalize">
                        {profile?.company_type || "unknown"}
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
                    err?.response?.data?.msg ||
                        "Unable to fetch profiles right now"
                );
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        if (type) {
            fetchProfiles();
        } else {
            setLoading(false);
            setProfiles([]);
        }

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
                profile?.email,
                profile?.phone,
                profile?.company_type,
                profile?.account?.designation,
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
            <div className="min-h-screen bg-[#f5f7fb] lg:ml-75">
                <div className="sticky top-0 z-20 border-b bg-white">
                    <div className="flex flex-col gap-6 px-6 py-6 xl:flex-row xl:items-center xl:justify-between xl:px-10">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                            <h1 className="text-3xl font-bold capitalize xl:text-4xl">
                                {formatTypeLabel(type)}
                            </h1>

                            <div className="relative w-full xl:w-125">
                                <Search
                                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={20}
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={`Search ${type || "profiles"}`}
                                    className="h-14 w-full rounded-2xl border pl-14 pr-5 outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <button className="flex h-14 items-center gap-3 rounded-xl border border-red-700 px-6 font-semibold text-red-700">
                            <Bookmark size={18} />
                            SAVED PROFILES
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between xl:px-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold xl:text-3xl">
                                Refine Results:
                            </h2>
                            <span className="italic text-gray-400">
                                {filteredProfiles.length} profiles found
                            </span>
                        </div>

                        <div className="flex gap-4">
                            <button className="h-12 rounded-xl bg-[#0B1639] px-6 font-semibold text-white">
                                + ADD FILTER
                            </button>
                            <button className="flex h-12 items-center gap-2 rounded-xl border px-5">
                                Trending
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 xl:p-10">
                    {loading ? (
                        <div className="rounded-2xl border bg-white p-8 text-center text-gray-600 shadow-sm">
                            Loading profiles...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
                            {error}
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="rounded-2xl border bg-white p-8 text-center text-gray-600 shadow-sm">
                            No profiles found for this search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

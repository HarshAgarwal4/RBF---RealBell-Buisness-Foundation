import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Clock,
    Video,
    MapPin,
    Users,
    Plus,
    Search,
    X,
    Pencil,
    ExternalLink,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store"

/* ------------------------------- helpers ------------------------------- */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
        for (let m = 0; m < 60; m += 30) {
            slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
    }
    return slots;
})();

const startOfWeek = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
};

const endOfWeek = (date) => {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
};

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const formatDayLabel = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });

const formatShortDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* --------------------------------- page --------------------------------- */

export default function Meetings() {
    const { user } = useStore();
    const myId = user?._id;

    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const [selectedDate, setSelectedDate] = useState(null);

    const [activeTab, setActiveTab] = useState("meetings"); // meetings | notes
    const [requestTab, setRequestTab] = useState("received"); // received | sent
    const [searchTerm, setSearchTerm] = useState("");

    const [meetings, setMeetings] = useState([]);
    const [connections, setConnections] = useState([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

    /* ------------------------------ data fetch ------------------------------ */

    const fetchMeetings = useCallback(async () => {
        try {
            setLoadingMeetings(true);
            const res = await axios.get("/meetings");
            setMeetings(res.data.meetings || []);
        } catch (err) {
            console.error("Failed to load meetings", err);
        } finally {
            setLoadingMeetings(false);
        }
    }, []);

    const fetchConnections = useCallback(async () => {
        try {
            const res = await axios.get("/meetings/connections");
            setConnections(res.data.connections || []);
        } catch (err) {
            console.error("Failed to load connections", err);
        }
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    useEffect(() => {
        if (showScheduleModal) fetchConnections();
    }, [showScheduleModal, fetchConnections]);

    /* -------------------------------- derived -------------------------------- */

    const receivedRequests = useMemo(
        () => meetings.filter((m) => m.status === "pending" && m.attendee?._id === myId),
        [meetings, myId]
    );

    const sentRequests = useMemo(
        () => meetings.filter((m) => m.status === "pending" && m.organizer?._id === myId),
        [meetings, myId]
    );

    const acceptedMeetings = useMemo(
        () =>
            meetings
                .filter((m) => m.status === "accepted")
                .sort((a, b) => new Date(a.date) - new Date(b.date)),
        [meetings]
    );

    const thisWeekMeetings = useMemo(() => {
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        return acceptedMeetings.filter((m) => {
            const d = new Date(m.date);
            return d >= start && d <= end;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acceptedMeetings]);

    const meetingDatesSet = useMemo(
        () => new Set(meetings.map((m) => new Date(m.date).toDateString())),
        [meetings]
    );

    const visibleMeetings = useMemo(() => {
        let list = selectedDate
            ? acceptedMeetings.filter((m) => isSameDay(new Date(m.date), selectedDate))
            : acceptedMeetings;

        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            list = list.filter((m) => m.title?.toLowerCase().includes(q));
        }

        return list;
    }, [acceptedMeetings, selectedDate, searchTerm]);

    /* -------------------------------- calendar -------------------------------- */

    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= totalDays; i++) days.push(i);
        return days;
    }, [startDay, totalDays]);

    const goToMonth = (offset) =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));

    const goToToday = () => {
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate((prev) => (prev && isSameDay(prev, clicked) ? null : clicked));
    };

    /* ------------------------------ meeting actions ------------------------------ */

    const handleRespond = async (id, status) => {
        try {
            await axios.patch(`/meetings/${id}/respond`, { status });
            fetchMeetings();
        } catch (err) {
            console.error("Failed to respond to meeting", err);
        }
    };

    const handleCancel = async (id) => {
        try {
            await axios.delete(`/meetings/${id}`);
            fetchMeetings();
        } catch (err) {
            console.error("Failed to cancel meeting", err);
        }
    };

    /* --------------------------------- render --------------------------------- */

    return (
        <>
            <Sidebar />
            <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-3 sm:px-6 lg:px-8 pb-10 min-h-screen bg-[#f5f7fb] max-w-full overflow-hidden">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">Meetings</h1>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500">Manage and schedule meetings.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-[#b03052] px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#96263f] cursor-pointer"
                        >
                            <Plus size={16} />
                            Schedule Meeting
                        </button>

                        <button
                            onClick={() => setShowAvailabilityModal(true)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-[#0b1a3a] px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#132b5c] cursor-pointer"
                        >
                            <Pencil size={15} />
                            Edit Availability
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-12 gap-4 sm:gap-6">

                    {/* LEFT */}
                    <div className="col-span-12 rounded-3xl bg-white p-4 sm:p-6 shadow-sm lg:col-span-8">

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    className={`rounded-xl px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                                        activeTab === "meetings"
                                            ? "bg-[#b03052] text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setActiveTab("meetings")}
                                >
                                    All Meetings
                                </button>

                                <button
                                    className={`rounded-xl px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                                        activeTab === "notes"
                                            ? "bg-[#b03052] text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                    onClick={() => setActiveTab("notes")}
                                >
                                    Meeting Notes
                                </button>
                            </div>
                        </div>

                        {/* Calendar nav */}
                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-lg sm:text-xl font-bold text-[#b03052]">{monthName}</h2>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => goToMonth(-1)}
                                    className="flex-1 sm:flex-initial rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-medium hover:bg-gray-100 cursor-pointer"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={goToToday}
                                    className="flex-1 sm:flex-initial rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-medium hover:bg-gray-100 cursor-pointer"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => goToMonth(1)}
                                    className="flex-1 sm:flex-initial rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-medium hover:bg-gray-100 cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        {/* Weekday header */}
                        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-500">
                            {WEEKDAYS.map((d) => (
                                <div key={d}>{d}</div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="mt-2 grid grid-cols-7 gap-2">
                            {calendarDays.map((day, index) => {
                                if (!day) return <div key={index} />;

                                const cellDate = new Date(
                                    currentMonth.getFullYear(),
                                    currentMonth.getMonth(),
                                    day
                                );
                                const isToday = isSameDay(cellDate, today);
                                const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
                                const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                                const hasMeeting = meetingDatesSet.has(cellDate.toDateString());

                                return (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => handleDayClick(day)}
                                        className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition
                                            ${isToday ? "border-green-400 bg-green-50 font-bold text-green-700" : "border-gray-100 bg-white"}
                                            ${isSelected && !isToday ? "border-black bg-gray-50 font-semibold" : ""}
                                            ${!isToday && !isSelected && isWeekend ? "text-[#b03052]" : ""}
                                            hover:border-black hover:bg-gray-50
                                        `}
                                    >
                                        {day}
                                        {hasMeeting && (
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isToday ? "bg-green-600" : "bg-[#b03052]"
                                                }`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Meeting list */}
                        <div className="mt-8 space-y-4">
                            {activeTab === "meetings" ? (
                                <>
                                    {selectedDate && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500">
                                                Showing meetings for{" "}
                                                <span className="font-medium text-gray-800">
                                                    {selectedDate.toLocaleDateString("en-US", {
                                                        weekday: "long",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            </p>
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="text-sm font-medium text-[#b03052] hover:underline"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    )}

                                    {loadingMeetings ? (
                                        <div className="rounded-2xl border border-dashed p-16 text-center text-gray-400">
                                            Loading meetings...
                                        </div>
                                    ) : visibleMeetings.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed p-16 text-center text-gray-500">
                                            No meetings found
                                        </div>
                                    ) : (
                                        visibleMeetings.map((meeting) => {
                                            const other =
                                                meeting.organizer?._id === myId
                                                    ? meeting.attendee
                                                    : meeting.organizer;

                                            return (
                                                <div
                                                    key={meeting._id}
                                                    className="flex items-center justify-between rounded-2xl border p-5 transition hover:shadow-md"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="rounded-xl bg-gray-100 p-3">
                                                            {meeting.mode === "Online" ? (
                                                                <Video className="h-6 w-6" />
                                                            ) : (
                                                                <MapPin className="h-6 w-6" />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-semibold">
                                                                {meeting.title}
                                                            </h3>

                                                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={15} />
                                                                    {meeting.startTime}
                                                                </span>
                                                                <span>{formatShortDate(meeting.date)}</span>
                                                                <span>{meeting.mode}</span>
                                                                {other?.name && (
                                                                    <span>with {other.name}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {meeting.mode === "Online" ? (
                                                        <a
                                                            href={meeting.meetingUrl || "#"}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 rounded-xl border px-4 py-2 transition hover:bg-black hover:text-white"
                                                        >
                                                            Join
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    ) : (
                                                        <span className="rounded-xl border px-4 py-2 text-sm text-gray-500">
                                                            In-person
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed p-16 text-center text-gray-500">
                                    No Meeting Notes Available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="col-span-12 space-y-6 lg:col-span-4">

                        {/* Search */}
                        <div className="rounded-3xl bg-white p-5 shadow-sm">
                            <div className="relative">
                                <Search
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search meetings..."
                                    className="w-full rounded-xl border py-3 pl-11 pr-4 outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        {/* Requests */}
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <div className="flex gap-5 border-b pb-3">
                                <button
                                    onClick={() => setRequestTab("received")}
                                    className={`-mb-3 border-b-2 pb-2 text-sm font-semibold ${
                                        requestTab === "received"
                                            ? "border-[#b03052] text-[#b03052]"
                                            : "border-transparent text-gray-500"
                                    }`}
                                >
                                    Meeting Requests
                                </button>
                                <button
                                    onClick={() => setRequestTab("sent")}
                                    className={`-mb-3 border-b-2 pb-2 text-sm font-semibold ${
                                        requestTab === "sent"
                                            ? "border-[#b03052] text-[#b03052]"
                                            : "border-transparent text-gray-500"
                                    }`}
                                >
                                    Sent Requests
                                </button>
                            </div>

                            <div className="mt-5 space-y-4">
                                {requestTab === "received" ? (
                                    receivedRequests.length === 0 ? (
                                        <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                                            No meetings found
                                        </div>
                                    ) : (
                                        receivedRequests.map((m) => (
                                            <div key={m._id} className="rounded-2xl border p-4">
                                                <h4 className="font-semibold">{m.title}</h4>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {formatDayLabel(m.date)} • {m.startTime}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    from {m.organizer?.name}
                                                </p>

                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        onClick={() => handleRespond(m._id, "accepted")}
                                                        className="flex-1 rounded-xl bg-black py-2 text-white hover:bg-gray-800"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRespond(m._id, "declined")}
                                                        className="flex-1 rounded-xl border py-2 hover:bg-gray-100"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )
                                ) : sentRequests.length === 0 ? (
                                    <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                                        No meetings found
                                    </div>
                                ) : (
                                    sentRequests.map((m) => (
                                        <div key={m._id} className="rounded-2xl border p-4">
                                            <h4 className="font-semibold">{m.title}</h4>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {formatDayLabel(m.date)} • {m.startTime}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                to {m.attendee?.name}
                                            </p>

                                            <div className="mt-4">
                                                <button
                                                    onClick={() => handleCancel(m._id)}
                                                    className="w-full rounded-xl border py-2 text-sm hover:bg-gray-100"
                                                >
                                                    Cancel Request
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* This week */}
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold">Meetings this week</h3>

                            <div className="mt-5 space-y-4">
                                {thisWeekMeetings.length === 0 ? (
                                    <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                                        No meetings found
                                    </div>
                                ) : (
                                    thisWeekMeetings.map((m) => {
                                        const other =
                                            m.organizer?._id === myId ? m.attendee : m.organizer;
                                        return (
                                            <div
                                                key={m._id}
                                                className="flex items-center gap-4 rounded-xl bg-gray-50 p-4"
                                            >
                                                <div className="rounded-lg bg-black p-3 text-white">
                                                    <Users size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{m.title}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDayLabel(m.date)} • {m.startTime}
                                                        {other?.name ? ` • ${other.name}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showScheduleModal && (
                    <ScheduleMeetingModal
                        connections={connections}
                        onClose={() => setShowScheduleModal(false)}
                        onScheduled={fetchMeetings}
                    />
                )}

                {showAvailabilityModal && (
                                                    <EditAvailabilityModal onClose={() => setShowAvailabilityModal(false)} />
                                                )}
                                            </div>
                                        </>
                                    );
                                }

/* -------------------------- schedule meeting modal -------------------------- */

export function ScheduleMeetingModal({ onClose, targetConnection = null }) {
    const { user } = useStore();
    const [connections, setConnections] = useState([]);
    const [form, setForm] = useState({
        with: targetConnection?._id || "",
        title: "",
        duration: 30,
        agenda: "",
        date: "",
        startTime: "",
        mode: "Online",
        meetingTool: "In-built",
        meetingUrl: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!targetConnection) {
            axios.get("/connect/connections").then((res) => {
                if (res.data?.status === 1) {
                    const active = res.data.connections?.active || [];
                    setConnections(
                        active.map((c) => ({
                            _id: c.profile?._id || c._id,
                            name: c.profile?.name || c.profile?.company_name || "Connection",
                            company_name: c.profile?.company_name,
                        }))
                    );
                }
            });
        }
    }, [targetConnection]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.with || !form.title || !form.agenda || !form.date || !form.startTime) {
            setError("Please fill all required fields.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                with: form.with,
                title: form.title,
                duration: Number(form.duration),
                agenda: form.agenda,
                date: form.date,
                startTime: form.startTime,
                mode: form.mode,
                meetingTool: form.mode === "Online" ? form.meetingTool : undefined,
                meetingUrl:
                    form.mode === "Online" && form.meetingTool === "External"
                        ? form.meetingUrl
                        : undefined,
            };

            await axios.post("/meetings", payload);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err?.response?.data?.msg || "Failed to schedule meeting.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-2xl border border-gray-100 dark:border-slate-700 text-gray-900 dark:text-slate-100">
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Schedule a Meeting</h2>
                    <button onClick={onClose} type="button" className="p-1 text-gray-500 hover:text-black dark:hover:text-white cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                            Participant <span className="text-red-500">*</span>
                        </label>
                        {targetConnection ? (
                            <input
                                type="text"
                                readOnly
                                value={targetConnection.name || targetConnection.company_name || "Connection"}
                                className="w-full rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700"
                            />
                        ) : (
                            <select
                                name="with"
                                value={form.with}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-black"
                            >
                                <option value="">Select Connection</option>
                                {connections.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} {c.company_name ? `- ${c.company_name}` : ""}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                Meeting Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                Duration (mins) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                {[15, 30, 45, 60].map((d) => (
                                    <button
                                        type="button"
                                        key={d}
                                        onClick={() => setForm((prev) => ({ ...prev, duration: d }))}
                                        className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                                            form.duration === d
                                                ? "bg-black dark:bg-slate-900 text-white"
                                                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200"
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                Agenda <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="agenda"
                                value={form.agenda}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full resize-none rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                                    Start Time <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="startTime"
                                    value={form.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-black"
                                >
                                    <option value="">Select Time</option>
                                    {TIME_SLOTS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                            Mode of Meeting <span className="text-red-500">*</span>
                        </label>
                        <div className="mb-3 flex gap-2">
                            {["Online", "In-person"].map((m) => (
                                <button
                                    type="button"
                                    key={m}
                                    onClick={() => setForm((prev) => ({ ...prev, mode: m }))}
                                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                                        form.mode === m ? "bg-black dark:bg-slate-900 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200"
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        {form.mode === "Online" && (
                            <div className="space-y-3">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name="meetingTool"
                                        value="In-built"
                                        checked={form.meetingTool === "In-built"}
                                        onChange={handleChange}
                                        className="accent-black"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-slate-200">In-built Meeting Tool</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name="meetingTool"
                                        value="External"
                                        checked={form.meetingTool === "External"}
                                        onChange={handleChange}
                                        className="accent-black"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-slate-200">External Meeting URL</span>
                                </label>

                                {form.meetingTool === "External" && (
                                    <input
                                        type="url"
                                        name="meetingUrl"
                                        value={form.meetingUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        required
                                        className="w-full rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 outline-none text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-black"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 dark:border-slate-700 px-6 py-3 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-[#c0546a] px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Scheduling..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* --------------------------- availability modal --------------------------- */

function EditAvailabilityModal({ onClose }) {
    const [availability, setAvailability] = useState({
        type: "Anytime",
        reason: "",
        unavailable_from: "",
        unavailable_to: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setAvailability((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError("");

        if (
            availability.type === "Temporary Unavailable" &&
            (!availability.unavailable_from || !availability.unavailable_to)
        ) {
            setError("Please select the unavailable date range.");
            return;
        }

        try {
            setSaving(true);
            await axios.patch("/organization/availability", availability);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update availability.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-7 shadow-xl border border-gray-100 dark:border-slate-700 text-gray-900 dark:text-slate-100">
                <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Edit Availability</h2>
                    <button onClick={onClose} type="button" className="p-1 text-gray-500 hover:text-black dark:hover:text-white cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-200">Status</label>
                        <select
                            name="type"
                            value={availability.type}
                            onChange={handleChange}
                            className="w-full rounded-xl bg-gray-100 dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="Anytime">Anytime</option>
                            <option value="Temporary Unavailable">Temporary Unavailable</option>
                            <option value="Specific Days">Specific Days</option>
                        </select>
                    </div>

                    {availability.type === "Temporary Unavailable" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-200">From</label>
                                <input
                                    type="date"
                                    name="unavailable_from"
                                    value={availability.unavailable_from}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-gray-100 dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-200">To</label>
                                <input
                                    type="date"
                                    name="unavailable_to"
                                    value={availability.unavailable_to}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-gray-100 dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                            Reason (optional)
                        </label>
                        <textarea
                            name="reason"
                            value={availability.reason}
                            onChange={handleChange}
                            rows={3}
                            className="w-full resize-none rounded-lg bg-gray-100 dark:bg-slate-900 px-4 py-3 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 dark:border-slate-700 px-6 py-3 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-[#0b1a3a] px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

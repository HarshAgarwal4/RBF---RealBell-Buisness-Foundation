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
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Check,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import { COLORS } from "../../components/colors";

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
        document.title = "Scheduled Meetings | RealBell Business Foundation";
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute(
            "content",
            "Schedule and manage 1-on-1 startup advisory sessions, investor pitch meetings, and cohort discussions on RealBell Business Foundation."
        );
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
    }, [acceptedMeetings, today]);

    const meetingDatesSet = useMemo(() => {
        const set = new Set();
        acceptedMeetings.forEach((m) => {
            set.add(new Date(m.date).toDateString());
        });
        return set;
    }, [acceptedMeetings]);

    const visibleMeetings = useMemo(() => {
        let list = acceptedMeetings;
        if (selectedDate) {
            list = list.filter((m) => isSameDay(new Date(m.date), selectedDate));
        }
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(
                (m) =>
                    m.title?.toLowerCase().includes(q) ||
                    m.organizer?.name?.toLowerCase().includes(q) ||
                    m.attendee?.name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [acceptedMeetings, selectedDate, searchTerm]);

    /* ------------------------------ calendar utils ------------------------------ */

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (year, month) => new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const startOffset = firstDayIndex(year, month);

        const days = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let d = 1; d <= totalDays; d++) days.push(d);
        return days;
    }, [currentMonth]);

    const monthName = currentMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const goToMonth = (dir) => {
        setCurrentMonth(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
        );
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(now);
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const clicked = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
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
            <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 px-3 sm:px-6 lg:px-8 pb-10 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] max-w-full overflow-hidden text-gray-800 dark:text-slate-200">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100">Scheduled Meetings</h1>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-slate-400">Manage 1-on-1 advisory sessions, investor pitches, and scheduled meetings.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition shadow-sm cursor-pointer"
                            style={{ background: COLORS.primary }}
                        >
                            <Plus size={16} />
                            Schedule Meeting
                        </button>

                        <button
                            onClick={() => setShowAvailabilityModal(true)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition shadow-sm cursor-pointer"
                            style={{ background: COLORS.darkBtnBg }}
                        >
                            <Pencil size={15} />
                            Edit Availability
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-12 gap-4 sm:gap-6">

                    {/* LEFT (Calendar & Meeting List) */}
                    <div className="col-span-12 rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-xs lg:col-span-8">

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    className={`rounded-xl px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                                        activeTab === "meetings"
                                            ? "text-white shadow-xs"
                                            : "bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                    }`}
                                    style={activeTab === "meetings" ? { background: COLORS.primary } : {}}
                                    onClick={() => setActiveTab("meetings")}
                                >
                                    All Meetings
                                </button>

                                <button
                                    className={`rounded-xl px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                                        activeTab === "notes"
                                            ? "text-white shadow-xs"
                                            : "bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                    }`}
                                    style={activeTab === "notes" ? { background: COLORS.primary } : {}}
                                    onClick={() => setActiveTab("notes")}
                                >
                                    Meeting Notes
                                </button>
                            </div>
                        </div>

                        {/* Calendar nav */}
                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-lg sm:text-xl font-bold" style={{ color: COLORS.primary }}>
                                {monthName}
                            </h2>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => goToMonth(-1)}
                                    className="flex-1 sm:flex-initial rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#151D2E] text-gray-700 dark:text-slate-300 px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    <ChevronLeft size={16} className="inline mr-0.5" /> Previous
                                </button>
                                <button
                                    onClick={goToToday}
                                    className="flex-1 sm:flex-initial rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#151D2E] text-gray-700 dark:text-slate-300 px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => goToMonth(1)}
                                    className="flex-1 sm:flex-initial rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#151D2E] text-gray-700 dark:text-slate-300 px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    Next <ChevronRight size={16} className="inline ml-0.5" />
                                </button>
                            </div>
                        </div>

                        {/* Weekday header */}
                        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs sm:text-sm font-bold text-gray-400 dark:text-slate-400">
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
                                        className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-xs sm:text-sm transition cursor-pointer
                                            ${isToday ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400" : "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40 text-gray-800 dark:text-slate-200"}
                                            ${isSelected && !isToday ? "border-[#8B1D2C] bg-[#8B1D2C]/10 font-bold text-[#8B1D2C] dark:text-rose-400" : ""}
                                            ${!isToday && !isSelected && isWeekend ? "text-[#8B1D2C] dark:text-rose-400 font-semibold" : ""}
                                            hover:border-[#8B1D2C] hover:bg-[#8B1D2C]/5
                                        `}
                                    >
                                        <span>{day}</span>
                                        {hasMeeting && (
                                            <span
                                                className="h-1.5 w-1.5 rounded-full"
                                                style={{ background: isToday ? "#10B981" : COLORS.primary }}
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
                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                                                Showing meetings for{" "}
                                                <span className="font-bold text-gray-800 dark:text-slate-200">
                                                    {selectedDate.toLocaleDateString("en-US", {
                                                        weekday: "long",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            </p>
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="text-xs sm:text-sm font-bold hover:underline cursor-pointer"
                                                style={{ color: COLORS.primary }}
                                            >
                                                Clear Filter
                                            </button>
                                        </div>
                                    )}

                                    {loadingMeetings ? (
                                        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-16 text-center text-gray-400 dark:text-slate-500">
                                            Loading meetings...
                                        </div>
                                    ) : visibleMeetings.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-16 text-center text-gray-500 dark:text-slate-400">
                                            No meetings scheduled
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
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/30 p-4 sm:p-5 transition hover:shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="rounded-xl p-3 text-white shrink-0"
                                                            style={{ background: COLORS.primary }}
                                                        >
                                                            {meeting.mode === "Online" ? (
                                                                <Video className="h-5 w-5" />
                                                            ) : (
                                                                <MapPin className="h-5 w-5" />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100">
                                                                {meeting.title}
                                                            </h3>

                                                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={14} />
                                                                    {meeting.startTime}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{formatShortDate(meeting.date)}</span>
                                                                <span>•</span>
                                                                <span className="font-semibold text-gray-700 dark:text-slate-300">{meeting.mode}</span>
                                                                {other?.name && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>with {other.name}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {meeting.mode === "Online" ? (
                                                        <a
                                                            href={meeting.meetingUrl || "#"}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                                                            style={{ background: COLORS.darkBtnBg }}
                                                        >
                                                            Join Room
                                                            <ExternalLink size={13} />
                                                        </a>
                                                    ) : (
                                                        <span className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                            In-person
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-16 text-center text-gray-500 dark:text-slate-400">
                                    No Meeting Notes Available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL (Search, Requests, This Week) */}
                    <div className="col-span-12 space-y-6 lg:col-span-4">

                        {/* Search Card */}
                        <div className="rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs">
                            <div className="relative">
                                <Search
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                                    size={16}
                                />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search meetings..."
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-gray-800 dark:text-slate-100 outline-none focus:border-[#8B1D2C]"
                                />
                            </div>
                        </div>

                        {/* Requests Card */}
                        <div className="rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
                            <div className="flex gap-5 border-b border-gray-100 dark:border-slate-800 pb-3">
                                <button
                                    onClick={() => setRequestTab("received")}
                                    className={`-mb-3 border-b-2 pb-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                                        requestTab === "received"
                                            ? "border-[#8B1D2C] text-[#8B1D2C] dark:text-rose-400"
                                            : "border-transparent text-gray-400 dark:text-slate-500"
                                    }`}
                                >
                                    Meeting Requests ({receivedRequests.length})
                                </button>
                                <button
                                    onClick={() => setRequestTab("sent")}
                                    className={`-mb-3 border-b-2 pb-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                                        requestTab === "sent"
                                            ? "border-[#8B1D2C] text-[#8B1D2C] dark:text-rose-400"
                                            : "border-transparent text-gray-400 dark:text-slate-500"
                                    }`}
                                >
                                    Sent ({sentRequests.length})
                                </button>
                            </div>

                            <div className="mt-5 space-y-3">
                                {requestTab === "received" ? (
                                    receivedRequests.length === 0 ? (
                                        <div className="rounded-xl bg-gray-50 dark:bg-slate-900/40 p-6 text-center text-xs text-gray-500 dark:text-slate-400">
                                            No incoming requests
                                        </div>
                                    ) : (
                                        receivedRequests.map((m) => (
                                            <div key={m._id} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 p-4">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">{m.title}</h4>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                                    {formatDayLabel(m.date)} • {m.startTime}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                                                    from {m.organizer?.name || "Connection"}
                                                </p>

                                                <div className="mt-3.5 flex gap-2">
                                                    <button
                                                        onClick={() => handleRespond(m._id, "accepted")}
                                                        className="flex-1 rounded-xl py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                                                        style={{ background: COLORS.primary }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRespond(m._id, "declined")}
                                                        className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )
                                ) : sentRequests.length === 0 ? (
                                    <div className="rounded-xl bg-gray-50 dark:bg-slate-900/40 p-6 text-center text-xs text-gray-500 dark:text-slate-400">
                                        No sent requests
                                    </div>
                                ) : (
                                    sentRequests.map((m) => (
                                        <div key={m._id} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 p-4">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">{m.title}</h4>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                                {formatDayLabel(m.date)} • {m.startTime}
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                                                to {m.attendee?.name || "Connection"}
                                            </p>

                                            <div className="mt-3">
                                                <button
                                                    onClick={() => handleCancel(m._id)}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                                                >
                                                    Cancel Request
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* This week Card */}
                        <div className="rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
                            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Meetings This Week</h3>

                            <div className="mt-4 space-y-3">
                                {thisWeekMeetings.length === 0 ? (
                                    <div className="rounded-xl bg-gray-50 dark:bg-slate-900/40 p-6 text-center text-xs text-gray-500 dark:text-slate-400">
                                        No upcoming meetings this week
                                    </div>
                                ) : (
                                    thisWeekMeetings.map((m) => {
                                        const other =
                                            m.organizer?._id === myId ? m.attendee : m.organizer;
                                        return (
                                            <div
                                                key={m._id}
                                                className="flex items-center gap-3.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 p-3.5"
                                            >
                                                <div
                                                    className="rounded-lg p-2.5 text-white shrink-0"
                                                    style={{ background: COLORS.primary }}
                                                >
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-slate-100">{m.title}</h4>
                                                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#151D2E] p-5 sm:p-7 shadow-2xl border border-gray-200/80 dark:border-slate-800 text-gray-900 dark:text-slate-100">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3.5">
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Schedule a Meeting</h2>
                    <button onClick={onClose} type="button" className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-4 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                            Participant <span className="text-red-500">*</span>
                        </label>
                        {targetConnection ? (
                            <input
                                type="text"
                                readOnly
                                value={targetConnection.name || targetConnection.company_name || "Connection"}
                                className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none"
                            />
                        ) : (
                            <select
                                name="with"
                                value={form.with}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                Meeting Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="eg. Seed Investment Pitch"
                                required
                                className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                Duration (mins) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                {[15, 30, 45, 60].map((d) => (
                                    <button
                                        type="button"
                                        key={d}
                                        onClick={() => setForm((prev) => ({ ...prev, duration: d }))}
                                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                                            form.duration === d
                                                ? "text-white shadow-xs"
                                                : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                        }`}
                                        style={form.duration === d ? { background: COLORS.primary } : {}}
                                    >
                                        {d}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                Agenda <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="agenda"
                                value={form.agenda}
                                onChange={handleChange}
                                placeholder="Topics to cover..."
                                required
                                rows={4}
                                className="w-full resize-none rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                    Start Time <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="startTime"
                                    value={form.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
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
                        <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                            Mode of Meeting <span className="text-red-500">*</span>
                        </label>
                        <div className="mb-3 flex gap-2">
                            {["Online", "In-person"].map((m) => (
                                <button
                                    type="button"
                                    key={m}
                                    onClick={() => setForm((prev) => ({ ...prev, mode: m }))}
                                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                                        form.mode === m
                                            ? "text-white shadow-xs"
                                            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                    }`}
                                    style={form.mode === m ? { background: COLORS.darkBtnBg } : {}}
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
                                        className="accent-[#8B1D2C]"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-700 dark:text-slate-200">In-built RealBell Meeting Tool</span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="radio"
                                        name="meetingTool"
                                        value="External"
                                        checked={form.meetingTool === "External"}
                                        onChange={handleChange}
                                        className="accent-[#8B1D2C]"
                                    />
                                    <span className="text-xs sm:text-sm text-gray-700 dark:text-slate-200">External Meeting URL (Zoom/Google Meet)</span>
                                </label>

                                {form.meetingTool === "External" && (
                                    <input
                                        type="url"
                                        name="meetingUrl"
                                        value={form.meetingUrl}
                                        onChange={handleChange}
                                        placeholder="https://meet.google.com/..."
                                        required
                                        className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 dark:border-slate-700 px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl px-6 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                            style={{ background: COLORS.primary }}
                        >
                            {loading ? "Scheduling..." : "Schedule Meeting"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#151D2E] p-5 sm:p-7 shadow-2xl border border-gray-200/80 dark:border-slate-800 text-gray-900 dark:text-slate-100">
                <div className="mb-5 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3.5">
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Edit Availability</h2>
                    <button onClick={onClose} type="button" className="p-1 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-4 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">Availability Status</label>
                        <select
                            name="type"
                            value={availability.type}
                            onChange={handleChange}
                            className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                        >
                            <option value="Anytime">Anytime (Open for booking)</option>
                            <option value="Temporary Unavailable">Temporary Unavailable</option>
                            <option value="Specific Days">Specific Days Only</option>
                        </select>
                    </div>

                    {availability.type === "Temporary Unavailable" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">From</label>
                                <input
                                    type="date"
                                    name="unavailable_from"
                                    value={availability.unavailable_from}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">To</label>
                                <input
                                    type="date"
                                    name="unavailable_to"
                                    value={availability.unavailable_to}
                                    onChange={handleChange}
                                    className="w-full rounded-xl bg-gray-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                            Reason / Out of Office Note (Optional)
                        </label>
                        <textarea
                            name="reason"
                            value={availability.reason}
                            onChange={handleChange}
                            rows={3}
                            placeholder="e.g. Attending Annual Startup Summit"
                            className="w-full resize-none rounded-xl bg-gray-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 outline-none focus:border-[#8B1D2C]"
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 dark:border-slate-700 px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl px-6 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                            style={{ background: COLORS.primary }}
                        >
                            {saving ? "Saving..." : "Save Availability"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

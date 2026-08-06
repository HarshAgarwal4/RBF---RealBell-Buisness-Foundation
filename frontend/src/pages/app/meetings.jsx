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
            <div className="ml-75 min-h-screen bg-[#f5f7fb] p-8">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
                        <p className="mt-1 text-gray-500">Manage and schedule meetings.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="flex items-center gap-2 rounded-xl bg-[#b03052] px-5 py-3 font-semibold text-white hover:bg-[#96263f]"
                        >
                            <Plus size={18} />
                            Schedule Meeting
                        </button>

                        <button
                            onClick={() => setShowAvailabilityModal(true)}
                            className="flex items-center gap-2 rounded-xl bg-[#0b1a3a] px-5 py-3 font-semibold text-white hover:bg-[#132b5c]"
                        >
                            <Pencil size={16} />
                            Edit Availability
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-12 gap-6">

                    {/* LEFT */}
                    <div className="col-span-12 rounded-3xl bg-white p-6 shadow-sm lg:col-span-8">

                        <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                                <button
                                    className={`rounded-xl px-5 py-2 font-medium transition ${
                                        activeTab === "meetings"
                                            ? "bg-[#b03052] text-white"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                    onClick={() => setActiveTab("meetings")}
                                >
                                    All Meetings
                                </button>

                                <button
                                    className={`rounded-xl px-5 py-2 font-medium transition ${
                                        activeTab === "notes"
                                            ? "bg-[#b03052] text-white"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                    onClick={() => setActiveTab("notes")}
                                >
                                    Meeting Notes
                                </button>
                            </div>
                        </div>

                        {/* Calendar nav */}
                        <div className="mt-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#b03052]">{monthName}</h2>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToMonth(-1)}
                                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={goToToday}
                                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => goToMonth(1)}
                                    className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
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

/* ---------------------------- schedule modal ---------------------------- */

function ScheduleMeetingModal({ connections, onClose, onScheduled }) {
    const [form, setForm] = useState({
        attendee: "",
        title: "",
        duration: 30,
        agenda: "",
        date: "",
        startTime: "",
        mode: "Online",
        meetingTool: "In-built",
        meetingUrl: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.attendee || !form.title || !form.agenda || !form.date || !form.startTime) {
            setError("Please fill all required fields.");
            return;
        }

        if (form.mode === "Online" && form.meetingTool === "External" && !form.meetingUrl) {
            setError("Please provide the external meeting URL.");
            return;
        }

        try {
            setLoading(true);
            await axios.post("/meetings", form);
            onScheduled && onScheduled();
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to schedule meeting.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Schedule Meeting</h2>
                    <button onClick={onClose} type="button">
                        <X className="text-gray-500 hover:text-black" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Who would you prefer to schedule a meeting with?
                        </label>
                        <select
                            name="attendee"
                            value={form.attendee}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="">Select a name</option>
                            {connections.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} {c.company_name ? `- ${c.company_name}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Meeting Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
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
                                                ? "bg-black text-white"
                                                : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Agenda <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="agenda"
                                value={form.agenda}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full resize-none rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Start Time <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="startTime"
                                    value={form.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
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
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Mode of Meeting <span className="text-red-500">*</span>
                        </label>
                        <div className="mb-3 flex gap-2">
                            {["Online", "In-person"].map((m) => (
                                <button
                                    type="button"
                                    key={m}
                                    onClick={() => setForm((prev) => ({ ...prev, mode: m }))}
                                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                                        form.mode === m ? "bg-black text-white" : "bg-gray-100 text-gray-700"
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
                                    <span className="text-sm text-gray-700">In-built Meeting Tool</span>
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
                                    <span className="text-sm text-gray-700">External Meeting URL</span>
                                </label>

                                {form.meetingTool === "External" && (
                                    <input
                                        type="url"
                                        name="meetingUrl"
                                        value={form.meetingUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        required
                                        className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-6 py-3 hover:bg-gray-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Availability</h2>
                    <button onClick={onClose} type="button">
                        <X className="text-gray-500 hover:text-black" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                        <select
                            name="type"
                            value={availability.type}
                            onChange={handleChange}
                            className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="Anytime">Anytime</option>
                            <option value="Temporary Unavailable">Temporary Unavailable</option>
                            <option value="Specific Days">Specific Days</option>
                        </select>
                    </div>

                    {availability.type === "Temporary Unavailable" && (
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">From</label>
                                <input
                                    type="date"
                                    name="unavailable_from"
                                    value={availability.unavailable_from}
                                    onChange={handleChange}
                                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">To</label>
                                <input
                                    type="date"
                                    name="unavailable_to"
                                    value={availability.unavailable_to}
                                    onChange={handleChange}
                                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Reason (optional)
                        </label>
                        <textarea
                            name="reason"
                            value={availability.reason}
                            onChange={handleChange}
                            rows={3}
                            className="w-full resize-none rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-6 py-3 hover:bg-gray-100"
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
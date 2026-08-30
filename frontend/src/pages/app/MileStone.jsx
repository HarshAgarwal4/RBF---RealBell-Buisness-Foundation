import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Search, AlertCircle, Trash2, Calendar, Users, Target, CheckCircle2, ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import { COLORS } from "../../components/colors";

/* ------------------------------- helpers ------------------------------- */

const emptyQualitativeTask = () => ({ text: "" });
const emptyQuantitativeTask = () => ({ parameter: "", quantifiedValue: "", unit: "" });

const emptyForm = () => ({
    title: "",
    description: "",
    reviewers: [],
    startDate: "",
    targetDate: "",
    progressReporting: "Every Week",
    qualitativeTasks: [emptyQualitativeTask()],
    quantitativeTasks: [emptyQuantitativeTask()],
});

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* --------------------------------- page --------------------------------- */

export default function Milestones() {
    const { user } = useStore();
    const myId = user?._id;

    useEffect(() => {
        document.title = "Milestone Tracking & Governance | RealBell Business Foundation";
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute(
            "content",
            "Set, track, and verify quantitative & qualitative startup growth milestones with mentors and investors on RealBell Business Foundation."
        );
    }, []);

    const [view, setView] = useState("list"); // list | create

    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [reviewerOptions, setReviewerOptions] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    /* ------------------------------ data fetch ------------------------------ */

    const fetchMilestones = useCallback(async (search = "") => {
        try {
            setLoading(true);
            const res = await axios.get("/milestones", { params: search ? { search } : {} });
            setMilestones(res.data.milestones || []);
        } catch (err) {
            console.error("Failed to load milestones", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReviewerOptions = useCallback(async () => {
        try {
            const res = await axios.get("/milestones/reviewers");
            setReviewerOptions(res.data.reviewers || []);
        } catch (err) {
            console.error("Failed to load reviewers", err);
        }
    }, []);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    useEffect(() => {
        const timer = setTimeout(() => fetchMilestones(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchMilestones]);

    useEffect(() => {
        if (view === "create") fetchReviewerOptions();
    }, [view, fetchReviewerOptions]);

    const activeCount = useMemo(
        () => milestones.filter((m) => m.status === "active").length,
        [milestones]
    );

    /* -------------------------------- form utils -------------------------------- */

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleReviewersChange = (e) => {
        const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
        setForm((prev) => ({ ...prev, reviewers: selected }));
    };

    const updateQualitativeTask = (index, value) => {
        setForm((prev) => {
            const tasks = [...prev.qualitativeTasks];
            tasks[index] = { ...tasks[index], text: value };
            return { ...prev, qualitativeTasks: tasks };
        });
    };

    const addQualitativeTask = () => {
        setForm((prev) => ({
            ...prev,
            qualitativeTasks: [...prev.qualitativeTasks, emptyQualitativeTask()],
        }));
    };

    const removeQualitativeTask = (index) => {
        setForm((prev) => ({
            ...prev,
            qualitativeTasks: prev.qualitativeTasks.filter((_, i) => i !== index),
        }));
    };

    const updateQuantitativeTask = (index, field, value) => {
        setForm((prev) => {
            const tasks = [...prev.quantitativeTasks];
            tasks[index] = { ...tasks[index], [field]: value };
            return { ...prev, quantitativeTasks: tasks };
        });
    };

    const addQuantitativeTask = () => {
        setForm((prev) => ({
            ...prev,
            quantitativeTasks: [...prev.quantitativeTasks, emptyQuantitativeTask()],
        }));
    };

    const removeQuantitativeTask = (index) => {
        setForm((prev) => ({
            ...prev,
            quantitativeTasks: prev.quantitativeTasks.filter((_, i) => i !== index),
        }));
    };

    const resetAndGoToList = () => {
        setForm(emptyForm());
        setError("");
        setView("list");
    };

    /* -------------------------------- submit -------------------------------- */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.title || !form.description || !form.startDate || !form.targetDate) {
            setError("Please fill all required fields.");
            return;
        }

        const qualitativeTasks = form.qualitativeTasks.filter((t) => t.text.trim());
        const quantitativeTasks = form.quantitativeTasks.filter(
            (t) => t.parameter.trim() && t.quantifiedValue.trim()
        );

        if (qualitativeTasks.length === 0) {
            setError("Please add at least one qualitative task.");
            return;
        }

        if (quantitativeTasks.length === 0) {
            setError("Please add at least one quantitative task.");
            return;
        }

        try {
            setSubmitting(true);
            await axios.post("/milestones", {
                ...form,
                qualitativeTasks,
                quantitativeTasks,
            });
            await fetchMilestones();
            resetAndGoToList();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create milestone.");
        } finally {
            setSubmitting(false);
        }
    };

    /* --------------------------------- render --------------------------------- */

    return (
        <>
            <Sidebar />
            <div className="ml-0 lg:ml-75 pt-20 lg:pt-6 flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-gray-800 dark:text-slate-200">
                <div className="flex-1 px-4 sm:px-8 pb-10 max-w-full overflow-hidden">

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100">
                                {view === "list" ? "Startup Milestones" : "Create New Milestone"}
                            </h1>
                            <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                                {view === "list"
                                    ? "Track strategic targets, quantitative metrics, and verified progress reporting."
                                    : "Define qualitative deliverables and measurable KPI targets for your cohort."}
                            </p>
                        </div>

                        {view === "list" ? (
                            <button
                                onClick={() => setView("create")}
                                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-white transition shrink-0 cursor-pointer shadow-sm self-start sm:self-auto"
                                style={{ background: COLORS.primary }}
                            >
                                <Plus size={16} />
                                Add Milestone
                            </button>
                        ) : (
                            <button
                                onClick={resetAndGoToList}
                                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#151D2E] px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition shadow-xs"
                            >
                                <ArrowLeft size={15} />
                                Back to Milestones
                            </button>
                        )}
                    </div>

                    {view === "list" ? (
                        <>
                            {/* Count + search */}
                            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                                    You have <span className="font-bold text-gray-900 dark:text-slate-100">{activeCount}</span> active
                                    milestones in progress
                                </p>

                                <div className="relative w-full sm:w-80">
                                    <Search
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                                        size={16}
                                    />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search milestones..."
                                        className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] text-gray-900 dark:text-slate-100 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                    />
                                </div>
                            </div>

                            {/* List / empty state */}
                            <div className="mt-6 rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-5 sm:p-7 shadow-xs">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-slate-500 text-xs sm:text-sm">
                                        Loading milestones...
                                    </div>
                                ) : milestones.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <Target className="mb-3.5 h-14 w-14 text-gray-300 dark:text-slate-600" strokeWidth={1.5} />
                                        <p className="mb-2 text-base font-bold text-gray-800 dark:text-slate-200">
                                            No milestones created yet
                                        </p>
                                        <p className="mb-6 max-w-sm text-xs text-gray-500 dark:text-slate-400">
                                            Create structured milestones to share verified growth metrics with mentors and investors.
                                        </p>
                                        <button
                                            onClick={() => setView("create")}
                                            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm cursor-pointer"
                                            style={{ background: COLORS.primary }}
                                        >
                                            <Plus size={16} />
                                            Add Milestone
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {milestones.map((m) => (
                                             <div
                                                key={m._id}
                                                className="rounded-2xl border border-gray-100 dark:border-slate-800/80 p-5 transition hover:shadow-sm bg-gray-50/50 dark:bg-slate-900/30"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100">
                                                            {m.title}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                                                            {m.description}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider shrink-0 ${
                                                            m.status === "active"
                                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                                : m.status === "completed"
                                                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                                                : m.status === "overdue"
                                                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300"
                                                        }`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-slate-400 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                                                    <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300">
                                                        <Calendar size={14} className="text-[#8B1D2C]" />
                                                        {formatDate(m.startDate)} – {formatDate(m.targetDate)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Frequency: {m.progressReporting}</span>
                                                    {m.reviewers?.length > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Users size={14} />
                                                                {m.reviewers.map((r) => r.name).join(", ")}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* -------------------------------- CREATE VIEW -------------------------------- */
                        <div className="mt-6 rounded-3xl bg-white dark:bg-[#151D2E] border border-gray-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-xs">
                            {error && (
                                <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

                                    {/* LEFT COLUMN */}
                                    <div className="space-y-5">
                                        <div>
                                            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                                Milestone Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                placeholder="e.g. Q3 MVP Launch & 500 Pilot Users"
                                                required
                                                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                                Brief Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                placeholder="Outline the core objective and roadmap for this milestone..."
                                                required
                                                rows={4}
                                                className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                                Reviewers (Mentors / Investors)
                                            </label>
                                            <select
                                                multiple
                                                value={form.reviewers}
                                                onChange={handleReviewersChange}
                                                className="h-28 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-4 py-2 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                            >
                                                {reviewerOptions.map((r) => (
                                                    <option key={r._id} value={r._id}>
                                                        {r.name} {r.company_name ? `- ${r.company_name}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                                                Hold Ctrl (Windows) or Cmd (Mac) to select multiple reviewers.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                                    Start Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={form.startDate}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                                    Target Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="targetDate"
                                                    value={form.targetDate}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-200">
                                                Progress Reporting Frequency <span className="text-red-500">*</span>
                                            </label>
                                            <p className="mb-3 text-[11px] text-gray-400 dark:text-slate-500">
                                                The ecosystem will share governance updates with assigned reviewers as per schedule.
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                {["Every Week", "Every Month", "Every Quarter"].map((freq) => (
                                                    <label
                                                        key={freq}
                                                        className="flex cursor-pointer items-center gap-2"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="progressReporting"
                                                            value={freq}
                                                            checked={form.progressReporting === freq}
                                                            onChange={handleChange}
                                                            className="accent-[#8B1D2C]"
                                                        />
                                                        <span className="text-xs sm:text-sm text-gray-700 dark:text-slate-300">{freq}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-3 flex gap-2.5 border-t border-gray-100 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={resetAndGoToList}
                                                className="rounded-xl border border-gray-200 dark:border-slate-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="rounded-xl px-7 py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                                                style={{ background: COLORS.primary }}
                                            >
                                                {submitting ? "Saving..." : "Save Milestone"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="space-y-6 lg:border-l lg:border-gray-200 dark:lg:border-slate-800 lg:pl-8">

                                        {/* Qualitative Tasks */}
                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                                <span style={{ color: COLORS.primary }}>Qualitative Deliverables</span>
                                                <span className="text-red-500">*</span>
                                            </h3>
                                            <p className="mb-3 text-[11px] text-gray-400 dark:text-slate-500">
                                                e.g. Hire senior backend engineer, complete ISO compliance audit.
                                            </p>

                                            <div className="space-y-2.5">
                                                {form.qualitativeTasks.map((task, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <input
                                                            value={task.text}
                                                            onChange={(e) =>
                                                                updateQualitativeTask(index, e.target.value)
                                                            }
                                                            placeholder="Deliverable description..."
                                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#8B1D2C]"
                                                        />
                                                        {form.qualitativeTasks.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeQualitativeTask(index)}
                                                                className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addQualitativeTask}
                                                className="mt-3 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                            >
                                                + Add Deliverable
                                            </button>
                                        </div>

                                        {/* Quantitative Tasks */}
                                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                                <span style={{ color: COLORS.primary }}>Quantitative KPI Metrics</span>
                                                <span className="text-red-500">*</span>
                                            </h3>
                                            <p className="mb-3 text-[11px] text-gray-400 dark:text-slate-500">
                                                e.g. Monthly Recurring Revenue (MRR) of ₹25,00,000 INR.
                                            </p>

                                            <div className="mb-1.5 grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                                                <span>Metric</span>
                                                <span>Target</span>
                                                <span>Unit</span>
                                                <span />
                                            </div>

                                            <div className="space-y-2.5">
                                                {form.quantitativeTasks.map((task, index) => (
                                                    <div
                                                        key={index}
                                                        className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2"
                                                    >
                                                        <input
                                                            value={task.parameter}
                                                            onChange={(e) =>
                                                                updateQuantitativeTask(
                                                                    index,
                                                                    "parameter",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g. Paid Users"
                                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-xs outline-none focus:border-[#8B1D2C]"
                                                        />
                                                        <input
                                                            value={task.quantifiedValue}
                                                            onChange={(e) =>
                                                                updateQuantitativeTask(
                                                                    index,
                                                                    "quantifiedValue",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="e.g. 500"
                                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-xs outline-none focus:border-[#8B1D2C]"
                                                        />
                                                        <input
                                                            value={task.unit}
                                                            onChange={(e) =>
                                                                updateQuantitativeTask(index, "unit", e.target.value)
                                                            }
                                                            placeholder="e.g. Users"
                                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-xs outline-none focus:border-[#8B1D2C]"
                                                        />
                                                        {form.quantitativeTasks.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeQuantitativeTask(index)}
                                                                className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addQuantitativeTask}
                                                className="mt-3 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                                            >
                                                + Add KPI Metric
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <footer className="flex items-center justify-between border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] px-8 py-4 text-xs text-gray-500 dark:text-slate-400">
                    <span>Copyright © {new Date().getFullYear()} RealBell Business Foundation. All rights reserved.</span>
                    <span>
                        Ecosystem Governance & Incubation Platform
                    </span>
                </footer>
            </div>
        </>
    );
}
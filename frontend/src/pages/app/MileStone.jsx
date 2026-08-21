import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Search, AlertCircle, Trash2, Calendar, Users } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { useStore } from '../../zustand/store'

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
            <div className="ml-0 lg:ml-75 pt-16 lg:pt-0 flex min-h-screen flex-col bg-[#f5f7fb]">
                <div className="flex-1 p-4 sm:p-8 max-w-full overflow-hidden">

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900">
                            {view === "list" ? "Milestones" : "Create Milestone"}
                        </h1>

                        {view === "list" && (
                            <button
                                onClick={() => setView("create")}
                                className="flex items-center justify-center gap-2 rounded-xl bg-[#b03052] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#96263f] shrink-0 cursor-pointer self-start sm:self-auto"
                            >
                                <Plus size={16} />
                                Add Milestone
                            </button>
                        )}
                    </div>

                    {view === "list" ? (
                        <>
                            {/* Count + search */}
                            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-xs sm:text-sm text-gray-700">
                                    You have <span className="font-bold">{activeCount}</span> active
                                    milestones
                                </p>

                                <div className="relative w-full sm:w-80">
                                    <Search
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                        size={16}
                                    />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search milestones..."
                                        className="w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            {/* List / empty state */}
                            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                        Loading milestones...
                                    </div>
                                ) : milestones.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <AlertCircle className="mb-4 h-16 w-16 text-gray-300" strokeWidth={1.5} />
                                        <p className="mb-6 text-lg font-semibold text-gray-800">
                                            No milestones created yet
                                        </p>
                                        <button
                                            onClick={() => setView("create")}
                                            className="flex items-center gap-2 rounded-xl bg-[#b03052] px-5 py-3 font-semibold text-white hover:bg-[#96263f]"
                                        >
                                            <Plus size={18} />
                                            Add Milestone
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {milestones.map((m) => (
                                            <div
                                                key={m._id}
                                                className="rounded-2xl border p-5 transition hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {m.title}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                                            {m.description}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                                            m.status === "active"
                                                                ? "bg-green-50 text-green-700"
                                                                : m.status === "completed"
                                                                ? "bg-blue-50 text-blue-700"
                                                                : m.status === "overdue"
                                                                ? "bg-red-50 text-red-700"
                                                                : "bg-gray-100 text-gray-600"
                                                        }`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={15} />
                                                        {formatDate(m.startDate)} - {formatDate(m.targetDate)}
                                                    </span>
                                                    <span>{m.progressReporting}</span>
                                                    {m.reviewers?.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Users size={15} />
                                                            {m.reviewers.map((r) => r.name).join(", ")}
                                                        </span>
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
                        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm">
                            {error && (
                                <div className="mb-6 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

                                    {/* LEFT COLUMN */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="title"
                                                value={form.title}
                                                onChange={handleChange}
                                                placeholder="Title"
                                                required
                                                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Brief Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                placeholder="Write some description about milestone"
                                                required
                                                rows={5}
                                                className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Reviewers
                                            </label>
                                            <select
                                                multiple
                                                value={form.reviewers}
                                                onChange={handleReviewersChange}
                                                className="h-28 w-full rounded-lg border px-4 py-2 outline-none focus:border-black"
                                            >
                                                {reviewerOptions.map((r) => (
                                                    <option key={r._id} value={r._id}>
                                                        {r.name} {r.company_name ? `- ${r.company_name}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Hold Ctrl / Cmd to select multiple connections.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Start Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={form.startDate}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Target Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="targetDate"
                                                    value={form.targetDate}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                                Progress reporting <span className="text-red-500">*</span>
                                            </label>
                                            <p className="mb-3 text-xs text-gray-400">
                                                The platform will share updates on progress as per below
                                                mentioned frequency.
                                            </p>
                                            <div className="flex flex-wrap gap-6">
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
                                                            className="accent-[#b03052]"
                                                        />
                                                        <span className="text-sm text-gray-700">{freq}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={resetAndGoToList}
                                                className="mr-3 rounded-lg border px-6 py-3 hover:bg-gray-100"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="rounded-lg bg-[#c0546a] px-8 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                            >
                                                {submitting ? "Submitting..." : "Submit"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="space-y-8 lg:border-l lg:pl-10">

                                        {/* Qualitative Tasks */}
                                        <div>
                                            <h3 className="font-semibold text-[#b03052]">
                                                Qualitative Tasks <span className="text-red-500">*</span>
                                            </h3>
                                            <p className="mb-3 text-xs text-gray-400">
                                                Eg. Hire a developer to create CRM.
                                            </p>

                                            <div className="space-y-3">
                                                {form.qualitativeTasks.map((task, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <input
                                                            value={task.text}
                                                            onChange={(e) =>
                                                                updateQualitativeTask(index, e.target.value)
                                                            }
                                                            placeholder="Enter text"
                                                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                                                        />
                                                        {form.qualitativeTasks.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeQualitativeTask(index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addQualitativeTask}
                                                className="mt-3 rounded-full border px-5 py-2 text-sm font-medium hover:bg-gray-50"
                                            >
                                                + Add
                                            </button>
                                        </div>

                                        {/* Quantitative Tasks */}
                                        <div>
                                            <h3 className="font-semibold text-[#b03052]">
                                                Quantitative Tasks <span className="text-red-500">*</span>
                                            </h3>
                                            <p className="mb-3 text-xs text-gray-400">
                                                Eg. Revenue of 50,00,000 INR
                                            </p>

                                            <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-sm font-medium text-gray-700">
                                                <span>Parameter</span>
                                                <span>Quantified value</span>
                                                <span>Unit</span>
                                                <span />
                                            </div>

                                            <div className="space-y-3">
                                                {form.quantitativeTasks.map((task, index) => (
                                                    <div
                                                        key={index}
                                                        className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3"
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
                                                            placeholder="Enter text"
                                                            className="w-full rounded-lg border px-3 py-3 outline-none focus:border-black"
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
                                                            placeholder="eg. 20"
                                                            className="w-full rounded-lg border px-3 py-3 outline-none focus:border-black"
                                                        />
                                                        <input
                                                            value={task.unit}
                                                            onChange={(e) =>
                                                                updateQuantitativeTask(index, "unit", e.target.value)
                                                            }
                                                            placeholder="eg. USD/INR/%"
                                                            className="w-full rounded-lg border px-3 py-3 outline-none focus:border-black"
                                                        />
                                                        {form.quantitativeTasks.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeQuantitativeTask(index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={addQuantitativeTask}
                                                className="mt-3 rounded-full border px-5 py-2 text-sm font-medium hover:bg-gray-50"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <footer className="flex items-center justify-between border-t bg-white px-8 py-4 text-sm text-gray-500">
                    <span>Copyright © {new Date().getFullYear()} ecosystem.firstwingsconnect.com. All rights reserved.</span>
                    <span>
                        Powered by <span className="font-medium text-[#b03052]">Sanchit&Co</span>
                    </span>
                </footer>
            </div>
        </>
    );
}
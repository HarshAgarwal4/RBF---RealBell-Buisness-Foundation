import React, { useState, useEffect } from "react";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import {
    Plus,
    AlertCircle,
    Calendar,
    Clock,
    MapPin,
    Briefcase,
    Upload,
    FileText,
    X,
    CheckCircle,
    User,
    Mail,
    Video,
    Trash2,
    DollarSign,
    Bold,
    Italic,
    Underline,
    List,
    AlignLeft,
    Search,
    ExternalLink,
    ChevronRight
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

export default function Job() {
    const organization = useStore((state) => state.organization);

    // Screen State: 'list' | 'create'
    const [currentView, setCurrentView] = useState("list");

    // Data States
    const [jobs, setJobs] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Interview Modal State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);
    const [interviewForm, setInterviewForm] = useState({
        job_id: "",
        candidate_name: "",
        candidate_email: "",
        round_name: "Technical Round 1",
        date: "",
        time: "10:00 AM",
        interviewer_name: organization?.name || "Hiring Manager",
        meeting_link: "https://meet.google.com/abc-defg-hij",
        notes: "",
    });

    // Applicants Modal State
    const [selectedJobApplications, setSelectedJobApplications] = useState(null);

    // Create Job Form State
    const [jobForm, setJobForm] = useState({
        title: "",
        job_overview: "",
        employment_type: "",
        workplace_type: "",
        industry: "",
        position_open: 1,
        locations: [],
        required_skills: [],
        good_to_have_skills: [],
        experience: "",
        min_ctc: "",
        max_ctc: "",
        hide_salary: false,
        expiry_date: "",
    });

    // Skill & Location Tag Inputs
    const [locationInput, setLocationInput] = useState("");
    const [reqSkillInput, setReqSkillInput] = useState("");
    const [goodSkillInput, setGoodSkillInput] = useState("");

    // Attached Files State
    const [attachedFiles, setAttachedFiles] = useState([]);

    // Fetch Jobs & Interviews on Component Mount
    useEffect(() => {
        fetchJobs();
        fetchInterviews();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/jobs");
            if (res.data && res.data.jobs) {
                setJobs(res.data.jobs);
            }
        } catch (err) {
            console.error("Error fetching jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInterviews = async () => {
        try {
            const res = await axios.get("/jobs/upcoming-interviews");
            if (res.data && res.data.interviews) {
                setInterviews(res.data.interviews);
            }
        } catch (err) {
            console.error("Error fetching interviews:", err);
        }
    };

    // Tag Handlers
    const handleAddLocation = (e) => {
        if ((e.key === "Enter" || e.type === "click") && locationInput.trim()) {
            e.preventDefault();
            if (!jobForm.locations.includes(locationInput.trim())) {
                setJobForm({ ...jobForm, locations: [...jobForm.locations, locationInput.trim()] });
            }
            setLocationInput("");
        }
    };

    const handleRemoveLocation = (loc) => {
        setJobForm({ ...jobForm, locations: jobForm.locations.filter((l) => l !== loc) });
    };

    const handleAddReqSkill = (e) => {
        if ((e.key === "Enter" || e.type === "click") && reqSkillInput.trim()) {
            e.preventDefault();
            if (jobForm.required_skills.length >= 5) {
                alert("Maximum 5 required skills allowed");
                return;
            }
            if (!jobForm.required_skills.includes(reqSkillInput.trim())) {
                setJobForm({ ...jobForm, required_skills: [...jobForm.required_skills, reqSkillInput.trim()] });
            }
            setReqSkillInput("");
        }
    };

    const handleRemoveReqSkill = (skill) => {
        setJobForm({ ...jobForm, required_skills: jobForm.required_skills.filter((s) => s !== skill) });
    };

    const handleAddGoodSkill = (e) => {
        if ((e.key === "Enter" || e.type === "click") && goodSkillInput.trim()) {
            e.preventDefault();
            if (jobForm.good_to_have_skills.length >= 5) {
                alert("Maximum 5 good to have skills allowed");
                return;
            }
            if (!jobForm.good_to_have_skills.includes(goodSkillInput.trim())) {
                setJobForm({ ...jobForm, good_to_have_skills: [...jobForm.good_to_have_skills, goodSkillInput.trim()] });
            }
            setGoodSkillInput("");
        }
    };

    const handleRemoveGoodSkill = (skill) => {
        setJobForm({ ...jobForm, good_to_have_skills: jobForm.good_to_have_skills.filter((s) => s !== skill) });
    };

    // File Upload Selection Handler
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachedFiles((prev) => [...prev, ...files]);
    };

    const handleRemoveFile = (index) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Submit New Job Form
    const handleSaveJob = async (e) => {
        e.preventDefault();
        if (!jobForm.title || !jobForm.job_overview || !jobForm.employment_type || !jobForm.workplace_type || !jobForm.industry || !jobForm.experience || !jobForm.expiry_date) {
            setMessage({ type: "error", text: "Please fill in all mandatory fields marked with *" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const formData = new FormData();
            formData.append("title", jobForm.title);
            formData.append("job_overview", jobForm.job_overview);
            formData.append("employment_type", jobForm.employment_type);
            formData.append("workplace_type", jobForm.workplace_type);
            formData.append("industry", jobForm.industry);
            formData.append("position_open", jobForm.position_open);
            formData.append("locations", JSON.stringify(jobForm.locations));
            formData.append("required_skills", JSON.stringify(jobForm.required_skills));
            formData.append("good_to_have_skills", JSON.stringify(jobForm.good_to_have_skills));
            formData.append("experience", jobForm.experience);
            formData.append("min_ctc", jobForm.min_ctc);
            formData.append("max_ctc", jobForm.max_ctc);
            formData.append("hide_salary", jobForm.hide_salary);
            formData.append("expiry_date", jobForm.expiry_date);
            if (organization?._id) formData.append("organizationId", organization._id);

            attachedFiles.forEach((file) => {
                formData.append("attachments", file);
            });

            const res = await axios.post("/jobs/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data && res.data.success) {
                setMessage({ type: "success", text: "Job created successfully!" });
                setJobForm({
                    title: "",
                    job_overview: "",
                    employment_type: "",
                    workplace_type: "",
                    industry: "",
                    position_open: 1,
                    locations: [],
                    required_skills: [],
                    good_to_have_skills: [],
                    experience: "",
                    min_ctc: "",
                    max_ctc: "",
                    hide_salary: false,
                    expiry_date: "",
                });
                setAttachedFiles([]);
                fetchJobs();
                setTimeout(() => {
                    setCurrentView("list");
                    setMessage({ type: "", text: "" });
                }, 1200);
            }
        } catch (err) {
            console.error("Error creating job:", err);
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to create job" });
        } finally {
            setLoading(false);
        }
    };

    // Submit Schedule Interview Form
    const handleScheduleInterviewSubmit = async (e) => {
        e.preventDefault();
        if (!interviewForm.candidate_name || !interviewForm.candidate_email || !interviewForm.date || !interviewForm.time) {
            alert("Candidate name, email, date and time are required.");
            return;
        }

        try {
            const payload = {
                ...interviewForm,
                organizationId: organization?._id,
            };

            const res = await axios.post("/jobs/schedule-interview", payload);
            if (res.data && res.data.success) {
                alert("Interview scheduled successfully!");
                setShowScheduleModal(false);
                setInterviewForm({
                    job_id: "",
                    candidate_name: "",
                    candidate_email: "",
                    round_name: "Technical Round 1",
                    date: "",
                    time: "10:00 AM",
                    interviewer_name: organization?.name || "Hiring Manager",
                    meeting_link: "https://meet.google.com/abc-defg-hij",
                    notes: "",
                });
                fetchInterviews();
                fetchJobs();
            }
        } catch (err) {
            console.error("Error scheduling interview:", err);
            alert(err.response?.data?.message || "Failed to schedule interview.");
        }
    };

    // Delete Job Handler
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job posting?")) return;
        try {
            const res = await axios.delete(`/jobs/${jobId}`);
            if (res.data && res.data.success) {
                fetchJobs();
            }
        } catch (err) {
            console.error("Error deleting job:", err);
            alert("Failed to delete job.");
        }
    };

    return (
        <>
            <Sidebar />
            <div className="ml-75 min-h-screen bg-[#F8FAFC] p-6 md:p-8 font-sans antialiased text-gray-800 max-w-[1400px]">
                {/* Top Header */}
                <header className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200/80">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {currentView === "list" ? "Jobs" : "Create Job"}
                        </h1>
                        {currentView === "create" && (
                            <p className="text-xs text-gray-500 mt-1">
                                Post a new career opportunity for potential candidates
                            </p>
                        )}
                    </div>

                    {currentView === "list" ? (
                        <button
                            onClick={() => setCurrentView("create")}
                            className="flex items-center space-x-2 bg-[#8B1D2C] hover:bg-[#721724] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>+ POST JOB</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentView("list")}
                            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                            <span>&larr; Back to Jobs</span>
                        </button>
                    )}
                </header>

                {/* Global Notification Banner */}
                {message.text && (
                    <div
                        className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${message.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-800 border-red-200"
                            }`}
                    >
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>{message.text}</span>
                        </div>
                        <button onClick={() => setMessage({ type: "", text: "" })}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* VIEW 1: JOBS LISTING PAGE */}
                {currentView === "list" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Posted Jobs List / Empty State */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs min-h-[460px] flex flex-col">
                                {loading ? (
                                    <div className="flex-1 flex items-center justify-center py-20 text-gray-400 text-xs">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B1D2C] mr-3"></div>
                                        <span>Loading jobs...</span>
                                    </div>
                                ) : jobs.length === 0 ? (
                                    /* Empty State Matching Screenshot 1 */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                                        <div className="w-20 h-20 rounded-full border-4 border-gray-300 flex items-center justify-center text-gray-400 mb-4 bg-gray-50">
                                            <AlertCircle className="w-10 h-10 stroke-[1.5]" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800 mb-4">No jobs posted</h3>
                                        <button
                                            onClick={() => setCurrentView("create")}
                                            className="bg-[#8B1D2C] hover:bg-[#721724] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                        >
                                            + POST JOB
                                        </button>
                                    </div>
                                ) : (
                                    /* List of Posted Jobs */
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                            <h2 className="text-sm font-bold text-gray-900">
                                                Posted Jobs ({jobs.length})
                                            </h2>
                                            <span className="text-xs text-gray-500">Active postings</span>
                                        </div>

                                        {jobs.map((job) => (
                                            <div
                                                key={job._id}
                                                className="p-5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:shadow-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                            >
                                                <div className="space-y-2 max-w-xl">
                                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                                        <h3 className="text-base font-bold text-gray-900">{job.title}</h3>
                                                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-[#8B1D2C]">
                                                            {job.employment_type}
                                                        </span>
                                                        <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700">
                                                            {job.workplace_type}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                        {job.job_overview}
                                                    </p>

                                                    <div className="flex items-center space-x-4 text-[11px] text-gray-500 flex-wrap gap-y-1">
                                                        {job.locations && job.locations.length > 0 && (
                                                            <div className="flex items-center space-x-1">
                                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                                <span>{job.locations.join(", ")}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center space-x-1">
                                                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{job.experience}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>
                                                                {job.salary?.hide_salary
                                                                    ? "Undisclosed"
                                                                    : `₹${job.salary?.min_ctc || 0}L - ₹${job.salary?.max_ctc || 0}L PA`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Skill Tags */}
                                                    {job.required_skills && job.required_skills.length > 0 && (
                                                        <div className="flex items-center space-x-1.5 pt-1 flex-wrap gap-y-1">
                                                            {job.required_skills.map((skill, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex md:flex-col items-end gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedJobForInterview(job);
                                                            setInterviewForm((prev) => ({
                                                                ...prev,
                                                                job_id: job._id,
                                                            }));
                                                            setShowScheduleModal(true);
                                                        }}
                                                        className="w-full md:w-auto px-3.5 py-1.5 bg-[#8B1D2C] hover:bg-[#721724] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>Schedule Interview</span>
                                                    </button>

                                                    {job.applications && job.applications.length > 0 && (
                                                        <button
                                                            onClick={() => setSelectedJobApplications(job)}
                                                            className="w-full md:w-auto px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                                                        >
                                                            <span>Applicants ({job.applications.length})</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteJob(job._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete Job"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Upcoming Interviews Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-gray-900">Upcoming interviews</h2>
                                    <button
                                        onClick={() => setShowScheduleModal(true)}
                                        className="text-[11px] font-bold text-[#8B1D2C] hover:underline"
                                    >
                                        + Schedule
                                    </button>
                                </div>

                                {interviews.length === 0 ? (
                                    /* Empty state matching Screenshot 1 */
                                    <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-8 text-center my-2">
                                        <p className="text-xs text-gray-500 font-medium">No interviews found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {interviews.map((int) => (
                                            <div
                                                key={int._id}
                                                className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors space-y-2"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-900">{int.candidate_name}</h4>
                                                        <p className="text-[11px] text-gray-500">{int.round_name || "Technical Round"}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700">
                                                        {int.status}
                                                    </span>
                                                </div>

                                                <div className="text-[11px] text-gray-600 space-y-1">
                                                    <div className="flex items-center space-x-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>
                                                            {int.date ? new Date(int.date).toLocaleDateString() : "TBD"} at {int.time}
                                                        </span>
                                                    </div>
                                                    {int.job_title && (
                                                        <div className="flex items-center space-x-1.5 text-gray-500">
                                                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="truncate">{int.job_title}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {int.meeting_link && (
                                                    <a
                                                        href={int.meeting_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#8B1D2C] hover:underline pt-1"
                                                    >
                                                        <Video className="w-3 h-3" />
                                                        <span>Join Meeting</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 2: CREATE JOB FORM (Matching Screenshots 2 & 3) */}
                {currentView === "create" && (
                    <form onSubmit={handleSaveJob} className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-xs max-w-5xl space-y-8">
                        {/* Section 1: Brief Information */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                                <div className="w-1 h-5 bg-[#8B1D2C] rounded-full"></div>
                                <h2 className="text-base font-bold text-gray-900">Brief Information</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column Fields */}
                                <div className="space-y-4">
                                    {/* Job Title */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Job Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter a job title e.g. (Angular Developer)"
                                            value={jobForm.title}
                                            onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Employment Type & Workplace Type */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Employment Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={jobForm.employment_type}
                                                onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all outline-none"
                                                required
                                            >
                                                <option value="">Choose employment type</option>
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                                <option value="Freelance">Freelance</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Workplace Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={jobForm.workplace_type}
                                                onChange={(e) => setJobForm({ ...jobForm, workplace_type: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all outline-none"
                                                required
                                            >
                                                <option value="">Choose workplace type</option>
                                                <option value="On-site">On-site</option>
                                                <option value="Hybrid">Hybrid</option>
                                                <option value="Remote">Remote</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Industry & Positions Open */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Industry <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={jobForm.industry}
                                                onChange={(e) => setJobForm({ ...jobForm, industry: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all outline-none"
                                                required
                                            >
                                                <option value="">Choose an industry</option>
                                                <option value="Information Technology">Information Technology</option>
                                                <option value="FinTech">FinTech</option>
                                                <option value="E-commerce">E-commerce</option>
                                                <option value="HealthTech">HealthTech</option>
                                                <option value="EdTech">EdTech</option>
                                                <option value="AI/ML">AI/ML</option>
                                                <option value="SaaS">SaaS</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Hardware">Hardware</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Position Open <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="No. of positions open"
                                                value={jobForm.position_open}
                                                onChange={(e) => setJobForm({ ...jobForm, position_open: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Job Overview Editor (Matching Screenshot 2) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Job Overview <span className="text-red-500">*</span>
                                    </label>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#8B1D2C]/20 focus-within:border-[#8B1D2C]">
                                        {/* Rich text formatting bar toolbar */}
                                        <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center space-x-3 text-gray-600 text-xs">
                                            <button type="button" className="p-1 hover:bg-gray-200 rounded font-bold" title="Bold">
                                                <Bold className="w-3.5 h-3.5" />
                                            </button>
                                            <button type="button" className="p-1 hover:bg-gray-200 rounded italic" title="Italic">
                                                <Italic className="w-3.5 h-3.5" />
                                            </button>
                                            <button type="button" className="p-1 hover:bg-gray-200 rounded underline" title="Underline">
                                                <Underline className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="w-px h-4 bg-gray-300"></div>
                                            <span className="font-bold text-xs cursor-pointer hover:text-gray-900">H1</span>
                                            <span className="font-bold text-xs cursor-pointer hover:text-gray-900">H2</span>
                                            <div className="w-px h-4 bg-gray-300"></div>
                                            <button type="button" className="p-1 hover:bg-gray-200 rounded" title="List">
                                                <List className="w-3.5 h-3.5" />
                                            </button>
                                            <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Align Left">
                                                <AlignLeft className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <textarea
                                            rows={6}
                                            placeholder="Enter some description about the job"
                                            value={jobForm.job_overview}
                                            onChange={(e) => setJobForm({ ...jobForm, job_overview: e.target.value })}
                                            className="w-full p-3.5 text-xs text-gray-800 border-none outline-none resize-none bg-white"
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Preference Information */}
                        <div className="space-y-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                                <div className="w-1 h-5 bg-[#8B1D2C] rounded-full"></div>
                                <h2 className="text-base font-bold text-gray-900">Preference information</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Locations Field */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Locations <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Choose locations e.g. Bengaluru, Mumbai"
                                            value={locationInput}
                                            onChange={(e) => setLocationInput(e.target.value)}
                                            onKeyDown={handleAddLocation}
                                            className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddLocation}
                                            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {jobForm.locations.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {jobForm.locations.map((loc, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 bg-red-50 text-[#8B1D2C] border border-red-100 rounded-lg text-xs flex items-center space-x-1"
                                                >
                                                    <span>{loc}</span>
                                                    <button type="button" onClick={() => handleRemoveLocation(loc)}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Required Skills Field (max 5) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Required Skills (max. 5) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Choose skills e.g. React, Node.js, Python"
                                            value={reqSkillInput}
                                            onChange={(e) => setReqSkillInput(e.target.value)}
                                            onKeyDown={handleAddReqSkill}
                                            className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddReqSkill}
                                            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {jobForm.required_skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {jobForm.required_skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg text-xs flex items-center space-x-1"
                                                >
                                                    <span>{skill}</span>
                                                    <button type="button" onClick={() => handleRemoveReqSkill(skill)}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Experience Dropdown */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Experience <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={jobForm.experience}
                                        onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none"
                                        required
                                    >
                                        <option value="">Choose experience</option>
                                        <option value="0-1 years">0 - 1 years</option>
                                        <option value="1-3 years">1 - 3 years</option>
                                        <option value="3-5 years">3 - 5 years</option>
                                        <option value="5-8 years">5 - 8 years</option>
                                        <option value="8+ years">8+ years</option>
                                    </select>
                                </div>

                                {/* Good to have skills Field (max 5) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Good to have skills (max. 5)
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Choose skills e.g. Docker, AWS"
                                            value={goodSkillInput}
                                            onChange={(e) => setGoodSkillInput(e.target.value)}
                                            onKeyDown={handleAddGoodSkill}
                                            className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddGoodSkill}
                                            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {jobForm.good_to_have_skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {jobForm.good_to_have_skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs flex items-center space-x-1"
                                                >
                                                    <span>{skill}</span>
                                                    <button type="button" onClick={() => handleRemoveGoodSkill(skill)}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Salary (in lakhs) (Min CTC, Max CTC, Hide Salary) - Matching Screenshot 3 */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-semibold text-gray-700">
                                            Salary (in lakhs) <span className="text-red-500">*</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
                                            <span>Hide salary</span>
                                            <input
                                                type="checkbox"
                                                checked={jobForm.hide_salary}
                                                onChange={(e) => setJobForm({ ...jobForm, hide_salary: e.target.checked })}
                                                className="rounded text-[#8B1D2C] focus:ring-[#8B1D2C] w-4 h-4 cursor-pointer"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            placeholder="Min CTC"
                                            value={jobForm.min_ctc}
                                            onChange={(e) => setJobForm({ ...jobForm, min_ctc: e.target.value })}
                                            disabled={jobForm.hide_salary}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none disabled:bg-gray-100"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max CTC"
                                            value={jobForm.max_ctc}
                                            onChange={(e) => setJobForm({ ...jobForm, max_ctc: e.target.value })}
                                            disabled={jobForm.hide_salary}
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>

                                {/* Expiry Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Expiry Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={jobForm.expiry_date}
                                        onChange={(e) => setJobForm({ ...jobForm, expiry_date: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Attachments Upload Dropzone (Matching Screenshot 3) */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-xs font-semibold text-gray-700">Attachments</label>
                                <div className="border-2 border-dashed border-gray-200 hover:border-[#8B1D2C]/50 rounded-2xl p-8 text-center bg-gray-50/50 transition-all relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".doc,.docx,.pdf,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <p className="text-xs font-semibold text-gray-700">
                                            Click or Drop file in this box to upload.
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            Accepted formats: doc, docx, pdf, txt, rtf, xls, xlsx, csv, ppt, pptx, png, jpg, jpeg, webp, gif
                                        </p>
                                        <div className="pt-2">
                                            <span className="inline-flex items-center space-x-1.5 bg-gray-200/80 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl text-xs font-semibold transition-colors">
                                                <Upload className="w-3.5 h-3.5" />
                                                <span>Upload</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Selected File List */}
                                {attachedFiles.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        {attachedFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                                            >
                                                <div className="flex items-center space-x-2 truncate">
                                                    <FileText className="w-4 h-4 text-[#8B1D2C]" />
                                                    <span className="font-medium text-gray-800 truncate">{file.name}</span>
                                                    <span className="text-[10px] text-gray-400">
                                                        ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFile(idx)}
                                                    className="text-gray-400 hover:text-red-600 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit SAVE Button (Matching Screenshot 3) */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-start">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-[#C17179] hover:bg-[#8B1D2C] text-white font-bold px-8 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {loading ? "SAVING..." : "SAVE"}
                            </button>
                        </div>
                    </form>
                )}

                {/* MODAL 1: SCHEDULE INTERVIEW DIALOG */}
                {showScheduleModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-[#8B1D2C]" />
                                    <h3 className="text-base font-bold text-gray-900">Schedule Interview</h3>
                                </div>
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4">
                                {/* Select Job */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Select Job
                                    </label>
                                    <select
                                        value={interviewForm.job_id}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, job_id: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                    >
                                        <option value="">General / Independent Interview</option>
                                        {jobs.map((j) => (
                                            <option key={j._id} value={j._id}>
                                                {j.title} ({j.employment_type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Candidate Name & Candidate Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Candidate Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Rahul Verma"
                                            value={interviewForm.candidate_name}
                                            onChange={(e) =>
                                                setInterviewForm({ ...interviewForm, candidate_name: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Candidate Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="rahul@example.com"
                                            value={interviewForm.candidate_email}
                                            onChange={(e) =>
                                                setInterviewForm({ ...interviewForm, candidate_email: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Round Name & Interviewer */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Interview Round
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Technical Round 1"
                                            value={interviewForm.round_name}
                                            onChange={(e) =>
                                                setInterviewForm({ ...interviewForm, round_name: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Interviewer Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Interviewer Name"
                                            value={interviewForm.interviewer_name}
                                            onChange={(e) =>
                                                setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                        />
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={interviewForm.date}
                                            onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={interviewForm.time}
                                            onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Meeting Link */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Meeting URL (Google Meet / Zoom)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/..."
                                        value={interviewForm.meeting_link}
                                        onChange={(e) =>
                                            setInterviewForm({ ...interviewForm, meeting_link: e.target.value })
                                        }
                                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#8B1D2C]/20"
                                    />
                                </div>

                                {/* Submit Action */}
                                <div className="pt-2 flex items-center justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-[#8B1D2C] hover:bg-[#721724] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                    >
                                        Confirm Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: VIEW APPLICANTS FOR A JOB */}
                {selectedJobApplications && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Applicants for {selectedJobApplications.title}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Total Applications: {selectedJobApplications.applications?.length || 0}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedJobApplications(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 pt-2">
                                {selectedJobApplications.applications &&
                                    selectedJobApplications.applications.map((app, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">{app.candidate_name}</h4>
                                                    <p className="text-xs text-gray-500">{app.candidate_email}</p>
                                                </div>
                                                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700">
                                                    {app.status}
                                                </span>
                                            </div>

                                            {app.cover_letter && (
                                                <p className="text-xs text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-200">
                                                    "{app.cover_letter}"
                                                </p>
                                            )}

                                            {app.resume_url && (
                                                <a
                                                    href={app.resume_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8B1D2C] hover:underline"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span>View Resume</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

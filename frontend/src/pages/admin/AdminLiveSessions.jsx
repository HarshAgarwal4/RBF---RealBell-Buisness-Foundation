import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import {
  Video,
  Users,
  Clock,
  Radio,
  StopCircle,
  Search,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Calendar,
  CheckCircle,
} from "lucide-react";

export default function AdminLiveSessions() {
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalSessions: 0,
    usersWaiting: 0,
    usersInCalls: 0,
    completedToday: 0,
    totalCompletedAllTime: 0,
    avgWaitMinutes: 0,
    avgConsultationMinutes: 0,
  });

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, sessionsRes] = await Promise.all([
        axios.get("/admin/live-sessions/stats"),
        axios.get(`/admin/live-sessions?status=${statusFilter}`),
      ]);

      if (statsRes.data?.status === 1) {
        setStats(statsRes.data.stats || {});
      }

      if (sessionsRes.data?.status === 1) {
        setSessions(sessionsRes.data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load admin live session data:", err);
      toast.error("Failed to load live sessions overview");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleForceEnd = async (sessionId, sessionTitle) => {
    if (!window.confirm(`Are you sure you want to FORCE END the session "${sessionTitle}"? All active participants and waiting queue will be cleared.`)) {
      return;
    }

    try {
      const res = await axios.post(`/admin/live-sessions/${sessionId}/force-end`);
      if (res.data?.status === 1) {
        toast.success("Session force-ended successfully");
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || "Failed to force-end session");
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.hostId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.hostId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Live Sessions & Queue Management">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              Live Sessions & Waiting Queues
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Global real-time overview of active consultation rooms, waiting queues, and duration metrics.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {/* 6 TOP KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <Radio size={13} /> Active Sessions
            </div>
            <div className="text-2xl font-black mt-1 text-white">{stats.activeSessions}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats.totalSessions} total all time</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Users size={13} /> Users Waiting
            </div>
            <div className="text-2xl font-black mt-1 text-white">{stats.usersWaiting}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">In active queues</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Video size={13} /> In Calls Now
            </div>
            <div className="text-2xl font-black mt-1 text-white">{stats.usersInCalls}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Live consultations</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle size={13} /> Completed Today
            </div>
            <div className="text-2xl font-black mt-1 text-white">{stats.completedToday}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats.totalCompletedAllTime} all-time</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
            <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Clock size={13} /> Avg Wait Time
            </div>
            <div className="text-2xl font-black mt-1 text-white">{stats.avgWaitMinutes}m</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across completed calls</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100">
            <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={13} /> Avg Consultation
            </div>
            <div className="text-2xl font-black mt-1 text-white">{stats.avgConsultationMinutes}m</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Duration per call</div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex gap-2 w-full sm:w-auto">
            {["", "LIVE", "SCHEDULED", "PAUSED", "ENDED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {s || "All Statuses"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, host, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* SESSIONS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Session Title</th>
                  <th className="py-3.5 px-4">Host</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Waiting Users</th>
                  <th className="py-3.5 px-4">Current User</th>
                  <th className="py-3.5 px-4">Scheduled / Started</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full text-indigo-500 mb-2" />
                      <div>Loading live sessions...</div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No live sessions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => {
                    const isLive = s.status === "LIVE";
                    return (
                      <tr key={s._id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100">{s.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ID: {s._id.slice(-6)} • {s.sessionType}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{s.hostId?.name || "Host"}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                            {s.hostId?.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isLive
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                                : s.status === "PAUSED"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : s.status === "ENDED"
                                ? "bg-slate-800 text-slate-400"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100">{s.waitingCount || 0}</span>
                          <span className="text-[10px] text-slate-500"> / max {s.maxQueueSize}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          {s.currentParticipantId ? (
                            <span className="text-emerald-400 font-semibold">
                              {s.currentParticipantId.name || "In Call"}
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {s.startedAt
                            ? new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : new Date(s.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {s.status !== "ENDED" ? (
                            <button
                              onClick={() => handleForceEnd(s._id, s.title)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                              title="Force end session immediately"
                            >
                              <StopCircle size={12} /> Force End
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-600">Ended</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

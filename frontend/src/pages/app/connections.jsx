import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import axios from "../../services/axios";
import { toast } from "react-toastify";

function timeAgo(value) {
  if (!value) return "just now";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatTypeLabel(value = "") {
  const text = String(value).replace(/[-_]/g, " ").trim();
  if (!text) return "Connection";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeTypePath(type = "") {
  const value = String(type).toLowerCase().trim();

  if (value === "startup") return "startups";
  if (value === "investor") return "investors";
  if (value === "mentor") return "mentors";
  return "startups";
}

function connectionName(connection) {
  return (
    connection?.profile?.company_name ||
    connection?.profile?.name ||
    "Anonymous"
  );
}

function connectionMeta(connection) {
  return (
    connection?.profile?.account?.designation ||
    formatTypeLabel(connection?.profile?.company_type) ||
    "Community member"
  );
}

function initialsFor(connection) {
  const source = connectionName(connection) || "Connection";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function avatarFor(connection) {
  const image = connection?.profile?.account?.image;
  if (image) return image;

  return `https://placehold.co/160x160/0F3D4A/FFFFFF?text=${encodeURIComponent(
    initialsFor(connection)
  )}`;
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-[17px] font-medium transition ${
        active
          ? "bg-[#F8F8FB] text-[#B52B2B] shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
          : "text-[#6A6F8D] hover:bg-[#f7f8fb]"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, description }) {
  const Icon = icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-[#A1A8BD]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#ABB1C5] text-[#A4A9BA]">
        <Icon size={40} strokeWidth={2.4} />
      </div>
      <p className="mt-8 text-[22px] font-medium text-[#A1A8BD]">{title}</p>
      {description ? <p className="mt-2 text-[15px]">{description}</p> : null}
    </div>
  );
}

function MiniConnectionRow({ connection, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#EEF1F6] bg-white px-3 py-3 text-left transition hover:bg-[#FBFCFF]"
    >
      <img
        src={avatarFor(connection)}
        alt={connectionName(connection)}
        className="h-12 w-12 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-[#18213A]">
          {connectionName(connection)}
        </div>
        <div className="truncate text-sm text-[#8390AA]">{connectionMeta(connection)}</div>
      </div>
      {connection?.is_online ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[#34C759]" />
      ) : (
        <span className="text-xs font-semibold text-[#9AA2B8]">Away</span>
      )}
    </button>
  );
}

function ConnectionCard({
  connection,
  variant,
  onViewProfile,
  onChat,
  onSchedule,
  onRespond,
  onReconnect,
  busyKey,
}) {
  const isIncomingPending = connection.status === "pending" && connection.direction === "received";
  const isOutgoingPending = connection.status === "pending" && connection.direction === "sent";
  const isBusy = (key) => busyKey === `${connection.profile._id}:${key}`;

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#EEF1F6] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-[#F0F2F7] px-4 py-3">
        <span className="rounded-full bg-[#F7F8FB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9FA6BB]">
          {formatTypeLabel(connection?.profile?.company_name || connection?.profile?.company_type)}
        </span>
        <button
          type="button"
          onClick={() => onViewProfile(connection)}
          className="rounded-full p-1.5 text-[#9DA4B8] transition hover:bg-[#F5F7FB] hover:text-[#0F3D4A]"
          aria-label={`View ${connectionName(connection)}`}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="px-4 pb-4 pt-5">
        <div className="flex flex-col items-center text-center">
          <img
            src={avatarFor(connection)}
            alt={connectionName(connection)}
            className="h-20 w-20 rounded-full border border-[#E5EAF3] object-cover"
          />
          <h3 className="mt-4 text-[24px] font-bold tracking-tight text-[#18213A]">
            {connectionName(connection)}
          </h3>
          <p className="mt-1 text-[16px] text-[#2C3550]">{connectionMeta(connection)}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#667089]">
              {connection.status === "accepted" ? (
                <CheckCircle2 size={14} className="text-[#1F9D55]" />
              ) : connection.status === "pending" ? (
                <Clock3 size={14} className="text-[#C38B00]" />
              ) : (
                <ShieldAlert size={14} className="text-[#B23A3A]" />
              )}
              {connection.status === "accepted"
                ? "Active"
                : connection.status === "pending" && connection.direction === "received"
                  ? "Pending request"
                  : connection.status === "pending"
                    ? "Request sent"
                    : "Rejected"}
            </span>

            {connection.is_online ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECF9F0] px-3 py-1 text-xs font-semibold text-[#179B4B]">
                <span className="h-2 w-2 rounded-full bg-[#34C759]" />
                Online
              </span>
            ) : null}
          </div>

          {variant === "active" ? (
            <div className="mt-5 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6]">
              <button
                type="button"
                onClick={() => onChat(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <MessageCircle size={18} />
                Chat
              </button>
              <button
                type="button"
                onClick={() => onSchedule(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <CalendarDays size={18} />
                Schedule call
              </button>
            </div>
          ) : variant === "pending" ? (
            <div className="mt-5 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6]">
              <button
                type="button"
                onClick={() => onViewProfile(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <UserRound size={18} />
                View
              </button>
              {isIncomingPending ? (
                <div className="grid grid-cols-2 divide-x divide-[#E8ECF4]">
                  <button
                    type="button"
                    disabled={isBusy("reject")}
                    onClick={() => onRespond(connection, "reject")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#B23A3A] transition hover:bg-[#FFF7F7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isBusy("accept")}
                    onClick={() => onRespond(connection, "accept")}
                    className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={18} />
                    Accept
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#8891A7] disabled:cursor-not-allowed"
                >
                  <Clock3 size={18} />
                  Requested
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid w-full grid-cols-2 divide-x divide-[#E8ECF4] overflow-hidden rounded-b-[18px] border-t border-[#EEF1F6]">
              <button
                type="button"
                disabled={isBusy("reconnect")}
                onClick={() => onReconnect(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Users size={18} />
                Reconnect
              </button>
              <button
                type="button"
                onClick={() => onViewProfile(connection)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 text-[16px] font-medium text-[#111827] transition hover:bg-[#FAFBFD]"
              >
                <UserRound size={18} />
                View
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#F0F2F7] pt-4 text-sm text-[#7A849A]">
          <span>
            {isOutgoingPending
              ? `Sent ${timeAgo(connection.requestedAt)}`
              : connection.status === "accepted"
                ? `Connected ${timeAgo(connection.respondedAt || connection.requestedAt)}`
                : `Updated ${timeAgo(connection.respondedAt || connection.requestedAt)}`}
          </span>
          <span className="inline-flex items-center gap-1">
            {connection.profile.email ? (
              <>
                <Mail size={14} />
                {connection.profile.email}
              </>
            ) : connection.profile.phone ? (
              <>
                <Phone size={14} />
                {connection.profile.phone}
              </>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ title, emptyTitle, emptyDescription, items, onItemClick, icon }) {
  const Icon = icon;

  return (
    <div className="rounded-[24px] border border-[#EEF1F6] bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-[28px] font-bold tracking-tight text-[#172033]">{title}</h3>
      <div className="mt-5 border-t border-[#EEF2F8]" />
      {items.length === 0 ? (
        <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="mt-4 space-y-3">
          {items.slice(0, 4).map((item) => (
            <MiniConnectionRow
              key={item.profile._id}
              connection={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    active: 0,
    pending: 0,
    rejected: 0,
    pending_requests: 0,
    online: 0,
  });
  const [groups, setGroups] = useState({
    active: [],
    pending: [],
    rejected: [],
    pending_requests: [],
    online: [],
  });
  const [busyKey, setBusyKey] = useState("");

  const loadConnections = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get("/connect/connections");
      if (res.data?.status === 1) {
        setSummary(
          res.data?.summary || {
            active: 0,
            pending: 0,
            rejected: 0,
            pending_requests: 0,
            online: 0,
          }
        );
        setGroups(
          res.data?.connections || {
            active: [],
            pending: [],
            rejected: [],
            pending_requests: [],
            online: [],
          }
        );
      } else {
        setError(res.data?.msg || "Unable to load connections");
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Unable to load connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const currentItems = useMemo(() => {
    const source = groups[tab] || [];
    const value = search.trim().toLowerCase();
    if (!value) return source;

    return source.filter((connection) => {
      const haystack = [
        connectionName(connection),
        connectionMeta(connection),
        connection.profile.company_name,
        connection.profile.name,
        connection.profile.email,
        connection.profile.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [groups, search, tab]);

  const pageCountLabel = useMemo(() => {
    const count = summary[tab] || 0;
    if (tab === "active") {
      return `You have ${count} active connection${count === 1 ? "" : "s"}`;
    }
    if (tab === "pending") {
      return `You have ${count} pending connection${count === 1 ? "" : "s"}`;
    }
    return `You have ${count} rejected connection${count === 1 ? "" : "s"}`;
  }, [summary, tab]);

  const openProfile = (connection) => {
    const type = normalizeTypePath(connection?.profile?.company_type);
    navigate(`/connect/${type}/${connection?.profile?._id}`);
  };

  const scheduleCall = (connection) => {
    const email = connection?.profile?.email;
    if (!email) {
      toast.error("No email found for this connection");
      return;
    }

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      "Schedule a call"
    )}`;
  };

  const respondToConnection = async (connection, action) => {
    const id = connection?.profile?._id;
    if (!id || busyKey) return;

    setBusyKey(`${id}:${action}`);
    try {
      const res = await axios.post(`/connect/${id}/respond`, { action });
      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Connection updated");
        await loadConnections();
      } else {
        toast.error(res.data?.msg || "Unable to update connection");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to update connection");
    } finally {
      setBusyKey("");
    }
  };

  const reconnect = async (connection) => {
    const id = connection?.profile?._id;
    if (!id || busyKey) return;

    setBusyKey(`${id}:reconnect`);
    try {
      const res = await axios.post(`/connect/${id}/connect`);
      if (res.data?.status === 1) {
        toast.success(res.data?.msg || "Connection request sent");
        await loadConnections();
      } else {
        toast.error(res.data?.msg || "Unable to send connection request");
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to send connection request");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <>
      <Sidebar />

      <div className="min-h-screen bg-[linear-gradient(180deg,#F7F9FD_0%,#EEF3F8_100%)] lg:ml-75">
        <div className="sticky top-0 z-20 border-b border-[#E4E9F1] bg-white/95 backdrop-blur">
          <div className="flex flex-col gap-5 px-6 py-5 xl:flex-row xl:items-center xl:justify-between xl:px-10">
            <h1 className="text-[30px] font-bold tracking-tight text-[#111827]">
              Connections
            </h1>

            <div className="flex flex-wrap gap-3">
              <TabButton active={tab === "active"} onClick={() => setTab("active")}>
                Active
              </TabButton>
              <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
                Pending
              </TabButton>
              <TabButton active={tab === "rejected"} onClick={() => setTab("rejected")}>
                Rejected
              </TabButton>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_446px] xl:px-10">
          <main className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <p className="text-[22px] font-medium tracking-tight text-[#12213D]">
                {pageCountLabel}
              </p>

              <div className="relative w-full xl:max-w-[490px]">
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B3B9CC]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search a connection"
                  className="h-[54px] w-full rounded-2xl border border-[#DDE4F0] bg-white pl-12 pr-4 text-[16px] text-[#1A2540] outline-none placeholder:text-[#A4ADC1] focus:ring-2 focus:ring-[#8E1B2E]/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-[#E7ECF5] bg-white p-10 text-center text-[#607086] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                Loading connections...
              </div>
            ) : error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                {error}
              </div>
            ) : currentItems.length === 0 ? (
              <div className="rounded-[24px] border border-[#E7ECF5] bg-white p-10 text-center text-[#607086] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                No connections found for this view.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {currentItems.map((connection) => (
                  <ConnectionCard
                    key={connection.profile._id}
                    connection={connection}
                    variant={tab}
                    onViewProfile={openProfile}
                    onChat={openProfile}
                    onSchedule={scheduleCall}
                    onRespond={respondToConnection}
                    onReconnect={reconnect}
                    busyKey={busyKey}
                  />
                ))}
              </div>
            )}
          </main>

          <aside className="space-y-6 self-start xl:sticky xl:top-28">
            <SummaryCard
              title="Pending Requests"
              emptyTitle="No pending requests found"
              emptyDescription="Pending requests will show up here when someone reaches out."
              items={groups.pending_requests || []}
              onItemClick={openProfile}
              icon={AlertCircle}
            />

            <SummaryCard
              title="Online Connections"
              emptyTitle="No connections online right now."
              emptyDescription="When a connection is available, they appear here."
              items={groups.online || []}
              onItemClick={openProfile}
              icon={Users}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

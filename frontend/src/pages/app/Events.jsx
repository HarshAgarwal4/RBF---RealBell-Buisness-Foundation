import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axios";
import Sidebar from "../../components/Sidebar";
import { COLORS } from "../../components/colors";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Ticket as TicketIcon,
  Coins,
  CheckCircle,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function Events() {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Sept 2026 matching screenshot default or current date
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Initialize date to current real date if valid
    const now = new Date();
    setCurrentDate(now);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, myRegRes] = await Promise.all([
        axios.get("/events/public"),
        axios.get("/events/my-registrations"),
      ]);
      if (eventsRes.data.status === 1) setEvents(eventsRes.data.events);
      if (myRegRes.data.status === 1) setMyRegistrations(myRegRes.data.registrations);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Build calendar matrix
  const calendarCells = [];
  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }
  // Next month leading days to complete grid
  const remaining = 35 - calendarCells.length; // 5 rows of 7
  const totalCells = remaining > 0 ? 35 : 42;
  while (calendarCells.length < totalCells) {
    const d = calendarCells.length - (firstDayOfMonth + daysInMonth) + 1;
    calendarCells.push({
      day: d,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  // Helper to check if date has events
  const getEventsForDate = (y, m, d) => {
    return events.filter((e) => {
      if (!e.event_date) return false;
      const ed = new Date(e.event_date);
      return ed.getFullYear() === y && ed.getMonth() === m && ed.getDate() === d;
    });
  };

  // Compute events happening this week
  const getEventsThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return events.filter((e) => {
      if (!e.event_date) return false;
      const ed = new Date(e.event_date);
      return ed >= startOfWeek && ed <= endOfWeek;
    });
  };

  const eventsThisWeek = getEventsThisWeek();

  // Filtered events if date selected
  const displayEvents = selectedDate
    ? getEventsForDate(selectedDate.year, selectedDate.month, selectedDate.day)
    : events.filter(e =>
        search === "" ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.short_description?.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6F9" }}>
      <Sidebar />

      <main
        className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Events
            </h1>
          </div>

          <div className="flex items-center gap-2.5 bg-[#F7F8FA] border border-gray-200 rounded-xl px-3.5 py-2 w-full sm:w-72">
            <Search size={15} color={COLORS.muted} className="shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13.5,
                color: COLORS.ink,
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 px-4 py-6 sm:px-6 lg:px-8 max-w-full overflow-hidden">
          {/* LEFT COLUMN: Calendar Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                padding: "24px 28px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              {/* Calendar Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div
                  className="text-lg sm:text-xl font-extrabold"
                  style={{
                    color: COLORS.primary,
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {monthNames[month]} {year}
                </div>

                <div className="flex items-center gap-1 bg-[#EBECEF] rounded-xl p-1 self-start sm:self-auto">
                  <button
                    onClick={prevMonth}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-[#4A4A5A] uppercase tracking-wider hover:bg-white/50 transition cursor-pointer"
                  >
                    PREV
                  </button>
                  <button
                    onClick={goToday}
                    className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-[#4A4A5A] uppercase tracking-wider bg-white shadow-xs transition cursor-pointer"
                  >
                    TODAY
                  </button>
                  <button
                    onClick={nextMonth}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-[#4A4A5A] uppercase tracking-wider hover:bg-white/50 transition cursor-pointer"
                  >
                    NEXT
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center font-bold text-[10px] sm:text-xs md:text-sm text-gray-700 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="py-1.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  borderTop: `1px solid ${COLORS.border}`,
                  borderLeft: `1px solid ${COLORS.border}`,
                }}
              >
                {calendarCells.map((cell, index) => {
                  const dayEvents = getEventsForDate(cell.year, cell.month, cell.day);
                  const isToday =
                    new Date().getDate() === cell.day &&
                    new Date().getMonth() === cell.month &&
                    new Date().getFullYear() === cell.year;

                  const isSelected =
                    selectedDate &&
                    selectedDate.day === cell.day &&
                    selectedDate.month === cell.month &&
                    selectedDate.year === cell.year;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (dayEvents.length > 0) {
                          setSelectedDate(isSelected ? null : cell);
                        }
                      }}
                      className="p-1 sm:p-2 min-h-[48px] sm:min-h-[64px] relative transition-colors cursor-pointer"
                      style={{
                        borderRight: `1px solid ${COLORS.border}`,
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: isSelected
                          ? `${COLORS.primary}12`
                          : isToday
                          ? "#F3F4F6"
                          : cell.isCurrentMonth
                          ? "#fff"
                          : "#FAFAFA",
                        cursor: dayEvents.length > 0 ? "pointer" : "default",
                      }}
                    >
                      <div
                        className="text-xs sm:text-sm font-semibold mb-1 text-right"
                        style={{
                          color: !cell.isCurrentMonth
                            ? "#D1D5DB"
                            : isToday
                            ? COLORS.primary
                            : "#1F2937",
                        }}
                      >
                        {cell.day}
                      </div>

                      {/* Event Badges on Calendar Day */}
                      <div className="flex flex-col sm:block gap-1 mt-0.5">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${evt._id}`);
                            }}
                            title={evt.title}
                            className="cursor-pointer"
                          >
                            {/* Mobile dot indicator */}
                            <div
                              className="block sm:hidden w-2 h-2 rounded-full mx-auto my-0.5"
                              style={{
                                background: evt.event_type === "paid" ? COLORS.primary : "#2E7D32",
                              }}
                            />
                            {/* Desktop/Tablet text badge */}
                            <div
                              className="hidden sm:block text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md truncate shadow-xs mb-1"
                              style={{
                                background: evt.event_type === "paid" ? COLORS.primary : "#2E7D32",
                                color: "#fff",
                              }}
                            >
                              {evt.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedDate && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    background: `${COLORS.primary}10`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: COLORS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    Showing events for {selectedDate.day} {monthNames[selectedDate.month]} {selectedDate.year}
                  </span>
                  <button
                    onClick={() => setSelectedDate(null)}
                    style={{
                      border: "none",
                      background: "none",
                      color: COLORS.primary,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* List View of Events below calendar */}
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: COLORS.ink,
                  marginBottom: 16,
                }}
              >
                {selectedDate
                  ? `Events on ${selectedDate.day} ${monthNames[selectedDate.month]}`
                  : "All Available Events"}
              </h2>

              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: COLORS.muted }}>
                  Loading events…
                </div>
              ) : displayEvents.length === 0 ? (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    padding: "36px",
                    textAlign: "center",
                    color: COLORS.muted,
                  }}
                >
                  No events found for this selection.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 18,
                  }}
                >
                  {displayEvents.map((event) => {
                    const evtDate = event.event_date ? new Date(event.event_date) : null;
                    const isReg = myRegistrations.some(
                      (r) => r.event?._id === event._id || r.event === event._id
                    );

                    return (
                      <div
                        key={event._id}
                        onClick={() => navigate(`/events/${event._id}`)}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          border: `1px solid ${COLORS.border}`,
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "transform 0.18s, box-shadow 0.18s",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          style={{
                            height: 120,
                            background: event.banner_image
                              ? `url(${event.banner_image}) center/cover no-repeat`
                              : `linear-gradient(135deg, ${COLORS.primary}33 0%, ${COLORS.primary}66 100%)`,
                            position: "relative",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              background: event.event_type === "free" ? "#E8F5E9" : `${COLORS.primary}18`,
                              color: event.event_type === "free" ? "#2E7D32" : COLORS.primary,
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "3px 10px",
                              borderRadius: 20,
                            }}
                          >
                            {event.event_type === "free"
                              ? "FREE"
                              : `₹${event.price} / ${event.token_price} Tokens`}
                          </span>

                          {isReg && (
                            <span
                              style={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                background: "#2E7D32",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 9px",
                                borderRadius: 20,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <CheckCircle size={12} /> Registered
                            </span>
                          )}
                        </div>

                        <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: COLORS.ink,
                              marginBottom: 6,
                              lineHeight: 1.3,
                            }}
                          >
                            {event.title}
                          </div>

                          {event.short_description && (
                            <div
                              style={{
                                fontSize: 12.5,
                                color: COLORS.muted,
                                lineHeight: 1.5,
                                marginBottom: 12,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {event.short_description}
                            </div>
                          )}

                          <div
                            style={{
                              marginTop: "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: 12,
                              color: COLORS.muted,
                              borderTop: `1px solid ${COLORS.border}`,
                              paddingTop: 10,
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                              <CalendarIcon size={13} color={COLORS.primary} />
                              {evtDate ? evtDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBA"}
                            </span>
                            <span style={{ color: COLORS.primary, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                              Details <ArrowRight size={13} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Cards matching screenshot */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Card 1: Events you are attending */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                padding: "24px 20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: COLORS.ink,
                  margin: "0 0 18px",
                  lineHeight: 1.2,
                }}
              >
                Events you are attending
              </h2>

              {myRegistrations.length === 0 ? (
                <div
                  style={{
                    background: "#F7F8FA",
                    borderRadius: 10,
                    padding: "22px 16px",
                    textAlign: "center",
                    color: COLORS.muted,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  You are not attending any events
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {myRegistrations.map((reg) => {
                    const evt = reg.event;
                    if (!evt) return null;
                    const evtDate = evt.event_date ? new Date(evt.event_date) : null;

                    return (
                      <div
                        key={reg._id}
                        onClick={() => navigate(`/events/${evt._id}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          borderRadius: 12,
                          background: "#F7F8FA",
                          border: `1px solid ${COLORS.border}`,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF1F5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#F7F8FA")}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: evt.banner_image
                              ? `url(${evt.banner_image}) center/cover no-repeat`
                              : COLORS.primary,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {!evt.banner_image && <TicketIcon size={20} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13.5,
                              color: COLORS.ink,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {evt.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: COLORS.muted, marginTop: 2 }}>
                            {evtDate
                              ? evtDate.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Date TBA"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: COLORS.primary,
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            Ticket: {reg.ticket_number}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 2: Events happening this week */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                padding: "24px 20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: COLORS.ink,
                  margin: "0 0 18px",
                  lineHeight: 1.2,
                }}
              >
                Events happening this week
              </h2>

              {eventsThisWeek.length === 0 ? (
                <div
                  style={{
                    background: "#F7F8FA",
                    borderRadius: 10,
                    padding: "22px 16px",
                    textAlign: "center",
                    color: COLORS.muted,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  No upcoming events this week
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {eventsThisWeek.map((evt) => {
                    const evtDate = evt.event_date ? new Date(evt.event_date) : null;
                    return (
                      <div
                        key={evt._id}
                        onClick={() => navigate(`/events/${evt._id}`)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          background: "#F7F8FA",
                          border: `1px solid ${COLORS.border}`,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>
                          {evt.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: COLORS.primary,
                            fontWeight: 600,
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Clock size={13} />
                          {evtDate
                            ? evtDate.toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Time TBA"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

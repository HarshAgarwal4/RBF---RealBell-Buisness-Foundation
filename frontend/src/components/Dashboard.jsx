import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageCircle,
  Users,
  Search,
  Ticket,
  Pencil,
  Image as ImageIcon,
  BarChart2,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Link2,
} from "lucide-react";
import { COLORS } from "./Sidebar";
import { useStore } from "../zustand/store";

const chipStyle = {
  background: "#F1F1F5",
  color: "#555",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 6,
};

function ProgressRing({ percent }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={110} height={110} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F1E4E6" strokeWidth="7" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="7"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="800" fill={COLORS.ink} fontFamily="Inter, sans-serif">
        {percent}%
      </text>
    </svg>
  );
}

const RECOMMENDATIONS = {
  Investor: [
    { name: "Speciale Investments", tag: "Micro VC", amount: "$60K–$250K" },
    { name: "WCMS Investment Grp", tag: "Micro VC", amount: "$100K–$500K" },
    { name: "Akash Rao", tag: "Angel", amount: "$25K–$75K" },
    { name: "Vedant Bhotika", tag: "Angel", amount: "$5K–$50K" },
  ],
  Mentors: [
    { name: "Priya Nandakumar", tag: "GTM", amount: "Sessions: 12" },
    { name: "Rohan Kapoor", tag: "Fintech", amount: "Sessions: 8" },
    { name: "Meera Iyer", tag: "Ops", amount: "Sessions: 20" },
    { name: "Sanjay Bhatt", tag: "Product", amount: "Sessions: 5" },
  ],
  Corporate: [
    { name: "Nimbus Retail Co.", tag: "Pilot", amount: "Open" },
    { name: "Trident Logistics", tag: "Partnership", amount: "Open" },
    { name: "Bluepeak Foods", tag: "Pilot", amount: "Closed" },
    { name: "Orbit Payments", tag: "Partnership", amount: "Open" },
  ],
};

const PROGRAMS = [
  { title: "Leap To Founder Season 5", sub: "Apply for the Fintech cohort of LTF Season 5 …", tone: "dark" },
  { title: "Community", sub: "", tone: "grey" },
  { title: "RealBell Connect", sub: "Get expert eyes on your pitch, go live, and open…", tone: "light" },
  { title: "RealBell Founder Lounge", sub: "🚀 Founders, stop searching for the…", tone: "dark" },
];

const NEWS = [
  {
    title: "Rain batters Uttarakhand, damages Yamunotri route; schools shut i…",
    body: "DEHRADUN: Incessant rain since Monday night has disrupted normal life across Uttarakhand, damaging a key stretch of the Yamunotri pilgrimage…",
    source: "The New Indian Express",
    date: "Jul 28, 2026, 4:08 AM",
    tag: "Others",
  },
  {
    title: "Asia's Leading News Site",
    body: "Bhubaneswar (Odisha) July 27, 2026 (ANI): Odisha Chief Minister Mohan Charan Majhi, along with Cabinet Ministers, attended the 19th edition of the…",
    source: "Asian News International (ANI)",
    date: "Jul 28, 2026, 4:05 AM",
    tag: "Others",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Investor");
  const [resourceTab, setResourceTab] = useState("News");
  const {user} = useStore()

  return (
    <div
      style={{
        marginLeft: 300, // offset for the fixed Sidebar
        padding: "26px 30px 40px",
        fontFamily: "'Inter', system-ui, sans-serif",
        background: COLORS.bg,
        minHeight: "100vh",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, color: "#555" }}>Good Afternoon</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.primary, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {user?.name}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <ProgressRing percent={100} />
          <button
            onClick={() => navigate("/account")}
            style={{
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <Pencil size={13} /> Edit profile
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <Search size={16} color={COLORS.muted} />
          <input
            placeholder="Enter a keyword to search"
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "#333" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 600,
            color: "#3A3A46",
            cursor: "pointer",
          }}
        >
          All <ChevronDown size={14} />
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 22, marginTop: 22 }}>
        <div>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { value: 0, label: "Connect Requests", Icon: Users },
              { value: 0, label: "Unread Messages", Icon: MessageCircle },
              { value: 0, label: "Mentor Hours", Icon: BarChart2 },
              { value: 0, label: "Document requests", Icon: Ticket },
            ].map((s) => (
              <div key={s.label} style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink }}>{s.value}</div>
                  <s.Icon size={18} color={COLORS.primary} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 6, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Post box */}
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", gap: 14, color: COLORS.muted, marginBottom: 12 }}>
              <Bold size={15} />
              <Italic size={15} />
              <Underline size={15} />
              <Link2 size={15} />
            </div>
            <textarea
              placeholder="What's on your mind today?"
              rows={3}
              style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 14.5, color: "#333", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <button
                style={{
                  background: "#EFEFF3",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 22px",
                  fontWeight: 800,
                  fontSize: 12.5,
                  letterSpacing: 0.6,
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                POST
              </button>
              <div style={{ display: "flex", gap: 14, color: COLORS.muted }}>
                <ImageIcon size={17} />
                <BarChart2 size={17} />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>Recommendations</div>
              <div style={{ display: "flex", gap: 20 }}>
                {Object.keys(RECOMMENDATIONS).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      paddingBottom: 6,
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: tab === t ? COLORS.primary : "#8A8A97",
                      borderBottom: tab === t ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 16 }}>
              {RECOMMENDATIONS[tab].map((r) => (
                <div key={r.name} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div
                    style={{
                      height: 70,
                      background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`,
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "0 10px 8px",
                    }}
                  >
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{r.name}</span>
                  </div>
                  <div style={{ padding: 10, display: "flex", gap: 6 }}>
                    <span style={chipStyle}>{r.tag}</span>
                    <span style={chipStyle}>{r.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Programs */}
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>Active Programs</div>
              <button
                style={{
                  background: "#EFEFF3",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: COLORS.primary,
                  cursor: "pointer",
                }}
              >
                View all
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 16 }}>
              {PROGRAMS.map((p) => (
                <div key={p.title} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div
                    style={{
                      height: 78,
                      background: p.tone === "dark" ? COLORS.ink : p.tone === "grey" ? "#D8D8DE" : "#F4F1EC",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "0 10px 8px",
                    }}
                  >
                    <span style={{ color: p.tone === "light" ? COLORS.ink : "#fff", fontWeight: 800, fontSize: 13 }}>{p.title}</span>
                  </div>
                  <div style={{ padding: 10, fontSize: 12, color: "#555", minHeight: 34 }}>{p.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, marginTop: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink }}>Resources</div>
              <div style={{ display: "flex", gap: 18 }}>
                {["News", "Reports & Downloads", "Videos"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setResourceTab(t)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      paddingBottom: 6,
                      fontWeight: 700,
                      fontSize: 13.5,
                      color: resourceTab === t ? COLORS.primary : "#8A8A97",
                      borderBottom: resourceTab === t ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.ink }}>Latest News</div>
              <button
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer",
                }}
              >
                Update Preferences
              </button>
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {NEWS.map((n) => (
                <div key={n.title} style={{ display: "flex", gap: 14, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ width: 80, height: 62, borderRadius: 8, background: "#22252B", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>{n.title}</div>
                    <div style={{ fontSize: 12.5, color: "#666", marginTop: 4 }}>{n.body}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                      {n.source} · {n.date}
                    </div>
                  </div>
                  <span style={{ ...chipStyle, height: "fit-content" }}>{n.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ fontWeight: 800, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 6, fontSize: 14 }}>
                My Connections
              </div>
              <div style={{ color: "#8A8A97", fontWeight: 700, fontSize: 14 }}>Pending Requests</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0C29B" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Naina R.</div>
                <span style={{ ...chipStyle, marginTop: 2, display: "inline-block" }}>REALBELL TEAM</span>
              </div>
              <MessageCircle size={16} color={COLORS.muted} />
            </div>
            <button
              style={{
                width: "100%",
                marginTop: 16,
                background: "#fff",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "10px 0",
                fontWeight: 700,
                fontSize: 13.5,
                color: "#3A3A46",
                cursor: "pointer",
              }}
            >
              View All
            </button>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ fontWeight: 800, color: COLORS.primary, borderBottom: `2px solid ${COLORS.primary}`, paddingBottom: 6, fontSize: 14 }}>
                Upcoming Meetings
              </div>
              <div style={{ color: "#8A8A97", fontWeight: 700, fontSize: 14 }}>Meeting Requests</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", color: "#B5B5BE" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "2px solid #D6D6DD",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                !
              </div>
              <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600 }}>No meetings found</div>
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.ink, marginBottom: 12 }}>Upcoming Events</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", color: "#B5B5BE" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "2px solid #D6D6DD",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                !
              </div>
              <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600 }}>No events found</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

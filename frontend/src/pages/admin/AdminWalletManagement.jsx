import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout.jsx";
import axios from "../../services/axios";
import { useStore } from "../../zustand/store";
import {
  Coins, Search, RefreshCw, PlusCircle, MinusCircle, ShieldCheck,
  User, CheckCircle2, Receipt, Scale, CreditCard, Gift, Sparkles,
  SlidersHorizontal, Save, Info, Lock, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { toast } from "react-toastify";
import { hasPermission, isSuperAdmin } from "../../utils/rbac";

export default function AdminWalletManagement() {
  const { user: loggedInAdmin } = useStore();
  const canAdjust = isSuperAdmin(loggedInAdmin) || hasPermission(loggedInAdmin, "wallets.adjust") || hasPermission(loggedInAdmin, "wallets.manage");
  const canManageRules = isSuperAdmin(loggedInAdmin) || hasPermission(loggedInAdmin, "wallets.settings") || hasPermission(loggedInAdmin, "wallets.manage");

  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCirculationBalance: 0, totalTopupAmount: 0, totalTopupCount: 0, totalLegalSpent: 0, totalLegalTxns: 0, totalAdminCredits: 0, totalWallets: 0 });
  const [creditSettings, setCreditSettings] = useState({ welcomeCredits: 500, referralCredits: 250, updatedBy: null });
  const [editWelcome, setEditWelcome] = useState("500");
  const [editReferral, setEditReferral] = useState("250");
  const [savingSettings, setSavingSettings] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ledgerTxns, setLedgerTxns] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("");
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState("");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustType, setAdjustType] = useState("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const fetchCreditSettings = async () => {
    try {
      const res = await axios.get("/wallet/admin/settings");
      if (res.data.status === 1 && res.data.settings) {
        const s = res.data.settings;
        setCreditSettings(s);
        setEditWelcome(String(s.welcomeCredits ?? 500));
        setEditReferral(String(s.referralCredits ?? 250));
      }
    } catch (err) { console.error("Failed to load credit settings:", err); }
  };

  const handleSaveCreditSettings = async (e) => {
    if (e) e.preventDefault();
    if (!canManageRules) { toast.error("Access Forbidden: You do not have permission to modify ecosystem credit rules"); return; }
    const welcomeNum = Number(editWelcome), referralNum = Number(editReferral);
    if (isNaN(welcomeNum) || welcomeNum < 0) { toast.error("Please enter a valid non-negative number for Welcome Credits"); return; }
    if (isNaN(referralNum) || referralNum < 0) { toast.error("Please enter a valid non-negative number for Referral Credits"); return; }
    try {
      setSavingSettings(true);
      const res = await axios.put("/wallet/admin/settings", { welcomeCredits: welcomeNum, referralCredits: referralNum });
      if (res.data.status === 1) {
        toast.success(res.data.msg || "Ecosystem credit rules updated successfully!");
        if (res.data.settings) { setCreditSettings(res.data.settings); setEditWelcome(String(res.data.settings.welcomeCredits)); setEditReferral(String(res.data.settings.referralCredits)); }
        fetchStats(); if (activeTab === "users") fetchUserWallets();
      } else { toast.error(res.data.msg || "Failed to update credit rules"); }
    } catch (err) { toast.error(err.response?.data?.msg || "Failed to update credit settings"); }
    finally { setSavingSettings(false); }
  };

  const fetchStats = async () => {
    try { const res = await axios.get("/wallet/admin/stats"); if (res.data.status === 1) setStats(res.data.stats || {}); }
    catch (err) { console.error(err); }
  };
  const fetchUserWallets = async () => {
    try { setLoading(true); const res = await axios.get("/wallet/admin/wallets", { params: { page, limit: 15, search, company_type: companyTypeFilter } }); if (res.data.status === 1) { setUsers(res.data.users || []); setTotalPages(res.data.pagination?.pages || 1); } }
    catch (err) { toast.error("Could not fetch user wallets"); } finally { setLoading(false); }
  };
  const fetchLedger = async () => {
    try { setLoading(true); const res = await axios.get("/wallet/admin/transactions", { params: { page: ledgerPage, limit: 20, search: ledgerSearch, type: ledgerTypeFilter, category: ledgerCategoryFilter } }); if (res.data.status === 1) { setLedgerTxns(res.data.transactions || []); setLedgerTotalPages(res.data.pagination?.pages || 1); } }
    catch (err) { toast.error("Could not fetch ledger transactions"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); fetchCreditSettings(); }, []);
  useEffect(() => { if (activeTab === "users") fetchUserWallets(); else fetchLedger(); }, [activeTab, page, search, companyTypeFilter, ledgerPage, ledgerTypeFilter, ledgerCategoryFilter, ledgerSearch]);

  const handleOpenAdjustModal = (u) => {
    if (!canAdjust) { toast.error("Access Forbidden"); return; }
    setSelectedUser(u); setAdjustType("credit"); setAdjustAmount(""); setAdjustReason(""); setShowAdjustModal(true);
  };
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!canAdjust || !selectedUser || !adjustAmount || Number(adjustAmount) < 1) { toast.error("Please enter a valid credit amount"); return; }
    if (!adjustReason.trim()) { toast.error("Please provide a reason"); return; }
    try {
      setSubmittingAdjust(true);
      const res = await axios.post("/wallet/admin/adjust", { userId: selectedUser._id, type: adjustType, amount: Number(adjustAmount), reason: adjustReason.trim() });
      if (res.data.status === 1) { toast.success(res.data.msg || "Credits updated!"); setShowAdjustModal(false); fetchStats(); fetchUserWallets(); }
      else { toast.error(res.data.msg || "Adjustment failed"); }
    } catch (err) { toast.error(err.response?.data?.msg || "Failed to adjust credits"); }
    finally { setSubmittingAdjust(false); }
  };

  // ── Admin CSS-variable style helpers ────────────────────────────────
  const S = {
    card:    { background: "var(--admin-card-bg)", border: "1px solid var(--admin-card-border)", borderRadius: 14, padding: "1.25rem" },
    input:   { width: "100%", padding: "0.5rem 0.85rem", borderRadius: 9, border: "1px solid var(--admin-input-border)", background: "var(--admin-input-bg)", color: "var(--admin-input-text)", fontSize: "0.82rem", fontWeight: 600, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
    select:  { padding: "0.5rem 0.85rem", borderRadius: 9, border: "1px solid var(--admin-input-border)", background: "var(--admin-input-bg)", color: "var(--admin-input-text)", fontSize: "0.82rem", fontWeight: 600, outline: "none", cursor: "pointer", fontFamily: "inherit" },
    ghost:   { padding: "0.45rem 1rem", borderRadius: 9, border: "1px solid var(--admin-card-border)", background: "var(--admin-card-bg)", color: "var(--admin-text-secondary)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    primary: { padding: "0.45rem 1.2rem", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 },
    thCell:  { padding: "0.55rem 0.75rem", fontSize: "0.64rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--admin-text-muted)", whiteSpace: "nowrap" },
    td:      { padding: "0.68rem 0.75rem", verticalAlign: "middle", borderBottom: "1px solid var(--admin-card-border)" },
  };

  const statCards = [
    { label: "Total Active Balance",    value: stats.totalCirculationBalance?.toLocaleString("en-IN") || "0", sub: `Across ${stats.totalWallets||0} wallets`,          icon: <Coins size={18}/>,      accent:"#6366f1", bg:"rgba(99,102,241,0.12)"   },
    { label: "Razorpay Top-Ups",        value: `\u20B9${stats.totalTopupAmount?.toLocaleString("en-IN")||"0"}`,       sub: `${stats.totalTopupCount||0} orders`,              icon: <CreditCard size={18}/>, accent:"#10b981", bg:"rgba(16,185,129,0.12)"  },
    { label: "Redeemed in Legal",       value: stats.totalLegalSpent?.toLocaleString("en-IN")  || "0", sub: `${stats.totalLegalTxns||0} compliance payments`,    icon: <Scale size={18}/>,      accent:"#a855f7", bg:"rgba(168,85,247,0.12)"  },
    { label: "Admin Credit Grants",     value: stats.totalAdminCredits?.toLocaleString("en-IN")|| "0", sub: "Granted manually via console",                      icon: <ShieldCheck size={18}/>, accent:"#f59e0b", bg:"rgba(245,158,11,0.12)"  },
  ];
  const hover = (e, on) => { e.currentTarget.style.background = on ? "var(--admin-table-row-hover)" : "transparent"; };

  return (
    <AdminLayout>
      <div style={{ padding:"1.5rem 2rem", maxWidth:1380, margin:"0 auto" }}>

        {/* ─── HEADER ─── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.67rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6366f1", marginBottom:5 }}>
              <Coins size={13}/><span>Financial &amp; Credit Management</span>
            </div>
            <h1 style={{ margin:0, color:"var(--admin-text-primary)", fontWeight:800, fontSize:"1.4rem", lineHeight:1.2 }}>Wallet &amp; Credits Console</h1>
            <p style={{ margin:"5px 0 0", color:"var(--admin-text-muted)", fontSize:"0.78rem" }}>Manage ecosystem credit wallets, configure dynamic welcome/referral rules, and review the full transaction ledger.</p>
          </div>
          <button onClick={()=>{ fetchStats(); fetchCreditSettings(); activeTab==="users"?fetchUserWallets():fetchLedger(); }} style={{ ...S.ghost, display:"flex", alignItems:"center", gap:6 }}>
            <RefreshCw size={13} className={loading?"animate-spin":""}/> Refresh
          </button>
        </div>

        {/* ─── CREDIT RULES PANEL ─── */}
        <div style={{ ...S.card, marginBottom:"1.25rem", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#6366f1,#a855f7,#3b82f6)", borderRadius:"14px 14px 0 0" }}/>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.25rem", paddingTop:"0.25rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ padding:"0.45rem", borderRadius:9, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", display:"flex" }}><SlidersHorizontal size={16}/></div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <h2 style={{ margin:0, color:"var(--admin-text-primary)", fontSize:"0.95rem", fontWeight:700 }}>Dynamic Credit Rules &amp; Incentives</h2>
                  {canManageRules
                    ? <span style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.62rem", fontWeight:700, background:"rgba(99,102,241,0.12)", color:"#6366f1", border:"1px solid rgba(99,102,241,0.25)" }}>Live Rule Config</span>
                    : <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, fontSize:"0.62rem", fontWeight:700, background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.25)" }}><Lock size={10}/>View-Only Mode</span>}
                </div>
                <p style={{ margin:"3px 0 0", color:"var(--admin-text-muted)", fontSize:"0.75rem" }}>Set dynamic welcome credits for new registrations and bilateral referral rewards.</p>
              </div>
            </div>
            {creditSettings.updatedBy && <span style={{ fontSize:"0.71rem", color:"var(--admin-text-muted)" }}>Last updated by <strong style={{ color:"var(--admin-text-secondary)" }}>{creditSettings.updatedBy?.name||"Admin"}</strong></span>}
          </div>

          <form onSubmit={handleSaveCreditSettings}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"1rem", marginBottom:"1.25rem" }}>
              {[
                { key:"welcome", label:"New User Welcome Bonus", icon:<Sparkles size={14}/>, accent:"#f59e0b", accentBg:"rgba(245,158,11,0.12)", active:creditSettings.welcomeCredits, val:editWelcome, set:setEditWelcome, presets:[0,250,500,750,1000] },
                { key:"referral", label:"Referral Invite Bonus",  icon:<Gift size={14}/>,     accent:"#10b981", accentBg:"rgba(16,185,129,0.12)", active:creditSettings.referralCredits, val:editReferral, set:setEditReferral, presets:[0,100,250,500,750] },
              ].map(r=>(
                <div key={r.key} style={{ padding:"1rem", borderRadius:11, background:"var(--admin-input-bg)", border:"1px solid var(--admin-card-border)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ padding:"0.3rem", borderRadius:7, background:r.accentBg, color:r.accent, display:"flex" }}>{r.icon}</div>
                      <label style={{ fontSize:"0.76rem", fontWeight:700, color:"var(--admin-text-primary)" }}>{r.label}</label>
                    </div>
                    <span style={{ fontSize:"0.66rem", fontWeight:700, color:r.accent, background:r.accentBg, border:`1px solid ${r.accent}40`, padding:"2px 7px", borderRadius:6 }}>Active: {r.active} Cr.</span>
                  </div>
                  <div style={{ position:"relative", marginBottom:8 }}>
                    <input type="number" min="0" required disabled={!canManageRules} value={r.val} onChange={e=>r.set(e.target.value)} placeholder={r.key==="welcome"?"e.g. 500":"e.g. 250"} style={{ ...S.input, paddingRight:"4.5rem", opacity:canManageRules?1:0.6, cursor:canManageRules?"text":"not-allowed" }}/>
                    <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:"0.65rem", fontWeight:700, color:"var(--admin-text-muted)", pointerEvents:"none" }}>Credits</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.66rem", fontWeight:600, color:"var(--admin-text-muted)" }}>Presets:</span>
                    {r.presets.map(p=>(
                      <button key={p} type="button" disabled={!canManageRules} onClick={()=>r.set(String(p))} style={{ padding:"2px 7px", borderRadius:6, fontSize:"0.66rem", fontWeight:700, fontFamily:"inherit", border:"1px solid", cursor:canManageRules?"pointer":"not-allowed", background:Number(r.val)===p?r.accent:"var(--admin-card-bg)", color:Number(r.val)===p?"#fff":"var(--admin-text-muted)", borderColor:Number(r.val)===p?r.accent:"var(--admin-card-border)", opacity:canManageRules?1:0.5 }}>{p}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem", paddingTop:"1rem", borderTop:"1px solid var(--admin-card-border)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem", color:"var(--admin-text-muted)" }}>
                <Info size={13} style={{ color:"#6366f1", flexShrink:0 }}/>
                <span>{canManageRules?"Changes apply in real-time to all subsequent user registrations and referral validations.":"Super Admin has granted you view-only access. Modification requires 'wallets.settings' permission."}</span>
              </div>
              {canManageRules ? (
                <div style={{ display:"flex", gap:8 }}>
                  <button type="button" onClick={()=>{ setEditWelcome(String(creditSettings.welcomeCredits??500)); setEditReferral(String(creditSettings.referralCredits??250)); }} style={S.ghost}>Reset</button>
                  <button type="submit" disabled={savingSettings} style={{ ...S.primary, opacity:savingSettings?0.7:1, cursor:savingSettings?"not-allowed":"pointer" }}>
                    {savingSettings?<><RefreshCw size={12} className="animate-spin"/>Saving...</>:<><Save size={12}/>Save Credit Rules</>}
                  </button>
                </div>
              ) : (
                <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"0.4rem 0.85rem", borderRadius:9, background:"var(--admin-input-bg)", color:"var(--admin-text-muted)", fontSize:"0.73rem", fontWeight:700, border:"1px solid var(--admin-card-border)" }}><Lock size={12}/>Modifications Disabled</span>
              )}
            </div>
          </form>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:"1rem", marginBottom:"1.25rem" }}>
          {statCards.map((s,i)=>(
            <div key={i} style={S.card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:"0.7rem", fontWeight:600, color:"var(--admin-text-muted)" }}>{s.label}</span>
                <div style={{ padding:"0.38rem", borderRadius:8, background:s.bg, color:s.accent, display:"flex" }}>{s.icon}</div>
              </div>
              <div style={{ fontSize:"1.45rem", fontWeight:800, color:"var(--admin-text-primary)", lineHeight:1.1, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:"0.68rem", color:s.accent, fontWeight:600 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── TABS ─── */}
        <div style={{ display:"flex", borderBottom:"2px solid var(--admin-card-border)", marginBottom:"1.25rem" }}>
          {[{ key:"users",label:"User Wallets Directory",icon:<User size={13}/> },{ key:"ledger",label:"Global Transaction Ledger",icon:<Receipt size={13}/> }].map(tab=>(
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{ display:"flex", alignItems:"center", gap:6, padding:"0.6rem 1.1rem", fontSize:"0.78rem", fontWeight:700, cursor:"pointer", background:"transparent", border:"none", borderBottom:activeTab===tab.key?"2px solid #6366f1":"2px solid transparent", color:activeTab===tab.key?"#6366f1":"var(--admin-text-muted)", marginBottom:-2, fontFamily:"inherit" }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ─── USER WALLETS ─── */}
        {activeTab==="users" && (
          <div style={S.card}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", marginBottom:"1rem" }}>
              <div style={{ position:"relative", flex:"1 1 200px", maxWidth:300 }}>
                <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--admin-text-muted)", pointerEvents:"none" }}/>
                <input type="text" placeholder="Search user, email, company..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} style={{ ...S.input, paddingLeft:"2rem" }}/>
              </div>
              <select value={companyTypeFilter} onChange={e=>{ setCompanyTypeFilter(e.target.value); setPage(1); }} style={S.select}>
                <option value="">All Ecosystem Roles</option>
                <option value="startup">Startups</option><option value="investor">Investors</option>
                <option value="mentor">Mentors</option><option value="incubator">Incubators</option><option value="accelerator">Accelerators</option>
              </select>
            </div>
            {loading ? (
              <div style={{ padding:"3rem", textAlign:"center" }}>
                <RefreshCw size={24} className="animate-spin" style={{ color:"#6366f1", margin:"0 auto 0.75rem", display:"block" }}/>
                <p style={{ fontSize:"0.8rem", fontWeight:700, color:"var(--admin-text-muted)" }}>Loading user wallets...</p>
              </div>
            ) : users.length===0 ? (
              <div style={{ padding:"3rem", textAlign:"center" }}>
                <User size={36} style={{ margin:"0 auto 0.75rem", display:"block", color:"var(--admin-text-muted)", opacity:0.4 }}/>
                <p style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--admin-text-secondary)" }}>No users found matching query</p>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.79rem", minWidth:680 }}>
                  <thead><tr style={{ borderBottom:"1px solid var(--admin-card-border)" }}>
                    {["User / Company","Role","Balance","Credited","Spent","Status","Actions"].map(h=>(
                      <th key={h} style={{ ...S.thCell, textAlign:h==="Actions"?"right":"left" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u._id} style={{ borderBottom:"1px solid var(--admin-card-border)" }} onMouseEnter={e=>hover(e,true)} onMouseLeave={e=>hover(e,false)}>
                        <td style={S.td}>
                          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                            <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(99,102,241,0.12)", color:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.78rem", flexShrink:0 }}>{u.name?.charAt(0)||"U"}</div>
                            <div>
                              <div style={{ fontWeight:700, color:"var(--admin-text-primary)", fontSize:"0.8rem" }}>{u.name}</div>
                              <div style={{ fontSize:"0.67rem", color:"var(--admin-text-muted)" }}>{u.email}</div>
                              {u.company_name&&<div style={{ fontSize:"0.64rem", color:"var(--admin-text-muted)", fontWeight:600 }}>{u.company_name}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={S.td}><span style={{ padding:"2px 7px", borderRadius:6, fontSize:"0.67rem", fontWeight:700, background:"var(--admin-input-bg)", color:"var(--admin-text-secondary)", border:"1px solid var(--admin-card-border)", textTransform:"capitalize" }}>{u.company_type||u.role||"Member"}</span></td>
                        <td style={S.td}><span style={{ fontWeight:800, fontSize:"0.88rem", color:"#6366f1" }}>{u.wallet?.balance?.toLocaleString("en-IN")||0}</span><span style={{ fontSize:"0.62rem", color:"var(--admin-text-muted)", marginLeft:3 }}>Cr.</span></td>
                        <td style={S.td}><span style={{ display:"flex", alignItems:"center", gap:3, fontWeight:700, color:"#10b981", fontSize:"0.79rem" }}><TrendingUp size={11}/>{u.wallet?.total_credited?.toLocaleString("en-IN")||0}</span></td>
                        <td style={S.td}><span style={{ display:"flex", alignItems:"center", gap:3, fontWeight:700, color:"#ef4444", fontSize:"0.79rem" }}><TrendingDown size={11}/>{u.wallet?.total_debited?.toLocaleString("en-IN")||0}</span></td>
                        <td style={S.td}><span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:"0.67rem", fontWeight:700, color:"#10b981", background:"rgba(16,185,129,0.1)", padding:"2px 8px", borderRadius:20, border:"1px solid rgba(16,185,129,0.25)" }}><CheckCircle2 size={10}/>Active</span></td>
                        <td style={{ ...S.td, textAlign:"right" }}>
                          {canAdjust
                            ? <button onClick={()=>handleOpenAdjustModal(u)} style={{ padding:"0.32rem 0.8rem", borderRadius:7, background:"#6366f1", color:"#fff", fontWeight:700, fontSize:"0.72rem", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Assign / Adjust</button>
                            : <span title="View-only: requires wallets.adjust" style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0.32rem 0.7rem", borderRadius:7, background:"var(--admin-input-bg)", color:"var(--admin-text-muted)", fontSize:"0.69rem", fontWeight:600, border:"1px solid var(--admin-card-border)", cursor:"not-allowed" }}><Lock size={10}/>View Only</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages>1 && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"0.85rem", borderTop:"1px solid var(--admin-card-border)", marginTop:"0.5rem" }}>
                <span style={{ fontSize:"0.73rem", color:"var(--admin-text-muted)" }}>Page {page} of {totalPages}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <button disabled={page<=1} onClick={()=>setPage(page-1)} style={{ ...S.ghost, opacity:page<=1?0.4:1, cursor:page<=1?"not-allowed":"pointer" }}>\u2190 Prev</button>
                  <button disabled={page>=totalPages} onClick={()=>setPage(page+1)} style={{ ...S.ghost, opacity:page>=totalPages?0.4:1, cursor:page>=totalPages?"not-allowed":"pointer" }}>Next \u2192</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── LEDGER ─── */}
        {activeTab==="ledger" && (
          <div style={S.card}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", marginBottom:"1rem" }}>
              <div style={{ position:"relative", flex:"1 1 200px", maxWidth:280 }}>
                <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--admin-text-muted)", pointerEvents:"none" }}/>
                <input type="text" placeholder="Search user, ref ID, notes..." value={ledgerSearch} onChange={e=>{ setLedgerSearch(e.target.value); setLedgerPage(1); }} style={{ ...S.input, paddingLeft:"2rem" }}/>
              </div>
              <select value={ledgerTypeFilter} onChange={e=>{ setLedgerTypeFilter(e.target.value); setLedgerPage(1); }} style={S.select}>
                <option value="">All Types</option><option value="credit">Credits (+)</option><option value="debit">Debits (-)</option>
              </select>
              <select value={ledgerCategoryFilter} onChange={e=>{ setLedgerCategoryFilter(e.target.value); setLedgerPage(1); }} style={S.select}>
                <option value="">All Categories</option>
                <option value="signup_bonus">Signup Bonus</option><option value="razorpay_topup">Razorpay Topup</option>
                <option value="legal_compliance_payment">Legal Compliance</option><option value="admin_credit">Admin Credit</option><option value="admin_debit">Admin Debit</option>
              </select>
            </div>
            {loading ? (
              <div style={{ padding:"3rem", textAlign:"center" }}>
                <RefreshCw size={24} className="animate-spin" style={{ color:"#6366f1", margin:"0 auto 0.75rem", display:"block" }}/>
                <p style={{ fontSize:"0.8rem", fontWeight:700, color:"var(--admin-text-muted)" }}>Loading global transactions...</p>
              </div>
            ) : ledgerTxns.length===0 ? (
              <div style={{ padding:"3rem", textAlign:"center" }}>
                <Receipt size={36} style={{ margin:"0 auto 0.75rem", display:"block", color:"var(--admin-text-muted)", opacity:0.4 }}/>
                <p style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--admin-text-secondary)" }}>No ledger records found</p>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.77rem", minWidth:750 }}>
                  <thead><tr style={{ borderBottom:"1px solid var(--admin-card-border)" }}>
                    {["User","Type","Category","Description","Ref ID","By","Date","Amount","Balance After"].map(h=>(
                      <th key={h} style={{ ...S.thCell, textAlign:["Amount","Balance After"].includes(h)?"right":"left" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {ledgerTxns.map(tx=>{
                      const isCr=tx.type==="credit";
                      return (
                        <tr key={tx._id} style={{ borderBottom:"1px solid var(--admin-card-border)" }} onMouseEnter={e=>hover(e,true)} onMouseLeave={e=>hover(e,false)}>
                          <td style={S.td}>
                            <div style={{ fontWeight:700, color:"var(--admin-text-primary)", fontSize:"0.78rem" }}>{tx.user?.name||"Member"}</div>
                            <div style={{ fontSize:"0.64rem", color:"var(--admin-text-muted)" }}>{tx.user?.email}</div>
                          </td>
                          <td style={S.td}>
                            <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, fontSize:"0.65rem", fontWeight:700, background:isCr?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", color:isCr?"#10b981":"#ef4444", border:`1px solid ${isCr?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}` }}>
                              {isCr?<ArrowUpRight size={10}/>:<ArrowDownLeft size={10}/>}{tx.type?.toUpperCase()}
                            </span>
                          </td>
                          <td style={S.td}><span style={{ padding:"2px 7px", borderRadius:6, fontSize:"0.64rem", fontWeight:700, background:"var(--admin-input-bg)", color:"var(--admin-text-secondary)", border:"1px solid var(--admin-card-border)", textTransform:"capitalize", whiteSpace:"nowrap" }}>{tx.category?.replace(/_/g," ")}</span></td>
                          <td style={{ ...S.td, maxWidth:175, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--admin-text-secondary)", fontSize:"0.73rem" }}>{tx.description}</td>
                          <td style={{ ...S.td, fontFamily:"monospace", fontSize:"0.64rem", color:"var(--admin-text-muted)" }}>{tx.reference_id||tx.razorpay_payment_id||"\u2014"}</td>
                          <td style={{ ...S.td, fontSize:"0.72rem", color:"var(--admin-text-muted)" }}>{tx.performed_by?.name||"System"}</td>
                          <td style={{ ...S.td, fontSize:"0.69rem", color:"var(--admin-text-muted)", whiteSpace:"nowrap" }}>{new Date(tx.createdAt).toLocaleDateString("en-IN",{ day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit" })}</td>
                          <td style={{ ...S.td, textAlign:"right", fontWeight:800, color:isCr?"#10b981":"#ef4444", fontSize:"0.8rem" }}>{isCr?"+":"\u2212"}{tx.amount?.toLocaleString("en-IN")}</td>
                          <td style={{ ...S.td, textAlign:"right", fontWeight:700, color:"var(--admin-text-secondary)", fontSize:"0.77rem" }}>{tx.balance_after?.toLocaleString("en-IN")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {ledgerTotalPages>1 && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"0.85rem", borderTop:"1px solid var(--admin-card-border)", marginTop:"0.5rem" }}>
                <span style={{ fontSize:"0.73rem", color:"var(--admin-text-muted)" }}>Page {ledgerPage} of {ledgerTotalPages}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <button disabled={ledgerPage<=1} onClick={()=>setLedgerPage(ledgerPage-1)} style={{ ...S.ghost, opacity:ledgerPage<=1?0.4:1, cursor:ledgerPage<=1?"not-allowed":"pointer" }}>\u2190 Prev</button>
                  <button disabled={ledgerPage>=ledgerTotalPages} onClick={()=>setLedgerPage(ledgerPage+1)} style={{ ...S.ghost, opacity:ledgerPage>=ledgerTotalPages?0.4:1, cursor:ledgerPage>=ledgerTotalPages?"not-allowed":"pointer" }}>Next \u2192</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADJUST MODAL ─── */}
      {showAdjustModal && selectedUser && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", background:"var(--admin-backdrop)", backdropFilter:"blur(4px)" }} onClick={e=>{ if(e.target===e.currentTarget&&!submittingAdjust)setShowAdjustModal(false); }}>
          <div style={{ width:"100%", maxWidth:450, borderRadius:16, padding:"1.5rem", background:"var(--admin-modal-bg)", border:"1px solid var(--admin-modal-border)", boxShadow:"var(--admin-box-shadow)", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:"0.9rem", borderBottom:"1px solid var(--admin-card-border)", marginBottom:"1.1rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ padding:"0.4rem", borderRadius:9, background:"rgba(99,102,241,0.12)", color:"#6366f1", display:"flex" }}><Coins size={17}/></div>
                <div>
                  <h3 style={{ margin:0, fontSize:"0.92rem", fontWeight:700, color:"var(--admin-text-primary)" }}>Assign / Adjust Credits</h3>
                  <p style={{ margin:0, fontSize:"0.69rem", color:"var(--admin-text-muted)" }}>Admin Audit Action</p>
                </div>
              </div>
              <button onClick={()=>!submittingAdjust&&setShowAdjustModal(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--admin-text-muted)", fontSize:"1rem", fontWeight:700, padding:"0.2rem", lineHeight:1 }}>&times;</button>
            </div>
            <div style={{ padding:"0.8rem 0.9rem", borderRadius:9, background:"var(--admin-input-bg)", border:"1px solid var(--admin-card-border)", marginBottom:"1.1rem" }}>
              <div style={{ fontWeight:700, color:"var(--admin-text-primary)", fontSize:"0.8rem" }}>{selectedUser.name}</div>
              <div style={{ fontSize:"0.69rem", color:"var(--admin-text-muted)", marginBottom:7 }}>{selectedUser.email}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:7, borderTop:"1px solid var(--admin-card-border)" }}>
                <span style={{ fontSize:"0.72rem", color:"var(--admin-text-muted)" }}>Current Balance:</span>
                <strong style={{ color:"#6366f1", fontWeight:800, fontSize:"0.88rem" }}>{selectedUser.wallet?.balance?.toLocaleString("en-IN")||0} Credits</strong>
              </div>
            </div>
            <form onSubmit={handleAdjustSubmit} style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
              <div>
                <label style={{ display:"block", fontSize:"0.74rem", fontWeight:700, color:"var(--admin-text-secondary)", marginBottom:6 }}>Adjustment Type:</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                  {[
                    { val:"credit", label:"Assign / Credit (+)", icon:<PlusCircle size={13}/>, c:"#10b981" },
                    { val:"debit",  label:"Deduct / Debit (\u2212)", icon:<MinusCircle size={13}/>, c:"#ef4444" },
                  ].map(opt=>(
                    <button key={opt.val} type="button" onClick={()=>setAdjustType(opt.val)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"0.5rem", borderRadius:9, fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${adjustType===opt.val?opt.c:"var(--admin-card-border)"}`, background:adjustType===opt.val?`${opt.c}15`:"transparent", color:adjustType===opt.val?opt.c:"var(--admin-text-muted)" }}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:"0.74rem", fontWeight:700, color:"var(--admin-text-secondary)", marginBottom:6 }}>Credit Amount:</label>
                <input type="number" min="1" required placeholder="Enter credit amount (e.g. 500)" value={adjustAmount} onChange={e=>setAdjustAmount(e.target.value)} style={S.input}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:"0.74rem", fontWeight:700, color:"var(--admin-text-secondary)", marginBottom:6 }}>Audit Reason / Remark (Required):</label>
                <textarea required rows={2} placeholder="e.g. Granted for winning Demo Day cohort" value={adjustReason} onChange={e=>setAdjustReason(e.target.value)} style={{ ...S.input, resize:"vertical", fontWeight:400 }}/>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button type="button" disabled={submittingAdjust} onClick={()=>setShowAdjustModal(false)} style={{ ...S.ghost, flex:1, justifyContent:"center", padding:"0.52rem" }}>Cancel</button>
                <button type="submit" disabled={submittingAdjust} style={{ ...S.primary, flex:1, justifyContent:"center", padding:"0.52rem", opacity:submittingAdjust?0.7:1 }}>
                  {submittingAdjust?<><RefreshCw size={12} className="animate-spin"/>Saving...</>:"Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

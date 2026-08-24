import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../../../components/Sidebar";
import { COLORS } from "../../../components/colors";
import { Search, Plus, Trash2, X } from "lucide-react";
import { useStore } from "../../../zustand/store";
import axios from "../../../services/axios.jsx";
import { toast } from "react-toastify";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/* ─── Definition Modal ─── */
function DefinitionModal({ term, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, maxWidth: 500, width: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", color: COLORS.ink }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.primary }}>{term.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={COLORS.muted} /></button>
        </div>
        <p style={{ margin: 0, fontSize: 14.5, color: COLORS.textSubtle, lineHeight: 1.7 }}>{term.definition || "No definition provided."}</p>
      </div>
    </div>
  );
}

/* ─── Add Modal (text only – glossary has no file) ─── */
function AddModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ title: "", letter: "", definition: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.letter || !form.definition)
      return toast.error("All fields are required");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("type", "glossary");
      fd.append("title", form.title);
      fd.append("letter", form.letter.toUpperCase());
      fd.append("definition", form.definition);
      const res = await axios.post("/resources", fd);
      toast.success("Term added!");
      onAdded(res.data.resource);
      onClose();
    } catch { toast.error("Failed to add term"); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: 480, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", color: COLORS.ink }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>Add Glossary Term</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input placeholder="Term / Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <input placeholder="Starting Letter (A-Z) *" maxLength={1} value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value.toUpperCase() })} style={inputStyle} />
          <textarea placeholder="Definition *" value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtnStyle}>{loading ? "Adding..." : "Add Term"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: "10px 14px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-input-bg, #ffffff)", color: "var(--color-text-main, #0f172a)", fontSize: 14, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const cancelBtnStyle = { padding: "9px 22px", borderRadius: 8, border: `1px solid var(--color-border, #e5e7eb)`, background: "var(--color-card, #fff)", color: "var(--color-text-main, #0f172a)", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const submitBtnStyle = { padding: "9px 22px", borderRadius: 8, border: "none", background: COLORS.primary, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 };

export default function GlossaryPage() {
  const { user } = useStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/resources", { params: { type: "glossary", limit: 1000 } });
      setTerms(res.data.resources || []);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchTerms(); }, []);

  const filtered = useMemo(() => {
    return terms.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchLetter = !selectedLetter || t.letter === selectedLetter;
      return matchSearch && matchLetter;
    });
  }, [terms, search, selectedLetter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const l = t.letter || t.title[0]?.toUpperCase() || "#";
      if (!map[l]) map[l] = [];
      map[l].push(t);
    });
    return map;
  }, [filtered]);

  const availableLetters = Object.keys(grouped).sort();

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this term?")) return;
    try {
      await axios.delete(`/resources/${id}`);
      toast.success("Deleted");
      setTerms((prev) => prev.filter((t) => t._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-8 px-4 sm:px-6 lg:px-10 pb-10 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.ink }}>Glossary</h1>
            <div className="relative w-full sm:w-64">
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted }} />
              <input placeholder="Search for a word..." value={search} onChange={(e) => { setSearch(e.target.value); setSelectedLetter(null); }} style={{ ...inputStyle, paddingLeft: 36, width: "100%", boxSizing: "border-box" }} />
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ ...submitBtnStyle, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
              <Plus size={16} /> Add Term
            </button>
          )}
        </div>

        {/* Alphabet Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6">
          {ALPHABET.map((l) => {
            const hasEntries = availableLetters.includes(l);
            const active = selectedLetter === l;
            return (
              <button
                key={l}
                onClick={() => setSelectedLetter(active ? null : l)}
                disabled={!hasEntries}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
                  background: active ? COLORS.primary : hasEntries ? COLORS.card : "rgba(100, 116, 139, 0.12)",
                  color: active ? "#fff" : hasEntries ? COLORS.ink : COLORS.muted,
                  fontWeight: active ? 700 : 600,
                  fontSize: 12,
                  cursor: hasEntries ? "pointer" : "default",
                  boxShadow: hasEntries && !active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {l}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>Loading...</div>
        ) : availableLetters.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>No terms found.{isAdmin && " Click 'Add Term' to get started."}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {availableLetters.map((letter) => (
              <div key={letter} style={{ background: COLORS.card, borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: `1px solid ${COLORS.border}` }}>
                <h2 style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 800, color: COLORS.ink, borderBottom: `2px solid ${COLORS.border}`, paddingBottom: 8 }}>{letter}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {grouped[letter].map((t) => (
                    <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => setSelectedTerm(t)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.primary, fontWeight: 500, fontSize: 14, textAlign: "left", padding: "4px 0", flex: 1 }}>
                        {t.title}
                      </button>
                      {isAdmin && (
                        <button onClick={(e) => handleDelete(t._id, e)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 2 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedTerm && <DefinitionModal term={selectedTerm} onClose={() => setSelectedTerm(null)} />}
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdded={(r) => setTerms((prev) => [r, ...prev])} />}
    </div>
  );
}

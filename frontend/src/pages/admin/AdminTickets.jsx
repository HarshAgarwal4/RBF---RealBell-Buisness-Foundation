import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';

const statusConfig = {
    'Open': { color: '#f87171', bg: 'rgba(248,113,113,0.1)', dot: '#ef4444' },
    'In Progress': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', dot: '#f59e0b' },
    'Resolved': { color: '#34d399', bg: 'rgba(52,211,153,0.1)', dot: '#10b981' },
    'Closed': { color: '#64748b', bg: 'rgba(100,116,139,0.1)', dot: '#475569' },
};

const issueTypeColors = {
    'Technical Issue': { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    'Account Issue': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    'Payment Issue': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'Bug Report': { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    'Feature Request': { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    'Other': { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

function Badge({ color, bg, children }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '600', color, background: bg, border: `1px solid ${color}33` }}>
            {children}
        </span>
    );
}

function StatusDot({ status }) {
    const cfg = statusConfig[status] || {};
    return <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.dot || '#64748b', display: 'inline-block', marginRight: '2px' }} />;
}

function TicketDetailModal({ open, onClose, ticket, onStatusUpdate }) {
    const [newStatus, setNewStatus] = useState(ticket?.status || 'Open');
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (ticket) setNewStatus(ticket.status); }, [ticket]);
    if (!open || !ticket) return null;

    const save = async () => {
        setSaving(true);
        try {
            const r = await axios.patch(`/admin/tickets/${ticket._id}/status`, { status: newStatus });
            if (r.data.status === 1) { onStatusUpdate(ticket._id, newStatus); onClose(); }
        } catch { } finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', maxWidth: '560px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{ticket.ticket_number}</div>
                        <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '700' }}>{ticket.title}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    <Badge color={issueTypeColors[ticket.issue_type]?.color || '#94a3b8'} bg={issueTypeColors[ticket.issue_type]?.bg || 'rgba(148,163,184,0.1)'}>{ticket.issue_type}</Badge>
                    <Badge color={statusConfig[ticket.status]?.color || '#64748b'} bg={statusConfig[ticket.status]?.bg || 'rgba(100,116,139,0.1)'}><StatusDot status={ticket.status} />{ticket.status}</Badge>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.7 }}>
                    {ticket.description}
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Object.keys(statusConfig).map(s => (
                            <button key={s} onClick={() => setNewStatus(s)}
                                style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: `1px solid ${newStatus === s ? statusConfig[s].color + '55' : 'rgba(255,255,255,0.07)'}`, background: newStatus === s ? statusConfig[s].bg : 'transparent', color: newStatus === s ? statusConfig[s].color : '#64748b', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontFamily: 'inherit', cursor: 'pointer' }}>Close</button>
                    <button onClick={save} disabled={saving}
                        style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontFamily: 'inherit', fontWeight: '600', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving...' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [page, setPage] = useState(1);
    const [detailModal, setDetailModal] = useState({ open: false, ticket: null });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15, search, status: filterStatus, issue_type: filterType });
            const r = await axios.get(`/admin/tickets?${params}`);
            if (r.data.status === 1) { setTickets(r.data.tickets); setPagination(r.data.pagination); }
        } catch { }
        finally { setLoading(false); }
    }, [page, search, filterStatus, filterType]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const handleStatusUpdate = (id, newStatus) => {
        setTickets(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
        showToast(`Ticket marked as "${newStatus}"`);
    };

    const handleDelete = async (id) => {
        try {
            const r = await axios.delete(`/admin/tickets/${id}`);
            if (r.data.status === 1) { showToast('Ticket deleted'); load(); }
            else showToast(r.data.msg || 'Failed', 'error');
        } catch { showToast('Server error', 'error'); }
    };

    const tdStyle = { padding: '0.9rem 1rem', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
    const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' };

    return (
        <AdminLayout title="Tickets">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {toast && (
                <div style={{ position: 'fixed', top: '80px', right: '2rem', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: '10px', fontFamily: 'Inter,sans-serif', fontSize: '0.85rem', fontWeight: '500', background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: toast.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Support Tickets</h1>
                <p style={{ color: '#475569', fontSize: '0.85rem' }}>{pagination.total} total tickets</p>
            </div>

            {/* Status Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {Object.entries(statusConfig).map(([status, cfg]) => (
                    <div key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                        style={{ padding: '1rem', borderRadius: '12px', border: `1px solid ${filterStatus === status ? cfg.color + '55' : 'rgba(255,255,255,0.06)'}`, background: filterStatus === status ? cfg.bg : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input id="admin-tickets-search" type="text" placeholder="🔍  Search by title or ticket number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: '220px', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }} />
                <select id="admin-tickets-filter-type" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1f2e', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <option value="">All Issue Types</option>
                    {Object.keys(issueTypeColors).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>Loading tickets...</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['Ticket #', 'Title', 'Issue Type', 'Organization', 'Status', 'Created', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => {
                                const sc = statusConfig[ticket.status] || {};
                                const ic = issueTypeColors[ticket.issue_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const org = ticket.organization;
                                return (
                                    <tr key={ticket._id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background 0.15s' }}>
                                        <td style={tdStyle}><span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: '600', fontFamily: 'monospace' }}>{ticket.ticket_number}</span></td>
                                        <td style={tdStyle}><div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0', fontWeight: '500' }}>{ticket.title}</div></td>
                                        <td style={tdStyle}><Badge color={ic.color} bg={ic.bg}>{ticket.issue_type}</Badge></td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {org?.account?.image ? <img src={org.account.image} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{org?.company_name?.[0] || '?'}</div>}
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{org?.company_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}><Badge color={sc.color} bg={sc.bg}><StatusDot status={ticket.status} />{ticket.status}</Badge></td>
                                        <td style={tdStyle}>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button id={`admin-ticket-view-${ticket._id}`} onClick={() => setDetailModal({ open: true, ticket })}
                                                    style={{ padding: '0.35rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#818cf8', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    View
                                                </button>
                                                <button id={`admin-ticket-delete-${ticket._id}`} onClick={() => handleDelete(ticket._id)}
                                                    style={{ padding: '0.35rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {!loading && tickets.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#334155' }}><div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎫</div><p style={{ fontSize: '0.9rem' }}>No tickets found</p></div>}
                {pagination.pages > 1 && (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>Page {pagination.page} of {pagination.pages}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => { const p = i + 1; return <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : '#64748b', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>; })}
                        </div>
                    </div>
                )}
            </div>
            <TicketDetailModal open={detailModal.open} onClose={() => setDetailModal({ open: false, ticket: null })} ticket={detailModal.ticket} onStatusUpdate={handleStatusUpdate} />
        </AdminLayout>
    );
}

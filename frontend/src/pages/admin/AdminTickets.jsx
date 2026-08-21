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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: '600', color, background: bg, border: `1px solid ${color}33` }}>
            {children}
        </span>
    );
}

function StatusDot({ status }) {
    const cfg = statusConfig[status] || {};
    return <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot || '#64748b', display: 'inline-block', marginRight: '2px' }} />;
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
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="admin-modal-box" style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.15rem' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{ticket.ticket_number}</div>
                        <h3 style={{ color: 'var(--admin-text-primary, #f1f5f9)', fontSize: '1rem', fontWeight: '700' }}>{ticket.title}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--admin-text-subtle, #475569)', fontSize: '1.1rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <Badge color={issueTypeColors[ticket.issue_type]?.color || '#94a3b8'} bg={issueTypeColors[ticket.issue_type]?.bg || 'rgba(148,163,184,0.1)'}>{ticket.issue_type}</Badge>
                    <Badge color={statusConfig[ticket.status]?.color || '#64748b'} bg={statusConfig[ticket.status]?.bg || 'rgba(100,116,139,0.1)'}><StatusDot status={ticket.status} />{ticket.status}</Badge>
                </div>
                <div style={{ background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--admin-text-muted, #94a3b8)', lineHeight: 1.6 }}>
                    {ticket.description}
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--admin-text-subtle, #64748b)', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</label>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {Object.keys(statusConfig).map(s => (
                            <button key={s} onClick={() => setNewStatus(s)}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: `1px solid ${newStatus === s ? statusConfig[s].color + '55' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`, background: newStatus === s ? statusConfig[s].bg : 'transparent', color: newStatus === s ? statusConfig[s].color : 'var(--admin-text-muted, #64748b)', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button onClick={onClose} className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: '0.55rem' }}>Close</button>
                    <button onClick={save} disabled={saving} className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '0.55rem', opacity: saving ? 0.7 : 1 }}>
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

    return (
        <AdminLayout title="Support Tickets">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {toast && (
                <div style={{ position: 'fixed', top: '70px', right: '1.5rem', zIndex: 9999, padding: '0.6rem 1.1rem', borderRadius: '8px', fontFamily: 'Inter,sans-serif', fontSize: '0.8rem', fontWeight: '500', background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: toast.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>Support Tickets</h1>
                <p style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>{pagination.total} total support inquiries</p>
            </div>

            {/* Status Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {Object.entries(statusConfig).map(([status, cfg]) => (
                    <div key={status} onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                        style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: `1px solid ${filterStatus === status ? cfg.color + '55' : 'var(--admin-border-subtle, rgba(255,255,255,0.06))'}`, background: filterStatus === status ? cfg.bg : 'var(--admin-card-bg, rgba(255,255,255,0.03))', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: cfg.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{status}</div>
                    </div>
                ))}
            </div>

            <div className="admin-filter-bar">
                <input id="admin-tickets-search" className="admin-search-input" type="text" placeholder="🔍  Search by title or ticket number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <select id="admin-tickets-filter-type" className="admin-select-input" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
                    <option value="">All Issue Types</option>
                    {Object.keys(issueTypeColors).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="admin-table-container">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>Loading tickets...</span>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>{['Ticket #', 'Title', 'Issue Type', 'Organization', 'Status', 'Created', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => {
                                const sc = statusConfig[ticket.status] || {};
                                const ic = issueTypeColors[ticket.issue_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const org = ticket.organization;
                                return (
                                    <tr key={ticket._id}>
                                        <td><span style={{ fontSize: '0.68rem', color: '#6366f1', fontWeight: '600', fontFamily: 'monospace' }}>{ticket.ticket_number}</span></td>
                                        <td><div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--admin-text-primary, #e2e8f0)', fontWeight: '500', fontSize: '0.78rem' }}>{ticket.title}</div></td>
                                        <td><Badge color={ic.color} bg={ic.bg}>{ticket.issue_type}</Badge></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                {org?.account?.image ? <img src={org.account.image} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{org?.company_name?.[0] || '?'}</div>}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, #94a3b8)' }}>{org?.company_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td><Badge color={sc.color} bg={sc.bg}><StatusDot status={ticket.status} />{ticket.status}</Badge></td>
                                        <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #94a3b8)' }}>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button id={`admin-ticket-view-${ticket._id}`} onClick={() => setDetailModal({ open: true, ticket })}
                                                    className="admin-btn admin-btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem' }}>
                                                    View
                                                </button>
                                                <button id={`admin-ticket-delete-${ticket._id}`} onClick={() => handleDelete(ticket._id)}
                                                    className="admin-btn admin-btn-danger" style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem' }}>
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
                {!loading && tickets.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--admin-text-subtle, #334155)' }}><div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎫</div><p style={{ fontSize: '0.82rem' }}>No tickets found</p></div>}
                {pagination.pages > 1 && (
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle, #475569)' }}>Page {pagination.page} of {pagination.pages}</span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => { const p = i + 1; return <button key={p} onClick={() => setPage(p)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : 'var(--admin-text-muted, #64748b)', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>; })}
                        </div>
                    </div>
                )}
            </div>
            <TicketDetailModal open={detailModal.open} onClose={() => setDetailModal({ open: false, ticket: null })} ticket={detailModal.ticket} onStatusUpdate={handleStatusUpdate} />
        </AdminLayout>
    );
}

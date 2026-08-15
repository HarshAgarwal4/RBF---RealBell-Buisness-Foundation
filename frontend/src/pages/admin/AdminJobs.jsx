import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';

const statusColors = {
    active: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    closed: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    draft: { color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

const typeColors = {
    'Full-time': { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    'Part-time': { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    'Contract': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'Internship': { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    'Freelance': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

function Badge({ color = '#6366f1', bg = 'rgba(99,102,241,0.12)', children }) {
    return (
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: '600', color, background: bg, border: `1px solid ${color}33`, textTransform: 'capitalize' }}>
            {children}
        </span>
    );
}

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
    if (!open) return null;
    return (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="admin-modal-box" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
                <h3 style={{ color: 'var(--admin-text-primary, #f1f5f9)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.35rem' }}>{title}</h3>
                <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                    <button onClick={onClose} className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>Cancel</button>
                    <button onClick={onConfirm} className="admin-btn admin-btn-danger" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>Delete Job</button>
                </div>
            </div>
        </div>
    );
}

export default function AdminJobs() {
    const [jobs, setJobs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [deleteModal, setDeleteModal] = useState({ open: false, job: null });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15, search, status: filterStatus });
            const r = await axios.get(`/admin/jobs?${params}`);
            if (r.data.status === 1) { setJobs(r.data.jobs); setPagination(r.data.pagination); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, search, filterStatus]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const handleDelete = async () => {
        try {
            const r = await axios.delete(`/admin/jobs/${deleteModal.job._id}`);
            if (r.data.status === 1) { showToast('Job deleted successfully'); setDeleteModal({ open: false, job: null }); load(); }
            else showToast(r.data.msg || 'Failed', 'error');
        } catch { showToast('Server error', 'error'); }
    };

    return (
        <AdminLayout title="Jobs">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {toast && (
                <div style={{ position: 'fixed', top: '70px', right: '1.5rem', zIndex: 9999, padding: '0.6rem 1.1rem', borderRadius: '8px', fontFamily: 'Inter,sans-serif', fontSize: '0.8rem', fontWeight: '500', background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: toast.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>Jobs Management</h1>
                    <p style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>{pagination.total} total job listings</p>
                </div>
            </div>

            <div className="admin-filter-bar">
                <input id="admin-jobs-search" className="admin-search-input" type="text" placeholder="🔍  Search by title or industry..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <select id="admin-jobs-filter-status" className="admin-select-input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            <div className="admin-table-container">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>Loading jobs...</span>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {['Job Title', 'Organization', 'Type', 'Applications', 'Status', 'Expires', 'Actions'].map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => {
                                const sc = statusColors[job.status] || {};
                                const tc = typeColors[job.employment_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const org = job.organization;
                                const orgInitials = org?.company_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                                return (
                                    <tr key={job._id}>
                                        <td>
                                            <div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--admin-text-primary, #e2e8f0)' }}>{job.title}</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle, #475569)' }}>{job.industry} · {job.workplace_type}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                {org?.account?.image
                                                    ? <img src={org.account.image} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{orgInitials}</div>
                                                }
                                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-primary, #e2e8f0)' }}>{org?.company_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td><Badge color={tc.color} bg={tc.bg}>{job.employment_type}</Badge></td>
                                        <td>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-primary, #e2e8f0)', fontWeight: '600' }}>{job.applications?.length || 0}</span>
                                            <span style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.68rem' }}> apps</span>
                                        </td>
                                        <td><Badge color={sc.color} bg={sc.bg}>{job.status}</Badge></td>
                                        <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #94a3b8)' }}>{job.expiry_date ? new Date(job.expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                                        <td>
                                            <button id={`admin-job-delete-${job._id}`} onClick={() => setDeleteModal({ open: true, job })}
                                                className="admin-btn admin-btn-danger" style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem' }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {!loading && jobs.length === 0 && (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--admin-text-subtle, #334155)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💼</div>
                        <p style={{ fontSize: '0.82rem' }}>No jobs found</p>
                    </div>
                )}
                {pagination.pages > 1 && (
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle, #475569)' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} jobs)</span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                const p = i + 1;
                                return <button key={p} onClick={() => setPage(p)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : 'var(--admin-text-muted, #64748b)', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>;
                            })}
                        </div>
                    </div>
                )}
            </div>
            <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, job: null })} onConfirm={handleDelete} title="Delete Job" message={`Delete the job "${deleteModal.job?.title}"? This action cannot be undone.`} />
        </AdminLayout>
    );
}

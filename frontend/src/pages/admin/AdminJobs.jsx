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
        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '600', color, background: bg, border: `1px solid ${color}33`, textTransform: 'capitalize' }}>
            {children}
        </span>
    );
}

function ConfirmModal({ open, onClose, onConfirm, title, message }) {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>Delete Job</button>
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
    const [expanded, setExpanded] = useState(null);

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

    const tdStyle = { padding: '0.9rem 1rem', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
    const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' };

    return (
        <AdminLayout title="Jobs">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {toast && (
                <div style={{ position: 'fixed', top: '80px', right: '2rem', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: '10px', fontFamily: 'Inter,sans-serif', fontSize: '0.85rem', fontWeight: '500', background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: toast.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Jobs Management</h1>
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>{pagination.total} total job listings</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input id="admin-jobs-search" type="text" placeholder="🔍  Search by title or industry..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: '220px', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }} />
                <select id="admin-jobs-filter-status" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1f2e', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>Loading jobs...</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Job Title', 'Organization', 'Type', 'Applications', 'Status', 'Expires', 'Actions'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
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
                                    <tr key={job._id}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        style={{ transition: 'background 0.15s' }}
                                    >
                                        <td style={tdStyle}>
                                            <div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0' }}>{job.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#334155' }}>{job.industry} · {job.workplace_type}</div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {org?.account?.image
                                                    ? <img src={org.account.image} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{orgInitials}</div>
                                                }
                                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>{org?.company_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}><Badge color={tc.color} bg={tc.bg}>{job.employment_type}</Badge></td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: '600' }}>{job.applications?.length || 0}</span>
                                            <span style={{ color: '#334155', fontSize: '0.7rem' }}> apps</span>
                                        </td>
                                        <td style={tdStyle}><Badge color={sc.color} bg={sc.bg}>{job.status}</Badge></td>
                                        <td style={tdStyle}>{job.expiry_date ? new Date(job.expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                                        <td style={tdStyle}>
                                            <button id={`admin-job-delete-${job._id}`} onClick={() => setDeleteModal({ open: true, job })}
                                                style={{ padding: '0.35rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
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
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#334155' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💼</div>
                        <p style={{ fontSize: '0.9rem' }}>No jobs found</p>
                    </div>
                )}
                {pagination.pages > 1 && (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} jobs)</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                const p = i + 1;
                                return <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : '#64748b', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>;
                            })}
                        </div>
                    </div>
                )}
            </div>
            <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, job: null })} onConfirm={handleDelete} title="Delete Job" message={`Delete the job "${deleteModal.job?.title}"? This action cannot be undone.`} />
        </AdminLayout>
    );
}

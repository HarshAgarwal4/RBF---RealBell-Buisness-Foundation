import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';
import { useStore } from '../../zustand/store.jsx';
import { isSuperAdmin, hasPermission } from '../../utils/rbac.js';

const typeColors = {
    startup: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    investor: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    mentor: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    incubator: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    accelerator: { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    'incubator/accelerator': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

function Badge({ color, bg, children }) {
    return (
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: '600', color, background: bg, border: `1px solid ${color}33`, textTransform: 'capitalize' }}>
            {children}
        </span>
    );
}

function PostModal({ open, onClose, post }) {
    if (!open || !post) return null;
    const author = post.author;
    const tc = typeColors[author?.company_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    const initials = author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    return (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="admin-modal-box" style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.15rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {author?.account?.image ? <img src={author.account.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: '700', color: '#fff' }}>{initials}</div>}
                        <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--admin-text-primary, #e2e8f0)' }}>{author?.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle, #475569)' }}>{author?.company_name}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--admin-text-subtle, #475569)', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    <Badge color={tc.color} bg={tc.bg}>{author?.company_type}</Badge>
                    {post.is_pinned && <Badge color="#fbbf24" bg="rgba(251,191,36,0.1)">📌 Pinned</Badge>}
                    <Badge color="#6366f1" bg="rgba(99,102,241,0.1)">{post.post_type}</Badge>
                </div>

                {post.content && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-primary, #cbd5e1)', lineHeight: 1.6, marginBottom: '0.85rem', background: 'var(--admin-card-bg, rgba(255,255,255,0.02))', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.05))' }}>
                        {post.content}
                    </div>
                )}

                {post.image?.url && (
                    <img src={post.image.url} alt="Post" style={{ width: '100%', borderRadius: '10px', marginBottom: '0.85rem', maxHeight: '250px', objectFit: 'cover' }} />
                )}

                {post.post_type === 'poll' && post.poll && (
                    <div style={{ marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--admin-text-primary, #e2e8f0)', marginBottom: '0.5rem' }}>{post.poll.question}</div>
                        {post.poll.options?.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.65rem', borderRadius: '6px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--admin-text-muted, #94a3b8)' }}>{opt.label}</span>
                                <span style={{ color: '#6366f1', fontWeight: '600' }}>{opt.votes?.length || 0} votes</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.72rem', color: 'var(--admin-text-subtle, #475569)', paddingTop: '0.65rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))' }}>
                    <span>❤️ {post.reactions?.length || 0} reactions</span>
                    <span>💬 {post.comments?.length || 0} comments</span>
                    <span>🏷️ {post.tags?.join(', ') || 'No tags'}</span>
                </div>
            </div>
        </div>
    );
}

export default function AdminCommunity() {
    const currentUser = useStore((s) => s.user);
    const canModerate = isSuperAdmin(currentUser) || hasPermission(currentUser, 'community.moderate');
    const canDeletePost = isSuperAdmin(currentUser) || hasPermission(currentUser, 'community.delete');

    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [page, setPage] = useState(1);
    const [viewModal, setViewModal] = useState({ open: false, post: null });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15, search, post_type: filterType });
            const r = await axios.get(`/admin/community?${params}`);
            if (r.data.status === 1) { setPosts(r.data.posts); setPagination(r.data.pagination); }
        } catch { }
        finally { setLoading(false); }
    }, [page, search, filterType]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const handleDelete = async (id) => {
        try {
            const r = await axios.delete(`/admin/community/${id}`);
            if (r.data.status === 1) { showToast('Post deleted'); setPosts(prev => prev.filter(p => p._id !== id)); setPagination(prev => ({ ...prev, total: prev.total - 1 })); }
            else showToast(r.data.msg || 'Failed', 'error');
        } catch { showToast('Server error', 'error'); }
    };

    const handlePin = async (id) => {
        try {
            const r = await axios.patch(`/admin/community/${id}/pin`);
            if (r.data.status === 1) {
                showToast(r.data.is_pinned ? 'Post pinned' : 'Post unpinned');
                setPosts(prev => prev.map(p => p._id === id ? { ...p, is_pinned: r.data.is_pinned } : p));
            } else showToast(r.data.msg || 'Failed', 'error');
        } catch { showToast('Server error', 'error'); }
    };

    return (
        <AdminLayout title="Community">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {toast && (
                <div style={{ position: 'fixed', top: '70px', right: '1.5rem', zIndex: 9999, padding: '0.6rem 1.1rem', borderRadius: '8px', fontFamily: 'Inter,sans-serif', fontSize: '0.8rem', fontWeight: '500', background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: toast.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>Community Moderation</h1>
                <p style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>{pagination.total} total posts</p>
            </div>

            <div className="admin-filter-bar">
                <input id="admin-community-search" className="admin-search-input" type="text" placeholder="🔍  Search posts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <select id="admin-community-filter-type" className="admin-select-input" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
                    <option value="">All Types</option>
                    <option value="text">Text</option>
                    <option value="poll">Poll</option>
                </select>
            </div>

            <div className="admin-table-container">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>Loading posts...</span>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>{['Author', 'Content', 'Type', 'Engagement', 'Pinned', 'Date', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {posts.map(post => {
                                const author = post.author;
                                const tc = typeColors[author?.company_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const initials = author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                                return (
                                    <tr key={post._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                {author?.account?.image ? <img src={author.account.image} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{initials}</div>}
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-text-primary, #e2e8f0)' }}>{author?.name}</div>
                                                    <Badge color={tc.color} bg={tc.bg}>{author?.company_type}</Badge>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--admin-text-muted, #94a3b8)' }}>
                                                {post.post_type === 'poll' ? `📊 ${post.poll?.question}` : (post.content || '(No text)')}
                                            </div>
                                        </td>
                                        <td><Badge color={post.post_type === 'poll' ? '#f59e0b' : '#6366f1'} bg={post.post_type === 'poll' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)'}>{post.post_type}</Badge></td>
                                        <td>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-primary, #e2e8f0)' }}>
                                                ❤️ {post.reactions?.length || 0} &nbsp; 💬 {post.comments?.length || 0}
                                            </span>
                                        </td>
                                        <td>
                                            {post.is_pinned ? <span style={{ color: '#fbbf24', fontSize: '0.72rem' }}>📌 Pinned</span> : <span style={{ color: 'var(--admin-text-subtle, #334155)', fontSize: '0.72rem' }}>—</span>}
                                        </td>
                                        <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #94a3b8)' }}>{new Date(post.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                <button id={`admin-post-view-${post._id}`} onClick={() => setViewModal({ open: true, post })}
                                                    className="admin-btn admin-btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.68rem' }}>
                                                    View
                                                </button>
                                                {canModerate && (
                                                    <button id={`admin-post-pin-${post._id}`} onClick={() => handlePin(post._id)}
                                                        className="admin-btn admin-btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.68rem', color: post.is_pinned ? '#fbbf24' : undefined }}>
                                                        {post.is_pinned ? 'Unpin' : 'Pin'}
                                                    </button>
                                                )}
                                                {canDeletePost && (
                                                    <button id={`admin-post-delete-${post._id}`} onClick={() => handleDelete(post._id)}
                                                        className="admin-btn admin-btn-danger" style={{ padding: '0.3rem 0.55rem', fontSize: '0.68rem' }}>
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {!loading && posts.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--admin-text-subtle, #334155)' }}><div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div><p style={{ fontSize: '0.82rem' }}>No posts found</p></div>}
                {pagination.pages > 1 && (
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle, #475569)' }}>Page {pagination.page} of {pagination.pages}</span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => { const p = i + 1; return <button key={p} onClick={() => setPage(p)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : 'var(--admin-text-muted, #64748b)', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>; })}
                        </div>
                    </div>
                )}
            </div>
            <PostModal open={viewModal.open} onClose={() => setViewModal({ open: false, post: null })} post={viewModal.post} />
        </AdminLayout>
    );
}

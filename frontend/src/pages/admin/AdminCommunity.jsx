import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';

const typeColors = {
    startup: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    investor: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    mentor: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'incubator/accelerator': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

function Badge({ color, bg, children }) {
    return (
        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '600', color, background: bg, border: `1px solid ${color}33`, textTransform: 'capitalize' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', maxWidth: '560px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {author?.account?.image ? <img src={author.account.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{initials}</div>}
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#e2e8f0' }}>{author?.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>{author?.company_name}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <Badge color={tc.color} bg={tc.bg}>{author?.company_type}</Badge>
                    {post.is_pinned && <Badge color="#fbbf24" bg="rgba(251,191,36,0.1)">📌 Pinned</Badge>}
                    <Badge color="#6366f1" bg="rgba(99,102,241,0.1)">{post.post_type}</Badge>
                </div>

                {post.content && (
                    <div style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {post.content}
                    </div>
                )}

                {post.image?.url && (
                    <img src={post.image.url} alt="Post" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', maxHeight: '300px', objectFit: 'cover' }} />
                )}

                {post.post_type === 'poll' && post.poll && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '0.75rem' }}>{post.poll.question}</div>
                        {post.poll.options?.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                                <span style={{ color: '#94a3b8' }}>{opt.label}</span>
                                <span style={{ color: '#6366f1', fontWeight: '600' }}>{opt.votes?.length || 0} votes</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: '#475569', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>❤️ {post.reactions?.length || 0} reactions</span>
                    <span>💬 {post.comments?.length || 0} comments</span>
                    <span>🏷️ {post.tags?.join(', ') || 'No tags'}</span>
                </div>
            </div>
        </div>
    );
}

export default function AdminCommunity() {
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

    const tdStyle = { padding: '0.9rem 1rem', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
    const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' };

    return (
        <AdminLayout title="Community">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {toast && (
                <div style={{ position: 'fixed', top: '80px', right: '2rem', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: '10px', fontFamily: 'Inter,sans-serif', fontSize: '0.85rem', fontWeight: '500', background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)', color: toast.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Community Moderation</h1>
                <p style={{ color: '#475569', fontSize: '0.85rem' }}>{pagination.total} total posts</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input id="admin-community-search" type="text" placeholder="🔍  Search posts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: '220px', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }} />
                <select id="admin-community-filter-type" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1f2e', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <option value="">All Types</option>
                    <option value="text">Text</option>
                    <option value="poll">Poll</option>
                </select>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>Loading posts...</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>{['Author', 'Content', 'Type', 'Engagement', 'Pinned', 'Date', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {posts.map(post => {
                                const author = post.author;
                                const tc = typeColors[author?.company_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const initials = author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                                return (
                                    <tr key={post._id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background 0.15s' }}>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {author?.account?.image ? <img src={author.account.image} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{initials}</div>}
                                                <div>
                                                    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#e2e8f0' }}>{author?.name}</div>
                                                    <Badge color={tc.color} bg={tc.bg}>{author?.company_type}</Badge>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                {post.post_type === 'poll' ? `📊 ${post.poll?.question}` : (post.content || '(No text)')}
                                            </div>
                                        </td>
                                        <td style={tdStyle}><Badge color={post.post_type === 'poll' ? '#f59e0b' : '#6366f1'} bg={post.post_type === 'poll' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)'}>{post.post_type}</Badge></td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
                                                ❤️ {post.reactions?.length || 0} &nbsp; 💬 {post.comments?.length || 0}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            {post.is_pinned ? <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>📌 Pinned</span> : <span style={{ color: '#334155', fontSize: '0.75rem' }}>—</span>}
                                        </td>
                                        <td style={tdStyle}>{new Date(post.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <button id={`admin-post-view-${post._id}`} onClick={() => setViewModal({ open: true, post })}
                                                    style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#818cf8', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    View
                                                </button>
                                                <button id={`admin-post-pin-${post._id}`} onClick={() => handlePin(post._id)}
                                                    style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', border: `1px solid ${post.is_pinned ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`, background: post.is_pinned ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', color: post.is_pinned ? '#fbbf24' : '#64748b', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    {post.is_pinned ? 'Unpin' : 'Pin'}
                                                </button>
                                                <button id={`admin-post-delete-${post._id}`} onClick={() => handleDelete(post._id)}
                                                    style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
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
                {!loading && posts.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#334155' }}><div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌐</div><p>No posts found</p></div>}
                {pagination.pages > 1 && (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>Page {pagination.page} of {pagination.pages}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => { const p = i + 1; return <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : '#64748b', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>; })}
                        </div>
                    </div>
                )}
            </div>
            <PostModal open={viewModal.open} onClose={() => setViewModal({ open: false, post: null })} post={viewModal.post} />
        </AdminLayout>
    );
}

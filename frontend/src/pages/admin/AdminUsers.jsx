import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';
import { useStore } from '../../zustand/store.jsx';

const typeColors = {
    startup: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    investor: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    mentor: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'incubator/accelerator': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

const roleColors = {
    normal: { color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    admin: { color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
    super_admin: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
};

function Badge({ color = '#6366f1', bg = 'rgba(99,102,241,0.12)', children }) {
    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
            fontSize: '0.7rem', fontWeight: '600', color, background: bg,
            border: `1px solid ${color}33`, textTransform: 'capitalize',
        }}>
            {children}
        </span>
    );
}

function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                padding: '2rem', maxWidth: '480px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}>
                {children}
            </div>
        </div>
    );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{danger ? '⚠️' : '❓'}</div>
                <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={{ padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none', background: danger ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function RoleModal({ open, onClose, onSave, user, currentUserRole }) {
    const [role, setRole] = useState(user?.role || 'normal');
    useEffect(() => { setRole(user?.role || 'normal'); }, [user]);
    const roles = ['normal', 'admin'];
    if (currentUserRole === 'super_admin') roles.push('super_admin');

    return (
        <Modal open={open} onClose={onClose}>
            <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>Change Role</h3>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Update role for <strong style={{ color: '#e2e8f0' }}>{user?.name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {roles.map(r => (
                    <label key={r} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.85rem 1rem', borderRadius: '10px', cursor: 'pointer',
                        border: `1px solid ${role === r ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        background: role === r ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s',
                    }}>
                        <input type="radio" checked={role === r} onChange={() => setRole(r)} style={{ accentColor: '#6366f1' }} />
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#e2e8f0', textTransform: 'capitalize' }}>
                                {r === 'super_admin' ? 'Super Admin ⭐' : r === 'admin' ? 'Admin 🛡' : 'Normal User'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                                {r === 'super_admin' ? 'Full platform control' : r === 'admin' ? 'Manage users, tickets, content' : 'Standard platform access'}
                            </div>
                        </div>
                    </label>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => onSave(role)} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontFamily: 'inherit', fontWeight: '600', cursor: 'pointer' }}>Save Role</button>
            </div>
        </Modal>
    );
}

export default function AdminUsers() {
    const currentUser = useStore(s => s.user);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [page, setPage] = useState(1);
    const [roleModal, setRoleModal] = useState({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15, search, type: filterType, role: filterRole });
            const r = await axios.get(`/admin/users?${params}`);
            if (r.data.status === 1) { setUsers(r.data.users); setPagination(r.data.pagination); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, search, filterType, filterRole]);

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

    const handleRoleSave = async (newRole) => {
        try {
            const r = await axios.patch(`/admin/users/${roleModal.user._id}/role`, { role: newRole });
            if (r.data.status === 1) { showToast(`Role updated to "${newRole}"`); setRoleModal({ open: false, user: null }); load(); }
            else showToast(r.data.msg || 'Failed', 'error');
        } catch (e) { showToast('Server error', 'error'); }
    };

    const handleDelete = async () => {
        try {
            const r = await axios.delete(`/admin/users/${deleteModal.user._id}`);
            if (r.data.status === 1) { showToast('User deleted successfully'); setDeleteModal({ open: false, user: null }); load(); }
            else showToast(r.data.msg || 'Failed', 'error');
        } catch (e) { showToast('Server error', 'error'); }
    };

    const tdStyle = { padding: '0.9rem 1rem', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
    const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' };

    return (
        <AdminLayout title="Users">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '80px', right: '2rem', zIndex: 9999,
                    padding: '0.75rem 1.25rem', borderRadius: '10px', fontFamily: 'Inter,sans-serif',
                    fontSize: '0.85rem', fontWeight: '500',
                    background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                    color: toast.type === 'error' ? '#f87171' : '#34d399',
                    border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>User Management</h1>
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>{pagination.total} total users registered</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                    id="admin-users-search"
                    type="text"
                    placeholder="🔍  Search by name, company, email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: '1', minWidth: '220px', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }}
                />
                <select id="admin-users-filter-type" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1f2e', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <option value="">All Types</option>
                    <option value="startup">Startup</option>
                    <option value="investor">Investor</option>
                    <option value="mentor">Mentor</option>
                    <option value="incubator/accelerator">Incubator / Accelerator</option>
                </select>
                <select id="admin-users-filter-role" value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                    style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: '#1a1f2e', color: '#94a3b8', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <option value="">All Roles</option>
                    <option value="normal">Normal</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>Loading users...</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['User', 'Company', 'Type', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const tc = typeColors[user.company_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const rc = roleColors[user.role] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                                const isSelf = String(currentUser?._id) === String(user._id);

                                return (
                                    <tr key={user._id}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        style={{ transition: 'background 0.15s' }}
                                    >
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                {user.account?.image
                                                    ? <img src={user.account.image} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                                }
                                                <div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0' }}>{user.name}{isSelf && <span style={{ color: '#6366f1', fontSize: '0.65rem', marginLeft: '6px' }}>(You)</span>}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#334155' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}><span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{user.company_name}</span></td>
                                        <td style={tdStyle}><Badge color={tc.color} bg={tc.bg}>{user.company_type}</Badge></td>
                                        <td style={tdStyle}><Badge color={rc.color} bg={rc.bg}>{user.role}</Badge></td>
                                        <td style={tdStyle}>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    id={`admin-user-role-${user._id}`}
                                                    disabled={isSelf}
                                                    onClick={() => setRoleModal({ open: true, user })}
                                                    style={{ padding: '0.35rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#818cf8', fontSize: '0.72rem', fontWeight: '600', cursor: isSelf ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isSelf ? 0.4 : 1 }}
                                                >
                                                    Role
                                                </button>
                                                {currentUser?.role === 'super_admin' && (
                                                    <button
                                                        id={`admin-user-delete-${user._id}`}
                                                        disabled={isSelf}
                                                        onClick={() => setDeleteModal({ open: true, user })}
                                                        style={{ padding: '0.35rem 0.75rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: '0.72rem', fontWeight: '600', cursor: isSelf ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isSelf ? 0.4 : 1 }}
                                                    >
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

                {!loading && users.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#334155' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
                        <p style={{ fontSize: '0.9rem' }}>No users found</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                            Page {pagination.page} of {pagination.pages} ({pagination.total} users)
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : '#64748b', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <RoleModal open={roleModal.open} onClose={() => setRoleModal({ open: false, user: null })} onSave={handleRoleSave} user={roleModal.user} currentUserRole={currentUser?.role} />
            <ConfirmModal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, user: null })} onConfirm={handleDelete} title="Delete User" message={`Are you sure you want to permanently delete "${deleteModal.user?.name}"? This will also delete all their jobs, tickets, and posts.`} confirmText="Delete User" danger />
        </AdminLayout>
    );
}

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

const roleColors = {
    normal: { color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    admin: { color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
    super_admin: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
};

function Badge({ color = '#6366f1', bg = 'rgba(99,102,241,0.12)', children }) {
    return (
        <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
            fontSize: '0.68rem', fontWeight: '600', color, background: bg,
            border: `1px solid ${color}33`, textTransform: 'capitalize',
        }}>
            {children}
        </span>
    );
}

function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="admin-modal-box">
                {children}
            </div>
        </div>
    );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{danger ? '⚠️' : '❓'}</div>
                <h3 style={{ color: 'var(--admin-text-primary, #f1f5f9)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.35rem' }}>{title}</h3>
                <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                    <button onClick={onClose} className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`} style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>
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
            <h3 style={{ color: 'var(--admin-text-primary, #f1f5f9)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.2rem' }}>Change Role</h3>
            <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
                Update role for <strong style={{ color: 'var(--admin-text-primary, #e2e8f0)' }}>{user?.name}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {roles.map(r => (
                    <label key={r} style={{
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                        padding: '0.75rem 0.85rem', borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${role === r ? 'rgba(99,102,241,0.4)' : 'var(--admin-border-subtle, rgba(255,255,255,0.06))'}`,
                        background: role === r ? 'rgba(99,102,241,0.08)' : 'var(--admin-card-bg, rgba(255,255,255,0.02))',
                        transition: 'all 0.15s',
                    }}>
                        <input type="radio" checked={role === r} onChange={() => setRole(r)} style={{ accentColor: '#6366f1' }} />
                        <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text-primary, #e2e8f0)', textTransform: 'capitalize' }}>
                                {r === 'super_admin' ? 'Super Admin ⭐' : r === 'admin' ? 'Admin 🛡' : 'Normal User'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle, #475569)' }}>
                                {r === 'super_admin' ? 'Full platform control' : r === 'admin' ? 'Manage users, tickets, content' : 'Standard platform access'}
                            </div>
                        </div>
                    </label>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button onClick={onClose} className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: '0.55rem' }}>Cancel</button>
                <button onClick={() => onSave(role)} className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '0.55rem' }}>Save Role</button>
            </div>
        </Modal>
    );
}

export default function AdminUsers() {
    const currentUser = useStore(s => s.user);
    const canAssignRole = isSuperAdmin(currentUser) || hasPermission(currentUser, 'users.assign_role');
    const canDeleteUser = isSuperAdmin(currentUser) || hasPermission(currentUser, 'users.delete');

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
        } catch { showToast('Server error', 'error'); }
    };

    const handleDelete = async () => {
        try {
            const r = await axios.delete(`/admin/users/${deleteModal.user._id}`);
            if (r.data.status === 1) { showToast('User deleted successfully'); setDeleteModal({ open: false, user: null }); load(); }
            else showToast(r.data.msg || 'Failed', 'error');
        } catch { showToast('Server error', 'error'); }
    };

    return (
        <AdminLayout title="Ecosystem Users">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '70px', right: '1.5rem', zIndex: 9999,
                    padding: '0.6rem 1.1rem', borderRadius: '8px', fontFamily: 'Inter,sans-serif',
                    fontSize: '0.8rem', fontWeight: '500',
                    background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                    color: toast.type === 'error' ? '#f87171' : '#34d399',
                    border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>Ecosystem User Directory</h1>
                    <p style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>{pagination.total} registered ecosystem stakeholders</p>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-filter-bar">
                <input
                    id="admin-users-search"
                    type="text"
                    className="admin-search-input"
                    placeholder="🔍  Search by name, organization, email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
                <select id="admin-users-filter-type" className="admin-select-input" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
                    <option value="">All Stakeholder Types</option>
                    <option value="startup">Startup</option>
                    <option value="investor">Investor</option>
                    <option value="mentor">Mentor</option>
                    <option value="incubator">Incubator</option>
                    <option value="accelerator">Accelerator</option>
                </select>
                <select id="admin-users-filter-role" className="admin-select-input" value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
                    <option value="">All Roles</option>
                    <option value="normal">Normal</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                </select>
            </div>

            {/* Table Container */}
            <div className="admin-table-container">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ width: '30px', height: '30px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <span style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>Loading users...</span>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {['Member', 'Organization', 'Stakeholder Type', 'Role', 'Joined Date', 'Actions'].map(h => <th key={h}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const tc = typeColors[user.company_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const rc = roleColors[user.role] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                                const isSelf = String(currentUser?._id) === String(user._id);

                                return (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                {user.account?.image
                                                    ? <img src={user.account.image} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{initials}</div>
                                                }
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--admin-text-primary, #e2e8f0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {user.name}{isSelf && <span style={{ color: '#6366f1', fontSize: '0.62rem', marginLeft: '4px' }}>(You)</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle, #475569)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span style={{ fontSize: '0.78rem', color: 'var(--admin-text-primary, #e2e8f0)' }}>{user.company_name}</span></td>
                                        <td><Badge color={tc.color} bg={tc.bg}>{user.company_type}</Badge></td>
                                        <td><Badge color={rc.color} bg={rc.bg}>{user.role}</Badge></td>
                                        <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #94a3b8)' }}>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                {canAssignRole && (
                                                    <button
                                                        id={`admin-user-role-${user._id}`}
                                                        disabled={isSelf}
                                                        onClick={() => setRoleModal({ open: true, user })}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        Assign Role
                                                    </button>
                                                )}
                                                {canDeleteUser && (
                                                    <button
                                                        id={`admin-user-delete-${user._id}`}
                                                        disabled={isSelf}
                                                        onClick={() => setDeleteModal({ open: true, user })}
                                                        className="admin-btn admin-btn-danger"
                                                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                                {!canAssignRole && !canDeleteUser && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle, #475569)' }}>—</span>
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
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--admin-text-subtle, #334155)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <p style={{ fontSize: '0.82rem' }}>No users found</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle, #475569)' }}>
                            Page {pagination.page} of {pagination.pages} ({pagination.total} users)
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#818cf8' : 'var(--admin-text-muted, #64748b)', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
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

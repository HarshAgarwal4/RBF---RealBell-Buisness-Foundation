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

const statusColors = {
    active: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    disabled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    invited: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
};

function Badge({ color = '#6366f1', bg = 'rgba(99,102,241,0.12)', children }) {
    return (
        <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
            fontSize: '0.68rem', fontWeight: '600', color, background: bg,
            border: `1px solid ${color}33`, textTransform: 'capitalize',
            whiteSpace: 'nowrap',
        }}>
            {children}
        </span>
    );
}

function Modal({ open, onClose, children, maxWidth = '540px' }) {
    if (!open) return null;
    return (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="admin-modal-box" style={{ maxWidth, width: '100%' }}>
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
            <h3 style={{ color: 'var(--admin-text-primary, #f1f5f9)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.2rem' }}>Change System Role</h3>
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

function EditUserModal({ open, onClose, onSave, user, ecosystemRoles, teams, currentUserRole }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        company_name: '',
        company_type: 'startup',
        role: 'normal',
        teamId: '',
        approvalStatus: 'Approved',
        accountStatus: 'active',
        isEmailVerified: true,
        isMobileVerified: false,
        password: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || user.phone || '',
                company_name: user.company_name || '',
                company_type: user.company_type || 'startup',
                role: user.role || 'normal',
                teamId: user.team?._id || user.team || '',
                approvalStatus: user.approvalStatus || 'Approved',
                accountStatus: user.accountStatus || 'active',
                isEmailVerified: Boolean(user.isEmailVerified),
                isMobileVerified: Boolean(user.isMobileVerified),
                password: '',
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} maxWidth="640px">
            <div style={{ borderBottom: '1px solid var(--admin-border-subtle, #e2e8f0)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--admin-text-primary, #f1f5f9)', fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
                    ✏️ Edit Ecosystem User
                </h3>
                <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.75rem', margin: '3px 0 0' }}>
                    Update account profile, stakeholder categorization, team assignment, and access status.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Full Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="admin-input"
                            placeholder="User name"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Work Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="admin-input"
                            placeholder="user@organization.com"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Organization / Company Name
                        </label>
                        <input
                            type="text"
                            value={formData.company_name}
                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                            className="admin-input"
                            placeholder="Company or entity name"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Contact Phone / Mobile
                        </label>
                        <input
                            type="text"
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                            className="admin-input"
                            placeholder="+91 9876543210"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Ecosystem Stakeholder Role *
                        </label>
                        <select
                            value={formData.company_type}
                            onChange={e => setFormData({ ...formData, company_type: e.target.value })}
                            className="admin-input"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        >
                            {ecosystemRoles.map(r => (
                                <option key={r.key} value={r.key}>
                                    {r.label} ({r.key})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Assigned Organization Team
                        </label>
                        <select
                            value={formData.teamId}
                            onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                            className="admin-input"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        >
                            <option value="">— Unassigned (General Member) —</option>
                            {teams.map(t => (
                                <option key={t._id} value={t._id}>
                                    🏢 {t.name} Team ({t.department})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            System Access Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="admin-input"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        >
                            <option value="normal">Normal User</option>
                            <option value="admin">Admin 🛡️</option>
                            {currentUserRole === 'super_admin' && (
                                <option value="super_admin">Super Admin ⭐</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Approval Status
                        </label>
                        <select
                            value={formData.approvalStatus}
                            onChange={e => setFormData({ ...formData, approvalStatus: e.target.value })}
                            className="admin-input"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        >
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending Review</option>
                            <option value="Changes Requested">Changes Requested</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                            Account Status
                        </label>
                        <select
                            value={formData.accountStatus}
                            onChange={e => setFormData({ ...formData, accountStatus: e.target.value })}
                            className="admin-input"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                        >
                            <option value="active">Active (Access Allowed)</option>
                            <option value="invited">Invited (Pending First Login)</option>
                            <option value="disabled">Disabled (Lockout)</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                {/* Verification Toggles */}
                <div style={{ display: 'flex', gap: '1.25rem', padding: '0.75rem', borderRadius: '8px', background: 'var(--admin-input-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, #e2e8f0)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', color: 'var(--admin-text-primary, #0f172a)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.isEmailVerified}
                            onChange={e => setFormData({ ...formData, isEmailVerified: e.target.checked })}
                            style={{ accentColor: '#6366f1' }}
                        />
                        Email Verified
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', color: 'var(--admin-text-primary, #0f172a)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.isMobileVerified}
                            onChange={e => setFormData({ ...formData, isMobileVerified: e.target.checked })}
                            style={{ accentColor: '#6366f1' }}
                        />
                        Mobile Verified
                    </label>
                </div>

                {/* Reset Password */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--admin-text-muted, #475569)', marginBottom: '4px' }}>
                        Set New Password (Optional)
                    </label>
                    <input
                        type="password"
                        placeholder="Leave blank to preserve current password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="admin-input"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', fontSize: '0.8rem' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--admin-border-subtle, #e2e8f0)', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={onClose} className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function AdminUsers() {
    const currentUser = useStore(s => s.user);
    const canEditUser = isSuperAdmin(currentUser) || hasPermission(currentUser, 'users.update');
    const canAssignRole = isSuperAdmin(currentUser) || hasPermission(currentUser, 'users.assign_role');
    const canDeleteUser = isSuperAdmin(currentUser) || hasPermission(currentUser, 'users.delete');

    const [users, setUsers] = useState([]);
    const [ecosystemRoles, setEcosystemRoles] = useState([]);
    const [teams, setTeams] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [page, setPage] = useState(1);

    // Modals
    const [editModal, setEditModal] = useState({ open: false, user: null });
    const [roleModal, setRoleModal] = useState({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Initial Fetch: Ecosystem Roles and Teams for Dropdowns & Forms
    useEffect(() => {
        async function fetchInitialMetadata() {
            try {
                const [rolesRes, teamsRes] = await Promise.allSettled([
                    axios.get('/roles'),
                    axios.get('/admin/teams'),
                ]);

                if (rolesRes.status === 'fulfilled' && rolesRes.value.data?.status === 1) {
                    setEcosystemRoles(rolesRes.value.data.roles || []);
                } else {
                    // Fallback to default roles
                    setEcosystemRoles([
                        { key: 'startup', label: 'Startup' },
                        { key: 'investor', label: 'Investor' },
                        { key: 'mentor', label: 'Mentor' },
                        { key: 'incubator', label: 'Incubator' },
                        { key: 'accelerator', label: 'Accelerator' },
                    ]);
                }

                if (teamsRes.status === 'fulfilled' && teamsRes.value.data?.status === 1) {
                    setTeams(teamsRes.value.data.teams || []);
                }
            } catch (err) {
                console.error('Error fetching ecosystem metadata:', err);
            }
        }
        fetchInitialMetadata();
    }, []);

    // Load users with filters & pagination
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15, search, type: filterType, role: filterRole });
            const r = await axios.get(`/admin/users?${params}`);
            if (r.data.status === 1) {
                setUsers(r.data.users || []);
                setPagination(r.data.pagination || { total: 0, page: 1, pages: 1 });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, search, filterType, filterRole]);

    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [load]);

    // Handle Edit User
    const handleEditSave = async (updatedData) => {
        try {
            const r = await axios.put(`/admin/users/${editModal.user._id}`, updatedData);
            if (r.data.status === 1) {
                showToast(`User "${r.data.user?.name || editModal.user.name}" updated successfully!`);
                setEditModal({ open: false, user: null });
                load();
            } else {
                showToast(r.data.msg || 'Failed to update user', 'error');
            }
        } catch (err) {
            console.error('Edit user error:', err);
            showToast(err.response?.data?.msg || 'Server error updating user', 'error');
        }
    };

    // Handle Quick Role Assignment
    const handleRoleSave = async (newRole) => {
        try {
            const r = await axios.patch(`/admin/users/${roleModal.user._id}/role`, { role: newRole });
            if (r.data.status === 1) {
                showToast(`Role updated to "${newRole}"`);
                setRoleModal({ open: false, user: null });
                load();
            } else {
                showToast(r.data.msg || 'Failed', 'error');
            }
        } catch {
            showToast('Server error', 'error');
        }
    };

    // Handle Delete User
    const handleDelete = async () => {
        try {
            const r = await axios.delete(`/admin/users/${deleteModal.user._id}`);
            if (r.data.status === 1) {
                showToast('User deleted successfully');
                setDeleteModal({ open: false, user: null });
                load();
            } else {
                showToast(r.data.msg || 'Failed', 'error');
            }
        } catch {
            showToast('Server error', 'error');
        }
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
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>
                        Ecosystem User Directory
                    </h1>
                    <p style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.8rem' }}>
                        {pagination.total} registered ecosystem stakeholders across {ecosystemRoles.length} ecosystem categories
                    </p>
                </div>
            </div>

            {/* Dynamic Filters Bar */}
            <div className="admin-filter-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <input
                    id="admin-users-search"
                    type="text"
                    className="admin-search-input"
                    placeholder="🔍  Search by name, organization, email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: '1 1 240px' }}
                />
                
                {/* Dynamically Fetched Ecosystem Roles Filter */}
                <select
                    id="admin-users-filter-type"
                    className="admin-select-input"
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    style={{ minWidth: '190px' }}
                >
                    <option value="">All Ecosystem Roles ({ecosystemRoles.length})</option>
                    {ecosystemRoles.map(role => (
                        <option key={role.key} value={role.key}>
                            {role.label || role.key}
                        </option>
                    ))}
                </select>

                {/* System Role Filter */}
                <select
                    id="admin-users-filter-role"
                    className="admin-select-input"
                    value={filterRole}
                    onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                    style={{ minWidth: '140px' }}
                >
                    <option value="">All System Roles</option>
                    <option value="normal">Normal User</option>
                    <option value="admin">Admin 🛡️</option>
                    <option value="super_admin">Super Admin ⭐</option>
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
                                {['Member', 'Organization', 'Ecosystem Role', 'Assigned Team', 'System Role', 'Status', 'Joined Date', 'Actions'].map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const tc = typeColors[user.company_type] || { color: '#818cf8', bg: 'rgba(99,102,241,0.1)' };
                                const rc = roleColors[user.role] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                                const sc = statusColors[user.accountStatus] || statusColors.active;
                                const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
                                const isSelf = String(currentUser?._id) === String(user._id);

                                return (
                                    <tr key={user._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                {user.account?.image ? (
                                                    <img src={user.account.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-primary, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {user.name}{isSelf && <span style={{ color: '#6366f1', fontSize: '0.65rem', marginLeft: '4px' }}>(You)</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted, #475569)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-primary, #0f172a)', fontWeight: '500' }}>
                                                {user.company_name || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <Badge color={tc.color} bg={tc.bg}>
                                                {user.company_type || 'Member'}
                                            </Badge>
                                        </td>
                                        <td>
                                            {user.team?.name ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 7px', borderRadius: '5px', fontWeight: '600' }}>
                                                    🏢 {user.team.name}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle, #64748b)' }}>— None —</span>
                                            )}
                                        </td>
                                        <td>
                                            <Badge color={rc.color} bg={rc.bg}>
                                                {user.role === 'super_admin' ? 'Super Admin ⭐' : user.role === 'admin' ? 'Admin 🛡️' : 'User'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge color={sc.color} bg={sc.bg}>
                                                {user.accountStatus || 'Active'}
                                            </Badge>
                                        </td>
                                        <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #475569)' }}>
                                            {new Date(user.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                {/* Edit User Button */}
                                                {canEditUser && (
                                                    <button
                                                        id={`admin-user-edit-${user._id}`}
                                                        onClick={() => setEditModal({ open: true, user })}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ padding: '0.28rem 0.55rem', fontSize: '0.7rem' }}
                                                        title="Update User Details"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                )}

                                                {/* Assign Role Button */}
                                                {canAssignRole && (
                                                    <button
                                                        id={`admin-user-role-${user._id}`}
                                                        disabled={isSelf}
                                                        onClick={() => setRoleModal({ open: true, user })}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ padding: '0.28rem 0.55rem', fontSize: '0.7rem', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                                        title="Change System Role"
                                                    >
                                                        🛡️ Role
                                                    </button>
                                                )}

                                                {/* Delete User Button */}
                                                {canDeleteUser && (
                                                    <button
                                                        id={`admin-user-delete-${user._id}`}
                                                        disabled={isSelf}
                                                        onClick={() => setDeleteModal({ open: true, user })}
                                                        className="admin-btn admin-btn-danger"
                                                        style={{ padding: '0.28rem 0.55rem', fontSize: '0.7rem', opacity: isSelf ? 0.4 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                                        title="Delete User"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}

                                                {!canEditUser && !canAssignRole && !canDeleteUser && (
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
                        <p style={{ fontSize: '0.82rem' }}>No users match the selected filters</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle, #475569)' }}>
                            Page {pagination.page} of {pagination.pages} ({pagination.total} users)
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${page === p ? 'rgba(99,102,241,0.4)' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`, background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent', color: page === p ? '#6366f1' : 'var(--admin-text-muted, #64748b)', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            <EditUserModal
                open={editModal.open}
                onClose={() => setEditModal({ open: false, user: null })}
                onSave={handleEditSave}
                user={editModal.user}
                ecosystemRoles={ecosystemRoles}
                teams={teams}
                currentUserRole={currentUser?.role}
            />

            {/* Quick Role Modal */}
            <RoleModal
                open={roleModal.open}
                onClose={() => setRoleModal({ open: false, user: null })}
                onSave={handleRoleSave}
                user={roleModal.user}
                currentUserRole={currentUser?.role}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, user: null })}
                onConfirm={handleDelete}
                title="Delete User"
                message={`Are you sure you want to permanently delete "${deleteModal.user?.name}"? This will also remove their associated profile and activities.`}
                confirmText="Delete User"
                danger
            />
        </AdminLayout>
    );
}

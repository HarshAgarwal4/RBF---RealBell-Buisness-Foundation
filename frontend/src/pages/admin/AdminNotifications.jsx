import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';
import { useStore } from '../../zustand/store.jsx';
import { isSuperAdmin, hasPermission } from '../../utils/rbac.js';

const typeConfig = {
    'info': { label: 'Information', icon: 'ℹ️', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
    'announcement': { label: 'Announcement', icon: '📢', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
    'success': { label: 'Success', icon: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
    'warning': { label: 'Warning', icon: '⚠️', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
    'error': { label: 'Alert / Urgent', icon: '🚨', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
};

const priorityConfig = {
    'low': { label: 'Low', color: '#94a3b8' },
    'normal': { label: 'Normal', color: '#38bdf8' },
    'high': { label: 'High', color: '#f97316' },
    'urgent': { label: 'Urgent', color: '#ef4444' },
};

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminNotifications() {
    const currentUser = useStore((s) => s.user);
    const isSuper = isSuperAdmin(currentUser);
    const canSend = isSuper || hasPermission(currentUser, 'notifications.send');
    const canDelete = isSuper || hasPermission(currentUser, 'notifications.delete');

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notifType, setNotifType] = useState('announcement');
    const [priority, setPriority] = useState('normal');
    const [actionUrl, setActionUrl] = useState('');
    const [files, setFiles] = useState([]);

    // Target Selection State
    // target_type: 'all' | 'specific_users' | 'team' | 'team_selected_users' | 'normal_users_selected' | 'organization_types'
    const [targetType, setTargetType] = useState('all');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedOrgTypes, setSelectedOrgTypes] = useState([]);

    // Directory Catalog
    const [directory, setDirectory] = useState({
        teams: [],
        teamMembers: [],
        normalUsers: [],
        organizationTypes: [],
        superAdmins: [],
        summary: { totalTeams: 0, totalTeamMembers: 0, totalNormalUsers: 0, totalSuperAdmins: 0 }
    });
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // History Log State
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({ total: 0, info: 0, announcement: 0, warning: 0, success: 0, error: 0, withAttachments: 0 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [logSearch, setLogSearch] = useState('');
    const [logFilterType, setLogFilterType] = useState('');
    const [logPage, setLogPage] = useState(1);

    // Detail & Edit Modals
    const [detailModal, setDetailModal] = useState({ open: false, notification: null });
    const [editModal, setEditModal] = useState({ open: false, notification: null, title: '', message: '', type: 'info', priority: 'normal', action_url: '', newFiles: [] });
    const [previewMedia, setPreviewMedia] = useState(null); // { type, url, name }
    const [toast, setToast] = useState(null);

    const fileInputRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load Recipients Directory Catalog
    const loadDirectory = useCallback(async () => {
        try {
            const res = await axios.get('/admin/recipients/directory');
            if (res.data.status === 1) {
                setDirectory({
                    teams: res.data.teams || [],
                    teamMembers: res.data.teamMembers || [],
                    normalUsers: res.data.normalUsers || [],
                    organizationTypes: res.data.organizationTypes || [],
                    superAdmins: res.data.superAdmins || [],
                    summary: res.data.summary || {}
                });
            }
        } catch (err) {
            console.error('Error loading recipients directory:', err);
        }
    }, []);

    // Load Notifications History
    const loadNotifications = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const params = new URLSearchParams({
                page: logPage,
                limit: 10,
                search: logSearch,
                type: logFilterType,
            });
            const res = await axios.get(`/admin/notifications?${params}`);
            if (res.data.status === 1) {
                setNotifications(res.data.notifications || []);
                setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Error loading notifications history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, [logPage, logSearch, logFilterType]);

    useEffect(() => {
        loadDirectory();
    }, [loadDirectory]);

    useEffect(() => {
        const t = setTimeout(loadNotifications, 250);
        return () => clearTimeout(t);
    }, [loadNotifications]);

    // Compute estimated recipient count
    const calculateRecipientCount = () => {
        switch (targetType) {
            case 'all':
                return directory.summary.totalNormalUsers + directory.summary.totalTeamMembers + directory.summary.totalSuperAdmins;
            case 'team': {
                if (!selectedTeam) return 0;
                return directory.teamMembers.filter(m => String(m.team?._id || m.team) === String(selectedTeam)).length;
            }
            case 'team_selected_users':
            case 'specific_users':
            case 'normal_users_selected':
                return selectedUserIds.length;
            case 'organization_types': {
                return selectedOrgTypes.reduce((acc, type) => {
                    const item = directory.organizationTypes.find(ot => ot.type === type);
                    return acc + (item ? item.count : 0);
                }, 0);
            }
            default:
                return 0;
        }
    };

    const recipientCount = calculateRecipientCount();

    // Toggle user ID selection
    const toggleUserId = (id) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Toggle organization type selection
    const toggleOrgType = (type) => {
        setSelectedOrgTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    // Filtered users for picker
    const getFilteredDirectoryUsers = () => {
        let pool = [];
        if (targetType === 'team_selected_users') {
            pool = selectedTeam
                ? directory.teamMembers.filter(m => String(m.team?._id || m.team) === String(selectedTeam))
                : directory.teamMembers;
        } else if (targetType === 'normal_users_selected') {
            pool = directory.normalUsers;
        } else {
            pool = [...directory.normalUsers, ...directory.teamMembers, ...directory.superAdmins];
        }

        if (!userSearchQuery.trim()) return pool.slice(0, 40);
        const q = userSearchQuery.toLowerCase();
        return pool.filter(u =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.company_name && u.company_name.toLowerCase().includes(q))
        ).slice(0, 40);
    };

    // Handle File Selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    // Dispatch Notification Submit (Create)
    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            showToast('Please enter a notification title', 'error');
            return;
        }
        if (!message.trim()) {
            showToast('Please enter a notification message', 'error');
            return;
        }
        if (recipientCount === 0) {
            showToast('Please select at least one recipient or target group', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('message', message.trim());
            formData.append('type', notifType);
            formData.append('priority', priority);
            if (actionUrl.trim()) formData.append('action_url', actionUrl.trim());
            formData.append('target_type', targetType);
            if (targetType === 'team' || targetType === 'team_selected_users') {
                formData.append('target_team', selectedTeam);
            }
            formData.append('selected_user_ids', JSON.stringify(selectedUserIds));
            formData.append('organization_types', JSON.stringify(selectedOrgTypes));

            // Append files
            files.forEach(f => {
                formData.append('files', f);
            });

            const res = await axios.post('/admin/notifications/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status === 1) {
                showToast(res.data.msg || 'Notification dispatched successfully!');
                // Reset form
                setTitle('');
                setMessage('');
                setActionUrl('');
                setFiles([]);
                setSelectedUserIds([]);
                setSelectedOrgTypes([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
                loadNotifications();
            } else {
                showToast(res.data.msg || 'Failed to dispatch notification', 'error');
            }
        } catch (err) {
            console.error('Send notification error:', err);
            showToast(err.response?.data?.msg || 'Error dispatching notification', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Open Edit Modal
    const openEdit = (item) => {
        setEditModal({
            open: true,
            notification: item,
            title: item.title || '',
            message: item.message || '',
            type: item.type || 'info',
            priority: item.priority || 'normal',
            action_url: item.action_url || '',
            newFiles: [],
        });
    };

    // Submit Edit Notification
    const handleUpdateNotification = async (e) => {
        e.preventDefault();
        if (!editModal.title.trim()) {
            showToast('Notification title is required', 'error');
            return;
        }
        if (!editModal.message.trim()) {
            showToast('Notification message is required', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', editModal.title.trim());
            formData.append('message', editModal.message.trim());
            formData.append('type', editModal.type);
            formData.append('priority', editModal.priority);
            formData.append('action_url', editModal.action_url.trim() || '');

            editModal.newFiles.forEach(f => {
                formData.append('files', f);
            });

            const res = await axios.put(`/admin/notifications/${editModal.notification._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status === 1) {
                showToast('Notification updated successfully');
                setEditModal({ open: false, notification: null, title: '', message: '', type: 'info', priority: 'normal', action_url: '', newFiles: [] });
                loadNotifications();
            } else {
                showToast(res.data.msg || 'Failed to update notification', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.msg || 'Error updating notification', 'error');
        }
    };

    // Delete Notification (Delete)
    const handleDeleteNotification = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notification record?')) return;
        try {
            const res = await axios.delete(`/admin/notifications/${id}`);
            if (res.data.status === 1) {
                showToast('Notification log deleted');
                loadNotifications();
            } else {
                showToast(res.data.msg || 'Failed to delete', 'error');
            }
        } catch {
            showToast('Error deleting notification', 'error');
        }
    };

    return (
        <AdminLayout title="Notifications Hub">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '70px',
                    right: '1.5rem',
                    zIndex: 9999,
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    fontFamily: 'Inter,sans-serif',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background: toast.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
                    color: toast.type === 'error' ? '#f87171' : '#34d399',
                    border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(52,211,153,0.4)'}`,
                    boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)'
                }}>
                    {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
                </div>
            )}

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🔔 Notifications Hub</span>
                        <span style={{ fontSize: '0.65rem', background: isSuper ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(52,211,153,0.2)', color: isSuper ? '#fff' : '#34d399', border: isSuper ? 'none' : '1px solid rgba(52,211,153,0.4)', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' }}>
                            {isSuper ? 'SUPER ADMIN' : 'AUTHORIZED RBAC'}
                        </span>
                    </h1>
                    <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        Broadcast rich in-app notifications with images, PDFs, videos, and documents to specific normal users, teams, or ecosystem organization types.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={loadNotifications}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Stats Metrics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.65rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: '600', textTransform: 'uppercase' }}>Total Dispatched</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f1f5f9', marginTop: '0.2rem' }}>{stats.total}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: '600', textTransform: 'uppercase' }}>Announcements</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#a78bfa', marginTop: '0.2rem' }}>{stats.announcement}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Info & Updates</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#60a5fa', marginTop: '0.2rem' }}>{stats.info}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: '600', textTransform: 'uppercase' }}>Warnings / Alerts</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24', marginTop: '0.2rem' }}>{stats.warning}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase' }}>With Media/Files</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399', marginTop: '0.2rem' }}>{stats.withAttachments}</div>
                </div>
            </div>

            {/* Notification Composer Card (Create) */}
            <div style={{
                background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                            📢 Compose & Dispatch Notification
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                            Configure target audience, alert category, message, and file attachments (images, PDFs, videos, docs).
                        </p>
                    </div>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '99px',
                        background: recipientCount > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                        border: `1px solid ${recipientCount > 0 ? 'rgba(99,102,241,0.35)' : 'rgba(239,68,68,0.35)'}`,
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: recipientCount > 0 ? '#a5b4fc' : '#f87171'
                    }}>
                        <span>👥 Estimated Reach:</span>
                        <span>{recipientCount} recipient(s)</span>
                    </div>
                </div>

                <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Step 1: Target Audience Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                            1. Select Target Audience
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                            {[
                                { id: 'all', label: '🌐 Broadcast to All', sub: 'Every ecosystem user' },
                                { id: 'team', label: '🏢 Any Team (Whole)', sub: 'All members of a team' },
                                { id: 'team_selected_users', label: '👥 Selected Team Members', sub: 'Specific team individuals' },
                                { id: 'normal_users_selected', label: '👤 Selected Normal Users', sub: 'Specific platform users' },
                                { id: 'organization_types', label: '🏷️ By Organization Type', sub: 'Startup, Investor, etc.' },
                                { id: 'specific_users', label: '🎯 Custom Multi-Select', sub: 'Pick any arbitrary users' },
                            ].map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => {
                                        setTargetType(t.id);
                                        setSelectedUserIds([]);
                                    }}
                                    style={{
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '10px',
                                        border: `1px solid ${targetType === t.id ? '#6366f1' : 'rgba(255,255,255,0.07)'}`,
                                        background: targetType === t.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: targetType === t.id ? '#a5b4fc' : '#cbd5e1' }}>
                                        {t.label}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>
                                        {t.sub}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 1.B: Target Parameters Sub-Pickers */}
                    {(targetType === 'team' || targetType === 'team_selected_users') && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                Choose Department Team
                            </label>
                            <select
                                className="admin-select-input"
                                value={selectedTeam}
                                onChange={(e) => {
                                    setSelectedTeam(e.target.value);
                                    setSelectedUserIds([]);
                                }}
                                style={{ width: '100%', maxWidth: '380px' }}
                            >
                                <option value="">— Select Target Team —</option>
                                {directory.teams.map(team => (
                                    <option key={team._id} value={team._id}>
                                        🏢 {team.name} Team ({team.department || 'Operations'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {targetType === 'organization_types' && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                Select Organization / User Types
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {directory.organizationTypes.map(ot => {
                                    const isChecked = selectedOrgTypes.includes(ot.type);
                                    return (
                                        <button
                                            key={ot.type}
                                            type="button"
                                            onClick={() => toggleOrgType(ot.type)}
                                            style={{
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${isChecked ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                                                background: isChecked ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                                                color: isChecked ? '#a5b4fc' : '#94a3b8',
                                                fontSize: '0.74rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            <span>{isChecked ? '✓' : '+'}</span>
                                            <span style={{ textTransform: 'capitalize' }}>{ot.type}</span>
                                            <span style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '99px' }}>
                                                {ot.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(targetType === 'specific_users' || targetType === 'normal_users_selected' || (targetType === 'team_selected_users' && selectedTeam)) && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>
                                    Search & Select Users ({selectedUserIds.length} chosen)
                                </label>
                                <input
                                    type="text"
                                    placeholder="🔍 Filter by name, email, or company..."
                                    value={userSearchQuery}
                                    onChange={e => setUserSearchQuery(e.target.value)}
                                    className="admin-search-input"
                                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', minWidth: '220px' }}
                                />
                            </div>

                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.4rem', padding: '0.25rem 0' }}>
                                {getFilteredDirectoryUsers().map(user => {
                                    const isSelected = selectedUserIds.includes(user._id);
                                    return (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleUserId(user._id)}
                                            style={{
                                                padding: '0.45rem 0.65rem',
                                                borderRadius: '8px',
                                                border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                                                background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.02)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.45rem',
                                                transition: 'all 0.1s'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: isSelected ? '#fff' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {user.name}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {user.email} {user.company_type ? `• ${user.company_type}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Content & Customization */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                                Notification Title *
                            </label>
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder="e.g. System Maintenance Notice / Program Applications Open"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                                Action URL (Optional Link)
                            </label>
                            <input
                                type="text"
                                className="admin-search-input"
                                placeholder="https://example.com/program/123 or /events"
                                value={actionUrl}
                                onChange={e => setActionUrl(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                            />
                        </div>
                    </div>

                    {/* Message Textarea */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                            Notification Message Payload *
                        </label>
                        <textarea
                            className="admin-search-input"
                            rows={3}
                            placeholder="Write the notification text clearly..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            style={{ width: '100%', resize: 'vertical', fontSize: '0.82rem', padding: '0.65rem' }}
                            required
                        />
                    </div>

                    {/* File Upload Section (Images, PDFs, Videos, Documents) */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>
                                📎 Attach Files (Images, PDFs, Videos, Docs)
                            </label>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                Max 10 files (up to 50MB each)
                            </span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                            onChange={handleFileChange}
                            style={{ fontSize: '0.75rem', color: '#cbd5e1' }}
                        />

                        {/* File preview chips */}
                        {files.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                                {files.map((file, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '6px',
                                            background: 'rgba(99,102,241,0.2)',
                                            border: '1px solid rgba(99,102,241,0.4)',
                                            fontSize: '0.72rem',
                                            color: '#cbd5e1'
                                        }}
                                    >
                                        <span>📎 {file.name}</span>
                                        <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>({formatBytes(file.size)})</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Step 3: Type, Priority, & Submit */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {/* Type Badges */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                Alert Type
                            </label>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {Object.entries(typeConfig).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNotifType(key)}
                                        style={{
                                            padding: '0.35rem 0.7rem',
                                            borderRadius: '7px',
                                            border: `1px solid ${notifType === key ? cfg.color : 'rgba(255,255,255,0.07)'}`,
                                            background: notifType === key ? cfg.bg : 'transparent',
                                            color: notifType === key ? cfg.color : '#94a3b8',
                                            fontSize: '0.72rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}
                                    >
                                        <span>{cfg.icon}</span>
                                        <span>{cfg.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                Priority
                            </label>
                            <select
                                className="admin-select-input"
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                            >
                                {Object.entries(priorityConfig).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="admin-btn admin-btn-primary"
                            style={{
                                padding: '0.65rem 1.85rem',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                opacity: submitting ? 0.7 : 1,
                                minWidth: '170px'
                            }}
                        >
                            {submitting ? 'Dispatching...' : '🚀 Dispatch Notification'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Notification Outbox / History Section (Read, Update, Delete) */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                    📜 Notification Dispatch Logs & History
                </h2>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search logs..."
                        value={logSearch}
                        onChange={e => { setLogSearch(e.target.value); setLogPage(1); }}
                        className="admin-search-input"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', minWidth: '180px' }}
                    />
                    <select
                        className="admin-select-input"
                        value={logFilterType}
                        onChange={e => { setLogFilterType(e.target.value); setLogPage(1); }}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                    >
                        <option value="">All Types</option>
                        {Object.entries(typeConfig).map(([k, v]) => (
                            <option key={k} value={k}>{v.icon} {v.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table of Dispatched Notifications */}
            <div className="admin-table-container">
                {loadingHistory ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Loading notifications logs...
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {['Notification Title & Type', 'Target Audience', 'Recipients', 'Attachments', 'Sent By', 'Date', 'Actions'].map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map(item => {
                                const tc = typeConfig[item.type] || typeConfig['info'];
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ maxWidth: '220px' }}>
                                                <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.title}
                                                </div>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    padding: '2px 7px',
                                                    borderRadius: '99px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: '600',
                                                    color: tc.color,
                                                    background: tc.bg,
                                                    border: `1px solid ${tc.border}`,
                                                    marginTop: '0.25rem'
                                                }}>
                                                    {tc.icon} {tc.label}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '500', textTransform: 'capitalize' }}>
                                                {item.target_type === 'team' && item.target_team?.name
                                                    ? `🏢 ${item.target_team.name} Team`
                                                    : item.target_type.replace(/_/g, ' ')}
                                            </span>
                                        </td>

                                        <td>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                padding: '2px 8px',
                                                borderRadius: '99px',
                                                background: 'rgba(99,102,241,0.15)',
                                                color: '#a5b4fc',
                                                fontWeight: '700'
                                            }}>
                                                👥 {item.recipients?.length || 0} users
                                            </span>
                                        </td>

                                        <td>
                                            {item.attachments && item.attachments.length > 0 ? (
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '99px',
                                                    background: 'rgba(52,211,153,0.12)',
                                                    color: '#34d399',
                                                    fontWeight: '600'
                                                }}>
                                                    📎 {item.attachments.length} file(s)
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>None</span>
                                            )}
                                        </td>

                                        <td>
                                            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                                {item.sent_by?.name || 'Super Admin'}
                                            </span>
                                        </td>

                                        <td style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                            {new Date(item.createdAt).toLocaleString('en-IN')}
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                <button
                                                    onClick={() => setDetailModal({ open: true, notification: item })}
                                                    className="admin-btn admin-btn-secondary"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                                                >
                                                    View
                                                </button>
                                                {canSend && (
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteNotification(item._id)}
                                                        className="admin-btn admin-btn-danger"
                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
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

                {!loadingHistory && notifications.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No notification logs found.
                    </div>
                )}
            </div>

            {/* Notification Inspection Modal (View) */}
            {detailModal.open && detailModal.notification && (
                <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModal({ open: false, notification: null })} style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 9990,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div className="admin-modal-box" style={{
                        background: 'var(--admin-modal-bg, #111420)',
                        border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '600px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase' }}>
                                    Notification Details
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                                    {detailModal.notification.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setDetailModal({ open: false, notification: null })}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '10px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {detailModal.notification.message}
                        </div>

                        {/* Attachments inside modal */}
                        {detailModal.notification.attachments && detailModal.notification.attachments.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Attached Files ({detailModal.notification.attachments.length})
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                    {detailModal.notification.attachments.map((att, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {att.file_name || 'File'}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem', fontSize: '0.65rem', color: '#64748b' }}>
                                                <span>{formatBytes(att.file_size)}</span>
                                                <a href={att.url} target="_blank" rel="noreferrer" download style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '700' }}>
                                                    Download ⬇️
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.75rem' }}>
                            <div>
                                <span style={{ color: '#64748b' }}>Target Type: </span>
                                <strong style={{ color: '#cbd5e1' }}>{detailModal.notification.target_type}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Recipients Count: </span>
                                <strong style={{ color: '#818cf8' }}>{detailModal.notification.recipients?.length || 0}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Dispatched By: </span>
                                <strong style={{ color: '#cbd5e1' }}>{detailModal.notification.sent_by?.name || 'Super Admin'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Priority: </span>
                                <strong style={{ color: '#cbd5e1' }}>{detailModal.notification.priority || 'normal'}</strong>
                            </div>
                        </div>

                        {detailModal.notification.action_url && (
                            <div>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Action Link:</span>
                                <a href={detailModal.notification.action_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                                    {detailModal.notification.action_url}
                                </a>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setDetailModal({ open: false, notification: null })}
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '0.45rem 1.1rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Edit Modal (Update) */}
            {editModal.open && editModal.notification && (
                <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setEditModal({ open: false, notification: null, title: '', message: '', type: 'info', priority: 'normal', action_url: '', newFiles: [] })} style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 9990,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <form onSubmit={handleUpdateNotification} className="admin-modal-box" style={{
                        background: 'var(--admin-modal-bg, #111420)',
                        border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '560px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f1f5f9' }}>
                                ✏️ Edit Notification Record
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditModal({ open: false, notification: null, title: '', message: '', type: 'info', priority: 'normal', action_url: '', newFiles: [] })}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.3rem' }}>Title *</label>
                            <input
                                type="text"
                                className="admin-search-input"
                                value={editModal.title}
                                onChange={e => setEditModal(prev => ({ ...prev, title: e.target.value }))}
                                style={{ width: '100%', padding: '0.5rem 0.65rem' }}
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.3rem' }}>Message Payload *</label>
                            <textarea
                                className="admin-search-input"
                                rows={4}
                                value={editModal.message}
                                onChange={e => setEditModal(prev => ({ ...prev, message: e.target.value }))}
                                style={{ width: '100%', padding: '0.5rem 0.65rem' }}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.3rem' }}>Type</label>
                                <select
                                    className="admin-select-input"
                                    value={editModal.type}
                                    onChange={e => setEditModal(prev => ({ ...prev, type: e.target.value }))}
                                    style={{ width: '100%' }}
                                >
                                    {Object.entries(typeConfig).map(([k, v]) => (
                                        <option key={k} value={k}>{v.icon} {v.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.3rem' }}>Priority</label>
                                <select
                                    className="admin-select-input"
                                    value={editModal.priority}
                                    onChange={e => setEditModal(prev => ({ ...prev, priority: e.target.value }))}
                                    style={{ width: '100%' }}
                                >
                                    {Object.entries(priorityConfig).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.3rem' }}>Action URL (Optional)</label>
                            <input
                                type="text"
                                className="admin-search-input"
                                value={editModal.action_url}
                                onChange={e => setEditModal(prev => ({ ...prev, action_url: e.target.value }))}
                                style={{ width: '100%', padding: '0.5rem 0.65rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', fontWeight: '700', marginBottom: '0.3rem' }}>Add More Attachments</label>
                            <input
                                type="file"
                                multiple
                                onChange={e => {
                                    if (e.target.files) {
                                        setEditModal(prev => ({ ...prev, newFiles: Array.from(e.target.files) }));
                                    }
                                }}
                                style={{ fontSize: '0.75rem', color: '#cbd5e1' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setEditModal({ open: false, notification: null, title: '', message: '', type: 'info', priority: 'normal', action_url: '', newFiles: [] })}
                                className="admin-btn admin-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}

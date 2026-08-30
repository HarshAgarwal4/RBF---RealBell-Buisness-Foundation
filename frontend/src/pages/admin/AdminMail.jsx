import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';
import { useStore } from '../../zustand/store.jsx';
import { isSuperAdmin, hasPermission } from '../../utils/rbac.js';

const emailTemplates = [
    {
        id: 'announcement',
        name: '📢 Ecosystem Announcement',
        subject: 'Important Announcement from RealBell Business Foundation',
        body: `Dear Partner,\n\nWe are excited to share important updates regarding our platform programs and ecosystem opportunities.\n\nPlease log in to your dashboard to explore the latest resources and connect with fellow members.\n\nWarm regards,\nRealBell Foundation Team`
    },
    {
        id: 'verification',
        name: '🔐 Profile & Account Completion',
        subject: 'Action Required: Complete Your RealBell Organization Profile',
        body: `Hello,\n\nTo ensure your organization receives optimal visibility and program eligibility, please complete all required verification steps on your RealBell profile.\n\nVisit your profile settings to update your company details.\n\nBest regards,\nRealBell Admin Team`
    },
    {
        id: 'event',
        name: '📅 Event & Workshop Invitation',
        subject: 'Exclusive Invitation: Upcoming RealBell Ecosystem Workshop',
        body: `Dear Member,\n\nYou are cordially invited to attend our upcoming live interactive session and networking workshop.\n\nCheck out the Events section on our platform for schedule details and agenda.\n\nLooking forward to seeing you there,\nRealBell Events Team`
    },
    {
        id: 'maintenance',
        name: '⚙️ Scheduled Maintenance Notice',
        subject: 'Scheduled System Maintenance Notification',
        body: `Dear Users,\n\nPlease be informed that RealBell will undergo scheduled maintenance to improve system stability and deploy new platform features.\n\nExpected downtime will be minimal. We apologize for any inconvenience.\n\nThank you for your patience,\nRealBell Technical Team`
    },
];

const statusBadgeConfig = {
    'sent': { label: 'Delivered', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', icon: '✓' },
    'partially_failed': { label: 'Partial Failure', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', icon: '⚠️' },
    'failed': { label: 'Failed', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', icon: '✕' },
};

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function AdminMail() {
    const currentUser = useStore((s) => s.user);
    const isSuper = isSuperAdmin(currentUser);
    const canSend = isSuper || hasPermission(currentUser, 'mail.send');
    const canDelete = isSuper; // Strictly Super Admin only can delete logs

    // Form State
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [customEmailsInput, setCustomEmailsInput] = useState('');
    const [files, setFiles] = useState([]);

    // Target Selection State
    // target_type: 'custom_emails' | 'specific_users' | 'team' | 'team_selected_users' | 'normal_users_selected' | 'all_users' | 'organization_types' | 'super_admins'
    const [targetType, setTargetType] = useState('custom_emails');
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

    // Outbox Logs State
    const [mailLogs, setMailLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, sent: 0, partiallyFailed: 0, failed: 0, totalDeliveredEmails: 0, withAttachments: 0 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [logSearch, setLogSearch] = useState('');
    const [logFilterStatus, setLogFilterStatus] = useState('');
    const [logPage, setLogPage] = useState(1);

    // Detail Modal & Toast
    const [detailModal, setDetailModal] = useState({ open: false, mail: null });
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

    // Load Mail Outbox Logs
    const loadMailLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const params = new URLSearchParams({
                page: logPage,
                limit: 10,
                search: logSearch,
                status: logFilterStatus,
            });
            const res = await axios.get(`/admin/mail?${params}`);
            if (res.data.status === 1) {
                setMailLogs(res.data.mailLogs || []);
                setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Error loading mail logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    }, [logPage, logSearch, logFilterStatus]);

    useEffect(() => {
        loadDirectory();
    }, [loadDirectory]);

    useEffect(() => {
        const t = setTimeout(loadMailLogs, 250);
        return () => clearTimeout(t);
    }, [loadMailLogs]);

    // Parse custom emails
    const parseCustomEmails = () => {
        return customEmailsInput
            .split(/[\n,;]+/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    };

    // Calculate total estimated email recipients
    const calculateRecipientCount = () => {
        switch (targetType) {
            case 'custom_emails':
                return parseCustomEmails().length;
            case 'all_users':
                return directory.summary.totalNormalUsers + directory.summary.totalTeamMembers + directory.summary.totalSuperAdmins;
            case 'team': {
                if (!selectedTeam) return 0;
                return directory.teamMembers.filter(m => String(m.team?._id || m.team) === String(selectedTeam)).length;
            }
            case 'team_selected_users':
            case 'specific_users':
            case 'normal_users_selected':
                return selectedUserIds.length;
            case 'super_admins':
                return directory.superAdmins.length;
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

    // Toggle user selection
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

    // Apply quick template
    const handleApplyTemplate = (tpl) => {
        setSubject(tpl.subject);
        setBody(tpl.body);
        showToast(`Applied template: "${tpl.name}"`);
    };

    // File selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    // Dispatch Email Submit
    const handleSendMail = async (e) => {
        e.preventDefault();
        if (!subject.trim()) {
            showToast('Please enter an email subject', 'error');
            return;
        }
        if (!body.trim()) {
            showToast('Please enter an email message body', 'error');
            return;
        }
        if (recipientCount === 0) {
            showToast('Please specify at least one valid recipient email address or target group', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('subject', subject.trim());
            formData.append('body', body.trim());
            formData.append('target_type', targetType);
            if (targetType === 'team' || targetType === 'team_selected_users') {
                formData.append('target_team', selectedTeam);
            }
            formData.append('selected_user_ids', JSON.stringify(selectedUserIds));
            formData.append('organization_types', JSON.stringify(selectedOrgTypes));
            if (targetType === 'custom_emails') {
                formData.append('custom_emails', JSON.stringify(parseCustomEmails()));
            }

            // Append attached files (images, docs, pdfs, videos)
            files.forEach(f => {
                formData.append('files', f);
            });

            const res = await axios.post('/admin/mail/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status === 1) {
                showToast(res.data.msg || 'Emails dispatched successfully!');
                // Reset form
                setSubject('');
                setBody('');
                setCustomEmailsInput('');
                setFiles([]);
                setSelectedUserIds([]);
                setSelectedOrgTypes([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
                loadMailLogs();
            } else {
                showToast(res.data.msg || 'Failed to dispatch emails', 'error');
            }
        } catch (err) {
            console.error('Send mail error:', err);
            showToast(err.response?.data?.msg || 'Error dispatching emails', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Mail Log
    const handleDeleteMailLog = async (id) => {
        if (!window.confirm('Are you sure you want to delete this mail dispatch record?')) return;
        try {
            const res = await axios.delete(`/admin/mail/${id}`);
            if (res.data.status === 1) {
                showToast('Mail log deleted');
                loadMailLogs();
            } else {
                showToast(res.data.msg || 'Failed to delete', 'error');
            }
        } catch {
            showToast('Error deleting mail log', 'error');
        }
    };

    return (
        <AdminLayout title="Mail Dispatcher">
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
                        <span>📧 Mail Dispatcher</span>
                        <span style={{ fontSize: '0.65rem', background: isSuper ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(52,211,153,0.2)', color: isSuper ? '#fff' : '#34d399', border: isSuper ? 'none' : '1px solid rgba(52,211,153,0.4)', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' }}>
                            {isSuper ? 'SUPER ADMIN' : 'AUTHORIZED RBAC'}
                        </span>
                    </h1>
                    <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        Compose and dispatch official emails with attachments (images, PDFs, documents, videos) to team members, normal users, organization types, or custom email lists.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={loadMailLogs}
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
                    <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: '600', textTransform: 'uppercase' }}>Mail Dispatches</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f1f5f9', marginTop: '0.2rem' }}>{stats.total}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase' }}>Total Delivered</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399', marginTop: '0.2rem' }}>{stats.totalDeliveredEmails}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: '600', textTransform: 'uppercase' }}>Successful Batches</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.2rem' }}>{stats.sent}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: '600', textTransform: 'uppercase' }}>With Files</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24', marginTop: '0.2rem' }}>{stats.withAttachments || 0}</div>
                </div>
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>Failed Batches</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f87171', marginTop: '0.2rem' }}>{stats.failed}</div>
                </div>
            </div>

            {/* Email Composer Card */}
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
                            ✉️ Compose & Send Email
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                            Target arbitrary recipients, teams, normal users, or segment by organization type with file attachments.
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
                        <span>👥 Recipient Count:</span>
                        <span>{recipientCount} email(s)</span>
                    </div>
                </div>

                {/* Quick Templates Bar */}
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Quick Templates
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {emailTemplates.map(tpl => (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => handleApplyTemplate(tpl)}
                                style={{
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: '#cbd5e1',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.1s'
                                }}
                            >
                                {tpl.name}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSendMail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Step 1: Target Audience Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                            1. Select Email Recipients
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem' }}>
                            {[
                                { id: 'custom_emails', label: '✉️ Custom Email(s)', sub: 'Arbitrary email addresses' },
                                { id: 'specific_users', label: '👤 Specific User(s)', sub: 'Any team member or user' },
                                { id: 'team', label: '🏢 Whole Team', sub: 'All members of a team' },
                                { id: 'team_selected_users', label: '👥 Selected Team Members', sub: 'Specific team individuals' },
                                { id: 'normal_users_selected', label: '👥 Selected Normal Users', sub: 'Platform normal users' },
                                { id: 'organization_types', label: '🏷️ By Organization Type', sub: 'Startup, Investor, etc.' },
                                { id: 'super_admins', label: '👑 All Super Admins', sub: 'Leadership administrators' },
                                { id: 'all_users', label: '🌐 All Ecosystem Users', sub: 'Global platform broadcast' },
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

                    {/* Step 1.B: Target Parameters Pickers */}
                    {targetType === 'custom_emails' && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                Enter Recipient Emails (comma, semicolon, or line-separated)
                            </label>
                            <textarea
                                className="admin-search-input"
                                rows={2}
                                placeholder="e.g. john@example.com, sara@investor.io, founder@startup.co"
                                value={customEmailsInput}
                                onChange={e => setCustomEmailsInput(e.target.value)}
                                style={{ width: '100%', resize: 'vertical', fontSize: '0.8rem', padding: '0.6rem' }}
                            />
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.3rem' }}>
                                Valid emails detected: <strong>{parseCustomEmails().length}</strong>
                            </div>
                        </div>
                    )}

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
                                Select Organization / User Categories
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

                    {/* Step 2: Subject & Body */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                            Email Subject *
                        </label>
                        <input
                            type="text"
                            className="admin-search-input"
                            placeholder="e.g. Official Update: Platform Acceleration Cohort Announcement"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                            Email Message Body *
                        </label>
                        <textarea
                            className="admin-search-input"
                            rows={6}
                            placeholder="Write your email content here (supports multi-line paragraphs, bullet points, and links)..."
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            style={{ width: '100%', resize: 'vertical', fontSize: '0.82rem', padding: '0.75rem', lineHeight: 1.6 }}
                            required
                        />
                    </div>

                    {/* File Upload Section for Email Attachments */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>
                                📎 Attach Files (Images, PDFs, Videos, Documents)
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

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="admin-btn admin-btn-primary"
                            style={{
                                padding: '0.7rem 2.25rem',
                                fontSize: '0.84rem',
                                fontWeight: '700',
                                opacity: submitting ? 0.7 : 1,
                                minWidth: '180px'
                            }}
                        >
                            {submitting ? 'Sending Emails...' : '✉️ Send Emails'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Mail Outbox / History Section */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                    📬 Email Outbox & Dispatch Logs
                </h2>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search mail logs..."
                        value={logSearch}
                        onChange={e => { setLogSearch(e.target.value); setLogPage(1); }}
                        className="admin-search-input"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', minWidth: '180px' }}
                    />
                    <select
                        className="admin-select-input"
                        value={logFilterStatus}
                        onChange={e => { setLogFilterStatus(e.target.value); setLogPage(1); }}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="sent">Delivered</option>
                        <option value="partially_failed">Partially Failed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Table of Dispatched Emails */}
            <div className="admin-table-container">
                {loadingLogs ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        Loading email outbox logs...
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {['Subject & Preview', 'Target Audience', 'Recipients Count', 'Attachments', 'Delivery Status', 'Dispatched By', 'Date', 'Actions'].map(h => (
                                    <th key={h}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mailLogs.map(item => {
                                const sc = statusBadgeConfig[item.status] || statusBadgeConfig['sent'];
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ maxWidth: '240px' }}>
                                                <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.subject}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                                                    {item.body}
                                                </div>
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
                                                ✉️ {item.recipient_emails?.length || item.recipients?.length || 0} emails
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
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                padding: '2px 7px',
                                                borderRadius: '99px',
                                                fontSize: '0.65rem',
                                                fontWeight: '600',
                                                color: sc.color,
                                                background: sc.bg,
                                                border: `1px solid ${sc.border}`
                                            }}>
                                                {sc.icon} {item.success_count} sent {item.fail_count > 0 ? `(${item.fail_count} failed)` : ''}
                                            </span>
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
                                                    onClick={() => setDetailModal({ open: true, mail: item })}
                                                    className="admin-btn admin-btn-secondary"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                                                >
                                                    View
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteMailLog(item._id)}
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

                {!loadingLogs && mailLogs.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No email dispatch records found.
                    </div>
                )}
            </div>

            {/* Email Inspection Modal */}
            {detailModal.open && detailModal.mail && (
                <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setDetailModal({ open: false, mail: null })} style={{
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
                        maxWidth: '620px',
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
                                    Email Dispatch Inspection
                                </span>
                                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                                    {detailModal.mail.subject}
                                </h3>
                            </div>
                            <button
                                onClick={() => setDetailModal({ open: false, mail: null })}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.9rem', borderRadius: '10px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {detailModal.mail.body}
                        </div>

                        {/* Attachments inside modal */}
                        {detailModal.mail.attachments && detailModal.mail.attachments.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Attached Files ({detailModal.mail.attachments.length})
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                    {detailModal.mail.attachments.map((att, idx) => (
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
                                <strong style={{ color: '#cbd5e1' }}>{detailModal.mail.target_type}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Successful Deliveries: </span>
                                <strong style={{ color: '#34d399' }}>{detailModal.mail.success_count || 0}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Dispatched By: </span>
                                <strong style={{ color: '#cbd5e1' }}>{detailModal.mail.sent_by?.name || 'Super Admin'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Failed Deliveries: </span>
                                <strong style={{ color: detailModal.mail.fail_count > 0 ? '#f87171' : '#64748b' }}>{detailModal.mail.fail_count || 0}</strong>
                            </div>
                        </div>

                        {/* Recipient list */}
                        {detailModal.mail.recipient_emails && detailModal.mail.recipient_emails.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.3rem' }}>
                                    Recipients ({detailModal.mail.recipient_emails.length})
                                </div>
                                <div style={{ maxHeight: '100px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {detailModal.mail.recipient_emails.map((email, idx) => (
                                        <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                                            {email}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setDetailModal({ open: false, mail: null })}
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '0.45rem 1.1rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

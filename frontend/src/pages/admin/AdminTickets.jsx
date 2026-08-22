import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';
import { useStore } from '../../zustand/store.jsx';
import { isSuperAdmin, hasPermission } from '../../utils/rbac.js';

const statusConfig = {
    'Open': { color: '#f87171', bg: 'rgba(248,113,113,0.1)', dot: '#ef4444' },
    'In Progress': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', dot: '#f59e0b' },
    'Resolved': { color: '#34d399', bg: 'rgba(52,211,153,0.1)', dot: '#10b981' },
    'Closed': { color: '#64748b', bg: 'rgba(100,116,139,0.1)', dot: '#475569' },
};

const priorityConfig = {
    'Urgent': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🔥' },
    'High': { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '⚠️' },
    'Medium': { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', icon: '⚡' },
    'Low': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: '🔹' },
};

const issueTypeColors = {
    'Technical Issue': { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    'Account Issue': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    'Payment Issue': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    'Bug Report': { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    'Feature Request': { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    'Other': { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

function Badge({ color, bg, border, children, style = {} }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '99px',
            fontSize: '0.68rem',
            fontWeight: '600',
            color,
            background: bg,
            border: border ? `1px solid ${border}` : `1px solid ${color}33`,
            whiteSpace: 'nowrap',
            ...style
        }}>
            {children}
        </span>
    );
}

function StatusDot({ status }) {
    const cfg = statusConfig[status] || {};
    return <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot || '#64748b', display: 'inline-block', marginRight: '3px' }} />;
}

function PriorityBadge({ priority = 'Medium' }) {
    const cfg = priorityConfig[priority] || priorityConfig['Medium'];
    return (
        <Badge color={cfg.color} bg={cfg.bg} border={cfg.border}>
            <span>{cfg.icon}</span>
            <span>{priority}</span>
        </Badge>
    );
}

/* =========================================================================
   COMPREHENSIVE TICKET DETAIL & FORWARD / ASSIGN MODAL
   ========================================================================= */
function TicketDetailModal({
    open,
    onClose,
    ticket,
    onTicketUpdated,
    canAssign,
    assignableTeams = [],
    assignableAdmins = [],
    initialTab = 'details'
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [forwardNote, setForwardNote] = useState('');
    const [internalNoteInput, setInternalNoteInput] = useState('');
    const [submittingAssign, setSubmittingAssign] = useState(false);
    const [submittingStatus, setSubmittingStatus] = useState(false);
    const [submittingNote, setSubmittingNote] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);

    useEffect(() => {
        if (ticket) {
            setStatus(ticket.status || 'Open');
            setPriority(ticket.priority || 'Medium');
            setSelectedTeam(ticket.assigned_team?._id || ticket.assigned_team || '');
            setSelectedUser(ticket.assigned_to?._id || ticket.assigned_to || '');
            setForwardNote('');
            setInternalNoteInput('');
            setActiveTab(initialTab === 'assign' && !canAssign ? 'details' : initialTab);
            setFeedbackMsg(null);
        }
    }, [ticket, initialTab, canAssign]);

    if (!open || !ticket) return null;

    const filteredAdmins = selectedTeam
        ? assignableAdmins.filter(a => {
            const teamId = a.team?._id || a.team;
            return String(teamId) === String(selectedTeam);
        })
        : assignableAdmins;

    const showModalFeedback = (msg, type = 'success') => {
        setFeedbackMsg({ msg, type });
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const handleAssignOrForward = async (e) => {
        e?.preventDefault();
        setSubmittingAssign(true);
        try {
            const payload = {
                assigned_team: selectedTeam || null,
                assigned_to: selectedUser || null,
                note: forwardNote,
                priority: priority,
            };

            const res = await axios.patch(`/admin/tickets/${ticket._id}/assign`, payload);
            if (res.data.status === 1) {
                showModalFeedback(res.data.msg || 'Ticket assigned successfully');
                onTicketUpdated(res.data.ticket);
                setForwardNote('');
            } else {
                showModalFeedback(res.data.msg || 'Failed to assign ticket', 'error');
            }
        } catch (err) {
            console.error('Assign ticket error:', err);
            showModalFeedback(err.response?.data?.msg || 'Error assigning ticket', 'error');
        } finally {
            setSubmittingAssign(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setSubmittingStatus(true);
        try {
            const res = await axios.patch(`/admin/tickets/${ticket._id}/status`, { status: newStatus, priority });
            if (res.data.status === 1) {
                setStatus(newStatus);
                showModalFeedback(`Ticket status marked as "${newStatus}"`);
                onTicketUpdated(res.data.ticket);
            } else {
                showModalFeedback(res.data.msg || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error('Update status error:', err);
            showModalFeedback('Error updating status', 'error');
        } finally {
            setSubmittingStatus(false);
        }
    };

    const handleAddInternalNote = async (e) => {
        e?.preventDefault();
        if (!internalNoteInput.trim()) return;
        setSubmittingNote(true);
        try {
            const res = await axios.post(`/admin/tickets/${ticket._id}/notes`, { message: internalNoteInput.trim() });
            if (res.data.status === 1) {
                setInternalNoteInput('');
                showModalFeedback('Internal note added successfully');
                onTicketUpdated(res.data.ticket);
            } else {
                showModalFeedback(res.data.msg || 'Failed to add note', 'error');
            }
        } catch (err) {
            console.error('Add note error:', err);
            showModalFeedback('Error adding note', 'error');
        } finally {
            setSubmittingNote(false);
        }
    };

    const org = ticket.organization || {};
    const assignedTeamObj = ticket.assigned_team && typeof ticket.assigned_team === 'object' ? ticket.assigned_team : null;
    const assignedUserObj = ticket.assigned_to && typeof ticket.assigned_to === 'object' ? ticket.assigned_to : null;

    const modalTabs = [
        { id: 'details', label: '📋 Ticket Overview' },
        ...(canAssign ? [{ id: 'assign', label: '🔄 Assign & Forward', badge: assignedUserObj?.name || assignedTeamObj?.name ? 'Assigned' : 'Unassigned' }] : []),
        { id: 'history', label: '📜 Routing Trail', count: ticket.assignment_history?.length || 0 },
        { id: 'notes', label: '💬 Staff Notes', count: ticket.internal_notes?.length || 0 },
    ];

    return (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{
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
                maxWidth: '740px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.07))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '700', fontFamily: 'monospace' }}>
                                🎫 {ticket.ticket_number}
                            </span>
                            <Badge
                                color={issueTypeColors[ticket.issue_type]?.color || '#94a3b8'}
                                bg={issueTypeColors[ticket.issue_type]?.bg || 'rgba(148,163,184,0.1)'}
                            >
                                {ticket.issue_type}
                            </Badge>
                            <PriorityBadge priority={ticket.priority || 'Medium'} />
                            <Badge
                                color={statusConfig[ticket.status]?.color || '#64748b'}
                                bg={statusConfig[ticket.status]?.bg || 'rgba(100,116,139,0.1)'}
                            >
                                <StatusDot status={ticket.status} />
                                {ticket.status}
                            </Badge>
                        </div>
                        <h2 style={{
                            color: 'var(--admin-text-primary, #f1f5f9)',
                            fontSize: '1.15rem',
                            fontWeight: '700',
                            margin: 0,
                            lineHeight: 1.3
                        }}>
                            {ticket.title}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'var(--admin-text-muted, #94a3b8)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {feedbackMsg && (
                    <div style={{
                        padding: '0.6rem 1.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: feedbackMsg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                        color: feedbackMsg.type === 'error' ? '#f87171' : '#34d399',
                        borderBottom: `1px solid ${feedbackMsg.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {feedbackMsg.type === 'error' ? '⚠️' : '✓'} {feedbackMsg.msg}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.07))',
                    padding: '0 1.5rem',
                    background: 'rgba(0,0,0,0.1)',
                    gap: '0.25rem'
                }}>
                    {modalTabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                                color: activeTab === t.id ? '#818cf8' : 'var(--admin-text-muted, #94a3b8)',
                                fontSize: '0.78rem',
                                fontWeight: activeTab === t.id ? '700' : '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                transition: 'all 0.15s'
                            }}
                        >
                            {t.label}
                            {t.badge && (
                                <span style={{
                                    fontSize: '0.62rem',
                                    padding: '1px 6px',
                                    borderRadius: '99px',
                                    background: t.badge === 'Assigned' ? 'rgba(56,189,248,0.15)' : 'rgba(248,113,113,0.15)',
                                    color: t.badge === 'Assigned' ? '#38bdf8' : '#f87171',
                                    fontWeight: '600'
                                }}>
                                    {t.badge}
                                </span>
                            )}
                            {t.count > 0 && (
                                <span style={{
                                    fontSize: '0.62rem',
                                    padding: '1px 6px',
                                    borderRadius: '99px',
                                    background: 'rgba(99,102,241,0.2)',
                                    color: '#a5b4fc',
                                    fontWeight: '700'
                                }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {activeTab === 'details' && (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '0.85rem'
                            }}>
                                <div style={{
                                    background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                                    border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                                    borderRadius: '10px',
                                    padding: '0.85rem'
                                }}>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                        Requester / Customer
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {org.account?.image ? (
                                            <img src={org.account.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>
                                                {org.name?.[0] || 'U'}
                                            </div>
                                        )}
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text-primary, #f1f5f9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {org.name || 'Anonymous User'}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #94a3b8)' }}>
                                                {org.company_name ? `${org.company_name} • ` : ''}{org.email || 'No email provided'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                                    border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                                    borderRadius: '10px',
                                    padding: '0.85rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                            Current Assignment
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {assignedTeamObj ? (
                                                <Badge color="#38bdf8" bg="rgba(56,189,248,0.12)" border="rgba(56,189,248,0.3)">
                                                    🏢 {assignedTeamObj.name} Team
                                                </Badge>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>No Team Assigned</span>
                                            )}

                                            {assignedUserObj ? (
                                                <Badge color="#a78bfa" bg="rgba(167,139,250,0.12)" border="rgba(167,139,250,0.3)">
                                                    👤 {assignedUserObj.name}
                                                </Badge>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>• Shared Team Queue</span>
                                            )}
                                        </div>
                                    </div>

                                    {canAssign && (
                                        <button
                                            onClick={() => setActiveTab('assign')}
                                            style={{
                                                marginTop: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#818cf8',
                                                fontSize: '0.72rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                padding: 0
                                            }}
                                        >
                                            Forward or Reassign Ticket →
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                                    Issue Description
                                </label>
                                <div style={{
                                    background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                                    border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    fontSize: '0.82rem',
                                    color: 'var(--admin-text-primary, #cbd5e1)',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {ticket.description}
                                </div>
                            </div>

                            <div style={{
                                borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                                paddingTop: '1rem',
                                marginTop: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                        Update Ticket Status
                                    </label>
                                    <span style={{ fontSize: '0.68rem', color: '#34d399' }}>
                                        ✓ Status updates enabled for all staff
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {Object.keys(statusConfig).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusUpdate(s)}
                                            disabled={submittingStatus}
                                            style={{
                                                padding: '0.4rem 0.85rem',
                                                borderRadius: '7px',
                                                border: `1px solid ${status === s ? statusConfig[s].color + '66' : 'var(--admin-border-subtle, rgba(255,255,255,0.08))'}`,
                                                background: status === s ? statusConfig[s].bg : 'transparent',
                                                color: status === s ? statusConfig[s].color : 'var(--admin-text-muted, #64748b)',
                                                fontSize: '0.74rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            <StatusDot status={s} />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'assign' && canAssign && (
                        <form onSubmit={handleAssignOrForward} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{
                                background: 'rgba(99,102,241,0.06)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '10px',
                                padding: '0.9rem',
                                fontSize: '0.78rem',
                                color: '#cbd5e1',
                                lineHeight: 1.5
                            }}>
                                <strong style={{ color: '#818cf8' }}>💡 Team & Member Routing:</strong>
                                <p style={{ margin: '0.3rem 0 0', color: 'var(--admin-text-muted, #94a3b8)' }}>
                                    Assign this ticket to an entire department team or forward it directly to a specific team member. All routing steps and handover notes are permanently recorded in the ticket history.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                        Target Team / Department
                                    </label>
                                    <select
                                        className="admin-select-input"
                                        value={selectedTeam}
                                        onChange={(e) => {
                                            setSelectedTeam(e.target.value);
                                            if (e.target.value) {
                                                const matches = assignableAdmins.filter(a => String(a.team?._id || a.team) === String(e.target.value));
                                                if (selectedUser && !matches.some(m => String(m._id) === String(selectedUser))) {
                                                    setSelectedUser('');
                                                }
                                            }
                                        }}
                                        style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8rem' }}
                                    >
                                        <option value="">— Unassigned Team (General Queue) —</option>
                                        {assignableTeams.map(t => (
                                            <option key={t._id} value={t._id}>
                                                🏢 {t.name} Team ({t.department || 'Operations'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                        Target Staff Member
                                    </label>
                                    <select
                                        className="admin-select-input"
                                        value={selectedUser}
                                        onChange={(e) => {
                                            setSelectedUser(e.target.value);
                                            if (e.target.value) {
                                                const u = assignableAdmins.find(a => String(a._id) === String(e.target.value));
                                                if (u?.team?._id && !selectedTeam) {
                                                    setSelectedTeam(u.team._id);
                                                }
                                            }
                                        }}
                                        style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8rem' }}
                                    >
                                        <option value="">— Anyone on the Team (Shared Queue) —</option>
                                        {filteredAdmins.map(a => (
                                            <option key={a._id} value={a._id}>
                                                👤 {a.name} ({a.email}) {a.team?.name ? `[${a.team.name}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Priority Selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                    Ticket Priority
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {Object.keys(priorityConfig).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            style={{
                                                padding: '0.45rem 0.9rem',
                                                borderRadius: '7px',
                                                border: `1px solid ${priority === p ? priorityConfig[p].color : 'rgba(255,255,255,0.08)'}`,
                                                background: priority === p ? priorityConfig[p].bg : 'transparent',
                                                color: priority === p ? priorityConfig[p].color : 'var(--admin-text-muted, #94a3b8)',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            <span>{priorityConfig[p].icon}</span>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Forwarding Note / Reason */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                    Forwarding / Handover Reason Note
                                </label>
                                <textarea
                                    className="admin-search-input"
                                    rows={3}
                                    placeholder="Explain why this ticket is being forwarded, instructions for the assignee, or relevant context..."
                                    value={forwardNote}
                                    onChange={(e) => setForwardNote(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', fontSize: '0.8rem', padding: '0.65rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ padding: '0.55rem 1.25rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAssign}
                                    className="admin-btn admin-btn-primary"
                                    style={{ padding: '0.55rem 1.5rem', opacity: submittingAssign ? 0.7 : 1 }}
                                >
                                    {submittingAssign ? 'Routing Ticket...' : 'Confirm Assignment / Forward'}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'history' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {(!ticket.assignment_history || ticket.assignment_history.length === 0) ? (
                                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📜</div>
                                    <p style={{ fontSize: '0.82rem' }}>No forwarding or assignment history yet</p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(99,102,241,0.2)', marginLeft: '0.5rem' }}>
                                    {ticket.assignment_history.map((hist, i) => (
                                        <div key={hist._id || i} style={{ position: 'relative', marginBottom: '1.25rem' }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: '-1.95rem',
                                                top: '0.15rem',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: hist.action === 'forwarded' ? '#f59e0b' : '#6366f1',
                                                border: '2px solid #0f1117'
                                            }} />
                                            <div style={{
                                                background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                                                border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                                                borderRadius: '10px',
                                                padding: '0.75rem 0.9rem'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-text-primary, #f1f5f9)' }}>
                                                        <span style={{ color: hist.action === 'forwarded' ? '#fbbf24' : '#818cf8', textTransform: 'capitalize' }}>
                                                            {hist.action || 'Assigned'}
                                                        </span>
                                                        {' by '}
                                                        <span style={{ color: '#cbd5e1' }}>
                                                            {hist.assigned_by?.name || 'System / Admin'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(!ticket.internal_notes || ticket.internal_notes.length === 0) ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>💬</div>
                                    <p style={{ fontSize: '0.8rem' }}>No internal notes added yet. Leave a note for your team below.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {ticket.internal_notes.map((note, idx) => (
                                        <div key={note._id || idx} style={{
                                            background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                                            border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                                            borderRadius: '10px',
                                            padding: '0.75rem 0.9rem'
                                        }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-primary, #cbd5e1)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                {note.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleAddInternalNote} style={{ marginTop: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                    Post Internal Staff Note
                                </label>
                                <textarea
                                    className="admin-search-input"
                                    rows={3}
                                    placeholder="Write internal findings, resolution progress, or handover notes (visible to team admins)..."
                                    value={internalNoteInput}
                                    onChange={(e) => setInternalNoteInput(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', fontSize: '0.8rem', padding: '0.65rem', marginBottom: '0.5rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="submit"
                                        disabled={submittingNote || !internalNoteInput.trim()}
                                        className="admin-btn admin-btn-primary"
                                        style={{ padding: '0.45rem 1.25rem', opacity: submittingNote || !internalNoteInput.trim() ? 0.6 : 1 }}
                                    >
                                        {submittingNote ? 'Posting...' : 'Post Note'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '0.9rem 1.5rem',
                    borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.07))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.15)'
                }}>
                    <button onClick={onClose} className="admin-btn admin-btn-secondary" style={{ padding: '0.45rem 1.1rem' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default function AdminTickets() {
    const currentUser = useStore((s) => s.user);

    const isSuper = isSuperAdmin(currentUser);
    const canAssignTicket = isSuper; // Strictly Super Admin can forward / assign tickets
    const canDeleteTicket = isSuper || hasPermission(currentUser, 'tickets.delete');
    const hasGlobalTicketView = isSuper; // Strictly Super Admin can see global & unassigned queues

    // For team members (User B, C), default to their team queue or personal tickets
    const defaultView = isSuper ? 'all' : (currentUser?.team ? 'my_team' : 'my');
    const [currentView, setCurrentView] = useState(defaultView);

    const [tickets, setTickets] = useState([]);
    const [counts, setCounts] = useState({
        total: 0,
        myTickets: 0,
        myTeamTickets: 0,
        unassigned: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
    });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterTeam, setFilterTeam] = useState('');
    const [page, setPage] = useState(1);

    const [assignableTeams, setAssignableTeams] = useState([]);
    const [assignableAdmins, setAssignableAdmins] = useState([]);

    const [detailModal, setDetailModal] = useState({ open: false, ticket: null, initialTab: 'details' });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAssignees = useCallback(async () => {
        if (!canAssignTicket) return;
        try {
            const res = await axios.get('/admin/tickets/assignees');
            if (res.data.status === 1) {
                setAssignableTeams(res.data.teams || []);
                setAssignableAdmins(res.data.admins || []);
            }
        } catch (err) {
            console.error('Error fetching assignees:', err);
        }
    }, [canAssignTicket]);

    useEffect(() => {
        loadAssignees();
    }, [loadAssignees]);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 15,
                search,
                status: filterStatus,
                priority: filterPriority,
                issue_type: filterType,
                view: currentView,
            });

            if (filterTeam && hasGlobalTicketView) {
                params.set('assigned_team', filterTeam);
            }

            const r = await axios.get(`/admin/tickets?${params}`);
            if (r.data.status === 1) {
                setTickets(r.data.tickets || []);
                setPagination(r.data.pagination || { total: 0, page: 1, pages: 1 });
                if (r.data.counts) {
                    setCounts(r.data.counts);
                }
            }
        } catch (err) {
            console.error('Error loading tickets:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, filterStatus, filterPriority, filterType, currentView, filterTeam, hasGlobalTicketView]);

    useEffect(() => {
        const t = setTimeout(loadTickets, 250);
        return () => clearTimeout(t);
    }, [loadTickets]);

    const handleTicketUpdated = (updatedTicket) => {
        setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        if (detailModal.open && detailModal.ticket?._id === updatedTicket._id) {
            setDetailModal(prev => ({ ...prev, ticket: updatedTicket }));
        }
        loadTickets();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ticket?")) return;
        try {
            const r = await axios.delete(`/admin/tickets/${id}`);
            if (r.data.status === 1) {
                showToast('Ticket deleted successfully');
                loadTickets();
            } else {
                showToast(r.data.msg || 'Failed to delete ticket', 'error');
            }
        } catch {
            showToast('Server error while deleting ticket', 'error');
        }
    };

    const userTeamName = currentUser?.team?.name || 'My Team';

    const availableTabs = hasGlobalTicketView
        ? [
            { id: 'all', label: '🏢 All Tickets (Global)', count: counts.total },
            { id: 'my', label: '👤 My Ticket Center', count: counts.myTickets, highlight: true },
            { id: 'my_team', label: `👥 Team Center (${userTeamName})`, count: counts.myTeamTickets },
            { id: 'unassigned', label: '📥 Unassigned Queue', count: counts.unassigned, warn: counts.unassigned > 0 },
        ]
        : [
            { id: 'my_team', label: `👥 Team Center (${userTeamName})`, count: counts.myTeamTickets },
            { id: 'my', label: '👤 My Ticket Center', count: counts.myTickets, highlight: true },
        ];

    return (
        <AdminLayout title="Ticket Center">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', margin: 0 }}>
                        🎫 Support Ticket Center
                    </h1>
                    <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {canAssignTicket
                            ? "Route and forward inquiries across department teams and staff members."
                            : "Manage your assigned inquiries and collaborate on common team tickets."}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={loadTickets}
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem',
                overflowX: 'auto'
            }}>
                {availableTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setCurrentView(tab.id);
                            setPage(1);
                        }}
                        style={{
                            padding: '0.55rem 1rem',
                            borderRadius: '9px',
                            border: `1px solid ${currentView === tab.id ? 'rgba(99,102,241,0.5)' : 'var(--admin-border-subtle, rgba(255,255,255,0.07))'}`,
                            background: currentView === tab.id ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))' : 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                            color: currentView === tab.id ? '#a5b4fc' : 'var(--admin-text-muted, #94a3b8)',
                            fontSize: '0.78rem',
                            fontWeight: currentView === tab.id ? '700' : '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s'
                        }}
                    >
                        {tab.label}
                        <span style={{
                            fontSize: '0.65rem',
                            padding: '2px 7px',
                            borderRadius: '99px',
                            fontWeight: '700',
                            background: currentView === tab.id ? '#6366f1' : (tab.warn ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'),
                            color: currentView === tab.id ? '#fff' : (tab.warn ? '#f87171' : '#cbd5e1'),
                        }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.65rem',
                marginBottom: '1.25rem'
            }}>
                <div
                    onClick={() => { setFilterStatus(''); setPage(1); }}
                    style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: '10px',
                        border: `1px solid ${filterStatus === '' ? 'rgba(99,102,241,0.5)' : 'var(--admin-border-subtle, rgba(255,255,255,0.06))'}`,
                        background: filterStatus === '' ? 'rgba(99,102,241,0.1)' : 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                        cursor: 'pointer',
                        textAlign: 'center'
                    }}
                >
                    <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: '600', textTransform: 'uppercase' }}>All Statuses</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f1f5f9', marginTop: '0.2rem' }}>
                        {hasGlobalTicketView ? counts.total : (counts.myTickets + counts.myTeamTickets)}
                    </div>
                </div>

                {Object.entries(statusConfig).map(([status, cfg]) => {
                    const countKey = status === 'Open' ? 'open' : status === 'In Progress' ? 'inProgress' : status === 'Resolved' ? 'resolved' : 'closed';
                    const countVal = counts[countKey] || 0;
                    return (
                        <div
                            key={status}
                            onClick={() => { setFilterStatus(filterStatus === status ? '' : status); setPage(1); }}
                            style={{
                                padding: '0.75rem 0.9rem',
                                borderRadius: '10px',
                                border: `1px solid ${filterStatus === status ? cfg.color + '66' : 'var(--admin-border-subtle, rgba(255,255,255,0.06))'}`,
                                background: filterStatus === status ? cfg.bg : 'var(--admin-card-bg, rgba(255,255,255,0.03))',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s'
                            }}
                        >
                            <div style={{ fontSize: '0.65rem', color: cfg.color, fontWeight: '600', textTransform: 'uppercase' }}>{status}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: cfg.color, marginTop: '0.2rem' }}>{countVal}</div>
                        </div>
                    );
                })}
            </div>

            <div className="admin-filter-bar" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <input
                    className="admin-search-input"
                    type="text"
                    placeholder="🔍 Search ticket #, title, description, or requester..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 2, minWidth: '220px' }}
                />

                {hasGlobalTicketView && (
                    <select
                        className="admin-select-input"
                        value={filterTeam}
                        onChange={e => { setFilterTeam(e.target.value); setPage(1); }}
                        style={{ flex: 1, minWidth: '150px' }}
                    >
                        <option value="">🏢 All Teams</option>
                        {assignableTeams.map(t => (
                            <option key={t._id} value={t._id}>{t.name} Team</option>
                        ))}
                    </select>
                )}

                <select
                    className="admin-select-input"
                    value={filterPriority}
                    onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: '130px' }}
                >
                    <option value="">⚡ All Priorities</option>
                    {Object.keys(priorityConfig).map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                    className="admin-select-input"
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    style={{ flex: 1, minWidth: '150px' }}
                >
                    <option value="">🏷️ All Issue Types</option>
                    {Object.keys(issueTypeColors).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {['Ticket # & Priority', 'Title & Type', 'Requester', 'Assigned Team', 'Assigned Staff', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(ticket => (
                            <tr key={ticket._id}>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '700' }}>{ticket.ticket_number}</span>
                                        <PriorityBadge priority={ticket.priority || 'Medium'} />
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{ticket.title}</div>
                                    <Badge color={issueTypeColors[ticket.issue_type]?.color} bg={issueTypeColors[ticket.issue_type]?.bg}>{ticket.issue_type}</Badge>
                                </td>
                                <td style={{ fontSize: '0.75rem' }}>{ticket.organization?.name || 'Anonymous'}</td>
                                <td>{ticket.assigned_team?.name || 'Unassigned'}</td>
                                <td style={{ fontSize: '0.75rem' }}>{ticket.assigned_to?.name || 'Queue'}</td>
                                <td><Badge color={statusConfig[ticket.status]?.color} bg={statusConfig[ticket.status]?.bg}>{ticket.status}</Badge></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                        <button onClick={() => setDetailModal({ open: true, ticket, initialTab: 'details' })} className="admin-btn admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                                            View & Update
                                        </button>
                                        {canAssignTicket && (
                                            <button onClick={() => setDetailModal({ open: true, ticket, initialTab: 'assign' })} className="admin-btn admin-btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }}>
                                                Forward
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TicketDetailModal
                open={detailModal.open}
                onClose={() => setDetailModal({ open: false, ticket: null, initialTab: 'details' })}
                ticket={detailModal.ticket}
                onTicketUpdated={handleTicketUpdated}
                canAssign={canAssignTicket}
                assignableTeams={assignableTeams}
                assignableAdmins={assignableAdmins}
                initialTab={detailModal.initialTab}
            />
        </AdminLayout>
    );
}

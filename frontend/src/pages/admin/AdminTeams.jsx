import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { useStore } from '../../zustand/store';
import { isSuperAdmin, hasPermission } from '../../utils/rbac';
import { PERMISSION_MODULES, ALL_PERMISSIONS } from '../../config/permissions';

export default function AdminTeams() {
  const currentUser = useStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'members'

  // Data states
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  // Modals state
  const [teamModal, setTeamModal] = useState({ open: false, mode: 'create', data: null });
  const [inviteModal, setInviteModal] = useState({ open: false });
  const [assignModal, setAssignModal] = useState({ open: false, user: null });
  const [membersModal, setMembersModal] = useState({ open: false, team: null, members: [] });
  const [deleteTeamModal, setDeleteTeamModal] = useState({ open: false, team: null, reassignTo: '' });

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: '',
    department: 'Operations',
    description: '',
    status: 'active',
    permissions: ['dashboard.view'],
  });

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: 'RealBell Foundation',
    teamId: '',
    passwordMode: 'auto', // 'auto' | 'custom'
    customPassword: '',
    otp: '',
    sendInviteEmail: true,
  });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [assignForm, setAssignForm] = useState({ teamId: '', accountStatus: 'active' });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes] = await Promise.allSettled([
        axios.get('/admin/teams'),
        axios.get('/admin/users?limit=200'),
      ]);

      if (teamsRes.status === 'fulfilled' && teamsRes.value.data?.status === 1) {
        setTeams(teamsRes.value.data.teams || []);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.status === 1) {
        setUsers(usersRes.value.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching teams data:', err);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ─────────────────────────────────────────────────────────────
     TEAM & PERMISSIONS HANDLERS
  ───────────────────────────────────────────────────────────── */
  const handleOpenTeamModal = (mode, team = null) => {
    if (mode === 'edit' && team) {
      setTeamForm({
        name: team.name,
        department: team.department || 'Operations',
        description: team.description || '',
        status: team.status || 'active',
        permissions: Array.isArray(team.permissions) ? [...team.permissions] : [],
      });
      setTeamModal({ open: true, mode: 'edit', data: team });
    } else {
      setTeamForm({
        name: '',
        department: 'Operations',
        description: '',
        status: 'active',
        permissions: ['dashboard.view'],
      });
      setTeamModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleTogglePermission = (permKey) => {
    setTeamForm((prev) => {
      const perms = new Set(prev.permissions);
      const isChecking = !perms.has(permKey);

      // Find which module this permission belongs to
      const targetModule = PERMISSION_MODULES.find((m) =>
        m.permissions.some((p) => p.key === permKey)
      );
      const viewPermKey = targetModule?.permissions.find((p) => p.key.endsWith('.view'))?.key;

      if (isChecking) {
        perms.add(permKey);
        // If enabling any sub-action (create, update, delete), automatically enable viewing this module
        if (viewPermKey) {
          perms.add(viewPermKey);
        }
      } else {
        perms.delete(permKey);
        // If disabling the view permission for a module, disable all its sub-actions too
        if (viewPermKey && permKey === viewPermKey && targetModule) {
          targetModule.permissions.forEach((p) => perms.delete(p.key));
        }
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const handleToggleModulePermissions = (module) => {
    const modulePermKeys = module.permissions.map((p) => p.key);
    const hasAll = modulePermKeys.every((k) => teamForm.permissions.includes(k));

    setTeamForm((prev) => {
      const perms = new Set(prev.permissions);
      if (hasAll) {
        modulePermKeys.forEach((k) => perms.delete(k));
      } else {
        modulePermKeys.forEach((k) => perms.add(k));
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const handleSelectAllPermissions = () => {
    setTeamForm((prev) => ({ ...prev, permissions: [...ALL_PERMISSIONS] }));
  };

  const handleClearAllPermissions = () => {
    setTeamForm((prev) => ({ ...prev, permissions: [] }));
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return toast.error('Team name is required');
    if (teamForm.permissions.length === 0) {
      return toast.warning('Please select at least one permission for this team');
    }

    try {
      if (teamModal.mode === 'create') {
        const res = await axios.post('/admin/teams', teamForm);
        if (res.data?.status === 1) {
          toast.success(res.data.msg || 'Team created successfully');
          setTeamModal({ open: false, mode: 'create', data: null });
          fetchData();
        } else {
          toast.error(res.data?.msg || 'Failed to create team');
        }
      } else {
        const res = await axios.put(`/admin/teams/${teamModal.data._id}`, teamForm);
        if (res.data?.status === 1) {
          toast.success(res.data.msg || 'Team updated successfully');
          setTeamModal({ open: false, mode: 'create', data: null });
          fetchData();
        } else {
          toast.error(res.data?.msg || 'Failed to update team');
        }
      }
    } catch (err) {
      console.error('Save team error:', err);
      toast.error(err.response?.data?.msg || 'Failed to save team');
    }
  };

  const handleInitiateDeleteTeam = (team) => {
    if (team.memberCount > 0) {
      const otherTeams = teams.filter((t) => t._id !== team._id);
      setDeleteTeamModal({
        open: true,
        team,
        reassignTo: otherTeams[0]?._id || '',
      });
    } else {
      if (window.confirm(`Are you sure you want to delete team "${team.name}"?`)) {
        executeDeleteTeam(team._id);
      }
    }
  };

  const executeDeleteTeam = async (teamId, reassignToTeamId = null) => {
    try {
      const res = await axios.delete(`/admin/teams/${teamId}`, {
        data: { reassignToTeamId },
      });
      if (res.data?.status === 1) {
        toast.success(res.data.msg || 'Team deleted successfully');
        setDeleteTeamModal({ open: false, team: null, reassignTo: '' });
        fetchData();
      } else {
        toast.error(res.data?.msg || 'Failed to delete team');
      }
    } catch (err) {
      console.error('Delete team error:', err);
      toast.error(err.response?.data?.msg || 'Failed to delete team');
    }
  };

  const handleViewTeamMembers = async (team) => {
    try {
      const res = await axios.get(`/admin/teams/${team._id}/members`);
      if (res.data?.status === 1) {
        setMembersModal({ open: true, team, members: res.data.members || [] });
      } else {
        toast.error('Failed to load team members');
      }
    } catch (err) {
      toast.error('Error fetching team members');
    }
  };

  /* ─────────────────────────────────────────────────────────────
     TEAM MEMBER & INVITATION HANDLERS
  ───────────────────────────────────────────────────────────── */
  const handleSendInviteOTP = async () => {
    if (!inviteForm.email.trim()) {
      return toast.error('Please enter the user email first');
    }

    setSendingOtp(true);
    try {
      const res = await axios.post('/admin/users/send-invite-otp', {
        email: inviteForm.email.trim(),
      });
      if (res.data?.status === 1) {
        toast.success(res.data.msg || 'Verification OTP sent to email');
        setOtpSent(true);
      } else {
        toast.error(res.data?.msg || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send invite OTP error:', err);
      toast.error(err.response?.data?.msg || 'Error sending verification OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      return toast.error('Name and email are required');
    }
    if (!inviteForm.teamId) {
      return toast.warning('Please select a team to invite this user into');
    }
    if (!inviteForm.otp.trim()) {
      return toast.error('Please request and enter the email verification OTP');
    }

    const payload = {
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      phone: inviteForm.phone.trim(),
      company_name: inviteForm.company_name.trim(),
      teamId: inviteForm.teamId,
      password: inviteForm.passwordMode === 'custom' ? inviteForm.customPassword : null,
      otp: inviteForm.otp.trim(),
      sendInviteEmail: inviteForm.sendInviteEmail,
    };

    try {
      const res = await axios.post('/admin/users/invite', payload);
      if (res.data?.status === 1) {
        toast.success(res.data.msg || 'User verified and added to team successfully!');
        setInviteModal({ open: false });
        setOtpSent(false);
        setInviteForm({
          name: '',
          email: '',
          phone: '',
          company_name: 'RealBell Foundation',
          teamId: '',
          passwordMode: 'auto',
          customPassword: '',
          otp: '',
          sendInviteEmail: true,
        });
        fetchData();
      } else {
        toast.error(res.data?.msg || 'Failed to invite user');
      }
    } catch (err) {
      console.error('Invite user error:', err);
      toast.error(err.response?.data?.msg || 'Failed to invite user');
    }
  };

  const handleOpenAssignModal = (u) => {
    setAssignForm({
      teamId: u.team?._id || u.team || '',
      accountStatus: u.accountStatus || 'active',
    });
    setAssignModal({ open: true, user: u });
  };

  const handleSaveUserAssignment = async (e) => {
    e.preventDefault();
    if (!assignModal.user) return;

    try {
      const res = await axios.patch(`/admin/users/${assignModal.user._id}/assignment`, {
        teamId: assignForm.teamId || null,
        accountStatus: assignForm.accountStatus,
      });

      if (res.data?.status === 1) {
        toast.success(res.data.msg || 'Team assignment updated successfully');
        setAssignModal({ open: false, user: null });
        fetchData();
      } else {
        toast.error(res.data?.msg || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Assignment error:', err);
      toast.error(err.response?.data?.msg || 'Failed to update user team');
    }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.accountStatus === 'active' ? 'disabled' : 'active';
    if (!window.confirm(`Set status of ${user.name} to ${newStatus}?`)) return;

    try {
      const res = await axios.patch(`/admin/users/${user._id}/status`, { status: newStatus });
      if (res.data?.status === 1) {
        toast.success(res.data.msg || `User is now ${newStatus}`);
        fetchData();
      } else {
        toast.error(res.data?.msg || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Status toggle error:', err);
      toast.error(err.response?.data?.msg || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete staff member "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      const res = await axios.delete(`/admin/users/${user._id}`);
      if (res.data?.status === 1) {
        toast.success(res.data.msg || 'Staff member permanently deleted');
        fetchData();
      } else {
        toast.error(res.data?.msg || 'Failed to delete staff member');
      }
    } catch (err) {
      console.error('Delete member error:', err);
      toast.error(err.response?.data?.msg || 'Error deleting member');
    }
  };

  // Filter users (include staff who are admins, super admins, or have an assigned team)
  const filteredUsers = users.filter((u) => {
    const isStaffOrAdmin = u.role === 'admin' || u.role === 'super_admin' || Boolean(u.team);
    if (!isStaffOrAdmin) return false;

    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = !teamFilter || u.team?._id === teamFilter || u.team === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const canDeleteUser = isSuperAdmin(currentUser) || hasPermission(currentUser, 'users.delete');

  return (
    <AdminLayout title="Teams & Permissions">
      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', margin: 0 }}>
              🏢 Teams & Access Control
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-subtle, #94a3b8)', marginTop: '4px' }}>
              Create organization teams (HR, Cashier, Manager, Doctor, Receptionist), configure their permissions, and invite verified users directly to teams.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleOpenTeamModal('create')}
              style={styles.primaryBtn}
            >
              + Create New Team
            </button>
            <button
              onClick={() => {
                setOtpSent(false);
                setInviteModal({ open: true });
              }}
              style={{ ...styles.primaryBtn, background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              ✉️ Invite User to Team (with OTP)
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab('teams')}
            style={{ ...styles.tabBtn, ...(activeTab === 'teams' ? styles.tabBtnActive : {}) }}
          >
            🏢 Organization Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            style={{ ...styles.tabBtn, ...(activeTab === 'members' ? styles.tabBtnActive : {}) }}
          >
            👥 Team Members & Invitations ({users.length})
          </button>
        </div>

        {/* ======================= TAB 1: TEAMS & PERMISSIONS ======================= */}
        {activeTab === 'teams' && (
          <div>
            {loading ? (
              <div style={styles.loadingState}>Loading organization teams...</div>
            ) : teams.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>No teams created yet</div>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Create teams like HR, Cashier, Manager, Doctor, Receptionist to manage access permissions.</p>
                <button onClick={() => handleOpenTeamModal('create')} style={styles.primaryBtn}>
                  Create First Team
                </button>
              </div>
            ) : (
              <div style={styles.grid}>
                {teams.map((team) => {
                  const isWildcard = team.permissions?.includes('*');
                  const permCount = isWildcard ? ALL_PERMISSIONS.length : team.permissions?.length || 0;
                  return (
                    <div key={team._id} style={styles.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>
                              {team.name}
                            </h3>
                            <span style={styles.departmentBadge}>
                              {team.department || 'Operations'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Team Slug: {team.slug || team.name.toLowerCase()}
                          </span>
                        </div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: team.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: team.status === 'active' ? '#34d399' : '#f87171',
                            border: team.status === 'active' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                          }}
                        >
                          {team.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', minHeight: '32px', margin: '0 0 0.8rem', lineHeight: '1.4' }}>
                        {team.description || 'No description provided for this team.'}
                      </p>

                      {/* Permissions Tags Preview */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' }}>
                          Team Permissions ({permCount})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '60px', overflowY: 'hidden' }}>
                          {isWildcard ? (
                            <span style={styles.permPill}>⭐ Full Access (Wildcard *)</span>
                          ) : (
                            team.permissions?.slice(0, 4).map((p) => (
                              <span key={p} style={styles.permPill}>
                                ✓ {p}
                              </span>
                            ))
                          )}
                          {!isWildcard && team.permissions?.length > 4 && (
                            <span style={{ ...styles.permPill, color: '#818cf8', background: 'rgba(99,102,241,0.1)' }}>
                              +{team.permissions.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                        <span
                          onClick={() => handleViewTeamMembers(team)}
                          style={{ color: '#818cf8', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          👥 {team.memberCount || 0} Member{team.memberCount === 1 ? '' : 's'} →
                        </span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenTeamModal('edit', team)}
                            style={styles.actionIconBtn}
                            title="Edit Team & Permissions"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleInitiateDeleteTeam(team)}
                            style={{ ...styles.actionIconBtn, color: '#f87171' }}
                            title="Delete Team"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: MEMBERS & INVITATIONS ======================= */}
        {activeTab === 'members' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...styles.input, maxWidth: '280px' }}
              />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={{ ...styles.input, maxWidth: '200px' }}
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div style={styles.loadingState}>Loading team members...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>No users match your filters</div>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Invite verified new members to assign them to a team.</p>
                <button onClick={() => setInviteModal({ open: true })} style={styles.primaryBtn}>
                  Invite First User to Team
                </button>
              </div>
            ) : (
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Staff Member</th>
                      <th style={styles.th}>Assigned Team</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Joined</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isSuper = u.role === 'super_admin';
                      const isSelf = String(u._id) === String(currentUser?._id);
                      return (
                        <tr key={u._id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={styles.userAvatar}>
                                {u.name ? u.name.slice(0, 2).toUpperCase() : 'AD'}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f1f5f9' }}>
                                  {u.name} {isSelf ? <span style={{ fontSize: '0.68rem', color: '#818cf8' }}>(You)</span> : ''}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            {isSuper ? (
                              <span style={styles.superBadge}>⭐ Super Admin</span>
                            ) : u.team?.name ? (
                              <span style={styles.teamTag}>🏢 {u.team.name} Team</span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>— Unassigned —</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                background: u.accountStatus === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: u.accountStatus === 'active' ? '#34d399' : '#f87171',
                                border: u.accountStatus === 'active' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                              }}
                            >
                              {u.accountStatus === 'active' ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleOpenAssignModal(u)}
                                style={styles.btnSmall}
                                title="Change Assigned Team"
                              >
                                Change Team
                              </button>
                              {!isSuper && !isSelf && (
                                <>
                                  <button
                                    onClick={() => handleToggleUserStatus(u)}
                                    style={{
                                      ...styles.btnSmall,
                                      color: u.accountStatus === 'active' ? '#f87171' : '#34d399',
                                    }}
                                    title={u.accountStatus === 'active' ? 'Disable User' : 'Enable User'}
                                  >
                                    {u.accountStatus === 'active' ? 'Disable' : 'Enable'}
                                  </button>
                                  {canDeleteUser && (
                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      style={{
                                        ...styles.btnSmall,
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#f87171',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                      }}
                                      title="Permanently Delete Staff Member"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================= MODAL: CREATE / EDIT TEAM & PERMISSIONS ======================= */}
        {teamModal.open && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                    {teamModal.mode === 'create' ? 'Create Team & Configure Permissions' : `Edit Team: ${teamModal.data?.name}`}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Define the team (e.g. HR, Cashier, Manager, Doctor) and choose which admin modules members can access.
                  </p>
                </div>
                <button onClick={() => setTeamModal({ open: false, mode: 'create', data: null })} style={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleSaveTeam} style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={styles.label}>Team Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HR, Cashier, Manager, Doctor, Receptionist"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Human Resources, Finance, Operations"
                      value={teamForm.department}
                      onChange={(e) => setTeamForm({ ...teamForm, department: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={styles.label}>Description</label>
                    <input
                      type="text"
                      placeholder="Team purpose and responsibilities..."
                      value={teamForm.description}
                      onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Status</label>
                    <select
                      value={teamForm.status}
                      onChange={(e) => setTeamForm({ ...teamForm, status: e.target.value })}
                      style={styles.input}
                    >
                      <option value="active">Active (Enabled)</option>
                      <option value="inactive">Inactive (Disabled)</option>
                    </select>
                  </div>
                </div>

                {/* Permissions Section */}
                <div style={{ borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9' }}>
                        Team Access Permissions ({teamForm.permissions.length} Selected)
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                        Members invited to this team will inherit exactly these permissions.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        style={{ ...styles.btnSmall, fontSize: '0.7rem' }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        style={{ ...styles.btnSmall, fontSize: '0.7rem' }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {PERMISSION_MODULES.map((mod) => {
                      const modKeys = mod.permissions.map((p) => p.key);
                      const isAllModChecked = modKeys.every((k) => teamForm.permissions.includes(k));
                      const isAnyModChecked = modKeys.some((k) => teamForm.permissions.includes(k));

                      return (
                        <div
                          key={mod.module}
                          style={{
                            background: isAnyModChecked ? 'rgba(99,102,241,0.04)' : 'var(--admin-input-bg, rgba(255,255,255,0.02))',
                            border: isAnyModChecked ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--admin-border-subtle, rgba(255,255,255,0.05))',
                            borderRadius: '8px',
                            padding: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: 18 }}>{mod.icon}</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f1f5f9' }}>{mod.name}</span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>— {mod.description}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleModulePermissions(mod)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isAllModChecked ? '#818cf8' : '#64748b',
                                fontSize: '0.72rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              {isAllModChecked ? '☑ Deselect Module' : '☐ Select Module'}
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px' }}>
                            {mod.permissions.map((perm) => {
                              const isChecked = teamForm.permissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    background: isChecked ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    border: isChecked ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.12s ease',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(perm.key)}
                                    style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                                  />
                                  <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: isChecked ? '600' : '400', color: isChecked ? '#e0e7ff' : '#94a3b8' }}>
                                      {perm.label}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setTeamModal({ open: false, mode: 'create', data: null })}
                    style={styles.btnSecondary}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryBtn}>
                    {teamModal.mode === 'create' ? 'Create Team' : 'Save Team Permissions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MODAL: INVITE USER TO TEAM WITH EMAIL OTP ======================= */}
        {inviteModal.open && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                    Invite & Verify User to Team
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Verify member email with OTP before provisioning their staff account and team permissions.
                  </p>
                </div>
                <button onClick={() => setInviteModal({ open: false })} style={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleInviteUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                <div>
                  <label style={styles.label}>User Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>User Work Email Address *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="email"
                      required
                      placeholder="sarah@realbell.org"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleSendInviteOTP}
                      disabled={sendingOtp}
                      style={{
                        ...styles.btnSecondary,
                        background: otpSent ? 'rgba(16,185,129,0.15)' : '#6366f1',
                        color: otpSent ? '#34d399' : '#fff',
                        borderColor: otpSent ? 'rgba(16,185,129,0.3)' : '#6366f1',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sendingOtp ? 'Sending...' : otpSent ? '✓ Resend OTP' : '📧 Send OTP'}
                    </button>
                  </div>
                  {otpSent && (
                    <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '4px' }}>
                      ✓ 6-digit confirmation code was sent to {inviteForm.email}
                    </div>
                  )}
                </div>

                {/* OTP Verification Input */}
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                  <label style={{ ...styles.label, color: '#a5b4fc' }}>Enter 6-Digit Email Verification OTP *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 849201"
                    value={inviteForm.otp}
                    onChange={(e) => setInviteForm({ ...inviteForm, otp: e.target.value })}
                    style={{
                      ...styles.input,
                      fontSize: '1.1rem',
                      letterSpacing: '0.2em',
                      fontWeight: '800',
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  />
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                    Verifies that the member's email address is genuine and reachable before account activation.
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Assign to Team *</label>
                  <select
                    required
                    value={inviteForm.teamId}
                    onChange={(e) => setInviteForm({ ...inviteForm, teamId: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">— Select Team (HR, Cashier, Manager, etc.) —</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} Team ({t.department} • {t.permissions?.length} perms)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Initial Password Setting</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="pwdMode"
                        checked={inviteForm.passwordMode === 'auto'}
                        onChange={() => setInviteForm({ ...inviteForm, passwordMode: 'auto' })}
                        style={{ accentColor: '#6366f1' }}
                      />
                      Auto-generate secure temporary password
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="pwdMode"
                        checked={inviteForm.passwordMode === 'custom'}
                        onChange={() => setInviteForm({ ...inviteForm, passwordMode: 'custom' })}
                        style={{ accentColor: '#6366f1' }}
                      />
                      Set initial password
                    </label>
                  </div>
                  {inviteForm.passwordMode === 'custom' && (
                    <input
                      type="password"
                      placeholder="Enter temporary password..."
                      value={inviteForm.customPassword}
                      onChange={(e) => setInviteForm({ ...inviteForm, customPassword: e.target.value })}
                      style={{ ...styles.input, marginTop: '8px' }}
                    />
                  )}
                </div>

                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#e0e7ff', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={inviteForm.sendInviteEmail}
                      onChange={(e) => setInviteForm({ ...inviteForm, sendInviteEmail: e.target.checked })}
                      style={{ accentColor: '#6366f1' }}
                    />
                    Send onboarding email with login URL & team credentials
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setInviteModal({ open: false })}
                    style={styles.btnSecondary}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryBtn}>
                    Verify OTP & Create Team Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MODAL: REASSIGN USER TEAM ======================= */}
        {assignModal.open && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                  Change Team: {assignModal.user?.name}
                </h3>
                <button onClick={() => setAssignModal({ open: false, user: null })} style={styles.closeBtn}>✕</button>
              </div>

              <form onSubmit={handleSaveUserAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                <div>
                  <label style={styles.label}>Assigned Team</label>
                  <select
                    value={assignForm.teamId}
                    onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">— No Team (Unassigned) —</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} Team ({t.department})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Account Status</label>
                  <select
                    value={assignForm.accountStatus}
                    onChange={(e) => setAssignForm({ ...assignForm, accountStatus: e.target.value })}
                    style={styles.input}
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="disabled">Disabled (Lockout Access)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setAssignModal({ open: false, user: null })}
                    style={styles.btnSecondary}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryBtn}>
                    Save Team Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MODAL: VIEW TEAM MEMBERS ======================= */}
        {membersModal.open && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '650px' }}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9' }}>
                    🏢 {membersModal.team?.name} Team — Members
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {membersModal.members?.length} staff members in this team.
                  </p>
                </div>
                <button onClick={() => setMembersModal({ open: false, team: null, members: [] })} style={styles.closeBtn}>✕</button>
              </div>

              <div style={{ padding: '1.25rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {membersModal.members?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No members are currently in this team. Click "Invite User to Team" to add members.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {membersModal.members.map((m) => (
                      <div
                        key={m._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'var(--admin-input-bg, rgba(255,255,255,0.03))',
                          border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f1f5f9' }}>{m.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.email}</div>
                        </div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: m.accountStatus === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: m.accountStatus === 'active' ? '#34d399' : '#f87171',
                          }}
                        >
                          {m.accountStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= MODAL: DELETE TEAM WITH REASSIGNMENT ======================= */}
        {deleteTeamModal.open && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f87171' }}>
                  Reassign Members Before Deleting Team
                </h3>
                <button onClick={() => setDeleteTeamModal({ open: false, team: null, reassignTo: '' })} style={styles.closeBtn}>✕</button>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 1rem' }}>
                  The team <strong>"{deleteTeamModal.team?.name}"</strong> currently has{' '}
                  <strong>{deleteTeamModal.team?.memberCount} active member(s)</strong>. Please select another team to move them to before deleting.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={styles.label}>Move Members To Team *</label>
                  <select
                    value={deleteTeamModal.reassignTo}
                    onChange={(e) => setDeleteTeamModal({ ...deleteTeamModal, reassignTo: e.target.value })}
                    style={styles.input}
                  >
                    {teams
                      .filter((t) => t._id !== deleteTeamModal.team?._id)
                      .map((t) => (
                        <option key={t._id} value={t._id}>{t.name} Team ({t.department})</option>
                      ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteTeamModal({ open: false, team: null, reassignTo: '' })}
                    style={styles.btnSecondary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => executeDeleteTeam(deleteTeamModal.team._id, deleteTeamModal.reassignTo)}
                    style={{ ...styles.primaryBtn, background: '#ef4444' }}
                  >
                    Reassign & Delete Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

const styles = {
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))',
    marginBottom: '1.5rem',
    paddingBottom: '2px',
  },
  tabBtn: {
    padding: '0.6rem 1.2rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--admin-text-subtle, #94a3b8)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    color: '#818cf8',
    borderBottom: '2px solid #818cf8',
    background: 'rgba(99,102,241,0.06)',
    borderRadius: '6px 6px 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: 'var(--admin-card-bg, #11141f)',
    border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    transition: 'border-color 0.2s',
  },
  primaryBtn: {
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    padding: '0.55rem 1rem',
    borderRadius: '8px',
    background: 'var(--admin-input-bg, rgba(255,255,255,0.05))',
    color: 'var(--admin-text-primary, #cbd5e1)',
    border: '1px solid var(--admin-input-border, rgba(255,255,255,0.1))',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  btnSmall: {
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    background: 'var(--admin-input-bg, rgba(255,255,255,0.04))',
    border: '1px solid var(--admin-input-border, rgba(255,255,255,0.08))',
    color: 'var(--admin-text-primary, #cbd5e1)',
    fontSize: '0.72rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionIconBtn: {
    background: 'var(--admin-input-bg, rgba(255,255,255,0.04))',
    border: '1px solid var(--admin-input-border, rgba(255,255,255,0.08))',
    borderRadius: '6px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  departmentBadge: {
    fontSize: '0.65rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#818cf8',
    background: 'rgba(99,102,241,0.12)',
    padding: '2px 7px',
    borderRadius: '4px',
  },
  statusBadge: {
    fontSize: '0.65rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '2px 7px',
    borderRadius: '99px',
  },
  permPill: {
    fontSize: '0.65rem',
    fontWeight: '500',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(16,185,129,0.1)',
    color: '#34d399',
    border: '1px solid rgba(16,185,129,0.2)',
  },
  tableCard: {
    background: 'var(--admin-card-bg, #11141f)',
    border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '0.75rem 1rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
    background: 'rgba(0,0,0,0.15)',
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    color: 'var(--admin-text-primary, #cbd5e1)',
    borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.04))',
  },
  tr: {
    transition: 'background-color 0.12s ease',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  superBadge: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#fbbf24',
    background: 'rgba(245,158,11,0.15)',
    border: '1px solid rgba(245,158,11,0.3)',
    padding: '2px 7px',
    borderRadius: '99px',
  },
  teamTag: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: '#38bdf8',
    background: 'rgba(56,189,248,0.15)',
    border: '1px solid rgba(56,189,248,0.3)',
    padding: '2px 7px',
    borderRadius: '6px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    background: 'var(--admin-card-bg, #11141f)',
    border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.1))',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '540px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.15)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  input: {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    background: 'var(--admin-input-bg, rgba(255,255,255,0.04))',
    border: '1px solid var(--admin-input-border, rgba(255,255,255,0.08))',
    color: 'var(--admin-text-primary, #f1f5f9)',
    fontSize: '0.82rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3.5rem 1rem',
    background: 'var(--admin-card-bg, #11141f)',
    border: '1px dashed var(--admin-border-subtle, rgba(255,255,255,0.1))',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  loadingState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};

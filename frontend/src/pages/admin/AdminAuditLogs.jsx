import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from '../../services/axios';
import { toast } from 'react-toastify';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        search,
        action: actionFilter,
      });

      const res = await axios.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data?.status === 1) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setPage(res.data.pagination?.page || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionColor = (action) => {
    if (action.includes('CREATED') || action.includes('INVITED')) return { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' };
    if (action.includes('DELETED')) return { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' };
    if (action.includes('UPDATED') || action.includes('ASSIGNED')) return { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', border: 'rgba(56,189,248,0.3)' };
    return { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' };
  };

  return (
    <AdminLayout title="Security & Audit Logs">
      <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
        
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', margin: 0 }}>
            📜 System Audit & Security Trail
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-subtle, #94a3b8)', marginTop: '4px' }}>
            Immutable administrative activity logs tracking role changes, permission modifications, user invitations, and security events.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search actions, target IDs, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>Search</button>
          </form>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ ...styles.input, maxWidth: '220px' }}
          >
            <option value="">All Action Types</option>
            <option value="ROLE_CREATED">ROLE_CREATED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="ROLE_DELETED">ROLE_DELETED</option>
            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
            <option value="TEAM_CREATED">TEAM_CREATED</option>
            <option value="TEAM_UPDATED">TEAM_UPDATED</option>
            <option value="TEAM_DELETED">TEAM_DELETED</option>
            <option value="USER_INVITED">USER_INVITED</option>
            <option value="USER_STATUS_CHANGED">USER_STATUS_CHANGED</option>
          </select>
        </div>

        {/* Table View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '2rem' }}>📜</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>No audit records found</div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Administrative events will appear here automatically.</p>
          </div>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Performed By</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Target Type</th>
                  <th style={styles.th}>Details</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionStyle = getActionColor(log.action);
                  return (
                    <tr key={log._id} style={styles.tr}>
                      <td style={{ ...styles.td, fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={styles.td}>
                        {log.performedBy ? (
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#f1f5f9' }}>
                              {log.performedBy.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {log.performedBy.email}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>System / Public</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            background: actionStyle.bg,
                            color: actionStyle.text,
                            border: `1px solid ${actionStyle.border}`,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {log.targetType || '—'}
                      </td>
                      <td style={{ ...styles.td, fontSize: '0.75rem', color: '#94a3b8', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(log.details || {})}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={styles.inspectBtn}
                        >
                          View Diff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', background: 'rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => fetchLogs(page - 1)}
                    style={{ ...styles.primaryBtn, padding: '0.3rem 0.8rem', opacity: page <= 1 ? 0.5 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => fetchLogs(page + 1)}
                    style={{ ...styles.primaryBtn, padding: '0.3rem 0.8rem', opacity: page >= totalPages ? 0.5 : 1 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diff Inspection Modal */}
        {selectedLog && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f1f5f9' }}>
                    Audit Event Inspection
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>
                    Action: {selectedLog.action} • {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <button onClick={() => setSelectedLog(null)} style={styles.closeBtn}>✕</button>
              </div>

              <div style={{ padding: '1.25rem', maxHeight: '65vh', overflowY: 'auto' }}>
                <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    <strong>Initiated By:</strong> {selectedLog.performedBy?.name} ({selectedLog.performedBy?.email || 'N/A'})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                    <strong>Target Type / ID:</strong> {selectedLog.targetType} {selectedLog.targetId ? `(ID: ${selectedLog.targetId})` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    <strong>IP Address:</strong> {selectedLog.ipAddress || '127.0.0.1'}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#cbd5e1', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Payload & Change Data
                </div>
                <pre style={{
                  background: '#090b10',
                  color: '#38bdf8',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  overflowX: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  margin: 0,
                }}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

const styles = {
  primaryBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  inspectBtn: {
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    background: 'var(--admin-input-bg, rgba(255,255,255,0.04))',
    border: '1px solid var(--admin-input-border, rgba(255,255,255,0.08))',
    color: '#818cf8',
    fontSize: '0.72rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '8px',
    background: 'var(--admin-input-bg, rgba(255,255,255,0.04))',
    border: '1px solid var(--admin-input-border, rgba(255,255,255,0.08))',
    color: 'var(--admin-text-primary, #f1f5f9)',
    fontSize: '0.82rem',
    outline: 'none',
  },
  badge: {
    display: 'inline-block',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '4px',
    textTransform: 'uppercase',
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
};

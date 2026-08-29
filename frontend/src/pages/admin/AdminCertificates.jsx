import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Search, Filter, Eye, Download, ShieldBan, ShieldCheck, History, X, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from './AdminLayout';
import OfficialCertificateDocument from '../../components/OfficialCertificateDocument';
import { downloadCertificatePDF } from '../../utils/printCertificate';

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, expired: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [selectedCert, setSelectedCert] = useState(null);
  const [modalType, setModalType] = useState(null); // 'details', 'revoke', 'restore', 'audit'
  const [reason, setReason] = useState('');
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    fetchCertificates();
  }, [page, statusFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const url = searchTerm 
        ? `/certificates/admin/search?q=${searchTerm}&page=${page}&limit=${limit}`
        : `/certificates/admin/all?page=${page}&limit=${limit}&status=${statusFilter}`;
      
      const response = await axios.get(url);
      if (response.data.status === 1) {
        setCertificates(response.data.data.certificates || []);
        setTotalPages(response.data.data.totalPages || 1);
        if (response.data.data.stats) {
          setStats(response.data.data.stats);
        } else {
          // Calculate stats if not provided by backend (fallback)
          const all = response.data.data.certificates || [];
          setStats({
            total: all.length,
            valid: all.filter(c => c.status === 'valid').length,
            expired: all.filter(c => c.status === 'expired').length,
            revoked: all.filter(c => c.status === 'revoked').length,
          });
        }
      } else {
        toast.error(response.data.msg || 'Failed to fetch certificates');
      }
    } catch (error) {
      toast.error('Error fetching certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCertificates();
  };

  const handleRevoke = async () => {
    if (!reason.trim()) return toast.error('Reason is required');
    try {
      const res = await axios.put(`/certificates/admin/${selectedCert._id}/revoke`, { reason });
      if (res.data.status === 1) {
        toast.success('Certificate revoked successfully');
        setModalType(null);
        fetchCertificates();
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error('Failed to revoke certificate');
    }
  };

  const handleRestore = async () => {
    if (!reason.trim()) return toast.error('Reason is required');
    try {
      const res = await axios.put(`/certificates/admin/${selectedCert._id}/restore`, { reason });
      if (res.data.status === 1) {
        toast.success('Certificate restored successfully');
        setModalType(null);
        fetchCertificates();
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error('Failed to restore certificate');
    }
  };

  const fetchAudit = async (certId) => {
    try {
      const res = await axios.get(`/certificates/admin/${certId}/audit`);
      if (res.data.status === 1) {
        setAuditLog(res.data.data);
      } else {
        toast.error('Failed to fetch audit log');
      }
    } catch (error) {
      toast.error('Error fetching audit log');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'color-mix(in srgb, var(--admin-text-primary) 10%, #22c55e)';
      case 'expired': return 'color-mix(in srgb, var(--admin-text-primary) 10%, #f59e0b)';
      case 'revoked': return 'color-mix(in srgb, var(--admin-text-primary) 10%, #ef4444)';
      default: return 'var(--admin-border-subtle)';
    }
  };
  
  const getStatusTextColor = (status) => {
    switch (status) {
      case 'valid': return '#22c55e';
      case 'expired': return '#f59e0b';
      case 'revoked': return '#ef4444';
      default: return 'var(--admin-text-muted)';
    }
  };

  return (
    <AdminLayout title="Certificate Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {[
            { label: 'Total Certificates', value: stats.total, color: 'var(--admin-text-primary)' },
            { label: 'Valid', value: stats.valid, color: '#22c55e' },
            { label: 'Expired', value: stats.expired, color: '#f59e0b' },
            { label: 'Revoked', value: stats.revoked, color: '#ef4444' }
          ].map((s, i) => (
            <div key={i} style={{ padding: '20px', backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
              <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, minWidth: '300px' }}>
            <input 
              type="text" 
              placeholder="Search by candidate, cert ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, padding: '10px', borderRadius: '4px 0 0 4px', 
                border: '1px solid var(--admin-input-border)',
                backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)'
              }}
            />
            <button 
              type="submit"
              style={{
                padding: '10px 15px', backgroundColor: 'var(--admin-primary, #6366f1)', color: 'white',
                border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <Search size={18} />
            </button>
          </form>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/admin/certificates/templates')}
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--admin-primary, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Template Builder
            </button>

            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                padding: '10px', borderRadius: '4px',
                border: '1px solid var(--admin-input-border)',
                backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)'
              }}
            >
              <option value="">All Statuses</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</div>
          ) : certificates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No certificates found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-muted)' }}>
                  <th style={{ padding: '15px' }}>Candidate</th>
                  <th style={{ padding: '15px' }}>Certificate ID</th>
                  <th style={{ padding: '15px' }}>Test Name</th>
                  <th style={{ padding: '15px' }}>Issue Date</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert._id} style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td style={{ padding: '15px', color: 'var(--admin-text-primary)' }}>{cert.candidateName}</td>
                    <td style={{ padding: '15px', color: 'var(--admin-text-muted)' }}>{cert.certificateId}</td>
                    <td style={{ padding: '15px', color: 'var(--admin-text-primary)' }}>{cert.testName}</td>
                    <td style={{ padding: '15px', color: 'var(--admin-text-muted)' }}>{new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: getStatusColor(cert.status), color: getStatusTextColor(cert.status)
                      }}>
                        {cert.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setSelectedCert(cert); setModalType('details'); }} title="View Details" style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><Eye size={18} /></button>
                        {cert.pdfUrl && <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" title="Download" style={{ color: 'var(--admin-text-muted)' }}><Download size={18} /></a>}
                        {cert.status === 'valid' && <button onClick={() => { setSelectedCert(cert); setReason(''); setModalType('revoke'); }} title="Revoke" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><ShieldBan size={18} /></button>}
                        {cert.status === 'revoked' && <button onClick={() => { setSelectedCert(cert); setReason(''); setModalType('restore'); }} title="Restore" style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer' }}><ShieldCheck size={18} /></button>}
                        <button onClick={() => { setSelectedCert(cert); fetchAudit(cert._id); setModalType('audit'); }} title="Audit Log" style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><History size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'var(--admin-card-bg)', color: 'var(--admin-text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={18} /></button>
            <span style={{ color: 'var(--admin-text-muted)' }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'var(--admin-card-bg)', color: 'var(--admin-text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={18} /></button>
          </div>
        )}

      </div>

      {/* Modals */}
      {modalType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--admin-card-bg)', padding: '24px', borderRadius: '12px',
            width: '100%', maxWidth: modalType === 'details' ? '850px' : modalType === 'audit' ? '600px' : '450px',
            border: '1px solid var(--admin-border-subtle)',
            maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--admin-border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text-primary)', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalType === 'details' && 'Official Certificate Preview'}
                {modalType === 'revoke' && 'Revoke Certificate'}
                {modalType === 'restore' && 'Restore Certificate'}
                {modalType === 'audit' && 'Audit History'}
              </h3>
              <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '20px' }}><X size={20} /></button>
            </div>

            {modalType === 'details' && selectedCert && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <OfficialCertificateDocument cert={selectedCert} id="admin-certificate-canvas" />

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => downloadCertificatePDF(selectedCert, 'admin-certificate-canvas')} 
                    style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', background: 'var(--admin-primary, #6366f1)', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={16} /> Download PDF
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid var(--admin-border-subtle)', background: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                  >
                    🖨️ Print Certificate
                  </button>
                  <a 
                    href={`/verify/certificate/${selectedCert.certificateId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid var(--admin-border-subtle)', background: 'var(--admin-input-bg)', color: 'var(--admin-primary, #6366f1)', textDecoration: 'none', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Verify Online ↗
                  </a>
                  <button 
                    onClick={() => setModalType(null)} 
                    style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--admin-border-subtle)', background: 'transparent', color: 'var(--admin-text-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {(modalType === 'revoke' || modalType === 'restore') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', margin: 0 }}>
                  Please provide a reason to {modalType} this certificate for <strong>{selectedCert?.candidateName}</strong>.
                </p>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason..."
                  rows={4}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '4px',
                    border: '1px solid var(--admin-input-border)',
                    backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => setModalType(null)} style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'transparent', color: 'var(--admin-text-primary)', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={modalType === 'revoke' ? handleRevoke : handleRestore} style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', background: modalType === 'revoke' ? '#ef4444' : '#22c55e', color: '#fff', cursor: 'pointer' }}>
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {modalType === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {auditLog.length === 0 ? (
                  <p style={{ color: 'var(--admin-text-muted)' }}>No audit history found.</p>
                ) : (
                  auditLog.map((log, i) => (
                    <div key={i} style={{ padding: '15px', border: '1px solid var(--admin-border-subtle)', borderRadius: '4px', backgroundColor: 'var(--admin-input-bg)' }}>
                      <p style={{ margin: '0 0 5px 0', color: 'var(--admin-text-primary)', fontWeight: 'bold' }}>{log.action}</p>
                      <p style={{ margin: '0 0 5px 0', color: 'var(--admin-text-muted)', fontSize: '13px' }}>{new Date(log.createdAt).toLocaleString()} by {log.performedBy?.name || 'System'}</p>
                      <p style={{ margin: 0, color: 'var(--admin-text-primary)', fontSize: '14px' }}>{JSON.stringify(log.details || {})}</p>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminCertificates;

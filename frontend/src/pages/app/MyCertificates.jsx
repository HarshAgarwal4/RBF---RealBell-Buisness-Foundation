import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Award, Download, ExternalLink, Calendar, Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { COLORS } from '../../components/colors';
import OfficialCertificateDocument from '../../components/OfficialCertificateDocument';
import { downloadCertificatePDF, printCertificateDocument } from '../../utils/printCertificate';

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/tests/my-certificates');
      if (res.data.status === 1) {
        setCertificates(res.data.data || []);
      } else {
        toast.error(res.data.msg || 'Failed to fetch certificates');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert) => {
    if (!cert) return;
    try {
      toast.info('Downloading certificate PDF...');
      await downloadCertificatePDF(cert);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      printCertificateDocument(cert);
    }
  };

  const filteredCertificates = certificates.filter(cert => 
    (cert.test?.title || cert.testName || '')?.toLowerCase().includes(search.toLowerCase()) || 
    (cert.certificateId || '')?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status, expiryDate) => {
    if (status === 'revoked') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Revoked</span>;
    }
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">Expired</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Valid</span>;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen font-sans">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>My Certificates</h1>
            <p className="text-gray-500">View and manage your earned credentials issued by RealBell Business Foundation.</p>
          </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-20 rounded-xl shadow-sm" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <Award className="mx-auto h-20 w-20 text-gray-300 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ color: 'var(--color-text-main)' }}>No Certificates Yet</h3>
          <p className="text-gray-500 mb-6">You haven&apos;t earned any certificates yet. Take an assessment to get started!</p>
          <a href="/assessments" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Browse Assessments
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCertificates.map(cert => {
            const tTitle = cert.test?.title || cert.testName || 'Assessment';
            const tDomain = cert.test?.domain?.name || cert.domain || 'General';
            const tScore = cert.percentage !== undefined ? cert.percentage : (cert.score || 0);
            return (
              <div key={cert._id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row transition-shadow hover:shadow-md">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 md:w-2/5 flex flex-col justify-center items-center text-white relative">
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(cert.status, cert.expiryDate)}
                  </div>
                  <Award size={48} className="text-yellow-400 mb-3" />
                  <h4 className="font-bold text-center leading-tight mb-2">{tTitle}</h4>
                  <p className="text-blue-200 text-xs text-center">{tDomain}</p>
                  <div className="mt-4 pt-4 border-t border-white/20 w-full text-center">
                    <span className="text-3xl font-black">{tScore}%</span>
                  </div>
                </div>
                <div className="p-6 md:w-3/5 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Certificate ID</p>
                      <p className="font-mono text-sm" style={{ color: 'var(--color-text-main)' }}>{cert.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Registration ID</p>
                      <p className="font-mono text-xs text-gray-400">{cert.registrationId}</p>
                    </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1"><Calendar size={12} /> Issued</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>{new Date(cert.issueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Expires</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                        {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'No Expiry'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => handleDownload(cert)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 py-2 border rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                    >
                      Details
                    </button>
                    <a
                      href={`/verify/certificate/${cert.certificateId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 border rounded-lg font-medium hover:bg-gray-50 transition-colors flex justify-center items-center gap-2 text-blue-600"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      Verify <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
          {filteredCertificates.length === 0 && search && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No certificates match your search query.</p>
            </div>
          )}
        </div>
      )}

      {/* Certificate Visual Document & Detail Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col my-4 sm:my-8 max-h-[94vh] overflow-hidden" style={{ background: 'var(--color-card)' }}>
            <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-2xl" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-base sm:text-lg truncate max-w-[240px] sm:max-w-md" style={{ color: 'var(--color-text-main)' }}>
                Official Certificate Document
              </h3>
              <button onClick={() => setSelectedCert(null)} className="text-gray-500 hover:text-gray-800 text-xl font-bold p-1">
                &times;
              </button>
            </div>
            
            <div className="p-2 sm:p-6 overflow-y-auto overflow-x-auto flex-1">
              <OfficialCertificateDocument cert={selectedCert} id="official-certificate-canvas" />
            </div>
            
            {/* Fully Responsive Modal Actions */}
            <div className="p-3 sm:p-4 border-t bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 rounded-b-2xl justify-end items-stretch sm:items-center" style={{ borderColor: 'var(--color-border)' }}>
              <button 
                onClick={() => handleDownload(selectedCert)} 
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={16} /> Download PDF
              </button>
              <button 
                onClick={() => window.print()} 
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5"
              >
                🖨️ Print
              </button>
              <a 
                href={`/verify/certificate/${selectedCert.certificateId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 text-center"
              >
                Verify Online ↗
              </a>
              <button 
                onClick={() => setSelectedCert(null)}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-800 border text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-xs sm:text-sm flex items-center justify-center"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default MyCertificates;

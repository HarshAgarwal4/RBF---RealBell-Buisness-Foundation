import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../services/axios';
import { CheckCircle, AlertTriangle, XCircle, FileSearch, Calendar, User, Award, ExternalLink } from 'lucide-react';

const CertificateVerification = () => {
  const { certificateId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/certificates/verify/${certificateId}`);
        if (res.data.status === 1) {
          setData(res.data.data);
        } else {
          setError(res.data.msg || 'Certificate verification failed');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Certificate not found or invalid ID.');
        } else {
          setError('An error occurred during verification. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a237e] mb-4"></div>
        <p className="text-gray-600 font-medium">Verifying certificate...</p>
      </div>
    );
  }

  // Styles using standard tailwind + inline hex codes for RBF branding
  const primaryColor = '#1a237e'; // Navy
  const secondaryColor = '#c5a47e'; // Gold

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#1a237e] flex items-center justify-center text-white font-bold text-xl">
            RBF
          </div>
          <span className="font-bold text-xl text-[#1a237e] hidden sm:block">RealBell Business Foundation</span>
        </div>
        <a href="/" className="text-sm font-medium text-[#1a237e] hover:underline flex items-center gap-1">
          Visit Website <ExternalLink size={14} />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border">
          
          {error ? (
            <div className="p-10 text-center">
              <FileSearch className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-8">{error}</p>
              <div className="bg-gray-50 p-4 rounded-lg inline-block border text-sm font-mono text-gray-500">
                ID: {certificateId}
              </div>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className={`p-6 text-center text-white flex flex-col items-center justify-center ${
                data.status === 'valid' && (!data.expiryDate || new Date(data.expiryDate) > new Date()) ? 'bg-green-600' :
                data.status === 'revoked' ? 'bg-red-600' : 'bg-amber-500'
              }`}>
                {data.status === 'valid' && (!data.expiryDate || new Date(data.expiryDate) > new Date()) ? (
                  <>
                    <CheckCircle className="w-16 h-16 mb-2" />
                    <h2 className="text-2xl font-bold">Certificate Verified</h2>
                    <p className="text-green-100 mt-1">This is a valid and authentic credential.</p>
                  </>
                ) : data.status === 'revoked' ? (
                  <>
                    <XCircle className="w-16 h-16 mb-2" />
                    <h2 className="text-2xl font-bold">Certificate Revoked</h2>
                    <p className="text-red-100 mt-1">This credential has been revoked by the issuer.</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-16 h-16 mb-2" />
                    <h2 className="text-2xl font-bold">Certificate Expired</h2>
                    <p className="text-amber-100 mt-1">This credential has passed its expiration date.</p>
                  </>
                )}
              </div>

              {/* Certificate Details */}
              <div className="p-4 sm:p-8">
                <div className="border-b pb-4 sm:pb-6 mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Awarded To</h3>
                  <div className="flex items-center gap-3">
                    <div className="bg-[#f0f2f5] p-2.5 sm:p-3 rounded-full text-[#1a237e]">
                      <User size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{data.candidateName}</p>
                      {data.registrationId && (
                        <p className="text-gray-500 text-xs sm:text-sm">Reg ID: {data.registrationId}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4 sm:pb-6 mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">For Successfully Completing</h3>
                  <div className="flex items-start gap-3">
                    <div className="bg-[#fcf8f2] p-2.5 sm:p-3 rounded-full text-[#c5a47e] mt-1">
                      <Award size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <p className="text-base sm:text-xl font-bold text-[#1a237e]">{data.testName}</p>
                      <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{data.domain}</p>
                      {data.score !== undefined && data.score !== null && (
                        <div className="mt-2 inline-block px-3 py-1 bg-green-50 border border-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                          Score: {data.score}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-5 rounded-xl border">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Issue Date</h3>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(data.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Expiration Date</h3>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {data.expiryDate 
                        ? new Date(data.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'No Expiration'}
                    </p>
                  </div>
                  <div className="col-span-2 pt-4 border-t mt-2">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Certificate ID</h3>
                    <p className="font-mono font-medium text-gray-900 break-all bg-white p-2 rounded border inline-block">
                      {data.certificateId}
                    </p>
                  </div>
                </div>

                {data.collaborators && data.collaborators.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 text-center">In Collaboration With</h3>
                    <div className="flex flex-wrap justify-center gap-6">
                      {data.collaborators.map((org, i) => (
                        <div key={i} className="flex flex-col items-center">
                          {org.logo ? (
                            <img src={org.logo} alt={org.name} className="h-12 object-contain mb-2" />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold mb-2">
                              {org.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs text-gray-600 font-medium">{org.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Footer of card */}
          <div className="bg-gray-100 p-4 text-center border-t text-xs text-gray-500">
            Verified on {new Date().toLocaleString('en-US', { timeZoneName: 'short' })}
          </div>
        </div>
        
        {/* Page Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} RealBell Business Foundation. All rights reserved.</p>
          <p className="mt-1">This verification page is hosted on the official RBF platform.</p>
        </footer>
      </main>
    </div>
  );
};

export default CertificateVerification;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Award, AlertCircle, ArrowLeft, Download, FileText } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { COLORS } from '../../components/colors';
import { downloadCertificatePDF, printCertificateDocument } from '../../utils/printCertificate';

const TestResult = () => {
  const { id, attemptId } = useParams();
  const currentAttemptId = id || attemptId;
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (currentAttemptId) {
      fetchResult();
    }
  }, [currentAttemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/tests/attempts/${currentAttemptId}`);
      if (res.data.status === 1) {
        setResult(res.data.data);
      } else {
        toast.error(res.data.msg || 'Failed to fetch result');
        navigate('/assessments');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error('An error occurred');
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certId) => {
    try {
      setDownloading(true);
      toast.info('Downloading certificate PDF...');
      const res = await axios.get(`/tests/certificates/${certId}/download`);
      const certData = res.data.data?.certificate || result?.certificate || result;
      await downloadCertificatePDF(certData);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      await downloadCertificatePDF(result?.certificate || result);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
        <Sidebar />
        <main className="ml-0 lg:ml-[300px] flex-1 flex justify-center items-center h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  if (!result) return null;

  const test = result.test || {};
  const score = result.obtainedMarks !== undefined ? result.obtainedMarks : (result.score || 0);
  const percentage = result.percentage !== undefined ? result.percentage : 0;
  const isPassed = Boolean(result.passed || result.isPassed);
  const certificate = result.certificate;
  const needsManualEvaluation = !result.evaluationComplete;
  
  const details = {
    attemptedCount: (result.correctCount || 0) + (result.incorrectCount || 0),
    correctCount: result.correctCount || 0,
    incorrectCount: result.incorrectCount || 0,
    unansweredCount: result.unansweredCount || 0
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen font-sans">
        <div className="p-2 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/assessments')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} />
            <span>Back to Assessments</span>
          </button>

          {/* Result Banner */}
      <div className={`rounded-xl p-8 text-center mb-8 shadow-sm ${isPassed ? 'bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-100 border border-red-200'}`}>
        {isPassed ? (
          <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-4" />
        ) : (
          <XCircle className="mx-auto h-20 w-20 text-red-500 mb-4" />
        )}
        <h1 className={`text-3xl font-bold mb-2 ${isPassed ? 'text-green-800' : 'text-red-800'}`}>
          {isPassed ? 'Congratulations! You Passed!' : 'Assessment Not Cleared'}
        </h1>
        <p className={`text-lg ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
          {test?.title || 'Assessment'}
        </p>
      </div>

      {needsManualEvaluation && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3 text-blue-800">
          <AlertCircle className="flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Pending Manual Evaluation</h4>
            <p className="text-sm">Some of your descriptive answers require manual grading by an evaluator. Your final score and result status may change once grading is complete.</p>
          </div>
        </div>
      )}

      {/* Score Summary */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-8 mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 text-center md:text-left">
          <p className="text-gray-500 font-medium uppercase tracking-wider text-sm mb-1">Your Score</p>
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-5xl font-black" style={{ color: 'var(--color-text-main)' }}>{score}</span>
            <span className="text-2xl text-gray-400 font-medium">/ {test?.totalMarks || result.totalMarks || 100}</span>
          </div>
        </div>
        
        <div className="h-24 w-px bg-gray-200 hidden md:block" style={{ backgroundColor: 'var(--color-border)' }}></div>
        
        <div className="flex-1 text-center">
          <p className="text-gray-500 font-medium uppercase tracking-wider text-sm mb-1">Percentage</p>
          <span className="text-5xl font-black" style={{ color: 'var(--color-text-main)' }}>{percentage}%</span>
        </div>

        <div className="h-24 w-px bg-gray-200 hidden md:block" style={{ backgroundColor: 'var(--color-border)' }}></div>

        <div className="flex-1 text-center md:text-right">
          <p className="text-gray-500 font-medium uppercase tracking-wider text-sm mb-1">Passing Requirement</p>
          <span className="text-xl font-bold" style={{ color: 'var(--color-text-main)' }}>
            {test?.passingPercentage || 50}%
          </span>
        </div>
      </div>

      {/* Details Grid */}
      {details && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-4 text-center shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <p className="text-sm text-gray-500 mb-1">Total Attempted</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>{details.attemptedCount}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-green-600 mb-1">Correct</p>
            <p className="text-2xl font-bold text-green-700">{details.correctCount}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-red-600 mb-1">Incorrect</p>
            <p className="text-2xl font-bold text-red-700">{details.incorrectCount}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Unanswered</p>
            <p className="text-2xl font-bold text-gray-700">{details.unansweredCount}</p>
          </div>
        </div>
      )}

      {/* Actions / Next Steps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Certificate Card */}
        {isPassed ? (
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-xl p-6 text-white shadow-lg flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-yellow-400" size={28} />
              <h3 className="text-xl font-bold">Official RBF Certificate</h3>
            </div>
            <p className="text-blue-100 mb-2">You have successfully cleared this assessment and earned an official credential issued by RealBell Business Foundation.</p>
            {(certificate?.certificateId || certificate?.registrationId) && (
              <div className="bg-black/20 rounded-lg p-3 mb-6 font-mono text-sm break-all">
                Certificate ID: {certificate.certificateId || certificate.registrationId}
              </div>
            )}
            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (certificate?._id || certificate?.certificateId) {
                    handleDownloadCertificate(certificate._id || certificate.certificateId);
                  } else {
                    navigate('/my-certificates');
                  }
                }}
                disabled={downloading}
                className="flex-1 bg-white text-blue-900 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-70 text-sm"
              >
                {downloading ? (
                  <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><Download size={18} /> View / Download</>
                )}
              </button>
              <button
                onClick={() => navigate('/my-certificates')}
                className="flex-1 bg-transparent border border-white/30 text-white py-2.5 rounded-lg font-bold hover:bg-white/10 transition-colors text-sm"
              >
                My Credentials
              </button>
            </div>
          </div>
        ) : !isPassed ? (
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>Retake Assessment</h3>
            <p className="text-gray-600 mb-6">You can retake this assessment to improve your score.</p>
            <div className="mt-auto">
              <button
                onClick={() => navigate(`/assessments/${test?._id || ''}`)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-6 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-main)' }}>
            <FileText size={20} className="text-blue-600" />
            Performance Review
          </h3>
          <p className="text-gray-600 mb-6">
            Reviewing your detailed question-by-question performance is not available for this assessment to maintain question bank integrity. Focus your studies on the general domain topics.
          </p>
          <div className="mt-auto">
            <button
              onClick={() => navigate('/assessments')}
              className="w-full py-2.5 border rounded-lg font-bold hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
            >
              Explore Other Assessments
            </button>
          </div>
        </div>
      </div>
        </div>
      </main>
    </div>
  );
};

export default TestResult;


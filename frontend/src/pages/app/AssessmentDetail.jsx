import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Clock, Award, ShieldAlert, CheckCircle, HelpCircle, Calendar, PlayCircle, ArrowLeft } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { COLORS } from '../../components/colors';

const AssessmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTestDetails();
  }, [id]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/tests/${id}`);
      if (res.data.status === 1) {
        const d = res.data.data;
        const testObj = d.test || d;
        setTest({
          ...testObj,
          attemptsHistory: d.pastAttempts || d.attemptsHistory || testObj.attemptsHistory || [],
          userAttemptsCount: d.userAttemptsCount !== undefined ? d.userAttemptsCount : (d.pastAttempts?.length || 0),
          remainingAttempts: d.remainingAttempts
        });
      } else {
        toast.error(res.data.msg || 'Failed to fetch test details');
        navigate('/assessments');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('An error occurred');
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    try {
      setStarting(true);
      const res = await axios.post(`/tests/${id}/start`);
      if (res.data.status === 1) {
        toast.success('Test started successfully!');
        setShowModal(false);
        const attemptId = res.data.data?.attemptId || res.data.data?._id;
        navigate(`/assessments/${id}/take?attempt=${attemptId}`);
      } else {
        toast.error(res.data.msg || 'Failed to start test');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error(error.response?.data?.msg || 'An error occurred while starting the test');
      setShowModal(false);
    } finally {
      setStarting(false);
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (!test) return null;

  const isAvailable = (!test.startDate || new Date() >= new Date(test.startDate)) && (!test.endDate || new Date() <= new Date(test.endDate));
  const hasRemainingAttempts = !test.maxAttempts || (test.userAttemptsCount || 0) < test.maxAttempts;
  const inProgressAttempt = test.attemptsHistory?.find(a => a.status === 'in_progress');
  const totalQuestionsCount = test.numberOfQuestions || test.questions?.length || 0;
  const collaboratingOrgsList = test.collaboratingOrgs || test.collaborators || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen font-sans">
        <button
          onClick={() => navigate('/assessments')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={18} /> Back to Assessments
        </button>

        {/* Hero Section */}
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-2xl p-8 mb-8 shadow-sm">
          <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {test.domain?.name || test.domain || 'General'}
            </span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getDifficultyColor(test.difficulty)}`}>
              {test.difficulty || 'Medium'}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-main)' }}>{test.title}</h1>
          <p className="text-gray-600 text-lg mb-8">{test.description}</p>
          
          {/* Test Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Duration</p>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>{test.duration} mins</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <HelpCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Questions</p>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>{totalQuestionsCount}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total Marks</p>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>{test.totalMarks || 0}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Passing</p>
                <p className="font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>
                  {test.passingPercentage || 50}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-main)' }}>Instructions</h2>
            <div className="prose max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: test.instructions || 'No specific instructions provided. Please read each question carefully before answering.' }} />
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 text-yellow-800">
              <ShieldAlert className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold mb-1">Important Note</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Do not refresh the page or navigate away during the test.</li>
                  <li>Ensure you have a stable internet connection.</li>
                  <li>The test will auto-submit when the timer runs out.</li>
                  {test.negativeMarking && <li>This test contains negative marking for incorrect answers.</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Past Attempts */}
          {test.attemptsHistory && test.attemptsHistory.length > 0 && (
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-main)' }}>Your Past Attempts</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Date</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Score</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Status</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {test.attemptsHistory.map((attempt, idx) => (
                      <tr key={attempt._id || idx} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--color-text-main)' }}>
                          {new Date(attempt.startedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                          {attempt.status === 'submitted' || attempt.status === 'evaluated' 
                            ? `${attempt.obtainedMarks !== undefined ? attempt.obtainedMarks : attempt.score} / ${test.totalMarks || 100} (${attempt.percentage || 0}%)` 
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {attempt.status === 'in_progress' ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">In Progress</span>
                          ) : attempt.passed || attempt.isPassed ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Passed</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Failed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {attempt.status !== 'in_progress' && (
                            <button 
                              onClick={() => navigate(`/assessments/attempts/${attempt._id}/result`)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              View Result
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Action Panel */}
        <div className="space-y-6">
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text-main)' }}>Readiness</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-gray-600">Attempts</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-main)' }}>
                  {test.maxAttempts ? `${test.userAttemptsCount || 0} / ${test.maxAttempts}` : 'Unlimited'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-gray-600">Negative Marking</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-main)' }}>
                  {test.negativeMarking ? `Yes (-${test.negativeMarkValue || 0})` : 'No'}
                </span>
              </div>
              {(test.startDate || test.endDate) && (
                <div className="flex flex-col gap-1 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-gray-600 flex items-center gap-1"><Calendar size={14} /> Availability</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-main)' }}>
                    {test.startDate ? new Date(test.startDate).toLocaleDateString() : 'Anytime'} to {test.endDate ? new Date(test.endDate).toLocaleDateString() : 'Anytime'}
                  </span>
                </div>
              )}
            </div>

            {inProgressAttempt ? (
              <button
                onClick={() => navigate(`/assessments/${id}/take?attempt=${inProgressAttempt._id}`)}
                className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-bold text-lg flex justify-center items-center gap-2 shadow-md"
              >
                <PlayCircle size={20} /> Resume Test
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                disabled={!hasRemainingAttempts || !isAvailable}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg flex justify-center items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayCircle size={20} /> Start Assessment
              </button>
            )}
            
            {!hasRemainingAttempts && (
              <p className="text-red-500 text-sm text-center mt-3 font-medium">You have exhausted all attempts for this assessment.</p>
            )}
            {!isAvailable && (
              <p className="text-amber-500 text-sm text-center mt-3 font-medium">This assessment is not currently active.</p>
            )}
            
            {collaboratingOrgsList.length > 0 && (
              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs text-gray-500 text-center mb-3">In collaboration with</p>
                <div className="flex justify-center items-center gap-4 flex-wrap">
                  {collaboratingOrgsList.map(c => {
                    console.log(c)
                    return (
                    <div key={c._id || c.name || c} className="flex flex-col items-center">
                      {c.logo ? (
                        <img src={c.logo.url} className="h-10 object-contain mb-1" />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold mb-1">
                          {(c.name || String(c)).charAt(0)}
                        </div>
                      )}
                      <span className="text-xs text-gray-600">{c.name || c}</span>
                    </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div style={{ background: 'var(--color-card)' }} className="w-full max-w-md rounded-xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-main)' }}>Ready to begin?</h3>
            <p className="text-gray-600 mb-6">
              You are about to start <strong>{test.title}</strong>. You will have <strong>{test.duration} minutes</strong> to complete it. The timer will begin immediately and you cannot pause the test once started.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                disabled={starting}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleStartTest}
                disabled={starting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
              >
                {starting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  'Yes, Start Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default AssessmentDetail;

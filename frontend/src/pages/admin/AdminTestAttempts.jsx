import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../services/axios';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, X, Award } from 'lucide-react';
import AdminLayout from './AdminLayout';

export default function AdminTestAttempts() {
  const params = useParams();
  const testId = params.id || params.testId;
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (testId) {
      fetchData();
    }
  }, [testId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testRes, attemptsRes] = await Promise.all([
        axios.get(`/assessments/tests/${testId}`),
        axios.get(`/assessments/tests/${testId}/attempts`)
      ]);
      
      if (testRes.data.status === 1) setTestInfo(testRes.data.data);
      if (attemptsRes.data.status === 1) {
        const payload = attemptsRes.data.data;
        const list = Array.isArray(payload) ? payload : (payload?.attempts || []);
        setAttempts(list);
      } else {
        setAttempts([]);
      }
    } catch (error) {
      console.error('Error loading attempt details:', error);
      toast.error('Failed to load attempt details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (attempt) => {
    setSelectedAttempt(attempt);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/assessments/attempts/${attempt._id}`);
      if (res.data.status === 1) {
        setAttemptDetail(res.data.data);
      } else {
        toast.error('Failed to load full attempt details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching attempt evaluation details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGradeAnswer = async (questionId, isCorrect, marksAwarded, comment) => {
    if (!selectedAttempt) return;
    try {
      setEvaluating(true);
      const res = await axios.put(`/assessments/attempts/${selectedAttempt._id}/evaluate`, {
        questionId,
        isCorrect,
        marksAwarded: Number(marksAwarded),
        comment
      });
      if (res.data.status === 1) {
        toast.success('Answer evaluated successfully');
        handleOpenReview(selectedAttempt);
        fetchData();
      } else {
        toast.error(res.data.msg || 'Evaluation failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <AdminLayout title="Test Attempts">
      <div className="p-6 flex flex-col gap-6">
        <button 
          onClick={() => navigate('/admin/assessments')}
          className="flex items-center gap-2 w-fit hover:underline text-sm font-medium"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          <ArrowLeft size={16} /> Back to Assessments
        </button>

        {testInfo && (
          <div className="p-4 rounded-xl shadow-sm border flex justify-between items-center" style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)' }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>{testInfo.title}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--admin-text-muted)' }}>
                {testInfo.domain?.name || 'General'} • Total Marks: {testInfo.totalMarks || 0} • Pass %: {testInfo.passingPercentage || 50}%
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{attempts.length}</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">Total Attempts</div>
            </div>
          </div>
        )}

        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)' }}>
          <table className="w-full text-left border-collapse">
            <thead style={{ background: 'var(--admin-input-bg)' }}>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Candidate</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Attempt #</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Status</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Score</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Date</th>
                <th className="p-4 font-semibold text-sm text-right" style={{ color: 'var(--admin-text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading attempts...</td></tr>
              ) : attempts.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No attempts found for this test.</td></tr>
              ) : (
                attempts.map(attempt => {
                  const candidateName = attempt.user?.name || attempt.user?.company_name || attempt.candidate?.name || 'Candidate';
                  const candidateEmail = attempt.user?.email || attempt.candidate?.email || 'N/A';
                  const scoreVal = attempt.obtainedMarks !== undefined ? attempt.obtainedMarks : (attempt.score || 0);
                  const isPass = Boolean(attempt.passed || attempt.isPassed);

                  return (
                    <tr key={attempt._id} className="hover:bg-gray-500/5 transition-colors" style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                      <td className="p-4">
                        <div className="font-medium" style={{ color: 'var(--admin-text-primary)' }}>{candidateName}</div>
                        <div className="text-xs text-gray-500">{candidateEmail}</div>
                      </td>
                      <td className="p-4 text-sm font-medium" style={{ color: 'var(--admin-text-primary)' }}>{attempt.attemptNumber}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {isPass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm" style={{ color: 'var(--admin-text-primary)' }}>{scoreVal} / {testInfo?.totalMarks || attempt.totalMarks || 100}</div>
                        <div className="text-xs text-gray-500">{attempt.percentage}%</div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{new Date(attempt.createdAt || attempt.startedAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleOpenReview(attempt)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors shadow-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Attempt Review Modal */}
        {selectedAttempt && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl rounded-2xl border p-6 flex flex-col gap-6 my-8 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)' }}>
              <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                <div>
                  <h3 className="font-bold text-xl" style={{ color: 'var(--admin-text-primary)' }}>Attempt Review</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Candidate: {selectedAttempt.user?.name || selectedAttempt.user?.company_name || 'Candidate'} ({selectedAttempt.user?.email})
                  </p>
                </div>
                <button onClick={() => setSelectedAttempt(null)} className="text-gray-400 hover:text-gray-200 text-xl font-bold">✕</button>
              </div>

              {loadingDetail ? (
                <div className="p-12 text-center text-gray-500">Loading attempt answers & evaluation data...</div>
              ) : attemptDetail ? (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-gray-500/5" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                    <div>
                      <span className="text-xs text-gray-400 block">Score</span>
                      <span className="text-xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>
                        {attemptDetail.obtainedMarks} / {attemptDetail.totalMarks || testInfo?.totalMarks || 100}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Percentage</span>
                      <span className="text-xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>
                        {attemptDetail.percentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Result</span>
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${attemptDetail.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {attemptDetail.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Status</span>
                      <span className="text-sm font-semibold capitalize" style={{ color: 'var(--admin-text-primary)' }}>
                        {attemptDetail.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Answers Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-base" style={{ color: 'var(--admin-text-primary)' }}>Submitted Answers ({attemptDetail.answers?.length || 0})</h4>
                    
                    {(!attemptDetail.answers || attemptDetail.answers.length === 0) ? (
                      <p className="text-sm text-gray-500 p-4">No answers recorded for this attempt.</p>
                    ) : (
                      attemptDetail.answers.map((ans, idx) => {
                        const q = ans.question || {};
                        return (
                          <div key={idx} className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--admin-border-subtle)', background: 'var(--admin-input-bg)' }}>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                Q{idx + 1} • {q.questionType?.replace('_', ' ') || 'Question'}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${ans.isCorrect ? 'bg-green-100 text-green-800' : ans.isCorrect === false ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                Marks: {ans.marksAwarded || 0} / {q.marks || 1}
                              </span>
                            </div>

                            <p className="font-medium text-sm" style={{ color: 'var(--admin-text-primary)' }}>
                              {q.questionText || 'Question statement'}
                            </p>

                            {/* Candidate's Response */}
                            <div className="text-xs space-y-1 p-3 rounded-lg border bg-black/10" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                              <span className="text-gray-400 block font-semibold">Candidate Answer:</span>
                              {ans.selectedOptions && ans.selectedOptions.length > 0 ? (
                                <div>Selected Option Index: <strong>{ans.selectedOptions.join(', ')}</strong></div>
                              ) : ans.numericalAnswer !== null && ans.numericalAnswer !== undefined ? (
                                <div>Numerical Value: <strong>{ans.numericalAnswer}</strong></div>
                              ) : ans.textAnswer ? (
                                <div className="whitespace-pre-wrap font-sans"><strong>{ans.textAnswer}</strong></div>
                              ) : (
                                <span className="text-gray-500 italic">No answer provided</span>
                              )}
                            </div>

                            {/* Manual Grading for Text Questions */}
                            {(q.questionType === 'text_long' || q.questionType === 'text_short') && (
                              <div className="flex flex-wrap items-center gap-3 pt-2 border-t" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                                <span className="text-xs font-semibold text-gray-400">Manual Grade:</span>
                                <button 
                                  onClick={() => handleGradeAnswer(q._id, true, q.marks || 1, 'Graded correct by admin')}
                                  disabled={evaluating}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                                >
                                  Award Full Marks ({q.marks || 1})
                                </button>
                                <button 
                                  onClick={() => handleGradeAnswer(q._id, false, 0, 'Graded incorrect by admin')}
                                  disabled={evaluating}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                                >
                                  Mark 0
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

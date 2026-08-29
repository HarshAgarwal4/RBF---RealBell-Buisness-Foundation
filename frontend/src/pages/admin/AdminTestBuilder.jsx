import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../services/axios';
import { Save, Plus, ArrowLeft, ArrowRight, Check, Trash2, HelpCircle, Building2, Award } from 'lucide-react';
import AdminLayout from './AdminLayout';

export default function AdminTestBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(isEdit);
  
  const [domains, setDomains] = useState([]);
  const [collaboratorsList, setCollaboratorsList] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    domain: '',
    difficulty: 'medium',
    duration: 60,
    totalMarks: 0,
    passingMarks: 40,
    passingPercentage: 50,
    instructions: '',
    maxAttempts: 1,
    negativeMarking: false,
    negativeMarkValue: 0,
    randomQuestionSelection: false,
    randomOptionOrdering: false,
    questions: [],
    collaboratingOrgs: [],
    certificateTemplate: '',
    certificateValidityDays: 0
  });

  useEffect(() => {
    fetchOptions();
    if (isEdit) {
      fetchTest();
    }
  }, [id]);

  const fetchOptions = async () => {
    try {
      const [domRes, colRes, tmpRes, qRes] = await Promise.all([
        axios.get('/assessments/domains'),
        axios.get('/assessments/collaborators?status=active'),
        axios.get('/certificates/templates'),
        axios.get('/assessments/questions')
      ]);
      if (domRes.data.status === 1) {
        setDomains(domRes.data.data || []);
        if (domRes.data.data?.length > 0 && !testData.domain) {
          setTestData(prev => ({ ...prev, domain: domRes.data.data[0]._id }));
        }
      }
      if (colRes.data.status === 1) setCollaboratorsList(colRes.data.data || []);
      if (tmpRes.data.status === 1) setTemplatesList(tmpRes.data.data || []);
      if (qRes.data.status === 1) {
        const payload = qRes.data.data;
        setBankQuestions(Array.isArray(payload) ? payload : payload?.questions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTest = async () => {
    try {
      const res = await axios.get(`/assessments/tests/${id}`);
      if (res.data.status === 1) {
        const d = res.data.data;
        setTestData({
          ...d,
          domain: d.domain?._id || d.domain,
          collaboratingOrgs: d.collaboratingOrgs?.map(c => c._id || c) || [],
          certificateTemplate: d.certificateTemplate?._id || d.certificateTemplate || '',
          questions: d.questions?.map(q => ({
            question: q.question?._id || q.question,
            order: q.order || 0,
            marks: q.marks || q.question?.marks || 1,
            questionText: q.question?.questionText || 'Question item',
            questionType: q.question?.questionType || 'mcq_single'
          })) || []
        });
      }
    } catch (err) {
      toast.error('Failed to fetch test details');
    } finally {
      setLoading(false);
    }
  };

  const addQuestionFromBank = (q) => {
    if (testData.questions.some(item => (item.question === q._id || item.question?._id === q._id))) {
      return toast.info('Question already added to this assessment');
    }
    const updated = [
      ...testData.questions,
      {
        question: q._id,
        order: testData.questions.length + 1,
        marks: q.marks || 1,
        questionText: q.questionText,
        questionType: q.questionType
      }
    ];
    const totalM = updated.reduce((acc, curr) => acc + Number(curr.marks || 0), 0);
    setTestData(prev => ({ ...prev, questions: updated, totalMarks: totalM }));
    toast.success('Question added to test');
  };

  const removeQuestion = (index) => {
    const updated = testData.questions.filter((_, i) => i !== index);
    const totalM = updated.reduce((acc, curr) => acc + Number(curr.marks || 0), 0);
    setTestData(prev => ({ ...prev, questions: updated, totalMarks: totalM }));
  };

  const handleSave = async (publish = false) => {
    if (!testData.title.trim()) return toast.error('Test title is required');
    if (!testData.domain) return toast.error('Please assign a domain to the test');
    if (publish && (!testData.questions || testData.questions.length === 0)) {
      return toast.error('Please add at least one question before publishing');
    }

    try {
      const sanitizedQuestions = (testData.questions || [])
        .filter(q => q && (q.question?._id || q.question))
        .map((q, idx) => ({
          question: q.question?._id || q.question,
          order: idx + 1,
          marks: Number(q.marks) || 1
        }));

      const payload = {
        title: testData.title.trim(),
        description: testData.description || '',
        domain: testData.domain,
        difficulty: testData.difficulty || 'medium',
        duration: Number(testData.duration) || 60,
        totalMarks: sanitizedQuestions.reduce((sum, q) => sum + q.marks, 0),
        passingMarks: Number(testData.passingMarks) || 0,
        passingPercentage: Number(testData.passingPercentage) || 50,
        instructions: testData.instructions || '',
        maxAttempts: Number(testData.maxAttempts) || 1,
        negativeMarking: Boolean(testData.negativeMarking),
        negativeMarkValue: Number(testData.negativeMarkValue) || 0,
        randomQuestionSelection: Boolean(testData.randomQuestionSelection),
        randomOptionOrdering: Boolean(testData.randomOptionOrdering),
        questions: sanitizedQuestions,
        numberOfQuestions: sanitizedQuestions.length,
        collaboratingOrgs: (testData.collaboratingOrgs || []).filter(Boolean),
        certificateTemplate: testData.certificateTemplate ? testData.certificateTemplate : undefined,
        certificateValidityDays: Number(testData.certificateValidityDays) || 0,
        status: publish ? 'published' : 'draft'
      };

      const res = isEdit 
        ? await axios.put(`/assessments/tests/${id}`, payload)
        : await axios.post('/assessments/tests', payload);
        
      if (res.data.status === 1) {
        toast.success(`Assessment ${publish ? 'published' : 'saved as draft'} successfully!`);
        navigate('/admin/assessments');
      } else {
        toast.error(res.data.msg || 'Failed to save test');
      }
    } catch (err) {
      console.error('Error saving test:', err);
      toast.error(err.response?.data?.msg || 'Error saving test');
    }
  };

  const steps = [
    'Test Details', 'Questions', 'Settings', 'Collaboration', 'Certificate', 'Review'
  ];

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="p-12 text-center text-gray-400">Loading assessment details...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Assessment' : 'Create Assessment'}>
      <div className="p-3 sm:p-6 max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
        
        {/* Mobile Step Badge */}
        <div className="sm:hidden text-center">
          <span className="inline-block text-xs font-semibold py-1 px-3 bg-indigo-950 text-indigo-300 rounded-full border border-indigo-800/50">
            Step {step} of 6: {steps[step - 1]}
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 transition-colors cursor-pointer"
                onClick={() => setStep(i + 1)}
                style={{
                  background: step > i + 1 ? 'var(--admin-success, #10b981)' : step === i + 1 ? 'var(--admin-primary, #6366f1)' : 'var(--admin-input-bg, #1e293b)',
                  color: step >= i + 1 ? '#fff' : 'var(--admin-text-muted, #94a3b8)',
                  border: `2px solid ${step >= i + 1 ? 'transparent' : 'var(--admin-border-subtle, rgba(255,255,255,0.1))'}`
                }}
              >
                {step > i + 1 ? <Check size={14} className="sm:w-4 sm:h-4" /> : i + 1}
              </div>
              <span className="hidden sm:block text-xs mt-2 text-center font-medium" style={{ color: step === i + 1 ? 'var(--admin-text-primary, #fff)' : 'var(--admin-text-muted, #94a3b8)' }}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div 
                  className="absolute top-3.5 sm:top-4 left-1/2 w-full h-0.5 -z-0"
                  style={{ background: step > i + 1 ? 'var(--admin-success, #10b981)' : 'var(--admin-border-subtle, rgba(255,255,255,0.1))' }}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 rounded-lg shadow-sm border" style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)' }}>
          
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>1. Basic Assessment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Assessment Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Fundamental Business Valuation & Ethics"
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.title} 
                    onChange={e => setTestData({...testData, title: e.target.value})} 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Domain *</label>
                  <select 
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.domain} 
                    onChange={e => setTestData({...testData, domain: e.target.value})}
                  >
                    <option value="">Select Domain</option>
                    {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Difficulty</label>
                  <select 
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.difficulty} 
                    onChange={e => setTestData({...testData, difficulty: e.target.value})}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    min="1"
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.duration} 
                    onChange={e => setTestData({...testData, duration: Number(e.target.value)})} 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Passing Percentage (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.passingPercentage} 
                    onChange={e => setTestData({...testData, passingPercentage: Number(e.target.value)})} 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Max Allowed Attempts (0 = unlimited)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.maxAttempts} 
                    onChange={e => setTestData({...testData, maxAttempts: Number(e.target.value)})} 
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Overview / Description</label>
                  <textarea 
                    className="p-2 text-sm rounded border outline-none" 
                    rows={2} 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.description} 
                    onChange={e => setTestData({...testData, description: e.target.value})}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Candidate Instructions (Shown before starting test)</label>
                  <textarea 
                    className="p-2 text-sm rounded border outline-none" 
                    rows={3} 
                    placeholder="e.g. Ensure a stable internet connection. All questions carry equal marks..."
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.instructions} 
                    onChange={e => setTestData({...testData, instructions: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>2. Assessment Questions</h3>
                  <p className="text-xs text-gray-400">Total Marks: {testData.totalMarks || 0} • Questions: {testData.questions.length}</p>
                </div>
                <button 
                  onClick={() => setShowQuestionModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
                >
                  <Plus size={16}/> Select from Question Bank
                </button>
              </div>

              {showQuestionModal && (
                <div className="p-4 border rounded-lg flex flex-col gap-3" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>Available Question Bank Items</h4>
                    <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 text-xs">Done</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {bankQuestions.length === 0 ? (
                      <p className="text-xs text-gray-400">No questions found in bank. Add questions first in Question Bank module.</p>
                    ) : (
                      bankQuestions.map(q => (
                        <div key={q._id} className="p-2 border rounded flex justify-between items-center text-xs" style={{ borderColor: 'var(--admin-border-subtle)', background: 'var(--admin-card-bg)' }}>
                          <div className="flex-1 pr-3">
                            <span className="font-medium" style={{ color: 'var(--admin-text-primary)' }}>{q.questionText}</span>
                            <span className="text-gray-400 ml-2">({q.questionType}, {q.marks}m)</span>
                          </div>
                          <button 
                            onClick={() => addQuestionFromBank(q)}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px]"
                          >
                            + Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {testData.questions.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-lg text-gray-400 text-sm" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                    No questions added yet. Click &quot;Select from Question Bank&quot; to attach questions.
                  </div>
                ) : (
                  testData.questions.map((q, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded border flex justify-between items-center text-sm"
                      style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-900/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--admin-text-primary)' }}>{q.questionText}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{q.questionType} • Marks: {q.marks}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeQuestion(idx)}
                        className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                        title="Remove question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>3. Assessment & Grading Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded border cursor-pointer" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <input 
                    type="checkbox" 
                    checked={testData.randomQuestionSelection} 
                    onChange={e => setTestData({...testData, randomQuestionSelection: e.target.checked})} 
                  />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>Randomize Question Order</div>
                    <div className="text-xs text-gray-400">Shuffles questions so each candidate sees a randomized order.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded border cursor-pointer" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <input 
                    type="checkbox" 
                    checked={testData.randomOptionOrdering} 
                    onChange={e => setTestData({...testData, randomOptionOrdering: e.target.checked})} 
                  />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>Randomize Option Ordering</div>
                    <div className="text-xs text-gray-400">Shuffles MCQ options for each candidate.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded border cursor-pointer" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <input 
                    type="checkbox" 
                    checked={testData.negativeMarking} 
                    onChange={e => setTestData({...testData, negativeMarking: e.target.checked})} 
                  />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>Enable Negative Marking</div>
                    <div className="text-xs text-gray-400">Deduct marks for incorrect answers.</div>
                  </div>
                </label>

                {testData.negativeMarking && (
                  <div className="p-3 rounded border" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Negative Mark Penalty per Incorrect Answer</label>
                    <input 
                      type="number" 
                      step="0.25" 
                      min="0"
                      className="p-2 text-sm rounded border outline-none w-48"
                      style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                      value={testData.negativeMarkValue}
                      onChange={e => setTestData({...testData, negativeMarkValue: Number(e.target.value)})}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Collaboration */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>4. Partner Collaboration (Optional)</h3>
                <p className="text-xs text-gray-400">RealBell Business Foundation remains the primary issuer. Select partner organizations to co-brand.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {collaboratorsList.length === 0 ? (
                  <div className="col-span-full text-center p-6 border rounded text-gray-400 text-xs" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                    No collaborating organizations registered. This test will be issued solely by RealBell Business Foundation.
                  </div>
                ) : (
                  collaboratorsList.map(org => {
                    const isSelected = testData.collaboratingOrgs.includes(org._id);
                    return (
                      <div 
                        key={org._id} 
                        onClick={() => {
                          const updated = isSelected 
                            ? testData.collaboratingOrgs.filter(id => id !== org._id)
                            : [...testData.collaboratingOrgs, org._id];
                          setTestData({...testData, collaboratingOrgs: updated});
                        }}
                        className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-900/20' : ''}`}
                        style={{ background: isSelected ? undefined : 'var(--admin-input-bg)', borderColor: isSelected ? undefined : 'var(--admin-border-subtle)' }}
                      >
                        <input type="checkbox" checked={isSelected} readOnly />
                        <div>
                          <div className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{org.name}</div>
                          <div className="text-xs text-gray-400">{org.website || 'Partner organization'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Step 5: Certificate */}
          {step === 5 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>5. Certificate Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Certificate Template</label>
                  <select 
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.certificateTemplate} 
                    onChange={e => setTestData({...testData, certificateTemplate: e.target.value})}
                  >
                    <option value="">Default (Auto-select by Collaboration Status)</option>
                    {templatesList.map(t => (
                      <option key={t._id} value={t._id}>{t.name} ({t.type})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Certificate Validity (Days, 0 = No Expiry)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="p-2 text-sm rounded border outline-none" 
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} 
                    value={testData.certificateValidityDays} 
                    onChange={e => setTestData({...testData, certificateValidityDays: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border text-xs text-gray-400 space-y-1" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                <div className="font-semibold text-white flex items-center gap-1.5"><Award size={16} /> Certificate Issuance Guarantee</div>
                <div>• All passing certificates are issued with unique <strong>RBF Registration ID</strong> and <strong>Certificate ID</strong>.</div>
                <div>• Includes instant public QR verification at <code>/verify/certificate/:id</code>.</div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>6. Review Assessment</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded border" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <div className="text-xs text-gray-400">Duration</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{testData.duration} mins</div>
                </div>
                <div className="p-3 rounded border" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <div className="text-xs text-gray-400">Questions</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{testData.questions.length} Qs</div>
                </div>
                <div className="p-3 rounded border" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <div className="text-xs text-gray-400">Total Marks</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{testData.totalMarks} Marks</div>
                </div>
                <div className="p-3 rounded border" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                  <div className="text-xs text-gray-400">Pass Requirement</div>
                  <div className="font-bold text-sm text-green-400">{testData.passingPercentage}%</div>
                </div>
              </div>

              <div className="p-4 rounded border" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
                <h4 className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{testData.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{testData.description || 'No description provided.'}</p>
                <div className="mt-2 text-xs text-indigo-400">
                  {testData.collaboratingOrgs.length > 0 
                    ? `Co-certified with ${testData.collaboratingOrgs.length} partner organization(s)` 
                    : 'RealBell Business Foundation sole issuing certification'}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-3 mt-2">
          <button 
            disabled={step === 1}
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className="px-3.5 sm:px-4 py-2 rounded-md flex items-center gap-1.5 sm:gap-2 border text-xs sm:text-sm font-medium disabled:opacity-30"
            style={{ borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
          >
            <ArrowLeft size={14} /> Previous
          </button>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {step < 6 && (
              <button 
                onClick={() => handleSave(false)}
                className="px-3.5 sm:px-4 py-2 rounded-md flex items-center gap-1.5 sm:gap-2 border text-xs sm:text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
              >
                <Save size={14} /> Save Draft
              </button>
            )}
            {step === 6 ? (
              <>
                <button 
                  onClick={() => handleSave(false)}
                  className="px-3.5 sm:px-4 py-2 rounded-md flex items-center gap-1.5 sm:gap-2 border text-xs sm:text-sm font-medium hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                >
                  <Save size={14} /> Save Draft
                </button>
                <button 
                  onClick={() => handleSave(true)}
                  className="px-4 sm:px-5 py-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-white bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm font-medium shadow-sm"
                >
                  <Check size={14} /> Save & Publish
                </button>
              </>
            ) : (
              <button 
                onClick={() => setStep(s => Math.min(6, s + 1))}
                className="px-4 sm:px-5 py-2 rounded-md flex items-center gap-1.5 sm:gap-2 text-white bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm font-medium shadow-sm"
              >
                Next <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}


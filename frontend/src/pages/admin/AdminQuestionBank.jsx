import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../services/axios';
import { Plus, Search, Edit, Trash2, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import AdminLayout from './AdminLayout';

export default function AdminQuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('mcq_single');
  const [marks, setMarks] = useState(1);
  const [negativeMark, setNegativeMark] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [tolerance, setTolerance] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [domains, setDomains] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [search, typeFilter, domainFilter]);

  const fetchDomains = async () => {
    try {
      const res = await axios.get('/assessments/domains');
      if (res.data.status === 1) {
        setDomains(res.data.data || []);
        if (res.data.data?.length > 0 && !selectedDomain) {
          setSelectedDomain(res.data.data[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/questions', {
        params: { 
          search, 
          questionType: typeFilter || undefined,
          domain: domainFilter || undefined
        }
      });
      if (res.data.status === 1) {
        const payload = res.data.data;
        const qList = Array.isArray(payload) ? payload : (payload?.questions || []);
        setQuestions(qList);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionType('mcq_single');
    setMarks(1);
    setNegativeMark(0);
    setDifficulty('medium');
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setCorrectAnswer('');
    setTolerance(0);
    setExplanation('');
    if (domains.length > 0) setSelectedDomain(domains[0]._id);
    setShowModal(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setQuestionText(q.questionText || '');
    setQuestionType(q.questionType || 'mcq_single');
    setMarks(q.marks !== undefined ? q.marks : 1);
    setNegativeMark(q.negativeMark !== undefined ? q.negativeMark : 0);
    setDifficulty(q.difficulty || 'medium');
    setSelectedDomain(q.domain?._id || q.domain || (domains.length > 0 ? domains[0]._id : ''));
    
    if (q.options && q.options.length > 0) {
      setOptions(q.options.map(opt => ({
        text: typeof opt === 'string' ? opt : (opt.text || ''),
        isCorrect: Boolean(opt.isCorrect)
      })));
    } else {
      setOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
    }
    
    setCorrectAnswer(q.correctAnswer || '');
    setTolerance(q.tolerance || 0);
    setExplanation(q.explanation || '');
    setShowModal(true);
  };

  const handleAddOption = () => {
    setOptions(prev => [...prev, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length <= 2) {
      return toast.warn('A multiple choice question must have at least 2 options');
    }
    setOptions(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return toast.error('Question prompt is required');
    if (!selectedDomain) return toast.error('Please select a domain');

    const cleanOptions = questionType.startsWith('mcq') 
      ? options.map(o => ({ text: o.text.trim(), isCorrect: Boolean(o.isCorrect) })).filter(o => o.text)
      : [];

    if (questionType.startsWith('mcq')) {
      if (cleanOptions.length < 2) return toast.error('Please provide at least 2 non-empty options for multiple choice');
      if (!cleanOptions.some(o => o.isCorrect)) return toast.error('Please mark at least one option as the correct answer');
    }

    if (questionType === 'numerical' && (correctAnswer === '' || correctAnswer === null || correctAnswer === undefined)) {
      return toast.error('Please specify the correct numerical value');
    }

    const payload = {
      questionText: questionText.trim(),
      questionType,
      domain: selectedDomain,
      marks: Number(marks) || 1,
      negativeMark: Number(negativeMark) || 0,
      difficulty,
      options: cleanOptions,
      correctAnswer: questionType === 'numerical' ? String(correctAnswer) : undefined,
      tolerance: questionType === 'numerical' ? Number(tolerance) || 0 : undefined,
      explanation: explanation.trim() || undefined
    };

    try {
      setSaving(true);
      if (editingQuestion) {
        const res = await axios.put(`/assessments/questions/${editingQuestion._id}`, payload);
        if (res.data.status === 1) {
          toast.success('Question updated successfully');
          setShowModal(false);
          fetchQuestions();
        } else {
          toast.error(res.data.msg || 'Failed to update question');
        }
      } else {
        const res = await axios.post('/assessments/questions', payload);
        if (res.data.status === 1) {
          toast.success('Question created and added to bank');
          setShowModal(false);
          fetchQuestions();
        } else {
          toast.error(res.data.msg || 'Failed to create question');
        }
      }
    } catch (err) {
      console.error('Error saving question:', err);
      toast.error(err.response?.data?.msg || 'Error saving question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;
    try {
      const res = await axios.delete(`/assessments/questions/${id}`);
      if (res.data.status === 1) {
        toast.success('Question deleted successfully');
        fetchQuestions();
      } else {
        toast.error(res.data.msg || 'Failed to delete question');
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error(err.response?.data?.msg || 'Error deleting question');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await axios.post(`/assessments/questions/${id}/duplicate`);
      if (res.data.status === 1) {
        toast.success('Question duplicated successfully');
        fetchQuestions();
      } else {
        toast.error(res.data.msg || 'Failed to duplicate question');
      }
    } catch (err) {
      console.error('Error duplicating question:', err);
      toast.error(err.response?.data?.msg || 'Error duplicating question');
    }
  };

  return (
    <AdminLayout title="Question Bank">
      <div className="p-3 sm:p-6 flex flex-col gap-4 sm:gap-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search questions..." 
                className="w-full pl-9 pr-3 py-2 rounded-md border outline-none text-xs sm:text-sm"
                style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 rounded-md border outline-none text-xs sm:text-sm"
              style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option value="">All Domains</option>
              {domains.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
            <select 
              className="px-3 py-2 rounded-md border outline-none text-xs sm:text-sm"
              style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Question Types</option>
              <option value="mcq_single">Single Choice (MCQ)</option>
              <option value="mcq_multiple">Multiple Choice</option>
              <option value="text_short">Short Answer</option>
              <option value="text_long">Long Answer</option>
              <option value="numerical">Numerical</option>
            </select>
          </div>

          <button 
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-md text-xs sm:text-sm font-medium shadow"
            style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
          >
            <Plus size={16} /> Add Question
          </button>
        </div>

        {/* Question Modal (Add or Edit) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <form onSubmit={handleSaveQuestion} className="w-full max-w-3xl rounded-xl border p-6 flex flex-col gap-4 my-8 shadow-2xl" style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)' }}>
              <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                <h3 className="font-bold text-lg" style={{ color: 'var(--admin-text-primary)' }}>
                  {editingQuestion ? 'Edit Question' : 'Add New Question to Bank'}
                </h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200 text-lg">✕</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-medium">Domain *</label>
                  <select 
                    className="w-full p-2.5 text-sm rounded-lg border outline-none"
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    required
                  >
                    {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-medium">Question Type *</label>
                  <select 
                    className="w-full p-2.5 text-sm rounded-lg border outline-none"
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                  >
                    <option value="mcq_single">Single Choice (MCQ)</option>
                    <option value="mcq_multiple">Multiple Choice (Multiple)</option>
                    <option value="text_short">Short Text (Auto-graded)</option>
                    <option value="text_long">Long / Descriptive (Manual)</option>
                    <option value="numerical">Numerical Value</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1 font-medium">Difficulty & Marks *</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-1/2 p-2.5 text-sm rounded-lg border outline-none capitalize"
                      style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <input 
                      type="number"
                      min="1"
                      className="w-1/2 p-2.5 text-sm rounded-lg border outline-none"
                      style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                      placeholder="Marks"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      title="Marks awarded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Question Statement / Prompt *</label>
                <textarea 
                  rows="3"
                  placeholder="Enter the question problem statement or text here..." 
                  className="w-full p-3 text-sm rounded-lg border outline-none"
                  style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </div>

              {/* MCQ Options Configuration */}
              {questionType.startsWith('mcq') && (
                <div className="space-y-3 bg-gray-500/5 p-4 rounded-xl border" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-300 font-semibold block">
                      Options & Correct Answer Choice(s) — Check the radio/checkbox next to the right answer:
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>
                  
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        type={questionType === 'mcq_single' ? 'radio' : 'checkbox'} 
                        name="correct_option_choice"
                        title="Mark as correct answer"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          if (questionType === 'mcq_single') {
                            setOptions(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
                          } else {
                            const copy = [...options];
                            copy[idx].isCorrect = e.target.checked;
                            setOptions(copy);
                          }
                        }}
                        className="w-5 h-5 cursor-pointer accent-blue-600"
                      />
                      <input 
                        type="text" 
                        placeholder={`Option ${idx + 1} text...`}
                        className="flex-1 p-2 text-sm rounded-lg border outline-none"
                        style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                        value={opt.text}
                        onChange={(e) => {
                          const copy = [...options];
                          copy[idx].text = e.target.value;
                          setOptions(copy);
                        }}
                        required
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Remove this option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Numerical Options */}
              {questionType === 'numerical' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-500/5 p-4 rounded-xl border" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-medium">Exact Correct Numerical Value *</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full p-2.5 text-sm rounded-lg border outline-none"
                      style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                      placeholder="e.g. 42 or 3.1415"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1 font-medium">Accepted Tolerance (±)</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full p-2.5 text-sm rounded-lg border outline-none"
                      style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                      placeholder="e.g. 0.05"
                      value={tolerance}
                      onChange={(e) => setTolerance(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Short Text Exact Match */}
              {questionType === 'text_short' && (
                <div className="bg-gray-500/5 p-4 rounded-xl border" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                  <label className="text-xs text-gray-400 block mb-1 font-medium">Exact Expected Answer Text</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 text-sm rounded-lg border outline-none"
                    style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                    placeholder="e.g. HyperText Markup Language"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Candidate answers will be compared case-insensitively.</p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Explanation (Optional review rationale)</label>
                <textarea 
                  rows="2"
                  placeholder="Optional rationale shown in performance reports..." 
                  className="w-full p-2.5 text-sm rounded-lg border outline-none"
                  style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  disabled={saving}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions Table */}
        <div className="rounded-xl shadow-sm border overflow-x-auto" style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)' }}>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead style={{ background: 'var(--admin-input-bg)' }}>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Question Prompt</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Domain</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Type</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Difficulty</th>
                <th className="p-4 font-semibold text-sm" style={{ color: 'var(--admin-text-muted)' }}>Marks</th>
                <th className="p-4 font-semibold text-sm text-right" style={{ color: 'var(--admin-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading questions...</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No questions found matching your criteria.</td></tr>
              ) : (
                questions.map(q => (
                  <tr key={q._id} className="hover:bg-gray-500/5 transition-colors" style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td className="p-4">
                      <p className="font-medium truncate max-w-sm" style={{ color: 'var(--admin-text-primary)' }} title={q.questionText}>
                        {q.questionText}
                      </p>
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'var(--admin-text-primary)' }}>
                      {q.domain?.name || q.domain || 'General'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium uppercase tracking-wider">
                        {q.questionType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize
                        ${q.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 
                          q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
                      {q.marks || 1}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(q)} 
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" 
                        title="Edit Question"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDuplicate(q._id)} 
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" 
                        title="Duplicate Question"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(q._id)} 
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" 
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

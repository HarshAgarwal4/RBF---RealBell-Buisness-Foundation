import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, Check } from 'lucide-react';

const TestTaking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract attempt ID from query string
  const queryParams = new URLSearchParams(location.search);
  const attemptId = queryParams.get('attempt');

  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!attemptId) {
      toast.error('No attempt specified');
      navigate('/app/assessments');
      return;
    }
    fetchTestData();

    // Prevent accidental navigation
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, attemptId]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [timeLeft, isSubmitting]);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/tests/attempts/${attemptId}`);
      if (res.data.status === 1) {
        const attemptData = res.data.data;
        if (attemptData.status !== 'in_progress') {
          toast.info('This attempt is already completed.');
          navigate(`/assessments/attempts/${attemptId}/result`);
          return;
        }
        
        setAttempt(attemptData);
        setTest(attemptData.test || {});
        
        // Initialize answers from existing attempt data
        const initialAnswers = {};
        if (attemptData.answers && Array.isArray(attemptData.answers)) {
          attemptData.answers.forEach(resp => {
            const qId = (resp.question?._id || resp.question || '').toString();
            if (resp.selectedOptions?.length > 0) {
              initialAnswers[qId] = resp.selectedOptions.length === 1 ? resp.selectedOptions[0] : resp.selectedOptions;
            } else if (resp.textAnswer) {
              initialAnswers[qId] = resp.textAnswer;
            } else if (resp.numericalAnswer !== null && resp.numericalAnswer !== undefined) {
              initialAnswers[qId] = resp.numericalAnswer;
            }
          });
        }
        setAnswers(initialAnswers);
        
        // Set time left based on server deadline / remainingSeconds
        if (attemptData.remainingSeconds !== undefined && attemptData.remainingSeconds !== null) {
          setTimeLeft(attemptData.remainingSeconds);
        } else if (attemptData.serverDeadline) {
          const now = new Date().getTime();
          const deadline = new Date(attemptData.serverDeadline).getTime();
          const diffSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
          setTimeLeft(diffSeconds);
          
          if (diffSeconds === 0) {
            handleAutoSubmit();
          }
        }
      } else {
        toast.error(res.data.msg || 'Failed to fetch test data');
        navigate('/assessments');
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('An error occurred loading the test');
      navigate('/assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Debounce autosave
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswerToServer(questionId, value);
    }, 1000);
  };

  const saveAnswerToServer = async (questionId, value) => {
    try {
      let payload = { questionId };
      if (typeof value === 'number') {
        payload.selectedOptions = [value];
        payload.numericalAnswer = value;
      } else if (Array.isArray(value)) {
        payload.selectedOptions = value;
      } else if (typeof value === 'string') {
        payload.textAnswer = value;
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) payload.numericalAnswer = numVal;
      }
      payload.answer = value;
      await axios.post(`/tests/attempts/${attemptId}/answer`, payload);
    } catch (error) {
      console.error('Failed to autosave answer:', error);
    }
  };

  const handleClearAnswer = (questionId) => {
    const newAnswers = { ...answers };
    delete newAnswers[questionId];
    setAnswers(newAnswers);
    saveAnswerToServer(questionId, null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = await axios.post(`/tests/attempts/${attemptId}/submit`);
      if (res.data.status === 1) {
        toast.success('Assessment submitted successfully!');
        navigate(`/assessments/attempts/${attemptId}/result`);
      } else {
        toast.error(res.data.msg || 'Failed to submit assessment');
        setIsSubmitting(false);
        setShowSubmitModal(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.warning('Time is up! Auto-submitting your assessment...');
    handleSubmit();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading your assessment...</h2>
      </div>
    );
  }

  const questions = attempt?.questions || test?.questions || [];
  const currentQ = questions[currentQuestionIdx] || {};
  const isLastQuestion = currentQuestionIdx === questions.length - 1;
  const isFirstQuestion = currentQuestionIdx === 0;

  const currentQId = (currentQ._id || currentQ.question?._id || currentQ.questionId || '').toString();
  const qType = currentQ.questionType || currentQ.type || 'mcq_single';

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null && answers[k] !== '').length;

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header - Fully Responsive */}
      <header className="h-14 sm:h-16 border-b flex items-center justify-between px-3 sm:px-6 bg-white shadow-sm gap-2" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-xl font-bold truncate max-w-[140px] sm:max-w-xs md:max-w-md" style={{ color: 'var(--color-text-main)' }}>
            {test?.title || 'Assessment'}
          </h1>
        </div>
        
        <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-sm sm:text-base ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-800'}`}>
          <Clock size={16} className="sm:w-5 sm:h-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMobilePalette(true)}
            className="lg:hidden px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <span>Q: {currentQuestionIdx + 1}/{questions.length}</span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </button>
          <div className="hidden lg:block text-sm font-medium px-4 py-2 bg-gray-100 rounded-lg" style={{ color: 'var(--color-text-main)' }}>
            Q {currentQuestionIdx + 1} / {questions.length}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-4 sm:p-6 md:p-8" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            
            <div className="flex justify-between items-center mb-4 sm:mb-6 border-b pb-3 sm:pb-4" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>Question {currentQuestionIdx + 1}</h2>
              <span className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 bg-gray-100 rounded-full font-medium" style={{ color: 'var(--color-text-main)' }}>
                {currentQ.marks || 1} Mark{(currentQ.marks || 1) !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="prose max-w-none mb-6 sm:mb-8" style={{ color: 'var(--color-text-main)' }}>
              <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">{currentQ.questionText || 'Question'}</p>
              {currentQ.media?.url && (
                <div className="my-4 sm:my-6">
                  <img src={currentQ.media.url} alt="Question media" className="max-h-60 sm:max-h-80 rounded-lg mx-auto border shadow-sm object-contain" />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {qType === 'mcq_single' && (currentQ.options || []).map((opt, i) => {
                const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.title || `Option ${i + 1}`);
                const isSelected = answers[currentQId] === i;
                return (
                  <label key={i} className={`flex items-center p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`} style={{ borderColor: isSelected ? '' : 'var(--color-border)', color: 'var(--color-text-main)' }}>
                    <input
                      type="radio"
                      name={`q-${currentQId}`}
                      value={i}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(currentQId, i)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                    />
                    <span className="ml-3 text-sm sm:text-base leading-relaxed break-words">{optText}</span>
                  </label>
                );
              })}

              {qType === 'mcq_multiple' && (currentQ.options || []).map((opt, i) => {
                const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.title || `Option ${i + 1}`);
                const isChecked = Array.isArray(answers[currentQId]) && answers[currentQId].includes(i);
                return (
                  <label key={i} className={`flex items-center p-3.5 sm:p-4 border rounded-xl cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`} style={{ borderColor: isChecked ? '' : 'var(--color-border)', color: 'var(--color-text-main)' }}>
                    <input
                      type="checkbox"
                      name={`q-${currentQId}`}
                      value={i}
                      checked={isChecked}
                      onChange={(e) => {
                        let currentArr = Array.isArray(answers[currentQId]) ? [...answers[currentQId]] : [];
                        if (e.target.checked) currentArr.push(i);
                        else currentArr = currentArr.filter(item => item !== i);
                        handleAnswerChange(currentQId, currentArr);
                      }}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0"
                    />
                    <span className="ml-3 text-sm sm:text-base leading-relaxed break-words">{optText}</span>
                  </label>
                );
              })}

              {qType === 'text_short' && (
                <input
                  type="text"
                  value={answers[currentQId] || ''}
                  onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                  className="w-full p-3.5 sm:p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                  placeholder="Type your answer here..."
                  style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                />
              )}

              {qType === 'text_long' && (
                <textarea
                  value={answers[currentQId] || ''}
                  onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                  className="w-full p-3.5 sm:p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
                  placeholder="Type your detailed answer here..."
                  style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                />
              )}

              {qType === 'numerical' && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={answers[currentQId] !== undefined ? answers[currentQId] : ''}
                    onChange={(e) => handleAnswerChange(currentQId, e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 p-3.5 sm:p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
                    placeholder="Enter numerical answer..."
                    style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                  />
                  {currentQ.unit && (
                    <span className="text-gray-500 font-semibold text-sm sm:text-base">{currentQ.unit}</span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions - Fully Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 sm:pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => handleClearAnswer(currentQId)}
                className="w-full sm:w-auto text-xs sm:text-sm font-medium text-gray-500 hover:text-red-500 py-1.5 sm:py-0 text-center transition-colors"
                disabled={answers[currentQId] === undefined || answers[currentQId] === ''}
              >
                Clear Answer
              </button>
              
              <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                <button
                  onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                  disabled={isFirstQuestion}
                  className="flex-1 sm:flex-none px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50 disabled:opacity-40 transition-colors text-xs sm:text-sm"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => {
                    if (isLastQuestion) setShowSubmitModal(true);
                    else setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1));
                  }}
                  className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-white transition-colors text-xs sm:text-sm ${isLastQuestion ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isLastQuestion ? 'Submit Test' : 'Next'} {!isLastQuestion && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Desktop Question Palette) */}
        <div className="w-72 border-l bg-white flex flex-col shadow-sm hidden lg:flex" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>Overview</h3>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600 text-xs">Answered: {answeredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600 text-xs">Unanswered: {questions.length - answeredCount}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const qKey = (q._id || q.question?._id || q.questionId || '').toString();
                const isAnswered = answers[qKey] !== undefined && answers[qKey] !== null && answers[qKey] !== '';
                const isCurrent = idx === currentQuestionIdx;
                
                let btnClass = "h-10 rounded-lg flex items-center justify-center font-medium border text-sm transition-all ";
                if (isCurrent) btnClass += "ring-2 ring-blue-500 ring-offset-1 ";
                if (isAnswered) btnClass += "bg-green-100 border-green-300 text-green-800";
                else btnClass += "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
                
                return (
                  <button
                    key={qKey || idx}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
            >
              Submit Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Question Palette Drawer */}
      {showMobilePalette && (
        <div className="fixed inset-0 bg-black/60 z-50 lg:hidden flex justify-end">
          <div className="w-4/5 max-w-xs bg-white h-full flex flex-col p-4 shadow-xl" style={{ backgroundColor: 'var(--color-card)' }}>
            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-base" style={{ color: 'var(--color-text-main)' }}>Question Overview</h3>
              <button onClick={() => setShowMobilePalette(false)} className="text-gray-500 text-xl font-bold p-1">
                &times;
              </button>
            </div>

            <div className="flex justify-between items-center py-3 text-xs text-gray-600">
              <span>Answered: <strong className="text-green-600">{answeredCount}</strong></span>
              <span>Remaining: <strong className="text-gray-500">{questions.length - answeredCount}</strong></span>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const qKey = (q._id || q.question?._id || q.questionId || '').toString();
                  const isAnswered = answers[qKey] !== undefined && answers[qKey] !== null && answers[qKey] !== '';
                  const isCurrent = idx === currentQuestionIdx;
                  
                  let btnClass = "h-10 rounded-lg flex items-center justify-center font-medium border text-xs transition-all ";
                  if (isCurrent) btnClass += "ring-2 ring-blue-500 ring-offset-1 ";
                  if (isAnswered) btnClass += "bg-green-100 border-green-300 text-green-800";
                  else btnClass += "bg-white border-gray-300 text-gray-700";
                  
                  return (
                    <button
                      key={qKey || idx}
                      onClick={() => {
                        setCurrentQuestionIdx(idx);
                        setShowMobilePalette(false);
                      }}
                      className={btnClass}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => {
                  setShowMobilePalette(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Question Palette Toggle (can add later if needed) */}
      
      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6" style={{ backgroundColor: 'var(--color-card)' }}>
            <div className="flex items-center gap-3 text-yellow-600 mb-4">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-main)' }}>Submit Assessment?</h3>
            </div>
            
            <div className="mb-6 space-y-3 bg-gray-50 p-4 rounded-lg border">
              <p className="text-gray-700">Are you sure you want to submit your assessment?</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">Answered:</span>
                <span className="font-semibold text-green-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-500">Unanswered:</span>
                <span className="font-semibold text-red-600">{questions.length - answeredCount}</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
              >
                Return to Test
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 disabled:opacity-70 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={18} /> Confirm Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTaking;

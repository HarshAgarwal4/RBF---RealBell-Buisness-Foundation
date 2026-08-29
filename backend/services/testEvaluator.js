import QuestionModel from '../App/models/question.js';
import TestModel from '../App/models/test.js';
import TestAttemptModel from '../App/models/testAttempt.js';

export async function evaluateAttempt(testAttemptParam, testParam) {
  let attempt = testAttemptParam;
  if (typeof attempt === 'string') {
    attempt = await TestAttemptModel.findById(attempt);
  }
  if (!attempt) throw new Error("Test attempt not found");

  let test = testParam;
  if (!test && attempt.test) {
    test = await TestModel.findById(attempt.test).populate('domain collaboratingOrgs');
  }
  if (!test) throw new Error("Associated test not found");

  // Collect all question IDs (from attempt.questions and attempt.answers)
  const attemptQuestionIds = (attempt.questions || []).map(q => q.question?._id || q.question).filter(Boolean);
  const answerQuestionIds = (attempt.answers || []).map(a => a.question?._id || a.question).filter(Boolean);
  const allQuestionIds = Array.from(new Set([...attemptQuestionIds, ...answerQuestionIds]));

  const questionsList = await QuestionModel.find({ _id: { $in: allQuestionIds } }).lean();
  const questionMap = new Map(questionsList.map(q => [q._id.toString(), q]));

  let obtainedMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let negativeMarksTotal = 0;
  let allTextQuestionsEvaluated = true;
  let hasTextQuestions = false;

  const answeredQuestionIds = new Set();

  for (const answer of attempt.answers) {
    const qId = (answer.question?._id || answer.question || '').toString();
    answeredQuestionIds.add(qId);
    const question = questionMap.get(qId);
    if (!question) continue;

    const qMarks = question.marks || 1;
    const negPenalty = test.negativeMarking ? (test.negativeMarkValue || question.negativeMark || 0) : 0;
    const qType = question.questionType || question.type || 'mcq_single';

    if (qType === 'mcq_single') {
      const correctIndex = (question.options || []).findIndex(opt => opt.isCorrect === true);
      const correctOptionText = correctIndex >= 0 ? question.options[correctIndex]?.text?.trim().toLowerCase() : null;

      let userChoice = null;
      if (answer.selectedOptions && answer.selectedOptions.length > 0) {
        userChoice = answer.selectedOptions[0];
      } else if (answer.answer !== undefined && answer.answer !== null) {
        userChoice = answer.answer;
      }

      let isMatch = false;
      if (userChoice !== null && userChoice !== undefined && userChoice !== '') {
        const userChoiceNum = Number(userChoice);
        if (!isNaN(userChoiceNum) && userChoiceNum === correctIndex) {
          isMatch = true;
        } else if (typeof userChoice === 'string' && correctOptionText && userChoice.trim().toLowerCase() === correctOptionText) {
          isMatch = true;
        }
      }

      if (isMatch) {
        answer.isCorrect = true;
        answer.marksAwarded = qMarks;
        obtainedMarks += qMarks;
        correctCount++;
      } else if (userChoice !== null && userChoice !== undefined && userChoice !== '') {
        answer.isCorrect = false;
        answer.marksAwarded = -negPenalty;
        obtainedMarks -= negPenalty;
        negativeMarksTotal += negPenalty;
        incorrectCount++;
      } else {
        unansweredCount++;
        answer.isCorrect = null;
        answer.marksAwarded = 0;
      }
    } else if (qType === 'mcq_multiple') {
      const correctIndices = [];
      (question.options || []).forEach((opt, idx) => {
        if (opt.isCorrect) correctIndices.push(idx);
      });

      const userChoices = (answer.selectedOptions || (Array.isArray(answer.answer) ? answer.answer : []))
        .map(c => Number(c))
        .filter(n => !isNaN(n));

      if (userChoices.length > 0) {
        const selectedSet = new Set(userChoices);
        const correctSet = new Set(correctIndices);
        const isExactMatch = selectedSet.size === correctSet.size && [...selectedSet].every(val => correctSet.has(val));
        if (isExactMatch) {
          answer.isCorrect = true;
          answer.marksAwarded = qMarks;
          obtainedMarks += qMarks;
          correctCount++;
        } else {
          answer.isCorrect = false;
          answer.marksAwarded = -negPenalty;
          obtainedMarks -= negPenalty;
          negativeMarksTotal += negPenalty;
          incorrectCount++;
        }
      } else {
        unansweredCount++;
        answer.isCorrect = null;
        answer.marksAwarded = 0;
      }
    } else if (qType === 'numerical') {
      const rawUserAns = answer.numericalAnswer !== null && answer.numericalAnswer !== undefined 
        ? answer.numericalAnswer 
        : answer.answer;

      if (rawUserAns !== null && rawUserAns !== undefined && rawUserAns !== '') {
        const expected = parseFloat(question.correctAnswer);
        const tol = question.tolerance || 0;
        const actual = parseFloat(rawUserAns);
        if (!isNaN(expected) && !isNaN(actual) && Math.abs(actual - expected) <= tol) {
          answer.isCorrect = true;
          answer.marksAwarded = qMarks;
          obtainedMarks += qMarks;
          correctCount++;
        } else {
          answer.isCorrect = false;
          answer.marksAwarded = -negPenalty;
          obtainedMarks -= negPenalty;
          negativeMarksTotal += negPenalty;
          incorrectCount++;
        }
      } else {
        unansweredCount++;
        answer.isCorrect = null;
        answer.marksAwarded = 0;
      }
    } else if (qType === 'text_short') {
      const rawTxt = (answer.textAnswer || (typeof answer.answer === 'string' ? answer.answer : '')).trim();
      if (question.correctAnswer && question.correctAnswer.trim()) {
        const expectedTxt = question.correctAnswer.trim().toLowerCase();
        if (rawTxt.toLowerCase() === expectedTxt) {
          answer.isCorrect = true;
          answer.marksAwarded = qMarks;
          obtainedMarks += qMarks;
          correctCount++;
        } else if (rawTxt) {
          answer.isCorrect = false;
          answer.marksAwarded = -negPenalty;
          obtainedMarks -= negPenalty;
          negativeMarksTotal += negPenalty;
          incorrectCount++;
        } else {
          unansweredCount++;
          answer.isCorrect = null;
          answer.marksAwarded = 0;
        }
      } else {
        hasTextQuestions = true;
        if (answer.isCorrect === null || answer.isCorrect === undefined) {
          allTextQuestionsEvaluated = false;
          answer.isCorrect = null;
          answer.marksAwarded = 0;
          if (!rawTxt) unansweredCount++;
        } else {
          obtainedMarks += (answer.marksAwarded || 0);
          if (answer.isCorrect) correctCount++;
          else if (answer.isCorrect === false) incorrectCount++;
        }
      }
    } else if (qType === 'text_long') {
      hasTextQuestions = true;
      if (answer.isCorrect === null || answer.isCorrect === undefined) {
        allTextQuestionsEvaluated = false;
        answer.isCorrect = null;
        answer.marksAwarded = 0;
        if (!answer.textAnswer) {
          unansweredCount++;
        }
      } else {
        obtainedMarks += (answer.marksAwarded || 0);
        if (answer.isCorrect) correctCount++;
        else if (answer.isCorrect === false) incorrectCount++;
      }
    }
  }

  // Count unattempted questions from attempt.questions
  for (const qItem of (attempt.questions || [])) {
    const qId = (qItem.question?._id || qItem.question || '').toString();
    if (!answeredQuestionIds.has(qId)) {
      unansweredCount++;
    }
  }

  const evaluationComplete = !hasTextQuestions || allTextQuestionsEvaluated;
  
  // Calculate total test marks
  let totalTestMarks = Number(test.totalMarks) || 0;
  if (totalTestMarks <= 0) {
    totalTestMarks = questionsList.reduce((sum, q) => sum + (q.marks || 1), 0);
  }
  if (totalTestMarks <= 0) totalTestMarks = 1;

  const validObtainedMarks = Math.max(0, obtainedMarks);
  const percentage = Math.max(0, Math.min(100, Math.round(((validObtainedMarks / totalTestMarks) * 100) * 100) / 100));

  // Determine passing status
  const passPercentThreshold = (test.passingPercentage !== undefined && test.passingPercentage !== null && test.passingPercentage > 0)
    ? Number(test.passingPercentage)
    : 50;

  let passed = false;
  if (evaluationComplete) {
    if (test.passingMarks && Number(test.passingMarks) > 0 && Number(test.passingMarks) <= totalTestMarks) {
      passed = validObtainedMarks >= Number(test.passingMarks);
    } else {
      passed = percentage >= passPercentThreshold;
    }
  }

  attempt.totalMarks = totalTestMarks;
  attempt.obtainedMarks = validObtainedMarks;
  attempt.percentage = percentage;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.unansweredCount = unansweredCount;
  attempt.negativeMarks = negativeMarksTotal;
  attempt.evaluationComplete = evaluationComplete;
  attempt.passed = Boolean(passed);
  if (evaluationComplete) {
    attempt.status = 'evaluated';
  }

  await attempt.save();
  return attempt;
}

export async function evaluateTextAnswer(testAttemptParam, questionId, isCorrect, marksAwarded, evaluatedBy, comment) {
  let attempt = testAttemptParam;
  if (typeof attempt === 'string') {
    attempt = await TestAttemptModel.findById(attempt);
  }
  if (!attempt) throw new Error("Test attempt not found");

  const answer = attempt.answers.find(a => (a.question?._id || a.question || '').toString() === questionId.toString());
  if (!answer) throw new Error("Answer for question not found in this attempt");
  
  answer.isCorrect = Boolean(isCorrect);
  answer.marksAwarded = Number(marksAwarded || 0);
  answer.evaluatedBy = evaluatedBy;
  answer.evaluatedAt = new Date();
  answer.evaluationComment = comment || '';
  
  const test = await TestModel.findById(attempt.test);
  if (!test) throw new Error("Test not found");

  return await evaluateAttempt(attempt, test);
}

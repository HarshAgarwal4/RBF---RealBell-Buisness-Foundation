import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    serverDeadline: { type: Date, required: true },
    status: { type: String, enum: ['in_progress', 'submitted', 'evaluated', 'timed_out'], default: 'in_progress' },
    questions: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        order: { type: Number }
      }
    ],
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOptions: [{ type: Number }],
        textAnswer: { type: String },
        numericalAnswer: { type: Number },
        answeredAt: { type: Date },
        isCorrect: { type: Boolean, default: null },
        marksAwarded: { type: Number, default: 0 },
        evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
        evaluatedAt: { type: Date },
        evaluationComment: { type: String }
      }
    ],
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    negativeMarks: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    evaluationComplete: { type: Boolean, default: false },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

testAttemptSchema.index({ test: 1, user: 1 });
testAttemptSchema.index({ user: 1 });
testAttemptSchema.index({ status: 1 });
testAttemptSchema.index({ test: 1, user: 1, attemptNumber: 1 }, { unique: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
export default TestAttempt;

import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
    subDomain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'medium' },
    duration: { type: Number, default: 60, min: 1 },
    totalMarks: { type: Number, default: 0, min: 0 },
    passingMarks: { type: Number, default: 0 },
    passingPercentage: { type: Number, default: 0, min: 0, max: 100 },
    numberOfQuestions: { type: Number, default: 0 },
    instructions: { type: String },
    maxAttempts: { type: Number, default: 1, min: 0 },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkValue: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    randomQuestionSelection: { type: Boolean, default: false },
    randomOptionOrdering: { type: Boolean, default: false },
    questions: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        order: { type: Number, default: 0 },
        marks: { type: Number, required: true }
      }
    ],
    questionBank: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', default: null },
    randomQuestionCount: { type: Number, default: 0 },
    collaboratingOrgs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CollaboratingOrg' }],
    certificateTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', default: null },
    certificateValidityDays: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
  },
  { timestamps: true }
);

testSchema.index({ status: 1 });
testSchema.index({ domain: 1 });
testSchema.index({ startDate: 1, endDate: 1 });

const Test = mongoose.model('Test', testSchema);
export default Test;

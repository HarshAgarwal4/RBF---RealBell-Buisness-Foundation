import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
export default QuestionBank;

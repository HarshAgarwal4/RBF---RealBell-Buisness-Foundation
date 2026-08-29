import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionType: { type: String, required: true, enum: ['mcq_single', 'mcq_multiple', 'text_short', 'text_long', 'numerical'] },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
    subDomain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    marks: { type: Number, required: true, min: 0 },
    negativeMark: { type: Number, default: 0, min: 0 },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false }
      }
    ],
    correctAnswer: { type: String },
    tolerance: { type: Number, default: 0 },
    unit: { type: String },
    explanation: { type: String },
    media: {
      url: String,
      publicId: String,
      type: { type: String, enum: ['image', 'video', 'audio'] }
    },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
  },
  { timestamps: true }
);

questionSchema.index({ domain: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ tags: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;

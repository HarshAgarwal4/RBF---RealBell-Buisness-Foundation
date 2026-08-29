import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true },
    registrationId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    testAttempt: { type: mongoose.Schema.Types.ObjectId, ref: 'TestAttempt', required: true, unique: true },
    candidateName: { type: String, required: true },
    testName: { type: String, required: true },
    domain: { type: String, required: true },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    result: { type: String, default: 'pass' },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    collaboratingOrgs: [
      {
        name: String,
        logo: String
      }
    ],
    qrCodeDataUrl: { type: String },
    pdfUrl: { type: String },
    pdfPublicId: { type: String },
    status: { type: String, enum: ['valid', 'expired', 'revoked'], default: 'valid' },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    revocationReason: { type: String },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    restoreReason: { type: String },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate' }
  },
  { timestamps: true }
);

certificateSchema.index({ certificateId: 1 }, { unique: true });
certificateSchema.index({ registrationId: 1 }, { unique: true });
certificateSchema.index({ user: 1 });
certificateSchema.index({ test: 1 });
certificateSchema.index({ testAttempt: 1 }, { unique: true });
certificateSchema.index({ status: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;

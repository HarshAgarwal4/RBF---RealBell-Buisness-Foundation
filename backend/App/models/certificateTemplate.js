import mongoose from 'mongoose';

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['rbf_only', 'rbf_collaboration'] },
    description: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    htmlTemplate: { type: String, required: true },
    headerConfig: {
      rbfLogoUrl: { type: String },
      showCollabLogo: { type: Boolean, default: true },
      primaryColor: { type: String, default: '#1a237e' },
      secondaryColor: { type: String, default: '#c5a47e' }
    },
    footerConfig: {
      signatureImageUrl: { type: String },
      signerName: { type: String, default: 'Realbell Business Foundation' },
      signerTitle: { type: String, default: 'Authorized Signatory' }
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
  },
  { timestamps: true }
);

certificateTemplateSchema.index({ type: 1 });
certificateTemplateSchema.index({ isDefault: 1 });
certificateTemplateSchema.index({ status: 1 });

const CertificateTemplate = mongoose.model('CertificateTemplate', certificateTemplateSchema);
export default CertificateTemplate;

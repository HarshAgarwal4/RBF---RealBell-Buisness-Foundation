import mongoose from 'mongoose';

const certificateAuditSchema = new mongoose.Schema(
  {
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', required: true },
    action: { 
      type: String, 
      required: true, 
      enum: ['generated', 'downloaded', 'verified', 'revoked', 'restored', 'metadata_changed'] 
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

certificateAuditSchema.index({ certificate: 1 });
certificateAuditSchema.index({ action: 1 });
certificateAuditSchema.index({ performedBy: 1 });

const CertificateAudit = mongoose.model('CertificateAudit', certificateAuditSchema);
export default CertificateAudit;

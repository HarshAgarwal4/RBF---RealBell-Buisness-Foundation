import mongoose from 'mongoose';

const collaboratingOrgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: {
      url: String,
      publicId: String
    },
    description: { type: String, trim: true },
    website: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    collaborationDetails: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
  },
  { timestamps: true }
);

collaboratingOrgSchema.index({ slug: 1 }, { unique: true });
collaboratingOrgSchema.index({ status: 1 });

const CollaboratingOrg = mongoose.model('CollaboratingOrg', collaboratingOrgSchema);
export default CollaboratingOrg;

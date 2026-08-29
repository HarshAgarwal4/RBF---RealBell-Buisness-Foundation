import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    parentDomain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
    icon: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  },
  { timestamps: true }
);

domainSchema.index({ slug: 1 }, { unique: true });
domainSchema.index({ parentDomain: 1 });
domainSchema.index({ status: 1 });

const Domain = mongoose.model('Domain', domainSchema);
export default Domain;

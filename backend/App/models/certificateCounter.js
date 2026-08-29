import mongoose from 'mongoose';

const certificateCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    year: { type: Number, required: true },
    seq: { type: Number, default: 0 }
  },
  { timestamps: true }
);

certificateCounterSchema.index({ key: 1, year: 1 }, { unique: true });

certificateCounterSchema.statics.getNextSequence = async function(key) {
  const currentYear = new Date().getFullYear();
  const counter = await this.findOneAndUpdate(
    { key, year: currentYear },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const CertificateCounter = mongoose.model('CertificateCounter', certificateCounterSchema);
export default CertificateCounter;

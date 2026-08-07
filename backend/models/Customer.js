import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    totalRequests: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    mailchimpStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
    mailchimpSyncedAt: { type: Date, default: null },
    mailchimpError: { type: String, default: '' }
  },
  { timestamps: true }
);

customerSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Customer', customerSchema);
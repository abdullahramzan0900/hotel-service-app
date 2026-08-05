import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: Number, required: true, unique: true },
    secureToken: { type: String, required: true, unique: true }, // permanent, printed on QR
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    currentBillTotal: { type: Number, default: 0 }
  },
  { timestamps: true }
);

roomSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Room', roomSchema);

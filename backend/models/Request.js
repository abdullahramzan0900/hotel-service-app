import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['room_service', 'issue'], required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    roomNumber: { type: Number, required: true }, // denormalized for fast admin display
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    status: { type: String, enum: ['new', 'in_progress', 'resolved'], default: 'new' }
  },
  { timestamps: true }
);

requestSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Request', requestSchema);

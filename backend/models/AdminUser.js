import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' }
  },
  { timestamps: true }
);

adminUserSchema.set('toJSON', { virtuals: true });

export default mongoose.model('AdminUser', adminUserSchema);

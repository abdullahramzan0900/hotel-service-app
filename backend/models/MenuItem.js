import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    category: { type: String, default: 'Other' },
    imageUrl: { type: String, default: '' },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

menuItemSchema.set('toJSON', { virtuals: true });

export default mongoose.model('MenuItem', menuItemSchema);
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const foodOrderSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    roomNumber: { type: Number, required: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectReason: { type: String, default: '' }
  },
  { timestamps: true }
);

foodOrderSchema.set('toJSON', { virtuals: true });

export default mongoose.model('FoodOrder', foodOrderSchema);

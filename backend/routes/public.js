import express from 'express';
import Room from '../models/Room.js';
import Request from '../models/Request.js';
import FoodOrder from '../models/FoodOrder.js';
import MenuItem from '../models/MenuItem.js';
import { validateGuestContact, normalizeUKPhone } from '../utils/validators.js';
import { sendOrderReceivedEmail, sendRoomServiceReceivedEmail, sendIssueReceivedEmail } from '../utils/mailer.js';

const router = express.Router();

const PRIORITIES = ['normal', 'urgent'];

// GET /api/room/:token -> resolve which room this QR belongs to + whether it's active
router.get('/room/:token', async (req, res) => {
  const room = await Room.findOne({ secureToken: req.params.token });
  if (!room) return res.status(404).json({ error: 'Invalid QR code.' });
  res.json({ roomNumber: room.roomNumber, status: room.status });
});

// GET /api/menu -> public menu list (available items only)
router.get('/menu', async (req, res) => {
  const items = await MenuItem.find({ available: true }).sort({ category: 1, name: 1 });
  res.json(items);
});

// POST /api/room/:token/service -> submit a room service request
router.post('/room/:token/service', async (req, res) => {
  const room = await Room.findOne({ secureToken: req.params.token });
  if (!room) return res.status(404).json({ error: 'Invalid QR code.' });
  if (room.status !== 'active') {
    return res.status(403).json({ error: 'This room is not currently active. Please contact reception.' });
  }

  const { name, email, phone, message, priority } = req.body;
  const { valid, errors } = validateGuestContact({ name, email, phone });
  if (!valid) return res.status(400).json({ errors });
  if (!message || message.trim().length < 3) {
    return res.status(400).json({ errors: { message: 'Please describe what you need.' } });
  }

  const request = await Request.create({
    type: 'room_service',
    roomId: room._id,
    roomNumber: room.roomNumber,
    guestName: name.trim(),
    guestEmail: email.trim().toLowerCase(),
    guestPhone: normalizeUKPhone(phone),
    message: message.trim(),
    priority: PRIORITIES.includes(priority) ? priority : 'normal',
    status: 'new'
  });

  req.app.get('io')?.emit('new_request', request);
  sendRoomServiceReceivedEmail(request); // fire and forget
  res.status(201).json({ message: 'Your request has been sent to our staff.', request });
});
// POST /api/room/:token/issue -> report an issue
router.post('/room/:token/issue', async (req, res) => {
  const room = await Room.findOne({ secureToken: req.params.token });
  if (!room) return res.status(404).json({ error: 'Invalid QR code.' });
  if (room.status !== 'active') {
    return res.status(403).json({ error: 'This room is not currently active. Please contact reception.' });
  }

  const { name, email, phone, message, priority } = req.body;
  const { valid, errors } = validateGuestContact({ name, email, phone });
  if (!valid) return res.status(400).json({ errors });
  if (!message || message.trim().length < 3) {
    return res.status(400).json({ errors: { message: 'Please describe the issue.' } });
  }

  const request = await Request.create({
    type: 'issue',
    roomId: room._id,
    roomNumber: room.roomNumber,
    guestName: name.trim(),
    guestEmail: email.trim().toLowerCase(),
    guestPhone: normalizeUKPhone(phone),
    message: message.trim(),
    priority: PRIORITIES.includes(priority) ? priority : 'normal',
    status: 'new'
  });

  req.app.get('io')?.emit('new_request', request);
  sendIssueReceivedEmail(request); // fire and forget
  res.status(201).json({ message: 'Your issue has been reported to our staff.', request });
});

// POST /api/room/:token/order -> submit a food order (pending, not billed yet)
router.post('/room/:token/order', async (req, res) => {
  const room = await Room.findOne({ secureToken: req.params.token });
  if (!room) return res.status(404).json({ error: 'Invalid QR code.' });
  if (room.status !== 'active') {
    return res.status(403).json({ error: 'This room is not currently active. Please contact reception.' });
  }

  const { name, email, phone, items } = req.body;
  const { valid, errors } = validateGuestContact({ name, email, phone });
  if (!valid) return res.status(400).json({ errors });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ errors: { items: 'Please add at least one item to your order.' } });
  }

  // Re-price server-side from the real menu - never trust prices sent from client
  let total = 0;
  const finalItems = [];
  for (const item of items) {
    const menuItem = await MenuItem.findOne({ _id: item.menuItemId, available: true });
    if (!menuItem) {
      return res.status(400).json({ errors: { items: 'An item in your order is no longer available.' } });
    }
    const qty = Math.max(1, Math.min(20, parseInt(item.quantity) || 1));
    total += menuItem.price * qty;
    finalItems.push({ menuItemId: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: qty });
  }

  const order = await FoodOrder.create({
    roomId: room._id,
    roomNumber: room.roomNumber,
    guestName: name.trim(),
    guestEmail: email.trim().toLowerCase(),
    guestPhone: normalizeUKPhone(phone),
    items: finalItems,
    totalPrice: Math.round(total * 100) / 100,
    status: 'pending'
  });

  req.app.get('io')?.emit('new_order', order);
  sendOrderReceivedEmail(order); // fire and forget
  res.status(201).json({ message: 'Your order has been received and is pending kitchen approval.', order });
});

export default router;

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import multer from 'multer';
import Room from '../models/Room.js';
import Request from '../models/Request.js';
import FoodOrder from '../models/FoodOrder.js';
import MenuItem from '../models/MenuItem.js';
import AdminUser from '../models/AdminUser.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { generateSecureToken } from '../utils/token.js';
import { sendOrderApprovedEmail, sendOrderRejectedEmail } from '../utils/mailer.js';
import { uploadImageToBunny, deleteImageFromBunny } from '../utils/bunny.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  }
});

const router = express.Router();

// ---------- AUTH ----------
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await AdminUser.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '12h'
  });
  res.json({ token, user: { username: user.username, role: user.role } });
});

router.use(requireAdminAuth); // everything below requires a valid admin JWT

// ---------- REQUESTS (room service + issues) ----------
router.get('/requests', async (req, res) => {
  const { status, type } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [results, total] = await Promise.all([
    Request.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Request.countDocuments(filter)
  ]);

  res.json({ data: results, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.patch('/requests/:id', async (req, res) => {
  const { status } = req.body;
  if (!['new', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const request = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  req.app.get('io')?.emit('request_updated', request);
  res.json(request);
});

// ---------- FOOD ORDERS ----------
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const filter = {};
  if (status) filter.status = status;

  const [results, total] = await Promise.all([
    FoodOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FoodOrder.countDocuments(filter)
  ]);

  res.json({ data: results, total, page, pages: Math.ceil(total / limit) || 1 });
});

router.patch('/orders/:id/approve', async (req, res) => {
  const order = await FoodOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  order.status = 'approved';
  await order.save();

  const room = await Room.findById(order.roomId);
  if (room) {
    room.currentBillTotal = Math.round(((room.currentBillTotal || 0) + order.totalPrice) * 100) / 100;
    await room.save();
  }

  req.app.get('io')?.emit('order_updated', order);
  sendOrderApprovedEmail(order); // fire and forget
  res.json(order);
});

router.patch('/orders/:id/reject', async (req, res) => {
  const order = await FoodOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  order.status = 'rejected';
  order.rejectReason = req.body?.reason || '';
  await order.save();

  req.app.get('io')?.emit('order_updated', order);
  sendOrderRejectedEmail(order, order.rejectReason);
  res.json(order);
});

// ---------- ROOMS ----------
router.get('/rooms', async (req, res) => {
  const rooms = await Room.find().sort({ roomNumber: 1 });
  res.json(rooms);
});

router.post('/rooms', async (req, res) => {
  const { roomNumber } = req.body;
  if (!roomNumber) return res.status(400).json({ error: 'Room number is required.' });
  const existing = await Room.findOne({ roomNumber });
  if (existing) return res.status(400).json({ error: 'Room already exists.' });

  const room = await Room.create({
    roomNumber,
    secureToken: generateSecureToken(),
    status: 'inactive',
    currentBillTotal: 0
  });
  res.status(201).json(room);
});

router.get('/rooms/:id/qrcode', async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${baseUrl}/r/${room.secureToken}`;
  const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
  res.json({ url, qrDataUrl, roomNumber: room.roomNumber });
});

router.patch('/rooms/:id/checkin', async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.json(room);
});

router.patch('/rooms/:id/checkout', async (req, res) => {
  const room = await Room.findByIdAndUpdate(
    req.params.id,
    { status: 'inactive', currentBillTotal: 0 },
    { new: true }
  );
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.json(room);
});

router.delete('/rooms/:id', async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.status(204).end();
});

// ---------- MENU ----------
router.get('/menu', async (req, res) => {
  const { category, available } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const filter = {};
  if (category && category !== 'all') filter.category = category;
  if (available === 'true') filter.available = true;
  if (available === 'false') filter.available = false;

  const [data, total, categories] = await Promise.all([
    MenuItem.find(filter)
      .sort({ category: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    MenuItem.countDocuments(filter),
    MenuItem.distinct('category')
  ]);

  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1, categories: categories.sort() });
});

router.post('/menu', async (req, res) => {
  const { name, description, price, category, available, imageUrl } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name and price are required.' });
  const item = await MenuItem.create({
    name,
    description: description || '',
    price: Number(price),
    category: category || 'Other',
    imageUrl: imageUrl || '',
    available: available !== false
  });
  res.status(201).json(item);
});

// Upload/replace a menu item's image (stored on Bunny.net CDN)
router.post('/menu/:id/image', upload.single('image'), async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });

  try {
    const oldImageUrl = item.imageUrl;
    const newUrl = await uploadImageToBunny(req.file.buffer, req.file.originalname);
    item.imageUrl = newUrl;
    await item.save();
    if (oldImageUrl) deleteImageFromBunny(oldImageUrl); // fire and forget cleanup
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/menu/:id', async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  res.json(item);
});

router.delete('/menu/:id', async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// ---------- DASHBOARD STATS ----------
router.get('/stats', async (req, res) => {
  const [newRequests, urgentRequests, pendingOrders, activeRooms, totalRooms] = await Promise.all([
    Request.countDocuments({ status: 'new' }),
    Request.countDocuments({ status: { $ne: 'resolved' }, priority: 'urgent' }),
    FoodOrder.countDocuments({ status: 'pending' }),
    Room.countDocuments({ status: 'active' }),
    Room.countDocuments()
  ]);
  res.json({ newRequests, urgentRequests, pendingOrders, activeRooms, totalRooms });
});

// ---------- ANALYTICS / REPORTING ----------
router.get('/analytics', async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 14));
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [revenueByDay, requestsByDay, requestsByType, requestsByPriority, ordersByStatus, topItems, totalRevenue] =
    await Promise.all([
      FoodOrder.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Request.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Request.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Request.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      FoodOrder.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      FoodOrder.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: since } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 8 }
      ]),
      FoodOrder.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

  res.json({
    rangeDays: days,
    revenueByDay,
    requestsByDay,
    requestsByType,
    requestsByPriority,
    ordersByStatus,
    topItems,
    totalRevenueAllTime: totalRevenue[0]?.total || 0
  });
});

export default router;
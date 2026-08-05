import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { connectDB } from './db.js';
import { autoSeed } from './seedData.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});
app.set('io', io);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : '*' }));
app.use(express.json());

// Rate limit public guest-facing endpoints to prevent spam/abuse
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // max 60 requests per hour per IP across all rooms
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later or contact reception.' }
});

app.use('/api/room', publicLimiter);
app.use('/api/menu', publicLimiter);
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log('Admin dashboard connected:', socket.id);
  socket.on('disconnect', () => console.log('Admin dashboard disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await autoSeed(); // creates the database, admin login, rooms & menu automatically if empty
    server.listen(PORT, () => {
      console.log(`Hotel service backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

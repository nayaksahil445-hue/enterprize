import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import couponRoutes from './routes/coupons.js';
import reviewRoutes from './routes/reviews.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import inventoryRoutes from './routes/inventory.js';
import inquiryRoutes from './routes/inquiries.js';
import debugRoutes from './routes/debug.js';
import uploadRoutes from './routes/upload.js';

dotenv.config(); // Trigger restart

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS: if ALLOWED_ORIGINS is set (comma-separated), enforce a whitelist.
// Otherwise keep permissive behavior for backward compatibility.
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = allowedOriginsEnv
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (allowedOrigins.length > 0) {
  app.use(cors({
    origin: (origin, callback) => {
      // allow non-browser requests (no Origin) like curl/server-to-server
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) return callback(null, true);
      console.error('CORS blocked origin:', origin);
      return callback(new Error('CORS policy: This origin is not allowed'));
    },
    credentials: true
  }));
  console.log(`✅ CORS whitelist active — allowed origins: ${allowedOrigins.join(', ')}`);
} else {
  // Allow all browser origins gracefully if ALLOWED_ORIGINS is not set
  app.use(cors({ origin: true, credentials: true }));
  console.log('⚠️  CORS: ALLOWED_ORIGINS not set — allowing all origins with credentials');
}

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/industrial_core';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  import('fs').then(fs => fs.appendFileSync('server_error.log', err.stack + '\n'));
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  const publicApiUrl = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api`
    : `http://localhost:${PORT}/api`;
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API: ${publicApiUrl}`);
});

import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/dashboard — Dashboard stats
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['Placed', 'Confirmed'] } });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

    const revenueResult = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
    const outOfStockProducts = await Product.countDocuments({ isActive: true, stock: 0 });

    const totalUsers = await User.countDocuments({ role: 'user' });

    // Recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    // Top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort({ purchaseCount: -1 })
      .limit(5)
      .select('name category price purchaseCount stock');

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, orderStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      stats: {
        totalOrders, pendingOrders, deliveredOrders, cancelledOrders,
        totalRevenue, totalProducts, lowStockProducts, outOfStockProducts, totalUsers
      },
      recentOrders,
      topProducts,
      monthlyRevenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/sales-report — Sales report with date filters
router.get('/sales-report', protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const match = { orderStatus: { $ne: 'Cancelled' } };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      match.createdAt = match.createdAt || {};
      match.createdAt.$lte = new Date(endDate);
    }

    let dateFormat = '%Y-%m-%d';
    if (groupBy === 'month') dateFormat = '%Y-%m';
    else if (groupBy === 'week') dateFormat = '%Y-W%V';

    const report = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          unitsSold: { $sum: '$items.qty' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({ report, categoryBreakdown, paymentBreakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/customers — Customer list
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const customers = await User.find(filter)
      .select('name email phone createdAt')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Get order counts for each customer
    const customerData = await Promise.all(customers.map(async (c) => {
      const orderCount = await Order.countDocuments({ user: c._id });
      const totalSpent = await Order.aggregate([
        { $match: { user: c._id, orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return {
        ...c.toObject(),
        orderCount,
        totalSpent: totalSpent[0]?.total || 0
      };
    }));

    res.json({ customers: customerData, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/inventory-alerts — Low stock alerts
router.get('/inventory-alerts', protect, adminOnly, async (req, res) => {
  try {
    const lowStock = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).sort({ stock: 1 });

    const outOfStock = lowStock.filter(p => p.stock === 0);
    const critical = lowStock.filter(p => p.stock > 0 && p.stock <= 5);
    const warning = lowStock.filter(p => p.stock > 5);

    res.json({
      totalAlerts: lowStock.length,
      outOfStock,
      critical,
      warning,
      all: lowStock
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Contact model (kept from original)
import mongoose from 'mongoose';
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// GET /api/admin/enquiries
router.get('/enquiries', protect, adminOnly, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ date: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/contact — public
router.post('/contact', async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

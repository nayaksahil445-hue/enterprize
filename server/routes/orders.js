import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/orders — Place order
router.post('/', protect, async (req, res) => {
  try {
    const {
      items, shippingAddress, paymentMethod, paymentStatus,
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
      subtotal, discount, couponCode, shippingCost, totalAmount, notes
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Validate stock and update
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productName} not found` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `${product.name} has only ${product.stock} units in stock`
        });
      }
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : (paymentStatus || 'Paid'),
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      subtotal,
      discount: discount || 0,
      couponCode,
      shippingCost: shippingCost || 0,
      totalAmount,
      notes
    });

    // Deduct stock and update purchase count
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty, purchaseCount: item.qty }
      });

      // Track purchase activity
      req.user.trackActivity('purchase', {
        productId: item.product,
        category: item.category
      }).catch(() => {});
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], savedForLater: [] }
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/my — User's orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id — Order detail
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image category');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // User can only see their own orders (unless admin)
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders — Admin: all orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('user', 'name email phone');

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status — Admin: update status
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, message } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    order.trackingHistory.push({
      status,
      message: message || `Order ${status.toLowerCase()}`,
      timestamp: new Date()
    });

    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'Paid';
      }
    }

    if (status === 'Cancelled') {
      order.cancelledAt = new Date();
      order.cancelReason = message || 'Cancelled by admin';
      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.qty, purchaseCount: -item.qty }
        });
      }
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/orders/:id — Admin: delete order
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

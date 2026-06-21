import express from 'express';
import Coupon from '../models/Coupon.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/coupons/validate — Validate and calculate discount
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    const validation = coupon.isValid(req.user._id, orderAmount);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const discount = coupon.calculateDiscount(orderAmount);

    res.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalAmount: orderAmount - discount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/coupons — Admin: create coupon
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(400).json({ message: err.message });
  }
});

// GET /api/coupons — Admin: list all coupons
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/coupons/:id — Admin: delete coupon
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

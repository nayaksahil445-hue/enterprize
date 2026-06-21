import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay (uses test keys by default)
const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
  });
};

// POST /api/payments/create-order — Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // If Razorpay keys are not configured, simulate
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
      // Simulated payment for development
      return res.json({
        id: 'order_sim_' + Date.now(),
        amount: amount * 100,
        currency,
        receipt,
        simulated: true,
        key: 'rzp_test_simulated'
      });
    }

    const razorpay = getRazorpay();
    const options = {
      amount: amount * 100, // Razorpay expects paisa
      currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.json({
      ...order,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: 'Payment order creation failed', error: err.message });
  }
});

// POST /api/payments/verify — Verify Razorpay payment signature
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Simulated verification for development
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'placeholder_secret') {
      return res.json({ verified: true, simulated: true });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, message: 'Invalid payment signature' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed', error: err.message });
  }
});

export default router;

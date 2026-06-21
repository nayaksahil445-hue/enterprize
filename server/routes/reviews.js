import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews — Submit review (only if user has purchased and received the product)
router.post('/', protect, async (req, res) => {
  try {
    const { product, rating, title, comment } = req.body;

    // Check if user has a delivered order containing this product
    const hasOrder = await Order.findOne({
      user: req.user._id,
      'items.product': product,
      orderStatus: 'Delivered'
    });

    if (!hasOrder) {
      return res.status(400).json({
        message: 'You can only review products from delivered orders'
      });
    }

    // Check if review already exists
    const existing = await Review.findOne({ user: req.user._id, product });
    if (existing) {
      // Update existing review
      existing.rating = rating;
      existing.title = title;
      existing.comment = comment;
      await existing.save();
      return res.json({ message: 'Review updated', review: existing });
    }

    const review = await Review.create({
      user: req.user._id,
      product,
      rating,
      title,
      comment
    });

    res.status(201).json({ message: 'Review submitted', review });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reviews/:productId — Get reviews for a product
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    const totalRatings = reviews.length;
    const avgRating = totalRatings > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / totalRatings).toFixed(1)
      : 0;

    // Rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => breakdown[r.rating]++);

    res.json({
      reviews,
      totalRatings,
      avgRating: Number(avgRating),
      breakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

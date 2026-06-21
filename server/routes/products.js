import express from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products — Search, filter, sort, paginate
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search, category, minPrice, maxPrice, minRating,
      sort, page = 1, limit = 20, inStock
    } = req.query;

    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];

      // Track search activity
      if (req.user) {
        req.user.trackActivity('search', { query: search }).catch(() => {});
      }
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Sort
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'popular') sortOption = { purchaseCount: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/categories — Get all unique categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/recommendations — AI-based recommendations
router.get('/recommendations', optionalAuth, async (req, res) => {
  try {
    let recommended = [];

    if (req.user) {
      // Get user's most viewed/purchased categories
      const activity = req.user.activityLog || [];
      const categoryCount = {};
      const viewedProducts = new Set();

      activity.forEach(a => {
        if (a.category) categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
        if (a.productId) viewedProducts.add(a.productId.toString());
      });

      // Sort categories by frequency
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

      if (topCategories.length > 0) {
        // Content-based: products from user's favorite categories
        recommended = await Product.find({
          isActive: true,
          category: { $in: topCategories },
          stock: { $gt: 0 }
        })
        .sort({ rating: -1, purchaseCount: -1 })
        .limit(8);
      }
    }

    // If not enough recommendations, fill with popular products
    if (recommended.length < 8) {
      const existingIds = recommended.map(p => p._id);
      const popular = await Product.find({
        isActive: true,
        stock: { $gt: 0 },
        _id: { $nin: existingIds }
      })
      .sort({ purchaseCount: -1, views: -1, rating: -1 })
      .limit(8 - recommended.length);

      recommended = [...recommended, ...popular];
    }

    res.json(recommended);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id — Product detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Increment views
    product.views += 1;
    await product.save();

    // Track activity
    if (req.user) {
      req.user.trackActivity('view', {
        productId: product._id,
        category: product.category
      }).catch(() => {});
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products — Admin: add product
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id — Admin: update product
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id — Admin: delete product
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

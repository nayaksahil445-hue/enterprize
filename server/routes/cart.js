import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cart — Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price image category stock description')
      .populate('savedForLater', 'name price image category stock');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/cart/add — Add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < 1) return res.status(400).json({ message: 'Product out of stock', outOfStock: true });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(i => i.product.toString() === productId);
    if (existingItem) {
      const newQty = existingItem.qty + qty;
      if (newQty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} units available` });
      }
      existingItem.qty = newQty;
    } else {
      cart.items.push({ product: productId, qty });
    }

    await cart.save();

    // Track activity
    req.user.trackActivity('cart_add', {
      productId: product._id,
      category: product.category
    }).catch(() => {});

    const populated = await Cart.findById(cart._id)
      .populate('items.product', 'name price image category stock description');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/cart/update — Update item quantity
router.put('/update', protect, async (req, res) => {
  try {
    const { productId, qty } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (qty <= 0) {
      cart.items = cart.items.filter(i => i.product.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (qty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} units available` });
      }
      item.qty = qty;
    }

    await cart.save();
    const populated = await Cart.findById(cart._id)
      .populate('items.product', 'name price image category stock description');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();

    const populated = await Cart.findById(cart._id)
      .populate('items.product', 'name price image category stock description');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/cart/save-for-later/:productId
router.post('/save-for-later/:productId', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const pid = req.params.productId;

    // Remove from items if present
    cart.items = cart.items.filter(i => i.product.toString() !== pid);

    // Add to savedForLater if not already there
    if (!cart.savedForLater.includes(pid)) {
      cart.savedForLater.push(pid);
    }

    await cart.save();
    const populated = await Cart.findById(cart._id)
      .populate('items.product', 'name price image category stock description')
      .populate('savedForLater', 'name price image category stock');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/cart/move-to-cart/:productId — move from saved to cart
router.post('/move-to-cart/:productId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const pid = req.params.productId;
    const product = await Product.findById(pid);
    if (!product || product.stock < 1) {
      return res.status(400).json({ message: 'Product is out of stock' });
    }

    // Remove from savedForLater
    cart.savedForLater = cart.savedForLater.filter(id => id.toString() !== pid);

    // Add to cart
    const existing = cart.items.find(i => i.product.toString() === pid);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.items.push({ product: pid, qty: 1 });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id)
      .populate('items.product', 'name price image category stock description')
      .populate('savedForLater', 'name price image category stock');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

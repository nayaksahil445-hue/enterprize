import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, phone });
    const token = user.generateToken();

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        wishlist: user.wishlist,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = user.generateToken();

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        wishlist: user.wishlist,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      addresses: user.addresses,
      wishlist: user.wishlist,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone, avatar } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/address
router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = req.body;

    if (address.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    if (user.addresses.length === 0) address.isDefault = true;

    user.addresses.push(address);
    await user.save();
    res.status(201).json({ message: 'Address added', addresses: user.addresses });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/auth/address/:id
router.delete('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ message: 'Address removed', addresses: user.addresses });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/wishlist/:productId
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const pid = req.params.productId;
    const idx = user.wishlist.indexOf(pid);

    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      await user.save();
      res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
    } else {
      user.wishlist.push(pid);
      await user.trackActivity('wishlist', { productId: pid });
      res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

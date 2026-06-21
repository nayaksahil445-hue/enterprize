import express from 'express';
import Inquiry from '../models/Inquiry.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/inquiries — Public: submit inquiry/quote request
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, product, productName, message, type } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const inquiry = await Inquiry.create({
      name, email, phone, company, product, productName, message,
      type: type || 'general'
    });

    res.status(201).json({ message: 'Inquiry submitted successfully', inquiry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/inquiries — Admin: list all inquiries
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await Inquiry.countDocuments(filter);
    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('product', 'name sku price image');

    const stats = {
      total: await Inquiry.countDocuments(),
      new: await Inquiry.countDocuments({ status: 'new' }),
      viewed: await Inquiry.countDocuments({ status: 'viewed' }),
      replied: await Inquiry.countDocuments({ status: 'replied' }),
      closed: await Inquiry.countDocuments({ status: 'closed' })
    };

    res.json({
      inquiries,
      stats,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/inquiries/:id — Admin: update inquiry status/notes
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    if (status) inquiry.status = status;
    if (adminNotes !== undefined) inquiry.adminNotes = adminNotes;

    await inquiry.save();
    res.json({ message: 'Inquiry updated', inquiry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/inquiries/:id — Admin: delete inquiry
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from 'express';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/inventory — Full inventory list (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    let products = await Product.find(filter)
      .sort({ lastStockUpdate: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('name sku category stock lowStockThreshold lastStockUpdate price image stockStatus');

    // Filter by stock status (virtual field, must filter after query)
    if (status === 'in_stock') {
      products = products.filter(p => p.stock > p.lowStockThreshold);
    } else if (status === 'low_stock') {
      products = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
    } else if (status === 'out_of_stock') {
      products = products.filter(p => p.stock === 0);
    }

    const total = await Product.countDocuments(filter);
    const totalInStock = await Product.countDocuments({ isActive: true, stock: { $gt: 0 } });
    const totalLowStock = await Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] }, stock: { $gt: 0 } });
    const totalOutOfStock = await Product.countDocuments({ isActive: true, stock: 0 });

    res.json({
      products,
      stats: { total, totalInStock, totalLowStock, totalOutOfStock },
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/inventory/public — Public stock display (no auth)
router.get('/public', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ name: 1 })
      .select('name sku category stock lowStockThreshold lastStockUpdate price image');

    const inventory = products.map(p => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock,
      stockStatus: p.stock === 0 ? 'Out of Stock' : p.stock <= p.lowStockThreshold ? 'Low Stock' : 'In Stock',
      lastUpdated: p.lastStockUpdate,
      price: p.price,
      image: p.image
    }));

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/inventory/:id/adjust — Adjust stock (admin)
router.put('/:id/adjust', protect, adminOnly, async (req, res) => {
  try {
    const { type, quantity, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!type || quantity === undefined) {
      return res.status(400).json({ message: 'Type and quantity are required' });
    }

    const previousStock = product.stock;
    let newStock;

    switch (type) {
      case 'addition':
        newStock = previousStock + Math.abs(quantity);
        break;
      case 'reduction':
      case 'sale':
        newStock = Math.max(0, previousStock - Math.abs(quantity));
        break;
      case 'adjustment':
        newStock = Math.max(0, quantity);
        break;
      case 'return':
        newStock = previousStock + Math.abs(quantity);
        break;
      default:
        return res.status(400).json({ message: 'Invalid adjustment type' });
    }

    // Record movement
    await StockMovement.create({
      product: product._id,
      type,
      quantity: Math.abs(quantity),
      previousStock,
      newStock,
      reason: reason || `Stock ${type}`,
      performedBy: req.user._id
    });

    // Update product
    product.stock = newStock;
    product.lastStockUpdate = new Date();
    await product.save();

    res.json({
      message: `Stock ${type} successful`,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        previousStock,
        newStock,
        stockStatus: product.stockStatus
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/inventory/:id/history — Stock movement history for a product
router.get('/:id/history', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const movements = await StockMovement.find({ product: req.params.id })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('performedBy', 'name email');

    const total = await StockMovement.countDocuments({ product: req.params.id });

    res.json({
      movements,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/inventory/reports — Inventory summary report
router.get('/reports/summary', protect, adminOnly, async (req, res) => {
  try {
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
        }
      },
      { $sort: { totalProducts: -1 } }
    ]);

    const recentMovements = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('product', 'name sku')
      .populate('performedBy', 'name');

    const totalValue = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$price', '$stock'] } } } }
    ]);

    res.json({
      categoryStats,
      recentMovements,
      totalInventoryValue: totalValue[0]?.value || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

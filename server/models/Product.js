import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  images: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  stock: {
    type: Number,
    default: 50,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  lastStockUpdate: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual: stock status label
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= this.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
});

// Virtual: check if low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Virtual: check if in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual: discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes
productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ views: -1 });
productSchema.index({ sku: 1 });
productSchema.index({ isFeatured: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;

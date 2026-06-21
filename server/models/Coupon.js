import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: 0 // 0 means no cap
  },
  maxUses: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Check if coupon is valid
couponSchema.methods.isValid = function(userId, orderAmount) {
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (new Date() > this.expiresAt) return { valid: false, message: 'Coupon has expired' };
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${this.minOrderAmount}` };
  if (userId && this.usedBy.includes(userId)) return { valid: false, message: 'You have already used this coupon' };
  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount > 0) {
      discount = Math.min(discount, this.maxDiscountAmount);
    }
  } else {
    discount = this.discountValue;
  }
  return Math.min(discount, orderAmount);
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

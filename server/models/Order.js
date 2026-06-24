import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  category:    String,
  price:       { type: Number, required: true },
  qty:         { type: Number, required: true, min: 1 },
  image:       String
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
  status:    { type: String, required: true },
  message:   { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone:    { type: String, required: true },
    street:   { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'Wallet', 'COD'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature:  String,
  orderStatus: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Placed'
  },
  trackingHistory: [trackingEventSchema],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  shippingCost: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before save
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `JE${Date.now().toString(36).toUpperCase()}${(count + 1).toString().padStart(4, '0')}`;
  }
  // Set estimated delivery (7 days from now for COD, 5 for prepaid)
  if (!this.estimatedDelivery) {
    const days = this.paymentMethod === 'COD' ? 7 : 5;
    this.estimatedDelivery = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  // Add initial tracking if new
  if (this.isNew && !this.trackingHistory.length) {
    this.trackingHistory.push({
      status: 'Placed',
      message: 'Order has been placed successfully',
      timestamp: new Date()
    });
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });


const Order = mongoose.model('Order', orderSchema);
export default Order;

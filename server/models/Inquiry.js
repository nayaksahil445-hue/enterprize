import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  type: {
    type: String,
    enum: ['quote', 'general', 'bulk_order', 'custom'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['new', 'viewed', 'replied', 'closed'],
    default: 'new'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ createdAt: -1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);
export default Inquiry;

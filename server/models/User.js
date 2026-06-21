import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  street:   { type: String, required: true },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  isDefault:{ type: Boolean, default: false }
}, { _id: true });

const activitySchema = new mongoose.Schema({
  action:    { type: String, enum: ['view', 'search', 'cart_add', 'purchase', 'wishlist'] },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  category:  String,
  query:     String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 80
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  addresses: [addressSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  notifyProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  activityLog: [activitySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'jagannath_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// Track user activity (keep last 200 entries)
userSchema.methods.trackActivity = async function(action, data = {}) {
  this.activityLog.push({ action, ...data, timestamp: new Date() });
  if (this.activityLog.length > 200) {
    this.activityLog = this.activityLog.slice(-200);
  }
  await this.save();
};

const User = mongoose.model('User', userSchema);
export default User;

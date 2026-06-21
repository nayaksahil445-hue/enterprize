import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['addition', 'reduction', 'adjustment', 'sale', 'return'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ createdAt: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export default StockMovement;

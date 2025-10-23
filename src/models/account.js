import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  cardNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  pin: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  locked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
accountSchema.index({ cardNo: 1 });

export const Account = mongoose.model('Account', accountSchema);
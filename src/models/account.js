import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  cardNo: String,
  pin: String,
  balance: Number,
  failedAttempts: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
});

export const Account = mongoose.model('Account', accountSchema);

import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  type: String, // 'CashDispenser', 'Printer', 'Database'
  available: Number,
});

export const Resource = mongoose.model('Resource', resourceSchema);

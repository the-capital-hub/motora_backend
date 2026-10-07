const mongoose = require('mongoose');

const sellRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: Number,
  km: Number,
  fuel: String,
  transmission: String,
  city: String,
  expectedPrice: Number,
  description: String,
  images: [String],
  status: { type: String, enum: ['New', 'Contacted', 'Inspected', 'Purchased', 'Rejected'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('SellRequest', sellRequestSchema);

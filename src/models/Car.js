const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    variant: { type: String, trim: true },
    year: { type: Number, required: true, min: 1900 },
    price: { type: Number, required: true, min: 0 },
    type: { type: String, required: true, trim: true },
    fuel: { type: String, required: true, trim: true },
    transmission: { type: String, required: true, trim: true },
    km: { type: Number, default: 0, min: 0 },
    location: { type: String, required: true, trim: true },
    images: [{ type: String, trim: true }],
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Sold"],
      default: "Available",
    },
    featured: { type: Boolean, default: false },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
    imageSource: {
  provider: { type: String },
  title: { type: String },
  pageUrl: { type: String },
  originalUrl: { type: String },
  author: { type: String },
  license: { type: String },
},
  },
  { timestamps: true },
);

carSchema.index({ brand: 1, model: 1, location: 1 });
carSchema.index({ price: 1, year: -1 });

module.exports = mongoose.model("Car", carSchema);

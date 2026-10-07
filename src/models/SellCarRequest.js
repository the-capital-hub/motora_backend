const mongoose = require("mongoose");

const sellCarRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    owner: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },

    brand: { type: String, required: true, trim: true },
    make: { type: String, trim: true },
    model: { type: String, required: true, trim: true },
    variant: { type: String, trim: true },
    year: { type: Number, required: true, min: 1900 },
    km: { type: Number, required: true, min: 0 },
    kilometers: { type: Number, min: 0 },
    fuel: { type: String, required: true, trim: true },
    transmission: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    expectedPrice: { type: Number, min: 0, default: 0 },
    location: { type: String, required: true, trim: true },
    city: { type: String, trim: true },

    images: [{ type: String, trim: true }],
    photoCount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["New", "Inspection", "Offer Sent", "Approved", "Rejected"],
      default: "New",
    },
  },
  { timestamps: true }
);

sellCarRequestSchema.index({ user: 1, createdAt: -1 });
sellCarRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("SellCarRequest", sellCarRequestSchema);

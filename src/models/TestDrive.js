const mongoose = require("mongoose");

const testDriveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Requested", "Confirmed", "Completed", "Cancelled"],
      default: "Requested",
    },
  },
  { timestamps: true }
);

testDriveSchema.index({ user: 1, createdAt: -1 });
testDriveSchema.index({ car: 1, date: 1 });

module.exports = mongoose.model("TestDrive", testDriveSchema);

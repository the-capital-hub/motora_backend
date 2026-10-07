const Lead = require("../models/Lead");
const Car = require("../models/Car");

exports.create = async (req, res) => {
  const { carId, name, phone, email, message, type, source } = req.body;

  if (!name?.trim() || !phone?.trim() || !email?.trim()) {
    return res.status(400).json({
      message: "Name, phone and email are required",
    });
  }

  let car = null;

  if (carId) {
    car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
  }

  const lead = await Lead.create({
    user: req.user?._id || null,
    car: car?._id || null,
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    message: String(message || "").trim(),
    type: type || "Enquiry",
    source: source || "Website",
  });

  const item = await lead.populate("car");

  res.status(201).json({
    message: "Enquiry submitted",
    item,
  });
};

module.exports = exports;


exports.mine = async (req, res) => {
  const items = await Lead.find({ user: req.user._id })
    .populate("car", "brand model year price images")
    .sort("-createdAt");

  res.json({ items });
};

const TestDrive = require("../models/TestDrive");
const Car = require("../models/Car");

exports.create = async (req, res) => {
  const { carId, name, phone, email, date, time, location } = req.body;

  if (!carId || !name?.trim() || !phone?.trim() || !date) {
    return res.status(400).json({
      message: "carId, name, phone and date are required",
    });
  }

  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }

  const request = await TestDrive.create({
    user: req.user._id,
    car: car._id,
    name: name.trim(),
    phone: phone.trim(),
    email: String(email || "").trim().toLowerCase(),
    location: String(location || "").trim(),
    date: String(date).trim(),
    time: String(time || "").trim(),
  });

  const populated = await request.populate("car");

  res.status(201).json({
    message: "Test drive request submitted",
    item: populated,
  });
};

exports.mine = async (req, res) => {
  const items = await TestDrive.find({ user: req.user._id })
    .populate("car")
    .sort({ createdAt: -1 });

  res.json({ items });
};

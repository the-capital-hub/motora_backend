const Wishlist = require("../models/Wishlist");
const Car = require("../models/Car");

exports.listMine = async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate("car")
    .sort({ createdAt: -1 });

  res.json({
    items,
    cars: items.map((item) => item.car).filter(Boolean),
  });
};

exports.add = async (req, res) => {
  const { carId } = req.params;

  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }

  const item = await Wishlist.findOneAndUpdate(
    { user: req.user._id, car: carId },
    { user: req.user._id, car: carId },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ message: "Added to wishlist", item });
};

exports.remove = async (req, res) => {
  const { carId } = req.params;

  await Wishlist.findOneAndDelete({
    user: req.user._id,
    car: carId,
  });

  res.json({ message: "Removed from wishlist" });
};

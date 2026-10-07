const User = require("../models/User");
const Lead = require("../models/Lead");

exports.me = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

exports.updateMe = async (req, res) => {
  const allowed = {};
  if (req.body.name !== undefined) allowed.name = String(req.body.name).trim();
  if (req.body.phone !== undefined) allowed.phone = String(req.body.phone).trim();

  if (allowed.name !== undefined && !allowed.name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    allowed,
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

exports.myLeads = async (req, res) => {
  const items = await Lead.find({ user: req.user._id })
    .populate("car", "brand model year price images")
    .sort("-createdAt");

  res.json({ items });
};

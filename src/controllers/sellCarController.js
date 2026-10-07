const SellCarRequest = require("../models/SellCarRequest");

exports.create = async (req, res) => {
  const {
    name,
    owner,
    phone,
    email,
    brand,
    make,
    model,
    variant,
    year,
    km,
    kilometers,
    fuel,
    transmission,
    condition,
    expectedPrice,
    location,
    city,
    images,
    photoCount,
  } = req.body;

  const finalBrand = String(brand || make || "").trim();
  const finalKm = Number(km ?? kilometers);

  if (
    !name?.trim() ||
    !phone?.trim() ||
    !finalBrand ||
    !model?.trim() ||
    !year ||
    !Number.isFinite(finalKm) ||
    !fuel ||
    !transmission ||
    !condition ||
    !location?.trim()
  ) {
    return res.status(400).json({
      message: "Please provide all required sell car details",
    });
  }

  const request = await SellCarRequest.create({
    user: req.user._id,
    name: name.trim(),
    owner: String(owner || name).trim(),
    phone: phone.trim(),
    email: String(email || "").trim().toLowerCase(),
    brand: finalBrand,
    make: finalBrand,
    model: model.trim(),
    variant: String(variant || "").trim(),
    year: Number(year),
    km: finalKm,
    kilometers: finalKm,
    fuel: String(fuel).trim(),
    transmission: String(transmission).trim(),
    condition: String(condition).trim(),
    expectedPrice: Number(expectedPrice || 0),
    location: location.trim(),
    city: String(city || location).trim(),
    images: Array.isArray(images) ? images : [],
    photoCount: Number(photoCount || 0),
  });

  res.status(201).json({
    message: "Sell request submitted",
    item: request,
  });
};

exports.mine = async (req, res) => {
  const items = await SellCarRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({ items });
};

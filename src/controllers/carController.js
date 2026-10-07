const Car = require('../models/Car');

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const allowedCarFields = [
  'brand', 'model', 'variant', 'year', 'price', 'type', 'fuel',
  'transmission', 'km', 'location', 'images', 'description',
  'status', 'featured', 'specs',
];

const pickCarFields = (body = {}) =>
  Object.fromEntries(
    allowedCarFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]]),
  );

exports.list = async (req, res) => {
  const {
    search,
    brand,
    type,
    fuel,
    transmission,
    location,
    status,
    featured,
    minPrice,
    maxPrice,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {};

  if (search) {
    const safeSearch = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { brand: safeSearch },
      { model: safeSearch },
      { type: safeSearch },
      { variant: safeSearch },
    ];
  }

  if (brand && brand !== 'All') filter.brand = brand;
  if (type && type !== 'All') filter.type = type;
  if (fuel && fuel !== 'All') filter.fuel = fuel;
  if (transmission && transmission !== 'All') filter.transmission = transmission;
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (status && status !== 'All') filter.status = status;
  if (featured !== undefined && featured !== '') filter.featured = featured === 'true';

  const minimum = toFiniteNumber(minPrice);
  const maximum = toFiniteNumber(maxPrice);

  if (minimum !== null || maximum !== null) {
    filter.price = {};
    if (minimum !== null) filter.price.$gte = minimum;
    if (maximum !== null) filter.price.$lte = maximum;
  }

  const allowedSorts = new Set([
    'createdAt', '-createdAt',
    'price', '-price',
    'year', '-year',
    'brand', '-brand',
    'featured', '-featured',
  ]);

  const safeSort = allowedSorts.has(sort) ? sort : '-createdAt';
  const requestedLimit = Number.parseInt(limit, 10);
  const requestedPage = Number.parseInt(page, 10);
  const size = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 12, 1), 100);
  const currentPage = Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1);

  const [items, total] = await Promise.all([
    Car.find(filter)
      .sort(safeSort)
      .skip((currentPage - 1) * size)
      .limit(size)
      .lean(),
    Car.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: {
      page: currentPage,
      limit: size,
      total,
      pages: Math.ceil(total / size),
    },
  });
};

exports.getOne = async (req, res) => {
  const car = await Car.findById(req.params.id).lean();
  if (!car) return res.status(404).json({ message: 'Car not found' });
  res.json(car);
};

exports.create = async (req, res) => {
  const payload = pickCarFields(req.body);
  const car = await Car.create(payload);
  res.status(201).json(car);
};

exports.update = async (req, res) => {
  const payload = pickCarFields(req.body);
  const car = await Car.findByIdAndUpdate(
    req.params.id,
    payload,
    { new: true, runValidators: true },
  );

  if (!car) return res.status(404).json({ message: 'Car not found' });
  res.json(car);
};

exports.remove = async (req, res) => {
  const car = await Car.findByIdAndDelete(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  res.json({ message: 'Car deleted' });
};

exports.meta = async (req, res) => {
  const [brands, types, fuels, locations] = await Promise.all([
    Car.distinct('brand'),
    Car.distinct('type'),
    Car.distinct('fuel'),
    Car.distinct('location'),
  ]);

  res.json({ brands, types, fuels, locations });
};

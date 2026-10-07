const Car = require('../models/Car');

const clean = (value = '') => String(value).trim();
const money = (value) => Number(value || 0);

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildText = (car) => [
  car.brand, car.model, car.variant, car.type, car.fuel,
  car.transmission, car.location, car.description,
  car.specs?.engine, car.specs?.power, car.specs?.mileage,
  ...(car.specs?.features || []),
].filter(Boolean).join(' ').toLowerCase();

const scoreCar = (car, preferences = {}) => {
  let score = 0;
  const text = buildText(car);
  const budget = money(preferences.maxPrice);
  const minPrice = money(preferences.minPrice);

  if (budget && car.price <= budget) score += 30;
  else if (budget && car.price <= budget * 1.1) score += 12;
  if (minPrice && car.price >= minPrice) score += 8;
  if (preferences.type && car.type?.toLowerCase() === String(preferences.type).toLowerCase()) score += 20;
  if (preferences.fuel && car.fuel?.toLowerCase() === String(preferences.fuel).toLowerCase()) score += 15;
  if (preferences.transmission && car.transmission?.toLowerCase() === String(preferences.transmission).toLowerCase()) score += 15;
  if (preferences.brand && car.brand?.toLowerCase() === String(preferences.brand).toLowerCase()) score += 12;
  if (preferences.location && car.location?.toLowerCase().includes(String(preferences.location).toLowerCase())) score += 10;
  if (preferences.query) {
    const terms = String(preferences.query).toLowerCase().split(/\s+/).filter((x) => x.length > 2);
    score += terms.reduce((sum, term) => sum + (text.includes(term) ? 4 : 0), 0);
  }
  if (car.featured) score += 3;
  if (car.status === 'Available') score += 5;
  return score;
};

exports.search = async (req, res) => {
  const {
    q = '', brand, type, fuel, transmission, location,
    minPrice, maxPrice, sort = 'relevance', limit = 12,
  } = req.query;

  const filter = { status: 'Available' };
  if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, 'i');
  if (type) filter.type = new RegExp(`^${escapeRegex(type)}$`, 'i');
  if (fuel) filter.fuel = new RegExp(`^${escapeRegex(fuel)}$`, 'i');
  if (transmission) filter.transmission = new RegExp(`^${escapeRegex(transmission)}$`, 'i');
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ brand: rx }, { model: rx }, { variant: rx }, { type: rx }, { fuel: rx }, { location: rx }];
  }

  let cars = await Car.find(filter).limit(Math.min(Math.max(Number(limit) || 12, 1), 50));
  if (sort === 'price-asc') cars = cars.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') cars = cars.sort((a, b) => b.price - a.price);
  else if (sort === 'year-desc') cars = cars.sort((a, b) => b.year - a.year);
  else if (sort === 'relevance') cars = cars.sort((a, b) => scoreCar(b, { query: q, brand, type, fuel, transmission, location, minPrice, maxPrice }) - scoreCar(a, { query: q, brand, type, fuel, transmission, location, minPrice, maxPrice }));

  res.json({ items: cars, count: cars.length });
};

exports.recommend = async (req, res) => {
  const preferences = req.body || {};
  const cars = await Car.find({ status: 'Available' }).limit(100);
  const items = cars
    .map((car) => ({ car, score: scoreCar(car, preferences) }))
    .sort((a, b) => b.score - a.score || a.car.price - b.car.price)
    .slice(0, Math.min(Math.max(Number(preferences.limit) || 6, 1), 12));

  res.json({ preferences, items });
};

exports.compare = async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? [...new Set(req.body.ids)].slice(0, 4) : [];
  if (ids.length < 2) return res.status(400).json({ message: 'Select at least 2 cars to compare' });

  const cars = await Car.find({ _id: { $in: ids } });
  const ordered = ids.map((id) => cars.find((car) => String(car._id) === String(id))).filter(Boolean);
  res.json({ items: ordered });
};

const parseAssistant = (message = '') => {
  const text = clean(message).toLowerCase();
  const preferences = { query: message };
  const budgetMatch = text.match(/(?:under|below|within|upto|up to|less than)\s*(?:₹|rs\.?|inr)?\s*([\d,.]+)\s*(lakh|lac|l)?/i);
  if (budgetMatch) {
    let value = Number(budgetMatch[1].replace(/,/g, ''));
    if (budgetMatch[2] && /lakh|lac|l/i.test(budgetMatch[2])) value *= 100000;
    preferences.maxPrice = value;
  }
  if (/automatic|amt|dct|cvt/.test(text)) preferences.transmission = 'Automatic';
  if (/manual/.test(text)) preferences.transmission = 'Manual';
  if (/diesel/.test(text)) preferences.fuel = 'Diesel';
  if (/petrol/.test(text)) preferences.fuel = 'Petrol';
  if (/electric|ev/.test(text)) preferences.fuel = 'Electric';
  if (/hybrid/.test(text)) preferences.fuel = 'Hybrid';
  if (/suv/.test(text)) preferences.type = 'SUV';
  if (/sedan/.test(text)) preferences.type = 'Sedan';
  if (/hatchback/.test(text)) preferences.type = 'Hatchback';
  if (/mpv|muv/.test(text)) preferences.type = 'MUV';
  return preferences;
};

exports.assistant = async (req, res) => {
  const message = clean(req.body?.message);
  if (!message) return res.status(400).json({ message: 'Message is required' });

  const preferences = parseAssistant(message);
  const cars = await Car.find({ status: 'Available' }).limit(100);
  const matches = cars
    .map((car) => ({ car, score: scoreCar(car, preferences) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const filters = Object.entries(preferences)
    .filter(([key, value]) => key !== 'query' && value)
    .map(([key, value]) => `${key}: ${value}`);

  const reply = matches.length
    ? `I found ${matches.length} available car${matches.length > 1 ? 's' : ''} matching your request${filters.length ? ` (${filters.join(', ')})` : ''}. Here are the closest matches from the current Motora inventory.`
    : 'I could not find a close match in the current Motora inventory. Try increasing the budget or changing fuel, transmission, or vehicle type.';

  res.json({ reply, preferences, items: matches });
};

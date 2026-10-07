const Car = require('../models/Car');
const User = require('../models/User');
const TestDrive = require('../models/TestDrive');
const SellCarRequest = require('../models/SellCarRequest');
const Lead = require('../models/Lead');
const AdminAuditLog = require('../models/AdminAuditLog');

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const safeRegex = (value = '') => new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const recordAudit = async (req, action, entity, entityId, summary, metadata = {}) => {
  try {
    if (!req.user?._id) return;
    await AdminAuditLog.create({
      actor: req.user._id,
      action,
      entity,
      entityId: entityId ? String(entityId) : '',
      summary,
      metadata,
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

exports.stats = async (req, res) => {
  const [cars, users, testDrives, sellRequests, leads, available, reserved, sold] = await Promise.all([
    Car.countDocuments(),
    User.countDocuments({ role: 'user' }),
    TestDrive.countDocuments(),
    SellCarRequest.countDocuments(),
    Lead.countDocuments(),
    Car.countDocuments({ status: 'Available' }),
    Car.countDocuments({ status: 'Reserved' }),
    Car.countDocuments({ status: 'Sold' }),
  ]);

  const [pendingTestDrives, newSellRequests, newLeads] = await Promise.all([
    TestDrive.countDocuments({ status: 'Requested' }),
    SellCarRequest.countDocuments({ status: 'New' }),
    Lead.countDocuments({ status: 'New' }),
  ]);

  const [brands, types, recentCars, recentTestDrives, recentSellRequests, recentLeads] = await Promise.all([
    Car.aggregate([{ $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 10 }]),
    Car.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
    Car.find().sort('-createdAt').limit(5).select('brand model year price status featured images createdAt'),
    TestDrive.find().populate('user', 'name phone').populate('car', 'brand model year').sort('-createdAt').limit(5),
    SellCarRequest.find().populate('user', 'name email phone').sort('-createdAt').limit(5),
    Lead.find().populate('user', 'name email phone').populate('car', 'brand model year').sort('-createdAt').limit(5),
  ]);

  res.json({
    cars, users, testDrives, sellRequests, leads,
    available, reserved, sold,
    pendingTestDrives, newSellRequests, newLeads,
    inventory: { brands, types },
    recent: { cars: recentCars, testDrives: recentTestDrives, sellRequests: recentSellRequests, leads: recentLeads },
  });
};

exports.analytics = async (req, res) => {
  const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 12);
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [leadTrend, testDriveTrend, sellTrend, inventoryByType, inventoryByBrand, statusBreakdown] = await Promise.all([
    Lead.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
    TestDrive.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
    SellCarRequest.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
    Car.aggregate([{ $group: { _id: { $ifNull: ['$type', 'Other'] }, count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
    Car.aggregate([{ $group: { _id: { $ifNull: ['$brand', 'Other'] }, count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 10 }]),
    Promise.all([
      Car.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      TestDrive.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]),
  ]);

  const totalLeads = await Lead.countDocuments();
  const convertedLeads = await Lead.countDocuments({ status: 'Converted' });
  const conversionRate = totalLeads ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

  res.json({
    months,
    trends: { leads: leadTrend, testDrives: testDriveTrend, sellRequests: sellTrend },
    inventoryByType,
    inventoryByBrand,
    statusBreakdown: { cars: statusBreakdown[0], leads: statusBreakdown[1], testDrives: statusBreakdown[2] },
    conversionRate,
    totals: { totalLeads, convertedLeads },
  });
};

exports.listCars = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.featured !== undefined) filter.featured = req.query.featured === 'true';
  if (req.query.search) {
    const search = safeRegex(req.query.search);
    filter.$or = [{ brand: search }, { model: search }, { variant: search }, { location: search }];
  }
  const [items, total] = await Promise.all([
    Car.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Car.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.createCar = async (req, res) => {
  const car = await Car.create(req.body);
  await recordAudit(req, 'CREATE', 'Car', car._id, `Created vehicle ${car.brand} ${car.model}`);
  res.status(201).json(car);
};

exports.updateCar = async (req, res) => {
  const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!car) return res.status(404).json({ message: 'Car not found' });
  await recordAudit(req, 'UPDATE', 'Car', car._id, `Updated vehicle ${car.brand} ${car.model}`, { fields: Object.keys(req.body) });
  res.json(car);
};

exports.deleteCar = async (req, res) => {
  const car = await Car.findByIdAndDelete(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  await recordAudit(req, 'DELETE', 'Car', car._id, `Deleted vehicle ${car.brand} ${car.model}`);
  res.json({ message: 'Car deleted successfully' });
};

exports.bulkUpdateCars = async (req, res) => {
  const { ids, status, featured } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'At least one vehicle is required' });
  if (status !== undefined && !['Available', 'Reserved', 'Sold'].includes(status)) return res.status(400).json({ message: 'Invalid vehicle status' });
  if (featured !== undefined && typeof featured !== 'boolean') return res.status(400).json({ message: 'Featured must be true or false' });

  const update = {};
  if (status !== undefined) update.status = status;
  if (featured !== undefined) update.featured = featured;
  if (!Object.keys(update).length) return res.status(400).json({ message: 'No bulk changes supplied' });

  const result = await Car.updateMany({ _id: { $in: ids } }, { $set: update });
  await recordAudit(req, 'BULK_UPDATE', 'Car', '', `Bulk updated ${result.modifiedCount} vehicles`, { ids, update });
  res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
};

exports.listUsers = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { role: 'user' };
  if (req.query.search) {
    const search = safeRegex(req.query.search);
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }
  if (req.query.active === 'true') filter.isActive = { $ne: false };
  if (req.query.active === 'false') filter.isActive = false;
  const [items, total] = await Promise.all([
    User.find(filter).select('-password').sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.getUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: { $in: ['user', 'admin'] } }).select('-password');
  if (!user) return res.status(404).json({ message: 'Customer not found' });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const allowed = {};
  ['name', 'phone', 'isActive'].forEach((key) => { if (req.body[key] !== undefined) allowed[key] = req.body[key]; });
  if (req.body.role !== undefined) {
    if (!['user', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
    allowed.role = req.body.role;
  }
  if (req.params.id === String(req.user._id) && (allowed.role === 'user' || allowed.isActive === false)) {
    return res.status(400).json({ message: 'You cannot disable or demote your own admin account' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  await recordAudit(req, 'UPDATE', 'User', user._id, `Updated user ${user.email}`, { fields: Object.keys(allowed) });
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  if (req.params.id === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete your own admin account' });
  const user = await User.findOneAndDelete({ _id: req.params.id, role: 'user' });
  if (!user) return res.status(404).json({ message: 'Customer not found' });
  await recordAudit(req, 'DELETE', 'User', user._id, `Deleted customer ${user.email}`);
  res.json({ message: 'Customer deleted successfully' });
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const allowed = {};
  ['name', 'phone'].forEach((key) => { if (req.body[key] !== undefined) allowed[key] = req.body[key]; });
  const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'Admin profile not found' });
  await recordAudit(req, 'UPDATE', 'AdminProfile', user._id, 'Updated admin profile', { fields: Object.keys(allowed) });
  res.json(user);
};

exports.listAuditLogs = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.action) filter.action = req.query.action;
  if (req.query.search) filter.summary = safeRegex(req.query.search);
  const [items, total] = await Promise.all([
    AdminAuditLog.find(filter).populate('actor', 'name email').sort('-createdAt').skip(skip).limit(limit),
    AdminAuditLog.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.listTestDrives = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) { const search = safeRegex(req.query.search); filter.$or = [{ name: search }, { phone: search }]; }
  const [items, total] = await Promise.all([
    TestDrive.find(filter).populate('user', 'name email phone').populate('car', 'brand model year price images').sort('-createdAt').skip(skip).limit(limit),
    TestDrive.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.updateTestDriveStatus = async (req, res) => {
  const allowed = ['Requested', 'Confirmed', 'Completed', 'Cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid test drive status' });
  const item = await TestDrive.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).populate('user', 'name email phone').populate('car', 'brand model year price images');
  if (!item) return res.status(404).json({ message: 'Test drive not found' });
  await recordAudit(req, 'STATUS_CHANGE', 'TestDrive', item._id, `Changed test drive status to ${item.status}`, { status: item.status });
  res.json(item);
};

exports.listSellRequests = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) { const search = safeRegex(req.query.search); filter.$or = [{ name: search }, { email: search }, { phone: search }, { brand: search }, { model: search }, { location: search }]; }
  const [items, total] = await Promise.all([
    SellCarRequest.find(filter).populate('user', 'name email phone').sort('-createdAt').skip(skip).limit(limit),
    SellCarRequest.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.updateSellRequestStatus = async (req, res) => {
  const allowed = ['New', 'Inspection', 'Offer Sent', 'Approved', 'Rejected'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid sell request status' });
  const item = await SellCarRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).populate('user', 'name email phone');
  if (!item) return res.status(404).json({ message: 'Sell request not found' });
  await recordAudit(req, 'STATUS_CHANGE', 'SellCarRequest', item._id, `Changed sell request status to ${item.status}`, { status: item.status });
  res.json(item);
};

exports.listLeads = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) { const search = safeRegex(req.query.search); filter.$or = [{ name: search }, { email: search }, { phone: search }, { message: search }]; }
  const [items, total] = await Promise.all([
    Lead.find(filter).populate('user', 'name email phone').populate('car', 'brand model year price').sort('-createdAt').skip(skip).limit(limit),
    Lead.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.updateLeadStatus = async (req, res) => {
  const allowed = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid lead status' });
  const item = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).populate('user', 'name email phone').populate('car', 'brand model year price');
  if (!item) return res.status(404).json({ message: 'Lead not found' });
  await recordAudit(req, 'STATUS_CHANGE', 'Lead', item._id, `Changed lead status to ${item.status}`, { status: item.status });
  res.json(item);
};

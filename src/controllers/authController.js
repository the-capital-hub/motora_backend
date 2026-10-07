const bcrypt = require('bcryptjs');
const User = require('../models/User');
const token = require('../utils/token');

const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });

exports.register = async (req, res) => {
  const { name, email, phone, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!name || !normalizedEmail || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
  if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name: String(name).trim(), email: normalizedEmail, phone, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ user: safeUser(user), token: token(user._id) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ user: safeUser(user), token: token(user._id) });
};

exports.me = async (req, res) => res.json({ user: safeUser(req.user) });

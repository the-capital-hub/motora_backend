const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);
router.patch('/', async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (newPassword !== undefined) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (String(newPassword).length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    user.password = await bcrypt.hash(newPassword, 12);
  }
  await user.save();
  res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

module.exports = router;

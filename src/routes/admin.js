const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', c.stats);
router.get('/analytics', c.analytics);

router.get('/users', c.listUsers);
router.get('/users/:id', c.getUser);
router.patch('/users/:id', c.updateUser);
router.delete('/users/:id', c.deleteUser);

router.get('/profile', c.getProfile);
router.patch('/profile', c.updateProfile);

router.get('/cars', c.listCars);
router.post('/cars', c.createCar);
router.patch('/cars/bulk', c.bulkUpdateCars);
router.patch('/cars/:id', c.updateCar);
router.delete('/cars/:id', c.deleteCar);

router.get('/audit-logs', c.listAuditLogs);

router.get('/test-drives', c.listTestDrives);
router.patch('/test-drives/:id/status', c.updateTestDriveStatus);

router.get('/sell-requests', c.listSellRequests);
router.patch('/sell-requests/:id/status', c.updateSellRequestStatus);

router.get('/leads', c.listLeads);
router.patch('/leads/:id/status', c.updateLeadStatus);

module.exports = router;

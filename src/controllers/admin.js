const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// Dashboard
router.get('/stats', c.stats);

// Inventory
router.get('/cars', c.listCars);

// Customers
router.get('/users', c.listUsers);
router.get('/users/:id', c.getUser);
router.patch('/users/:id', c.updateUser);
router.delete('/users/:id', c.deleteUser);

// Test drives
router.get('/test-drives', c.listTestDrives);
router.patch('/test-drives/:id/status', c.updateTestDriveStatus);

// Sell requests
router.get('/sell-requests', c.listSellRequests);
router.patch('/sell-requests/:id/status', c.updateSellRequestStatus);

// Leads / enquiries
router.get('/leads', c.listLeads);
router.patch('/leads/:id/status', c.updateLeadStatus);

module.exports = router;

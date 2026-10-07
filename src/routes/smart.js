const router = require('express').Router();
const c = require('../controllers/smartController');

router.get('/search', c.search);
router.post('/recommend', c.recommend);
router.post('/compare', c.compare);
router.post('/assistant', c.assistant);

module.exports = router;

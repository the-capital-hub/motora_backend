const router = require("express").Router();
const controller = require("../controllers/clientController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/me", controller.me);
router.patch("/me", controller.updateMe);

module.exports = router;

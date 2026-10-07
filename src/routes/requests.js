const router = require("express").Router();

const testDrive = require("../controllers/testDriveController");
const sellCar = require("../controllers/sellCarController");
const lead = require("../controllers/leadController");
const { protect } = require("../middleware/auth");

router.post("/test-drives", protect, testDrive.create);
router.get("/mine/test-drives", protect, testDrive.mine);

router.post("/sell-requests", protect, sellCar.create);
router.get("/mine/sell-requests", protect, sellCar.mine);

router.post("/leads", protect, lead.create);
router.get("/mine/leads", protect, lead.mine);

module.exports = router;

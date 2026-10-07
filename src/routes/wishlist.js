const router = require("express").Router();

const c = require("../controllers/wishlistController");
const { protect } = require("../middleware/auth");

router.get("/", protect, c.listMine);
router.post("/:carId", protect, c.add);
router.delete("/:carId", protect, c.remove);

module.exports = router;

const router = require("express").Router();
const c = require("../controllers/carController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", c.list);
router.get("/meta", c.meta);
router.get("/:id", c.getOne);

router.post("/", protect, adminOnly, c.create);
router.patch("/:id", protect, adminOnly, c.update);
router.delete("/:id", protect, adminOnly, c.remove);

module.exports = router;

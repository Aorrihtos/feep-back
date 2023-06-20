const router = require("express").Router();
const auth = require("../middlewares/auth");
const BlockController = require("../controllers/BlockController");

router.post("/add/:blockedId", auth, BlockController.add);
router.delete("/pardon/:id", auth, BlockController.pardon);

module.exports = router;
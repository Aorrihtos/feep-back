const router = require("express").Router();
const LikeController = require("../controllers/LikeController");
const auth = require("../middlewares/auth");

router.post("/like/:id", auth, LikeController.like);
router.delete("/unlike/:id", auth, LikeController.unlike);

module.exports = router;
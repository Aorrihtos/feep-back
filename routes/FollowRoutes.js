const express = require("express");
const FollowController = require("../controllers/FollowController");
const auth = require("../middlewares/auth")
const router = express.Router();

router.post("/follow/:id", auth, FollowController.follow);
router.delete("/unfollow/:id", auth, FollowController.unfollow);

module.exports = router;
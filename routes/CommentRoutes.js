const router = require("express").Router();
const CommentController = require("../controllers/CommentController");
const auth = require("../middlewares/auth");

router.post("/send/:postId", auth, CommentController.send);

module.exports = router;
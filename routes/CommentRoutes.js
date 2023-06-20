const router = require("express").Router();
const CommentController = require("../controllers/CommentController");
const auth = require("../middlewares/auth");

router.post("/send/:postId", auth, CommentController.send);
router.delete("/remove/:id", auth, CommentController.remove);
router.put("/like/:id", auth, CommentController.like);
router.put("/unlike/:id", auth, CommentController.unlike);

module.exports = router;
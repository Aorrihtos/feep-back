const router = require("express").Router();
const PostController = require("../controllers/PostController");
const auth = require("../middlewares/auth");

router.post("/upload", auth, PostController.upload);
router.delete("/remove/:id", auth, PostController.remove);

module.exports = router;
const router = require("express").Router();
const PostController = require("../controllers/PostController");
const auth = require("../middlewares/auth");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "./uploads/posts")
    },
    filename: (req,file,cb) =>{
        cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`)
    }
});

const upload = multer({storage}).single("file0")

router.post("/upload", [auth,upload], PostController.upload);
router.delete("/remove/:id", auth, PostController.remove);
router.get("/detail/:id", auth, PostController.detail);

module.exports = router;
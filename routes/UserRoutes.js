const express = require("express");
const UserController = require("../controllers/UserController");
const multer = require("multer");
const router = express.Router();

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null,"./uploads/profiles")
    },
    filename: (req, file, cb) =>{
        cb(null, `${req.user.username}-${file.originalname}`)
    }
});

// Middlewares
const auth = require("../middlewares/auth");
const uploads = multer({storage});

// Routes
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.delete("/remove", auth, UserController.remove);
router.get("/profile-pic/:id?", auth, UserController.getProfilePic);
router.post("/upload", [auth, uploads.single("file0")], UserController.upload);
router.put("/update", auth, UserController.update);
router.get("/following/:id?", auth, UserController.following);
router.get("/followers/:id?", auth, UserController.followers);
router.post("/detail/:id?", auth, UserController.detail);

module.exports = router;
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

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Everything about Users
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo document id
 *           example: 64918602143b41c789e2eddf
 *         name:
 *           type: string
 *           description: Name of the user
 *           example: Sergio
 *         surname:
 *           type: string
 *           description: Surname of the user. Can be null.
 *           example: Ferrer Canet
 *         username:
 *           type: string
 *           description: Username of the user
 *           example: Aorih
 *         email:
 *           type: string
 *           description: Email of the user
 *           example: aorih@gmail.com
 *         profile_pic:
 *           type: string
 *           description: Name of the profile pic of the user
 *           example: default-profile.png
 */

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
router.get("/:id?/posts", auth, UserController.getPosts);
router.get("/blocks", auth, UserController.blocked);
router.get("/feed", auth, UserController.feed);
router.get("/search", auth, UserController.searcher);

module.exports = router;
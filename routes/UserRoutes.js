const express = require("express");
const UserController = require("../controllers/UserController")
const router = express.Router();

// Middlewares
const auth = require("../middlewares/auth");

// Routes
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.delete("/remove", auth, UserController.remove);

module.exports = router;
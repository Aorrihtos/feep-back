const router = require("express").Router();
const auth = require("../middlewares/auth");
const NewsletterController = require("../controllers/NewsletterController");

router.post("/add", auth, NewsletterController.addSubscription);

module.exports = router;
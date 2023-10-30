const auth = require("../middlewares/auth");
const router = require("express").Router();
const NotificationController = require("../controllers/NotificationController");

router.patch('/read', auth, NotificationController.readAllNotifications);
router.patch('/read/:id', auth, NotificationController.markOneAsRead);

module.exports = router;
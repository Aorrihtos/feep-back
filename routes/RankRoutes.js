const router = require("express").Router();
const RankController = require("../controllers/RankController");

router.get("/get", RankController.getRank);

module.exports = router;
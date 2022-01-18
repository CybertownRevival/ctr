const express = require("express");
const router = express.Router();

const messageContoler = require('../controllers/message.js');

router.get("/place/:placeId", messageContoler.getResults);
router.post("/place/:placeId", messageContoler.addMessage);

module.exports = router;

const express = require("express");
const router = express.Router();

const avatarController = require('../controllers/avatar.js');

router.get("", avatarController.getResults);

module.exports = router;

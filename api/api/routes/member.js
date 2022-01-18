const express = require("express");
const router = express.Router();

const memberController = require('../controllers/member.js');

router.post("/signup", memberController.signup);
router.post("/login", memberController.login);
router.get("/session", memberController.session);
router.post("/update_password", memberController.updatePassword);
router.post("/update_avatar", memberController.updateAvatar);

module.exports = router;

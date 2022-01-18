const express = require("express");
const router = express.Router();

const objectInstanceController = require('../controllers/object_instance.js');

//todo get a place
router.post("/:id/position", objectInstanceController.updateObjectInstancePosition);

module.exports = router;

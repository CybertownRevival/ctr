const express = require("express");
const router = express.Router();

const placeController = require('../controllers/place.js');

//todo get a place
router.get("/:slug/object_instance", placeController.getPlaceObjects);
router.get("/:slug", placeController.getPlace);

module.exports = router;

const express = require('express');
const { getWebsiteData, activityLog, notificationDetails } = require('../controller/website');

const router = express.Router();

router.get("/get-website-data", getWebsiteData);
router.post("/activity-log", activityLog);
router.post("/notification", notificationDetails);
module.exports = router;
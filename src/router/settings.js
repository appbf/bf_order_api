const express = require('express');
const { webSettings,vaidateWebSettings,getrefferellist,getairdroplist,getremotetrading,updateremotetrading } = require('../controller/settings');

const router = express.Router();

router.get("/settings", webSettings);
router.post("/updatesettings", vaidateWebSettings);
router.get("/getrefferellist", getrefferellist);
router.get("/getairdroplist", getairdroplist);
router.get("/getremotetrading", getremotetrading);
router.post("/updateremotetrading", updateremotetrading);



module.exports = router;
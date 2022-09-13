const express = require('express');
const { chart, history , config, marks,getVHL, study_templates, time, symbols, charthistory, symbol_info, timescale_marks} = require('../controller/chart');
const router = express.Router();

router.get("/getChart", chart);
router.get("/get_history", history);

router.get("/chart/config", config);
router.get("/chart/marks", marks);
router.get("/chart/study_templates", study_templates);
router.get("/chart/time", time);
router.get("/chart/symbols", symbols);
router.get("/chart/history", charthistory);
router.get("/chart/symbol_info", symbol_info);
router.get("/chart/timescale_marks", timescale_marks);

router.post("/chart/getVHL", getVHL);
module.exports = router;
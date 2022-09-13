const express = require('express');
const { hello } = require('../controller/hello');
const router = express.Router();
router.get("/hello", hello);

module.exports = router;
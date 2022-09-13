
const express = require('express');
const { setBankDetails, getBankStatus, inrWithdraw, successInrWithdraw, getBank } = require('../controller/banking');
const router = express.Router();

router.post("/banking/set-banking-info", setBankDetails); 
router.post("/banking/get-banking-status", getBankStatus);
router.post("/banking/inr_withdrawal", inrWithdraw);
router.post("/success-inr-withdrawal", successInrWithdraw);
router.post("/banking/get-bank", getBank);

module.exports = router;
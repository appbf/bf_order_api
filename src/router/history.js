const express = require('express');
const { 
    trade_history, 
    deposite_history, 
    fundtranfer_history, 
    crypto_transaction_history,
    fundHistory, 
    depositHistory,
    withdrawHistory,
    tradeHistory, 
    orderHistory
    } = require('../controller/history');

const router = express.Router();






router.post("/trade_history", trade_history);
router.post("/deposite_history", deposite_history)
router.post("/fundtranfer_history", fundtranfer_history)
router.post("/crypto_transaction_history", crypto_transaction_history)
router.post("/user-fund-history", fundHistory)
router.post("/admin-deposit-history", depositHistory)
router.post("/admin-withdraw-history", withdrawHistory)
router.post("/admin-trade-history", tradeHistory)
router.post("/admin-order-history", orderHistory)





module.exports = router;
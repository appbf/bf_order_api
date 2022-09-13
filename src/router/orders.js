const express = require('express');
const { sellOrder, buyOrder, orderHistory,getBtexUsdtPrice, cancleOrder, openOrder, allHistory, executeOrder,executeOrders, createOrder, exeOrder } = require('../controller/orders');
const { isKycDone, isPaired, isvalidPrice } = require('../utils/functions');
const { orderValidator,underMaintenance, orderPriceValidator } = require('../utils/middleware');

const router = express.Router();

router.post("/sell-order-maintenance",underMaintenance);
router.post("/buy-order-maintenance", underMaintenance);
router.post('/cancle-order-maintenance',  underMaintenance);

router.post("/sell-order" , isPaired, orderValidator, orderPriceValidator, sellOrder);
router.post("/buy-order", isPaired, orderValidator, orderPriceValidator, buyOrder);
router.post("/sell-order1",  isPaired, isvalidPrice, orderValidator, createOrder);
router.post("/buy-order1",  isPaired,isvalidPrice, orderValidator, createOrder);
router.post("/execute-orders", exeOrder);
router.post('/order-history', orderHistory);
router.post('/cancle-order',  cancleOrder);
router.get('/get-all-order', openOrder);
router.get('/get-all-orderHistory', allHistory);
router.post('/execute-order', executeOrder);
router.post('/btex-usdt', getBtexUsdtPrice);
module.exports = router;
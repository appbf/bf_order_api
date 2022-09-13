const express = require('express');
const router = express.Router();
const { createSellOrderStack, createBuyOrderStack, createOrderHistory, fetchUserInchunks, uploadImage, getH, getName, findWalletsFromContractAddress } = require('../controller/testing');
router.get("/test/add_sell_order", createSellOrderStack);
router.get("/test/add_buy_order", createBuyOrderStack);
router.get("/test/add_order_history", createOrderHistory); 
router.get("/test/fetch-user", fetchUserInchunks);
router.get("/test/fetch-h", getH); 
router.post("/test/get-name", getName); 
router.post("/test/get-wallets-by-contract", findWalletsFromContractAddress); 
// router.post("/test/upload-image", uploadImage);



module.exports = router;
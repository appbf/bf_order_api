const express = require('express');
const { createWallet, createAllWallet,getcoldWallet ,gethotWallet,getallcoin,updatecoldwallet,updatehotwallet, getwallets, getAllWallets, getWithdraw, successWithdraw, transectionHistory,addFundToUser} = require('../controller/wallets');
//deposit function
const { updateUserDeposit } = require('../controller/deposit');
const router = express.Router();
router.get("/coldwallet", getcoldWallet);
router.get("/hotwallet", gethotWallet);
router.post("/updatecoldwallet", updatecoldwallet);
router.post("/updatehotwallet", updatehotwallet);
router.get("/getallcoin", getallcoin);
router.post("/create-wallet", createWallet);
router.post("/create-all-wallet", createAllWallet); 
router.post("/get-wallets", getwallets);
router.post("/get-all-wallets", getAllWallets);
// deposit api
router.post("/update-wallet", updateUserDeposit);

router.post("/get-withdraw", getWithdraw);
router.post("/success-withdrawal", successWithdraw);
router.post("/transection_history", transectionHistory);
router.post("/addfundtouser", addFundToUser);

module.exports = router;
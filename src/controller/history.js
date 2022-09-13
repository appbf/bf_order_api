const TradeHistory = require('../models/trade_history')
const DepositeHistory = require('../models/deposite_history')
const FundTransfer = require('../models/fundtranfer_history')
const CryptoTransfer = require('../models/crypto_transaction_history')
const Wallets = require('../models/wallets');
const { getTradeHistory, getDepositHistory, getWithdrawHistory, getWalletBalance, getOrderHistory } = require('../utils/function.wallets');
const { validateUserId } = require('../utils/validator');

exports.trade_history = async(req, res) => {
    const body = req.body;
    let parmas = {};
    if (body.history_id) {  parmas.history_id = body.history_id; }
    if (body.currency) { parmas.currency_type = body.currency; }
    if (body.compare_currency) { parmas.compare_currency = body.compare_currency; }
    if (body.price) { parmas.price = body.price; }
    if (body.trade_date) { parmas.trade_date = body.trade_date; }
    if (body.sell_user_id) { parmas.sell_user_id = body.sell_user_id; }
    if (body.buy_user_id) { parmas.buy_user_id = body.buy_user_id; }
    if (body.buy_order_id) { parmas.buy_order_id = body.buy_order_id; }
    if (body.sell_order_id) { parmas.sell_order_id = body.sell_order_id;}
    if (body.trade_type) { parmas.trade_type = body.trade_type; }
    try{

        // if (parmas.length > 0) {
            history = await TradeHistory.find(parmas);
            return res.json({
                status: 200,
                history
            })
        // }
}
    catch{
        console.log("Error: >from: controller> trade > trade_history > try: ", error.message);
        res.status(400).json({ message: `${error}` });
    }
};


exports.deposite_history = async(req, res) => {
    const body = req.body;
    // console.log(body)
    let parmas = {};
    if (body.id) {  parmas.id = body.id; }
    if (body.tx_id) { parmas.tx_id = body.tx_id; }
    if (body.symbol) { parmas.symbol = body.symbol; }
    if (body.blockNumber) { parmas.blockNumber = body.blockNumber; }
    if (body.status) { parmas.status = body.status; }
    if (body.value) { parmas.value = body.value; }
    if (body.from_address) { parmas.from_address = body.from_address; }
    if (body.buy_order_id) { parmas.buy_order_id = body.buy_order_id; }
    if (body.to_address) { parmas.to_address = body.to_address;}
    if (body.type) { parmas.type = body.type; }
    try{

        // if (parmas.length > 0) {
            history = await DepositeHistory.aggregate( [
                {
                    $lookup: {
                        from: "user",
                        localField: "user_id",
                        foreignField: "user_id",
                        as: "pending_kyc",
                    }
                },
            ] );
            return res.json({
                status: 200,
                history
            })
        // }
}
    catch{
        console.log("Error: >from: controller> trade > deposite_history > try: ", error.message);
        res.status(400).json({ message: `${error}` });
    }
}

exports.fundtranfer_history = async(req, res) => {
    const body = req.body;
    // console.log(body)
    let parmas = {};
    if (body.to_user) {  parmas.to_user = body.to_user; }
    if (body.from_user) { parmas.from_user = body.from_user; }
    if (body.wallet_type) { parmas.wallet_type = body.wallet_type; }
    if (body.amount) { parmas.amount = body.amount; }
    if (body.date) { parmas.date = body.date; }
    if (body.time) { parmas.time = body.time; }
   
    try{
       
        // if (parmas.length > 0) {
            history = await FundTransfer.aggregate( [
                {
                    $lookup: {
                        from: "pending_kyc",
                        localField: "to_user",
                        foreignField: "user_id",
                        as: "pending_kyc",
                    }
                },
            ] );
            return res.json({
                status: 200,
                history
            })
        // }
}
    catch{
        console.log("Error: >from: controller> trade > trade_history > try: ", error.message);
        res.status(400).json({ message: `${error}` });
    }
}

exports.crypto_transaction_history = async(req, res) => {
    const body = req.body;
    // console.log(body)
    let parmas = {};
    if (body._type) {  parmas._type = body._type; }
    if (body.user_id) { parmas.user_id = body.user_id; }
    if (body.wallet_type) { parmas.wallet_type = body.wallet_type; }
    if (body.from_wallet) { parmas.from_wallet = body.from_wallet; }
    if (body.to_wallet) { parmas.to_wallet = body.to_wallet; }
    if (body.amount) { parmas.amount = body.amount; }
    if (body.transaction_date) { parmas.transaction_date = body.transaction_date; }
    if (body.transaction_time) { parmas.transaction_time = body.transaction_time; }
    if (body.transaction_id) { parmas.transaction_id = body.transaction_id;}
    if (body.remark) { parmas.remark = body.remark; }
    if (body.status) { parmas.status = body.status; }
    if (body.check_sum) { parmas.check_sum = body.check_sum; }
    try{

        // if (parmas.length > 0) {
            history = await CryptoTransfer.find(parmas);
            return res.json({
                status: 200,
                history
            })
        // }
}
    catch{
        console.log("Error: >from: controller> trade > deposite_history > try: ", error.message);
        res.status(400).json({ message: `${error}` });
    }
}

exports.depositHistory = async(req, res) =>  {
    try{
        const { user_id } = req.body;
        if(user_id && validateUserId(user_id)) {
            let deposit = await getDepositHistory(user_id);
            let result = [...deposit].sort((a, b) =>  new Date(b.createdAt) - new Date(a.createdAt));
            if(result) {
                return res.json({
                    status: 200,
                    error: false,
                    params: {
                        deposit: result,
                    },
                    message: "data fetch!!",
                }) 
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Something went wrong, please try again Withdraw history Not Found!!",
                }) 
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invaild",
            }) 
        }
    
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            errorM:error.message
        })
    }
}

exports.withdrawHistory = async(req, res) => {
    try{
        const { user_id } = req.body;
        if(user_id && validateUserId(user_id)) {
            let withdraw = await getWithdrawHistory(user_id);
            let result = [...withdraw].sort((a, b) =>  new Date(b.createdAt) - new Date(a.createdAt));
                if(result) {
                return res.json({
                    status: 200,
                    error: false,
                    params: {
                        withdraw: result,
                    },
                    message: "data fetch!!",
                }) 
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Something went wrong, please try again Withdraw history Not Found!!",
                }) 
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invaild",
            }) 
        }
    
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            errorM:error.message
        })
    }
}

exports.tradeHistory = async(req, res) => {
    try{
        const { user_id } = req.body;
        if(user_id && validateUserId(user_id)) {
            let result = await getTradeHistory(user_id);
            // let result = [...trade].sort((a, b) =>  new Date(b.createdAt) - new Date(a.createdAt));
                if(result) {
                return res.json({
                    status: 200,
                    error: false,
                    params: {
                        trade: result,
                    },
                    message: "data fetch!!",
                }) 
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Something went wrong, please try again Withdraw history Not Found!!",
                }) 
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invaild",
            }) 
        }
    
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            errorM:error.message
        })
    }
}

exports.orderHistory = async(req, res) => {
    try{
        const { user_id } = req.body;
        if(user_id && validateUserId(user_id)) {
            let result = await getOrderHistory(user_id);
            // let result = [...trade].sort((a, b) =>  new Date(b.createdAt) - new Date(a.createdAt));
                if(result) {
                return res.json({
                    status: 200,
                    error: false,
                    params: {
                        order: result,
                    },
                    message: "data fetch!!",
                }) 
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Something went wrong, please try again Withdraw history Not Found!!",
                }) 
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invaild",
            }) 
        }
    
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            errorM:error.message
        })
    }
}

exports.fundHistory = async (req, res) => {
    try{
        const { user_id } = req.body;
        if(user_id && validateUserId(user_id)) {
            const wallet = await Wallets.find({user:user_id});
            var wallet_data = [];
            let a = wallet.map(async (item) => {
                const b_balance = await getWalletBalance(item.wallet_address, item.wallet_type, item.contract_address, item.type);
                wallet_data.push({
                    wallet_address: item.wallet_address,
                    wallet_type: item.wallet_type,
                    b_balance: b_balance,
                    balance: item.balance,
                    locked: item.locked
                })
            });
          Promise.all(a).then((_a)=>{
            return res.json({
                status: 200,
                error: false,
                params:{
                    wallet: wallet_data
                },
                message: "data fetch"
            })
        })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    }catch(error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            errorM:error.message
        })  
    }
}
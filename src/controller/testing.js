const { createSocketClient } = require('../utils/functions.socket');
const { getUserFullNameFromUserId } = require('./user');
const socket = createSocketClient('kujgwvfq-z-ghosttown-z-1fhhup0p6');

function createSellOrderStack(req, res) {
    const { currency_type, compare_currency, raw_price, volume } = req.query;
    let obj = {
        currency_type,
        compare_currency,
        raw_price,
        volume
    }
    socket.emit("update_sell_stack", obj);
    return res.json({
        status: 200,
        error: false,
        message: "Sell stack created!"
    })
}

function createBuyOrderStack(req, res) {
    const { currency_type, compare_currency, raw_price, volume } = req.query;
    let obj = {
        currency_type,
        compare_currency,
        raw_price,
        volume
    }
    socket.emit("update_buy_stack", obj);
    return res.json({
        status: 200,
        error: false,
        message: "Buy stack created!"
    })
}
function createOrderHistory(req, res) {
    const { currency_type, compare_currency, raw_price, volume } = req.query;
    let obj = {
        currency_type,
        compare_currency,
        raw_price,
        volume
    }
    socket.emit("update_order_history", obj);
    return res.json({
        status: 200,
        error: false,
        message: "Order history created!"
    })
}
async function fetchUserInchunks(req, res) {
    /**
     * 
     */
    const limit = req.body.limit ? parseInt(req.body.limit) : 10;
    const skip = req.body.skip ? parseInt(req.body.skip) : 0;
    const User = require('../models/user');
    // console.log(limit)
    let _data = await User.find().skip(skip).limit(limit);
    return res.json({
        status: 200,
        error: false,
        message: "Success",
        data: _data
    })
}
async function uploadImage(req, res) {
    const mime = require('mime');
    const fs = require('fs');
    function decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};

        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        return response;
    }
    var decodedImg = decodeBase64Image('data:image/jpeg;base64,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');
    var imageBuffer = decodedImg.data;
    var type = decodedImg.type;
    var extension = mime.getExtension(type);
    var fileName = Date.now()+"-image." + extension;
    try {
        fs.writeFileSync("./src/d/images/" + fileName, imageBuffer, 'utf8');
    }
    catch (err) {
        console.error(err)
    }
}
async function getH(req, res) {
    try {
        const TradeHistory = require('../models/trade_history');
        const data = await TradeHistory.find({ $or: [{ buy_order_id: 'order$17c9db51f81/b' }, { sell_order_id: 'order$17c9db51f81/b' }] });
        return res.json({
            data: data
        })
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error: ${error.message}`
        })
    }
}
async function getName(req, res) {
    try {
        const name = await getUserFullNameFromUserId(req.body.user_id);
        return res.json({
            status: 200,
            name: name
        })
    } catch (error) {
        return res.json({
            status: 400
        })
    }
}
async function findWalletsFromContractAddress(req, res) {
    const Wallets = require('../models/wallets');
    try {
        const wallet = await Wallets.findOne({contract_address: '0xa29328B3D32605C1d9171fE151C77E2f9Ce96c6b'});
        return res.json({
            status: 200,
            data: wallet
        })
    } catch (error) {
        return res.json({
            status: 400
        })
    }
}
module.exports = {
    createSellOrderStack,
    createBuyOrderStack,
    createOrderHistory,
    fetchUserInchunks,
    getH,
    getName,
    findWalletsFromContractAddress
    // uploadImage
}
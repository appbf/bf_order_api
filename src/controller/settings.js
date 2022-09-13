const { updateWebSettings } = require("../utils/function.settings");

async function webSettings(req, res) {
    try {
        const Settings = require("../models/website_data");
        const { website_name } = req.query;
        let wallet = '';
        if (website_name) {
            wallet = await Settings.findOne({ website_name: website_name});
        }else{
            wallet = await Settings.findOne();
        }
        return res.json(wallet)
    } catch (error) {
        console.log("Error: from: src>controller>settings.js>webSettings: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in webSettings, please try again!"
        })
    }
}
async function vaidateWebSettings(req, res) {
    try {
        let settings = '';
        const Settings = require("../models/website_data");
        settings = await updateWebSettings(req.body);
        let setting = await Settings.findOne(); 
        return res.json({
            status: 200,
            error: false,
            query_status: settings.matchedCount,
            message: "Updated Successfully",
            setting: setting,
        })
    } catch (error) {
        console.log("Error: from: src>controller>currency.js>vaidateWebSettings: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in vaidateWebSettings, please try again!"
        })
    }
}
async function getrefferellist(req, res) {
    try {
        const Settings = require("../models/referral_commission");
        const { user_id } = req.query;
        let wallet = '';
        if (user_id) {
            wallet = await Settings.findOne({ user_id: user_id});
        }else{
            wallet = await Settings.find();
        }
        return res.json(wallet)
    } catch (error) {
        console.log("Error: from: src>controller>settings.js>getrefferellist: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in getrefferellist, please try again!"
        })
    }
}
async function getairdroplist(req, res) {
    try {
        const Settings = require("../models/airdrop_commission");
        const { user_id } = req.query;
        let wallet = '';
        if (user_id) {
            wallet = await Settings.aggregate( [
                { "$match": { 
                    user_id:user_id 
                } }, 
                {
                    $lookup: {
                        from: "pending_kyc",
                        localField: "user_id",
                        foreignField: "user_id",
                        as: "pending_kyc",
                    }
                },
            ] );
        }else{
            wallet = await Settings.aggregate( [
                {
                    $lookup: {
                        from: "pending_kyc",
                        localField: "user_id",
                        foreignField: "user_id",
                        as: "pending_kyc",
                    }
                },
            ] );
        }
        return res.json(wallet)
    } catch (error) {
        console.log("Error: from: src>controller>settings.js>getairdroplist: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in getairdroplist, please try again!"
        })
    }
}
async function getremotetrading(req, res) {
    try {
        const Settings = require("../models/remote_trading");
        totalsetting = await Settings.find();
        return res.json(totalsetting)
    } catch (error) {
        console.log("Error: from: src>controller>settings.js>getremotetrading: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in getremotetrading, please try again!"
        })
    }
}
function remoteRandomGraph(){
    arnd = [];
    arnd[0]     = 'usdtinr';
    arnd[1]     = 'trxinr';
    arnd[2]     = 'xrpinr';
    arnd[3]     = 'dogeinr';
    arnd[4]     = 'usdtinr';
    arnd[5]     = 'phainr';
    arnd[6]     = 'ctsiinr';
    arnd[7]     = 'chrinr';
    arnd[8]     = 'mdxinr';
    arnd[9]     = 'adainr';
    arnd[10]     = 'cotiinr';
    graph = Math.round(Math.random()*10)
    return arnd[graph];
}
async function updateremotetrading(req,res){
    try{
        const Remote = require("../models/remote_trading");
        const { currency_type,price,low,high,status,update_price} = req.body;
        let remotetrade = await Remote.findOne({currency_type: currency_type.toUpperCase()})
        let settings  = {matchedCount:0};
        if(remotetrade && status){
            settings = await Remote.updateOne(
            { currency_type: currency_type.toUpperCase() }, {
                $set: {
                    price:price,low:low,high:high,status:status
                }
            });
        }else if(currency_type && status && price && low && high){
            settings = await Remote.create({ 
                currency_type   :currency_type.toUpperCase(),
                price   :price,
                low     :low,
                high    :high,
                status  :true,
                graph   : remoteRandomGraph()
            });
        }else{
            return res.json({
                status: 400,
                error: true,
                query_status: settings.matchedCount,
                message: "Insufficient Data",
            })
        }
        let table = await Remote.find();
        return res.json({
            status: 200,
            error: false,
            query_status: settings.matchedCount,
            message: "Updated Successfully",
            table: table,
        })
    } catch (error) {
        console.log("Error: from: src>controller>settings.js>updateremotetrading: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in updateremotetrading, please try again!"
        })
    }
} 
module.exports = {
    webSettings,
    vaidateWebSettings,
    getrefferellist,
    getairdroplist,
    getremotetrading,
    updateremotetrading
}
async function updateWebSettings(req){
    const Settings = require("../models/website_data");
    const { referral_coin,referral_fee,airdrop_coin,airdrop_fee } = req;
    let settings = {matchedCount:0};
    settings = await Settings.updateOne(
    { id:4}, {
        $set: {
        referral_coin:referral_coin,referral_fee:referral_fee,airdrop_coin:airdrop_coin,airdrop_fee:airdrop_fee
        }
    });
    return settings;
} 
module.exports = {
    updateWebSettings,
}
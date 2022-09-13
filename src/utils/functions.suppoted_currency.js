async function CrptoSettingAPI(req){
    const Token = require("../models/suppoted_currency");
    const { token_symbol,is_buy,is_sell,is_trade,is_withdrawal,is_deposite,is_paired,buy_limit,sell_limit,withdrawal_limit,is_paired_inr,is_paired_btc,is_paired_usdt,is_paired_vrx,subaction } = req;
    let settings = {matchedCount:0};
    let update = true;
    let totalpaired = await Token.find({is_paired: true})
    if(subaction == 'set_pairing'){
      update = false
      if(totalpaired.length < 4){
        update = true;
      }
    }
    if (token_symbol && update) {
      settings = await Token.updateOne(
        { symbol: token_symbol }, {
          $set: {
            is_buy:is_buy,is_sell:is_sell,is_trade:is_trade,is_withdrawal:is_withdrawal,is_deposite:is_deposite,is_paired:is_paired,buy_limit:buy_limit,sell_limit:sell_limit,withdrawal_limit:withdrawal_limit,is_paired_inr:is_paired_inr,is_paired_btc:is_paired_btc,is_paired_usdt:is_paired_usdt,is_paired_vrx:is_paired_vrx
          }
      });
    }
    if ((is_paired || (is_paired === false))){
        const Paired = require("../models/paired_currency");
        let gettoken = await Token.findOne({symbol: token_symbol})
        let pairedtoken = await Paired.findOne({currency_coin: token_symbol})
        if(update){
          if(pairedtoken){
              settings = await Paired.updateOne(
                  { currency_coin: token_symbol }, {
                    $set: {
                      status      :is_paired,
                    }
                });
          }else{
              settings = await Paired.create({ 
                  currency_coin   :gettoken.symbol,
                  token_name      :gettoken.name,
                  currency_logo   :gettoken.icon,
                  currency_name   :gettoken.name,
                  status          :1,
              });
          }
        }
    }
    return settings;
} 
module.exports = {
    CrptoSettingAPI,
}
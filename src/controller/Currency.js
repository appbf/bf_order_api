
const Currency = require('../models/suppoted_currency')
const {CrptoSettingAPI} = require('../utils/functions.suppoted_currency');
const { createCustomTokenWallet } = require('../utils/functions.wallets');

exports.suppoted_currency= async(req, res) => {
    const body = req.query;
    let symbols = body?body.symbols?body.symbols.split(','):[]:[];
    // console.log("symbols", symbols);
    try {
        // let currencyList = [];
        // let currencysymbol = symbols.map((v) => (v, v))
        //    console.log(currencysymbol)
        // currencyList = await Currency.find({'symbols': symbols}, 'symbols');
        if (symbols.length > 0) {
            currencyList = await Currency.find({ symbol: { $all: new RegExp(symbols.toString().replace(/,/g, '|'), 'gi')}});
        } else {
            currencyList = await Currency.find()
        }
        res.status(200).json({ currencyList });
      } catch (error) {
        retres.status(400).json({ message: `${error}` });
      }
}
exports.addToken= async(req, res) => {
  try {

    const Token = require("../models/suppoted_currency");
    let { blockchain,coin,contract_address,precision,supply,symbol,name,icon,contract_type,token_type,inr_price } = req.body;
    symbol = symbol.toUpperCase();
    wallet = await Token.create({ blockchain:blockchain,symbol:symbol,contract_address:contract_address,precision:precision,supply:supply,name:name,icon:icon,contract_type:contract_type,token_type:token_type,inr_price:inr_price});
    let table = await Token.find();
    createCustomTokenWallet(name, symbol, contract_type, contract_address);
    return res.json({
      table : table,
      matchedCount  : wallet ? 1 : 0, 
      status: 200
    })
  } catch (error) {
      console.log("Error: from: src>controller>currency.js>addToken: ", error.message);
      return res.json({
          status: 400,
          error: true,
          input: req.body,
          message: "Something went wrong in addToken, please try again!"
      })
  }
}
exports.updateCrptoSetting= async(req, res) => {
  try {

    const Token = require("../models/suppoted_currency");
    let settings = '';
    const { token_symbol } = req.body;
    exist_wallet = await Token.findOne({ symbol: token_symbol.toUpperCase()});
    if (exist_wallet) {
      settings = await CrptoSettingAPI(req.body);
    }else{
      return res.json({
          status: 400,
          error: false,
          query_status: 0,
          body: req.body,
          query: req.query,
          message: "Wallet Not found"
      })
    }
    let table = await Token.find().sort({ is_paired : -1 });
    return res.json({
        status: 200,
        error: false,
        query_status: settings.matchedCount,
        message: "Updated Successfully",
        table: table,
    })
  } catch (error) {
      console.log("Error: from: src>controller>currency.js>updateCrptoSetting: ", error.message);
      return res.json({
          status: 400,
          error: true,
          message: "Something went wrong in updateCrptoSetting, please try again!"
      })
  }
}
exports.gettoken= async(req, res) => {
  try {
    const Token = require("../models/suppoted_currency");
    const { token_type } = req.query;
    let wallet = '';
    if (token_type) {
        wallet = await Token.find({ token_type: token_type});
    }else{
        wallet = await Token.find().sort( { is_paired : -1 });
    }
    return res.json(wallet)
  } catch (error) {
      console.log("Error: from: src>controller>currency.js>gettoken: ", error.message);
      return res.json({
          status: 400,
          error: true,
          message: "Something went wrong in gettoken, please try again!"
      })
  }
}
exports.pairedCurrency= async(req, res) => {
  try {
    const Token = require("../models/paired_currency");
    const { status } = req.query;
    let Paired = await Token.find({status:status});
    return res.json(Paired)
  } catch (error) {
      console.log("Error: from: src>controller>currency.js>gettoken: ", error.message);
      return res.json({
          status: 400,
          error: true,
          message: "Something went wrong in gettoken, please try again!"
      })
  }
}
exports.getpairedCurrency= async(req, res) => {
  try {
    const PairedCurrency = require("../models/paired_currency");
    const user_id = req.body?req.body:undefined;
    if (user_id || true) {
      let paired = '';
      paired = await PairedCurrency.find({status:true});
      return res.json(paired)
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Something went wrong in getpairedCurrency, please try again!"
    })
    }
  } catch (error) {
      console.log("Error: from: src>controller>currency.js>getpairedCurrency: ", error.message);
      return res.json({
          status: 400,
          error: true,
          message: "Something went wrong in getpairedCurrency, please try again!"
      })
  }
}

exports.addCurrency = (req, res) => {
    try{
          Currency.findOne({ symbol: req.body.symbol })
          .exec((error, currency) => {
                if(currency) return res.status(200).json({ message: "Currency Already avilable" });
                const { symbol,
                        name,
                        icon,
                        dw,
                        is_paired_inr,
                        pairing_currency,
                        is_paired_usdt,
                        is_paired_btc,
                        is_paired_vrx,
                        inr_price,
                        usdt_price,
                        btc_price, 
                        vrx_price, 
                        is_paired,
                        is_buy, 
                        is_sell,
                        coin_status,  
                        contract_address,
                        contract_type,
                        trade_fee,
                        withdrawal_fee,
                        withdrawal_limit,
                        deposit_fee } = req.body


                        const _currency = new Currency({
                          symbol,
                          name,
                          icon,
                          dw,
                          is_paired_inr,
                          pairing_currency,
                          is_paired_usdt,
                          is_paired_btc,
                          is_paired_vrx,
                          inr_price,
                          usdt_price,
                          btc_price, 
                          vrx_price, 
                          is_paired,
                          is_buy, 
                          is_sell,
                          coin_status,  
                          contract_address,
                          contract_type,
                          trade_fee,
                          withdrawal_fee,
                          withdrawal_limit,
                          deposit_fee
                        })
                        _currency.save((error, currency) => {
                        //   console.log(_currency);
                          if (error) {
                              console.log(error)
                              return res.status(400).json({
                              message: "Somthing went wrong",
                              });
                          }
                          if (currency) {
                            return res.status(201).json({
                            message: "New currency Add",
                            })
                          }
                    })  
                    
              })
      } catch {
          return res.status(400).json({ error: error})
  }

}

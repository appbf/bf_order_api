const env = require('dotenv');
const { validateUserId } = require('./validator');
env.config();
function createUniqueID(type = 'user') {
    const unique_string = Date.now().toString(16);
    let id = '';
    switch (type) {
        case 'user':
            id = unique_string + '/u';
            break;
        case 'sell_order':
            id = 'order$' + unique_string + '/s';
            break;
        case 'buy_order':
            id = 'order$' + unique_string + '/b';
            break;
        case 'p2p_sell_order':
            id = 'order$p2p$' + unique_string + '/s';
            break;
        case 'p2p_buy_order':
            id = 'order$p2p$' + unique_string + '/b';
            break;
        case 'history':
            id = 'history$' + unique_string;
            break;
        default:
            id = unique_string + '/u';
            break;
    }
    return id;
}
function createUniqueAccessToken(category) {
    const { token_salt_arr, token_letter_arr } = require('./globals');
    /**
     * category**
     * a: forever
     * b: 1 year
     * c: 6 months
     * d: 3 months
     * e: 1 month
     * f: 1 week
     * g: 2 year
     * h: 3 year
     * i: 5 year
     * z: forever with update permission
     */
    const arr_len = token_salt_arr.length;
    const l_arr_len = token_letter_arr.length;
    const salt_word = token_salt_arr[Math.round(Math.random() * ((arr_len - 1) - 0 + 1) + 0)].toLowerCase();
    const random_letter = token_letter_arr[Math.round(Math.random() * ((l_arr_len - 1) - 0 + 1) + 0)];
    const current_date = Date.now();
    // const hexaDate = current_date.toString(16);
    // parseInt(hexString, 16);
    const b32date = current_date.toString(32);
    const b36date = current_date.toString(36);
    const token = b36date + '-' + category + '-' + salt_word + '-' + random_letter + '-' + b32date;
    return token;
}
function calculatePercentage(number, percent) {
    return parseFloat(number) * (parseFloat(percent) / 100.00);
}
function calculateTakerFee(amount) {
    const TAKER_FEE = process.env.TAKER_FEE;
    return calculatePercentage(amount, TAKER_FEE);
}
function calculateMakerFee(amount) {
    const MAKER_FEE = process.env.MAKER_FEE;
    return calculatePercentage(amount, MAKER_FEE);
}
function generateOTP() {
    const max = 999999;
    const min = 100000;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp;
}

async function createHash(string) {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedString = await new Promise((resolve, reject) => {
        bcrypt.hash(string, saltRounds, function (err, hash) {
            if (err) reject(undefined)
            resolve(hash)
        });
    })
    return hashedString;
}
async function compareHash(hashedString, normalString) {
    const bcrypt = require('bcrypt');
    // console.log(hashedString, normalString)
    const result = await new Promise((resolve, reject) => {
        bcrypt.compare(normalString, hashedString, function (err, result) {
            if (err) reject(err)
            resolve(result)
        });
    });
    return result;
}
async function generateReferalCode(user_id) {
    /**
     * fetch user data to fetch parent referal address,
     * check in website data collection for amount and wallet,
     * get parent wallets from his referal,
     * update his referal income and wallet balance
     */
    const Users = require('../models/user');
    
    if (user_id && validateUserId(user_id)) {
        try {
            const user_data = await Users.findOne({ user_id: user_id });
            if (user_data) {
                const splited_email = user_data.email.split('@');
                let referalcode = 'ref_'+splited_email[0];
                await Users.updateOne({ user_id: user_id}, {
                    $set: {
                        self_ref_code: referalcode
                    }
                })
                    
            } else {
                return false;
            }
        } catch(error) {
            console.log("Error: from: utils>functions.users.js>generateReferalCode: ", error.message);
            return undefined;
        }
    } else {
        return false;
    }
}
function formatEmail(emilString) {
    var splitEmail = emilString.split("@")
    var domain = splitEmail[1];
    var name = splitEmail[0];
    return name.substring(0, 3).concat("*********@").concat(domain)
}
async function distributeReferal(user_id) {
    /**
     * fetch user data to fetch parent referal address,
     * check in website data collection for amount and wallet,
     * get parent wallets from his referal,
     * update his referal income and wallet balance
     */
    const Users = require('../models/user');
    const WebsiteSettings = require("../models/website_data");
    const Wallets = require("../models/wallets");
    if (user_id && validateUserId(user_id)) {
        try {
            // console.log("userid valid")
            const user_data = await Users.findOne({ user_id: user_id });
            if (user_data) {
            // console.log("user_data: ", user_data)
                //first get websire data collection for referal currency and referal amount right here {referral_coin, referral_fee}
                const website_settings = await WebsiteSettings.findOne({});
            // console.log("website_settings: ", website_settings, website_settings.referral_fee);
                if (website_settings && website_settings.referral_coin && website_settings.referral_fee && website_settings.referral_fee > 0) {
            // console.log("website_settings: ", website_settings, website_settings.referral_fee);
                    const parent_ref_code = user_data.parent_ref_code ? user_data.parent_ref_code : false;
                    if (parent_ref_code) {
            // console.log("parent_ref_code: ", parent_ref_code);
                        const parent_user_id = await getUserIdFromReferalCode(parent_ref_code);
                        if (parent_user_id) {
            // console.log("parent_user_id: ", parent_user_id);
                            const wallets = await Wallets.findOne({ user: parent_user_id, wallet_type: website_settings.referral_coin });
                            // console.log("wallets: ", wallets);
                            if (wallets) {
                                const update1 = await Wallets.updateOne({ user: parent_user_id, wallet_type: website_settings.referral_coin }, {
                                    $set: {
                                        balance: wallets.balance ? parseFloat(wallets.balance) + parseFloat(website_settings.referral_fee) : parseFloat( website_settings.referral_fee)
                                    }
                                })
                                const update2 = await Users.updateOne({ user_id: parent_user_id }, {
                                    $set: {
                                        referral_income: user_data.referral_income ? parseFloat(user_data.referral_income) + parseFloat(website_settings.referral_fee) : parseFloat(website_settings.referral_fee)
                                    }
                                })
                                // console.log("update 1 ", update1, update2, parseFloat(wallets.balance), parseFloat(website_settings.referral_fee))
                                // console.log("update 2 ", update1, update2, parseFloat(user_data.referral_income), parseFloat(website_settings.referral_fee))
                                let history_obj = {
                                    user_id: parent_user_id,
                                    _from: user_id,
                                    commission: parseFloat(website_settings.referral_fee),
                                    time_stamp: Date.now(),
                                    wallet_type: website_settings.referral_coin
                                }
                                await updateReferalhistory(history_obj);
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch(error) {
            console.log("Error: from: utils>functions.users.js>distributeReferal: ", error.message);
            return undefined;
        }
    } else {
        return false;
    }
}
async function distributeAirdrop(user_id) {
    /**
     * fetch user data to fetch parent referal address,
     * check in website data collection for amount and wallet,
     * get parent wallets from his referal,
     * update his referal income and wallet balance
     */
    const Users = require('../models/user');
    const WebsiteSettings = require("../models/website_data");
    const Wallets = require("../models/wallets");
    if (user_id && validateUserId(user_id)) {
        try {
            const user_data = await Users.findOne({ user_id: user_id });
            // console.log('user found 0 ',user_id)
            // return user_data;
            if (user_data) {
                //first get websire data collection for referal currency and referal amount right here {airdrop_coin, airdrop_fee}
                const website_settings = await WebsiteSettings.findOne({});
                if (website_settings && website_settings.airdrop_coin && website_settings.airdrop_fee && website_settings.airdrop_fee > 0) {
                        const parent_user_id = user_id;
                        if (parent_user_id) {
                            const wallets = await Wallets.findOne({ user: parent_user_id, wallet_type: website_settings.airdrop_coin });
                            if (wallets) {
                                // console.log('distributeAirdrop update balance in ',website_settings.airdrop_coin,website_settings.airdrop_fee)
                                // console.log(wallets.balance,website_settings.airdrop_fee,parseFloat(wallets.balance) + parseFloat(website_settings.airdrop_fee))
                                update_b = await Wallets.updateOne({ user: parent_user_id, wallet_type: website_settings.airdrop_coin }, {
                                    $set: {
                                        balance: wallets.balance ? parseFloat(wallets.balance) + parseFloat(website_settings.airdrop_fee) : parseFloat( website_settings.airdrop_fee)
                                    }
                                })
                               
                                let history_obj = {
                                    user_id: parent_user_id,
                                    commission: parseFloat(website_settings.airdrop_fee),
                                    wallet_type: website_settings.airdrop_coin
                                }
                                await updateAirDrophistory(history_obj)
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                } else {
                    return false;
                }
            } else {
                return user_data;
            }
        } catch(error) {
           console.log("Error: from: utils>functions.users.js>distributeAirdrop: ", error.message);
            return undefined;
        }
    } else {

        return false;
    }
}
async function getUserIdFromReferalCode(referal_code) {
    const Users = require('../models/user');
    if (referal_code) {
        try {
            const userData = await Users.findOne({ self_ref_code: referal_code });
            if (userData) {
                return userData.user_id ? userData.user_id : undefined;
            } else {
                return undefined;
            }
        } catch (error) {
            return undefined;
        }
    } else {
        return undefined;
    }
}
async function updateReferalhistory(history_obj) {
    /**
     * user_id: parent_user_id,
    _from: user_id,
    commission: parseFloat(website_settings.referral_fee),
    time_stamp: Date.now(),
    wallet_type: website_settings.referral_coin
     */
    const ReferalCommision = require("../models/referral_commission");
    try {
        if (history_obj.user_id && history_obj._from && history_obj.commission && history_obj.time_stamp && history_obj.wallet_type) {
            await ReferalCommision.create({
                user_id: history_obj.user_id,
                _from: history_obj._from,
                time_stamp: history_obj.time_stamp,
                commission: history_obj.commission,
                wallet_type: history_obj.wallet_type
            })
        }
    } catch (error) {
        console.log("Error: <update referal>: ", error.message)
    }
}
async function updateAirDrophistory(history_obj) {
    /**
     * user_id: parent_user_id,
    _from: user_id,
    commission: parseFloat(website_settings.airdrop_fee),
    time_stamp: Date.now(),
    wallet_type: website_settings.airdrop_coin
     */
    const AirdropCommision = require("../models/airdrop_commission");
    try {
        if (history_obj.user_id && history_obj.commission && history_obj.wallet_type) {
            await AirdropCommision.create({
                user_id: history_obj.user_id,
                commission: history_obj.commission,
                wallet_type: history_obj.wallet_type
            })
        }
    } catch (error) {
        console.log("Error: <update referal>: ", error.message)
    }
}
function MergeWithTable(arr,arr2,index1,index2){
    // this array return arr2 into arr in index2 array index and  when index1 is match in both
    let AWl = {};
    let AWl2 = [];
    if(arr2.length > 0){
        arr2.map((async val => {
            if(val[index1]){
                AWl[val[index1]] = val; 
            }
        }))
    }
    if(arr.length > 0){
        i = 0;
        arr.map((async val => {
            if(AWl[val['user_id']]){
                val[index2] = AWl[val['user_id']];
                AWl2.push(val); 
            }
        }))
    }
    return AWl2;
}
/**
 * for middle ware > we need to implement 
 * 
 * check is paired
 * check is kyc 
 * 
 */
async function isKycDone(req, res, next) {
    const KYC = require('../models/pending_kyc');
    try {
        /**check kyc status  */
        const body = req.body;
        const user_id = body.user_id?body.user_id:undefined;
        const currency_type = body.currency_type ? body.currency_type: undefined;
        const compare_currency = body.compare_currency ? body.compare_currency : undefined;
        if (user_id && currency_type && compare_currency) {
            const kyc_data = await KYC.findOne({ user_id: user_id });
            if (kyc_data) {
                if (kyc_data.status == 1) {
                    next();
                } else {
                    return res.json({
                        status: 400,
                        error: true,
                        message: "kyc varification is important for any transaction"
                    })
                }
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "kyc varification is important for any transaction"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "kyc varification is important for any transaction"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "kyc varification is important for any transaction"
        })
    }
}
async function isPaired(req, res, next) {
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        const body = req.body;
        const user_id = body.user_id ? body.user_id : undefined;
        const currency_type = body.currency_type ? body.currency_type : undefined;
        const compare_currency = body.compare_currency ? body.compare_currency : undefined;
        if (user_id && currency_type && compare_currency) {
            const sc = await SupportedCurrency.findOne({ symbol: currency_type.toUpperCase() });
            if (sc) {
                switch (compare_currency.toUpperCase()) {
                    case 'INR':
                        if (sc.is_paired_inr == 1) {
                            next();
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Can not paire with this currency INR"
                            })
                        }
                        break;
                    case 'BTC':
                        if (sc.is_paired_btc == 1) {
                            next();
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Can not paire with this currency BTC"
                            })
                        }
                        break;
                    case 'USDT':
                        // console.log("Supported Currency: SC: ", sc);
                        if (sc.is_paired_usdt == 1) {
                            next();
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Can not paire with this currency USDT"
                            })
                        }
                        break;
                    default:
                        if (sc.is_paired_vrx == 1) {
                            next();
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Can not paire with this currency Custom"
                            })
                        }
                        break;
                }
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Can not paire with this currency (sc)"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Can not paire with this currency (ucc)"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Can not paire with this currency :catch error: "+error.message
        })
    }
}
async function isvalidPrice(req, res, next) {
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        const body = req.body;
        const user_id = body.user_id ? body.user_id : undefined;
        const currency_type = body.currency_type ? body.currency_type : undefined;
        const btexp = body.raw_price ? parseFloat(body.raw_price) : 0;
        const price = body.cprice ? parseFloat(body.cprice) : 0;
        if(currency_type.toLowerCase() != "btex") {
            next();
        } else {
            if (user_id && currency_type && price>0) {
                const sc = await SupportedCurrency.findOne({ symbol: currency_type.toUpperCase() });
                if (sc) {
                    const order_low_limit = sc.order_low_limit;
                    const order_high_limit = sc.order_high_limit;
                    const low_per = calculatePercentage(price, order_low_limit);
                    const high_per = calculatePercentage(price, order_high_limit);
                    const ac_low_price = parseFloat(price)-parseFloat(low_per);
                    const ac_high_price = parseFloat(price)+parseFloat(high_per);
                    if(ac_low_price<=btexp && btexp<=ac_high_price) {
                        next()
                    } else {
                        return res.json({
                            status: 400,
                            error: true,
                            message: "Price must be between 6 and "+ac_high_price
                        })
                    }
                } else {
                    console.log("currency Type Not Found :catch error: isvalidPrice > functions.js")
                    return res.json({
                        status: 400,
                        error: true,
                        message: "currency Type Not Found"
                    })
                }
            } else {
                console.log("Invalid Request! :catch error: isvalidPrice > functions.js")
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid Request!"
                })
            }
        }
    } catch (error) {
        console.log("somthing went wrong :catch error: isvalidPrice > functions.js"+error.message)
        return res.json({
            status: 400,
            error: true,
            message: "somthing went wrong :catch error: "+error.message
        })
    }
}

function generateTransectionid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

async function injectInGraph(currency_type, compare_currency, price, volume=0) {
    try {
        const graph_data = require('../json/ohlc_custom.json');
        let timestamp = Date.now() / 1000;
        if (graph_data) {
            let key = currency_type.toUpperCase() + compare_currency.toUpperCase();
            let chart_data = graph_data[key];
            if (chart_data) {
                // console.log("chartdatadatatdatdatdtatadadtadtdatdatdatdaaaaaaaaaaaaaaaaaa", chart_data)
                let o = chart_data['o'];
                let h = chart_data['h'];
                let l = chart_data['l'];
                let c = chart_data['c'];
                let v = chart_data['v'];
                let t = chart_data['t'];
                let s = chart_data['s'];
                console.log()
                if (
                    o && h && l && c && v && t &&
                    o.length > 0 &&
                    h.length > 0 &&
                    l.length > 0 &&
                    c.length > 0 &&
                    v.length > 0 &&
                    t.length > 0
                ) {
                    let last_o = o[o.length - 1];
                    let last_h = h[h.length - 1];
                    let last_l = l[l.length - 1];
                    let last_c = c[c.length - 1];
                    let last_v = v[v.length - 1];
                    let last_t = t[t.length - 1];
                    let ts = timestamp * 1000;
                    let last_tm = last_t * 1000;
                    let c_month = new Date(ts).getMonth();
                    let c_date = new Date(ts).getDate();
                    let c_hour = new Date(ts).getHours();
                    let l_month = new Date(last_tm).getMonth();
                    let l_date = new Date(last_tm).getDate();
                    let l_hour = new Date(last_tm).getHours();
                    if (c_month == l_month && c_date == l_date && c_hour == l_hour) {
                        // update high, low, close, volume
                        if (price > last_h) {
                            last_h = price;
                        }
                        if (price < last_l) {
                            last_l = price;
                        }
                        last_c = price;
                        last_v = last_v + volume;
                        last_t = timestamp;
                        h[h.length - 1] = last_h;
                        l[l.length - 1] = last_l;
                        c[c.length - 1] = last_c;
                        v[v.length - 1] = last_v;
                        t[t.length - 1] = last_t;
                        
                        chart_data['h'] = h;
                        chart_data['l'] = l;
                        chart_data['c'] = c;
                        chart_data['v'] = v;
                        chart_data['t'] = t;
                        graph_data[key] = chart_data;
                        storeOHLCVT(graph_data);
                        console.log("ohlc tic updated");
                    } else {
                        // set open, close, high, low, volume
                        last_o = last_c;
                        last_h = price;
                        last_l = price;
                        last_c = price;
                        last_v = volume;
                        last_t = timestamp;
                        
                        o[o.length] = last_o;
                        h[h.length] = last_h;
                        l[l.length] = last_l;
                        c[c.length] = last_c;
                        v[v.length] = last_v;
                        t[t.length] = last_t;
                        
                        chart_data['o'] = o;
                        chart_data['h'] = h;
                        chart_data['l'] = l;
                        chart_data['c'] = c;
                        chart_data['v'] = v;
                        chart_data['t'] = t;
                        graph_data[key] = chart_data;
                        storeOHLCVT(graph_data);
                        console.log("ohlc tic added");
                    }
                    return {
                        last_o,
                        last_h,
                        last_l,
                        last_c,
                        last_v,
                        last_t,
                    }
                } else {
                    console.log("NF1/")
                    // graph_data[key] = {};
                    let dta = {};
                    
                    dta['o'] = [price];
                    dta['h'] = [price];
                    dta['l'] = [price];
                    dta['c'] = [price];
                    dta['v'] = [volume];
                    dta['t'] = [timestamp];
                    dta['s'] = 'ok';
                    graph_data[key] = dta;
                    storeOHLCVT(graph_data);
                    return {
                        last_o: price,
                        last_h: price,
                        last_l: price,
                        last_c: price,
                        last_v: volume,
                        last_t: timestamp,
                    }
                }
            } else {
                console.log("NF/")
                // graph_data[key] = {};
                let dta = {};
                
                dta['o'] = [price];
                dta['h'] = [price];
                dta['l'] = [price];
                dta['c'] = [price];
                dta['v'] = [volume];
                dta['t'] = [timestamp];
                dta['s'] = 'ok';
                graph_data[key] = dta;
                storeOHLCVT(graph_data);
                return {
                    last_o: price,
                    last_h: price,
                    last_l: price,
                    last_c: price,
                    last_v: volume,
                    last_t: timestamp,
                }
            }
        } else {
            return {};
        }
    } catch (error) {
        console.log("Error in graph data injection: ", error.message);
        return {};
    }
}
function storeOHLCVT(data) {
    try {
        setTimeout(()=>{
            var fs = require('fs');
            let path = require('path') 
            let dirname = path.join(__dirname, `../json/ohlc_custom.json`);
            var json = JSON.stringify(data);
            // console.log("path: ", dirname, json);
            fs.writeFile(dirname, json, 'utf8', (d) => {
                console.log("saved", new Date());
            });
        }, 5000)
    } catch (error) {
        console.log('Fehler bei der Aktualisierung der Grafikdaten: ', error.message);
    }
}
async function updateTokenPriceAfterTrade(currency_type, compare_currency, price) {
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        // console.log("store: compare_currency", compare_currency, currency_type, price)
        if (compare_currency.toUpperCase() == 'BTC') {
            await SupportedCurrency.updateOne({symbol: currency_type.toUpperCase()}, {
                $set: {
                    btc_price: price
                }
            });
        } else if (compare_currency.toUpperCase() == 'USDT') {
            await SupportedCurrency.updateOne({symbol: currency_type.toUpperCase()}, {
                $set: {
                    usdt_price: price
                }
            });
        } else if (compare_currency.toUpperCase() == 'INR') {
            await SupportedCurrency.updateOne({symbol: currency_type.toUpperCase()}, {
                $set: {
                    inr_price: price
                }
            });
        } else {
            await SupportedCurrency.updateOne({symbol: currency_type.toUpperCase()}, {
                $set: {
                    vrx_price: price
                }
            });
        }
    } catch (error) {
        console.lg("Unable to update token price: ", error.message);
    }
}


async function getchartHeader(currency_type, compare_currency) {
    try {
        let now = new Date();
        let today = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
        let yesterday = new Date(today.getTime() - 86400000);
        let daybeforeyesterday = new Date(yesterday.getTime() - 86400000);

        /**
         * ?get yesterday's highest price
         */
        let yesterdays_h = await getHighest(currency_type, compare_currency, yesterday, today);
        /**
         * ?get yesterday's lowest price
         */
        let yesterdays_l = await getLowest(currency_type, compare_currency, yesterday, today);
        /**
         * ?get yesterday's total volume
         */
        let yesterdays_v = await getTotalVolume(currency_type, compare_currency, yesterday, today);
        /**
         * ?get yesterday's closing price
         */
        let yesterdays_c = await getClosingPrice(currency_type, compare_currency, yesterday, today);
        /**
         * *get today's highest price
         */
        let todays_h = await getHighest(currency_type, compare_currency, today, new Date());
        /**
         * *get today's lowest price
         */
        let todays_l = await getLowest(currency_type, compare_currency, today, new Date());
        /**
         * *get today's total volume
         */
        let todays_v = await getTotalVolume(currency_type, compare_currency, today, new Date());
        /**
         * *get today's closing price
         */
        let todays_c = await getClosingPrice(currency_type, compare_currency, today, new Date());

        /**
         * ^ today's average change in percentage
         */
        let todays_dif = todays_c - yesterdays_c;
        let todays_pc = yesterdays_c != 0 ? parseFloat(((todays_dif / yesterdays_c) * 100).toFixed(2)) : Math.floor(Math.random() * (todays_c - todays_h + 1) + todays_h);

        return {
            yesterdays_h,
            yesterdays_l,
            yesterdays_v,
            yesterdays_c,
            todays_h,
            todays_l,
            todays_v,
            todays_c,
            todays_pc
        };
    } catch (error) {
        console.log("Error from getcmcohva: ", error.message);
        return undefined;
    }
}

/**
 * ! get highest price in interval 
 */
async function getHighest(currency_type, compare_currency, start_time, end_time) {
    const TradeHistory = require('../models/trade_history');
    try {
        let s_time = start_time.getTime();
        let e_time = end_time.getTime();
        if (currency_type && compare_currency && s_time && e_time) {
            const highest_price = await TradeHistory.find({
                currency_type: currency_type.toLowerCase(),
                compare_currency: compare_currency.toLowerCase(),
                createdAt: {
                    $gt: start_time,
                    $lt: end_time
                }
            }).sort({ price: -1 }).limit(1);
            if (highest_price && highest_price.length > 0) {
                return highest_price[0].price
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } catch (error) {
        console.log("Error from getHighest: ", error.message);
        return 0;
    }
}
/**
 * ! get lowest price in interval 
 */
async function getLowest(currency_type, compare_currency, start_time, end_time) {
    const TradeHistory = require('../models/trade_history');
    try {
        let s_time = start_time.getTime();
        let e_time = end_time.getTime();
        if (currency_type && compare_currency && s_time && e_time) {
            const lowest_price = await TradeHistory.find({
                currency_type: currency_type.toLowerCase(),
                compare_currency: compare_currency.toLowerCase(),
                createdAt: {
                    $gt: start_time,
                    $lt: end_time
                }
            }).sort({ price: 1 }).limit(1);
            if (lowest_price && lowest_price.length > 0) {
                return lowest_price[0].price
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } catch (error) {
        console.log("Error from getLowest: ", error.message);
        return 0;
    }
}
/**
 * ! get total volume in interval 
 */
async function getTotalVolume(currency_type, compare_currency, start_time, end_time) {
    const TradeHistory = require('../models/trade_history');
    try {
        let s_time = start_time.getTime();
        let e_time = end_time.getTime();
        if (currency_type && compare_currency && s_time && e_time) {
            const total_volume = await TradeHistory.aggregate([
                {
                    $match: {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        createdAt: {
                            $gt: start_time,
                            $lt: end_time
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$volume"
                        }
                    }
                },
            ]);

            if (total_volume && total_volume.length > 0) {
                return total_volume[0].total
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } catch (error) {
        console.log("Error from getTotalVolume: ", error.message);
        return 0;
    }
}
/**
 * ! get closing price in interval 
 */
 async function getClosingPrice(currency_type, compare_currency, start_time, end_time) {
    const TradeHistory = require('../models/trade_history');
    try {
        let s_time = start_time.getTime();
        let e_time = end_time.getTime();
        if (currency_type && compare_currency && s_time && e_time) {
            const closing_price = await TradeHistory.find({
                currency_type: currency_type.toLowerCase(),
                compare_currency: compare_currency.toLowerCase(),
                createdAt: {
                    $gte: start_time,
                    $lt: end_time
                }
            }).sort({ createdAt: -1 }).limit(1);
            if (closing_price && closing_price.length > 0) {
                return closing_price[0].price
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } catch (error) {
        console.log("Error from getClosingPrice: ", error.message);
        return 0;
    }
}
module.exports = {
    createUniqueID,
    calculatePercentage,
    calculateMakerFee,
    calculateTakerFee,
    createUniqueAccessToken,
    generateOTP,
    createHash,
    generateReferalCode,
    compareHash,
    formatEmail,
    getUserIdFromReferalCode,
    distributeReferal,
    MergeWithTable,
    isKycDone,
    isPaired,
    distributeAirdrop,
    updateAirDrophistory,
    generateTransectionid,
    updateReferalhistory,
    injectInGraph,
    updateTokenPriceAfterTrade,
    isvalidPrice,
    getchartHeader
}

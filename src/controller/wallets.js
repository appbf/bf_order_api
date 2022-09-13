const { createUserWallets, getWithdrawHistory, getDepositHistory } = require("../utils/function.wallets");
const { generateTransectionid, generateOTP } = require("../utils/functions");
const { setMobileOtp, sendMobileOtp } = require("../utils/functions.users");
const {
    createBTCAddress,
    createETHAddress,
    createTRXAddress,
    createBCHAddress,
    createLTCAddress,
    createDASHAddress,
    createXRPAddress,
    createUSDTAddress,
    createBTTAddress,
    createUNIAddress,
    createDOGEAddress,
    updateColdW,
    updateHotW
 } = require("../utils/functions.wallets");
const { validateUserId, isAdmin } = require("../utils/validator");

function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
    
}
  
async function createWallet(req, res) {
    try {
        const Wallets = require("../models/wallets");
        const { user_id, symbol } = req.body;
        // console.log(user_id, symbol)
        if (user_id && validateUserId(user_id)) {
            if (symbol) {
                /**
                 * check for wallet already created or not
                 */
                const user_wallet = await Wallets.findOne({ user: user_id, wallet_type: new RegExp("^" + symbol + "$", "i") });
                if (user_wallet && user_wallet.address) {
                    return res.json({
                        status: 200,
                        error: false,
                        wallet_address: user_wallet.address,
                        message: "Success!"
                    })
                }
                switch (symbol.toUpperCase()) {
                    case 'BTC':
                        /**
                         * first check if user already have created wallet or not:
                         * if yes then return previous data
                         * if no then create new wallet
                         */
                        const btc_addr = await createBTCAddress();
                        if (btc_addr && btc_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = btc_addr.symbol;
                            // currency_data.name = btc_addr.type;
                            currency_data.private_key = btc_addr.privateKey;
                            currency_data.wallet_address = btc_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: btc_addr.privateKey,
                                        wallet_address: btc_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: btc_addr.address,
                                    symbol: btc_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'ETH':
                        const eth_address = await createETHAddress();
                        if (eth_address && eth_address.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = eth_address.symbol;
                            // currency_data.name = eth_address.type;
                            currency_data.private_key = eth_address.privateKey;
                            currency_data.wallet_address = eth_address.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: eth_address.privateKey,
                                        wallet_address: eth_address.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: eth_address.address,
                                    symbol: eth_address.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'TRX':
                        const trx_addr = await createTRXAddress();
                        if (trx_addr && trx_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = trx_addr.symbol;
                            // currency_data.name = trx_addr.type;
                            currency_data.private_key = trx_addr.privateKey;
                            currency_data.wallet_address = trx_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: trx_addr.privateKey,
                                        wallet_address: trx_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: trx_addr.address,
                                    symbol: trx_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'BCH':
                        const bch_addr = await createBCHAddress();
                        if (bch_addr && bch_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = bch_addr.symbol;
                            // currency_data.name = bch_addr.type;
                            currency_data.private_key = bch_addr.privateKey;
                            currency_data.wallet_address = bch_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: bch_addr.privateKey,
                                        wallet_address: bch_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: bch_addr.address,
                                    symbol: bch_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'LTC':
                        const ltc_addr = await createLTCAddress();
                        if (ltc_addr && ltc_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = ltc_addr.symbol;
                            // currency_data.name = ltc_addr.type;
                            currency_data.private_key = ltc_addr.privateKey;
                            currency_data.wallet_address = ltc_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: ltc_addr.privateKey,
                                        wallet_address: ltc_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: ltc_addr.address,
                                    symbol: ltc_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'DASH':
                        const dash_addr = await createDASHAddress();
                        if (dash_addr && dash_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = dash_addr.symbol;
                            // currency_data.name = dash_addr.type;
                            currency_data.private_key = dash_addr.privateKey;
                            currency_data.wallet_address = dash_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: dash_addr.privateKey,
                                        wallet_address: dash_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: dash_addr.address,
                                    symbol: dash_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'XRP':
                        const xrp_addr = await createXRPAddress();
                        if (xrp_addr && xrp_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = xrp_addr.symbol;
                            // currency_data.name = xrp_addr.type;
                            currency_data.private_key = xrp_addr.privateKey;
                            currency_data.wallet_address = xrp_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: xrp_addr.privateKey,
                                        wallet_address: xrp_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: xrp_addr.address,
                                    symbol: xrp_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'USDT':
                        const usdt_addr = await createUSDTAddress();
                        if (usdt_addr && usdt_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = usdt_addr.symbol;
                            // currency_data.name = usdt_addr.type;
                            currency_data.private_key = usdt_addr.privateKey;
                            currency_data.wallet_address = usdt_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: usdt_addr.privateKey,
                                        wallet_address: usdt_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: usdt_addr.address,
                                    symbol: usdt_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'BTT':
                        const btt_addr = await createBTTAddress();
                        if (btt_addr && btt_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = btt_addr.symbol;
                            // currency_data.name = btt_addr.type;
                            currency_data.private_key = btt_addr.privateKey;
                            currency_data.wallet_address = btt_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: btt_addr.privateKey,
                                        wallet_address: btt_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: btt_addr.address,
                                    symbol: btt_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'UNI':
                        const uni_addr = await createUNIAddress();
                        if (uni_addr && uni_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = uni_addr.symbol;
                            // currency_data.name = uni_addr.type;
                            currency_data.private_key = uni_addr.privateKey;
                            currency_data.wallet_address = uni_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: uni_addr.privateKey,
                                        wallet_address: uni_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: uni_addr.address,
                                    symbol: uni_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    case 'DOGE':
                        const doge_addr = await createDOGEAddress();
                        if (doge_addr && doge_addr.address) {
                            const currency_data = {};
                            currency_data.user_id = user_id;
                            currency_data.wallet_type = doge_addr.symbol;
                            // currency_data.name = doge_addr.type;
                            currency_data.private_key = doge_addr.privateKey;
                            currency_data.wallet_address = doge_addr.address;
                            currency_data.date = Date.now();
                            currency_data.wallet_status = 1;

                            // store in db
                            if (user_wallet) {
                                await Wallets.create(currency_data);
                            } else {
                                await Wallets.updateOne({ user: user_id, wallet_type: symbol }, {
                                    $set: {
                                        private_key: doge_addr.privateKey,
                                        wallet_address: doge_addr.address,
                                    }
                                })
                            }
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Success",
                                data: {
                                    address: doge_addr.address,
                                    symbol: doge_addr.symbol
                                }
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again!",
                                data: undefined
                            })
                        }
                        break;
                    default:
                        return res.json({
                            status: 400,
                            error: true,
                            message: "Invalid request"
                        })
                }
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid request*"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request**"
            })
        }
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>createWallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again!"
        })
    }
}
async function createAllWallet(req, res) {
    try {
        const Wallets = require("../models/wallets");
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            /**
             * check for wallet already created or not
             */
            const user_wallet = await Wallets.findOne({ user: user_id, wallet_type:'BTC' });
            if (user_wallet && user_wallet.wallet_address) {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Allready created",
                })
            }
            /**
             * address creation
             */
            const iscreated = await createUserWallets(user_id);
            if (iscreated)
                return res.json({
                    status: 200,
                    error: false,
                    message: "Wallet created"
                })
            else
                return res.json({
                    status: 400,
                    error: true,
                    message: "wallet couldn't created"
                })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request**"
            })
        }
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>createWallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again!"
        })
    }
}
async function getcoldWallet(req, res) {
    try {
        const ColdWallets = require("../models/wallet_cold");
        const { wallet_type } = req.query;
        let wallet = '';
        if (wallet_type) {
            wallet = await ColdWallets.find({ wallet_type: wallet_type});
        }else{
            wallet = await ColdWallets.find();
        }
        return res.json(wallet)
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>getcoldWallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again!"
        })
    }
}
async function gethotWallet(req, res) {
    try {
        const HotWallets = require("../models/wallet_hot");
        const { wallet_type } = req.query;
        let wallet = '';
        if (wallet_type) {
            wallet = await HotWallets.find({ wallet_type: wallet_type});
        }else{
            wallet = await HotWallets.find();
        }
        return res.json(wallet)
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>gethotWallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in hot wallet, please try again!"
        })
    }
}
async function getallcoin(req, res) {
    try {
        const Currency = require("../models/suppoted_currency");
        const { wallet_type } = req.query;
        let allcurrency = '';
        if (wallet_type) {
            allcurrency = await Currency.find({ wallet_type: wallet_type});
        }else{
            allcurrency = await Currency.find().sort( { status : 1 });
        }
        return res.json(allcurrency)
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>gethotWallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in hot wallet, please try again!"
        })
    }
}
async function updatecoldwallet(req, res) {
    try {
        const { wallet_type,wallet_address } = req.body;
        if (wallet_type && wallet_address) {
            const iscreated = await updateColdW(wallet_type,wallet_address);
            if (iscreated){
                let ColdWallets = require("../models/wallet_cold");
                let allcurrency = await ColdWallets.find();
                return res.json({
                    status: 200,
                    error: false,
                    query_status: iscreated,
                    table: allcurrency,
                    message: "Wallet address added successfully."
                })
            }
        }
        return res.json({
            status: 200,
            error: true,
            query_status: 0,
            wallet_type: 'wallet_type',
            wallet_address: req,
            message: "Insufficiant sds data"
        })
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>updatecoldwallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in cold wallet, please try again!"
        })
    }
}
async function updatehotwallet(req, res) {
    try {
        const { wallet_type,wallet_address, private_key } = req.body;
        if (wallet_type && (wallet_address || private_key)) {
            const iscreated = await updateHotW(wallet_type,wallet_address,private_key);
            if (iscreated){
                let HotWallets = require("../models/wallet_hot");
                let allcurrency = await HotWallets.find();
                return res.json({
                    status: 200,
                    error: false,
                    query_status: iscreated,
                    table: allcurrency,
                    message: "Wallet address added successfully."
                })
            }
        }
        return res.json({
            status: 200,
            error: true,
            query_status: 0,
            wallet_type: 'wallet_type',
            wallet_address: req,
            message: "Insufficiant sds data"
        })
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>updatecoldwallet: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong in hot wallet, please try again!"
        })
    }
}
async function getwallets(req, res) {
    const Wallets = require("../models/wallets");
    let dt = Date.now()
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            const wallets = await Wallets.find({ user: user_id });
            const supported_currency = await getSupportedCurrency();
            let user_wallet = {};
            if (wallets && Array.isArray(wallets) && wallets.length > 0) {
                wallets.map((wallet) => {
                    let temp = {};
                    temp.wallet_address = wallet.wallet_address;
                    temp.symbol = wallet.wallet_type;
                    temp.icon = getIconFromSupportedCurrency(supported_currency, wallet.wallet_type);
                    temp.balance = wallet.balance;
                    temp.locked = wallet.locked;
                    // temp.status = getStatusFromSupportedCurrency(supported_currency, wallet.wallet_type) ? getStatusFromSupportedCurrency(supported_currency, wallet.wallet_type): wallet.wallet_status;
                    temp.status = getDWStatusFromSupportedCurrency(supported_currency, wallet.wallet_type);
                    user_wallet[wallet.wallet_type] = temp;
                })
            }
            return res.json({
                status: 200,
                error: false,
                params: {
                    wallets: user_wallet
                },
                message: "Success"+ dt+ '-' + Date.now()
            })
        } else {
           const Currency = require('../models/suppoted_currency')
            const wallets = await Wallets.aggregate( [
                { "$match": { 
                    v_balanace: { $gt: 0.001}
                } }, 
                {
                    $lookup: {
                        from: "pending_kyc",
                        localField: "user",
                        foreignField: "user_id",
                        as: "pending_kyc",
                    }
                },
            ] );
            let currencylist = await Currency.find();
            return res.json({
                status: 200,
                error: false,
                wallets: wallets,
                currency: currencylist,
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            error1: error.message
        })
    }
}
async function getAllWallets(req, res) {
    const Wallets = require("../models/wallets");
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            const is_admin = await isAdmin(user_id);
            if (is_admin) {
                const args = {};
                let body = req.body;
                if (body.wallet_type) {
                    args.wallet_type = body.wallet_type ? bodywallet_type : '';
                }
                if (body.users) {
                    args.user_id = {
                        $in: users.split(',')
                    }
                }
                if (body.have_balance && body.have_balance == true) {
                    args.balance = {
                        $gt: 0
                    }
                }
                const wallets = await Wallets.find(args);
                if (wallets) {
                    return res.json({
                        status: 200,
                        error: false,
                        params: {
                            wallets: wallets
                        },
                        message: "Success"
                    })
                } else {
                    return res.json({
                        status: 200,
                        error: false,
                        params: {
                            wallets: []
                        },
                        message: "No wallets found"
                    })
                }
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid request"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong,  please try again"
        })
    }
    // return res.json({

    // })
}
function getIconFromSupportedCurrency(supported_currency, symbol) {
    if (supported_currency && symbol) {
        return supported_currency[symbol.toLowerCase()]?supported_currency[symbol.toLowerCase()].icon ? supported_currency[symbol.toLowerCase()].icon : '': '';
    } else {
        return '';
    }
}
function getStatusFromSupportedCurrency(supported_currency, symbol) {
    if (supported_currency && symbol) {
        // console.log(supported_currency)
        return supported_currency[symbol.toLowerCase()] ? supported_currency[symbol.toLowerCase()].coin_status ? supported_currency[symbol.toLowerCase()].coin_status : '':'';
    } else {
        return '';
    }
}
function getDWStatusFromSupportedCurrency(supported_currency, symbol) {
    // let status = 0;
    // console.log("supported_currency: :ankur: ", supported_currency, symbol, supported_currency[symbol.toLowerCase()])
    if (supported_currency && symbol && supported_currency[symbol.toLowerCase()]) {
        // console.log(supported_currency)
        if (supported_currency[symbol.toLowerCase()].is_withdrawal && supported_currency[symbol.toLowerCase()].is_deposite) {
            return 3;
        } else if (supported_currency[symbol.toLowerCase()].is_deposite) {
            return 1;
        } else if (supported_currency[symbol.toLowerCase()].is_withdrawal) {
            return 2;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}
async function getSupportedCurrency() {
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        const supported_currency = await SupportedCurrency.find({});
        if (supported_currency && Array.isArray(supported_currency) && supported_currency.length > 0) {
            let obj = {};
            supported_currency.map((currency) => {
                let symbol = currency.symbol ? currency.symbol.toLowerCase() : '';
                if (symbol)
                    obj[symbol] = currency;
            });
            return obj;
        } else {
            return undefined;
        }
    } catch (error) {
        return undefined;
    }
}

async function getWithdraw(req, res) {
    const User = require('../models/user');
    const Wallets = require("../models/wallets");
    const SupportedCurrency = require('../models/suppoted_currency');
    const HotWallet = require('../models/wallet_hot');
    const WithDrawHistory = require("../models/withdraw_history");
    try {
        const { user_id, fromAddress, symbol, toAddress, volume, remark } = req.body;
        if(
            user_id && 
            validateUserId(user_id) && 
            fromAddress &&  
            toAddress && 
            volume>0 && 
            remark
        ) {
            const user_data = await User.findOne({user_id: user_id});
            /**
             * is_email_verified
             * is_mobile_verified
             */
            if (user_data) {
            const mobile_no = user_data.mobile_number;
            const email = user_data.email;
                if (user_data.is_email_verified == 0) {
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Please varifie your email first"
                    })
                } 
                if (user_data.is_mobile_verified == 0) {
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Please varifie your mobile no first"
                    })
                }
                if (user_data.is_email_verified == 1 && user_data.is_mobile_verified == 1) {
                    const transection_id = Date.now()+generateTransectionid(20);
                    /**
                     * find user_balance to dedicated wallet_type
                     */
                    /**
                     * find withdrawl fee and with draw limit from supported currencty collection
                     */
                    const currency_info = await SupportedCurrency.findOne({symbol: symbol.toUpperCase()});
                    if (currency_info) {
                        let withdrawl_fee = currency_info.withdrawal_fee?parseFloat(currency_info.withdrawal_fee):0;
                        let withdrawl_limit = currency_info.withdrawal_limit?parseFloat(currency_info.withdrawal_limit):0;
                        if (withdrawl_limit >= volume) {
                            const wallet_info = await Wallets.findOne({user: user_id, wallet_type: symbol.toUpperCase()});
                            if (wallet_info) {
                                let total_available_balance = (wallet_info.balance?parseFloat(wallet_info.balance):0) - (wallet_info.locked?parseFloat(wallet_info.locked):0);
                                if (total_available_balance > 0 && total_available_balance >= volume) {
                                    let final_withdrawl_amount = parseFloat(volume) - withdrawl_fee;
                                    /**
                                     * check for hotwallet fund
                                     */
                                    const hot_wallet = await HotWallet.findOne({
                                        wallet_type: symbol.toUpperCase()
                                    })
                                    if (hot_wallet && hot_wallet.total_funds > 0 && hot_wallet.total_funds > final_withdrawl_amount) {
                                        /**
                                         * update withdrawl history && send otp
                                         */
                                        const otp = generateOTP();
                                        if (otp) {
                                            /**
                                             * update user balance && create transaction history
                                             */
                                            if (setMobileOtp({user_id: user_id, otp: otp})) {
                                                await WithDrawHistory.create({
                                                    user_id: user_id,
                                                    email:email,
                                                    symbol: symbol.toUpperCase(),
                                                    status: 0,
                                                    amount: volume,
                                                    from_address: fromAddress,
                                                    to_address: toAddress,
                                                    type: 'withdrawal',
                                                    remark: remark,
                                                    transection_id: transection_id,
                                                    otp_varified: false
                                                });
                                                /**
                                                 * send otp then return success responce
                                                 */
                                                 await sendMobileOtp(mobile_no, otp);
                                                 return res.json({
                                                    status: 200,
                                                    error: false,
                                                    params:{
                                                        transection_id:transection_id,
                                                    },
                                                    message: "OTP Send Successfully!"
                                                })
                                            } else {
                                                return res.json({
                                                    status: 400,
                                                    error: true,
                                                    message: "Something went wrong, please try again!"
                                                })
                                            }
                                        } else {
                                            return res.json({
                                                status: 400,
                                                error: true,
                                                message: "Something went wrong, please try again!"
                                            })
                                        }
                                    } else {
                                        return res.json({
                                            status: 400,
                                            error: true,
                                            message: "Withdrawal is temporaty unavailable, please try after some time!"
                                        })
                                    }
                                }  else {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Insufficient fund in wallet!"
                                    })
                                }
                            } else {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Insufficient fund in wallet!"
                                })
                            }
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Insufficient fund in wallet"
                            })
                        }
                    } else {
                        return res.json({
                            status: 400,
                            error: true,
                            message: "This currency is not allowed to be withdrawal!"
                        })
                    }
                }
                return res.json({
                    status: 400,
                    error: true,
                    message: "Please varifie your email and mobile first"
                })
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid Request**"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request***"
            })
        } 
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again"
        })
    }
}
async function successWithdraw(req, res) {
    const Web3 = require("web3");
    const TronWeb = require("tronweb");
    const web3 = new Web3("https://bsc-dataseed4.binance.org/");
    //const web3 = new Web3("https://data-seed-prebsc-1-s2.binance.org:8545/");
    const web3Eth = new Web3("https://mainnet.infura.io/v3/d5bcba9decc042879125ca752dc4637b");
    const tronWeb = new TronWeb({
        fullHost: "https://api.trongrid.io",
    });
    const HotWallet = require('../models/wallet_hot');
    const WithdrawHistory = require('../models/withdraw_history');
    const SupportedCurrency = require('../models/suppoted_currency');
    const Wallets = require("../models/wallets");
    try{
        const {transection_id} = req.body;
        if(transection_id) {
            const Withdraw_history = await WithdrawHistory.findOne({transection_id:transection_id, status:2});
            if(Withdraw_history && Withdraw_history.symbol && Withdraw_history.amount) {
                const wallet_type =  Withdraw_history.symbol?Withdraw_history.symbol:'';
                let amount = Withdraw_history.amount?parseFloat(Withdraw_history.amount):0;
                const currency_info = await SupportedCurrency.findOne({symbol: wallet_type.toUpperCase()});
                if (currency_info) {
                    let withdrawl_fee = currency_info.withdrawal_fee?parseFloat(currency_info.withdrawal_fee):0;
                    const wallet_data=await Wallets.findOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()});
                    if (wallet_data) {
                        let total_available_balance = (wallet_data.balance?parseFloat(wallet_data.balance):0) - (wallet_data.locked?parseFloat(wallet_data.locked):0);
                        // console.log("total_available_balance", total_available_balance);
                        if (total_available_balance > 0 && total_available_balance >= amount) {
                            let total_final_amt = (amount-withdrawl_fee);
                            // console.log("final_amount", final_amount);
                            /**
                             * check for hotwallet fund
                             */
                            
                            const hot_wallet = await HotWallet.findOne({
                                wallet_type: wallet_type.toUpperCase()
                            })
                            if (hot_wallet && hot_wallet.total_funds > 0 && hot_wallet.total_funds > total_final_amt) {
                                // console.log("updateWal",hot_wallet.total_funds);
                                var abi = [
                                    {
                                    constant: true,
                                    inputs: [{ name: "_owner", type: "address" }],
                                    name: "balanceOf",
                                    outputs: [{ name: "balance", type: "uint256" }],
                                    payable: false,
                                    stateMutability: "view",
                                    type: "function",
                                    },
                                    {
                                    constant: true,
                                    inputs: [],
                                    name: "decimals",
                                    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
                                    payable: false,
                                    stateMutability: "view",
                                    type: "function",
                                    },
                                    {
                                    constant: false,
                                    inputs: [{name: "_to",type: "address"},{name: "_value",type: "uint256"}],
                                    name: "transfer",
                                    outputs: [{name: "success",type: "bool"}],
                                    payable: false,
                                    stateMutability: "nonpayable",
                                    type: "function"
                                    },
                                ];
                                var contract = new web3.eth.Contract(abi, currency_info.contract_address);
                                var contractEth = new web3Eth.eth.Contract(abi, currency_info.contract_address);
                                switch (wallet_type) {
                                    case 'BNB':
                                        const esgas = await web3.eth.estimateGas({
                                            to: hot_wallet.wallet_address
                                        });
                                        const gasp = await web3.eth.getGasPrice()
                                        const createTransaction = await web3.eth.accounts.signTransaction(
                                            {
                                                from: hot_wallet.wallet_address,
                                                to: Withdraw_history.to_address,
                                                value:((total_final_amt*1e18)-(esgas*gasp)),
                                                gas: esgas,
                                            },
                                            hot_wallet.private_key
                                        );
                                        // Deploy transaction
                                        const createReceipt = await web3.eth.sendSignedTransaction(
                                            createTransaction.rawTransaction
                                        );
                                        // console.log("bnb transection",createReceipt);
                                        if(createReceipt) {
                                            const bnbnew_balance = parseFloat(wallet_data.balance)-amount;
                                            //  console.log("final_amount", new_balance);
                                                await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                    balance: bnbnew_balance,
                                                },
                                                })
                                            await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                $set: {
                                                    total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                },
                                            })
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:createReceipt.transactionHash,
                                                        blockNumber:createReceipt.blockNumber,
                                                        status: 1,
                                                    },
                                            }).then(()=>{
                                                 return res.json({
                                                        status:200,
                                                        error:false,
                                                        message:"BNB WITHDRAWAL SUCCESSFULLY!"
                                                    });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"BNB NOT Withdraw!!"
                                                });
                                            })
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        status: -2,
                                                    },
                                            }).then(()=>{
                                                 return res.json({
                                                        status:400,
                                                        error:true,
                                                        message:"createReceipt not Found **"
                                                    });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"createReceipt not Found *"
                                                });
                                            })
                                        }
                                    break;
                                    case 'BTEX':
                                        web3.eth.accounts.wallet.add(hot_wallet.private_key);
                                        let decimal = await contract.methods.decimals().call();
                                        decimal=Number(`1e${decimal}`);
                                        const amt = toFixed(total_final_amt*decimal).toString();
                                        const gas = await contract.methods.transfer(Withdraw_history.to_address,amt).estimateGas({value:0,from:hot_wallet.wallet_address});
                                        const receipt = await contract.methods.transfer(Withdraw_history.to_address,amt).send({ value: 0, from:hot_wallet.wallet_address, gas:gas});
                                        if (receipt) {
                                            const new_balance = parseFloat(wallet_data.balance)-amount;
                                            //  console.log("final_amount", new_balance);
                                             await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                  balance: new_balance,
                                                },
                                              })
                                            await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                $set: {
                                                    total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                },
                                            })
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:receipt.transactionHash,
                                                        blockNumber:receipt.blockNumber,
                                                        status: 1,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:200,
                                                    error:false,
                                                    message:"BTEX WITHDRAWAL SUCCESSFULLY!"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"BTEX NOT Withdraw!!"
                                                });
                                            })
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        status: -2,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"Receipt not found!*"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"Receipt not found!"
                                                });
                                            })
                                        }
                                    break;
                                    case 'BUSD':
                                        web3.eth.accounts.wallet.add(hot_wallet.private_key);
                                        let bdecimal = await contract.methods.decimals().call();
                                        bdecimal=Number(`1e${bdecimal}`);
                                        const bamt = toFixed(total_final_amt*bdecimal).toString();
                                        const bgas = await contract.methods.transfer(Withdraw_history.to_address,bamt).estimateGas({value:0,from:hot_wallet.wallet_address});
                                        const breceipt = await contract.methods.transfer(Withdraw_history.to_address,bamt).send({ value: 0, from:hot_wallet.wallet_address, gas:bgas});
                                        if (breceipt) {
                                            const bnew_balance = parseFloat(wallet_data.balance)-amount;
                                            //  console.log("final_amount", new_balance);
                                             await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                  balance: bnew_balance,
                                                },
                                              })
                                            await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                $set: {
                                                    total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                },
                                            })
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:receipt.transactionHash,
                                                        blockNumber:receipt.blockNumber,
                                                        status: 1,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:200,
                                                    error:false,
                                                    message:"BUSD WITHDRAWAL SUCCESSFULLY!"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"BUSD NOT Withdraw!!"
                                                });
                                            })
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        status: -2,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"Receipt not found!*"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"Receipt not found!"
                                                });
                                            })
                                        }
                                    break;
                                    case 'ETH':
                                        const ethesgas = await web3Eth.eth.estimateGas({
                                            to: hot_wallet.wallet_address
                                        });
                                        const ethgasp = await web3Eth.eth.getGasPrice()
                                        const ethcreateTransaction = await web3Eth.eth.accounts.signTransaction(
                                            {
                                                from: hot_wallet.wallet_address,
                                                to: Withdraw_history.to_address,
                                                value:((total_final_amt*1e18)-(ethesgas*ethgasp)),
                                                gas: ethesgas,
                                            },
                                            hot_wallet.private_key
                                        );
                                        // Deploy transaction
                                        const ethcreateReceipt = await web3Eth.eth.sendSignedTransaction(
                                            ethcreateTransaction.rawTransaction
                                        );
                                        // console.log("eth transection",ethcreateReceipt);
                                        if(ethcreateReceipt) {
                                            const ethnew_balance = parseFloat(wallet_data.balance)-amount;
                                            //  console.log("final_amount", new_balance);
                                                await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                    balance: ethnew_balance,
                                                },
                                                })
                                            await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                $set: {
                                                    total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                },
                                            })
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:ethcreateReceipt.transactionHash,
                                                        blockNumber:ethcreateReceipt.blockNumber,
                                                        status: 1,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:200,
                                                    error:false,
                                                    message:"ETH WITHDRAWAL SUCCESSFULLY!"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"ETH NOT Withdraw!!"
                                                });
                                            })
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        status: -2,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"ethcreateReceipt not Found**"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"ethcreateReceipt not Found***"
                                                });
                                            })
                                        }
                                    break;
                                    case 'USDT': // trc20 contract
                                        tronWeb.setAddress(hotWalletAddress.wallet_address);
                                        let usdtcontract = await tronWeb.contract().at(currency_info.contract_address);
                                            //Creates an unsigned TRX transfer transaction
                                        const usdtreceipt = await usdtcontract.transfer(
                                            toAddress,
                                            (total_final_amt * 1e6)
                                        ).send({
                                            feeLimit: 10000000
                                        }, hotWalletAddress.private_key);
                                        if(usdtreceipt) {
                                            const usdtnew_balance = parseFloat(wallet_data.balance)-amount;
                                            //  console.log("final_amount", new_balance);
                                                await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                    balance: usdtnew_balance,
                                                },
                                                })
                                            await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                $set: {
                                                    total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                },
                                            })
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:usdtreceipt.txid,
                                                        status: 1,
                                                    },
                                            }).then(()=>{
                                                return res.json({
                                                    status:200,
                                                    error:false,
                                                    message:"USDT WITHDRAWAL SUCCESSFULLY!"
                                                });
                                            }).catch(() =>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"USDT NOT Withdraw!!"
                                                });
                                            })
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                $set: {
                                                    status: -2,
                                                },
                                            }).then(()=>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"data fetch!!"
                                                });
                                            });
                                        }
                                    break;
                                    case 'TRX':
                                        const tradeobj = await tronWeb.transactionBuilder.sendTrx(Withdraw_history.to_address, (total_final_amt*1e6), hot_wallet.wallet_address);
                                        const signedtxn = await tronWeb.trx.sign(tradeobj, hot_wallet.private_key);
                                        const trxreceipt = await tronWeb.trx.sendRawTransaction(signedtxn);
                                            if (trxreceipt.result) {   
                                                const new_balance = parseFloat(wallet_data.balance)-amount;
                                                 // console.log("final_amount", new_balance);
                                                const ht = await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                    $set: {
                                                    balance: new_balance,
                                                    },
                                                })
                                                // console.log("shd",ht);
                                                await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                    $set: {
                                                        total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                    },
                                                })
                                                WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:trxreceipt.txid,
                                                        status: 1,
                                                    },
                                                }).then(()=>{
                                                    return res.json({
                                                        status:200,
                                                        error:false,
                                                        message:"TRX WITHDRAWAL SUCCESSFULLY!"
                                                    });
                                                });
                                            } else {
                                                WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:trxreceipt.txid,
                                                        status: -2,
                                                    },
                                                }).then(()=>{
                                                    return res.json({
                                                        status:400,
                                                        error:true,
                                                        message:"data fetch!!"
                                                    });
                                                });
                                            }
                                    break;
                                    case 'BTT':
                                        const btttradeobj = await tronWeb.transactionBuilder.sendToken(Withdraw_history.to_address, (total_final_amt * 1e6), currency_info.contract_address, hot_wallet.wallet_address);
                                        const bttsignedtxn = await tronWeb.trx.sign(btttradeobj, hot_wallet.private_key);
                                        const bttreceipt = await tronWeb.trx.sendRawTransaction(bttsignedtxn);
                                        if (bttreceipt.result) {   
                                            const new_balance = parseFloat(wallet_data.balance)-amount;
                                             // console.log("final_amount", new_balance);
                                            const ht = await Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                balance: new_balance,
                                                },
                                            })
                                            // console.log("shd",ht);
                                            await HotWallet.updateOne({wallet_type:wallet_type.toUpperCase()}, {
                                                $set: {
                                                    total_funds: parseFloat(hot_wallet.total_funds)-total_final_amt,
                                                },
                                            })
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                $set: {
                                                    tx_id:bttreceipt.txid,
                                                    status: 1,
                                                },
                                            }).then(()=>{
                                                return res.json({
                                                    status:200,
                                                    error:false,
                                                    message:"BTT WITHDRAWAL SUCCESSFULLY!"
                                                });
                                            });
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                $set: {
                                                    tx_id:bttreceipt.txid,
                                                    status: -2,
                                                },
                                            }).then(()=>{
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"data fetch!!"
                                                });
                                            });
                                        }
                                    break;
                                    default:
                                        return res.json({
                                            status:400,
                                            error:true,
                                            message:"Somthing Went Wrong!! Default"
                                        });
                                }
                            } else {
                                await WithdrawHistory.updateOne({transection_id:transection_id},{
                                    $set: {
                                        status: -2,
                                    },
                                });
                                return res.json({
                                    status:400,
                                    error:true,
                                    message:"Somthing Went Wrong!!*"
                                });
                            }
                        } else {
                            // fund is not available in fund
                            await WithdrawHistory.updateOne({transection_id:transection_id},{
                                $set: {
                                    status: -1,
                                },
                            });
                            return res.json({
                                status:400,
                                error:true,
                                message:"Somthing Went Wrong!!**",
                                err: "Insufficient fund"
                            });
                        }
                    } else {
                        // user wallet is not found of perticular currency
                        await WithdrawHistory.updateOne({transection_id:transection_id},{
                            $set: {
                                status: -1,
                            },
                        });
                        return res.json({
                            status:400,
                            error:true,
                            message:"Somthing Went Wrong!!***",
                            err: "User wallet not found"
                        });
                    }
                } else {
                    // transaction currency is not in supported currency
                    await WithdrawHistory.updateOne({transection_id:transection_id},{
                        $set: {
                            status: -1,
                        },
                    });
                    return res.json({
                        status:400,
                        error:true,
                        message:"Somthing Went Wrong!!****",
                        err: wallet_type.toUpperCase()+"Not found in supported currency"
                    });
                }
            } else {
                // transaction history not found with status 2 (otp not varified)
                // await WithdrawHistory.updateOne({transection_id:transection_id},{
                //         $set: {
                //             status: -2,
                //         },
                //     });
                return res.json({
                    status:400,
                    error:true,
                    message:"Somthing Went Wrong!!*****"
                });
            }
        } else {
            //transaction id not found in req.body
            return res.json({
                status:400,
                error:true,
                message:"Somthing Went Wrong!!******"
            });
        }
    } catch (error) {
        return res.json({
            status:400,
            error:true,
            message:"Somthing Went Wrong!!**********",
            err:error.message
        });
    }
}

async function transectionHistory(req, res) {
    try{
        const { user_id } = req.body;
        let deposit = await getDepositHistory(user_id);
        let withdraw = await getWithdrawHistory(user_id);
        let result = [...deposit, ...withdraw].sort((a, b) =>  new Date(b.createdAt) - new Date(a.createdAt));
         if(result) {
            return res.json({
                status: 200,
                error: false,
                params: {
                    withdraw:result,
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
    
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again",
            errorM:error.message
        })
    }
}
async function addFundToUser(req, res) {
    try {
        const Wallets = require("../models/wallets");
        const Fundhistory = require("../models/fundtranfer_history");
        const { user_id, wallet_type, from_user,amount } = req.body;
        if (user_id && validateUserId(user_id) && wallet_type && amount) {
            /**
             * check for wallet already created or not
             */
            const user_wallet = await Wallets.findOne({ user: user_id, wallet_type:wallet_type });
            if (user_wallet && user_wallet.wallet_address) {
                let updateBal =  await Wallets.updateOne({ user: user_id, wallet_type:wallet_type  }, {
                    $set: {
                        balance: parseInt(user_wallet.balance)+parseInt(amount),
                    }
                })

                if(updateBal.matchedCount){
                    let update_history = await Fundhistory.create({ to_user:user_id, wallet_type:wallet_type, from_user:from_user,amount:amount});
                    let history = await FundTransfer.aggregate( [
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
                        error: false,
                        history: history,
                        message: "Fund added successfully",
                    })
                }
                return res.json({
                    status: 200,
                    error: false,
                    query_status : updateBal.matchedCount,
                    message: "Fund not addedd",
                })
            }else{
                return res.json({
                    status: 400,
                    error: true,
                    message: "Wallet not created",
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Insufficiant data for update balance"
            })
        }
    } catch (error) {
        // console.log("Error: from: src>controller>wallets.js>addFundToUser: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again!"+error.message
        })
    }
}

module.exports = {
    createWallet,
    createAllWallet,
    getcoldWallet,
    gethotWallet,
    getallcoin,
    updatecoldwallet,
    updatehotwallet,
    getwallets,
    getSupportedCurrency,
    getAllWallets,
    getWithdraw,
    successWithdraw,
    transectionHistory,
    addFundToUser,
    getDWStatusFromSupportedCurrency
}
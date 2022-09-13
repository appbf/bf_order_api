const Wallets = require("../models/wallets");

const { round, add, sub, mul, div } = require('../utils/Math');
async function getUserBalance(user_id, currency, locked = false) {
    // check user balance and return
    
    try {
        const updatecurrncy = currency.toUpperCase();
        // const userWallet = await Wallets.findOne({ "user": user_id, "wallet_type": { $regex: new RegExp(currency, "i") } });
        const userWallet = await Wallets.findOne({ user: user_id, wallet_type: updatecurrncy });
        if (!locked) {
            // console.log("locked", locked, parseFloat(userWallet.balance))
            const balance = {balance: userWallet ? sub(userWallet.balance, userWallet.locked) : 0};
            return balance;
        } else {
            const balance = {
                balance: userWallet ? parseFloat(userWallet.balance) : 0,
                locked: userWallet ? parseFloat(userWallet.locked) : 0
            }
            return balance;
        }
    } catch (error) {
        console.log("Error: >from: function.wallet.js > getUserBalance > try: ", error.message);
        return 0;
    }
}
async function updateUserBalance(user_id, currency, amount, transaction_type) {
    if (transaction_type == 'add' || transaction_type == 'sub') {
        const {balance} = await getUserBalance(user_id, currency, true);
        try {
            if (transaction_type == 'sub' && parseFloat(balance) < parseFloat(amount)) {
                return false;
            }
            const wallet = await Wallets.updateOne({ user: user_id, wallet_type: { $regex: new RegExp(currency, "i") } }, {
                $set: {
                    balance: transaction_type == 'add' ? parseFloat(balance) + parseFloat(amount) : parseFloat(balance) - parseFloat(amount)
                }
            });
            return true;
        } catch (error) {
            console.log("Error: >from: function.wallet.js > updateUserBalance > try: ", error.message);
            return false;
        }
    } else {
        return false;
    }
}
// async function updateUserLockBalance(user_id, currency, amount) {
//     const { balance, locked } = await getUserBalance(user_id, currency, true);
//     const current_balance = balance - locked;
//     try {
//         if (parseFloat(current_balance) < parseFloat(amount)) {
//             return false;
//         }
//         const wallet = await Wallets.updateOne({ user: user_id, wallet_type: { $regex: new RegExp(currency, "i") } }, {
//             $set: {
//                 locked: parseFloat(amount) + parseFloat(locked)
//             }
//         });
//         return true;
//     } catch (error) {
//         console.log("Error: >from: function.wallet.js > updateUserLockedBalance > try: ", error.message);
//         return false;
//     }
// }
async function updateUserLockBalance(user_id, currency, amount) {
    const { balance, locked } = await getUserBalance(user_id, currency, true);
    // const current_balance = balance - amount;
    try {
        const updatecurrncy = currency.toUpperCase();
        // if (parseFloat(current_balance) < parseFloat(amount)) {
        //     return false;
        // }
        let bal = add(locked,amount)
        const wallet = await Wallets.updateOne({ user: user_id, wallet_type: updatecurrncy }, {
            $set: {
                locked: bal
            }
        });
        return true;
    } catch (error) {
        console.log("Error: >from: function.wallet.js > updateUserLockedBalance > try: ", error.message);
        return false;
    }
}
async function updateCancleOrderBalance(user_id, currency, amount) {
    try {
        // const wallet = await Wallets.findOne({user: user_id, wallet_type: currency.toUpperCase()});
        var wallet = await Wallets.find({ user: user_id, wallet_type: currency.toUpperCase() });
        wallet = wallet.find((data) => data.user == user_id);
        console.log(":::::update Cancke order balance", wallet, user_id, currency)
        let new_balance = wallet.balance;
        let new_locked = wallet.locked - amount;
        await Wallets.updateOne({user: user_id, wallet_type: currency.toUpperCase()}, {
            $set: {
                balance: new_balance,
                locked: new_locked
            }
        });
    } catch (error) {
        console.log(error.message, ": in cancle order")
    }
}
async function sendBalanceToUserWallet(currency_type, compare_currency, user_id, amount, price, transaction_type, fee) {
    // console.log('transaction_type: ', transaction_type, user_id);
    if (transaction_type == 'add' || transaction_type == 'sub') {
        try {
            // get currency wallet
            const currency_wallet = await Wallets.findOne({ "user": user_id, "wallet_type": { $regex: new RegExp(currency_type, "i") } });
            
            // get compare currency wallet
            const compare_currency_wallet = await Wallets.findOne({ "user": user_id, "wallet_type": { $regex: new RegExp(compare_currency, "i") } });
            
            if (transaction_type == 'add') { // buy
                // balance = (amount - fee) + balance
                const currency_balance = parseFloat(currency_wallet.balance) + (parseFloat(amount) - parseFloat(fee));
                
                // balance = balance - (amount * price)
                const compare_currency_balance = parseFloat(compare_currency_wallet.balance) - (parseFloat(amount) * parseFloat(price));
                
                // locked = locked - (amount * price)
                const compare_currency_locked = parseFloat(compare_currency_wallet.locked) - (parseFloat(amount) * parseFloat(price));
                
                console.log("++Buy++ Update balance: pre state vs post state: ", "User id : ", user_id, " Currency Wallet: ", currency_wallet, " Compare Currency Wallet: ", compare_currency_wallet, " Currency new Balance: ", currency_balance, " Comapre currency new Balance: ", compare_currency_balance, " Compare currency new Locked: ", compare_currency_locked);
                
                await Wallets.updateOne({ user: user_id, "wallet_type": { $regex: new RegExp(currency_type, "i") } }, {
                    $set: {
                        balance: currency_balance
                    }
                });
                
                await Wallets.updateOne({ user: user_id, "wallet_type": { $regex: new RegExp(compare_currency, "i") } }, {
                    $set: {
                        locked: compare_currency_locked,
                        balance: compare_currency_balance
                    }
                });
            }
            if (transaction_type == 'sub') {
                // balance = balance - amount
                const currency_balance = parseFloat(currency_wallet.balance) - parseFloat(amount);
                
                // locked = locked - amount
                const currency_locked = parseFloat(currency_wallet.locked)- parseFloat(amount);
                
                // balance = ((amount - fee) * price ) + balance
                const compare_currency_balance = parseFloat(compare_currency_wallet.balance) + ((parseFloat(amount) - parseFloat(fee)) * parseFloat(price));
                
                console.log("**Sell** Update balance: pre state vs post state: ", "User id : ", user_id, " Currency Wallet: ", currency_wallet, " Compare Currency Wallet: ", compare_currency_wallet, " Currency new Balance: ", currency_balance, " Currency new Locked: ", currency_locked, " Comapre currency new Balance: ", compare_currency_balance);
                
                await Wallets.updateOne({ user: user_id, "wallet_type": { $regex: new RegExp(currency_type, "i") } }, {
                    $set: {
                        locked: currency_locked,
                        balance: currency_balance
                    }
                });
                await Wallets.updateOne({ user: user_id, "wallet_type": { $regex: new RegExp(compare_currency, "i") } }, {
                    $set: {
                        balance: compare_currency_balance
                    }
                });
            }
        } catch (error) {
            return false;
        }
    } else { return false; }
}
async function isHaveWallet(user_id, symbol) {
    const { validateUserId } = require("./validator");
    // if (user_id && validateUserId(user_id)) {
    //     try {

    //         const { validateUserId } = require("./validator");
    //     } catch ()
    // } else {

    // }
}
async function addAllWallets(wallets, user_id) {
    try {
        if (wallets && Array.isArray(wallets) && wallets.length > 0) {
            wallets.map((async wallet => {
                // const iscreated = await addWallet(wallet, user_id);
                // if (iscreated) console.log(wallet.symbol, "created");
                addWallet(wallet, user_id).then((iscreated) => {
                    if (iscreated) {
                        // console.log(wallet.symbol, "created");
                        
                    }
                    else console.log(wallet.symbol, "not created");
                });
            }))
        }
    } catch (error) {
        console.log("Error: from: src>controller>wallets.js>addAllWallets: ", error.message);
    }
}
async function addWallet(wallet, user_id) {
    const Wallets = require('../models/wallets');
    try {
        await Wallets.create({
            private_key: wallet.privateKey,
            wallet_address: wallet.address,
            wallet_type: wallet.symbol,
            user: user_id,
            type: wallet.tokan_type ? wallet.tokan_type : '',
            wallet_status: wallet.status ? wallet.status : 0,
            contract_address: wallet.contract_address?wallet.contract_address:'',
            date: Date.now()
        })
        return true;
    } catch (error) {
        console.log("Error: from: src>controller>wallet.js>addWallet: ", error.message);
        return false;
    }
}
function createChildWallet(parrent_wallet, symbol, type, tokan_type, contract_address) {
    const obj = new Object();
    if (parrent_wallet) {
        if (parrent_wallet.address) {
            obj.address = parrent_wallet.address;
        }
        if (parrent_wallet.privateKey) {
            obj.privateKey = parrent_wallet.privateKey;
        }
        if (parrent_wallet.type) {
            obj.type = type?type:parrent_wallet.type;
        }
        if (parrent_wallet.symbol) {
            obj.symbol = symbol?symbol:parrent_wallet.symbol;
        }
        if (parrent_wallet.status) {
            obj.status = parrent_wallet.status;
        }
        if (tokan_type) {
            obj.tokan_type = tokan_type;
        }
        if (contract_address) {
            obj.contract_address = contract_address;
        }
        return obj;
    } else {
        return undefined;
    }
}
async function createUserWallets(user_id) {
    const {
        createBTCAddress,
        createETHAddress,
        createTRXAddress,
        createBCHAddress,
        createLTCAddress,
        createDASHAddress,
        createXRPAddress,
        createDOGEAddress } = require("../utils/functions.wallets");
    try {
        const coins = [];
        const btc_addr = await createBTCAddress();
        btc_addr.status = 1;
        //eth
        const eth_addr = await createETHAddress();
        eth_addr.status = 1;
        //bnb
        const bnb_addr = createChildWallet(eth_addr, 'BNB', 'Binance');
        // trx
        const trx_addr = await createTRXAddress();
        trx_addr.status = 1;

        const bch_addr = await createBCHAddress();
        const ltc_addr = await createLTCAddress();
        const dash_addr = await createDASHAddress();
        const xrp_addr = await createXRPAddress();
        const doge_addr = await createDOGEAddress();

        const inr_addr = {};
        inr_addr.privateKey = "la la lalalla "+Date.now();
        inr_addr.address = "haha "+Date.now();
        inr_addr.type = "Indian Rupee";
        inr_addr.symbol = 'INR';
        inr_addr.status = 1;

        coins[coins.length] = btc_addr; 
        coins[coins.length] = eth_addr;
        coins[coins.length] = trx_addr; // trx not created
        coins[coins.length] = bch_addr;
        coins[coins.length] = ltc_addr;
        coins[coins.length] = dash_addr;
        coins[coins.length] = xrp_addr;
        coins[coins.length] = bnb_addr; // bnb not created
        coins[coins.length] = doge_addr; 
        coins[coins.length] = inr_addr; // inr not created
        // console.log("Wallets to be created: ", coins);
        await addAllWallets(coins, user_id);
        createTokensWallet(eth_addr, trx_addr, user_id);
        return true;
    } catch (error) {
        console.log("Error: from: src>controller>wallets.js>createUserWallets: ", error.message);
        return false;
    }
}
function createTokensWallet(eth_addr, trx_addr, user_id) {
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        SupportedCurrency.find({ contract_address: { $ne: '' } }).then((supported_currencies) => {
            supported_currencies.map((currency) => {
                // console.log(currency);
                if (currency && currency.contract_type && currency.symbol && currency.name && currency.contract_address) {
                    if (currency.contract_type == 'erc20' || currency.contract_type == 'bep20') {
                        const token_addr = createChildWallet(eth_addr, currency.symbol, currency.name, currency.contract_type, currency.contract_address);
                        addWallet(token_addr, user_id).then((result) => {
                            if (result) {
                                // console.log("Custom token wallet created: ", token_addr, " for user: ", user_id);
                            } else {
                                // console.log("Custom token wallet couldn't created");
                            }
                        }).catch((error) => {
                            console.log("Error in custom token wallet creation: ", error.message);
                        })
                    } else if (currency.contract_type == 'trc10' || currency.contract_type == 'trc20') {
                        const token_addr = createChildWallet(trx_addr, currency.symbol, currency.name, currency.contract_type, currency.contract_address);
                        addWallet(token_addr, user_id).then((result) => {
                            if (result) {
                                // console.log("Custom token wallet created: ", token_addr, " for user: ", user_id);
                            } else {
                                // console.log("Custom token wallet couldn't created");
                            }
                        }).catch((error) => {
                            console.log("Error in custom token wallet creation: ", error.message);
                        })
                    }
                } else {
                    console.log("currency: ", currency);
                }
            })
        }).catch((error) => {
            console.log("Error in finding supported currency: ", error.message);
        })
    } catch (error) {
        console.log("Error createTokensWallet (function): ", error.message);
    }
}
// async function createUserWallets(user_id) {
//     const {
//         createBTCAddress,
//         createETHAddress,
//         createTRXAddress,
//         createBCHAddress,
//         createLTCAddress,
//         createDASHAddress,
//         createXRPAddress,
//         createDOGEAddress } = require("../utils/functions.wallets");
//     try {
//         const coins = [];
//         const btc_addr = await createBTCAddress();
//         btc_addr.status = 1;
//         //eth
//         const eth_addr = await createETHAddress();
//         eth_addr.status = 1;
//         const uni_addr = createChildWallet(eth_addr, 'UNI', 'Uniswap', 'erc20', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984');
//         // uni_addr.type = "Uniswap";
//         // uni_addr.symbol = "UNI";
//         // uni_addr.token_type = 'erc20';
//         // uni_addr.contract_address = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
//         const btex_addr = createChildWallet(eth_addr, 'BTEX', 'BTEX', 'bep20', '0x9482747d8F9c07B740350547d2Ae34505A1C92cb');
//         // btex_addr.type = "BTEX";
//         // btex_addr.symbol = "BTEX";
//         // btex_addr.token_type = 'bep20';
//         // btex_addr.contract_address = '0x9482747d8F9c07B740350547d2Ae34505A1C92cb';
//         const bnb_addr = createChildWallet(eth_addr, 'BNB', 'Binance');
//         // bnb_addr.type = "Binance";
//         // bnb_addr.type_id = "BNB";
//         // trx
//         const trx_addr = await createTRXAddress();
//         trx_addr.status = 1;
//         const usdt_addr = createChildWallet(eth_addr, 'USDT', 'Tether', 'erc20', '0xdac17f958d2ee523a2206206994597c13d831ec7');
//         // usdt_addr.type = "Tether";
//         // usdt_addr.symbol = "USDT";
//         // usdt_addr.token_type = 'erc20';
//         // usdt_addr.contract_address = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
//         const btt_addr = createChildWallet(trx_addr, 'BTT', 'BitTorrent', 'trc10', '1002000');
//         // btt_addr.type = "BitTorrent";
//         // btt_addr.symbol = "BTT";
//         // btt_addr.token_type = 'trc10';
//         // btt_addr.contract_address = '1002000';

//         const bch_addr = await createBCHAddress();
//         const ltc_addr = await createLTCAddress();
//         const dash_addr = await createDASHAddress();
//         const xrp_addr = await createXRPAddress();
//         const doge_addr = await createDOGEAddress();

//         const inr_addr = {};
//         inr_addr.privateKey = "la la lalalla "+Date.now();
//         inr_addr.address = "haha "+Date.now();
//         inr_addr.type = "Indian Rupee";
//         inr_addr.symbol = 'INR';
//         inr_addr.status = 1;
//         /**
//  * INR not created
//     BTT created
//     BCH created
//     ETH created
//     BTC created
//     XRP created
//     BTT created
//     DASH created
//     BTT created
//     LTC created
//     doge created
//     ETH created
//     ETH created
//  */
//         coins[coins.length] = btc_addr; 
//         coins[coins.length] = eth_addr;
//         coins[coins.length] = trx_addr; // trx not created
//         coins[coins.length] = bch_addr;
//         coins[coins.length] = ltc_addr;
//         coins[coins.length] = dash_addr;
//         coins[coins.length] = xrp_addr;
//         coins[coins.length] = usdt_addr; // usdt not created
//         coins[coins.length] = btt_addr;
//         coins[coins.length] = uni_addr; // uni not created
//         coins[coins.length] = bnb_addr; // bnb not created
//         coins[coins.length] = btex_addr; // bnb not created
//         coins[coins.length] = doge_addr; 
//         coins[coins.length] = inr_addr; // inr not created
//         console.log("Wallets to be created: ", coins);
//         await addAllWallets(coins, user_id);
//         return true;
//     } catch (error) {
//         console.log("Error: from: src>controller>wallets.js>createUserWallets: ", error.message);
//         return false;
//     }
// }
async function getDepositHistory(user_id) {
    const DepositHistory = require('../models/deposite_history');
    try {     
        const deposit_history = await DepositHistory.find({user_id:user_id, status: true});
        return deposit_history;
    } catch (error) {
        console.log("Error: >from: function.wallet.js > getDepositHistory > try: ", error.message);
        return 0;
    }
} 
/**
 * 
 * for trade history details  
 * @returns Trade history for based user id
 */
async function getTradeHistory(user_id) {
    const TradeHistory = require('../models/trade_history');
    try {     
        const sell_tarde_history = await TradeHistory.find({sell_user_id:user_id});
        let sell = [];
        sell_tarde_history.map((item) =>{
            sell.push({
                currency_type: item.currency_type,
                compare_currency: item.compare_currency,
                price: item.price,
                volume: item.volume,
                buy_order_id: item.buy_order_id,
                sell_order_id: item.sell_order_id,
                trade_date: item.trade_date,
                type: 'Sell'
            });
        });
      
        const buy_tarde_history = await TradeHistory.find({buy_user_id:user_id});
        let buy = [];
        buy_tarde_history.map((item) =>{
            buy.push({
                currency_type: item.currency_type,
                compare_currency: item.compare_currency,
                price: item.price,
                volume: item.volume,
                buy_order_id: item.buy_order_id,
                sell_order_id: item.sell_order_id,
                trade_date: item.trade_date,
                type: 'Buy'
            });
        });
        const result = [...buy, ...sell].sort((a, b) =>  new Date(Number(b.trade_date)) - new Date(Number(a.trade_date)));
        return result;
    } catch (error) {
        console.log("Error: >from: function.wallet.js > getTradeHistory > try: ", error.message);
        return 0;
    }
} 
async function getOrderHistory(user_id) {
    const BuyHistory = require('../models/buy_stack');
    const SellHistory = require('../models/sell_stack');
    try {     
        const sell_order_history = await SellHistory.find({user_id: user_id, order_status:0});
        let sell = [];
        sell_order_history.map((item) =>{
            sell.push({
                currency_type: item.currency_type,
                compare_currency: item.compare_currency,
                price: item.raw_price,
                volume: parseFloat(item.volume) - parseFloat(item.total_executed),
                order_id: item.order_id,
                trade_date: item.order_date,
                type: 'Sell'
            });
        });
      
        const buy_order_history = await BuyHistory.find({user_id: user_id, order_status:0});
        let buy = [];
        buy_order_history.map((item) =>{
            buy.push({
                currency_type: item.currency_type,
                compare_currency: item.compare_currency,
                price: item.raw_price,
                volume: parseFloat(item.volume) - parseFloat(item.total_executed),
                order_id: item.order_id,
                trade_date: item.order_date,
                type: 'Buy'
            });
        });
        const result = [...buy, ...sell].sort((a, b) =>  new Date(Number(b.trade_date)) - new Date(Number(a.trade_date)));
        return result;
    } catch (error) {
        console.log("Error: >from: function.wallet.js > getTradeHistory > try: ", error.message);
        return 0;
    }
} 
async function getWithdrawHistory(user_id) {
    const WithdrawHistory = require('../models/withdraw_history');
    try {     
        const Withdraw_history = await WithdrawHistory.find({user_id:user_id, status: {$in:[1, -2]}});
        return Withdraw_history;
    } catch (error) {
        console.log("Error: >from: function.wallet.js > getWithdrawHistory > try: ", error.message);
        return 0;
    }
}

async function getWalletBalance(wallet_address, wallet_type, contract_address='', type='') {
    // console.log("called data", wallet_address, wallet_type, contract_address, type);
    //     const Web3 = require("web3");
    //     const TronWeb = require("tronweb");
    //     // const web3 = new Web3("https://bsc-dataseed4.binance.org/");
    //     // const web3 = new Web3("https://data-seed-prebsc-1-s2.binance.org:8545/");
    //     const web3Eth = new Web3("https://mainnet.infura.io/v3/d5bcba9decc042879125ca752dc4637b");
    //     const tronWeb = new TronWeb({
    //         fullHost: "https://api.trongrid.io",
    //     });
         const fetch = require('cross-fetch');
        try{       
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
            // var contract = new web3.eth.Contract(abi, contract_address);
            // var contractEth = new web3Eth.eth.Contract(abi, contract_address);
            // let bnbdecimal = await contract.methods.decimals().call();
            // bnbdecimal=Number(`1e${bnbdecimal}`);
            // let ethdecimal = await contractEth.methods.decimals().call();
            // ethdecimal=Number(`1e${ethdecimal}`);

            if (wallet_type == 'TRX') {
                const decimal = 1e6;
                const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet_address}`);
                const dt = await ds.json();
                if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                    let trx_balance = dt['data'][0].balance?(dt['data'][0].balance)/decimal:0;
                    return trx_balance;
                } else {
                    // something went wrong
                    return 0;
                }
            // } else if (wallet_type == 'BNB') {
            //     const decimal = 1e18;
            //     const bnb_balance = await web3Bnb.eth.getBalance(wallet_address);
            //     console.log("bnbBalance", bnb_balance)
            // } else if (wallet_type == 'ETH') {
            //     const decimal = 1e18;
            //     const eth_balance = await web3Eth.eth.getBalance(wallet_address);
            //     console.log("ethBalance", eth_balance)
            } else if (type == 'trc20') {
                const decimal = 1e6;
                const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet_address}`);
                const dt = await ds.json();
                if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                    let trc20 = dt['data'][0].trc20.length > 0 ? dt['data'][0].trc20 : [];
                        if (trc20.length > 0) {
                            let contract_data = trc20.find((val, index) => val[contract_address]);
                            if (contract_data && contract_data[contract_address]) {
                                let trx_token_balance = parseInt(contract_data[contract_address])/decimal;
                                return trx_token_balance;
                            } else {
                                return 0;
                            }
                        } else {
                            return 0;
                        }
                    
                } else {
                    // something went wrong
                    return 0;
                }
            } else if (type == 'trc10') {
                const decimal = 1e6;
                const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet_address}`);
                const dt = await ds.json();
                if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                    let trc10 = dt['data'][0].assetV2 ? dt['data'][0].assetV2 : [];
                        if (trc10.length > 0) {
                            console.log("trc10", trc10);
                            const contract_data = trc10.find((data) => data.key == contract_address);
                            if (contract_data && contract_data.key) {
                                let trx_token_balance = contract_data.value/decimal;
                                return trx_token_balance;
                            } else {
                                return 0;
                            }
                        } else {
                            return 0;
                        }
                   
                } else {
                    // something went wrong
                    return 0;
                }
            // } else if (type == 'erc20') {
            //     const contract_balance = await contractEth.methods.balanceOf(wallet_address).call();
            //     console.log("erc20", contract_balance);   
            // } else if (type == 'bep20') {
            //     const contract_balance = await contract.methods.balanceOf(wallet_address).call();
            //     console.log("bep20balance", contract_balance);    
            } else {
                return 0;
            }
        } catch (error) {
            console.log("error", error.message);
        }
}
module.exports = {
    getUserBalance,
    updateUserBalance,
    updateUserLockBalance,
    sendBalanceToUserWallet,
    createUserWallets,
    updateCancleOrderBalance,
    getWithdrawHistory,
    getDepositHistory,
    getTradeHistory,
    getOrderHistory,
    getWalletBalance
}
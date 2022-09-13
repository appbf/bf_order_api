const { addWallet, createChildWallet } = require('./function.wallets');
async function createBTCAddress() {
    const bitcore = require('bitcore-lib');
    const privateKey = new bitcore.PrivateKey();
    var address = privateKey.toAddress();
    if (bitcore.PrivateKey.isValid(privateKey)) {
        address = bitcore.Address.isValid(address) ? address : undefined;
    }
    if (address !== undefined) {
        return ({
            address: address.toString(),
            privateKey: privateKey.toString(),
            type: "bitcoin",
            symbol: 'BTC'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol: ''
        })
    }
}
async function createETHAddress() {
    const ethWallet = require('ethereumjs-wallet');
    // console.log(ethWallet.default)
    const address = ethWallet.default.generate();
    if (address !== undefined) {
        // console.log(address);
        return ({
            address: address.getAddressString(),
            privateKey: address.getPrivateKeyString(),
            type: "ethereum",
            symbol: 'ETH'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol: ''
        })
    }
}
async function createTRXAddress() {
    const TronWeb = require('tronweb');
    let wallet = TronWeb.utils.accounts.generateAccount();
    if (wallet && wallet.address && wallet.address.base58 && wallet.privateKey) {
        return ({
            address: wallet.address.base58,
            privateKey: wallet.privateKey,
            type: "TRON",
            symbol: 'TRX'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol:''
        })
    }

}
async function createBCHAddress() {
    const bitcore = require('bitcore-lib-cash');
    const privateKey = new bitcore.PrivateKey();
    var address = privateKey.toAddress();
    if (bitcore.PrivateKey.isValid(privateKey)) {
        address = bitcore.Address.isValid(address) ? address : undefined;
    }
    // console.log(address.toString());
    // console.log(privateKey.toString());
    if (address !== undefined) {
        return ({
            address: address.toString(),
            privateKey: privateKey.toString(),
            type: "Bitcoin Cash",
            symbol: 'BCH',
            type_id: 1831,
            balance: 0
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            type_id: 0
        })
    }
}
async function createLTCAddress() {
    const litecore = require('litecore-lib');
    var privateKey = new litecore.PrivateKey();
    var address = privateKey.toAddress();
    if (litecore.PrivateKey.isValid(privateKey)) {
        address = litecore.Address.isValid(address) ? address : undefined;
    }
    // console.log(address.toString());
    // console.log(privateKey.toString());
    if (address !== undefined) {
        return ({
            address: address.toString(),
            privateKey: privateKey.toString(),
            type: "Litecoin",
            symbol: 'LTC'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol:''
        })
    }
}
async function createDASHAddress() {
    const dashcore = require('@dashevo/dashcore-lib');
    var privateKey = new dashcore.PrivateKey();
    var address = privateKey.toAddress();
    if (dashcore.PrivateKey.isValid(privateKey)) {
        address = dashcore.Address.isValid(address) ? address : undefined;
    }
    // console.log(address.toString());
    // console.log(privateKey.toString());
    if (address !== undefined) {
        return ({
            address: address.toString(),
            privateKey: privateKey.toString(),
            type: "Dash",
            symbol:'DASH'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol:''
        })
    }
}
// use block shypher for this
async function createXRPAddress() {
    const keypair = require('ripple-keypairs');
    const seed = keypair.generateSeed();
    const keys = keypair.deriveKeypair(seed);
    const address = keypair.deriveAddress(keys.publicKey);
    const privateKey = keys.privateKey;
    if (address !== undefined) {
        return ({
            address: address,
            privateKey: privateKey,
            type: "XRP",
            symbol:'XRP'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol:''
        })
    }
}
async function createUSDTAddress() {
    let usdt_address = await createTRXAddress();
    usdt_address.type = "Tether";
    usdt_address.symbol = "USDT";
    usdt_address.type_id = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    return usdt_address;
}
async function createBTTAddress() {
    let btt_address = await createTRXAddress();
    btt_address.type = "BitTorrent";
    btt_address.symbol = "BTT";
    return btt_address;
}
async function createUNIAddress() {
    let uni_address = await createETHAddress();
    uni_address.type = "Uniswap";
    uni_address.symbol = "UNI";
    uni_address.type_id = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
    return uni_address;
}
async function createDOGEAddress() {
    var CoinKey = require('coinkey')    
    var coinInfo = require('coininfo') 

    var dogeInfo = coinInfo('DOGE').versions

    var address = new CoinKey.createRandom(dogeInfo)
    if (address !== undefined) {
        return ({
            address: address.publicAddress,
            privateKey: address.privateKey.toString('hex'),
            type: "DOGE",
            symbol: 'DOGE'
        })
    } else {
        return ({
            address: "",
            privateKey: "",
            type: "",
            symbol: ''
        })
    }
}
async function updateColdW(wallet_type,wallet_address) {
    const ColdWallets = require("../models/wallet_cold");
    let findcold = await ColdWallets.findOne({"wallet_type":wallet_type});
    if(findcold){
        let updatecold =  ColdWallets.updateOne({"wallet_type":wallet_type},{
            $set: {wallet_address:wallet_address}
        });
        return (await updatecold).matchedCount; 
    }else{
        let updatecold =  ColdWallets.create({wallet_type,wallet_address});
        return updatecold ? 1 : 0;
    }
    
}
async function updateHotW(wallet_type,wallet_address,private_key) {
    const HotWallets = require("../models/wallet_hot");
    let findcold = await HotWallets.findOne({"wallet_type":wallet_type});
    if(findcold){
        let updatehot =  HotWallets.updateOne({"wallet_type":wallet_type},{
            $set: {"wallet_address":wallet_address,"private_key":private_key}
        });
        return (await updatehot).matchedCount;; 
    }else{
        let updatehot =  HotWallets.create({wallet_type,wallet_address,private_key});
        return updatehot ? 1 : 0;
    }
    
}
async function createBNBAddress() {
    let bnb_address = await createETHAddress();
    bnb_address.type = "Binance";
    bnb_address.symbol = "BNB";
    return bnb_address;
}
//eth = bnb
// doge
// 
function createCustomTokenWallet(token_name, token_symbol, contract_type, contract_address) {
    // const token_name = 'KINGVRX';
    // const token_symbol = 'KINGVRX';
    // const contract_type = 'bep20';
    // const contract_address = '0xfE2ef531833D773618957Cb0C30C115eB5923595';
    const Users = require('../models/user');
    const Wallets = require('../models/wallets');
    try {
        let w = {};
        let count = 0;
        Users.find({}).then((users) => {
            console.log("Total users: ", users.length);
            users.map((user) => {
                Wallets.find({ user: user.user_id }).then((wallets) => {
                    // let walletTRX = wallets.find((w) => w.wallet_type == 'TRX');
                    if (contract_type.toLowerCase() == 'bep20') {
                        let parentwallet = wallets.find((w) => w.wallet_type == 'ETH');
                        let currentwallet = wallets.find((w) => w.wallet_type == token_symbol.toUpperCase());
                        if (!currentwallet) {
                            if (parentwallet && parentwallet.wallet_address && parentwallet.private_key) {
                                const parent_wallet_obj = {
                                    address: parentwallet.wallet_address,
                                    privateKey: parentwallet.private_key,
                                    type: parentwallet.type ? parentwallet.type : '',
                                    symbol: parentwallet.wallet_type ? parentwallet.wallet_type : '',
                                    status: parentwallet.wallet_status ? parentwallet.wallet_status : 0
                                }
                                const token_addr = createChildWallet(parent_wallet_obj, token_symbol.toUpperCase(), token_name, contract_type.toLowerCase(), contract_address);
                                addWallet(token_addr, user.user_id).then((result) => {
                                    if (result) {
                                        // console.log("Custom token wallet created: ", token_addr, " for user: ", user.user_id);
                                    } else {
                                        // console.log("Custom token wallet couldn't created");
                                    }
                                    console.log(++count, "/", users.length, " wallets created");
                                }).catch((error) => {
                                    console.log("Error in custom token wallet creation: ", error.message);
                                })
                            }
                        }
                    } else if (contract_type.toLowerCase() == 'erc20') {
                        let parentwallet = wallets.find((w) => w.wallet_type == 'ETH');
                        let currentwallet = wallets.find((w) => w.wallet_type == token_symbol.toUpperCase());
                        if (!currentwallet) {
                            if (parentwallet && parentwallet.wallet_address && parentwallet.private_key) {
                                const parent_wallet_obj = {
                                    address: parentwallet.wallet_address,
                                    privateKey: parentwallet.private_key,
                                    type: parentwallet.type ? parentwallet.type : '',
                                    symbol: parentwallet.wallet_type ? parentwallet.wallet_type : '',
                                    status: parentwallet.wallet_status ? parentwallet.wallet_status : 0
                                }
                                const token_addr = createChildWallet(parent_wallet_obj, token_symbol.toUpperCase(), token_name, contract_type.toLowerCase(), contract_address);
                                addWallet(token_addr, user.user_id).then((result) => {
                                    if (result) {
                                        // console.log("Custom token wallet created: ", token_addr, " for user: ", user.user_id);
                                    } else {
                                        // console.log("Custom token wallet couldn't created");
                                    }
                                    console.log(++count, "/", users.length, " wallets created");
                                }).catch((error) => {
                                    console.log("Error in custom token wallet creation: ", error.message);
                                })
                            }
                        }
                    } else if (contract_type.toLowerCase() == 'trc10') {
                        let parentwallet = wallets.find((w) => w.wallet_type == 'TRX');
                        let currentwallet = wallets.find((w) => w.wallet_type == token_symbol.toUpperCase());
                        if (!currentwallet) {
                            if (parentwallet && parentwallet.wallet_address && parentwallet.private_key) {
                                const parent_wallet_obj = {
                                    address: parentwallet.wallet_address,
                                    privateKey: parentwallet.private_key,
                                    type: parentwallet.type ? parentwallet.type : '',
                                    symbol: parentwallet.wallet_type ? parentwallet.wallet_type : '',
                                    status: parentwallet.wallet_status ? parentwallet.wallet_status : 0
                                }
                                const token_addr = createChildWallet(parent_wallet_obj, token_symbol.toUpperCase(), token_name, contract_type.toLowerCase(), contract_address);
                                addWallet(token_addr, user.user_id).then((result) => {
                                    if (result) {
                                        // console.log("Custom token wallet created: ", token_addr, " for user: ", user.user_id);
                                    } else {
                                        // console.log("Custom token wallet couldn't created");
                                    }
                                    console.log(++count, "/", users.length, " wallets created");
                                }).catch((error) => {
                                    console.log("Error in custom token wallet creation: ", error.message);
                                })
                            }
                        }
                    } else if (contract_type.toLowerCase() == 'trc20') {
                        let parentwallet = wallets.find((w) => w.wallet_type == 'TRX');
                        let currentwallet = wallets.find((w) => w.wallet_type == token_symbol.toUpperCase());
                        if (!currentwallet) {
                            if (parentwallet && parentwallet.wallet_address && parentwallet.private_key) {
                                const parent_wallet_obj = {
                                    address: parentwallet.wallet_address,
                                    privateKey: parentwallet.private_key,
                                    type: parentwallet.type ? parentwallet.type : '',
                                    symbol: parentwallet.wallet_type ? parentwallet.wallet_type : '',
                                    status: parentwallet.wallet_status ? parentwallet.wallet_status : 0
                                }
                                const token_addr = createChildWallet(parent_wallet_obj, token_symbol.toUpperCase(), token_name, contract_type.toLowerCase(), contract_address);
                                addWallet(token_addr, user.user_id).then((result) => {
                                    if (result) {
                                        // console.log("Custom token wallet created: ", token_addr, " for user: ", user.user_id);
                                    } else {
                                        // console.log("Custom token wallet couldn't created");
                                    }
                                    console.log(++count, "/", users.length, " wallets created");
                                }).catch((error) => {
                                    console.log("Error in custom token wallet creation: ", error.message);
                                })
                            }
                        }
                    }
                }).catch((error) => {
                    console.log("Error in update user wallet:: ", error.message)
                })
            })
        }).catch((error) => {
            console.log("Error in fetching all users: ", error.message);
        })
    } catch (error) {
        console.log("Error createCustomTokenWallet (function): ", error.message);
    }
}
module.exports = {
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
    createBNBAddress,
    updateColdW,
    updateHotW,
    createCustomTokenWallet,
}
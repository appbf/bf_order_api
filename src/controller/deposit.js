const { validateUserId } = require("../utils/validator");
const Wallets = require('../models/wallets');
const AdminWallet = require('../models/wallet_cold');
const dex = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    },
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
        inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
        name: "transfer",
        outputs: [{ name: "success", type: "bool" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
    },
];

/**
 * eth
 */
const eth_mainnet = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const eth_testnet = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
const Web3 = require("web3");
const web3Provider = new Web3.providers.HttpProvider(eth_mainnet);
const web3Eth = new Web3(web3Provider);

/**
 * trx
 * here we will use cross fetch
 */
const TronWeb = require("tronweb");
const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", });
const fetch = require('cross-fetch');

/**
 * bnb
 */
const BSCTESTNET_WSS = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSCMAINNET_WSS = "https://bsc-dataseed.binance.org/";
const web3ProviderBnb = new Web3.providers.HttpProvider(BSCMAINNET_WSS);
const web3Bnb = new Web3(web3ProviderBnb);

async function updateUserDeposit(req, res) {
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            /**
             * fetch all wallets
             */
            // console.log("user_id: ", user_id);

            var walletETH = await Wallets.find({ user_id: user_id, wallet_type: 'ETH' });
            // var walletUSDT1 = await Wallets.findOne({ user_id: user_id, wallet_type: 'USDT' });
            var walletUSDT = await Wallets.find({ user_id: user_id, wallet_type: 'USDT' });
            var walletTRX = await Wallets.find({ user_id: user_id, wallet_type: 'TRX' });
            var walletBTT = await Wallets.find({ user_id: user_id, wallet_type: 'BTT' });
            var walletBNB = await Wallets.find({ user_id: user_id, wallet_type: 'BNB' });
            var walletBTEX = await Wallets.find({ user_id: user_id, wallet_type: 'BTEX' });
            var walletBUSD = await Wallets.find({ user_id: user_id, wallet_type: 'BUSD' });
            // console.log(walletETH, walletUSDT, walletTRX, walletBNB, walletBTEX)

            var walletETH = walletETH.find((data) => data.user == user_id);
            var walletUSDT = walletUSDT.find((data) => data.user == user_id);
            var walletTRX = walletTRX.find((data) => data.user == user_id);
            var walletBNB = walletBNB.find((data) => data.user == user_id);
            var walletBTEX = walletBTEX.find((data) => data.user == user_id);
            var walletBTT = walletBTT.find((data) => data.user == user_id);
            var walletBUSD = walletBUSD.find((data) => data.user == user_id);
            // console.log(walletUSDT, walletUSDT1)
            /**
             * check for balance
             */
            if (walletETH && walletETH.wallet_type == 'ETH') {
                // console.log("ETH")
                let wallet = walletETH;
                const decimal = 1e18;
                const bal = await web3Eth.eth.getBalance(wallet.wallet_address);
                let balance = bal ? bal / decimal : 0;
                if (balance > 0) {
                    /**
                     * check for v balance
                     */
                    const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                    /**check for admin transfer */
                    const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                    const balance_without_admin_transfer = balance - admin_transfer;
                    const updated_balance = balance_without_admin_transfer - v_balance;
                    const new_v_balance = v_balance + updated_balance;
                    const new_w_balance = w_balance + updated_balance;
                    /**
                     * update user's wallet
                     */
                    await Wallets.updateOne({ _id: walletETH._id }, {
                        $set: {
                            balance: new_w_balance,
                            v_balanace: new_v_balance
                        }
                    });
                    if (updated_balance > 0) {
                        createDepositHistory(user_id, 'ETH', wallet.wallet_address, updated_balance);
                    }
                    /**
                     * execute transaction for cold wallet
                     */
                    // const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                    // if (admin_wallets && admin_wallets.wallet_address) {
                    //     const toAddress = admin_wallets.wallet_address;
                    //     const gas = await web3Eth.eth.estimateGas({ to: wallet.wallet_address });
                    //     const gas_price = await web3Eth.eth.getGasPrice();
                    //     const signed_transaction = await web3Eth.eth.accounts.signTransaction({
                    //         from: wallet.wallet_address,
                    //         to: toAddress, // admin address
                    //         value: ((balance_without_admin_transfer * decimal) - (gas * gas_price)),
                    //         gas: gas,
                    //     },
                    //         wallet.private_key
                    //     );
                    //     const transaction_result = await web3Eth.eth.sendSignedTransaction(signed_transaction.rawTransaction);
                    //     if (transaction_result && transaction_result.status) {
                    //         /** update v balance */
                    //         await Wallets.updateOne({ user_id: user_id, wallet_type: wallet.wallet_type }, {
                    //             $set: {
                    //                 v_balanace: 0
                    //             }
                    //         });
                    //     }
                    // }
                }
            }
            if (walletUSDT && walletUSDT.wallet_type == 'USDT') {
                // console.log("USDT")
                let wallet = walletUSDT;
                // const contract = new web3Eth.eth.Contract(dex, wallet.contract_address);
                // const decimal = await contract.methods.decimals().call();

                // const bal = await contract.methods.balanceOf(wallet.wallet_address).call();
                // let balance = bal ? bal / Number(`1e${decimal}`) : 0;
                // console.log('bal', walletUSDT._id);
                // if (balance > 0) {
                //     /**
                //      * check for v balance
                //      */

                //     const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                //     const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                //     /**check for admin transfer */
                //     const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                //     const balance_without_admin_transfer = balance;
                //     const updated_balance = balance_without_admin_transfer - v_balance;
                //     const new_v_balance = v_balance + updated_balance;
                //     const new_w_balance = w_balance + updated_balance;
                //     /**
                //      * update user's wallet
                //      */
                //     console.log(new_v_balance, new_w_balance)
                //     await Wallets.updateOne({ _id: walletUSDT._id }, {
                //         $set: {
                //             balance: new_w_balance,
                //             v_balanace: new_v_balance
                //         }
                //     });
                const decimal = 1e6;
                const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`);//TV6MuMXfmLbBqPZvBHdwFsDnQeVfnmiuSi`);//
                const dt = await ds.json();
                // console.log(dt, "btt", wallet.wallet_address);
                if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                    let trc20 = dt['data'][0].trc20.length > 0 ? dt['data'][0].trc20 : [];
                    // console.log("trc10: ", trc20);
                    if (trc20.length > 0) {
                        let contract_obj = trc20.find((val, index) => val[wallet.contract_address]);//val['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'])//
                        if (contract_obj && contract_obj[wallet.contract_address]) {
                            let usdt_balance = parseInt(contract_obj[wallet.contract_address]);

                            // let trx_token_balance = btt_data.value;
                            if (usdt_balance > 0) {

                                // console.log("USDT wallet: ", usdt_balance);
                                // perform transaction of trx

                                let balance = usdt_balance ? usdt_balance / decimal : 0;

                                // check for v balance

                                const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                                const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                                //check for admin transfer 
                                const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                                const balance_without_admin_transfer = balance - admin_transfer;
                                const updated_balance = balance_without_admin_transfer - v_balance;
                                if (updated_balance >= 10) {
                                    const new_v_balance = v_balance + updated_balance;
                                    const new_w_balance = w_balance + updated_balance;
                                    //update wallet
                                    // console.log(new_v_balance, new_w_balance)
                                    await Wallets.updateOne({ _id: wallet._id }, {
                                        $set: {
                                            balance: new_w_balance,
                                            v_balanace: new_v_balance
                                        }
                                    });
                                    if (updated_balance > 0) {
                                        createDepositHistory(user_id, 'USDT', wallet.wallet_address, updated_balance);
                                    }
                                } else {
                                    // const new_v_balance = v_balance + updated_balance;
                                    //update wallet
                                    // console.log(new_v_balance, new_w_balance)
                                    await Wallets.updateOne({ _id: wallet._id }, {
                                        $set: {
                                            admin_transfer: updated_balance
                                        }
                                    });
                                }
                                // transaction code will not be there

                            }
                            // }
                        }
                    }
                }
            }
            if (walletTRX && walletTRX.wallet_type == 'TRX') {
                // console.log("TRX")
                let wallet = walletTRX;
                const decimal = 1e6;
                const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`);//TBGXMT56vCd7H1jqYUW5RtJYbmqfJ3zM8p`);//${wallet.wallet_address}`);//);
                const dt = await ds.json();
                let trc10 = [];
                let trc20 = [];
                // console.log(dt['data'][0], "trx");
                if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                    trc10 = dt['data'][0].assetV2 ? dt['data'][0].assetV2 : [];
                    trc20 = dt['data'][0].trc20.length > 0 ? dt['data'][0].trc20 : [];
                    let trx_balance = dt['data'][0].balance;
                    if (trx_balance > 0) {
                        /** 
                         * perform transaction of trx
                         */
                        let balance = trx_balance ? trx_balance / decimal : 0;
                        /**
                         * check for v balance
                         */
                        const v_balance = !isNaN(wallet.v_balanace) ? parseFloat(wallet.v_balanace) : 0;
                        const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                        // console.log("v balance: ", v_balance);
                        /**check for admin transfer */
                        const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                        const balance_without_admin_transfer = balance - admin_transfer;
                        // console.log("balance www: ", v_balance, balance, balance_without_admin_transfer, balance_without_admin_transfer - v_balance)
                        const updated_balance = balance_without_admin_transfer - v_balance;
                        // console.log("updated_balance : ", updated_balance);
                        if (updated_balance >= 50) {
                            const new_v_balance = v_balance + updated_balance;
                            // console.log(new_v_balance, wallet.v_balanace)
                            const new_w_balance = w_balance + updated_balance;
                            /**
                             * update user's wallet
                             */

                            // console.log("balance: ", balance, new_v_balance, new_w_balance, wallet);
                            const ttt = await Wallets.updateOne({ _id: walletTRX._id }, {
                                $set: {
                                    balance: new_w_balance,
                                    v_balanace: new_v_balance
                                }
                            });
                            if (updated_balance > 0) {
                                createDepositHistory(user_id, 'TRX', wallet.wallet_address, updated_balance)
                            }
                        } else {
                            // invalid deposit
                            // const new_v_balance = v_balance + updated_balance;
                            /**
                             * update user's wallet
                             */

                            // console.log("balance: ", balance, new_v_balance, new_w_balance, wallet);
                            const ttt = await Wallets.updateOne({ _id: walletTRX._id }, {
                                $set: {
                                    admin_transfer: updated_balance
                                }
                            });
                        }
                        
                        // console.log("ttt: ", ttt);
                        /**
                         * admin transfer
                         */
                        // const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                        // if (admin_wallets && admin_wallets.wallet_address) {
                        //     const toAddress = admin_wallets.wallet_address;
                        //     const tradeobj = await tronWeb.transactionBuilder.sendTrx(
                        //         toAddress,
                        //         (balance_without_admin_transfer * decimal),
                        //         wallet.wallet_address
                        //     );
                        //     const signedtxn = await tronWeb.trx.sign(tradeobj, wallet.private_key);
                        //     await tronWeb.trx.sendRawTransaction(signedtxn)
                        //     /** update v balance */
                        //     await Wallets.updateOne({ user_id: user_id, wallet_type: wallet.wallet_type }, {
                        //         $set: {
                        //             v_balanace: 0
                        //         }
                        //     });
                        // }
                    }   
                }
            }
            if (walletBTT && walletBTT.wallet_type == 'BTT') {
                // console.log("BTT")
                let wallet = walletBTT;
                const decimal = 1e6;
                const ds = await fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`);//TV6MuMXfmLbBqPZvBHdwFsDnQeVfnmiuSi`);//
                const dt = await ds.json();
                // console.log(dt, "btt", wallet.wallet_address);
                if (dt && dt['data'] && dt['data'].length > 0 && dt['data'][0]) {
                    let trc10 = dt['data'][0].assetV2 ? dt['data'][0].assetV2 : [];
                    // console.log("trc10: ", trc10)
                    if (trc10.length > 0) {
                        const btt_data = trc10.find((data) => data.key == wallet.contract_address);
                        // trc10.forEach(async (contract) => {
                        //     // {
                        //     //     "value": 100000,
                        //     //         "key": "1003578"
                        //     // },
                        // console.log("BTT: ", btt_data);
                        if (btt_data && btt_data.key) {
                            // const w = await Wallets.findOne({ _id: walletBTT._id });
                            // if (w) {
                                
                                // perform transaction and updation

                                let trx_token_balance = btt_data.value;
                                if (trx_token_balance > 0) {
                                     
                                    // console.log("BTT wallet: ", trx_token_balance);
                                    // perform transaction of trx
                                     
                                    let balance = trx_token_balance ? trx_token_balance / decimal : 0;
                                    
                                     // check for v balance
                                     
                                    const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                                    //check for admin transfer 
                                    const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                                    const balance_without_admin_transfer = balance - admin_transfer;
                                    const updated_balance = balance_without_admin_transfer - v_balance;
                                    const new_v_balance = v_balance + updated_balance;
                                    const new_w_balance = w_balance + updated_balance;
                                    //update wallet
                                    // console.log(new_v_balance, new_w_balance)
                                    await Wallets.updateOne({ _id: walletBTT._id }, {
                                        $set: {
                                            balance: new_w_balance,
                                            v_balanace: new_v_balance
                                        }
                                    });
                                    if (updated_balance > 0) {
                                        createDepositHistory(user_id, 'BTT', wallet.wallet_address, updated_balance);
                                    }
                                     // transaction code will not be there
                                     
                                }
                            // }
                        }
                        // });
                    }
                }
            }
            if (walletBNB && walletBNB.wallet_type == 'BNB') {
                // console.log("BNB")
                let wallet = walletBNB;
                const decimal = 1e18;
                const bal = await web3Bnb.eth.getBalance(wallet.wallet_address);
                let balance = bal ? bal / decimal : 0;
                if (balance > 0) {
                    /**
                     * check for v balance
                     */
                    const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                    /**check for admin transfer */
                    const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                    const balance_without_admin_transfer = balance - admin_transfer;
                    const updated_balance = balance_without_admin_transfer - v_balance;
                    const new_v_balance = v_balance + updated_balance;
                    const new_w_balance = w_balance + updated_balance;
                    /**
                     * update user's wallet
                     */
                    await Wallets.updateOne({ _id: walletBNB._id }, {
                        $set: {
                            balance:  new_w_balance,
                            v_balanace:  new_v_balance
                        }
                    });
                    if (updated_balance > 0) {
                        createDepositHistory(user_id, 'BNB', wallet.wallet_address, updated_balance);
                    }
                    /**
                     * execute transaction for cold wallet
                     */
                    // const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                    // if (admin_wallets && admin_wallets.wallet_address) {
                    //     const toAddress = admin_wallets.wallet_address;
                    //     const gas = await web3Bnb.eth.estimateGas({ to: wallet.wallet_address });
                    //     const gas_price = await web3Bnb.eth.getGasPrice();
                    //     const signed_transaction = await web3Bnb.eth.accounts.signTransaction({
                    //         from: wallet.wallet_address,
                    //         to: toAddress, // admin address
                    //         value: ((balance_without_admin_transfer * decimal) - (gas * gas_price)),
                    //         gas: gas,
                    //     },
                    //         wallet.private_key
                    //     );
                    //     const transaction_result = await web3Bnb.eth.sendSignedTransaction(signed_transaction.rawTransaction);
                    //     if (transaction_result && transaction_result.status) {
                    //         /** update v balance */
                    //         await Wallets.updateOne({ user_id: user_id, wallet_type: wallet.wallet_type }, {
                    //             $set: {
                    //                 v_balanace: 0
                    //             }
                    //         });
                    //     }
                    // }
                }
            }
            if (walletBTEX && walletBTEX.wallet_type == 'BTEX') {
                // console.log("BTEX")
                let wallet = walletBTEX;
                const contract = new web3Bnb.eth.Contract(dex, wallet.contract_address);
                const decimal = 18;//await contract.methods.decimals().call();

                const bal = await contract.methods.balanceOf(wallet.wallet_address).call();
                let balance = bal ? bal / Number(`1e${decimal}`) : 0;
                if (balance > 0) {
                    /**
                     * check for v balance
                     */
                    const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                    /**check for admin transfer */
                    const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                    const balance_without_admin_transfer = balance - admin_transfer;
                    const updated_balance = balance_without_admin_transfer - v_balance;
                    const new_v_balance = v_balance + updated_balance;
                    const new_w_balance = w_balance + updated_balance;
                    /**
                     * update user's wallet
                     */
                    await Wallets.updateOne({ _id: walletBTEX._id }, {
                        $set: {
                            balance: new_w_balance,
                            v_balanace: new_v_balance
                        }
                    });
                    if (updated_balance > 0) {
                        createDepositHistory(user_id, 'BTEX', wallet.wallet_address, updated_balance);
                    }
                    /**
                     * execute transaction for cold wallet
                     */
                    /**
                     * here is no admin transfer
                     */
                    // const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                    // if (admin_wallets && admin_wallets.wallet_address) {
                    //     const toAddress = admin_wallets.wallet_address;
                    //     const gas = await web3Bnb.eth.estimateGas({ to: wallet.wallet_address });
                    //     const gas_price = await web3Bnb.eth.getGasPrice();
                    //     const signed_transaction = await web3Bnb.eth.accounts.signTransaction({
                    //         from: wallet.wallet_address,
                    //         to: toAddress, // admin address
                    //         value: ((balance_without_admin_transfer * decimal) - (gas * gas_price)),
                    //         gas: gas,
                    //     },
                    //         wallet.private_key
                    //     );
                    //     const transaction_result = await web3Bnb.eth.sendSignedTransaction(signed_transaction.rawTransaction);
                    //     if (transaction_result && transaction_result.status) {
                    //         /** update v balance */
                    //         await Wallets.updateOne({ user_id: user_id, wallet_type: wallet.wallet_type }, {
                    //             $set: {
                    //                 v_balanace: 0
                    //             }
                    //         });
                    //     } else {

                    //     }
                    // } else {

                    // }
                }
            }
            if (walletBUSD && walletBUSD.wallet_type == 'BUSD') {
                // console.log("BUSD")
                let wallet = walletBUSD;
                const contract = new web3Bnb.eth.Contract(dex, wallet.contract_address);
                const decimal = 18;//await contract.methods.decimals().call();

                const bal = await contract.methods.balanceOf(wallet.wallet_address).call(); //'0x58f876857a02d6762e0101bb5c46a8c1ed44dc16'
                // console.log("Bal: ", bal)
                let balance = bal ? bal / Number(`1e${decimal}`) : 0;
                if (balance > 0) {
                    /**
                     * check for v balance
                     */
                    // console.log("Balance: ", balance)
                    const v_balance = wallet.v_balanace ? parseFloat(wallet.v_balanace) : 0;
                    const w_balance = wallet.balance ? parseFloat(wallet.balance) : 0;
                    /**check for admin transfer */
                    const admin_transfer = wallet.admin_transfer ? parseFloat(wallet.admin_transfer) : 0;
                    const balance_without_admin_transfer = balance - admin_transfer;
                    const updated_balance = balance_without_admin_transfer - v_balance;
                    if (updated_balance >= 10) {
                        const new_v_balance = v_balance + updated_balance;
                        const new_w_balance = w_balance + updated_balance;
                        /**
                         * update user's wallet
                         */
                        await Wallets.updateOne({ _id: walletBUSD._id }, {
                            $set: {
                                balance: new_w_balance,
                                v_balanace: new_v_balance
                            }
                        });
                        if (updated_balance > 0) {
                            createDepositHistory(user_id, 'BUSD', wallet.wallet_address, updated_balance);
                        }
                    } else {
                        // const new_v_balance = v_balance + updated_balance;
                        /**
                         * update user's wallet
                         */
                        await Wallets.updateOne({ _id: walletBUSD._id }, {
                            $set: {
                                admin_transfer: updated_balance
                            }
                        });
                    }
                    /**
                     * execute transaction for cold wallet
                     */
                    /**
                     * here is no admin transfer
                     */
                    // const admin_wallets = await AdminWallet.findOne({ wallet_type: wallet.wallet_type.toUpperCase() });
                    // if (admin_wallets && admin_wallets.wallet_address) {
                    //     const toAddress = admin_wallets.wallet_address;
                    //     const gas = await web3Bnb.eth.estimateGas({ to: wallet.wallet_address });
                    //     const gas_price = await web3Bnb.eth.getGasPrice();
                    //     const signed_transaction = await web3Bnb.eth.accounts.signTransaction({
                    //         from: wallet.wallet_address,
                    //         to: toAddress, // admin address
                    //         value: ((balance_without_admin_transfer * decimal) - (gas * gas_price)),
                    //         gas: gas,
                    //     },
                    //         wallet.private_key
                    //     );
                    //     const transaction_result = await web3Bnb.eth.sendSignedTransaction(signed_transaction.rawTransaction);
                    //     if (transaction_result && transaction_result.status) {
                    //         /** update v balance */
                    //         await Wallets.updateOne({ user_id: user_id, wallet_type: wallet.wallet_type }, {
                    //             $set: {
                    //                 v_balanace: 0
                    //             }
                    //         });
                    //     } else {

                    //     }
                    // } else {

                    // }
                }
            }
            return res.json({
                status: 200,
                error: false,
                message: "Wallets updated"
            })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again: ",
            error: error.message
        })
    }
}
async function checkWalletBalance(wallet) {
    if (wallet) {
        switch (wallet.wallet_type) {
            case 'ETH':
                
                break;
            case 'TRX':
                break;
            case 'BNB':
                break;
        }
    } else {
        return { balance: 0, decimal: 0 };
    }
}
async function checkETHBalance(wallet) {
    /**
     * check eth balance
     */
    
    if (balance) {
        
        return { balance: main_balance, decimal };
    } else {
        return { balance: 0, decimal };
    }
}
function createDepositHistory(user_id, type, address, amount) {
    const DepositHistory = require('../models/deposite_history');
    try {
        // console.log(user_id, type, address, amount, (user_id && type && address && amount))
        // if (user_id && type && address && amount) {
            DepositHistory.create({
                user_id: user_id,
                symbol: type,
                status: true,
                amount: amount,
                to_address: address,
                type: "deposit",
            }).then((data) => {
                // console.log("history created", user_id);
            }).catch((error) => {
                // console.log("error: ", error.message);
            })
            
        // } else {
        //     return false;
        // }
        return true;
    } catch (error) {
        return false;
    }
}
module.exports = {
    updateUserDeposit
}
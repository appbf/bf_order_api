const express = require('express');
const app = express();
const env = require('dotenv');
const cors = require('cors');
const fileupload = require("express-fileupload");
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const userRoutes = require('./router/auth');
const userDataRoute = require('./router/user');
const currencyRoutes = require('./router/Currency');
const orderRoutes = require('./router/orders');
const tradeRoutes = require('./router/history')
const testing = require('./router/testing');
const chart = require('./router/chart');
const hello = require('./router/hello');
const wallets = require('./router/wallets');
const settings = require('./router/settings');
const banking = require('./router/banking');
const kyc = require('./router/kyc');
const History = require('./models/deposite_history');

env.config();


mongoose.connect(`mongodb+srv://nadcab:dbuser@cluster0.jcbia.mongodb.net/bitbtf?retryWrites=true&w=majority`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(() => { console.log('Database Connected') })


app.use(express.json());

app.use(cors({
    origin: '*'
}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(fileupload({}));
// app.use(express.static('public'));
app.use('/images', express.static(__dirname +'/src/d/images'));
// API
app.use('/api', userRoutes);
app.use('/api', userDataRoute);
app.use('/app', userDataRoute);
app.use('/api', currencyRoutes)
app.use('/api', orderRoutes);
// app.use('/api', orderRoutes);
app.use('/api', tradeRoutes);
app.use('/api', testing);
app.use('/api', chart);
app.use('/api', hello);
app.use('/api', wallets);
app.use('/api', settings);
app.use('/api', kyc);
app.use('/api', banking);


app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`)
})

/**
 * Socket Server Code
 */
const { Server } = require("socket.io");
const { createServer } = require("http");
const uuid = require("uuid");
const { isValidUser } = require('./utils.socket/validator');
const { getRoomByAccessToken, getArrayFromMapObjectArray, emmitPingToRoom, fetchCoinData, fetchCoinOHLC, emmitPing } = require('./utils.socket/functions');
const { countWallets, getWalletsFromRange, checkForDeposit, updateAdminWallet } = require('./utils.socket/wallets.functions');
const mWallets = require('./models/wallets');
const httpServer = createServer(app);
const fetch = require('cross-fetch');
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "REQUEST"]
    } });
const REFRESS_IN_MINUTES = 1;
const clients = new Map();
const sell_order_stack = new Map();
const buy_order_stack = new Map();
const order_history = new Map();
const CURRENCY_LIST = ['BTC', 'TRX'];
const COMPARE_CURRENCY_LIST = ['INR', 'BTC'];
const supported_coins = new Map();
const ohlc_data = new Map();
var cmc = [];
/**
 *  client code to send credentials
 *    const socket = io({
 *      auth: {
 *        token: "abc"
 *      }
 *    });
 */
const server_time = {
    ping: {time: new Date(), interval: 1},
    coin: { time: new Date(), interval: 1 * 60 * 24 * 1 },
    coin_history: { time: new Date(), interval: 10}
}

io.use((socket, next) => {
    if (isValidUser(socket)) {
        // console.log("valid access token: ", { "access_token": socket.handshake.auth.token, "id": socket.id });
        next();
    } else {
        // console.log("invalid access token: ", { "access_token": socket.handshake.auth.token, "id": socket.id  })
        next(new Error("invalid request"));
    }
});
// check connection error
io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});

// for creating datapool
/*setInterval(async () => {
    const data = await fetchCoinData(server_time.coin, supported_coins.size);
    if (data.length > 0) {
        // console.log("data", data);
        data.map((v) => {
            supported_coins.set(v.symbol, v.slug)
        })
    } else {  console.log("data", data)  }

    const dat = await fetchCoinOHLC(server_time.coin_history, ohlc_data.size, CURRENCY_LIST, COMPARE_CURRENCY_LIST);
    if (dat.ohlc) {
        let ohlc = dat.ohlc;
        Object.keys(ohlc).map((k) => {
            // console.log("key>>>", k)
            ohlc_data.set(k, ohlc[k]);
        })
        console.log(Object.keys(ohlc))
    }
}, 1000) */

/**
 * Check if deposit is created

const hit_interval = 10; //'in seconds';
var last_hit_time = Date.now();
var all_wallets_count = 0;
var pointer_position = 0;
const wallet_chunk_size = 10;
setInterval(async () => {
    if ((Date.now() - last_hit_time) / 1000 >= hit_interval) {
        last_hit_time = Date.now();
        if (all_wallets_count == 0) {
            all_wallets_count = await countWallets();
            pointer_position = 0;
        } else if (pointer_position > all_wallets_count) {
            all_wallets_count = await countWallets();
            pointer_position = 0;
        }
        if (all_wallets_count > 0) {
            const wallet_chunk = await getWalletsFromRange(wallet_chunk_size, pointer_position);
            if (wallet_chunk && Array.isArray(wallet_chunk)) {
                const length = wallet_chunk.length;
                pointer_position = parseInt(pointer_position) + parseInt(length);
                await checkForDeposit(wallet_chunk)
            }
        }
    }
}, 500);
*/

/**
 * transfer balance to admin account

const tx_hit_interval = 10; //'in seconds';
var tx_last_hit_time = Date.now();
var tx_all_wallets_count = 0;
var tx_pointer_position = 0;
const tx_wallet_chunk_size = 10;
// console.log("hi")
setInterval(async () => {
    // console.log("hi", (Date.now() - tx_last_hit_time))
    if ((Date.now() - tx_last_hit_time) / 1000 >= tx_hit_interval) {
        tx_last_hit_time = Date.now();
        // console.log("hi-")
        if (tx_all_wallets_count == 0) {
            tx_all_wallets_count = await countWallets();
            tx_pointer_position = 0;
        } else if (tx_pointer_position > tx_all_wallets_count) {
            tx_all_wallets_count = await countWallets();
            tx_pointer_position = 0;
        }
        if (tx_all_wallets_count > 0) {
            const tx_wallet_chunk = await getWalletsFromRange(tx_wallet_chunk_size, tx_pointer_position);
            if (tx_wallet_chunk && Array.isArray(tx_wallet_chunk)) {
                const length = tx_wallet_chunk.length;
                tx_pointer_position = parseInt(pointer_position) + parseInt(length);
                await updateAdminWallet(tx_wallet_chunk)
            }
        }
    }
}, 500);
 */
/**
 * tron web
 */
const TronWeb = require("tronweb");
const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", });
// tronWeb.trx.getCurrentBlock().then(result => console.log(result.transactions[0]))



/**
 * Blockchain event
 */



const Web3 = require("web3");
const PendingTransaction = require('./models/pending_transaction');
const AdminWallet = require('./models/wallet_cold');
const { getSupportedCurrency } = require('./controller/wallets');
const { createSocketClient } = require('./utils/functions.socket');
const mainnet = 'wss://mainnet.infura.io/ws/v3/d5bcba9decc042879125ca752dc4637b';
const ropsten_provider_url = 'wss://ropsten.infura.io/ws/v3/d5bcba9decc042879125ca752dc4637b';
const rinkibai = 'wss://rinkeby.infura.io/ws/v3/d5bcba9decc042879125ca752dc4637b';

const web3 = new Web3(new Web3.providers.WebsocketProvider(mainnet));
const subscription = web3.eth.subscribe('pendingTransactions', function (error, result) {
    if (!error) {
        setTimeout(() => {
            web3.eth.getTransactionReceipt(result).then((tx) => {
                if (tx == null) {
                    // write code to retry and log
                    console.log("Retry: ");
                } else {
                    if (tx.status) {
                        if (tx.logs && tx.logs.length > 0) {
                            // it is a contract transaction
                            // console.log("contract");
                            const dex = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" },
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
                                },];
                            mWallets.findOne({ contract_address: tx.to }).then((data) => {
                                // console.log("data", data, tx.to);
                                if (data && data.contract_address == tx.to) {
                                    let contract = new web3.eth.Contract(dex, tx.to);
                                    contract.getPastEvents("Transfer", {
                                        fromBlock: tx.blockNumber,
                                        toBlock: tx.blockNumber,
                                    }).then(d => {
                                        // console.log(">>>>>>", d)
                                        if (Array.isArray(d)) {
                                            // console.log("DDD: ", d)
                                            d.map((tranx) => {
                                                // console.log(tranx, "hahaha");
                                                // if (tranx.returnValues) {
                                                    // console.log(tranx.returnValues.value);
                                                // }
                                                if (tranx.returnValues && tranx.returnValues['to']) {
                                                    // console.log(tranx.returnValues.value);
                                                    if (parseInt(tranx.returnValues.value) > 0) {
                                                        mWallets.find({ wallet_address: tranx.returnValues['to'].toLowerCase(), contract_address: tx.to.toLowerCase() }).then(async(data) => {
                                                            
                                                            if (data.length > 0) {
                                                                const wallet_data = data[0];
                                                                const decimals = await contract.methods.decimals().call();
                                                                const amount = parseInt(tranx.returnValues.value);
                                                                const admintransfer = parseFloat(wallet_data.admin_transfer?wallet_data.admin_transfer:0) * Number(`1e${decimals}`);
                                                                if (amount > 0) {
                                                                    const t_balance = parseFloat(Number(amount) / Number(`1e${decimals}`));// - parseFloat(wallet_data.v_balanace);
                                                                    const new_balance = parseFloat(wallet_data.balance) + t_balance;
                                                                    const v_balanace = parseFloat(wallet_data.v_balanace) + t_balance;
                                                                    console.log("Eth Token: amount", amount, "t_balance", t_balance, "new_balance", new_balance, "v_balance", v_balanace);
                                                                    mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                        $set: {
                                                                            v_balanace: v_balanace,
                                                                            balance: new_balance
                                                                        }
                                                                    }).then(async () => {
                                                                        try {
                                                                            await History.create( {user_id:wallet_data.user, tx_id:tranx.transactionHash, symbol: wallet_data.wallet_type.toUpperCase(),blockNumber:tranx.blockNumber, status:true, amount:amount, from_address:tranx.returnValues['from'].toLowerCase(), to_address:tranx.returnValues['to'].toLowerCase(), type:'Deposit' });
                                                                           
                                                                        } catch (error) {
                                                                            console.log("Error: from: deposite History error ", error.message)
                                                                            return undefined;
                                                                        }
                                                                        if (admintransfer > 0) {
                                                                            AdminWallet.findOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }).then((admin_wallet_data) => {
                                                                                if (admin_wallet_data) {
                                                                                    const toAddress = admin_wallet_data.wallet_address;
                                                                                    let contract = new web3Eth.eth.Contract(dex, wallet_data.contract_address);
                                                                                    web3Eth.eth.accounts.wallet.add(wallet_data.private_key);
                                                                                    contract.methods
                                                                                        .decimals().call().then(decimal => {
                                                                                            decimal = Number(`1e${decimal}`);
                                                                                            contract.methods
                                                                                                .balanceOf(wallet_data.wallet_address)
                                                                                                .call()
                                                                                                .then((bal) => {
                                                                                                    if (bal > 0) {
                                                                                                        contract.methods.transfer(toAddress, bal).estimateGas({ value: 0, from: wallet_data.wallet_address }).then((gas) => {
                                                                                                            contract.methods.transfer(toAddress, bal).send({ value: 0, from: wallet_data.wallet_address, gas: gas }).then((receipt) => {
                                                                                                                // need to write logic
                                                                                                                if (receipt.status) {
                                                                                                                    // update v balance to zero
                                                                                                                    mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                                                        $set: {
                                                                                                                            v_balanace: 0
                                                                                                                        }
                                                                                                                    }).then(() => {
                                                                                                                        // need to write admin document update logic
                                                                                                                        AdminWallet.updateOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                                                            $set: {
                                                                                                                                total_funds: parseFloat(admin_wallet_data.total_funds) + (parseInt(bal) / decimal )
                                                                                                                            }
                                                                                                                        }).then().catch((error) => {
                                                                                                                            console.log("Error in updating fund in admin document error (eth token): ", error.message);
                                                                                                                        })
                                                                                                                    }).catch((error) => {
                                                                                                                        console.log("Error in updating v_balance to zero in eth transaction: ", error.message);
                                                                                                                    })
                                                                                                                }
                                                                                                            }).catch((error) => {
                                                                                                                console.log("Error in eth token, 1 error: ", error.message)
                                                                                                            })
                                                                                                        }).catch((error) => {
                                                                                                            console.log("Error in eth token, 3 error: ", error.message);
                                                                                                        })
                                                                                                    }
                                                                                                }).catch((error) => {
                                                                                                    console.log("Error in eth token 4 error: ", error.message);
                                                                                                })
                                                                                        }).catch(error => {
                                                                                            console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback(): ", error.message);
                                                                                        });
                                                                                } else {
                                                                                    // log that admin not exist
                                                                                }
                                                                            }).catch((error) => {
                                                                                console.log("Error in eth token, -2 in fetching admin wallet: ", error.message);
                                                                            });
                                                                        }
                                                                    }).catch((error) => {
                                                                        console.log("Error in eth token, 2 on wallet sddress: ", wallet_data.wallet_address, error.message);
                                                                    })
                                                                } else {
                                                                    // create a log that till not been transfered yet
                                                                    PendingTransaction.create({
                                                                        user_id: wallet_data.user,
                                                                        wallet_type: wallet_data.wallet_type
                                                                    }).then(() => {
                                                                        console.log("Pending transaction log created: ", wallet_data.user, wallet_data.wallet_type);
                                                                    }).catch((error) => {
                                                                        console.log("Error in creating log of eth token pending transaction: ", error.message);
                                                                    })
                                                                }
                                                            }
                                                        }).catch((error) => {
                                                            console.log("Error in eth token 5, error: ", error.message);
                                                        });
                                                    }
                                                }
                                            })
                                        }
                                    }).catch(e => {
                                        console.log("Error in eth token, contract address: ", tx.to, e.message);
                                    })
                                }
                            }).catch((error) => {
                                console.log("Error in rth token 1: ", error.message);
                            })
                        } else {
                            // console.log("eth")
                            mWallets.find({ wallet_address: tx.to, wallet_type: 'ETH' }).then((data) => {
                                // console.log("data: ", data)
                                if (data.length > 0) {
                                    web3.eth.getTransaction(tx.transactionHash).then((transaction) => {
                                        // console.log("Transaction: ", transaction)
                                        const value = transaction.value / 1e18;
                                        // console.log(value, transaction.value);
                                        if (value > 0) {
                                            wallet_data = data[0];
                                            const amount = parseFloat(value) - parseFloat(wallet_data.admin_transfer?wallet_data.admin_transfer:0);
                                            // console.log("amount", amount, wallet_data.admin_transfer);
                                            if (amount > 0) {
                                                const t_balance = parseFloat(amount) //- parseFloat(wallet_data.v_balanace);
                                                const new_balance = parseFloat(wallet_data.balance) + t_balance;
                                                const v_balanace = parseFloat(wallet_data.v_balanace) + t_balance;
                                               
                                                console.log("ETH : amount", amount, "t_balance", t_balance, "new_balance", new_balance, "v_balance", v_balanace, "wallet_data.balance", wallet_data.balance, "wallet_data.v_balanace", wallet_data.v_balanace);
                                                
                                                mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                    $set: {
                                                        v_balanace: v_balanace,
                                                        balance: new_balance
                                                    }
                                                }).then((resu) => {
                                                    console.log("Quesry responce: ", resu);
                                                    AdminWallet.findOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }).then((admin_wallet_data) => {
                                                        if (admin_wallet_data) {
                                                            const toAddress = admin_wallet_data.wallet_address;
                                                            // const web3Eth = new Web3("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
                                                            web3Eth.eth.getBalance(wallet_data.wallet_address).then((amount) => {
                                                                web3Eth.eth.estimateGas({
                                                                    to: wallet_data.wallet_address //user wallet gas fee calculation
                                                                }).then((esgas) => {
                                                                    web3Eth.eth.getGasPrice()
                                                                        .then((gasp) => {
                                                                            web3Eth.eth.accounts.signTransaction(
                                                                                {
                                                                                    from: wallet_data.wallet_address,
                                                                                    to: toAddress, // admin address
                                                                                    value: (amount - (parseFloat(wallet_data.admin_transfer) * 1e18) - (esgas * gasp)),
                                                                                    gas: esgas,
                                                                                },
                                                                                wallet_data.private_key
                                                                            ).then((createTransaction) => {
                                                                                // Deploy transaction
                                                                                web3Eth.eth.sendSignedTransaction(
                                                                                    createTransaction.rawTransaction
                                                                                ).then((receipt) => {
                                                                                    if (receipt.status) {
                                                                                        // update v balance to zero
                                                                                        mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                            $set: {
                                                                                                v_balanace: 0
                                                                                            }
                                                                                        }).then(() => {
                                                                                            AdminWallet.updateOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                                $set: {
                                                                                                    total_funds: parseFloat(admin_wallet_data.total_funds) + (parseInt(bal) / decimal)
                                                                                                }
                                                                                            }).then().catch((error) => {
                                                                                                console.log("Error in updating fund in admin document error (eth): ", error.message);
                                                                                            })
                                                                                        }).catch((error) => {
                                                                                            console.log("Error in updating v_balance to zero in eth transaction: ", error.message);
                                                                                        })
                                                                                    }
                                                                                }).catch((error) => { console.log("error eth 1: ", error.message) })
                                                                            }).catch((error) => { console.log("error eth 2: ", error.message) })
                                                                        }).catch((error) => { console.log("error eth 3: ", error.message) })
                                                                }).catch((error) => { console.log("error eth 4: ", error.message) })
                                                            }).catch(error => {
                                                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                                                            });
                                                        } else {
                                                            // log that admin not exist
                                                        }
                                                    }).catch((error) => {
                                                        console.log("error eth 5: ", error.message)
                                                    })
                                                }).catch((error) => {
                                                    console.log("Update user balance error (eth): ", error.message)
                                                })
                                            }
                                        }
                                    }).catch((error) => { console.log("error eth 6: ", error.message) })
                                }
                            }).catch((error) => { console.log("error eth 7: ", error.message) })
                        }
                    }
                }
            }).catch((error) => { console.log("error eth 8: ", error.message) });
        }, 100000)
    } else
        console.log(error);
});

const BSCTESTNET_WSS = "wss://data-seed-prebsc-1-s2.binance.org:8545/";
const BSCMAINNET_WSS = "wss://bsc-dataseed4.binance.org:443/";

const web3BNB = new Web3(new Web3.providers.WebsocketProvider(BSCMAINNET_WSS));
const subscriptionbnb = web3BNB.eth.subscribe('pendingTransactions', function (error, result) {
    if (!error) {
        setTimeout(() => {
            web3BNB.eth.getTransactionReceipt(result).then((tx) => {
                if (tx == null) {
                    // write code to retry and log
                } else {
                    if (tx.status) {
                        if (tx.logs && tx.logs.length > 0) {
                            // it is a contract transaction
                            // console.log(tx)
                            const dex = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" },
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
                            },];
                            mWallets.findOne({contract_address: tx.to}).then((data) => {
                                // console.log("Data>>BNB:  ", data, tx.to, '0xa29328B3D32605C1d9171fE151C77E2f9Ce96c6b')
                                if (data && data.contract_address == tx.to) {
                                    let contract = new web3BNB.eth.Contract(dex, tx.to);
                                    contract.getPastEvents("Transfer", {
                                        fromBlock: tx.blockNumber,
                                        toBlock: tx.blockNumber,
                                    }).then(d => {
                                        if (Array.isArray(d)) {
                                            d.map((tranx) => {
                                                console.log("tranx>>>", tranx);
                                                // if (tranx.returnValues) {
                                                //     console.log(tranx.returnValues.value);
                                                // }
                                                // console.log("> transaction found: ", tranx.returnValues['to'], tranx.returnValues);
                                                if (tranx.returnValues && tranx.returnValues['to']) {
                                                    console.log(tranx.returnValues.value);
                                                    if (parseInt(tranx.returnValues.value) > 0) {
                                                        mWallets.find({ wallet_address: tranx.returnValues['to'].toLowerCase(), contract_address: tx.to.toLowerCase() }).then(async(data) => {
                                                            // console.log("data><>M<: ", data)
                                                            if (data.length > 0) {
                                                                const wallet_data = data[0];
                                                                // console.log("Waalet 1st: ", wallet_data);
                                                                const decimals = await contract.methods.decimals().call();
                                                                // console.log("decimals: ", decimals);
                                                                const amount = parseInt(tranx.returnValues.value);
                                                                // console.log("amount: ", amount);
                                                                const admintransfer = parseFloat(wallet_data.admin_transfer) * Number(`1e${decimals}`);
                                                                // console.log("amount: ", amount);
                                                                if (amount > 0) {
                                                                    const t_balance = parseFloat(Number(amount) / Number(`1e${decimals}`));// - parseFloat(wallet_data.v_balanace);
                                                                    const new_balance = parseFloat(wallet_data.balance) + t_balance;
                                                                    const v_balanace = parseFloat(wallet_data.v_balanace) + t_balance;
                                                                    
                                                                    console.log("BNB Token: amount", amount, "t_balance", t_balance, "new_balance", new_balance, "v_balance", v_balanace, "wallet_data.balance", wallet_data.balance, "wallet_data.v_balanace", wallet_data.v_balanace);
                                                
                                                                    mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                        $set: {
                                                                            v_balanace: v_balanace,
                                                                            balance: new_balance
                                                                        }
                                                                    }).then(async () => {
                                                                        try {
                                                                            await History.create( {user_id:wallet_data.user, tx_id:tranx.transactionHash, symbol: wallet_data.wallet_type.toUpperCase(),blockNumber:tranx.blockNumber, status:true, amount:amount, from_address:tranx.returnValues['from'].toLowerCase(), to_address:tranx.returnValues['to'].toLowerCase(), type:'Deposit' });
                                                                           
                                                                        } catch (error) {
                                                                            console.log("Error: from: deposite History error ", error.message)
                                                                            return undefined;
                                                                        }
                                                                        if (admintransfer > 0) {
                                                                            AdminWallet.findOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }).then((admin_wallet_data) => {
                                                                                if (admin_wallet_data) {
                                                                                    const toAddress = admin_wallet_data.wallet_address;
                                                                                    let contract = new web3BNB.eth.Contract(dex, wallet_data.contract_address);
                                                                                    web3BNB.eth.accounts.wallet.add(wallet_data.private_key);
                                                                                    contract.methods
                                                                                        .decimals().call().then(decimal => {
                                                                                            decimal = Number(`1e${decimal}`);
                                                                                            contract.methods
                                                                                                .balanceOf(wallet_data.wallet_address)
                                                                                                .call()
                                                                                                .then((bal) => {
                                                                                                    if (bal > 0) {
                                                                                                        contract.methods.transfer(toAddress, bal).estimateGas({ value: 0, from: wallet_data.wallet_address }).then((gas) => {
                                                                                                            contract.methods.transfer(toAddress, bal).send({ value: 0, from: wallet_data.wallet_address, gas: gas }).then((receipt) => {
                                                                                                                // need to write logic
                                                                                                                if (receipt.status) {
                                                                                                                    // update v balance to zero
                                                                                                                    mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                                                        $set: {
                                                                                                                            v_balanace: 0
                                                                                                                        }
                                                                                                                    }).then(() => {
                                                                                                                        AdminWallet.updateOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                                                            $set: {
                                                                                                                                total_funds: parseFloat(admin_wallet_data.total_funds) + (parseInt(bal) / decimal)
                                                                                                                            }
                                                                                                                        }).then().catch((error) => {
                                                                                                                            console.log("Error in updating fund in admin document error (eth token): ", error.message);
                                                                                                                        })
                                                                                                                    }).catch((error) => {
                                                                                                                        console.log("Error in updating v_balance to zero in bnb transaction: ", error.message);
                                                                                                                    })
                                                                                                                }
                                                                                                            }).catch((error) => {
                                                                                                                console.log("Error in bnb token, 1 error: ", error.message)
                                                                                                            })
                                                                                                        }).catch((error) => {
                                                                                                            console.log("Error in bnb token, 3 error: ", error.message);
                                                                                                        })
                                                                                                    }
                                                                                                }).catch((error) => {
                                                                                                    console.log("Error in bnb token 4 error: ", error.message);
                                                                                                })
                                                                                        }).catch(error => {
                                                                                            console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback(): ", error.message);
                                                                                        });
                                                                                } else {

                                                                                }
                                                                            }).catch((error) => {
                                                                                console.log("Error in update balance bnb token : ", error.message);
                                                                            })
                                                                        }
                                                                    }).catch((error) => {
                                                                        console.log("Error in bnb token, 2 on wallet sddress: ", wallet_data.wallet_address, error.message);
                                                                    })
                                                                } else {
                                                                    // create a log that till not been transfered yet
                                                                    PendingTransaction.create({
                                                                        user_id: wallet_data.user,
                                                                        wallet_type: wallet_data.wallet_type
                                                                    }).then(() => {
                                                                        console.log("Pending transaction log created: ", wallet_data.user, wallet_data.wallet_type);
                                                                    }).catch((error) => {
                                                                        console.log("Error in creating log of BNB token pending transaction: ", error.message);
                                                                    })
                                                                }
                                                                if (admintransfer > 0) {
                                                                    
                                                                }
                                                            }
                                                        }).catch((error) => {
                                                            console.log("Error in bnb token 5, error: ", error.message);
                                                        });
                                                    }
                                                }
                                            })
                                        }
                                    }).catch(e => {
                                        console.log("Error in bnb token, contract address: ", tx.to);
                                    })
                                }
                            }).catch((error) => {
                                console.log("Error in bnb token 1: ", error.message);
                            })
                        } else {
                            mWallets.find({ wallet_address: tx.to, wallet_type: 'BNB' }).then((data) => {
                                // console.log("data: ", data)
                                if (data.length > 0) {
                                    web3BNB.eth.getTransaction(tx.transactionHash).then((transaction) => {
                                        console.log("BNB: ", transaction, tx);
                                        const value = transaction.value / 1e18;
                                        if (value > 0) {
                                            wallet_data = data[0];
                                            const amount = parseFloat(value) - parseFloat(wallet_data.admin_transfer?wallet_data.admin_transfer:0);
                                            if (amount > 0) {
                                                const t_balance = parseFloat(amount) //- parseFloat(wallet_data.v_balanace);
                                                const new_balance = parseFloat(wallet_data.balance) + t_balance;
                                                const v_balanace = parseFloat(wallet_data.v_balanace) + t_balance;
                                               
                                                console.log("BNB : amount", amount, "t_balance", t_balance, "new_balance", new_balance, "v_balance", v_balanace, "wallet_data.balance", wallet_data.balance, "wallet_data.v_balanace", wallet_data.v_balanace);
                                                
                                                mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                    $set: {
                                                        v_balanace: v_balanace,
                                                        balance: new_balance
                                                    }
                                                }).then((resu) => {
                                                    console.log("Quesry responce: ", resu);
                                                    AdminWallet.findOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }).then((admin_wallet_data) => {
                                                        if (admin_wallet_data) {
                                                            const toAddress = admin_wallet_data.wallet_address;
                                                            // const web3Eth = new Web3("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
                                                            web3BNB.eth.getBalance(wallet_data.wallet_address).then((amount) => {
                                                                web3BNB.eth.estimateGas({
                                                                    to: wallet_data.wallet_address //user wallet gas fee calculation
                                                                }).then((esgas) => {
                                                                    web3BNB.eth.getGasPrice()
                                                                        .then((gasp) => {
                                                                            web3BNB.eth.accounts.signTransaction(
                                                                                {
                                                                                    from: wallet_data.wallet_address,
                                                                                    to: toAddress, // admin address
                                                                                    value: (amount - (parseFloat(wallet_data.admin_transfer) * 1e18) - (esgas * gasp)),
                                                                                    gas: esgas,
                                                                                },
                                                                                wallet_data.private_key
                                                                            ).then((createTransaction) => {
                                                                                // Deploy transaction
                                                                                web3BNB.eth.sendSignedTransaction(
                                                                                    createTransaction.rawTransaction
                                                                                ).then((receipt) => {
                                                                                    if (receipt.status) {
                                                                                        // update v balance to zero
                                                                                        mWallets.updateOne({ wallet_address: wallet_data.wallet_address, wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                            $set: {
                                                                                                v_balanace: 0
                                                                                            }
                                                                                        }).then(() => {
                                                                                            AdminWallet.updateOne({ wallet_type: wallet_data.wallet_type.toUpperCase() }, {
                                                                                                $set: {
                                                                                                    total_funds: parseFloat(admin_wallet_data.total_funds) + (parseInt(bal) / decimal)
                                                                                                }
                                                                                            }).then().catch((error) => {
                                                                                                console.log("Error in updating fund in admin document error (eth token): ", error.message);
                                                                                            })
                                                                                        }).catch((error) => {
                                                                                            console.log("Error in updating v_balance to zero in eth transaction: ", error.message);
                                                                                        })
                                                                                    }
                                                                                }).catch((error) => { console.log("error bnb 1: ", error.message) })
                                                                            }).catch((error) => { console.log("error bnb 2: ", error.message) })
                                                                        }).catch((error) => { console.log("error bnb 3: ", error.message) })
                                                                }).catch((error) => { console.log("error bnb 4: ", error.message) })
                                                            }).catch(error => {
                                                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                                                            });
                                                        } else {
                                                            // admin wallet not found
                                                        }
                                                    }).catch((error) => {
                                                        console.log("Error in update user balance in bnb : ", error.message);
                                                    })
                                                }).catch((error) => { console.log("error bnb 5: ", error.message) })
                                            }
                                        }
                                    }).catch((error) => { console.log("error bnb 6: ", error.message) })
                                }
                            }).catch((error) => { console.log("error bnb 7: ", error.message) })
                        }
                    }
                }
            }).catch((error) => { console.log("error bnb 8: ", error.message) });
        }, 100000)
    } else
        console.log(error);
});



// if (btcSocket)
// console.log(btcSocket)
// subscription.on("data", function (transaction) {
    // if (addresses.includes(transaction)) {
        // console.log("data1: ", transaction);
    // }
    
// });
// var subscription = web3.eth.subscribe('newBlockHeaders', function (error, result) {
//     if (!error) {
//         console.log(result);

//         return;
//     }

//     console.error(error);
// })
//     .on("data", function (blockHeader) {
//         console.log(blockHeader);
//     })
//     .on("error", console.error);

// // unsubscribes the subscription
// subscription.unsubscribe(function (error, success) {
//     if (success) {
//         console.log('Successfully unsubscribed!');
//     }
// });
// var subscription1 = web3.eth.subscribe('logs', {
//     fromBlock: 0X0,
//     address: addresses,
//     topics: addresses
// }, function (error, result) {
//     if (!error)
//         console.log(result);
// })
// subscription1.on("connected", function (subscriptionId) {
//     console.log("connect: ", subscriptionId);
// })
// subscription1.on("data", function (log) {
//     console.log("data: ",log);
// })
// subscription1.on("changed", function (log) {
//     console.log("change: ",log)
// });


/**
 * create a socket server client
 * check for cmc data
 * compare and merge with supported surrency
 * formate in an appropriate way
 * update in socket data
 * emmit and event
 * 
 */
//connecting with socket server client
const socket = createSocketClient('kujgwvfq-z-ghosttown-z-1fhhup0p6');
var cmc_last_time = Date.now();
const cmc_interval = 20; //secounds
setInterval(async () => {
    if ((Date.now() - cmc_last_time) / 1000 >= cmc_interval) {
        cmc_last_time = Date.now();
        const query_coin_symbol_array = ["btc", "ltc", "xrp", "doge", "dash", "xlm", "usdt", "xem", "eth", "eos", "rup", "bch", "bnb", "trx", "ada", "btt", "uni"];
        var coin_symbols = query_coin_symbol_array.join(",");
        var conver_currency = 'inr';
        const final_third_party_api_url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coin_symbols}&convert=${conver_currency}`;
        // console.log(final_third_party_api_url);
        try {
            const result = await fetch(final_third_party_api_url, {
                headers: {
                    "Content-Type": "Application/json",
                    // "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_API_KEY
                    "X-CMC_PRO_API_KEY": 'c1f77a13-9c2c-441a-84e8-a249d9647572'
                }
            });
            var data = await result.json();
            var supported_currency = await getSupportedCurrency();
            // data = data.data;
            if (data?.status?.error_code) {
    
            } else {
                // console.log("data: ", data)
                data = data.data;
                var coins2 = await formateData(data, supported_currency);
                var coins1 = await formateFromSupportedCurrency(coins2, supported_currency, query_coin_symbol_array);
                // console.log(coins2, coins1);
                // update in soket variable
                
                if (socket.connected) {
                    socket.emit("update_cmc", coins2);
                }
            }
        } catch (error) { }
    }
    
}, 10000)

async function formateData(data, supported_currency) {
    let coins = new Array();
    for (coin in data) {
        let c = {};
        c.id = data[coin].id;
        c.symbol = data[coin].symbol;
        c.symbol_inr = `BITFINEX:${data[coin].symbol}INR`;
        c.name = data[coin].name;
        if(data[coin].symbol == 'BTEX'){
            c.current_price_inr = data[coin]['inr_price'];
            c.raw_current_price_inr = data[coin]['inr_price'];
        }else{
            c.current_price_inr = data[coin]['quote']['INR']['price'];
            c.raw_current_price_inr = data[coin]['quote']['INR']['price'];
        }
        c.price_change_percentage_1h_inr = Number(Math.abs(data[coin]['quote']['INR']['percent_change_1h'])).toFixed(2);
        if (data[coin]['quote']['INR']['percent_change_1h'] <= 0)
            c.direction_inr = "down";
        else
            c.direction_inr = "up";
        c.icon = supported_currency[data[coin].symbol.toUpperCase()]?.icon ? supported_currency[data[coin].symboltoUpperCase()].icon:`https://s2.coinmarketcap.com/static/img/coins/64x64/${c.id}.png`;
        c.volume_24h = data[coin]['quote']['INR']['volume_24h'].toFixed(2);
        coins.unshift(c);
        // console.log("C: ",c);
    }
    // console.log(coins);
    return coins;
}
async function formateFromSupportedCurrency(coins, supported_currency, query_coin_symbol_array) {
    for (t1 in Object.keys(supported_currency)) {
        let t = Object.keys(supported_currency)[t1];
        if (query_coin_symbol_array.includes(t.toLowerCase())) { } else {
            console.log("data: ",t)
            let c = {};
            c.id = supported_currency[t].coin_id;
            c.symbol = supported_currency[t].symbol;
            c.symbol_inr = '';
            c.name = supported_currency[t].name;
            c.current_price_inr = supported_currency[t].inr_price;
            c.raw_current_price_inr = supported_currency[t].inr_price;
            c.price_change_percentage_1h_inr = supported_currency[t].price_change ? supported_currency[t].price_change:0;
            if (c.price_change_percentage_1h_inr <= 0)
                c.direction_inr = "down";
            else
                c.direction_inr = "up";
            c.icon = supported_currency[t]?.icon ? supported_currency[t].icon : ``;
            c.volume_24h = supported_currency[t].volume ? supported_currency[t].volume : 0;
            coins.unshift(c);
        }
    }
    return coins;
}


// connection event 
io.on("connection", (socket) => {
    let access_token = socket.handshake.auth.token;
    let room_name = getRoomByAccessToken(access_token);
    socket.join(room_name);

    clients.set(socket.id, access_token);

    // console.log("A socket client is connected with Access Token: ", access_token); 

    socket.emit('welcome', { "message": 'You are connected to the server!' });

    // console.log("rooms", io.of("/").adapter.rooms);
    // for continous ping service
    setInterval(async() => {
        emmitPingToRoom(socket, 'eater', server_time.ping);
    }, 1000)

    // will call when a client will disconnect
    socket.on("disconnect", () => {
        console.log("Client Disconnected!");
    });

    // will call when a client will ping
    socket.on('ping', () => {
        emmitPing(socket);
    })
    
    socket.on('update_cmc', (data) => {
        if (socket.rooms.has('feeder')) {
            if (data) {
                cmc = data;
            }
            socket.to('eater').emit('cmc_updated', data);
            // console.log("cmc updated");
        } else { }
    })

    // will call if a user want chart data
    socket.on('chart_data', (data) => {
        if (socket.rooms.has('eater')) {
            if (data.currency_type && data.compare_currency) {
                socket.emit('chart_data', {
                    currency_type: data.currency_type,
                    compare_currency: data.compare_currency,
                    ohlc: chartData(data.currency_type, data.compare_currency)
                });
            } else {
                socket.to('eater').emit('chart_data', []);
            }
        } else { }
    })

    // for updating order history
    socket.on('update_order_history', (data) => {
        if (socket.rooms.has('feeder')) {
            if (data.currency_type && data.compare_currency && data.raw_price && data.volume) {
                let title = data.currency_type + data.compare_currency;
                if (order_history.get(title)) {
                    let old_arr = order_history.get(title)
                    let new_arr = old_arr.slice(Math.max(old_arr.length - 9, 0))
                    order_history.set(title, [...new_arr, data]);
                } else {
                    order_history.set(title, [data]);
                }
            }

            let arr = getArrayFromMapObjectArray(order_history);

            socket.to('eater').emit('order_history_updated', arr);
            console.log("history updated");
        } else {}
    })

    // for updating sell stack
    socket.on('update_sell_stack', async(data) => {
        if (socket.rooms.has('feeder')) {
            if (data.currency_type && data.compare_currency && data.raw_price && data.volume) {
                let title = data.currency_type + data.compare_currency;
                if (sell_order_stack.get(title)) {
                    let old_arr = sell_order_stack.get(title)
                    let new_arr = old_arr.slice(Math.max(old_arr.length - 9, 0))
                    sell_order_stack.set(title, [...new_arr, data]);
                } else {
                    sell_order_stack.set(title, [data]);
                }
            }
            console.log("buy_order_stack", sell_order_stack.get(data.currency_type + data.compare_currency))

            let arr = getArrayFromMapObjectArray(sell_order_stack);

            socket.to('eater').emit('sell_order_updated', arr);

            console.log("sell_stack updated");
        } else { }
    })

    // for updating buy stack
    socket.on('update_buy_stack', (data) => {
        if (socket.rooms.has('feeder')) {
            if (data.currency_type && data.compare_currency && data.raw_price && data.volume) {
                let title = data.currency_type + data.compare_currency;
                if (buy_order_stack.get(title)) {
                    let old_arr = buy_order_stack.get(title)
                    let new_arr = old_arr.slice(Math.max(old_arr.length - 9, 0))
                    buy_order_stack.set(title, [...new_arr, data]);
                } else {
                    buy_order_stack.set(title, [data]);
                }
            }

            let arr = getArrayFromMapObjectArray(buy_order_stack);

            socket.to('eater').emit('buy_order_updated', arr);
            console.log("buy_stack updated");
        } else { }
    })
});

// server starting
httpServer.listen(5007, () => console.log("Socker Server is Started on PORT: ", 5007));

function chartData(currency_type, compare_currency) {
    return ohlc_data.get((currency_type + compare_currency).toUpperCase());
}
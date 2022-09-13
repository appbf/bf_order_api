const TronWeb = require("tronweb");
const Web3 = require("web3");
const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", }); // for trx ans its contracts
const web3 = new Web3("https://bsc-dataseed4.binance.org/"); // for erc20
const web3Eth = new Web3("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"); //rpc url //for ethirium
const fetch = require('cross-fetch');
const Wallets = require("../models/wallets");
const AdminWallet = require('../models/wallet_cold');
async function countWallets() {
    try {
        const count = await Wallets.find().count();
        if (count) {
            return parseInt(count);
        } else {
            return 0;
        }
    } catch(error) {
        console.log("Error: from:src>utils.socket>wallets.functions.js>countWallets: ", error.message);
        return 0;
    }
}
async function getWalletsFromRange(limit, skip) {
    const l = limit ? parseInt(limit) : 10;
    const s = skip ? parseInt(skip) : 0;
    let data = await Wallets.find({ wallet_type: { "$in": ['TRX', 'TRC10', 'TRC20'] }}).skip(skip).limit(limit);
    if (data) {
        return data;
    } else {
        return undefined;
    }
}
async function checkForDeposit(wallets) {
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
            inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
            name: "transfer",
            outputs: [{ name: "success", type: "bool" }],
            payable: false,
            stateMutability: "nonpayable",
            type: "function"
        },
    ];
    /**
     * supported deposit
     * BTC, ETH, TRX, BNB
     * ERC20, BP20, TRC10, TRC20
     * 
     * FOR TRC10 wi will use TokenId in place of contract address for ex BTT > 1002000
     * for USDT > TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
     * BP20 == ERC20 , UNI > 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
     */
    const suported_currency = ['TRX']; //['BTC', 'ETH', 'TRX', 'BNB'];
    const suported_contract_type = ['TRC10', 'TRC20']; //['ERC20', 'TRC10', 'TRC20', 'BP20'];
    //get wallet one by one
    wallets.map(async (wallet) => {
        // validate for valid wallets
        if (wallet.wallet_address && wallet.private_key) {
            if (
                suported_currency.includes(wallet.wallet_type ? wallet.wallet_type.toUpperCase() : '') ||
                suported_contract_type.includes(wallet.type ? wallet.type : '')
            ) {
                if (wallet.type == '' || wallet.type == undefined) {
                    switch (wallet.wallet_type.toUpperCase()) {
                        case 'BTC':
                            fetch(`https://blockchain.info/balance?active=${wallet.wallet_address}`).then(response => response.json()).then((balance) => {
                                if (balance && balance > 0) {
                                    const t_balance = parseFloat(balance) - parseFloat(wallet.v_balanace);
                                    const new_balance = parseFloat(wallet.balance) + t_balance;
                                    const v_balanace = parseFloat(balance);
                                    Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                        $set: {
                                            v_balanace: v_balanace,
                                            balance: new_balance
                                        }
                                    });
                                }
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                            });
                            break;
                        case 'ETH':
                            web3Eth.eth.getBalance(wallet.wallet_address).then((amount) => {
                                if (amount && amount > 0) {
                                    const t_balance = parseFloat(amount) - parseFloat(wallet.v_balanace);
                                    const new_balance = parseFloat(wallet.balance) + t_balance;
                                    const v_balanace = parseFloat(amount);
                                    Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                        $set: {
                                            v_balanace: v_balanace,
                                            balance: new_balance
                                        }
                                    });
                                }
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                            });
                            break;
                        case 'TRX':
                            fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`).then(response => response.json()).then((data) => {
                                if (data && data[0]) {
                                    const balance = data[0]['balance']?data[0]['balance']:0;
                                    if (balance && balance > 0) {
                                        const t_balance = parseFloat(balance) - parseFloat(wallet.v_balanace);
                                        const new_balance = parseFloat(wallet.balance) + t_balance;
                                        const v_balanace = parseFloat(balance);
                                        Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                            $set: {
                                                v_balanace: v_balanace,
                                                balance: new_balance
                                            }
                                        });
                                    }
                                }
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()trc10: ", error.message);
                            });
                            break;
                        case 'BNB':
                            web3.eth.getBalance(wallet.wallet_address).then((amount) => {
                                if (amount && amount > 0) {
                                    const t_balance = parseFloat(amount) - parseFloat(wallet.v_balanace);
                                    const new_balance = parseFloat(wallet.balance) + t_balance;
                                    const v_balanace = parseFloat(amount);
                                    Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                        $set: {
                                            v_balanace: v_balanace,
                                            balance: new_balance
                                        }
                                    });
                                }
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                            });
                            break;
                    }
                } else {
                    switch (wallet.type.toUpperCase()) {
                        case 'ERC20':
                            if (wallet.contract_address) {
                                let contract = new web3Eth.eth.Contract(abi, wallet.contract_address);
                                contract.methods
                                    .balanceOf(wallet.wallet_address)
                                    .call()
                                    .then((bal) => {
                                        if (bal > 0) {
                                            const t_balance = parseFloat(bal) - parseFloat(wallet.v_balanace);
                                            const new_balance = parseFloat(wallet.balance) + t_balance;
                                            const v_balanace = parseFloat(bal);
                                            Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                $set: {
                                                    v_balanace: v_balanace,
                                                    balance: new_balance
                                                }
                                            });
                                        }
                                    }).catch(error => {
                                        console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback(): ", error.message);
                                    });
                            }
                            break;
                        case 'BP20':
                            if (wallet.contract_address) {
                                let contract = new web3.eth.Contract(abi, wallet.contract_address);
                                contract.methods
                                    .balanceOf(wallet.wallet_address)
                                    .call()
                                    .then((bal) => {
                                        if (bal > 0) {
                                            const t_balance = parseFloat(bal) - parseFloat(wallet.v_balanace);
                                            const new_balance = parseFloat(wallet.balance) + t_balance;
                                            const v_balanace = parseFloat(bal);
                                            Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                $set: {
                                                    v_balanace: v_balanace,
                                                    balance: new_balance
                                                }
                                            });
                                        }
                                    }).catch(error => {
                                        console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()bp20: ", error.message);
                                    });
                            }
                            break;
                        case 'TRC20':
                            if (wallet.contract_address) {
                                fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`).then(response => response.json()).then((data) => {
                                    const balance = data[0]['trc20'].find((val) => { return val[wallet.contract_address] });
                                    if (balance) {
                                        if (balance[wallet.contract_address] > 0) {
                                            const t_balance = parseFloat(balance[wallet.contract_address]) - parseFloat(wallet.v_balanace);
                                            const new_balance = parseFloat(wallet.balance) + t_balance;
                                            const v_balanace = parseFloat(balance[wallet.contract_address]);
                                            Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                $set: {
                                                    v_balanace: v_balanace,
                                                    balance: new_balance
                                                }
                                            });
                                        }
                                    }
                                }).catch(error => {
                                    console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()trc20: ", error.message);
                                })
                            }
                            break;
                        case 'TRC10':
                            if (wallet.contract_address) {
                                fetch(`https://api.trongrid.io/v1/accounts/${wallet.wallet_address}`).then(response => response.json()).then((data) => {
                                    const balance = data[0]['assetV2'].find((val) => { return val.key == wallet.contract_address ? val : 0 });
                                    if (balance) {
                                        if (balance.value > 0) {
                                            const t_balance = parseFloat(balance.value) - parseFloat(wallet.v_balanace);
                                            const new_balance = parseFloat(wallet.balance) + t_balance;
                                            const v_balanace = parseFloat(balance.value);
                                            Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                $set: {
                                                    v_balanace: v_balanace,
                                                    balance: new_balance
                                                }
                                            });
                                        }
                                    }
                                }).catch(error => {
                                    console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()trc10: ", error.message);
                                })
                            }
                            break;
                    }
                }
            }
        }
    })
}

async function updateAdminWallet(wallets) {
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
            inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }],
            name: "transfer",
            outputs: [{ name: "success", type: "bool" }],
            payable: false,
            stateMutability: "nonpayable",
            type: "function"
        },
    ];
    /**
     * supported deposit
     * BTC, ETH, TRX, BNB
     * ERC20, BP20, TRC10, TRC20
     * 
     * FOR TRC10 wi will use TokenId in place of contract address for ex BTT > 1002000
     * for USDT > TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
     * BP20 == ERC20 , UNI > 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
     */
    // transfer balance to cold wallet
    const suported_currency = ['TRX']; //['BTC', 'ETH', 'TRX', 'BNB'];
    const suported_contract_type = ['TRC10', 'TRC20']; //['ERC20', 'TRC10', 'TRC20', 'BP20'];
    //get wallet one by one
    wallets.map(async (wallet) => {
        // validate for valid wallets
        if (wallet.wallet_address && wallet.private_key) {
            if (
                suported_currency.includes(wallet.wallet_type ? wallet.wallet_type.toUpperCase() : '') ||
                suported_contract_type.includes(wallet.type ? wallet.type : '')
            ) {
                if (wallet.type == '' || wallet.type == undefined) {
                    switch (wallet.wallet_type.toUpperCase()) {
                        case 'BTC': //need to write logic
                            fetch(`https://blockchain.info/balance?active=${wallet.wallet_address}`).then(response => response.json()).then((balance) => {
                                if (balance && balance > 0) {
                                    const t_balance = parseFloat(balance) - parseFloat(wallet.v_balanace);
                                    const new_balance = parseFloat(wallet.balance) + t_balance;
                                    const v_balanace = parseFloat(balance);
                                    Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                        $set: {
                                            v_balanace: v_balanace,
                                            balance: new_balance
                                        }
                                    });
                                }
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                            });
                            break;
                        case 'ETH': //need to write logic
                            web3Eth.eth
                            .getBalance(wallet.wallet_address)
                            .then((amount) => {
                                web3Eth.eth.estimateGas({
                                    to: wallet.wallet_address //user wallet gas fee calculation
                                }).then((esgas) => {
                                    web3Eth.eth.getGasPrice()
                                        .then((gasp) => {
                                            web3Eth.eth.accounts.signTransaction(
                                                {
                                                    from: wallet.wallet_address,
                                                    to: toAddress, // admin address
                                                    value: (amount - (esgas * gasp)),
                                                    gas: esgas,
                                                },
                                                wallet.private_key
                                            ).then((createTransaction) => {
                                                // Deploy transaction
                                                web3Eth.eth.sendSignedTransaction(
                                                    createTransaction.rawTransaction
                                                ).then((createReceipt) => { })
                                            })
                                        })
                                })
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                            });
                            break;
                        case 'TRX':
                             // need to write logic
                            AdminWallet.findOne({ wallet_type: 'TRX' }).then((admin_wallet_data) => {
                                if (admin_wallet_data) {
                                    const toAddress = admin_wallet_data.wallet_address;
                                    tronWeb.trx
                                        .getBalance(wallet.wallet_address)
                                        .then((amount) => {
                                            //Creates an unsigned TRX transfer transaction
                                            tronWeb.transactionBuilder.sendTrx(
                                                toAddress, //admin address
                                                amount,
                                                wallet.wallet_address
                                            ).then((tradeobj) => {
                                                tronWeb.trx.sign(
                                                    tradeobj,
                                                    wallet.private_key
                                                ).then((signedtxn) => {
                                                    tronWeb.trx.sendRawTransaction(
                                                        signedtxn
                                                    ).then((receipt) => {
                                                        if (receipt.result) {
                                                            // update wallet
                                                            const tm = new Date(receipt.transaction.raw_data.timestamp);
                                                            const tx_id = receipt.receipttxid;
                                                            const user_id = '';
                                                            const value = amount;
                                                            const from_address = wallet.wallet_address;
                                                            const to_address = toAddress;
                                                            const type = 'receive';
                                                            try {
                                                                Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                                    $set: {
                                                                        v_balanace: 0,
                                                                    }
                                                                });
                                                            } catch (error) {
                                                                console.log("Error: v balance couldn't updated 1st time: address: ", wallet.wallet_address);
                                                                try {
                                                                    Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                                        $set: {
                                                                            v_balanace: 0,
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log("Error: v balance couldn't updated 2nd time: address: ", wallet.wallet_address);
                                                                }
                                                            }
                                                        }
                                                    })
                                                })
                                            })
                                        }).catch(error => {
                                            console.log("Error in wallet.functions.js>updateAdminWallet>Wallets.map() callback> catch callback()trc10: ", error.message);
                                        });
                                }
                            });
                            break;
                        case 'BNB': //need to write logic
                            web3.eth
                            .getBalance(wallet.wallet_address)
                            .then((amount) => {
                                web3.eth.estimateGas({
                                    to: wallet.wallet_address //calculate balance for sender wallet
                                }).then((esgas) => {
                                    web3.eth.getGasPrice()
                                        .then((gasp) => {
                                            web3.eth.accounts.signTransaction(
                                                {
                                                    from: wallet.wallet_address,
                                                    to: toAddress, //admin wallet
                                                    value: (amount - (esgas * gasp)),
                                                    gas: esgas,
                                                },
                                                wallet.private_key
                                            ).then((createTransaction) => {
                                                // Deploy transaction
                                                web3.eth.sendSignedTransaction(
                                                    createTransaction.rawTransaction
                                                ).then((createReceipt) => {

                                                })
                                            })
                                        })
                                })
                            }).catch(error => {
                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()ETH: ", error.message)
                            });
                            break;
                    }
                } else {
                    switch (wallet.type.toUpperCase()) {
                        case 'ERC20': // need to update
                            if (wallet.contract_address) {
                                let contract = new web3Eth.eth.Contract(abi, wallet.contract_address);
                                web3Eth.eth.accounts.wallet.add(user.private_key);
                                contract.methods
                                    .decimals().call().then(decimal => {
                                        decimal = Number(`1e${decimal}`);
                                        contract.methods
                                            .balanceOf(user.wallet_address)
                                            .call()
                                            .then((bal) => {
                                                if (bal > 0) {
                                                    contract.methods.transfer(toAddress, bal).estimateGas({ value: 0, from: user.wallet_address }).then((gas) => {
                                                        contract.methods.transfer(toAddress, bal).send({ value: 0, from: user.wallet_address, gas: gas }).then((receipt) => {
                                                            // need to write logic
                                                        })
                                                    })
                                                }
                                            })
                                    }).catch(error => {
                                        console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback(): ", error.message);
                                    });
                            }
                            break;
                        case 'BP20': // need to update logic
                            if (wallet.contract_address) {
                                let contract = new web3.eth.Contract(abi, wallet.contract_address);
                                web3.eth.accounts.wallet.add(user.private_key);
                                contract.methods
                                .decimals().call().then(decimal => {
                                    decimal = Number(`1e${decimal}`);
                                    contract.methods
                                        .balanceOf(user.wallet_address)
                                        .call()
                                        .then((bal) => {
                                            if (bal > 0) {
                                                contract.methods.transfer(toAddress, bal).estimateGas({ value: 0, from: user.wallet_address }).then((gas) => {
                                                    contract.methods.transfer(toAddress, bal).send({ value: 0, from: user.wallet_address, gas: gas }).then((receipt) => {
                                                        // need to write logic
                                                    })
                                                })
                                            }
                                        })
                                }).catch(error => {
                                    console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()bp20: ", error.message);
                                });
                            }
                            break;
                        case 'TRC20':
                            AdminWallet.findOne({ wallet_type: 'TRC20' }).then((admin_wallet_data) => {
                                if (admin_wallet_data) {
                                    const toAddress = admin_wallet_data.wallet_address;
                                    if (wallet.contract_address) {
                                        tronWeb.trx
                                            .getBalance(wallet.wallet_address)
                                            .then((amount) => {
                                                tronWeb.setAddress(wallet.wallet_address);
                                                tronWeb.contract().at(s.contract_address).then((contract) => {
                                                    contract.balanceOf(wallet.wallet_address).call().then((balance) => {
                                                        getColdWallet(s.symbol).then((toAddress) => {
                                                            //Creates an unsigned TRX transfer transaction
                                                            contract.transfer(
                                                                toAddress,
                                                                Number(balance._hex)
                                                            ).send({
                                                                feeLimit: 10000000
                                                            }, wallet.private_key).then((receipt) => {
                                                                if (Number(balance._hex) > 0 && amount > 0) {
                                                                    try {
                                                                        Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                                            $set: {
                                                                                v_balanace: 0,
                                                                            }
                                                                        });
                                                                    } catch (error) {
                                                                        console.log("Error: v balance couldn't updated 1st time: address: ", wallet.wallet_address);
                                                                        try {
                                                                            Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                                                $set: {
                                                                                    v_balanace: 0,
                                                                                }
                                                                            });
                                                                        } catch (err) {
                                                                            console.log("Error: v balance couldn't updated 2nd time: address: ", wallet.wallet_address);
                                                                        }
                                                                    }
                                                                }
                                                            })
                                                        })
                                                    })
                                                })
                                            }).catch(error => {
                                                console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()trc20: ", error.message);
                                            })
                                    }
                                }
                            });
                            break;
                        case 'TRC10':
                            AdminWallet.findOne({ wallet_type: 'TRC10' }).then((admin_wallet_data) => {
                                if (admin_wallet_data) {
                                    const toAddress = admin_wallet_data.wallet_address;
                                    if (wallet.contract_address) {
                                        tronWeb.trx.getAccount(
                                            wallet.wallet_address,
                                        ).then((balance) => {
                                            tronWeb.transactionBuilder.sendToken(
                                                toAddress,
                                                balance.assetV2[0].value,
                                                s.contract_address,
                                                wallet.wallet_address,
                                            ).then((tradeobj) => {
                                                tronWeb.trx.sign(
                                                    tradeobj,
                                                    wallet.private_key
                                                ).then((signedtxn) => {
                                                    tronWeb.trx.sendRawTransaction(
                                                        signedtxn
                                                    ).then((receipt) => {
                                                        if (receipt.result) {
                                                            // need to implement 
                                                            try {
                                                                Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                                    $set: {
                                                                        v_balanace: 0,
                                                                    }
                                                                });
                                                            } catch (error) {
                                                                console.log("Error: v balance couldn't updated 1st time: address: ", wallet.wallet_address);
                                                                try {
                                                                    Wallets.updateOne({ wallet_address: wallet.wallet_address, wallet_type: wallet.wallet_type.toUpperCase() }, {
                                                                        $set: {
                                                                            v_balanace: 0,
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log("Error: v balance couldn't updated 2nd time: address: ", wallet.wallet_address);
                                                                }
                                                            }
                                                        }
                                                    })
                                                })
                                            })
                                        }).catch(error => {
                                            console.log("Error in wallet.functions.js>checkForDeposit>Wallets.map() callback> catch callback()trc10: ", error.message);
                                        })
                                    }
                                }
                            });
                            break;
                    }
                }
            }
        }
    })
}
module.exports = {
    countWallets,
    getWalletsFromRange,
    checkForDeposit,
    updateAdminWallet
}
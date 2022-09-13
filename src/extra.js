const TronWeb = require("tronweb");
const Web3 = require("web3");
const express = require("express");
const mysql = require('mysql');
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
const tronWeb = new TronWeb({
    fullHost: "https://api.trongrid.io",
});
const web3 = new Web3("https://bsc-dataseed4.binance.org/");
const web3Eth = new Web3("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161");
const start_time = new Date();
app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

const con = mysql.createConnection({
    host: "localhost",
    user: "bullsiex_user",
    password: "esydbpass#@!123",
    database: "bullsiex_db"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get("/app", function (req, res) {
    res.json({
        status: "1",
        result: "ok",
        timestamp: start_time,
        current: new Date() - start_time,
    })
});

function gettrc20Balance(wallet_address, contract_address, token_symbol, precision) {
    return new Promise((resolve, reject) => {
        tronWeb.setAddress(wallet_address);
        tronWeb
            .contract()
            .at(contract_address)
            .then((contract) => {
                contract
                    .balanceOf(wallet_address)
                    .call()
                    .then((bal) => {
                        con.query(`SELECT * FROM wallets WHERE wallet_address='${wallet_address}' and wallet_type='${token_symbol}'`, function (err, result) {
                            let d_bal = Number(bal._hex) / Number(precision) - result[0].v_balanace;
                            if (d_bal > 0) {
                                con.query(`UPDATE wallets SET balance = balance+${d_bal},v_balanace = v_balanace+${d_bal} WHERE wallet_address = '${wallet_address}' and wallet_type='${token_symbol}'`, function (err, result) {
                                    resolve(`UPDATE wallets SET balance = balance+${d_bal},v_balanace = v_balanace+${d_bal} WHERE wallet_address = '${wallet_address}' and wallet_type='${token_symbol}'`);
                                })
                            } else {
                                resolve("not updated");
                            }
                        })
                    })
                    .catch((e) => {
                        q
                        reject(e);
                    });
            });
    })
}


function getAdminWallet(wallet_type) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM main_wallet WHERE wallet_type='${wallet_type}'`, function (err, result) {
            if (err) reject(err);
            resolve(result[0]);
        })
    })
}

function getColdWallet(wallet_type) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM wallet_cold WHERE wallet_type='${wallet_type}'`, function (err, result) {
            if (err) reject(err);
            resolve(result[0].wallet_address);
        })
    })
}

function getHOTWallet(wallet_type) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM wallet_hot where wallet_type='${wallet_type}'`, function (err, result) {
            if (err) reject(err);
            resolve(result[0]);
        })
    })
}

function getTokenInfoByName(token_name) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM token WHERE token_symbol='${token_name}'`, function (err, result) {
            if (err) reject(err);
            resolve(result[0]);
        })
    })
}

function getTokenBalanceDB(wallet_address, wallet_type) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM wallets WHERE wallet_address='${wallet_address}' and wallet_type ='${wallet_type}'`, function (err, result) {
            if (err) reject(err);
            resolve(result[0].balance);
        });
    });
}

function getBalanceWallet(wallet) {
    return new Promise((resolve, reject) => {
        tronWeb.trx
            .getBalance(wallet)
            .then((d) => {
                resolve(d);
            })
            .catch((e) => {
                reject(e);
            });
    });
}

app.post("/balance/check", function (req, res) {
    wallet = req.body.wallet_address;
    wallet_type = req.body.wallet_type;
    if (wallet_type == "trx") {
        tronWeb.trx
            .getBalance(wallet)
            .then((d) => {
                res.json({ status: 1, result: d / 1e6 });
            })
            .catch((e) => {
                console.log(e);
                res.json({ status: 0, result: "something went wrong" });
            });
    } else if (wallet_type == "bnb") {
        web3.eth
            .getBalance(wallet)
            .then((d) => {
                res.json({
                    status: 1,
                    result: d / 1e18,
                });
            })
            .catch((e) => {
                res.status(500);
                res.json({ status: 0, error: e });
            });
    }
});

app.post("/gettrxwallet", function (req, res) {
    con.query("SELECT `wallet_address` FROM `wallets` WHERE wallet_type ='trx'", function (err, result) {
        if (err) throw err;
        res.json({
            status: 1,
            result: result,
        })
    })
})

app.post("/withdraw/trc20", function (req, res) {
    let wallet_address = req.body.wallet_address;
    let token_symbol = req.body.symbol;
    let amount = req.body.amount;
    let destination_address = req.body.destination_address;
    getTokenInfoByName(token_symbol)
        .then(token_info => {
            getAdminWallet(token_symbol)
                .then(admin_wallet => {
                    tronWeb.setAddress(admin_wallet.wallet_address);
                    tronWeb.setPrivateKey(admin_wallet.private_key);
                    tronWeb
                        .contract()
                        .at(token_info.wallet_addres)
                        .then((contract) => {
                            let precision = "1e" + token_info.token_decimal;
                            contract
                                .balanceOf(admin_wallet.wallet_address)
                                .call()
                                .then((bal) => {
                                    getTokenBalanceDB(wallet_address, token_symbol).then(wallet_balance => {
                                        if (wallet_balance >= amount) {
                                            if (Number(bal._hex) / Number(precision) > amount) {
                                                if (amount >= token_info.min_withdrawal) {
                                                    contract
                                                        .transfer(destination_address, (amount - token_info.withdrawal_fee) * Number(precision))
                                                        .send({})
                                                        .then((output) => {
                                                            con.query(`UPDATE wallets SET balance =  balance -${amount} WHERE wallet_address = '${wallet_address}' and wallet_type='${token_symbol}'`, function (err, result) {
                                                                if (err) res.json({ status: 0, result: err })
                                                                //   tronWeb.trx.getConfirmedTransaction(output).then(d=>{
                                                                //          res.json({ status: 1, result:d });
                                                                //   }).catch(e=>{
                                                                //       res.json({status:0,err:e});
                                                                //   })
                                                                res.json({ status: 1, result: output });
                                                            });

                                                        })
                                                        .catch((e) => res.json({ status: -2, result: e.message }));
                                                }
                                                else {
                                                    res.json({ status: 0, result: "minimum withdraw " + Math.round(token_info.min_withdrawal) + " " + token_symbol })
                                                }
                                            } else {
                                                res.json({ status: 0, result: "owner balance Low" });
                                            }
                                        } else {
                                            res.json({ status: 0, result: "insuficient funds" + wallet_balance });
                                        }
                                    }).catch(e => {

                                    })

                                })
                                .catch((e) => {
                                    res.json({ status: 0, err: e });
                                });
                        }).catch(e => {
                            res.json({ status: -1, error: e.message });
                        })
                }).catch(e => {
                    res.json({ status: 0, err: e });
                })
        })
})

app.post("/transactions", async function (req, res) {
    const wallet_address = req.body.wallet_address;
    const wallet_type = req.body.wallet_type;
    const balance = req.body.balance;
    let trc20 = [];
    let trc10 = [];
    tronWeb.trx
        .getBalance(wallet_address)
        .then((d) => {
            let d_bal = (d / 1e6) - balance;
            if (d_bal > 0) {
                con.query(`UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='TRX'`, function (err, result) {

                    // con.query("SELECT * FROM `deposite_history`",function (err,result){
                    //         if(err) res.json({status:0,err:err});
                    //         tx_ids=result;
                    // })
                    con.query("SELECT `wallet_addres` FROM `token` WHERE token_type ='trc10'", function (err, contract) {
                        if (err) throw err;
                        con.query("SELECT `contract_address` FROM `suppoted_currency` where `contract_type`='trc10'", async function (err, cont) {
                            if (err) throw err;
                            let _contract = contract.map(d => d.wallet_addres);
                            let __contract = cont.map(d => d.contract_address);
                            trc10 = [..._contract, ...__contract];
                        })
                    });
                    con.query("SELECT `wallet_addres` FROM `token` WHERE token_type ='trc20'", function (err, contract) {
                        if (err) throw err;
                        con.query("SELECT `contract_address` FROM `suppoted_currency` where `contract_type`='trc20'", async function (err, cont) {
                            if (err) throw err;
                            _contract = contract.map(d => d.wallet_addres);
                            __contract = cont.map(d => d.contract_address);
                        })
                    });

                    if (wallet_type == "trx") {
                        fetch(
                            `https://api.trongrid.io/v1/accounts/${wallet_address}/transactions/?only_confirmed=true`
                        )
                            .then((d) => d.json())
                            .then((trnx) => {
                                let data = [];
                                let token = [];
                                let trc20_token = [];
                                let query = "INSERT INTO `deposite_history` (`tx_id`, `symbol`,`blockNumber`, `block_timestamp`, `status`, `value`, `from_address`, `to_address`, `type`) VALUES ";
                                let token10_query = "INSERT INTO `trc10_deposit_history` ( `tx_id`, `blockNumber`, `block_timestamp`, `status`, `value`, `from_address`,`to_address`, `asset_id`, `type`) VALUES ";
                                let token20_query = "INSERT INTO `trc20_deposit_history_new` ( `tx_id`, `symbol`, `contract`, `block_timestamp`, `from_address`, `to_address`, `value`, `type`) VALUES ";
                                trnx.data.filter((trn) => {
                                    if (trn.raw_data.contract[0].type == "TransferContract") {
                                        let obj = {
                                            tx_id: trn.txID,
                                            blockNumber: trn.blockNumber,
                                            block_timestamp: trn.block_timestamp,
                                            status: trn.ret[0].contractRet == "SUCCESS" ? 1 : 0,
                                            value: trn.raw_data.contract[0].parameter.value.amount / 1e6,
                                            from_address: tronWeb.address.fromHex(
                                                trn.raw_data.contract[0].parameter.value.owner_address
                                            ),
                                            to_address: tronWeb.address.fromHex(
                                                trn.raw_data.contract[0].parameter.value.to_address
                                            ),
                                            type:
                                                tronWeb.address.fromHex(
                                                    trn.raw_data.contract[0].parameter.value.owner_address
                                                ) === wallet_address
                                                    ? "send"
                                                    : "receieve",
                                        }
                                        q = `('${obj.tx_id}','TRX','${obj.blockNumber}','${obj.block_timestamp}','${obj.status}','${obj.value}','${obj.from_address}','${obj.to_address}','${obj.type}'),`;
                                        query += q;
                                        data.push(obj);
                                    }
                                    else if (trn.raw_data.contract[0].type == "TransferAssetContract") {
                                        let asset_id = trn.raw_data.contract[0].parameter.value.asset_name;
                                        if (trc10.find(d => d == asset_id)) {
                                            let ob1 = {
                                                tx_id: trn.txID,
                                                blockNumber: trn.blockNumber,
                                                block_timestamp: trn.block_timestamp,
                                                status: trn.ret[0].contractRet == "SUCCESS" ? 1 : 0,
                                                value: trn.raw_data.contract[0].parameter.value.amount / 1e6,
                                                from_address: tronWeb.address.fromHex(
                                                    trn.raw_data.contract[0].parameter.value.owner_address
                                                ),
                                                to_address: tronWeb.address.fromHex(
                                                    trn.raw_data.contract[0].parameter.value.to_address
                                                ),
                                                asset_id: asset_id,
                                                type:
                                                    tronWeb.address.fromHex(
                                                        trn.raw_data.contract[0].parameter.value.owner_address
                                                    ) === wallet_address
                                                        ? "send"
                                                        : "receieve",
                                            }
                                            let rq = `('${ob1.tx_id}', '${ob1.blockNumber}', '${ob1.block_timestamp}', '${ob1.status}', '${ob1.value}', '${ob1.from_address}','${ob1.to_address}', '${ob1.asset_id}','${ob1.type}'),`;
                                            token.push(ob1);
                                            token10_query += rq;
                                        }
                                    }
                                });
                                fetch(`https://api.trongrid.io/v1/accounts/${wallet_address}/transactions/trc20/?only_confirmed=true`)
                                    .then((d) => d.json())
                                    .then(async (trnx) => {
                                        let data_trnx = trnx.data;
                                        let i = 0;
                                        let q_data = [];

                                        while (data_trnx.length > i) {
                                            if (trc20.find((r) => r == data_trnx[i].token_info.address)) {
                                                let precision = "1e" + data_trnx[i].token_info.decimals;
                                                let q = await gettrc20Balance(wallet_address, data_trnx[i].token_info.address, data_trnx[i].token_info.symbol, precision);
                                                q_data.push(q);
                                                let da = {
                                                    tx_id: data_trnx[i].transaction_id,
                                                    symbol: data_trnx[i].token_info.symbol,
                                                    contract: data_trnx[i].token_info.address,
                                                    block_timestamp: data_trnx[i].block_timestamp,
                                                    from_address: data_trnx[i].from,
                                                    to_address: data_trnx[i].to,
                                                    value: data_trnx[i].value / Number(precision),
                                                    type: data_trnx[i].type,
                                                }
                                                let sq = `('${da.tx_id}', '${da.symbol}', '${da.contract}', '${da.block_timestamp}', '${da.from_address}', '${da.to_address}', '${da.value}','${da.type}'),`
                                                trc20_token.push(da);
                                                token20_query += sq;
                                            }
                                            i++;
                                        }

                                        let f_n_l_q = query.substr(0, query.length - 1);
                                        let token_q = token10_query.substr(0, token10_query.length - 1);
                                        let trc_20_q = token20_query.substr(0, token20_query.length - 1);
                                        con.query(f_n_l_q, function (err, result) {
                                            con.query(token_q, function (err1, result1) {
                                                con.query(trc_20_q, function (err2, result2) {
                                                    res.json({ "status": 1, "result": result, "result1": result1, "result2": result2, q: query, trc10: token_q, trc20: trc_20_q, err: err, q: q_data, trc10: trc10 })
                                                })
                                            })
                                        })
                                    }).catch(e => {
                                        console.log(e);
                                        res.json({ status: 0, error: e.message });
                                    })


                                // if (token.length>0){
                                //     con.query(token_q,function (err,result){
                                //     if(err) res.json({status:0,err:err});
                                //     })
                                // }
                                // if(trc20_token.length>0){
                                //   con.query(trc_20_q,function (err,result2){
                                //     if(err) res.json({status:0,err:err});
                                // })  
                                // }

                            })
                            .catch((e) => {
                                res.json({ status: 0, result: e });
                            });
                    }
                    else {
                        res.json({ status: 0, msg: "invalid wallet type!" });
                    }
                })
            } else {
                con.query("SELECT `wallet_addres` FROM `token` WHERE token_type ='trc10'", function (err, contract) {

                    con.query("SELECT `contract_address` FROM `suppoted_currency` where `contract_type`='trc10'", async function (err, cont) {
                        let _contract = contract.map(d => d.wallet_addres);
                        let __contract = cont.map(d => d.contract_address);
                        trc10 = [..._contract, ...__contract];
                    })
                });
                con.query("SELECT `wallet_addres` FROM `token` WHERE token_type ='trc20'", function (err, contract) {
                    if (err) throw err;
                    con.query("SELECT `contract_address` FROM `suppoted_currency` where `contract_type`='trc20'", async function (err, cont) {
                        if (err) throw err;
                        _contract = contract.map(d => d.wallet_addres);
                        __contract = cont.map(d => d.contract_address);
                        trc20 = [..._contract, ...__contract];
                    })
                });

                if (wallet_type == "trx") {
                    fetch(
                        `https://api.trongrid.io/v1/accounts/${wallet_address}/transactions/?only_confirmed=true`
                    )
                        .then((d) => d.json())
                        .then((trnx) => {
                            let data = [];
                            let token = [];
                            let trc20_token = [];
                            let query = "INSERT INTO `deposite_history` (`tx_id`,`symbol`, `blockNumber`, `block_timestamp`, `status`, `value`, `from_address`, `to_address`, `type`) VALUES ";
                            let token10_query = "INSERT INTO `trc10_deposit_history` ( `tx_id`, `blockNumber`, `block_timestamp`, `status`, `value`, `from_address`,`to_address`, `asset_id`, `type`) VALUES ";
                            let token20_query = "INSERT INTO `trc20_deposit_history_new` ( `tx_id`, `symbol`, `contract`, `block_timestamp`, `from_address`, `to_address`, `value`, `type`) VALUES ";
                            trnx.data.filter((trn) => {
                                if (trn.raw_data.contract[0].type == "TransferContract") {
                                    let obj = {
                                        tx_id: trn.txID,
                                        blockNumber: trn.blockNumber,
                                        block_timestamp: trn.block_timestamp,
                                        status: trn.ret[0].contractRet == "SUCCESS" ? 1 : 0,
                                        value: trn.raw_data.contract[0].parameter.value.amount / 1e6,
                                        from_address: tronWeb.address.fromHex(
                                            trn.raw_data.contract[0].parameter.value.owner_address
                                        ),
                                        to_address: tronWeb.address.fromHex(
                                            trn.raw_data.contract[0].parameter.value.to_address
                                        ),
                                        type:
                                            tronWeb.address.fromHex(
                                                trn.raw_data.contract[0].parameter.value.owner_address
                                            ) === wallet_address
                                                ? "send"
                                                : "receieve",
                                    }
                                    q = `('${obj.tx_id}','TRX','${obj.blockNumber}','${obj.block_timestamp}','${obj.status}','${obj.value}','${obj.from_address}','${obj.to_address}','${obj.type}'),`;
                                    query += q;
                                    data.push(obj);
                                }
                                else if (trn.raw_data.contract[0].type == "TransferAssetContract") {
                                    let asset_id = trn.raw_data.contract[0].parameter.value.asset_name;
                                    if (trc10.find(d => d == asset_id)) {
                                        let ob1 = {
                                            tx_id: trn.txID,
                                            blockNumber: trn.blockNumber,
                                            block_timestamp: trn.block_timestamp,
                                            status: trn.ret[0].contractRet == "SUCCESS" ? 1 : 0,
                                            value: trn.raw_data.contract[0].parameter.value.amount / 1e6,
                                            from_address: tronWeb.address.fromHex(
                                                trn.raw_data.contract[0].parameter.value.owner_address
                                            ),
                                            to_address: tronWeb.address.fromHex(
                                                trn.raw_data.contract[0].parameter.value.to_address
                                            ),
                                            asset_id: asset_id,
                                            type:
                                                tronWeb.address.fromHex(
                                                    trn.raw_data.contract[0].parameter.value.owner_address
                                                ) === wallet_address
                                                    ? "send"
                                                    : "receieve",
                                        }
                                        let rq = `('${ob1.tx_id}', '${ob1.blockNumber}', '${ob1.block_timestamp}', '${ob1.status}', '${ob1.value}', '${ob1.from_address}','${ob1.to_address}', '${ob1.asset_id}','${ob1.type}'),`;
                                        token.push(ob1);
                                        token10_query += rq;
                                    }
                                }
                            });
                            fetch(`https://api.trongrid.io/v1/accounts/${wallet_address}/transactions/trc20/?only_confirmed=true`)
                                .then((d) => d.json())
                                .then(async (trnx) => {
                                    let data_trnx = trnx.data;
                                    let i = 0;
                                    let q_data = [];
                                    while (data_trnx.length > i) {
                                        if (trc20.find((r) => r == data_trnx[i].token_info.address)) {
                                            let precision = "1e" + data_trnx[i].token_info.decimals;
                                            let q = await gettrc20Balance(wallet_address, data_trnx[i].token_info.address, data_trnx[i].token_info.symbol, precision);
                                            q_data.push(q);
                                            let da = {
                                                tx_id: data_trnx[i].transaction_id,
                                                symbol: data_trnx[i].token_info.symbol,
                                                contract: data_trnx[i].token_info.address,
                                                block_timestamp: data_trnx[i].block_timestamp,
                                                from_address: data_trnx[i].from,
                                                to_address: data_trnx[i].to,
                                                value: data_trnx[i].value / Number(precision),
                                                type: data_trnx[i].type,
                                            }
                                            let sq = `('${da.tx_id}', '${da.symbol}', '${da.contract}', '${da.block_timestamp}', '${da.from_address}', '${da.to_address}', '${da.value}','${da.type}'),`
                                            trc20_token.push(da);
                                            token20_query += sq;
                                        }
                                        i++;
                                    }

                                    let f_n_l_q = query.substr(0, query.length - 1);
                                    let token_q = token10_query.substr(0, token10_query.length - 1);
                                    let trc_20_q = token20_query.substr(0, token20_query.length - 1);
                                    con.query(f_n_l_q, function (err, result) {
                                        con.query(token_q, function (err1, result1) {
                                            con.query(trc_20_q, function (err2, result2) {
                                                res.json({ "status": 1, "result": result, "result1": result1, "result2": result2, q: query, trc10: token_q, trc20: trc_20_q, err: err, q: q_data, trc10: trc10 })
                                            })
                                        })
                                    })
                                }).catch(e => {
                                    console.log(e);
                                    res.json({ status: 0, error: e.message });
                                })
                        })
                        .catch((e) => {
                            res.json({ status: 0, result: e });
                        });
                }
                else {
                    res.json({ status: 0, msg: "invalid wallet type!" });
                }
            }
        }).catch(e => {
            console.log(e);
        })
});

app.post("/change/transaction/status", function (req, res) {
    con.query("SELECT * FROM crypto_transaction_history WHERE status=0", async function (err, result) {
        if (err) res.json({ status: 0, result: err });
        let array = [];
        await result.map(d => {
            if (Number(d.transaction_time) + 600 >= (Date.now() / 1000).toFixed(0)) {
                array.push({ status: "success", id: d.id, });
            } else {
                con.query(`UPDATE crypto_transaction_history SET status = -1 WHERE id = ${d.id}`, function (err, result) {
                    if (err) res.json({ status: 'err', err: err })
                    array.push({ status: "failed", id: d.id, rec: Number(d.transaction_time) + 600, nw: (Date.now() / 1000).toFixed(0) })
                })

            }
        })
        res.json({ status: 1, result: array });
    })
})

app.post("/adminTRXTransection", async function (req, res) {
    const fromAddress = req.body.wallet_address;
    const privateKey = req.body.private_key;
    const amount = await getBalanceWallet(fromAddress);
    getColdWallet(req.body.wallet_type).then((toAddress) => {
        //Creates an unsigned TRX transfer transaction
        tronWeb.transactionBuilder.sendTrx(
            toAddress,
            amount,
            fromAddress
        ).then((tradeobj) => {
            tronWeb.trx.sign(
                tradeobj,
                privateKey
            ).then((signedtxn) => {
                tronWeb.trx.sendRawTransaction(
                    signedtxn
                ).then((receipt) => {
                    if (receipt.result) {
                        con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${fromAddress}' and wallet_type='TRX'`, function (err, result) {
                            if (err) throw err;
                            res.json({ status: 1, result: receipt });
                        });
                        con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${amount / 1e6}' WHERE wallet_address ='${toAddress}' and wallet_type='TRX'`, function (err, result) {
                            if (err) throw err;
                            res.json({ status: 1, result: receipt });
                        });
                    } else {
                        res.json({ status: 1, result: "fail to transfer" });
                    }
                }).catch((e) => {
                    res.json({ status: 0, result: "failed to fetch receipt" });
                })
            }).catch((e) => {
                res.json({ status: 0, result: "failed to fetch signedtxn" });
            })
        }).catch((e) => {
            res.json({ status: 0, result: "failed to fetch tradeobj", err: e });
        })
    }).catch((e) => {
        res.json({ status: 0, result: "fail to fetch" });
    });

});

app.post("/adminTrc10Transfer", async function (req, res) {
    const fromAddress = req.body.wallet_address;
    const privateKey = req.body.private_key;
    const tokenID = req.body.tokenID;
    const wallet_type = req.body.wallet_type;
    //Query the information of an account, and check the balance by assetV2 in the return value.
    getColdWallet(wallet_type).then((toAddress) => {
        //Creates an unsigned TRX transfer transaction
        tronWeb.trx.getAccount(
            fromAddress).then((balance) => {
                tronWeb.transactionBuilder.sendToken(
                    toAddress,
                    balance.assetV2[0].value,
                    tokenID,
                    fromAddress,
                ).then((tradeobj) => {
                    tronWeb.trx.sign(
                        tradeobj,
                        privateKey
                    ).then((signedtxn) => {
                        tronWeb.trx.sendRawTransaction(
                            signedtxn
                        ).then((receipt) => {
                            if (receipt.result) {
                                con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    res.json({ status: 1, result: receipt });
                                });
                                con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${balance.assetV2[0].value / 1e6}' WHERE wallet_address ='${toAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    res.json({ status: 2, result: receipt });
                                });
                            } else {
                                res.json({ status: 0, result: receipt });
                            }
                        }).catch((e) => {
                            res.json({ status: -1, result: "failed to fetch receipt" });
                        })
                    }).catch((e) => {
                        res.json({ status: -2, result: "failed to fetch signedtxn" });
                    })
                }).catch((e) => {
                    res.json({ status: -3, result: "failed to fetch tradeobj" });
                })
            }).catch((e) => {
                res.json({ status: -4, result: "details" });
            })
    }).catch((e) => {
        res.json({ status: -5, result: "fail to fetch" });
    });

});

app.post("/adminTrc20Transfer", async function (req, res) {
    const fromAddress = req.body.wallet_address;
    const privateKey = req.body.private_key;
    const contract_address = req.body.contract_address;
    const wallet_type = req.body.wallet_type;
    const amount = await getBalanceWallet(fromAddress);
    tronWeb.setAddress(fromAddress);
    tronWeb.contract().at(contract_address).then((contract) => {
        contract.balanceOf(fromAddress).call().then((balance) => {
            getColdWallet(wallet_type).then((toAddress) => {
                //Creates an unsigned TRX transfer transaction
                contract.transfer(
                    toAddress,
                    Number(balance._hex)
                ).send({
                    feeLimit: 10000000
                }, privateKey).then((receipt) => {
                    if (Number(balance._hex) > 0 && amount > 0) {
                        con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                            if (err) throw err;
                            res.json({ status: 1, result: receipt });
                        });
                        con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${Number(balance._hex)}' WHERE wallet_address ='${toAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                            if (err) throw err;
                            res.json({ status: 2, result: receipt });
                        });
                    } else {
                        res.json({ status: 0, result: receipt, msg: "Failed to transfer" });
                    }
                }).catch((e) => {
                    res.json({ status: -1, result: "failed to fetch receipt" });
                })
            }).catch((e) => {
                res.json({ status: -2, result: "fail to fetch address" });
            });
        }).catch((e) => {
            res.json({ status: -3, result: "fail to fetch balance" });
        })
    }).catch((e) => {
        res.json({ status: -4, result: "fail to fetch contract" });
    });
});

app.post("/getTrc10Balance", async function (req, res) {
    const wallet_address = req.body.wallet_address;
    const wallet_type = req.body.wallet_type;
    const bal = req.body.balance;
    tronWeb.trx.getAccount(
        wallet_address
    ).then((balance) => {
        let d_bal = (balance.assetV2[0].value / 1e6) - bal;
        if (d_bal > 0) {
            con.query(`UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                con.query("INSERT INTO `deposite_history`( `tx_id`, `symbol`, `blockNumber`, `block_timestamp`, `status`, `value`, `from_address`, `to_address`, `type`) VALUES ('${fromAddress}','${wallet_type}','','',1,'${d_bal}','${fromAddress}','${wallet_address}','send')", function (err, result) {
                    if (err) throw err;
                    res.json({ status: 1, result: balance.assetV2[0].value });
                });
            })
        } else {
            res.json({ status: -1, result: balance.assetV2[0].value });
        }
    }).catch((e) => {
        res.json({ status: 0, result: "failed to fetch" });
    })
});

app.post("/getTrc20Bal", async function (req, res) {
    const wallet_address = req.body.wallet_address;
    const wallet_type = req.body.wallet_type;
    const contract_address = req.body.contract_address;
    const balance = req.body.balance;
    tronWeb.setAddress(wallet_address);
    tronWeb
        .contract()
        .at(contract_address)
        .then((contract) => {
            contract
                .balanceOf(wallet_address)
                .call()
                .then((bal) => {
                    let d_bal = (Number(bal._hex) / 1e6) - balance;
                    if (d_bal > 0) {
                        con.query(`UPDATE wallets SET balance = balance+${d_bal},v_balanace = v_balanace+${d_bal} WHERE wallet_address = '${wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                            res.json({ status: 1, result: Number(bal._hex) });
                        })
                    } else {
                        res.json({ status: -1, result: Number(bal._hex) });
                    }
                })
                .catch((e) => {
                    res.json({ status: 0, result: Number(bal._hex) });
                });
        });
});

/***********************WITHDRAW Function************/

app.post("/withdraw/trx", async function (req, res) {
    const fromAddress = req.body.wallet_address;
    const wallet_type = req.body.wallet_type;
    const toAddress = req.body.toAddress;
    const amount = req.body.volume;
    const remark = req.body.remark;
    const famount = req.body.famount;
    const user_id = req.body.user_id;
    const contract_address = req.body.contract_address;
    getHOTWallet(wallet_type).then((hotWalletAddress) => {
        //Creates an unsigned TRX transfer transaction
        if (wallet_type == 'TRX') {
            tronWeb.transactionBuilder.sendTrx(
                toAddress,
                (amount * 1e6),
                hotWalletAddress.wallet_address
            ).then((tradeobj) => {
                tronWeb.trx.sign(
                    tradeobj,
                    hotWalletAddress.private_key
                ).then((signedtxn) => {
                    tronWeb.trx.sendRawTransaction(
                        signedtxn
                    ).then((receipt) => {
                        if (receipt.result) {
                            const tm = new Date(receipt.transaction.raw_data.timestamp).toLocaleString();
                            con.query(`UPDATE wallets SET balance=balance-'${famount}' WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                if (err) throw err;
                                con.query(`UPDATE wallet_hot SET total_funds=total_funds-'${amount}' WHERE wallet_address ='${hotWalletAddress.wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    con.query(`INSERT INTO 'withdraw_history' ('user_id', 'tx_id', 'symbol', 'created_on', 'block_timestamp', 'status', 'amount', 'from_address', 'to_address', 'type', 'transection_id') VALUES ('${user_id}','${receipttxid}','TRX','${tm}','${receipt}', '1','${famount}','${fromAddress}','${toAddress}', 'WITHDRAW','${receipttxid}')`, function (err, result) {
                                        if (err) throw err;
                                        res.json({ status: 1, msg: "withdraw successfully" });
                                    });
                                });
                            });
                        } else {
                            con.query("INSERT INTO `withdraw_history` (`user_id`, `tx_id`, `symbol`, `created_on`, `block_timestamp`, `status`, `amount`, `from_address`, `to_address`, `type`, `transection_id`) VALUES ('${user_id}','${receipt.txid}','TRX','${tm}','receipt.transaction.raw_data.timestamp', '0','${famount}','${fromAddress}','${toAddress}', 'WITHDRAW','${receipt.txid}')", function (err, result) {
                                if (err) throw err;
                                res.json({ status: 0, msg: "fail to transfer" });
                            });
                        }
                    }).catch((e) => {
                        res.json({ status: 0, msg: "failed to fetch receipt" });
                    })
                }).catch((e) => {
                    res.json({ status: 0, msg: "failed to fetch signedtxn" });
                })
            }).catch((e) => {
                res.json({ status: 0, msg: "failed to fetch tradeobj" });
            })
        } else if (wallet_type == 'BTT') {
            tronWeb.transactionBuilder.sendToken(
                toAddress,
                (amount * 1e6),
                contract_address,
                hotWalletAddress.wallet_address,
            ).then((tradeobj) => {
                tronWeb.trx.sign(
                    tradeobj,
                    hotWalletAddress.private_key
                ).then((signedtxn) => {
                    tronWeb.trx.sendRawTransaction(
                        signedtxn
                    ).then((receipt) => {
                        if (receipt.result) {
                            con.query(`UPDATE wallets SET balance=balance-'${famount}' WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                if (err) throw err;
                                con.query(`UPDATE wallet_hot SET total_funds=total_funds-'${amount}' WHERE wallet_address ='${hotWalletAddress.wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    res.json({ status: 1, msg: "Withdraw Successfully" });
                                });
                            });
                        } else {
                            res.json({ status: 0, msg: receipt });
                        }
                    }).catch((e) => {
                        res.json({ status: -1, msg: "failed to fetch receipt" });
                    })
                }).catch((e) => {
                    res.json({ status: -2, msg: "failed to fetch signedtxn" });
                })
            }).catch((e) => {
                res.json({ status: -3, msg: "failed to fetch tradeobj" });
            })
        } else if (wallet_type == 'USDT') {
            tronWeb.setAddress(hotWalletAddress.wallet_address);
            tronWeb.contract().at(contract_address).then((contract) => {
                //Creates an unsigned TRX transfer transaction
                contract.transfer(
                    toAddress,
                    (amount * 1e6)
                ).send({
                    feeLimit: 10000000
                }, hotWalletAddress.private_key).then((receipt) => {
                    con.query(`UPDATE wallets SET balance=balance-'${famount}' WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                        if (err) throw err;
                        con.query(`UPDATE wallet_hot SET total_funds=total_funds-'${amount}' WHERE wallet_address ='${hotWalletAddress.wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                            if (err) throw err;
                            res.json({ status: 1, msg: "Withdraw Successfully" });
                        });
                    });
                }).catch((e) => {
                    res.json({ status: -1, msg: "failed to fetch receipt" });
                })
            }).catch((e) => {
                res.json({ status: -4, msg: "fail to fetch contract" });
            });



        }
    }).catch((e) => {
        res.json({ status: 0, msg: "fail to fetch" });
    });

});

app.post("/withdraw/bnb", async function (req, res) {
    const fromAddress = req.body.wallet_address;
    const wallet_type = req.body.wallet_type;
    const toAddress = req.body.toAddress;
    const amount = req.body.volume;
    const remark = req.body.remark;
    const famount = req.body.famount;
    const contract_address = req.body.contract_address;
    getHOTWallet(wallet_type).then((hotWalletAddress) => {
        //Creates an unsigned TRX transfer transaction
        if (wallet_type == 'BNB') {
            web3.eth.estimateGas({
                to: hotWalletAddress.wallet_address
            }).then((esgas) => {
                web3.eth.getGasPrice()
                    .then((gasp) => {
                        web3.eth.accounts.signTransaction(
                            {
                                from: hotWalletAddress.wallet_address,
                                to: toAddress,
                                value: (amount - (esgas * gasp)),
                                gas: esgas,
                            },
                            hotWalletAddress.private_key
                        ).then((createTransaction) => {
                            // Deploy transaction
                            web3.eth.sendSignedTransaction(
                                createTransaction.rawTransaction
                            ).then((createReceipt) => {
                                con.query(`UPDATE wallets SET balance=balance-'${famount}' WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    con.query(`UPDATE wallet_hot SET total_funds=total_funds-'${amount}' WHERE wallet_address ='${hotWalletAddress.wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                                        if (err) throw err;
                                        res.json({ status: 1, msg: "withdraw successfully" });
                                    });
                                });
                            }).catch((e) => {
                                res.json({ status: -1, result: e });
                            })
                        }).catch((e) => {
                            res.json({ status: -2, result: e });
                        })
                    })
            })

        } else if (wallet_type == 'ETH') {
            web3Eth.eth.estimateGas({
                to: hotWalletAddress.wallet_address
            }).then((esgas) => {
                web3Eth.eth.getGasPrice()
                    .then((gasp) => {
                        web3Eth.eth.accounts.signTransaction(
                            {
                                from: hotWalletAddress.wallet_address,
                                to: toAddress,
                                value: (amount - (esgas * gasp)),
                                gas: esgas,
                            },
                            hotWalletAddress.private_key
                        ).then((createTransaction) => {
                            // Deploy transaction
                            web3Eth.eth.sendSignedTransaction(
                                createTransaction.rawTransaction
                            ).then((createReceipt) => {
                                con.query(`UPDATE wallets SET balance=balance-'${famount}' WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    con.query(`UPDATE wallet_hot SET total_funds=total_funds-'${amount}' WHERE wallet_address ='${hotWalletAddress.wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                                        if (err) throw err;
                                        res.json({ status: 1, msg: "withdraw successfully" });
                                    });
                                });
                            }).catch((e) => {
                                res.json({ status: -1, result: e });
                            })
                        }).catch((e) => {
                            res.json({ status: -2, result: e });
                        })
                    })
            })
        } else if (wallet_type == 'BTEX') {
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

            web3.eth.accounts.wallet.add(hotWalletAddress.private_key);
            contract.methods
                .decimals().call().then(decimal => {
                    decimal = Number(`1e${decimal}`);
                    contract.methods.transfer(toAddress, (amount * decimal)).estimateGas({ value: 0, from: hotWalletAddress.wallet_address }).then((gas) => {
                        contract.methods.transfer(toAddress, (amount * decimal)).send({ value: 0, from: hotWalletAddress.wallet_address, gas: gas }).then((receipt) => {
                            con.query(`UPDATE wallets SET balance=balance-'${famount}' WHERE wallet_address ='${fromAddress}' and wallet_type='${wallet_type}'`, function (err, result) {
                                if (err) throw err;
                                con.query(`UPDATE wallet_hot SET total_funds=total_funds-'${amount}' WHERE wallet_address ='${hotWalletAddress.wallet_address}' and wallet_type='${wallet_type}'`, function (err, result) {
                                    if (err) throw err;
                                    res.json({ status: 1, msg: "withdraw successfully" });
                                });
                            });
                        }).catch((e) => {
                            res.json({ status: 0, msg: e })
                        })
                    }).catch((e) => {
                        res.json({ status: -1, msg: e })
                    })
                }).catch((e) => {
                    res.json({ status: -3, msg: e })
                })





        }
    }).catch((e) => {
        res.json({ status: 0, msg: "fail to fetch" });
    });

});




/**********************End of Withdraw***************/

/*************Transfer Balance Adddress to Cold Wallet**********/
async function transferBalanceTRX(req, res) {
    getColdWallet('TRX').then((toAddress) => {
        con.query(`SELECT * FROM wallets WHERE wallet_type='TRX' and v_balanace>0`,
            function (err, users) {
                if (err) throw err;
                if (users.length) {
                    users.map((s) => {
                        tronWeb.trx
                            .getBalance(s.wallet_address)
                            .then((amount) => {
                                //Creates an unsigned TRX transfer transaction
                                tronWeb.transactionBuilder.sendTrx(
                                    toAddress,
                                    amount,
                                    s.wallet_address
                                ).then((tradeobj) => {
                                    tronWeb.trx.sign(
                                        tradeobj,
                                        s.private_key
                                    ).then((signedtxn) => {
                                        tronWeb.trx.sendRawTransaction(
                                            signedtxn
                                        ).then((receipt) => {
                                            if (receipt.result) {
                                                con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${s.wallet_address}' and wallet_type='TRX'`, function (err, resu) {
                                                    if (err) throw err;
                                                    con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${amount / 1e6}' WHERE wallet_address ='${toAddress}' and wallet_type='TRX'`, function (err, resul) {
                                                        if (err) throw err;
                                                        res.json({ status: 2, result: receipt });
                                                    });
                                                });
                                            }
                                        }).catch((e) => {
                                            res.json({ status: -1, result: "failed to fetch receipt" });
                                        })
                                    }).catch((e) => {
                                        res.json({ status: -2, result: "failed to fetch signedtxn" });
                                    })
                                }).catch((e) => {
                                    res.json({ status: -3, result: "failed to fetch tradeobj", err: e, amt: amount, from: s.wallet_address, toAddress: toAddress });
                                })
                            }).catch((e) => {
                                res.json({ status: -3, result: "failed to fetch balance", err: e });
                            });
                    });
                } else {
                    res.json({ status: -5, result: "NOT HAVE USER" });
                }
            });

    }).catch((e) => {
        res.json({ status: -4, result: "fail to fetch" });
    });
};

async function transferBalanceTokenTrc10(req, res) {
    con.query(`SELECT wallet_addres,token_symbol FROM token where token_type='trc10'`, function (err, result) {
        if (err) throw err;
        result.map((s) => {
            con.query(`SELECT * FROM wallets where wallet_type='${s.token_symbol}' and v_balanace>0`,
                function (err, users) {
                    if (err) throw err;
                    if (users.length) {
                        users.map((user) => {
                            getColdWallet(s.token_symbol).then((toAddress) => {
                                //Creates an unsigned TRX transfer transaction
                                tronWeb.trx.getAccount(
                                    user.wallet_address,
                                ).then((balance) => {
                                    tronWeb.transactionBuilder.sendToken(
                                        toAddress,
                                        balance.assetV2[0].value,
                                        s.wallet_addres,
                                        user.wallet_address,
                                    ).then((tradeobj) => {
                                        tronWeb.trx.sign(
                                            tradeobj,
                                            user.private_key
                                        ).then((signedtxn) => {
                                            tronWeb.trx.sendRawTransaction(
                                                signedtxn
                                            ).then((receipt) => {
                                                if (receipt.result) {
                                                    con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${user.wallet_address}' and wallet_type='${s.token_symbol}'`, function (err, resu) {
                                                        if (err) throw err;
                                                        con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${balance.assetV2[0].value / 1e6}' WHERE wallet_address ='${toAddress}' and wallet_type='${s.token_symbol}'`, function (err, resul) {
                                                            if (err) throw err;
                                                            res.json({ status: 2, result: receipt });
                                                        });
                                                    });
                                                }
                                            }).catch((e) => {
                                                res.json({ status: -1, result: "failed to fetch receipt" });
                                            })
                                        }).catch((e) => {
                                            res.json({ status: -2, result: "failed to fetch signedtxn" });
                                        })
                                    }).catch((e) => {
                                        res.json({ status: -3, result: "failed to fetch tradeobj" });
                                    })
                                }).catch((e) => {
                                    res.json({ status: -4, result: "details" });
                                })
                            }).catch((e) => {
                                res.json({ status: -5, result: "fail to fetch" });
                            });
                        });
                    } else {
                        res.json({ status: -5, result: "NOT HAVE USER" });
                    }
                });
        });
    });
}

async function transferBalanceTrc10(req, res) {
    con.query(`SELECT symbol, contract_address FROM suppoted_currency WHERE contract_type='trc10'`, function (err, result) {
        if (err) throw err;
        result.map((s) => {
            con.query(`SELECT * FROM wallets where wallet_type='${s.symbol}' and v_balanace>0`,
                function (err, users) {
                    if (err) throw err;
                    if (users.length) {
                        users.map((user) => {
                            getColdWallet(s.symbol).then((toAddress) => {
                                //Creates an unsigned TRX transfer transaction
                                tronWeb.trx.getAccount(
                                    user.wallet_address,
                                ).then((balance) => {
                                    tronWeb.transactionBuilder.sendToken(
                                        toAddress,
                                        balance.assetV2[0].value,
                                        s.contract_address,
                                        user.wallet_address,
                                    ).then((tradeobj) => {
                                        tronWeb.trx.sign(
                                            tradeobj,
                                            user.private_key
                                        ).then((signedtxn) => {
                                            tronWeb.trx.sendRawTransaction(
                                                signedtxn
                                            ).then((receipt) => {
                                                if (receipt.result) {
                                                    con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${user.wallet_address}' and wallet_type='${s.symbol}'`, function (err, resu) {
                                                        if (err) throw err;
                                                        con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${balance.assetV2[0].value / 1e6}' WHERE wallet_address ='${toAddress}' and wallet_type='${s.symbol}'`, function (err, resul) {
                                                            if (err) throw err;
                                                            res.json({ status: 2, result: receipt });
                                                        });
                                                    });
                                                }
                                            }).catch((e) => {
                                                res.json({ status: -1, result: "failed to fetch receipt" });
                                            })
                                        }).catch((e) => {
                                            res.json({ status: -2, result: "failed to fetch signedtxn" });
                                        })
                                    }).catch((e) => {
                                        res.json({ status: -3, result: "failed to fetch tradeobj" });
                                    })
                                }).catch((e) => {
                                    res.json({ status: -4, result: "details" });
                                })
                            }).catch((e) => {
                                res.json({ status: -5, result: "fail to fetch" });
                            });
                        });
                    } else {
                        res.json({ status: -5, result: "NOT HAVE USER" });
                    }
                });
        });
    });
}

async function transferBalanceTokenTrc20(req, res) {
    con.query(`SELECT wallet_addres,token_symbol FROM token where token_type='trc20'`, function (err, result) {
        if (err) throw err;
        result.map((s) => {
            con.query(`SELECT * FROM wallets where wallet_type='${s.token_symbol}' and v_balanace>0`,
                function (err, users) {
                    if (err) throw err;
                    if (users.length) {
                        users.map((user) => {
                            tronWeb.trx
                                .getBalance(user.wallet_address)
                                .then((amount) => {
                                    tronWeb.setAddress(user.wallet_address);
                                    tronWeb.contract().at(s.wallet_addres).then((contract) => {
                                        contract.balanceOf(user.wallet_address).call().then((balance) => {
                                            getColdWallet(s.token_symbol).then((toAddress) => {
                                                //Creates an unsigned TRX transfer transaction
                                                contract.transfer(
                                                    toAddress,
                                                    Number(balance._hex)
                                                ).send({
                                                    feeLimit: 10000000
                                                }, user.private_key).then((receipt) => {
                                                    if (Number(balance._hex) > 0 && amount > 0) {
                                                        con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${user.wallet_address}' and wallet_type='${s.token_symbol}'`, function (err, resu) {
                                                            if (err) throw err;
                                                            con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${Number(balance._hex)}' WHERE wallet_address ='${toAddress}' and wallet_type='${s.token_symbol}'`, function (err, resul) {
                                                                if (err) throw err;
                                                                res.json({ status: 2, result: receipt });
                                                            });
                                                        });
                                                    }
                                                }).catch((e) => {
                                                    res.json({ status: -1, result: "failed to fetch receipt" });
                                                })
                                            }).catch((e) => {
                                                res.json({ status: -2, result: "fail to fetch address" });
                                            });
                                        }).catch((e) => {
                                            res.json({ status: -3, result: "fail to fetch balance" });
                                        })
                                    }).catch((e) => {
                                        res.json({ status: -4, result: "fail to fetch contract" });
                                    });
                                }).catch((e) => {
                                    res.json({ status: -4, result: "fail to fetch balance of TRX" });
                                })
                        });
                    } else {
                        res.json({ status: -5, result: "NOT HAVE USER" });
                    }
                });
        });
    });
}

async function transferBalanceTrc20(req, res) {
    con.query(`SELECT symbol, contract_address FROM suppoted_currency WHERE contract_type='trc20'`, function (err, result) {
        if (err) throw err;
        result.map((s) => {
            con.query(`SELECT * FROM wallets where wallet_type='${s.symbol}' and v_balanace>0`,
                function (err, users) {
                    if (err) throw err;
                    if (users.length) {
                        users.map((user) => {
                            tronWeb.trx
                                .getBalance(user.wallet_address)
                                .then((amount) => {
                                    tronWeb.setAddress(user.wallet_address);
                                    tronWeb.contract().at(s.contract_address).then((contract) => {
                                        contract.balanceOf(user.wallet_address).call().then((balance) => {
                                            getColdWallet(s.symbol).then((toAddress) => {
                                                //Creates an unsigned TRX transfer transaction
                                                contract.transfer(
                                                    toAddress,
                                                    Number(balance._hex)
                                                ).send({
                                                    feeLimit: 10000000
                                                }, user.private_key).then((receipt) => {
                                                    if (Number(balance._hex) > 0 && amount > 0) {
                                                        con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${user.wallet_address}' and wallet_type='${s.symbol}'`, function (err, resu) {
                                                            if (err) throw err;
                                                            con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${Number(balance._hex) / 1e6}' WHERE wallet_address ='${toAddress}' and wallet_type='${s.symbol}'`, function (err, resul) {
                                                                if (err) throw err;
                                                                res.json({ status: 2, result: receipt });
                                                            });
                                                        });
                                                    }
                                                }).catch((e) => {
                                                    res.json({ status: -1, result: "failed to fetch receipt" });
                                                })
                                            }).catch((e) => {
                                                res.json({ status: -2, result: "fail to fetch address" });
                                            });
                                        }).catch((e) => {
                                            res.json({ status: -3, result: "fail to fetch balance" });
                                        })
                                    }).catch((e) => {
                                        res.json({ status: -4, result: "fail to fetch contract" });
                                    });
                                }).catch((e) => {
                                    res.json({ status: -4, result: "fail to fetch balance trx" });
                                })
                        });
                    } else {
                        res.json({ status: -5, result: "NOT HAVE USER" });
                    }
                });
        });
    });
}

/******************End OF Transfer TRX *************/

/****************Transection Of BNB *****************/

app.post("/transferBalanceTokenBEP20", async function (req, res) {
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

    con.query(`SELECT wallet_addres,token_symbol FROM token where token_type='bep20'`, function (err, result) {
        if (err) throw err;
        result.map((s) => {
            // console.log(s.wallet_addres);
            let contract = new web3.eth.Contract(abi, s.wallet_addres);
            getColdWallet(s.token_symbol).then((toAddress) => {
                con.query(
                    `SELECT * FROM wallets where wallet_type='${s.token_symbol}' and v_balanace>0`,
                    function (err, users) {
                        if (err) throw err;
                        users.map((user) => {

                            // console.log(user.wallet_address);    
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
                                                        con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${user.wallet_address}' and wallet_type='${s.token_symbol}'`, function (err, result) {
                                                            if (err) throw err;
                                                            con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${(bal / decimal)}' WHERE wallet_address ='${toAddress}' and wallet_type='${s.token_symbol}'`, function (err, result) {
                                                                if (err) throw err;
                                                                res.json({ status: 1, result: receipt });
                                                            });
                                                        });
                                                    }).catch((e) => {
                                                        res.json({ status: 0, msg: e })
                                                    })
                                                }).catch((e) => {
                                                    res.json({ status: -1, msg: e })
                                                })



                                            }
                                        }).catch((e) => {
                                            res.json({ status: -2, msg: e, bal: decimal })
                                        });
                                }).catch(e => {
                                    res.json({ status: -3, msg: e })
                                })

                        });
                    });
            }).catch((e) => {
                res.json({ status: -5, msg: "toAddress not fetch" });
            })
        });
    });
});

app.post("/transferBalanceBNB", async function (req, res) {
    getColdWallet('BNB').then((toAddress) => {
        con.query(`SELECT * FROM wallets WHERE wallet_type='BNB' and v_balanace>0`,
            function (err, users) {
                if (err) throw err;
                if (users.length) {
                    users.map((s) => {
                        web3.eth
                            .getBalance(s.wallet_address)
                            .then((amount) => {
                                web3.eth.estimateGas({
                                    to: s.wallet_address
                                }).then((esgas) => {
                                    web3.eth.getGasPrice()
                                        .then((gasp) => {
                                            web3.eth.accounts.signTransaction(
                                                {
                                                    from: s.wallet_address,
                                                    to: toAddress,
                                                    value: (amount - (esgas * gasp)),
                                                    gas: esgas,
                                                },
                                                s.private_key
                                            ).then((createTransaction) => {
                                                // Deploy transaction
                                                web3.eth.sendSignedTransaction(
                                                    createTransaction.rawTransaction
                                                ).then((createReceipt) => {
                                                    con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${s.wallet_address}' and wallet_type='BNB'`, function (err, resu) {
                                                        if (err) throw err;
                                                        con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${(amount - (esgas * gasp)) / 1e18}' WHERE wallet_address ='${toAddress}' and wallet_type='BNB'`, function (err, resul) {
                                                            if (err) throw err;
                                                            res.json({ status: 1, result: createReceipt.transactionHash });
                                                        });
                                                    });
                                                }).catch((e) => {
                                                    res.json({ status: -1, result: e });
                                                })
                                            }).catch((e) => {
                                                res.json({ status: -2, result: e });
                                            })
                                        })
                                })
                            }).catch((e) => {
                                res.json({ status: -4, msg: "failed to get balance", err: e })
                            })
                    });
                } else {
                    res.json({ status: -5, result: "NOT HAVE fund" });
                }
            });
    });
});

app.get("/transferBalanceETH", async function (req, res) {
    getColdWallet('ETH').then((toAddress) => {
        con.query(`SELECT * FROM wallets WHERE wallet_type='ETH' and v_balanace>0`,
            function (err, users) {
                if (err) throw err;
                if (users.length) {
                    users.map((s) => {
                        web3Eth.eth
                            .getBalance(s.wallet_address)
                            .then((amount) => {
                                web3Eth.eth.estimateGas({
                                    to: s.wallet_address
                                }).then((esgas) => {
                                    web3Eth.eth.getGasPrice()
                                        .then((gasp) => {
                                            web3Eth.eth.accounts.signTransaction(
                                                {
                                                    from: s.wallet_address,
                                                    to: toAddress,
                                                    value: (amount - (esgas * gasp)),
                                                    gas: esgas,
                                                },
                                                s.private_key
                                            ).then((createTransaction) => {
                                                // Deploy transaction
                                                web3Eth.eth.sendSignedTransaction(
                                                    createTransaction.rawTransaction
                                                ).then((createReceipt) => {
                                                    con.query(`UPDATE wallets SET v_balanace=0 WHERE wallet_address ='${s.wallet_address}' and wallet_type='ETH'`, function (err, resu) {
                                                        if (err) throw err;
                                                        con.query(`UPDATE wallet_cold SET total_funds=total_funds+'${(amount - (esgas * gasp)) / 1e18}' WHERE wallet_address ='${toAddress}' and wallet_type='ETH'`, function (err, resul) {
                                                            if (err) throw err;
                                                            res.json({ status: 1, result: createReceipt.transactionHash });
                                                        });
                                                    });
                                                }).catch((e) => {
                                                    res.json({ status: -1, result: e });
                                                })
                                            }).catch((e) => {
                                                res.json({ status: -2, result: e });
                                            })
                                        })
                                })
                            }).catch((e) => {
                                res.json({ status: -4, msg: "failed to get balance", err: e })
                            })
                    });
                } else {
                    res.json({ status: -5, result: "NOT HAVE fund" });
                }
            });
    });
});

/**********************End Of BNB Transection ******************/

/************************update HOTWallet***********************/

app.post("/updateHOTWallet", async function (req, res) {
    const wallet_address = req.body.wallet_address;
    const wallet_type = req.body.wallet_type;
    const total_funds = req.body.balance;
    if (wallet_type == "BTT") {
        tronWeb.trx.getAccount(
            wallet_address
        ).then((bal) => {
            let d_bal = (bal.assetV2[0].value / 1e6);
            con.query(`UPDATE wallet_hot SET total_funds=${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='BTT'`, function (err, data) {
                res.json({ status: 1, msg: balance.assetV2[0].value });
            })

        }).catch((e) => {
            res.json({ status: 0, msg: "failed to fetch" });
        })


    } else if (wallet_type == "TRX") {
        tronWeb.trx
            .getBalance(wallet_address)
            .then((d) => {
                if (d > 0) {
                    let d_bal = (d / 1e6);
                    con.query(`UPDATE wallet_hot SET total_funds=${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='TRX'`, function (err, data) {
                        res.json({ status: 1, msg: data });
                    })
                } else {
                    res.json({ status: -1, msg: "Not have fund" });
                }
            }).catch((e) => {
                res.json({ status: 0, msg: "failed to fetch" });
            })

    } else if (wallet_type == "USDT") {

        tronWeb.setAddress(wallet_address);
        tronWeb
            .contract()
            .at("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")
            .then((contract) => {
                contract
                    .balanceOf(wallet_address)
                    .call()
                    .then((bal) => {
                        if (bal > 0) {
                            let d_bal = (Number(bal._hex) / 1e6);
                            con.query(`UPDATE wallet_hot SET total_funds=${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='USDT'`, function (err, data) {
                                res.json({ status: 1, msg: data });
                            })
                        } else {
                            res.json({ status: -1, result: "NOT have fund" });
                        }
                    })
                    .catch((e) => {
                        res.json({ status: 0, result: data });
                    });
            });


    } else if (wallet_type == "BNB") {
        web3.eth.getBalance(wallet_address).then((d) => {
            if (d > 0) {
                let d_bal = d / 1e18;
                // if (d_bal > 0) {
                con.query(
                    `UPDATE wallet_hot SET total_funds=${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='BNB'`,
                    function (err, data) {
                        if (err) throw err;
                        res.json({ status: 1, res: data });
                    });
                // } else {
                //     res.json({status:0, res:"Already upated"});
                // }
            } else {
                res.json({ status: -1, res: "Not have fund" });
            }
        }).catch(e => {
            res.json({ status: -2, res: e });
        })
    } else if (wallet_type == "ETH") {
        web3Eth.eth.getBalance(wallet_address).then((d) => {
            if (d > 0) {
                let d_bal = d / 1e18;
                con.query(
                    `UPDATE wallet_hot SET total_funds=${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='ETH'`,
                    function (err, data) {
                        if (err) throw err;
                        res.json({ status: 1, res: data });
                    });
            } else {
                res.json({ status: -1, res: "Not have fund" });
            }
        }).catch(e => {
            res.json({ status: -2, res: e });
        })
    } else if (wallet_type == "BTEX") {
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
        ];

        let contract = new web3.eth.Contract(abi, "0x9482747d8F9c07B740350547d2Ae34505A1C92cb");
        contract.methods
            .decimals().call().then(decimal => {
                decimal = Number(`1e${decimal}`);
                contract.methods
                    .balanceOf(wallet_address)
                    .call({ from: wallet_address })
                    .then((d) => {
                        if (d > 0) {
                            let d_bal = d / decimal;
                            con.query(
                                `UPDATE wallet_hot SET total_funds=${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='BTEX'`,
                                function (err, data) {
                                    if (err) console.log(err);
                                    res.json({ status: 1, res: data });
                                });
                        } else {
                            res.json({ status: -1, res: "Not have fund" });
                        }
                    })
                    .catch((e) => {
                        res.json({ status: -2, res: "Not fetch balance" });
                    });
            }).catch(e => {
                res.json({ status: -3, res: "Not have decimal" });
            })
    }
});




/************************end of hotWallet***********************/

/************BNB Deposit(amankumarp) ************/


// update All User wallet private key and wallet address

async function updateWallet(wallet_type) {
    await con.query(
        `SELECT user FROM wallets where wallet_type='${wallet_type}'`,
        async function (err, result) {
            if (err) throw err;
            let accou = await web3.eth.accounts.wallet.create(
                result.length,
                "bitbtf"
            );
            result.map(async (d, i) => {
                await con.query(
                    `UPDATE wallets SET private_key = '${accou[i].privateKey}' , wallet_address='${accou[i].address}' WHERE user='${d.user}' and wallet_type='${wallet_type}'`,
                    function (err, result) {
                        if (err) throw err;
                        // console.log(result);
                    }
                );
                // console.log(`UPDATE wallets SET private_key = '${accou[i].privateKey}', wallet_address='${accou[i].address}' WHERE user='${d.user}' and wallet_type='${wallet_type}'`);
            });
        }
    );
}

async function createBNBWallet(blockchain) {
    await con.query(
        `SELECT * FROM wallets where wallet_type='${blockchain}'`,
        async function (err, result) {
            if (err) throw err;
            result.map(async (d, i) => {
                await con.query(
                    `INSERT INTO wallets (private_key, wallet_address, wallet_type,user) VALUES ('${d.private_key}','${d.wallet_address}','BNB','${d.user}')`,
                    function (err, result) {
                        if (err) throw err;
                        console.log(result);
                    }
                );
            });
        }
    );
}

async function getBlockFromDB(blockchain) {
    return await con.query(
        `SELECT last_block FROM eventblocknumber where blockchain='${blockchain}'`,
        function (err, res) {
            if (err) throw err;
            return res.last_block;
        }
    );
}

function updateBlockINDB(blockchain, block, timestamp) {
    return new Promise(async (resolve, reject) => {
        await con.query(
            `UPDATE eventblocknumber SET last_block='${block}' , update_time = '${timestamp}' WHERE blockchain= '${blockchain}'`,
            function (err, res) {
                if (err) reject(err);
                else resolve(res);
            }
        );
    });
}

// async function checkBNBBalance() {
//   HDWalletProvider.prototype.on = BSC_WSS.on.bind(BSC_WSS);
//   const provider = new HDWalletProvider(
//     [
//       "2cb74fd90b518faa85c99cf315821e17eabda425b66b1d4cdb9297d55ffec1d1",
//       "d237be6932e4a5d7b716748b05574fd9c596ab7d4ba91defcf7e3064082fbac4",
//       "54accaa64e90dbb8152b19968f53db27c1364431291fd0d9ac1229fe8009a269",
//     ],
//     BSC_WSS
//   );

//   let web3 = new Web3(provider);
//   var wallets = [];
//   await web3.eth.getAccounts(function (error, result) {
//     wallets = result;
//     result.map((account) =>
//       web3.eth.getBalance(account, function (error, balance) {
//         if (error) console.log(error);
//         console.log("account", account, balance / 1e18);
//       })
//     );
//   });

// let block = await web3.eth.getBlock("latest");
// let number = block.number;
// let transactions = block.transactions;
// if (block != null && transactions != null) {
//   for (let txHash of block.transactions) {
//     let tx = await web3.eth.getTransaction(txHash);
//     if (wallets[0] == tx?.to?.toLowerCase()) {
//       console.log(tx);
//     }
//   }
// }
// }

app.post("/updateBalanceBNB", async function (req, res) {
    const wallet_address = req.body.wallet_address;
    const balance = req.body.balance;
    web3.eth.getBalance(wallet_address)
        .then((d) => {
            if (d > 0) {
                let d_bal = d / 1e18 - balance;
                if (d_bal > 0) {
                    con.query(
                        `UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='BNB'`,
                        function (err, data) {
                            if (err) throw (err);
                            res.json({ status: 1, msg: data });
                        });
                } else {
                    res.json({ status: 0, msg: d_bal });
                }
            } else {
                res.json({ status: -1, msg: d });
            }
        }).catch(e => {
            res.json({ status: 0, msg: e });
        })
});

// async function updateBalanceBNB(req,res){
//     con.query(
//       `SELECT * FROM wallets where wallet_type='BNB'`,
//       function (err, users) {
//         if (err) throw err;
//         users.map((user) => {
//               web3.eth.getBalance(user.wallet_address)
//               .then((d) => {
//                 if (d > 0) {
//                     let d_bal = d / 1e18 - user.v_balanace;

//                     if (d_bal > 0) {
//                       con.query(
//                         `UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${user.wallet_address}' and wallet_type='BNB'`,
//                         function (err, data) {
//                           if (err) console.log(err);
//                           res.json({status:1,msg:data});
//                         });
//                     }
//                 }
//             }).catch(e=>{
//               res.json({status:0,msg:e});
//             })
//         });
//       });
//     }

async function updateBalanceETH(req, res) {
    con.query(
        `SELECT * FROM wallets where wallet_type='ETH'`,
        function (err, users) {
            if (err) throw err;
            users.map((user) => {
                web3Eth.eth.getBalance(user.wallet_address)
                    .then((d) => {
                        if (d > 0) {
                            let d_bal = d / 1e18 - user.v_balanace;
                            if (d_bal > 0) {
                                con.query(
                                    `UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${user.wallet_address}' and wallet_type='ETH'`,
                                    function (err, data) {
                                        if (err) console.log(err);
                                        res.json({ status: 1, msg: data })
                                    });
                            }
                        }
                    }).catch(e => {
                        res.json({ status: -1, msg: e })
                    })
            });
        });
}

// async function updateBalanceTokenBEP20(req,res){
//   var abi = [
//     {
//       constant: true,
//       inputs: [{ name: "_owner", type: "address" }],
//       name: "balanceOf",
//       outputs: [{ name: "balance", type: "uint256" }],
//       payable: false,
//       stateMutability: "view",
//       type: "function",
//     },
//     {
//       constant: true,
//       inputs: [],
//       name: "decimals",
//       outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
//       payable: false,
//       stateMutability: "view",
//       type: "function",
//     },
//   ];
//     con.query(`SELECT wallet_addres,token_symbol FROM token where token_type='bep20'`,function (err,result){
//         if(err) throw err;
//       result.map((s) => {
//         // console.log(s.wallet_addres);
//         let contract = new web3.eth.Contract(abi, s.wallet_addres);
//         con.query(
//           `SELECT * FROM wallets where wallet_type='${s.token_symbol}'`,
//           function (err, users) {
//             if (err) throw err;
//             users.map((user) => {
//               // console.log(user.wallet_address);
//               contract.methods
//                 .decimals().call().then(decimal=>{
//                   decimal=Number(`1e${decimal}`);
//                   contract.methods
//                   .balanceOf(user.wallet_address)
//                   .call({ from: user.wallet_address })
//                   .then((d) => {
//                     if (d > 0) {
//                       con.query(
//                         `SELECT * FROM wallets WHERE wallet_address='${user.wallet_address}' and wallet_type='${s.token_symbol}'`,
//                         function (err, resu) {
//                           if (resu.length) {
//                             let d_bal = d / decimal -resu[0].v_balanace;
//                             if (d_bal > 0) {
//                               con.query(
//                                 `UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${user.wallet_address}' and wallet_type='${s.token_symbol}'`,
//                                 function (err, data) {
//                                   if (err) console.log(err);
//                                   res.json({status:1, msg:data})
//                                 }
//                               );
//                             }
//                           } else {
//                             con.query(
//                               `INSERT INTO wallets (private_key,wallet_address,wallet_type,user,balance,v_balanace) values ('${
//                                 user.private_key
//                               }','${user.wallet_address}','${s.token_symbol}','${
//                                 user.user
//                               }',${d / decimal},${d / decimal})`,
//                               function (err, data) {
//                                 if (err) console.log(err);
//                                 res.json({status:2, msg:data})
//                               }
//                             );
//                           }
//                         });
//                     }
//                   })
//                   .catch((e) => {
//                     res.json({status:0, msg:e})
//                   });
//                 }).catch(e=>{
//                   res.json({status:-1, msg:e})
//                 })

//             });
//           }
//         );
//       });
//     });
// }


app.post("/updateBalanceTokenBEP20", async function (req, res) {
    const wallet_address = req.body.wallet_address;
    const balance = req.body.balance;
    const contract_address = req.body.contract_address;
    const wallet_type = req.body.wallet_type;
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
    ];
    // console.log(s.wallet_addres);
    let contract = new web3.eth.Contract(abi, contract_address);
    // console.log(user.wallet_address);
    contract.methods
        .decimals().call().then(decimal => {
            decimal = Number(`1e${decimal}`);
            contract.methods
                .balanceOf(wallet_address)
                .call({ from: wallet_address })
                .then((d) => {
                    if (d > 0) {
                        let d_bal = d / decimal - balance;
                        if (d_bal > 0) {
                            con.query(
                                `UPDATE wallets SET balance = balance+${d_bal},v_balanace=v_balanace+${d_bal} WHERE wallet_address ='${wallet_address}' and wallet_type='${wallet_type}'`,
                                function (err, data) {
                                    if (err) console.log(err);
                                    res.json({ status: 1, msg: data })
                                });
                        } else {
                            res.json({ status: 0, msg: d_bal });
                        }
                    } else {
                        res.json({ status: -1, msg: d });
                    }
                })
                .catch((e) => {
                    res.json({ status: 0, msg: e })
                });
        }).catch(e => {
            res.json({ status: -1, msg: e })
        })


});

// app.post('/service/bnb', async function (req,res){
//     // updateBalanceBNB(req,res);
//     updateBalanceTokenBEP20(req,res);
//     // updateBalanceETH(req,res);
// });

app.post("/service/trx", async function (req, res) {
    await transferBalanceTrc10(req, res);
    await transferBalanceTrc20(req, res);
    await transferBalanceTRX(req, res);
});


// updateWallet('ETH');
// createBNBWallet('ETH');
/************************************************* END ***********************/
app.listen(3000);
 
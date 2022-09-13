/**
 * TxSE (Tradex Smart Engine)
 */
const WebsiteData = require('../models/website_data');
const BuyStack = require('../models/buy_stack');
const SellStack = require('../models/sell_stack');
const TradeHistory = require('../models/trade_history');
const Wallets = require('../models/wallets');
const { createUniqueID } = require('./functions');
const WALLET_UPDATE_LOG = './src/log/wallet_update.json';
const ORDER_UPDATE_LOG = './src/log/order_update.json';
const HISTORY_UPDATE_LOG = './src/log/history_update.json';
const DEFAULT_LOG = './src/log/log.json';
const WALLET_UPDATE_TXT_LOG = './src/log/wallet_update.txt';
const ORDER_UPDATE_TXT_LOG = './src/log/order_update.txt';
const HISTORY_UPDATE_TXT_LOG = './src/log/history_update.txt';
const DEFAULT_TXT_LOG = './src/log/log.txt';
const { round, add, sub, mul, div } = require('../utils/Math');
class TxSE {
    #_id;
    #user_id;
    #order_id;
    #currency;
    #compare_currency;
    #raw_price;
    #order_type;
    #volume;
    #total_executed;
    #order_direction;
    #taker_fee;
    #maker_fee;
    #opposit_orders;
    #opposit_locked_orders;
    #opposit_locked_orders_ids;
    // #updated_opposit_orders_ids;
    #trade_history;
    #self_wallet;
    #opposit_wallet;
    #last_reansaction;
    #order_status;
    #executed_from;
    #execution_time;

    constructor({
        _id,
        user_id,
        order_id,
        raw_price,
        volume,
        currency_type,
        compare_currency,
        order_type,
        total_executed,
        order_direction,
        last_reansaction,
        order_status,
        executed_from
    }) {
        this.#_id = _id;
        this.#user_id = user_id;
        this.#order_id = order_id;
        this.#currency = currency_type.toLowerCase();
        this.#compare_currency = compare_currency.toLowerCase();
        this.#raw_price = parseFloat(raw_price);
        this.#order_type = order_type;
        this.#volume = parseFloat(volume);
        this.#total_executed = parseFloat(total_executed);
        this.#last_reansaction = last_reansaction;
        this.#order_status = order_status;
        this.#executed_from = executed_from;
        this.#order_direction = order_direction.toLowerCase();
        this.#taker_fee = 0;
        this.#maker_fee = 0;
        this.#opposit_orders = [];
        this.#opposit_locked_orders = [];
        this.#opposit_locked_orders_ids = [];
        this.#trade_history = [];
        this.#self_wallet = {
            balance: 0,
            locked: 0,
        };
        this.#opposit_wallet = {};
        this.#execution_time = '';
    }

    // private methods

    async #setTakerFee() {
        // logic to calculate taker fee
        this.#taker_fee = 0;
        try {
            let ws = await WebsiteData.findOne({});
            this.#taker_fee = parseFloat(ws && ws.taker_fee ? ws.taker_fee : 0);
        } catch (error) {
            createTXTLog({ titel: 'Error from setTakerFee : ', error: error.message });
        }
    }
    async #setMakerFee() {
        // logic to calculate maker fee
        this.#maker_fee = 0;
        try {
            let ws = await WebsiteData.findOne({});
            this.#maker_fee = parseFloat(ws && ws.maker_fee ? ws.maker_fee : 0);
        } catch (error) {
            createTXTLog({ titel: 'Error from setMakerFee : ', error: error.message });
        }
    }
    #calculateTakerFee(totalValue) {
        return div(mul(totalValue, this.#taker_fee), 100);
    }
    #calculateMakerFee(totalValue) {
        return div(mul(totalValue, this.#maker_fee), 100);
    }
    async #setOppositOrders() {
        // get opposit orders for this order
        if (this.#order_direction == 'sell') {
            // get buy order list
            try {
                const buy_orders = await BuyStack.find({
                    currency_type: this.#currency,
                    compare_currency: this.#compare_currency,
                    order_status: 0,
                    raw_price: this.#raw_price,
                    order_type: this.#order_type,
                    lock: { $ne: true }
                });
                // console.log("buy_orders", buy_orders)
                this.#opposit_orders = buy_orders;
            } catch (error) {
                createTXTLog({ titel: 'Error from setOppositOrders 1: ', error: error.message });
            }
        } else if (this.#order_direction == 'buy') {
            // get sell order list
            try {
                const sell_orders = await SellStack.find({
                    currency_type: this.#currency,
                    compare_currency: this.#compare_currency,
                    order_status: 0,
                    raw_price: this.#raw_price,
                    order_type: this.#order_type,
                    lock: { $ne: true }
                });
                console.log("sell_orders", sell_orders, this.#currency, this.#compare_currency, 0, this.#raw_price, this.#order_type);
                this.#opposit_orders = sell_orders;
            } catch (error) {
                createTXTLog({ titel: 'Error from setOppositOrders 2: ', error: error.message });
            }
        } else {
            // invalid order direction
        }
    }
    async #lockSelf() {
        // lock current order
        if (this.#order_direction == 'sell') {
            try {
                await SellStack.updateOne({ order_id: this.#order_id }, {
                    $set: {
                        lock: true
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from lockSelf 1: ', error: error.message });
            }
        } else if (this.#order_direction == 'buy') {
            try {
                await BuyStack.updateOne({ order_id: this.#order_id }, {
                    $set: {
                        lock: true
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from lockSelf 2: ', error: error.message });
            }
        } else {
            // invalid order direction
        }
    }
    async #unlockSelf() {
        // lock current order
        if (this.#order_direction == 'sell') {
            try {
                await SellStack.updateOne({ order_id: this.#order_id }, {
                    $set: {
                        lock: false
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from unlockSelf 1: ', error: error.message });
            }
        } else if (this.#order_direction == 'buy') {
            try {
                await BuyStack.updateOne({ order_id: this.#order_id }, {
                    $set: {
                        lock: false
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from unlockSelf 2: ', error: error.message });
            }
        } else {
            // invalid order direction
        }
    }
    async #lockOppositOrders() {
        // find orders can be locked and lock them
        let volume = 0;
        let index = 0;
        while (volume < this.#volume && this.#opposit_orders[index] != undefined) {
            let order = this.#opposit_orders[index];
            volume = add(volume, order.volume);
            index++;
            this.#opposit_locked_orders_ids.push(order._id);
            this.#opposit_locked_orders.push(order);
        }
        if (this.#order_direction == 'sell') {
            try {
                await BuyStack.updateMany({ _id: { "$in": this.#opposit_locked_orders_ids } }, {
                    $set: {
                        lock: true
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from lockOppositOrders 1: ', error: error.message });
            }
        } else if (this.#order_direction == 'buy') {
            try {
                await SellStack.updateMany({ _id: { "$in": this.#opposit_locked_orders_ids } }, {
                    $set: {
                        lock: true
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from lockOppositOrders 2: ', error: error.message });
            }
        } else {
            // invalid order direction
        }
    }
    async #unlockOppositOrders() {
        // find orders can be locked and lock them
        if (this.#order_direction == 'sell') {
            try {
                await BuyStack.updateMany({ _id: { "$in": this.#opposit_locked_orders_ids } }, {
                    $set: {
                        lock: false
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from unlockOppositOrders 1: ', error: error.message });
            }
        } else if (this.#order_direction == 'buy') {
            try {
                await SellStack.updateMany({ _id: { "$in": this.#opposit_locked_orders_ids } }, {
                    $set: {
                        lock: false
                    }
                });
            } catch (error) {
                createTXTLog({ titel: 'Error from unlockOppositOrders 2: ', error: error.message });
            }
        } else {
            // invalid order direction
        }
    }
    #updateHistory(volume, opposit_order) {
        let history = {
            history_id: createUniqueID('history'),
            currency_type: this.#currency,
            compare_currency: this.#compare_currency,
            price: this.#raw_price,
            volume: parseFloat(volume),
            sell_user_id: this.#order_direction == 'sell' ? this.#user_id : opposit_order.user_id,
            buy_user_id: this.#order_direction == 'buy' ? this.#user_id : opposit_order.user_id,
            sell_order_id: this.#order_direction == 'sell' ? this.#order_id : opposit_order.order_id,
            buy_order_id: this.#order_direction == 'buy' ? this.#order_id : opposit_order.order_id,
            trade_type: this.#order_type,
            commition_fee: this.#taker_fee + '+' + this.#maker_fee,
            trade_date: Date.now()
        }
        this.#trade_history.push(history);
    }
    #updateSelfOrder(volume, status, user_id) {
        this.#total_executed = add(this.#total_executed, volume);
        this.#last_reansaction = this.#last_reansaction + "," + volume;
        this.#executed_from = this.#executed_from + "," + user_id;
        this.#order_status = status;
        this.#execution_time = this.#execution_time + ',' + Date.now();
    }
    #updatedOppositOrders(volume, opposit_order) {
        let total_executed = add(opposit_order.total_executed, volume);
        let main_volume = parseFloat(opposit_order.volume);
        // update object
        opposit_order.execution_time = opposit_order.execution_time + ',' + Date.now()
        opposit_order.total_executed = total_executed
        opposit_order.last_reansaction = opposit_order.last_reansaction + ',' + volume
        opposit_order.order_status = main_volume <= total_executed ? 1 : 0
        opposit_order.executed_from = opposit_order.executed_from + ',' + this.#user_id
    }
    #updateSelfWallet(volume) {
        // update self wallet state
        this.#self_wallet.balance = add(this.#self_wallet.balance, volume);
        this.#self_wallet.locked = add(this.#self_wallet.locked, volume);
    }
    #updateOppositWallet(volume, user_id) {
        let wallet = this.#opposit_wallet[user_id];
        if (wallet) {
            this.#opposit_wallet[user_id] = add(this.#opposit_wallet[user_id], volume);
        } else {
            this.#opposit_wallet[user_id] = (volume);
        }
        // console.log("wallet: ", this.#opposit_wallet)
    }
    async #createTradeHistory() {
        // create execution history
        try {
            await TradeHistory.insertMany(this.#trade_history);
            createTXTLog(this.#trade_history, HISTORY_UPDATE_TXT_LOG)
        } catch (error) {
            createTXTLog({ titel: 'Error from createTradeHistory 1: ', error: error.message });
        }
    }
    async #updateSelfMainWallet() {
        // update user wallet after execution 
        try {
            let currency_wallet = await Wallets.findOne({ user: this.#user_id, wallet_type: this.#currency.toUpperCase() }, 'balance user wallet_type locked');
            let compare_currency_wallet = await Wallets.findOne({ user: this.#user_id, wallet_type: this.#compare_currency.toUpperCase() }, 'balance user wallet_type locked');

            if (this.#order_direction == 'sell') {
                const bal_cc = sub(currency_wallet.balance, this.#self_wallet.balance);
                const mk_fee = this.#calculateMakerFee(this.#self_wallet.balance);
                let new_balance = sub(bal_cc, mk_fee)>0?sub(bal_cc, mk_fee):0; // subtract fee 
                let new_lock_balance = sub(currency_wallet.locked, this.#self_wallet.locked) > 0 ? sub(currency_wallet.locked, this.#self_wallet.locked) : 0;
                await Wallets.updateOne({ _id: currency_wallet._id }, {
                    $set: {
                        balance: new_balance,
                        locked: new_lock_balance
                    }
                })
                let compare_currency_change = mul(this.#self_wallet.balance, this.#raw_price)
                let new_balance_cc = add(compare_currency_wallet.balance, compare_currency_change);
                await Wallets.updateOne({ _id: compare_currency_wallet._id }, {
                    $set: {
                        balance: new_balance_cc
                    }
                })
                createTXTLog(this.#createHistoryObject(
                    currency_wallet,
                    compare_currency_wallet,
                    {
                        balance: new_balance,
                        locked: parseFloat(new_lock_balance.toFixed(8))
                    },
                    {
                        balance: new_balance_cc,
                        locked: parseFloat(compare_currency_wallet.locked.toFixed(8))

                    },
                    0, this.#calculateMakerFee(this.#self_wallet.balance),
                    0, 0,
                    'sell'
                ), WALLET_UPDATE_TXT_LOG)
            } else if (this.#order_direction == 'buy') {
                let new_balance = add(currency_wallet.balance, this.#self_wallet.balance);
                await Wallets.updateOne({ _id: currency_wallet._id }, {
                    $set: {
                        balance: new_balance,
                    }
                })
                let compare_currency_change = mul(this.#self_wallet.balance, this.#raw_price);
                const bal_cc = sub(compare_currency_wallet.balance, compare_currency_change);
                const tk_fee = this.#calculateTakerFee(compare_currency_change);
                let new_balance_cc = sub(bal_cc, tk_fee)>0?sub(bal_cc, tk_fee):0; // diduct fee
                let new_locked_cc = sub(compare_currency_wallet.locked, compare_currency_change) > 0 ? sub(compare_currency_wallet.locked, compare_currency_change) : 0;
                await Wallets.updateOne({ _id: compare_currency_wallet._id }, {
                    $set: {
                        balance: new_balance_cc,
                        locked: new_locked_cc
                    }
                })
                createTXTLog(this.#createHistoryObject(
                    currency_wallet,
                    compare_currency_wallet,
                    {
                        balance: new_balance,
                        locked: parseFloat(currency_wallet.locked.toFixed(8))
                    },
                    {
                        balance: new_balance_cc,
                        locked: parseFloat(new_locked_cc.toFixed(8))

                    },
                    0, 0,
                    this.#calculateTakerFee(compare_currency_change), 0,
                    'sell'
                ), WALLET_UPDATE_TXT_LOG)
            } else {
                // invalid order
            }
        } catch (error) {
            createTXTLog({ titel: 'Error from updateSelfMainWallet [parent]: ', error: error.message });
        }
    }
    async #updateSelfMainOrder() {
        // update order after execution or partial execution
        if (this.#order_direction == 'sell') {
            try {
                await SellStack.updateOne({ order_id: this.#order_id }, {
                    $set: {
                        execution_time: this.#execution_time,
                        total_executed: this.#total_executed,
                        last_reansaction: this.#last_reansaction,
                        order_status: this.#order_status,
                        executed_from: this.#executed_from
                    }
                })
                createTXTLog({
                    order_id: this.#order_id,
                    order_direction: this.#order_direction,
                    execution_time: this.#execution_time,
                    total_executed: this.#total_executed,
                    last_reansaction: this.#last_reansaction,
                    order_status: this.#order_status,
                    executed_from: this.#executed_from
                }, ORDER_UPDATE_TXT_LOG);
            } catch (error) {
                createTXTLog({ titel: 'Error from updateSelfMainOrder 1: ', error: error.message });
            }
        } else if (this.#order_direction == 'buy') {
            try {
                await BuyStack.updateOne({ order_id: this.#order_id }, {
                    $set: {
                        execution_time: this.#execution_time,
                        total_executed: this.#total_executed,
                        last_reansaction: this.#last_reansaction,
                        order_status: this.#order_status,
                        executed_from: this.#executed_from
                    }
                })
                createTXTLog({
                    order_id: this.#order_id,
                    order_direction: this.#order_direction,
                    execution_time: this.#execution_time,
                    total_executed: this.#total_executed,
                    last_reansaction: this.#last_reansaction,
                    order_status: this.#order_status,
                    executed_from: this.#executed_from
                }, ORDER_UPDATE_TXT_LOG)
            } catch (error) {
                createTXTLog({ titel: 'Error from updateSelfMainOrder 2: ', error: error.message });
            }
        } else {
            // invalid order
        }
    }
    #createHistoryObject(old_wallet, old_wallet_cc, new_wallet, new_wallet_cc, taker_fee, maker_fee, taker_fee_cc, maker_fee_cc, direction) {
        return {
            user_id: old_wallet.user,
            info: {
                direction: direction,
                currency: {
                    symbol: old_wallet.wallet_type,
                    balance: {
                        old: old_wallet.balance,
                        new: new_wallet.balance
                    },
                    locked: {
                        old: old_wallet.locked,
                        new: new_wallet.locked
                    },
                    fee: {
                        taker: taker_fee,
                        maker: maker_fee
                    }
                },
                comapre_currency: {
                    symbol: old_wallet_cc.wallet_type,
                    balance: {
                        old: old_wallet_cc.balance,
                        new: new_wallet_cc.balance
                    },
                    locked: {
                        old: old_wallet_cc.locked,
                        new: new_wallet_cc.locked
                    },
                    fee: {
                        taker: taker_fee_cc,
                        maker: maker_fee_cc
                    }
                },
            }
        }
    }
    async #updateOppositMainWallet() {
        // update user wallet after execution
        try {
            let opposit_c_main_wallet = await this.#getOppositCurrencyMainWallets();
            let opposit_cc_main_wallet = await this.#getOppositCompareCurrencyMainWallets();
            // console.log("opposit_c_main_wallet", opposit_c_main_wallet)
            // console.log("opposit_cc_main_wallet", opposit_cc_main_wallet)
            if (this.#order_direction == 'sell') {
                let q_c = [];
                let q_cc = [];
                let l_c = [];
                for (let i = 0; i < opposit_c_main_wallet.length; i++) {
                    let user_id = opposit_c_main_wallet[i].user;
                    let new_c_balance = add(opposit_c_main_wallet[i].balance, this.#opposit_wallet[user_id]);
                    let currency_obj = {
                        'updateOne': {
                            'filter': { _id: opposit_c_main_wallet[i]._id },
                            'update': {
                                balance: new_c_balance
                            },
                            'upsert': true
                        }
                    };
                    q_c.push(currency_obj);

                    let compare_currency_change = mul(this.#opposit_wallet[user_id], this.#raw_price);
                    let bal_cc = sub(opposit_cc_main_wallet[i].balance, compare_currency_change);
                    let tk_fee = this.#calculateTakerFee(compare_currency_change);
                    let new_cc_balance = sub(bal_cc, tk_fee)>0?sub(bal_cc, tk_fee):0; // diduct fee
                    let new_cc_locked = sub(opposit_cc_main_wallet[i].locked, compare_currency_change) > 0 ? sub(opposit_cc_main_wallet[i].locked, compare_currency_change) : 0;
                    let c_currency_obj = {
                        'updateOne': {
                            'filter': { _id: opposit_cc_main_wallet[i]._id },
                            'update': {
                                balance: new_cc_balance,
                                locked: new_cc_locked

                            },
                            'upsert': true
                        }
                    };
                    q_cc.push(c_currency_obj);
                    l_c.push(this.#createHistoryObject(
                        opposit_c_main_wallet[i],
                        opposit_cc_main_wallet[i],
                        {
                            balance: new_c_balance,
                            locked: parseFloat(opposit_c_main_wallet[i].locked.toFixed(8))
                        },
                        {
                            balance: new_cc_balance,
                            locked: parseFloat(new_cc_locked.toFixed(8))
                        },
                        0, 0,
                        this.#calculateTakerFee(compare_currency_change), 0,
                        'buy'
                    ))
                }
                // console.log(q_c, q_cc);
                let isUpdated = await this.#updateWalletByBulkWriter(q_c);
                let isUpdatedCC = await this.#updateWalletByBulkWriter(q_cc);
                createTXTLog(l_c, WALLET_UPDATE_TXT_LOG);
            } else if (this.#order_direction == 'buy') {
                let q_c = [];
                let q_cc = [];
                let l_c = [];
                for (let i = 0; i < opposit_c_main_wallet.length; i++) {
                    let user_id = opposit_c_main_wallet[i].user;
                    let bal_cc = sub(opposit_c_main_wallet[i].balance, this.#opposit_wallet[user_id]);
                    let mk_fee = this.#calculateMakerFee(this.#opposit_wallet[user_id]);
                    let new_c_balance = sub(bal_cc, mk_fee)>0?sub(bal_cc, mk_fee):0;
                    let new_c_locked = sub(opposit_c_main_wallet[i].locked, this.#opposit_wallet[user_id]) > 0 ? sub(opposit_c_main_wallet[i].locked, this.#opposit_wallet[user_id]) : 0;
                    let currency_obj = {
                        'updateOne': {
                            'filter': { _id: opposit_c_main_wallet[i]._id },
                            'update': {
                                balance: new_c_balance,
                                locked: new_c_locked
                            },
                            'upsert': true
                        }
                    };
                    q_c.push(currency_obj);

                    let compare_currency_change = mul(this.#opposit_wallet[user_id], this.#raw_price);
                    let new_cc_balance = add(opposit_cc_main_wallet[i].balance, compare_currency_change); // diduct fee
                    let c_currency_obj = {
                        'updateOne': {
                            'filter': { _id: opposit_cc_main_wallet[i]._id },
                            'update': {
                                balance: new_cc_balance,
                            },
                            'upsert': true
                        }
                    };
                    q_cc.push(c_currency_obj);
                    l_c.push(this.#createHistoryObject(
                        opposit_c_main_wallet[i],
                        opposit_cc_main_wallet[i],
                        {
                            balance: new_c_balance,
                            locked: parseFloat(new_c_locked.toFixed(8))
                        },
                        {
                            balance: new_cc_balance,
                            locked: parseFloat(opposit_cc_main_wallet[i].locked.toFixed(8))
                        },
                        0, this.#calculateMakerFee(this.#opposit_wallet[user_id]),
                        0, 0,
                        'sell'
                    ))
                }
                // console.log(q_c, q_cc);
                let isUpdated = await this.#updateWalletByBulkWriter(q_c);
                let isUpdatedCC = await this.#updateWalletByBulkWriter(q_cc);
                createTXTLog(l_c, WALLET_UPDATE_TXT_LOG);
            } else {
                // invalid order
            }
        } catch (error) {
            createTXTLog({ titel: 'Error from updateOppositMainWallet [parent]: ', error: error.message });
        }
    }
    async #updateWalletByBulkWriter(argument) {
        try {
            await Wallets.bulkWrite(argument);
            return true;
        } catch (error) {
            createTXTLog({ titel: 'Error from updateWalletByBulkWriter : ', error: error.message });
            return false;
        }
    }
    async #updateOppositOrderByBulkWriter(argument) {
        try {
            if (this.#order_direction == 'sell') {
                await BuyStack.bulkWrite(argument);
                return true;
            } else if (this.#order_direction == 'buy') {
                await SellStack.bulkWrite(argument);
                return true;
            } else {
                // invalid order
                return false;
            }
        } catch (error) {
            createTXTLog({ titel: 'Error from updateOppositOrderByBulkWriter : ', error: error.message });
            return false;
        }
    }
    async #updateOppositMainOrder() {
        // update order after execution or partial execution
        let order_q_bulk = [];
        let o_h = [];
        for (let i = 0; i < this.#opposit_locked_orders.length; i++) {
            let obj = {
                'updateOne': {
                    'filter': { _id: this.#opposit_locked_orders[i]._id },
                    'update': {
                        execution_time: this.#opposit_locked_orders[i].execution_time,
                        total_executed: this.#opposit_locked_orders[i].total_executed,
                        last_reansaction: this.#opposit_locked_orders[i].last_reansaction,
                        order_status: this.#opposit_locked_orders[i].order_status,
                        executed_from: this.#opposit_locked_orders[i].executed_from
                    },
                    'upsert': true
                }
            }
            order_q_bulk.push(obj);
            o_h.push({
                order_id: this.#opposit_locked_orders[i].order_id,
                order_direction: this.#order_direction,
                execution_time: this.#opposit_locked_orders[i].execution_time,
                total_executed: this.#opposit_locked_orders[i].total_executed,
                last_reansaction: this.#opposit_locked_orders[i].last_reansaction,
                order_status: this.#opposit_locked_orders[i].order_status,
                executed_from: this.#opposit_locked_orders[i].executed_from
            });
        }
        // update by bulk
        await this.#updateOppositOrderByBulkWriter(order_q_bulk);
        createTXTLog(o_h, ORDER_UPDATE_TXT_LOG);
    }
    async #getOppositCurrencyMainWallets() {
        let opposit_user_ids = Object.keys(this.#opposit_wallet);
        if (opposit_user_ids.length > 0) {
            try {
                let wallets = Wallets.find({ user: { $in: opposit_user_ids }, wallet_type: this.#currency.toUpperCase() });
                return wallets;
            } catch (error) {
                createTXTLog({ titel: 'Error from getOppositCurrencyMainWallets : ', error: error.message });
                return [];
            }
        } else {
            return [];
        }
    }
    async #getOppositCompareCurrencyMainWallets() {
        let opposit_user_ids = Object.keys(this.#opposit_wallet);
        if (opposit_user_ids.length > 0) {
            try {
                let wallets = Wallets.find({ user: { $in: opposit_user_ids }, wallet_type: this.#compare_currency.toUpperCase() });
                return wallets;
            } catch (error) {
                createTXTLog({ titel: 'Error from getOppositCompareCurrencyMainWallets : ', error: error.message });
                return [];
            }
        } else {
            return [];
        }
    }
    #executeOrder() {
        let remaining_volume = sub(this.#volume, this.#total_executed);
        let _r = this.#opposit_locked_orders.map((order) => {
            let executed_volume = 0;
            let volume = sub(order.volume, order.total_executed);
            if (remaining_volume > 0 && remaining_volume == volume) {
                executed_volume = add(executed_volume, volume);
                remaining_volume = sub(remaining_volume, volume);

                this.#updateSelfWallet(volume);
                this.#updateOppositWallet(volume, order.user_id);
                this.#updateSelfOrder(volume, 1, order.user_id);
                this.#updatedOppositOrders(volume, order);
                this.#updateHistory(volume, order);

            } else if (remaining_volume > 0 && remaining_volume < volume) {
                executed_volume = add(executed_volume, remaining_volume);

                this.#updateSelfWallet(remaining_volume);
                this.#updateOppositWallet(remaining_volume, order.user_id);
                this.#updateSelfOrder(remaining_volume, 1, order.user_id);
                this.#updatedOppositOrders(remaining_volume, order);
                this.#updateHistory(remaining_volume, order);

                remaining_volume = sub(remaining_volume, remaining_volume);

            } else if (remaining_volume > volume && volume > 0) {
                executed_volume = add(executed_volume, volume);
                remaining_volume = sub(remaining_volume, volume);

                this.#updateSelfWallet(volume);
                this.#updateOppositWallet(volume, order.user_id);
                this.#updateSelfOrder(volume, 0, order.user_id);
                this.#updatedOppositOrders(volume, order);
                this.#updateHistory(volume, order);

            } else {
                console.log("Invali volume: remaining volume: ", remaining_volume, order.volume);
            }
        });
    }

    // public methods  
    async executeOrder() {
        // update taker fee
        await this.#setTakerFee();
        // update maker fee
        await this.#setMakerFee();
        // lock self
        await this.#lockSelf();
        // set opposit orders
        await this.#setOppositOrders();
        // lock opposit orders
        await this.#lockOppositOrders();
        // execute order code
        this.#executeOrder();
        // update self wallet
        await this.#updateSelfMainWallet();
        // update opposit main wallet
        await this.#updateOppositMainWallet();
        // update self order
        await this.#updateSelfMainOrder();
        // update opposit orders
        await this.#updateOppositMainOrder();
        // create trade history
        await this.#createTradeHistory();
        // unlock lockd order
        await this.#unlockOppositOrders();
        // unlock self order
        await this.#unlockSelf();
        let a = await toString();
        console.log("unlockSelfaaaa: ", this.#_id, this.#user_id, this.#order_id, this.#currency, this.#compare_currency, this.#raw_price, this.#volume, this.#opposit_locked_orders, a);
    }
    async isExecuted() {
        console.log("Trade Data:", this);
        if (this.#total_executed > 0) {
            return {
                currency_type: this.#currency,
                compare_currency: this.#compare_currency,
                raw_price: this.#raw_price,
                volume: this.#total_executed,
                timestamp: Date.now()

            };
        } else {
            return undefined;
        }
    }
    async toString() {
        return {
            _id: this.#_id,
            user_id: this.#user_id,
            order_id: this.#order_id,
            currency: this.#currency,
            compare_currency: this.#compare_currency,
            raw_price: this.#raw_price,
            order_type: this.#order_type,
            volume: this.#volume,
            total_executed: this.#total_executed,
            order_direction: this.#order_direction,
            taker_fee: this.#taker_fee,
            maker_fee: this.#maker_fee,
            opposit_orders: this.#opposit_orders,
            opposit_locked_orders: this.#opposit_locked_orders,
            opposit_locked_orders_ids: this.#opposit_locked_orders_ids,
            // updated_opposit_orders_ids: this.#updated_opposit_orders_ids,
            trade_history: this.#trade_history,
            self_wallet: this.#self_wallet,
            opposit_wallet: this.#opposit_wallet,
            last_reansaction: this.#last_reansaction,
            order_status: this.#order_status,
            executed_from: this.#executed_from,
        }
    }
}

function createLog(d, filename) {
    try {
        const fs = require('fs');
        let file_name = filename ? filename : DEFAULT_LOG;
        var obj = {
            table: []
        };
        fs.exists(file_name, function (exists) {
            if (exists) {
                fs.readFile(file_name, 'utf8', function readFileCallback(err, data) {
                    if (err) {
                        console.log("Error in log: ", err)
                    } else {
                        // console.log("data", file_name, data, d)
                        if (data && d && d.length > 0) {
                            obj = JSON.parse(data); //now it an object
                            obj.table.push({ id: obj.table.length, log: d }); //add some data
                            let json = JSON.stringify(obj);
                            fs.writeFile(file_name, json, 'utf8', function (err) {
                                if (err) throw err;
                                console.log('complete');
                            });
                        } else if (d && ((Array.isArray(d) && d.length > 0) || (Object.keys(d).length > 0))) {
                            if (data) {
                                // obj = JSON.parse(data); //now it an object
                            }
                            obj.table.push({ id: obj.table.length, log: d }); //add some data
                            let json = JSON.stringify(obj);
                            fs.writeFile(file_name, json, 'utf8', function (err) {
                                if (err) throw err;
                                console.log('complete');
                            });
                        }
                    }
                });
            } else {
                console.log("file not exists");
                obj.table.push({ id: obj.table.length, log: d }); //add some data
                let json = JSON.stringify(obj);
                fs.writeFile(file_name, json, 'utf8', function (err) {
                    if (err) throw err;
                    console.log('complete');
                });
            }
        });
    } catch (error) {
        console.log("error in creating log: ", error.message);
    }
}

function createTXTLog(d, filename) {
    console.log("d: :d ", d, filename)
    // d = JSON.stringify(d);
    // try {
    //     const fs = require('fs');
    //     let file_name = filename ? filename : DEFAULT_TXT_LOG;
    //     var obj = '';
    //     fs.exists(file_name, function (exists) {
    //         if (exists) {
    //             fs.readFile(file_name, 'utf8', function readFileCallback(err, data) {
    //                 if (err) {
    //                     console.log("Error in log txt: ", err)
    //                 } else {
    //                     // console.log("data", file_name, data, d)
    //                     if (data && d && d.length > 0) {
    //                         // obj = JSON.parse(data); //now it an object
    //                         // obj.table.push({ id: obj.table.length, log: d }); //add some data
    //                         let dt = data + "*" + d; 
    //                         // let json = JSON.stringify(obj);
    //                         fs.writeFile(file_name, dt, 'utf8', function (err) {
    //                             if (err) throw err;
    //                             console.log('complete txt');
    //                         });
    //                     } else if (d) {
    //                         let dt = data?data:'' + "*" + d; 
    //                         fs.writeFile(file_name, dt, 'utf8', function (err) {
    //                             if (err) throw err;
    //                             console.log('complete txt');
    //                         });
    //                     }
    //                 }
    //             });
    //         } else {
    //             console.log("file not exists");
    //             let dt = "*" + d; 
    //             fs.writeFile(file_name, dt, 'utf8', function (err) {
    //                 if (err) throw err;
    //                 console.log('complete txt');
    //             });
    //         }
    //     });
    // } catch (error) {
    //     console.log("error in creating txt log: ", error.message);
    // }
}
module.exports = {
    TxSE,
    createLog,
    createTXTLog
}
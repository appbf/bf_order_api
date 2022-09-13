const { sendBalanceToUserWallet } = require("./function.wallets");
const { createSocketClient } = require("./functions.socket");
const { percent, sub, add, round } = require("./Math");
const { validateOrderId } = require("./validator");
const socket = createSocketClient('kujgwvfq-z-ghosttown-z-1fhhup0p6');


async function executeOrder(order, deepCheck = true) {
    const { calculateTakerFee, calculateMakerFee } = require('./functions');
    const isvalidorder = await verifieOrder(order, deepCheck);
    if (!isvalidorder) { return false; }
    if (order.order_status != 0) { return false; }
    let history_id = false;
    if (order.order_direction == 'sell') {
        const BuyStack = require('../models/buy_stack');
        try {
            const buy_orders = await BuyStack.find({ currency_type: { $regex: new RegExp(order.currency_type, "i") }, compare_currency: { $regex: new RegExp(order.compare_currency, "i") }, order_status: 0, raw_price: order.raw_price });
            if (buy_orders.length <= 0) { return false; }
            buy_orders.map(async (order_node) => {
                const available_volume = parseFloat(order.volume) - parseFloat(order.total_executed);
                if (available_volume > 0) {
                    const next_order_available_volume = parseFloat(order_node.volume) - parseFloat(order_node.total_executed);
                    if (next_order_available_volume == available_volume) {
                        // update both 
                        const taker_fee = calculateTakerFee(available_volume);
                        const maker_fee = calculateMakerFee(parseFloat(available_volume) * parseFloat(order.raw_price));
                        const history = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            price: order.raw_price,
                            volume: available_volume,
                            sell_user_id: order.user_id,
                            buy_user_id: order_node.user_id,
                            sell_order_id: order.order_id,
                            buy_order_id: order_node.order_id,
                            trade_type: order.order_type,
                            commition_fee: taker_fee + "+" + maker_fee
                        };
                        const seller_order_update_status = await updateOrder(order.order_id, available_volume, order_node.user_id, 'sell');
                        const buyer_order_update_status = await updateOrder(order_node.order_id, available_volume, order.user_id, 'buy');
                        const seller_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order.user_id, (parseFloat(available_volume)), order.raw_price, 'sub', parseFloat(maker_fee));
                        const buyer_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order_node.user_id, (parseFloat(available_volume)), order.raw_price, 'add', parseFloat(taker_fee));
                        // console.log("seller_wallet_update_status: ", seller_wallet_update_status);
                        // console.log("buyer_wallet_update_status: ", buyer_wallet_update_status);
                        // console.log("seller_order_update_status: ", seller_order_update_status);
                        // console.log("buyer_order_update_status: ", buyer_order_update_status);
                        history_id = await createOrderHistory(history);
                        let obj = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            raw_price: order.raw_price,
                            volume: available_volume,
                            timestamp: Date.now()
                        }
                        socket.emit("update_order_history", obj);
                        console.log("history_id: ", history_id);
                    } else if (next_order_available_volume > available_volume) {
                        // update self
                        const taker_fee = calculateTakerFee(next_order_available_volume);
                        const maker_fee = calculateMakerFee(parseFloat(next_order_available_volume) * parseFloat(order.raw_price));
                        const history = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            price: order.raw_price,
                            volume: available_volume,
                            sell_user_id: order.user_id,
                            buy_user_id: order_node.user_id,
                            sell_order_id: order.order_id,
                            buy_order_id: order_node.order_id,
                            trade_type: order.order_type,
                            commition_fee: taker_fee + "+" + maker_fee
                        };
                        const seller_order_update_status = await updateOrder(order.order_id, available_volume, order_node.user_id, 'sell');
                        const buyer_order_update_status = await updateOrder(order_node.order_id, available_volume, order.user_id, 'buy');
                        const seller_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order.user_id, (parseFloat(available_volume) - parseFloat(maker_fee)), order.raw_price, 'sub', parseFloat(maker_fee));
                        const buyer_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order_node.user_id, (parseFloat(available_volume) - parseFloat(taker_fee)), order.raw_price, 'add', parseFloat(taker_fee));

                        history_id = await createOrderHistory(history);
                        let obj = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            raw_price: order.raw_price,
                            volume: available_volume,
                            timestamp: Date.now()
                        }
                        socket.emit("update_order_history", obj);
                    } else if (next_order_available_volume < available_volume) {
                        // update him
                        const taker_fee = calculateTakerFee(available_volume);
                        const maker_fee = calculateMakerFee(parseFloat(available_volume) * parseFloat(order.raw_price));
                        const history = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            price: order.raw_price,
                            volume: next_order_available_volume,
                            sell_user_id: order.user_id,
                            buy_user_id: order_node.user_id,
                            sell_order_id: order.order_id,
                            buy_order_id: order_node.order_id,
                            trade_type: order.order_type,
                            commition_fee: taker_fee + "+" + maker_fee

                        };
                        const seller_order_update_status = await updateOrder(order.order_id, next_order_available_volume, order_node.user_id, 'sell');
                        const buyer_order_update_status = await updateOrder(order_node.order_id, next_order_available_volume, order.user_id, 'buy');
                        const seller_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order.user_id, (parseFloat(next_order_available_volume) - parseFloat(maker_fee)), order.raw_price, 'sub', parseFloat(maker_fee));
                        const buyer_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order_node.user_id, (parseFloat(next_order_available_volume) - parseFloat(taker_fee)), order.raw_price, 'add', parseFloat(taker_fee));

                        history_id = await createOrderHistory(history)
                        let obj = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            raw_price: order.raw_price,
                            volume: next_order_available_volume,
                            timestamp: Date.now()
                        }
                        socket.emit("update_order_history", obj);
                    }
                }
            })
        } catch (error) {
            console.log("Error: >from: utils> functions.orders > executeorder > try-sell (fetching buy stack): ", error.message);
            return false;
        }
    } else if (order.order_direction == 'buy') {
        const SellStack = require('../models/sell_stack');
        try {
            const sell_orders = await SellStack.find({ currency_type: { $regex: new RegExp(order.currency_type, "i") }, compare_currency: { $regex: new RegExp(order.compare_currency, "i") }, order_status: 0, raw_price: order.raw_price });
            if (sell_orders.length <= 0) { return false; }
            sell_orders.map(async (order_node) => {
                const available_volume = parseFloat(order.volume) - parseFloat(order.total_executed);
                if (available_volume > 0) {
                    const next_order_available_volume = parseFloat(order_node.volume) - parseFloat(order_node.total_executed);
                    if (next_order_available_volume == available_volume) {
                        // update both 
                        const taker_fee = calculateTakerFee(available_volume);
                        const maker_fee = calculateMakerFee(parseFloat(available_volume) * parseFloat(order.raw_price));
                        const history = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            price: order.raw_price,
                            volume: available_volume,
                            sell_user_id: order_node.user_id,
                            buy_user_id: order.user_id,
                            sell_order_id: order_node.order_id,
                            buy_order_id: order.order_id,
                            trade_type: order.order_type,
                            commition_fee: taker_fee + "+" + maker_fee
                        };
                        const seller_order_update_status = await updateOrder(order_node.order_id, available_volume, order.user_id, 'sell');
                        const buyer_order_update_status = await updateOrder(order.order_id, available_volume, order_node.user_id, 'buy');
                        const seller_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order_node.user_id, (parseFloat(available_volume) - parseFloat(maker_fee)), order.raw_price, 'sub', parseFloat(maker_fee));
                        const buyer_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order.user_id, (parseFloat(available_volume) - parseFloat(taker_fee)), order.raw_price, 'add', parseFloat(taker_fee));
                        // console.log("seller_wallet_update_status: ", seller_wallet_update_status);
                        // console.log("buyer_wallet_update_status: ", buyer_wallet_update_status);
                        // console.log("seller_order_update_status: ", seller_order_update_status);
                        // console.log("buyer_order_update_status: ", buyer_order_update_status);
                        history_id = await createOrderHistory(history);
                        let obj = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            raw_price: order.raw_price,
                            volume: available_volume,
                            timestamp: Date.now()
                        }
                        socket.emit("update_order_history", obj);
                        // console.log("history_id: ", history_id);
                    } else if (next_order_available_volume > available_volume) {
                        // update self
                        const taker_fee = calculateTakerFee(next_order_available_volume);
                        const maker_fee = calculateMakerFee(parseFloat(next_order_available_volume) * parseFloat(order.raw_price));
                        const history = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            price: order.raw_price,
                            volume: available_volume,
                            sell_user_id: order_node.user_id,
                            buy_user_id: order.user_id,
                            sell_order_id: order_node.order_id,
                            buy_order_id: order.order_id,
                            trade_type: order.order_type,
                            commition_fee: taker_fee + "+" + maker_fee
                        };
                        const seller_order_update_status = await updateOrder(order_node.order_id, available_volume, order.user_id, 'sell');
                        const buyer_order_update_status = await updateOrder(order.order_id, available_volume, order_node.user_id, 'buy');
                        const seller_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order_node.user_id, (parseFloat(available_volume) - parseFloat(maker_fee)), order.raw_price, 'sub', parseFloat(maker_fee));
                        const buyer_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order.user_id, (parseFloat(available_volume) - parseFloat(taker_fee)), order.raw_price, 'add', parseFloat(taker_fee));

                        history_id = await createOrderHistory(history);
                        let obj = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            raw_price: order.raw_price,
                            volume: available_volume,
                            timestamp: Date.now()
                        }
                        socket.emit("update_order_history", obj);

                    } else if (next_order_available_volume < available_volume) {
                        // update him
                        const taker_fee = calculateTakerFee(available_volume);
                        const maker_fee = calculateMakerFee(parseFloat(available_volume) * parseFloat(order.raw_price));
                        const history = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            price: order.raw_price,
                            volume: next_order_available_volume,
                            sell_user_id: order_node.user_id,
                            buy_user_id: order.user_id,
                            sell_order_id: order_node.order_id,
                            buy_order_id: order.order_id,
                            trade_type: order.order_type,
                            commition_fee: taker_fee + "+" + maker_fee

                        };
                        const seller_order_update_status = await updateOrder(order_node.order_id, next_order_available_volume, order.user_id, 'sell');
                        const buyer_order_update_status = await updateOrder(order.order_id, next_order_available_volume, order_node.user_id, 'buy');
                        const seller_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order_node.user_id, (parseFloat(next_order_available_volume) - parseFloat(maker_fee)), order.raw_price, 'sub', parseFloat(maker_fee));
                        const buyer_wallet_update_status = await sendBalanceToUserWallet(order.currency_type, order.compare_currency, order.user_id, (parseFloat(next_order_available_volume) - parseFloat(taker_fee)), order.raw_price, 'add', parseFloat(taker_fee));

                        history_id = await createOrderHistory(history)
                        let obj = {
                            currency_type: order.currency_type,
                            compare_currency: order.compare_currency,
                            raw_price: order.raw_price,
                            volume: next_order_available_volume,
                            timestamp: Date.now()
                        }
                        socket.emit("update_order_history", obj);
                    }
                } 
            })
        } catch (error) {
            console.log("Error: >from: utils> functions.orders > executeorder > try-sell (fetching buy stack): ", error.message);
            return false;
        }
    } else { return false; }
    return true;
}
async function verifieOrder(order, deepCheck = true) {
    // const SellStack = require('../models/sell_stack');
    try {
        const { order_id,
            user_id,
            currency_type,
            compare_currency,
            execution_time,
            total_executed,
            last_reansaction,
            executed_from,
            order_type,
            order_directon,
            volume,
            raw_price,
            order_status } = order;
            console.log("data")
        if (!await validateOrderId(order_id, order_type, deepCheck)) {
            return false;
        }
        console.log("data1")
        if (deepCheck) {
            const { validateCurrency, validateAmount, validatePrice, validateUserId } = require('../utils/validator');
            if (!validateUserId(user_id)) { return false; }
            if (!validateAmount(volume)) { return false; }
            if (!validatePrice(raw_price)) { return false; }
            if (!validateCurrency(currency_type)) { return false; }
            if (!validateCurrency(compare_currency)) { return false; }
            if (order_directon != 'sell' && order_directon != 'buy') { return false; }
            return true;
        }
        if (total_executed >= volume) { return false; }
    } catch (error) {
        console.log("Error: >from: utils> functions.orders > verifieOrder > try-parent (export variable and more): ", error.message);
        return false;
    }
    console.log("data2")
    return true;
}
async function createOrderHistory(history) {
    const TradeHistory = require('../models/trade_history');
    const SupportedCurrency = require('../models/suppoted_currency');
    const { createUniqueID } = require("./functions");
    const history_id = createUniqueID('history');
    try {
        const trade_date = Date.now();
        const { currency_type, compare_currency, price, volume, sell_user_id, buy_user_id, sell_order_id, buy_order_id, trade_type, commition_fee } = history;
        const history_token = await TradeHistory.create({
            history_id, currency_type, compare_currency, price, volume, sell_user_id, buy_user_id, sell_order_id, buy_order_id, trade_type, trade_date, commition_fee
        });
        /**
         * update current price of coin in supported currency (in compare of inr)
         */
         console.log(compare_currency, currency_type, "update balance after execute transaction")
        if (compare_currency.toUpperCase() == "INR") {
            await SupportedCurrency.updateOne({ symbol: currency_type.toUpperCase() }, {
                $set: {
                    inr_price: price
                }
            })
        }
    } catch (error) {
        console.log("Error: >from: utils> functions.orders > updateOrderHistory > try-extract and insert (fetching buy stack): ", error.message);
        return false;
    }
    return history_id;
}
async function updateOrder(order_id, total_executed, executed_from, order_direction) {
    if (order_direction == 'sell') {
        try {
            const SellStack = require('../models/sell_stack');
            const order = await SellStack.findOne({ order_id: order_id });
            const new_total_executed = parseFloat(order.total_executed) + parseFloat(total_executed);
            const new_status = order.volume == new_total_executed ? 1 : 0;
            const new_last_transaction = order.last_reansaction + ',' + total_executed;
            const new_execution_time = order.execution_time + ',' + Date.now();
            const new_executed_from = order.executed_from + ',' + executed_from;

            await SellStack.updateOne({ order_id: order_id }, {
                $set: {
                    order_status    : new_status,
                    total_executed  : new_total_executed,
                    last_transaction: new_last_transaction,
                    execution_time  : new_execution_time,
                    executed_from   : new_executed_from
                }
            }) 
            return true;
        } catch (error) {
            console.log("Error: >from: utils> functions.orders > updateOrder > try-extract and insert (fetching buy stack): ", error.message);
            return false;
        }
    } else if (order_direction == 'buy') {
        try {
            const BuyStack = require('../models/buy_stack');
            const order = await BuyStack.findOne({ order_id: order_id });
            const new_total_executed = parseFloat(order.total_executed) + parseFloat(total_executed);
            const new_status = order.volume == new_total_executed ? 1 : 0;
            const new_last_transaction = order.last_reansaction + ',' + total_executed;
            const new_execution_time = order.execution_time + ',' + Date.now();
            const new_executed_from = order.executed_from + ',' + executed_from;

            await BuyStack.updateOne({ order_id: order_id }, {
                $set: {
                    order_status: new_status,
                    total_executed: new_total_executed,
                    last_transaction: new_last_transaction,
                    execution_time: new_execution_time,
                    executed_from: new_executed_from
                }
            })
            return true;
        } catch (error) {
            console.log("Error: >from: utils> functions.orders > updateOrder > try-extract and insert (fetching buy stack): ", error.message);
            return false;
        }
    } else {
        return false;
    }
}
async function getMinMaxOrderPrice(raw_price, currency_type, compare_currency) {
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        if (currency_type && compare_currency && raw_price) {
            let price = round(raw_price);
            if (price > 0) {
                let currency_info = await SupportedCurrency.findOne({ symbol: currency_type.toUpperCase() }, "inr_price usdt_price btc_price vrx_price order_high_limit order_low_limit capping_price_inr capping_price_usdt capping_price_btc capping_price_vrx");
                if (currency_info) {
                    let old_price = compare_currency.toUpperCase() == 'INR' ? currency_info.inr_price :
                        compare_currency.toUpperCase() == 'BTC' ? currency_info.btc_price :
                            compare_currency.toUpperCase() == 'USDT' ? currency_info.usdt_price :
                                compare_currency.toUpperCase() == 'BTEX' ? currency_info.vrx_price : 0;
                    let capping_price = compare_currency.toUpperCase() == 'INR' ? currency_info.capping_price_inr :
                        compare_currency.toUpperCase() == 'BTC' ? currency_info.capping_price_btc :
                            compare_currency.toUpperCase() == 'USDT' ? currency_info.capping_price_usdt :
                                compare_currency.toUpperCase() == 'BTEX' ? currency_info.capping_price_vrx : 0;
                    let lowest_limit_percentage = currency_info.order_low_limit ? currency_info.order_low_limit : 0;
                    let highest_limit_percentage = currency_info.order_high_limit ? currency_info.order_high_limit : 0;
                    // console.log("lowest_limit_percentage: ", lowest_limit_percentage, lowest_limit_percentage != 0 ? old_price : price)
                    // console.log("highest_limit_percentage: ", highest_limit_percentage, highest_limit_percentage != 0 ? old_price : price)
                    let low_extension = percent(lowest_limit_percentage != 0 ? capping_price : price, lowest_limit_percentage);
                    let high_extension = percent(highest_limit_percentage != 0 ? old_price : price, highest_limit_percentage);
                    // console.log("low_extension: ", low_extension)
                    // console.log("high_extension: ", high_extension)
                    let lowest_price = sub(lowest_limit_percentage != 0 ? capping_price : price, low_extension);
                    let highest_price = add(highest_limit_percentage != 0 ? old_price : price, high_extension);
                    // console.log("lowest_price: ", lowest_price)
                    // console.log("highest_price: ", highest_price)
                    return {
                        lowest_price,
                        highest_price,
                        // capping_price: currency_info.capping_price ? round(currency_info.capping_price) : 0
                    }
                } else {
                    return {
                        lowest_price: 0,
                        highest_price: 0,
                        // capping_price: 0
                    }
                }
            } else {
                return {
                    lowest_price: 0,
                    highest_price: 0,
                    // capping_price: 0
                };
            }
        } else {
            return {
                lowest_price: 0,
                highest_price: 0,
                // capping_price: 0
            };;
        }
    } catch (error) {
        console.log("Error in minimum order validation: ", error.message);
        return {
            lowest_price: 0,
            highest_price: 0,
            // capping_price: 0
        };;
    }
}
module.exports = {
    executeOrder,
    getMinMaxOrderPrice
}
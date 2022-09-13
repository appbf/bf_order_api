
async function getAllCurrenciesWithRemoteTradeingOn() {
    console.log("Called 2")
    const RemoteTrading = require('../models/remote_trading');
    try {
        const c = await RemoteTrading.find({ status: true });
        if (c && c.length > 0) {
            return c;
        } else {
            return [];
        }
    } catch (error) {
        console.log("Error: in getAllCurrenciesWithRemoteTradeingOn (index:547)", error.message)
        return [];
    }
}

async function createRemoteTrading(list, socket) {
    console.log("Called 3")

    /**
     * ~ Iterate on each coin and create
     */

    try {
        await createBotTrade(list, 0, socket);
    } catch (error) {
        console.log("Error: in createRemoteTrading (index:547)", error.message)
    }
}

async function createBotTrade(arr, index, socket) {
    console.log("Called 4", index);
    const { updateGraphData } = require('../utils/functions.chart');
    const { updateTokenPriceAfterTrade } = require('../utils/functions');
    try {
        if (arr.length > index) {
            let cur = arr[index];
            let last_data = await getGraphLastState(cur.currency_type, cur.compare_currency);
            let high = cur.high;
            let low = cur.low;

            let price = 0;
            let const_v = 1;
            if (last_data) {
                price = last_data.last_c;
            } else {
                let prc = await getTokenCurrentPrice(cur.currency_type, cur.compare_currency);
                price = prc;
            }
            if (price && price != 0) {
                var dice = [];
                let P = 50;
                for (let i = 0; i < 100; i++) {
                    if (i >= 100 - P) {
                        dice.push(1);
                    } else {
                        dice.push(-1);
                    }
                }
                var change = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                let new_dir = dice.random();
                let new_noise = change.random();
                let new_price = price + (new_dir * ((new_noise * price) / 100));
                new_price = parseFloat(new_price.toFixed(8)) <= 0 ? price - (new_dir * ((new_noise * price) / 100)) : new_price;
                if (low && low > 0 && new_price < low) {
                    new_price = price - (new_dir * ((new_noise * price) / 100));
                }
                if (high && high > 0 && new_price > high) {
                    new_price = price - (new_dir * ((new_noise * price) / 100));
                }
                let new_v = const_v / new_price;
                // new_v = parseFloat(new_price.toFixed(5)) == 0 ? last_v - (new_v_dir * ((new_v_change * last_v) / 100)) : new_v;
                console.log("new V1", new_noise)
                let ob = {
                    currency_type: cur.currency_type.toLowerCase(),
                    compare_currency: cur.compare_currency.toLowerCase(),
                    raw_price: parseFloat(new_price.toFixed(4)),
                    volume: new_v,
                    timestamp: new Date().getTime()
                }
                // console.log('update_order_history: ', ob);
                socket.emit("update_order_history", ob);
                await updateGraphData(cur.currency_type, cur.compare_currency, parseFloat(new_price.toFixed(4)), parseFloat(new_v));
                console.log("Currency : >>>", cur)
                if (cur.update_price == true) {
                    await updateTokenPriceAfterTrade(cur.currency_type, cur.compare_currency, parseFloat(new_price));
                }
                await createBotTrade(arr, index + 1, socket);
                return true;
            } else {
                await createBotTrade(arr, index + 1, socket);
                return true;
            }
        } else {
            return undefined;
        }
    } catch (error) {
        console.log("Error: in createBotTrade (index:547)", error.message);
        return undefined;
    }
}
async function getGraphLastState(currency_type, compare_currency) {
    console.log("Called 5")
    try {
        const graph_data = require('../json/ohlc_custom.json');
        if (graph_data && currency_type && compare_currency) {
            let key = currency_type.toUpperCase() + compare_currency.toUpperCase();
            let chart_data = graph_data[key];
            if (chart_data) {
                let o = chart_data['o'];
                let h = chart_data['h'];
                let l = chart_data['l'];
                let c = chart_data['c'];
                let v = chart_data['v'];
                let t = chart_data['t'];
                let s = chart_data['s'];
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
                    return {
                        last_o,
                        last_h,
                        last_l,
                        last_c,
                        last_v,
                        last_t
                    }
                }
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    } catch (error) {
        console.log("Error: in getGraphLastState (index:547)", error.message);
        return undefined;
    }
}
async function getTokenCurrentPrice(currency_type, compare_currency) {
    console.log("Called 6")
    const SupportedCurrency = require('../models/suppoted_currency');
    try {
        let dt = await SupportedCurrency.findOne({ symbol: currency_type.toUpperCase() });
        if (dt) {
            if (compare_currency == 'BTC') {
                return dt.btc_price;
            } else if (compare_currency == 'USDT') {
                return dt.usdt_price;
            } else if (compare_currency == 'INR') {
                return dt.inr_price;
            } else if (compare_currency == 'BTEX') {
                return dt.vrx_price;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } catch (error) {
        console.log("Error: in getTokenCurrentPrice (index:547)", error.message);
        return 0;
    }
}
Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

module.exports = {
    getAllCurrenciesWithRemoteTradeingOn,
    createRemoteTrading
}
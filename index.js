const express = require("express");
const app = express();
const env = require("dotenv");
const cors = require("cors");
const fileupload = require("express-fileupload");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const userRoutes = require("./src/router/auth");
const userDataRoute = require("./src/router/user");
const currencyRoutes = require("./src/router/Currency");
const orderRoutes = require("./src/router/orders");
const tradeRoutes = require("./src/router/history");
const testing = require("./src/router/testing");
const chart = require("./src/router/chart");
const hello = require("./src/router/hello");
const wallets = require("./src/router/wallets");
const settings = require("./src/router/settings");
const banking = require("./src/router/banking");
const kyc = require("./src/router/kyc");
const website = require("./src/router/website");
const History = require("./src/models/deposite_history");
const { createSocketClient } = require("./src/utils/functions.socket");
const { updateTokenPriceAfterTrade } = require("./src/utils/functions");
const { round, add, sub, mul, div } = require("./src/utils/Math");
const socket = createSocketClient("kujgwvfq-z-ghosttown-z-1fhhup0p6");
env.config();

/* mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.jcbia.mongodb.net/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Database Connected");
  }); */
mongoose
  .connect(
    `mongodb+srv://bff:3RrqJmAriP0oho3h@cluster0.cyzi1wv.mongodb.net/bitbtf?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Database Connected");
  });

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(fileupload({}));
// app.use(express.static('public'));
app.use("/images", express.static(__dirname + "/src/d/images"));
// API
// app.use('/api', userRoutes);
// app.use('/api', userDataRoute);
// app.use('/app', userDataRoute);
// app.use('/api', currencyRoutes)
app.use("/api", orderRoutes);
// app.use('/api', orderRoutes);
// app.use('/api', tradeRoutes);
// app.use('/api', testing);
app.use("/api", chart);
// app.use('/api', hello);
// app.use('/api', wallets);
// app.use('/api', settings);
// app.use('/api', kyc);
// app.use('/api', banking);
app.use("/api", website);

app.listen(5000, () => {
  console.log(`server is running on port 5000`);
});

/**
 * graph data store for tokens Server Code
 */
// render a chart (dump data into json file)
var isfirstTime = true;
var chart_last_time = Date.now();
const chart_interval = 60 * 1; //60 seconds
var is_tokenstored = false;
setInterval(async () => {
  if ((Date.now() - chart_last_time) / 1000 >= chart_interval || isfirstTime) {
    isfirstTime = false;
    chart_last_time = Date.now();
    await geTChartdata();
  }

  // }, 24*60*60*1000 )
}, 6000); // 6 second

async function geTChartdata() {
  const SupportedCurrency = require("./src/models/suppoted_currency");
  try {
    const supported_currency = await SupportedCurrency.find(
      { token_type: { $ne: "self" } },
      "symbol"
    );
    const supported_token = await SupportedCurrency.find(
      { token_type: { $eq: "self" } },
      "symbol inr_price usdt_price btc_price vrx_price"
    );
    var currency_type = supported_currency.map((d) => {
      return d.symbol;
    });
    // console.log("supported_token", supported_token);
    var token_type = supported_token.map((d) => {
      return {
        symbol: d.symbol,
        inr_price: d.inr_price,
        usdt_price: d.usdt_price,
        btc_price: d.btc_price,
        vrx_price: d.vrx_price,
      };
    });
    const index_of_inr = currency_type.indexOf("INR");
    // console.log('currency_type: ',currency_type)
    if (index_of_inr > -1) {
      currency_type.splice(index_of_inr, 1);
    }
    // console.log("currency_type: ", currency_type);
    await storeOHLC(currency_type, "1h");
    if (!is_tokenstored) {
      is_tokenstored = true;
      // setTimeout(async() => {
      //     await storeTokenOHLC(token_type);
      // }, 5000);
    }
    console.log("chart_data_updated: ", new Date().toLocaleString());
  } catch (error) {
    console.log("Error in chart updatetion: ", error.message);
  }
}
async function storeTokenOHLC(currency_type) {
  try {
    var fs = require("fs");
    console.log("storeTokenOHLC");
    let final_ohlc = await getTokenOHLCData(currency_type);
    console.log("storeTokenOHLC: final_ohlc");
    var json = JSON.stringify(final_ohlc);
    if (final_ohlc) {
      fs.writeFile(
        __dirname + `/src/json/ohlc_custom.json`,
        json,
        "utf8",
        (d) => {
          console.log(d);
        }
      );
    }
  } catch (error) {
    console.log("Error in storeTokenOHLC: ", error);
  }
}
async function storeOHLC(currency_type, duration) {
  try {
    var fs = require("fs");
    let currency_type_chunk_1 = currency_type.slice(0, 3);
    let ohlc1 = await getOHLCData(currency_type_chunk_1, duration);
    let currency_type_chunk_2 = currency_type.slice(3, 6);
    let ohlc2 = await getOHLCData(currency_type_chunk_2, duration);
    let currency_type_chunk_3 = currency_type.slice(6, 9);
    let ohlc3 = await getOHLCData(currency_type_chunk_3, duration);
    let currency_type_chunk_4 = currency_type.slice(9, 12);
    let ohlc4 = await getOHLCData(currency_type_chunk_4, duration);
    let currency_type_chunk_5 = currency_type.slice(12, 15);
    let ohlc5 = await getOHLCData(currency_type_chunk_5, duration);
    let currency_type_chunk_6 = currency_type.slice(15, 18);
    let ohlc6 = await getOHLCData(currency_type_chunk_6, duration);
    ohlc1 = ohlc1 ? ohlc1 : {};
    ohlc2 = ohlc2 ? ohlc2 : {};
    ohlc3 = ohlc3 ? ohlc3 : {};
    ohlc4 = ohlc4 ? ohlc4 : {};
    ohlc5 = ohlc5 ? ohlc5 : {};
    ohlc6 = ohlc6 ? ohlc6 : {};
    let final_ohlc = {
      ...ohlc1,
      ...ohlc2,
      ...ohlc3,
      ...ohlc4,
      ...ohlc5,
      ...ohlc6,
    };
    var json = JSON.stringify(final_ohlc);
    fs.writeFile(
      __dirname + `/src/json/ohlc_${duration}.json`,
      json,
      "utf8",
      (d) => {
        console.log(d);
      }
    );
  } catch (error) {
    console.log("Error in storeOHLC: ", error.message);
  }
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
async function getTokenOHLCData(currency_type) {
  const ohlc_1h = require("./src/json/ohlc_1h.json");
  // console.log("token currency_type : ", currency_type)
  // const ohlc_1h = JSON.parse(fs.readFileSync(dirname, 'utf8'));
  const _ci = ["XLMINR", "TRXINR", "DASHINR", "XEMINR"];
  const _cu = ["XLMUSDT", "TRXUSDT", "DASHUSDT", "XEMUSDT"];
  const _cb = ["XLMBTC", "TRXBTC", "DASHBTC", "XEMBTC"];
  const _cx = ["XLMBTEX", "TRXBTEX", "DASHBTEX", "XEMBTEX"];
  try {
    if (
      currency_type &&
      Array.isArray(currency_type) &&
      currency_type.length > 0
    ) {
      let graph_data = {};
      let resp = currency_type.map(async (c1) => {
        let c = c1.symbol;
        let price = 5;
        // console.log("Abcd: ", c1);
        let pricei = c1.inr_price;
        let priceu = c1.usdt_price;
        let priceb = c1.btc_price;
        let pricex = c1.vrx_price;
        let keyi = c.toUpperCase() + "INR";
        let keyu = c.toUpperCase() + "USDT";
        let keyb = c.toUpperCase() + "BTC";
        let keyx = c.toUpperCase() + "BTEX";
        let randome_index = getRandomInt(4);
        let ki = _ci[randome_index];
        let ku = _cu[randome_index];
        let kb = _cb[randome_index];
        let kx = _ci[randome_index];
        let chart_datai = ohlc_1h[ki];
        let chart_datau = ohlc_1h[ku];
        let chart_datab = ohlc_1h[kb];
        let chart_datax = ohlc_1h[kx];
        // console.log("chart_datax: ", kx, randome_index);
        let uchart_datai = await convertOHLCprice(
          chart_datai,
          pricei,
          c + "inr"
        );
        let uchart_datau = await convertOHLCprice(
          chart_datau,
          priceu,
          c + "usdt"
        );
        let uchart_datab = await convertOHLCprice(
          chart_datab,
          priceb,
          c + "btc"
        );
        let uchart_datax = await convertOHLCprice(chart_datax, pricex, c + "x");
        graph_data[keyi] = uchart_datai;
        graph_data[keyu] = uchart_datau;
        graph_data[keyb] = uchart_datab;
        graph_data[keyx] = uchart_datax;
        /**
         *
         */
      });
      let rslt = await Promise.all(resp);
      return graph_data;
    } else {
      return undefined;
    }
  } catch (error) {
    console.log("Error in getTokenOHLCData: ", error);
    return undefined;
  }
}
async function convertOHLCprice(data, price, t) {
  if (data && data["o"] && data["h"] && data["l"] && data["c"]) {
    let o = data["o"];
    let h = data["h"];
    let l = data["l"];
    let c = data["c"];
    if (o && o.length > 0) {
      let xo = o[o.length - 1];
      let xh = h[h.length - 1];
      let xl = l[l.length - 1];
      let xc = c[c.length - 1];
      let a = price;
      let ohlc = {
        o: [],
        h: [],
        l: [],
        c: [],
      };
      // console.log("open: ", a, o[0], xo, t);
      let updated_d = o.map(async (d, i) => {
        let yo = d;
        let yh = h[i];
        let yl = l[i];
        let yc = c[i];
        let bo = (a * yo) / xo;
        let bh = (a * yh) / xh;
        let bl = (a * yl) / xl;
        let bc = (a * yc) / xc;
        // console.log(bo, a, yo, xo);
        ohlc["o"].push(bo);
        ohlc["h"].push(bh);
        ohlc["l"].push(bl);
        ohlc["c"].push(bc);
        return "hi";
      });
      let _d = await Promise.all(updated_d);
      let dta = {
        o: [],
        h: [],
        l: [],
        c: [],
        v: [],
        t: [],
        s: "ok",
      };
      dta["o"] = ohlc["o"];
      dta["h"] = ohlc["h"];
      dta["l"] = ohlc["l"];
      dta["c"] = ohlc["c"];
      dta["v"] = data["v"];
      dta["t"] = data["t"];
      dta["s"] = data["s"];
      return dta;
    } else {
      return data;
    }
  } else {
    return undefined;
  }
}

async function getOHLCData(currency_type, duration) {
  const compare_currency = ["inr", "btc", "usdt"];
  if (currency_type && compare_currency) {
    const rp = require("request-promise");
    const c_date = new Date();
    // c_date.setDate(c_date.getDate() - 60);
    const start_date =
      c_date.getFullYear() +
      "-" +
      c_date.getUTCMonth() +
      "-" +
      c_date.getDate();
    c_date.setMonth(c_date.getMonth() + 3);
    const now =
      c_date.getFullYear() + "-" + c_date.getMonth() + "-" + c_date.getDate();
    let dt;
    const requestOptions = {
      method: "GET",
      uri: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical`,
      qs: {
        symbol: Array.isArray(currency_type)
          ? currency_type.join(",")
          : currency_type,
        time_start: start_date,
        time_end: now,
        interval: duration,
        time_period: "hourly",
        convert: Array.isArray(compare_currency)
          ? compare_currency.join(",")
          : compare_currency,
      },
      headers: {
        "X-CMC_PRO_API_KEY": "4c566127-bd09-4a12-ac52-1dc323b7e2a4", //'55223f08-515b-46d2-8874-ca54d263b848'
      },
      json: true,
      gzip: true,
    };
    dt = await rp(requestOptions);
    const ohlc = await formateOHLC(dt.data);
    return ohlc;
  } else {
    return undefined;
  }
}
async function formateOHLC(data) {
  const ohlc = {};
  if (data.id) {
    await formateQuotes(data.quotes, data.symbol, ohlc);
  } else {
    const keys = Object.keys(data);
    for (const k of keys) {
      let val = data[k];
      if (val.quotes) await formateQuotes(val.quotes, k, ohlc);
    }
  }
  return ohlc;
}
async function formateQuotes(quotes, k, ohlc) {
  for (const v of quotes) {
    let _keys = Object.keys(v.quote);
    for (const k1 of _keys) {
      if (!ohlc[k + k1]) {
        ohlc[k + k1] = {
          o: [],
          h: [],
          l: [],
          c: [],
          v: [],
          t: [],
        };
      }
      ohlc[k + k1]["o"].push(v.quote[k1].open);
      ohlc[k + k1]["h"].push(v.quote[k1].high);
      ohlc[k + k1]["l"].push(v.quote[k1].low);
      ohlc[k + k1]["c"].push(v.quote[k1].close);
      ohlc[k + k1]["v"].push(v.quote[k1].volume);
      ohlc[k + k1]["t"].push(new Date(v.quote[k1].timestamp) / 1000);
      ohlc[k + k1]["s"] = "ok";
    }
  }
}

function storeSocketData(data, type) {
  try {
    const _data = require("./src/json/socket.json");
    var fs = require("fs");
    if (_data) {
      _data[type] = data;
      var json = JSON.stringify(_data);
      fs.writeFile(__dirname + `/src/json/socket.json`, json, "utf8", (d) => {
        console.log(d);
      });
    } else {
      let final_data = {};
      final_data[type] = data;
      var json = JSON.stringify(final_data);
      fs.writeFile(__dirname + `/src/json/socket.json`, json, "utf8", (d) => {
        console.log(d);
      });
    }
  } catch (error) {
    console.log("Error in socket data store: ", error);
  }
}

/**
 *
 * Auto execution process
 *
 * fetch each distinct order execute them, fetch again and execute them
 *
 *
 * */

const BuyStack = require("./src/models/buy_stack");
var count = 0;
var zero = 0;
/* setInterval(async () => {
    if (zero <= 0) {
        zero = 0;
        let order_type = await goupBymultipleOrders();
        // console.log(order_type);
        zero = order_type.length;
        console.log(++count, " / ", zero);
        var index = 0;
        
        await iterateEach(order_type, index);
    } else {

    }
}, 5000); */

async function iterateEach(list, index) {
  if (list[index]) {
    let o = list[index];
    let sorted = o.orders.sort(function (a, b) {
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    let ordr = sorted.length > 0 ? sorted[0] : undefined;
    if (ordr) {
      let order_data = await BuyStack.findOne({ order_id: ordr.order_id });
      /**
       * call execution in here
       */
      //  console.log("OrderData: ", order_data);
      if (order_data) {
        await callExecution(order_data, zero);
        zero -= 1;
        console.log("Zero: ", zero);
        await iterateEach(list, index + 1);
      }
    }
  } else {
  }
}

async function goupBymultipleOrders() {
  try {
    let data = await BuyStack.aggregate([
      {
        $match: {
          order_status: 0,
        },
      },
      {
        $group: {
          _id: {
            currency_type: "$currency_type",
            compare_currency: "$compare_currency",
            raw_price: "$raw_price",
          },
          orders: {
            $push: {
              // _id: '',
              order_id: "$order_id",
              // user_id: "$user_id",
              // currency_type: "$currency_type",
              // compare_currency: "$compare_currency",
              // execution_time: Date.now(),
              // total_executed: "$total_executed",
              // last_reansaction: "$last_reansaction",
              // executed_from: "$executed_from",
              // order_type: "$order_type",
              // order_direction: 'buy',
              // volume: "$volume",
              // raw_price: "$raw_price",
              // order_status: "$order_status",
              // order_date: "$order_date"
            },
          },
        },
      },
    ]);
    return data;
  } catch (error) {
    return [];
  }
}

async function callExecution(order, zero) {
  console.log("Called: ", order.raw_price);
  const { TxSE } = require("./src/utils/TxSE");
  const { updateGraphData } = require("./src/utils/functions.chart.js");
  try {
    const order1 = {
      _id: "",
      order_id: order.order_id,
      user_id: order.user_id,
      currency_type: order.currency_type,
      compare_currency: order.compare_currency,
      execution_time: Date.now(),
      total_executed: parseFloat(order.total_executed),
      last_reansaction: order.last_reansaction,
      executed_from: order.executed_from,
      order_type: order.order_type,
      order_direction: "buy",
      volume: parseFloat(order.volume),
      raw_price: order.raw_price,
      order_status: order.order_status,
      locked_bal: order.locked_bal,
    };
    console.log("order1: ", order1);
    const engine = new TxSE(order1);
    await engine.executeOrder();
    console.log("engine : ", engine);
    let isexecuted = await engine.isExecuted();
    console.log("isexecuted : ", isexecuted);
    let d = await engine.toString();
    console.log("toString : ", d);
    if (
      isexecuted &&
      isexecuted.volume &&
      isexecuted.volume > parseFloat(order.total_executed)
    ) {
      socket.emit("update_order_history: ", isexecuted);
      if (socket.connected) {
        console.log("enter_socket: ", socket.connected);
        let ob = {
          currency_type: order.currency_type,
          compare_currency: order.compare_currency,
          raw_price: round(order.raw_price),
          volume:
            isexecuted.volume > 0
              ? sub(isexecuted.volume, order.total_executed)
              : 0,
          timestamp: new Date().getTime(),
        };
        socket.emit("update_order_history", ob);
        socket.emit("delete_sell_stack", ob);
        socket.emit("delete_buy_stack", ob);
        await updateGraphData(
          order.currency_type,
          order.compare_currency,
          parseFloat(order.raw_price),
          isexecuted.volume > 0 ? parseFloat(isexecuted.volume) : 0
        );
        await updateTokenPriceAfterTrade(
          order.currency_type,
          order.compare_currency,
          parseFloat(order.raw_price)
        );
        console.log(
          ">>>>Executed: ",
          order.raw_price,
          order.currency_type,
          order.compare_currency
        );
      }
    } else {
      console.log(
        "Not executed: ",
        order.raw_price,
        order.currency_type,
        order.compare_currency,
        isexecuted
      );
    }
  } catch (error) {
    console.log("Error: ", error.message);
  }
}

/**
 *
 *
 * tradebot
 *
 *
 */

// const {
//   getAllCurrenciesWithRemoteTradeingOn,
//   createRemoteTrading,
// } = require("./src/utils/functions.remotetrading");
// var tb_i = 1000 * 60;
// var tb_f = true;
// var tb_strt = new Date().getTime();

// setInterval(async () => {
//   let tb_dt = new Date().getTime();
//   if (tb_dt - tb_strt >= tb_i || tb_f) {
//     console.log("Called 1");
//     tb_f = false;
//     tb_strt = new Date().getTime();
//     /**
//      * ! check all the settings from db
//      * * 1: fetch all currency with status true
//      * * 2: create an object array in usable way
//      *
//      */
//     let crncys = await getAllCurrenciesWithRemoteTradeingOn();
//     await createRemoteTrading(crncys, socket);
//   }
// }, 1000);

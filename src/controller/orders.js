const {
  getUserBalance,
  updateUserBalance,
  updateUserLockBalance,
  updateCancleOrderBalance,
} = require("../utils/function.wallets");
const {
  createUniqueID,
  updateTokenPriceAfterTrade,
} = require("../utils/functions");
const { executeOrder } = require("../utils/functions.orders");
const { updateGraphData } = require("../utils/functions.chart.js");
const { createSocketClient } = require("../utils/functions.socket");
const {
  validateUserId,
  validateOrderId,
  getOrderTypeFromOrderId,
} = require("../utils/validator");

const BuyStack = require("../models/buy_stack");
const SellStack = require("../models/sell_stack");
const SuppotedCurrency = require("../models/suppoted_currency");

const socket = createSocketClient("kujgwvfq-z-ghosttown-z-1fhhup0p6");
const { round, add, sub, mul, div } = require("../utils/Math");


exports.getBtexUsdtPrice = async (req, res) =>{
  // const { io } = require("socket.io-client");
  const fs = require('fs');
  try {
    var result
    let fs = require('fs')
    let path = require('path') 
    let dirname = path.join(__dirname, `../json/latest_coin_price.json`);
    const latest_price = JSON.parse(fs.readFileSync(dirname, 'utf8'));
    usdt_inr = latest_price.data['USDT'] ? latest_price.data['USDT'].quote.INR.price : 0;
    console.log("result", usdt_inr);
    // const skt = io("wss://socket.btexapi.cloud", {
    //   auth: {
    //     token: "kujgwvfq-a-ghosttown-z-1fhhup0p6", //kujgwvfq-a-ghosttown-z-1fhhup0p6
    //   },
    // });
    // await skt.on("cmc_updated", (coins) => {
    //   let coins1 = Object.values(coins);
    //   let bprice = coins1 && coins1.find((d) => d.symbol === "BTEX");
    //   var btexprice = bprice?.current_price_inr;
    //   let utprice = coins1 && coins1.find((d) => d.symbol === "USDT");
    //   var usdtprice = utprice?.current_price_inr;
    //   console.log("btex usdt price ", div(btexprice,usdtprice));
    // });
    return res.json({
      status :200,
      usdt_inr,
      message:"success",
    })
  } catch(error) {
    console.log("error in orderAPI", error.message);
    return res.json({
      status :400,
      message:"error",
    })
  }
  
};

exports.sellOrder = async (req, res) => {
  // await executeOrder({}, false);
  const body = req.body;
  let price = Number(body.raw_price);
  if (body.currency_type === "btex" && price < 6) {
    return res.json({
      status: 400,
      error: true,
      message: "price must be greater 6",
    });
  }
  if (body.currency_type === "btex" && body.volume < 50) {
    return res.json({
      status: 400,
      error: true,
      message: "Minimum 50 Btex Sell",
    });
  }
  if (!body.user_id || !validateUserId(body.user_id)) {
    return res.json({
      status: 400,
      error: true,
      message: "Invalid request",
    });
  }
  const { balance } = await getUserBalance(body.user_id, body.currency_type);
  if (body.volume > balance) {
    return res.json({
      status: 200,
      error: true,
      message: "Insufficient fund in wallet!",
    });
  }
  let cp = body.compare_currency;
  let getValidate = await SuppotedCurrency.findOne({
    symbol: body.currency_type.toUpperCase(),
  });
  let pairedValue = await SuppotedCurrency.findOne({
    symbol: cp.toUpperCase(),
  });
  // console.log("pairedValue: ", pairedValue)
  if (getValidate.is_sell === 0) {
    return res.json({
      status: 400,
      error: true,
      message:
        pairedValue.symbol.toUpperCase() +
        " trading is not available for sometimes",
      data: req.body,
    });
  }
  if (pairedValue.is_trade === 0 && pairedValue.is_paired === true) {
    return res.json({
      status: 400,
      error: true,
      message:
        pairedValue.symbol.toUpperCase() +
        " trading is not available for sometimes",
      data: req.body,
    });
  }
  const order_id = createUniqueID("sell_order");
  const user_id = body.user_id;
  const raw_price = round(body.raw_price);
  const currency_type = body.currency_type;
  const compare_currency = body.compare_currency;
  const volume = round(body.volume);
  const order_date = Date.now();
  const execution_time = "";
  const total_executed = 0;
  const last_reansaction = "";
  const order_status = 0;
  const executed_from = "";
  const order_type = body.type == "p2p" ? "p2p" : "exc";
  const lock = false;
  const locked_bal = volume;
  try {
    const sellstack = await SellStack.create({
      order_id,
      user_id,
      raw_price,
      currency_type,
      compare_currency,
      volume,
      order_date,
      execution_time,
      total_executed,
      last_reansaction,
      order_status,
      executed_from,
      order_type,
      lock,
      locked_bal,
    });
    // console.log("**Sell** Order created: ", "User id: ", user_id, " Currency type: ", currency_type, " Compare currency: ", compare_currency, " Volume: ", volume, " Raw price: ", raw_price);
    const isDeducted = await updateUserLockBalance(
      user_id,
      currency_type,
      locked_bal
    );
    if (!isDeducted) {
      await SellStack.deleteOne({ order_id: order_id });
      return res.json({
        status: 200,
        error: true,
        message: "Insufficient fund in wallet!",
      });
    }
    if (socket.connected) {
      let obj = {
        currency_type,
        compare_currency,
        raw_price,
        volume,
      };
      socket.emit("update_sell_stack", obj);
    }
  } catch (error) {
    console.log(
      "Error: >from: controller> orders > sellOrder > try: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Order couldn't create",
    });
  }

  const order = {
    _id: "",
    order_id,
    user_id,
    currency_type,
    compare_currency,
    execution_time: Date.now(),
    total_executed,
    last_reansaction,
    executed_from,
    order_type,
    order_direction: "sell",
    volume,
    raw_price,
    order_status,
  };
  try {
    // const historyId = await executeOrder(order, false);
    // if (historyId) {
    //     return res.json({
    //         status: 200,
    //         error: false,
    //         message: 'Order Created and Executed Successfully!',
    //         order_id
    //     })
    // } else {
    //     return res.json({
    //         status: 200,
    //         error: false,
    //         message: "Order Created Successfully, but didn't Executed (in queue)!",
    //         order_id
    //     })
    // }
    /**
     * new code
     * */
    const { TxSE } = require("../utils/TxSE");
    const { updateGraphData } = require("../utils/functions.chart.js");
    const engine = new TxSE(order);
    await engine.executeOrder();
    let isexecuted = await engine.isExecuted();
    let d = await engine.toString();
    if (isexecuted) {
      // socket.emit("update_order_history", isexecuted);
      if (socket.connected) {
        socket.emit("update_order_history", isexecuted);
        let ob = {
          currency_type: order.currency_type,
          compare_currency: order.compare_currency,
          raw_price: order.raw_price,
          volume: isexecuted.volume > 0 ? isexecuted.volume : 0,
        };
        // let obj1 = {
        //     currency_type:"btex",
        //     compare_currency:"inr",
        //     raw_price:4.5,
        //     volume:0
        // }
        socket.emit("delete_sell_stack", ob);
        socket.emit("delete_buy_stack", ob);
        // socket.emit("delete_sell_stack1", obj1);
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
      }
      return res.json({
        status: 200,
        error: false,
        message: "Order Created and Executed Successfully!",
        order_id,
        isexecuted,
        d,
      });
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Order Created Successfully, but didn't Executed (in queue)",
      });
    }
    return res.json({
      status: 200,
      error: false,
      message: "Order Created Successfully",
      order_id,
    });
  } catch (error) {
    console.log(
      "Error: >from: controller> orders > sellOrder > try2 (order execution): ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Order Created Successfully, but didn't Executed (in queue)*",
    });
  }

  return res.json({
    status: 200,
    error: false,
    message: "Order Created Successfully! " + error.message,
    order_id,
  });
};

exports.buyOrder = async (req, res) => {
  const body = req.body;
  let price = Number(body.raw_price);
  if (body.currency_type === "btex" && price < 6) {
    return res.json({
      status: 400,
      error: true,
      message: "price must be greater 6",
    });
  }
  if (body.currency_type === "btex" && body.volume < 50) {
    return res.json({
      status: 400,
      error: true,
      message: "Minimum 50 Btex Buy",
    });
  }
  if (!body.user_id || !validateUserId(body.user_id)) {
    return res.json({
      status: 400,
      error: true,
      message: "Invalid request**",
    });
  }
  const { balance } = await getUserBalance(body.user_id, body.compare_currency); // here we will check for compare currency balance
  if (parseFloat(body.volume) * parseFloat(body.raw_price) > balance) {
    return res.json({
      status: 200,
      error: true,
      message: "Insufficient fund in wallet!",
    });
  }
  let cp = body.compare_currency;
  let getValidate = await SuppotedCurrency.findOne({
    symbol: body.currency_type.toUpperCase(),
  });
  let pairedValue = await SuppotedCurrency.findOne({
    symbol: cp.toUpperCase(),
  });
  if (getValidate.is_buy === 0) {
    return res.json({
      status: 400,
      error: true,
      message:
        pairedValue.symbol.toUpperCase() +
        " trading is not available for sometimes",
      data: req.body,
    });
  }
  if (pairedValue.is_trade === 0 && pairedValue.is_paired === true) {
    return res.json({
      status: 400,
      error: true,
      message:
        pairedValue.symbol.toUpperCase() +
        " trading is not available for sometimes",
      data: req.body,
    });
  }
  const order_id = createUniqueID("buy_order");
  const user_id = body.user_id;
  const raw_price = round(body.raw_price);
  const currency_type = body.currency_type;
  const compare_currency = body.compare_currency;
  const volume = round(body.volume);
  const order_date = Date.now();
  const execution_time = "";
  const total_executed = 0;
  const last_reansaction = "";
  const order_status = 0;
  const executed_from = "";
  const order_type = body.type == "p2p" ? "p2p" : "exc";
  const lock = false;
  const locked_bal = mul(raw_price,volume);
  try {
    const buystack = await BuyStack.create({
      order_id,
      user_id,
      raw_price,
      currency_type,
      compare_currency,
      volume,
      order_date,
      execution_time,
      total_executed,
      last_reansaction,
      order_status,
      executed_from,
      order_type,
      lock,
      locked_bal,
    });

    // console.log("++Buy++ Order created: ", "User id: ", user_id, " Currency type: ", currency_type, " Compare currency: ", compare_currency, " Volume: ", volume, " Raw price: ", raw_price);
    const isDeducted = await updateUserLockBalance(
      user_id,
      compare_currency,
      locked_bal
    );
    if (!isDeducted) {
      await BuyStack.deleteOne({ order_id: order_id });
      return res.json({
        status: 200,
        error: true,
        message: "Insufficient fund in wallet!",
      });
    }
    if (socket.connected) {
      let obj = {
        currency_type,
        compare_currency,
        raw_price,
        volume,
      };
      socket.emit("update_buy_stack", obj);
    }
  } catch (error) {
    console.log(
      "Error: >from: controller> orders > buyOrder > try: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Order couldn't create " + error.message,
    });
  }
  const order = {
    _id: "",
    order_id,
    user_id,
    currency_type,
    compare_currency,
    execution_time: Date.now(),
    total_executed,
    last_reansaction,
    executed_from,
    order_type,
    order_direction: "buy",
    volume,
    raw_price,
    order_status,
  };
  try {
    // const historyId = await executeOrder(order, false);
    // if (historyId) {
    //     return res.json({
    //         status: 200,
    //         error: false,
    //         message: 'Order Created and Executed Successfully!',
    //         order_id
    //     })
    // } else {
    //     return res.json({
    //         status: 200,
    //         error: false,
    //         message: "Order Created Successfully, but didn't Executed (in queue)!",
    //         order_id
    //     })
    // }
    /**
     * new code
     * */
    const { TxSE } = require("../utils/TxSE");
    const { updateGraphData } = require("../utils/functions.chart.js");
    const engine = new TxSE(order);
    await engine.executeOrder();
    let isexecuted = await engine.isExecuted();
    let d = await engine.toString();
    if (isexecuted) {
      // socket.emit("update_order_history", isexecuted);
      if (socket.connected) {
        socket.emit("update_order_history", isexecuted);
        let ob = {
          currency_type: order.currency_type,
          compare_currency: order.compare_currency,
          raw_price: order.raw_price,
          volume: isexecuted.volume > 0 ? isexecuted.volume : 0,
        };
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
      }
      return res.json({
        status: 200,
        error: false,
        message: "Order Created and Executed Successfully!",
        order_id,
        isexecuted,
        d,
      });
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Order Created Successfully, but didn't Executed (in queue)",
      });
    }
    return res.json({
      status: 200,
      error: false,
      message: "Order Created Successfully",
      order_id,
    });
  } catch (error) {
    console.log(
      "Error: >from: controller> orders > buyOrder > try2 (order execution): ",
      error
    );
    return res.json({
      status: 400,
      error: true,
      message: "Order Created Successfully, but didn't Executed (in queue)*",
    });
  }
  return res.json({
    status: 200,
    error: false,
    message: "Order Created Successfully!",
    order_id,
  });
};

exports.createOrder = async (req, res) => {
  const body = req.body;
  let Stack;
  let locked_bal = 0;
  let c_type = body.type=='buy'?body.compare_currency:body.currency_type;
  let unique_id;
  let price = Number(body.raw_price);
  if (body.currency_type === "btex" && price < 6) {
    return res.json({
      status: 400,
      error: true,
      message: "price must be greater 6",
    });
  }
  if (body.currency_type === "btex" && body.volume < 50) {
    return res.json({
      status: 400,
      error: true,
      message: "Minimum 50 Btex Sell",
    });
  }
  if (!body.user_id || !validateUserId(body.user_id)) {
    return res.json({
      status: 400,
      error: true,
      message: "Invalid request",
    });
  }
  let cp = body.compare_currency;
  let getValidate = await SuppotedCurrency.findOne({
    symbol: body.currency_type.toUpperCase(),
  });
  let pairedValue = await SuppotedCurrency.findOne({
    symbol: cp.toUpperCase(),
  });
  if(body.type == 'buy') {
      Stack = require("../models/buy_stack");
      unique_id = createUniqueID("buy_order");
      c_type = body.compare_currency;
      locked_bal = mul(body.raw_price,body.volume);
      const { balance } = await getUserBalance(body.user_id, body.compare_currency); // here we will check for compare currency balance
      if (locked_bal > balance) {
        return res.json({
          status: 400,
          error: true,
          message: "Insufficient fund in wallet!",
        });
      }
      if (getValidate.is_buy === 0) {
          return res.json({
            status: 400,
            error: true,
            message:
              pairedValue.symbol.toUpperCase() +
              " trading is not available for sometimes",
            data: req.body,
          });
        }
  } else if(body.type == 'sell') {
      Stack = require("../models/sell_stack");
      unique_id = createUniqueID("sell_order");
      c_type = body.currency_type;
      locked_bal = round(body.volume)
      const { balance } = await getUserBalance(body.user_id, body.currency_type);
      if (locked_bal > balance) {
        return res.json({
          status: 400,
          error: true,
          message: "Insufficient fund in wallet!",
        });
      }
      if (getValidate.is_sell === 0) {
          return res.json({
            status: 400,
            error: true,
            message:
              pairedValue.symbol.toUpperCase() +
              " trading is not available for sometimes",
            data: req.body,
          });
        }
  }
  // console.log("pairedValue: ", pairedValue)
  if (pairedValue.is_trade === 0 && pairedValue.is_paired === true) {
    return res.json({
      status: 400,
      error: true,
      message:
        pairedValue.symbol.toUpperCase() +
        " trading is not available for sometimes",
      data: req.body,
    });
  }
  const order_id = unique_id;
  const user_id = body.user_id;
  const raw_price = round(body.raw_price);
  const currency_type = body.currency_type;
  const compare_currency = body.compare_currency;
  const volume = round(body.volume);
  const order_date = Date.now();
  const execution_time = "";
  const total_executed = 0;
  const last_reansaction = "";
  const order_status = 0;
  const executed_from = "";
  const order_type = body.type == "p2p" ? "p2p" : "exc";
  const lock = false;
 
  try { 
      const isDeducted = await updateUserLockBalance(
          user_id,
          c_type,
          locked_bal
          );
      if(isDeducted) {
          await Stack.create({
              order_id,
              user_id,
              raw_price,
              currency_type,
              compare_currency,
              volume,
              order_date,
              execution_time,
              total_executed,
              last_reansaction,
              order_status,
              executed_from,
              order_type,
              lock,
              locked_bal,
          });
          // console.log("**Sell** Order created: ", "User id: ", user_id, " Currency type: ", currency_type, " Compare currency: ", compare_currency, " Volume: ", volume, " Raw price: ", raw_price);
          
          if (socket.connected) {
              let obj = {
              currency_type,
              compare_currency,
              raw_price,
              volume,
              };
              if(body.type == 'buy') {
                  socket.emit("update_buy_stack", obj);
              } else if(body.type == 'sell') {
                  socket.emit("update_sell_stack", obj);
              }
          }
          return res.json({
              status: 200,
              error: false,
              message: "Order Created Successfully",
              result : {
                  order_id: order_id,
                  type: body.type
              }
          });
      } else {
          return res.json({
              status: 200,
              error: true,
              message: "Insufficient fund in wallet!",
          });
      }
  } catch (error) {
    console.log(
      "Error: >from: controller> orders > sellOrder > try: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Order couldn't create",
    });
  }
};

exports.executeOrders = async (req, res) => {
  try {
      const {order_id, type, user_id} = req.body;
      let Stack;
      if(type == 'buy') {
          Stack = require("../models/buy_stack");
      } else if(type == 'sell') {
          Stack = require("../models/sell_stack");
      }
      const StackData = await Stack.findOne({order_id:order_id, user_id:user_id});
     
      if(StackData) {
          const order = {
              _id: "",
              order_id:order_id,
              user_id:user_id,
              currency_type:StackData.currency_type,
              compare_currency:StackData.compare_currency,
              execution_time: Date.now(),
              total_executed:StackData.total_executed,
              last_reansaction:StackData.last_reansaction,
              executed_from:StackData.executed_from,
              order_type:StackData.order_type,
              order_direction: type,
              volume:StackData.volume,
              raw_price:StackData.raw_price,
              order_status:StackData.order_status,
          };
          try {
              const { TxSE } = require("../utils/TxSE");
              const { updateGraphData } = require("../utils/functions.chart.js");
              const engine = new TxSE(order);
              await engine.executeOrder();
              let isexecuted = await engine.isExecuted();
              let d = await engine.toString();
              if (isexecuted) {
              // socket.emit("update_order_history", isexecuted);
                  if (socket.connected) {
                      socket.emit("update_order_history", isexecuted);
                      let ob = {
                          currency_type: order.currency_type,
                          compare_currency: order.compare_currency,
                          raw_price: order.raw_price,
                          volume: isexecuted.volume > 0 ? isexecuted.volume : 0,
                      };
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
                  }
                  return res.json({
                      status: 200,
                      error: false,
                      message: "Order Executed Successfully!",
                      order_id,
                      isexecuted,
                      d,
                  });
              } else {
                  return res.json({
                      status: 400,
                      error: true,
                      message: "Order didn't Executed (in queue)",
                  });
              }
          } catch (error) {
              console.log(
              "Error: >from: controller> orders > executeOrder > try2 (order execution): ",
              error
              );
              return res.json({
              status: 400,
              error: true,
              message: "Order didn't Executed (in queue)*",
              });
          }
      } else {
          return res.json({
              status: 200,
              error: false,
              message: "Order Not Found!!",
              order_id,
          });
      }
  } catch (error) {
      console.log(
      "Error: >from: controller> orders > executeOrder > try2 (order execution): ",
      error
      );
      return res.json({
      status: 400,
      error: true,
      message: "Not Execute",
      });
  }
};

exports.orderHistory = async (req, res) => {
  const TradeHistory = require("../models/trade_history");
  try {
    // console.log("Start: ", Date.now())
    const { user_id } = req.body;
    if (user_id && validateUserId(user_id)) {
      const sell_orders = await SellStack.find({ user_id: user_id });
      const buy_orders = await BuyStack.find({ user_id: user_id });
      const compleated_orders = [];
      const pending_orders = [];

      // if (sell_orders && Array.isArray(sell_orders) && buy_orders && Array.isArray(buy_orders)) {
      // code for selling
      const tradeloopobj =
        (sell_orders ? sell_orders.length : 0) >
        (buy_orders ? buy_orders.length : 0)
          ? sell_orders
          : buy_orders;
      var _orders = tradeloopobj.map(async (order, index) => {
        let new_arr = [];
        let buy_obj = buy_orders.length > index ? buy_orders[index] : undefined;
        let sell_obj =
          sell_orders.length > index ? sell_orders[index] : undefined;
        // console.log(sell_obj)
        if (buy_obj && buy_obj.order_status != 2) {
          let ordr = {};
          ordr.currency_type = buy_obj.currency_type;
          ordr.compare_currency = buy_obj.compare_currency;
          ordr.raw_price = buy_obj.raw_price;
          ordr.volume = buy_obj.volume;
          ordr.total_executed = buy_obj.total_executed;
          ordr.timestamp = buy_obj.order_date;
          ordr.order_id = buy_obj.order_id;
          ordr.type = "buy";
          if (buy_obj.volume > buy_obj.total_executed) {
            ordr.status = "p";
          } else if (buy_obj.volume == buy_obj.total_executed) {
            ordr.status = "c";
          }
          //  = [];
          const trade_h = await TradeHistory.find({
            buy_order_id: buy_obj.order_id,
          });
          // if (trade_h && Array.isArray(trade_h) && trade_h > 0) {
          ordr.trades = trade_h.map((h) => {
            let hobj = {};
            hobj.trade_date = h.trade_date;
            hobj.price = h.price;
            hobj.volume = h.volume;
            let cf = h.commition_fee ? h.commition_fee.split("+") : undefined;
            let mf = cf ? cf[0] : 0;
            hobj.transaction_fee = mf;
            return hobj;
            // ordr.trades.push(hobj);
          });
          // }
          new_arr[0] = ordr;
        }
        if (sell_obj && sell_obj.order_status != 2) {
          let ordr = {};
          ordr.currency_type = sell_obj.currency_type;
          ordr.compare_currency = sell_obj.compare_currency;
          ordr.raw_price = sell_obj.raw_price;
          ordr.volume = sell_obj.volume;
          ordr.total_executed = sell_obj.total_executed;
          ordr.timestamp = sell_obj.order_date;
          ordr.order_id = sell_obj.order_id;
          ordr.type = "sell";
          if (sell_obj.volume > sell_obj.total_executed) {
            ordr.status = "p";
          } else if (sell_obj.volume == sell_obj.total_executed) {
            ordr.status = "c";
          }
          const trade_h = await TradeHistory.find({
            sell_order_id: sell_obj.order_id,
          });
          //  = [];
          // if (trade_h && Array.isArray(trade_h) && trade_h > 0) {
          ordr.trades = trade_h.map((h) => {
            let hobj = {};
            hobj.trade_date = h.trade_date;
            hobj.price = h.price;
            hobj.volume = h.volume;
            let cf = h.commition_fee ? h.commition_fee.split("+") : undefined;
            let mf = cf ? cf[1] : 0;
            hobj.transaction_fee = mf;
            return hobj;
            // ordr.trades.push(hobj);
          });
          // }
          new_arr[1] = ordr;
          // console.log(new_arr)
        }
        return new_arr;
      });
      // console.log(_orders);
      Promise.all(_orders)
        .then(function (results) {
          const trade_hist = {};
          trade_hist.compleated = [];
          trade_hist.pending = [];
          results.map((d) => {
            if (d[0] && d[0].status == "c") {
              trade_hist.compleated.push(d[0]);
            } else if (d[0] && d[0].status == "p") {
              trade_hist.pending.push(d[0]);
            }
            if (d[1] && d[1].status == "c") {
              trade_hist.compleated.push(d[1]);
            } else if (d[1] && d[1].status == "p") {
              trade_hist.pending.push(d[1]);
            }
          });
          // console.log("End: ", Date.now())
          return res.json({
            status: 200,
            error: false,
            params: {
              trade_history: trade_hist,
            },
            message: "Success",
          });
          /** */
        })
        .catch((error) => {
          console.log("error: ", error.message);
        });
      // } else {
      //     return res.json({
      //         status: 400,
      //         error: true,
      //         message:
      //     })
      // }
    } else {
      // console.log("End-: ", Date.now())
      return res.json({
        status: 400,
        error: true,
        message: "Invalid request",
      });
    }
  } catch (error) {
    // console.log("End--: ", Date.now())
    console.log("Error: ", error.message);
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again",
    });
  }
};

exports.cancleOrder = async (req, res) => {
  try {
    const { user_id, order_id } = req.body;
    if (user_id && validateUserId(user_id)) {
      if (order_id) {
        const order_type = getOrderTypeFromOrderId(order_id);
        if (order_type) {
          if (order_type == "sell") {
            const order_d = await SellStack.findOne({
              order_id: order_id /*, user_id: user_id */,
            });
            // console.log("order_d", order_d);
            if (
              order_d &&
              order_d.lock &&
              order_d.lock != true &&
              order_d.order_status == 0
            ) {
              const total_volume = order_d.volume
                ? parseFloat(order_d.volume)
                : 0;
              const total_executed = order_d.total_executed
                ? parseFloat(order_d.total_executed)
                : 0;
              const remaining_volume = total_volume - total_executed;
              if (remaining_volume > 0) {
                await SellStack.updateOne(
                  { order_id: order_id, user_id: user_id },
                  {
                    $set: {
                      order_status: 2,
                    },
                  }
                );
                /**
                 * volume -
                 * total_executed
                 * = cancle locked
                 */
                console.log(
                  "**Sell** Order cancled: ",
                  "User id: ",
                  user_id,
                  " Currency type: ",
                  order_d.currency_type,
                  " Compare currency: ",
                  order_d.compare_currency,
                  " Volume: ",
                  order_d.volume,
                  " Raw price: ",
                  order_d.raw_price,
                  " Executed: ",
                  order_d.total_executed
                );
                await updateUserLockBalance(
                  user_id,
                  order_d.currency_type,
                  -1 * remaining_volume
                );
                return res.json({
                  status: 200,
                  error: false,
                  message: "Order Cancled Successfully",
                });
              } else {
                await SellStack.updateOne(
                  { order_id: order_id, user_id: user_id },
                  {
                    $set: {
                      order_status: 2,
                    },
                  }
                );
                return res.json({
                  status: 200,
                  error: false,
                  message: "Order Cancled Successfully",
                });
              }
            } else {
              return res.json({
                status: 400,
                error: true,
                message: "Invalid attempt--",
              });
            }
          } else if (order_type == "buy") {
            const order_d = await BuyStack.findOne({
              order_id: order_id /*, user_id: user_id*/,
            });
            // console.log("order_id: order_data: ", order_id, order_d);
            if (
              order_d &&
              order_d.lock &&
              order_d.lock != true &&
              order_d.order_status == 0
            ) {
              const total_volume = order_d.volume
                ? parseFloat(order_d.volume)
                : 0;
              const total_executed = order_d.total_executed
                ? parseFloat(order_d.total_executed)
                : 0;
              const remaining_volume =
                (total_volume - total_executed) *
                (order_d.raw_price ? parseFloat(order_d.raw_price) : 0);
              if (remaining_volume > 0) {
                await BuyStack.updateOne(
                  { order_id: order_id, user_id: user_id },
                  {
                    $set: {
                      order_status: 2,
                    },
                  }
                );
                console.log(
                  "++Buy++ Order cancled: ",
                  "User id: ",
                  user_id,
                  " Currency type: ",
                  order_d.currency_type,
                  " Compare currency: ",
                  order_d.compare_currency,
                  " Volume: ",
                  order_d.volume,
                  " Raw price: ",
                  order_d.raw_price,
                  " Executed: ",
                  order_d.total_executed
                );
                await updateUserLockBalance(
                  user_id,
                  order_d.compare_currency,
                  -1 * remaining_volume
                );
                return res.json({
                  status: 200,
                  error: false,
                  message: "Order Cancled Successfully",
                });
              } else {
                await BuyStack.updateOne(
                  { order_id: order_id, user_id: user_id },
                  {
                    $set: {
                      order_status: 2,
                    },
                  }
                );
                return res.json({
                  status: 200,
                  error: false,
                  message: "Order Cancled Successfully",
                });
              }
            } else {
              return res.json({
                status: 400,
                error: true,
                message: "Invalid attempt*",
              });
            }
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid attempt@",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid attempt@@",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid  request_",
      });
    }
  } catch (error) {
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again",
    });
  }
};

exports.openOrder = async (req, res) => {
  try {
    const buyStack = require("../models/buy_stack");
    const sellStack = require("../models/sell_stack");
    const { user_id, status, order_id } = req.query;
    if (status || status === 0) {
      const buy = await buyStack.aggregate([
        { $match: { order_status: parseInt(status) } },
        {
          $lookup: {
            from: "pending_kyc",
            localField: "user_id",
            foreignField: "user_id",
            as: "pending_kyc",
          },
        },
      ]);
      const sell = await sellStack.aggregate([
        { $match: { order_status: parseInt(status) } },
        {
          $lookup: {
            from: "pending_kyc",
            localField: "user_id",
            foreignField: "user_id",
            as: "pending_kyc",
          },
        },
      ]);
      return res.json({
        status: 200,
        buy_stack: buy,
        sell_stack: sell,
        error: false,
        message: "success",
      });
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid  request",
      });
    }
  } catch (error) {
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again",
    });
  }
};

exports.allHistory = async (req, res) => {
  try {
    const TradeHistory = require("../models/trade_history");
    const { user_id, status, order_id } = req.query;
    if (status) {
      const data = await TradeHistory.find({});
      return res.json({
        status: 200,
        data: data,
        error: false,
        message: "success",
      });
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid  request",
      });
    }
  } catch (error) {
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again",
    });
  }
};

exports.executeOrder = async (req, res) => {
  try {
    const { orderID, orderType } = req.body;
    let order = false;
    if (orderType == "sell") {
      order = await SellStack.findOne({ order_id: orderID });
      order = order
        ? {
            order_id: order.order_id,
            user_id: order.user_id,
            currency_type: order.currency_type,
            compare_currency: order.compare_currency,
            total_executed: order.total_executed,
            last_reansaction: order.last_reansaction,
            executed_from: order.executed_from,
            order_type: order.order_type,
            volume: order.volume,
            raw_price: order.raw_price,
            order_status: order.order_status,
            execution_time: Date.now(),
            order_direction: "sell",
          }
        : false;
    } else if (orderType == "buy") {
      order = await BuyStack.findOne({ order_id: orderID });
      order = order
        ? {
            order_id: order.order_id,
            user_id: order.user_id,
            currency_type: order.currency_type,
            compare_currency: order.compare_currency,
            total_executed: order.total_executed,
            last_reansaction: order.last_reansaction,
            executed_from: order.executed_from,
            order_type: order.order_type,
            volume: order.volume,
            raw_price: order.raw_price,
            order_status: order.order_status,
            execution_time: Date.now(),
            order_direction: "buy",
          }
        : false;
    }

    if (order) {
      /* from sell order */
      const { TxSE } = require("../utils/TxSE");
      const { updateGraphData } = require("../utils/functions.chart.js");
      const engine = new TxSE(order);
      await engine.executeOrder();
      let isexecuted = await engine.isExecuted();
      let d = await engine.toString();
      if (isexecuted) {
        if (socket.connected) {
          socket.emit("update_order_history", isexecuted);
          let ob = {
            currency_type: order.currency_type,
            compare_currency: order.compare_currency,
            raw_price: order.raw_price,
            volume: isexecuted.volume > 0 ? isexecuted.volume : 0,
          };
          
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
        }
        return res.json({
          status: 200,
          error: false,
          message: "Order Executed Successfully!",
          order_id,
          isexecuted,
          d,
        });
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Order didn't Executed (in queue)",
        });
      }

      /* from buy order */
      /* const { TxSE } = require("../utils/TxSE");
    const { updateGraphData } = require("../utils/functions.chart.js");
    const engine = new TxSE(order);
    await engine.executeOrder();
    let isexecuted = await engine.isExecuted();
    let d = await engine.toString();
    if (isexecuted) {
      // socket.emit("update_order_history", isexecuted);
      if (socket.connected) {
        socket.emit("update_order_history", isexecuted);
        let ob = {
          currency_type: order.currency_type,
          compare_currency: order.compare_currency,
          raw_price: order.raw_price,
          volume: isexecuted.volume > 0 ? isexecuted.volume : 0,
        };
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
      }
      return res.json({
        status: 200,
        error: false,
        message: "Order Created and Executed Successfully!",
        order_id,
        isexecuted,
        d,
      });
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Order Created Successfully, but didn't Executed (in queue)",
      });
    }
    return res.json({
      status: 200,
      error: false,
      message: "Order Created Successfully",
      order_id,
    }); */
      return res.status(200).json({ orderID, order });
    } else {
      return res.status(400).json({ message: "Order not found." });
    }
  } catch (err) {
    return res.status(400).json({
      message: "Something went wrong, please try again. " + err.message,
    });
  }
};

exports.exeOrder = async (req, res) => {
  const BuyStack = require("../models/buy_stack");
  const SellStack = require("../models/sell_stack");
  try{
    const {order_id, type, user_id} = req.body;
    if(type == 'buy'){
      let i=0;
      let isBuy = false;
      const buy_order = await BuyStack.findOne({user_id:user_id, order_id:order_id});
      const currency_type = buy_order.currency_type;
      const compare_currency = buy_order.compare_currency;
      const raw_price = buy_order?parseFloat(buy_order.raw_price):0;
      const sell_order = await SellStack.aggregate([
        { $match: { currency_type:currency_type, compare_currency:compare_currency, raw_price:{$lte:raw_price}, order_status: 0 } },
        { $sort: { raw_price: 1 } }
      ]);
      if(buy_order && sell_order) {
        console.log("buy orders :: ",buy_order, sell_order);
        await executeBuyOrder(buy_order, sell_order, currency_type, compare_currency, i, isBuy);
      }
    } 
    if(type == 'sell') {
      let i=0;
      let isSell = false;
      const sell_order = await SellStack.findOne({user_id:user_id, order_id:order_id});
      const currency_type = sell_order.currency_type;
      const compare_currency = sell_order.compare_currency;
      const raw_price = sell_order?parseFloat(sell_order.raw_price):0;
      const buy_order = await BuyStack.aggregate([
        { $match: { currency_type:currency_type, compare_currency:compare_currency, raw_price:{$gte:raw_price},order_status: 0} },
        { $sort: { raw_price: -1 } }
      ]);
      if(buy_order && sell_order) {
        console.log("sell orders :: ",sell_order, buy_order);
        await executeSellOrder(buy_order, sell_order, currency_type, compare_currency, i, isSell);
      }
    }
    return res.json({
      status: 200,
      error: false,
      message: "Success"
  });
  }catch(error) {
    console.log("error in exeOrder>order1.js ", error.message);
  }
}
async function executeBuyOrder(buy_orders, sellorders, currency_type, compare_currency, i, isBuy) {
  const BuyStack = require("../models/buy_stack");
  try {
    let total_execution = 0;
    let sell_order = sellorders[i];
    let buy_order = buy_orders;
    if(isBuy) {
      buy_order = await BuyStack.findOne({_id:buy_orders._id});
    }
    let buy_order_price = buy_order?round(buy_order.raw_price):0;
    let sell_order_price = sell_order?round(sell_order.raw_price):0;
    let buy_order_volume = buy_order?round(buy_order.volume):0;
    let sell_order_volume = sell_order?round(sell_order.volume):0;
    let buy_order_total_executed = buy_order?round(buy_order.total_executed):0;
    let sell_order_total_executed = sell_order?round(sell_order.total_executed):0;
    // console.log(buy_order, sell_order, i);
    let remaining_buy_volume = sub(buy_order_volume, buy_order_total_executed);
    let remaining_sell_volume = sub(sell_order_volume, sell_order_total_executed);
        if (remaining_buy_volume > 0 && remaining_buy_volume == remaining_sell_volume) {
            total_execution = remaining_buy_volume;
            let commission = sub(mul(remaining_buy_volume, buy_order_price),mul(remaining_sell_volume, sell_order_price));
            console.log("Totally Executed>>>", remaining_buy_volume, remaining_sell_volume, commission);
            await updateBuyWallet(remaining_buy_volume, buy_order.user_id, buy_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase(), commission);
            await updateSellWallet(remaining_sell_volume, sell_order.user_id, sell_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase());
            await updateBuyOrder(remaining_buy_volume, 1, buy_order, sell_order);
            await updatedSellOrder(remaining_sell_volume, 1, buy_order, sell_order);
            await createHistory(remaining_buy_volume, buy_order, sell_order, currency_type, compare_currency, 'buy');
            // if(commission>0) {
            //   await createAdminCommision(commission, buy_order, sell_order, currency_type.toUpperCase(), compare_currency.toUpperCase())
            // }
            if (socket.connected) {
              const obj =  {
                currency_type: currency_type,
                compare_currency: compare_currency,
                raw_price: sell_order_price,
                volume: remaining_buy_volume,
                timestamp: Date.now()
            }
            socket.emit("update_order_history", obj);
            if(buy_order_price == sell_order_price) {
                let obBuy = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_buy_volume,
                };
                let obSell = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_sell_volume,
                };
                socket.emit("delete_buy_stack", obBuy);
                socket.emit("delete_sell_stack", obSell);
            } else {
                let obBuy = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_buy_volume,
                };
                let obSell = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: sell_order_price,
                  volume: remaining_sell_volume,
                };
                socket.emit("delete_buy_stack", obBuy);
                socket.emit("delete_sell_stack", obSell);
            }
            
              await updateTokenPriceAfterTrade(
                  currency_type,
                  compare_currency,
                  buy_order_price,
              );
              await updateGraphData(
                  currency_type,
                  compare_currency,
                  buy_order_price,
                  remaining_buy_volume
              );
            }

        }
        if (remaining_buy_volume > 0 && remaining_buy_volume < remaining_sell_volume) {
            total_execution = remaining_buy_volume;
            let commission = sub(mul(remaining_buy_volume, buy_order_price),mul(remaining_buy_volume, sell_order_price));
            console.log("Buy Order Totally Executed, Sell Order Partially Executed>>>", remaining_buy_volume, remaining_sell_volume, commission);
            await updateBuyWallet(remaining_buy_volume, buy_order.user_id, buy_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase(), commission);
            await updateSellWallet(remaining_buy_volume, sell_order.user_id, sell_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase());
            await updateBuyOrder(remaining_buy_volume, 1, buy_order, sell_order);
            await updatedSellOrder(remaining_buy_volume, 0, buy_order, sell_order);
            await createHistory(remaining_buy_volume, buy_order, sell_order, currency_type, compare_currency, 'buy');
            // if(commission>0){
            //   await createAdminCommision(commission, buy_order, sell_order, currency_type.toUpperCase(), compare_currency.toUpperCase());
            // }
            if (socket.connected) {
              const obj =  {
                currency_type: currency_type,
                compare_currency: compare_currency,
                raw_price: sell_order_price,
                volume: remaining_buy_volume,
                timestamp: Date.now()
            }
            socket.emit("update_order_history", obj);
            if(buy_order_price == sell_order_price) {
                let obBuy = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_buy_volume,
                };
                let obSell = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_buy_volume,
                };
                socket.emit("delete_buy_stack", obBuy);
                socket.emit("delete_sell_stack", obSell);
            } else {
                let obBuy = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_buy_volume,
                };
                let obSell = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: sell_order_price,
                  volume: remaining_buy_volume,
                };
                socket.emit("delete_buy_stack", obBuy);
                socket.emit("delete_sell_stack", obSell);
            }
             
              await updateTokenPriceAfterTrade(
                  currency_type,
                  compare_currency,
                  buy_order_price,
              );
              await updateGraphData(
                  currency_type,
                  compare_currency,
                  buy_order_price,
                  remaining_buy_volume
              );
            }

        } 
        if (remaining_buy_volume > remaining_sell_volume && remaining_sell_volume > 0) {
            total_execution = remaining_sell_volume;
            let commission = sub(mul(remaining_sell_volume, buy_order_price),mul(remaining_sell_volume, sell_order_price));
            console.log("Sell Order Totally Executed, Buy Order Partially Executed>>>", remaining_buy_volume, remaining_sell_volume, commission);
            await updateBuyWallet(remaining_sell_volume, buy_order.user_id, buy_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase(), commission);
            await updateSellWallet(remaining_sell_volume, sell_order.user_id, sell_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase());
            await updateBuyOrder(remaining_sell_volume, 0, buy_order, sell_order);
            await updatedSellOrder(remaining_sell_volume, 1, buy_order, sell_order);
            await createHistory(remaining_sell_volume, buy_order, sell_order, currency_type, compare_currency, 'buy');
            // if(commission>0) {
            //   await createAdminCommision(commission, buy_order, sell_order, currency_type.toUpperCase(), compare_currency.toUpperCase());
            // }
            isBuy = true;
            if (socket.connected) {
              const obj =  {
                currency_type: currency_type,
                compare_currency: compare_currency,
                raw_price: sell_order_price,
                volume: remaining_sell_volume,
                timestamp: Date.now()
            }
              socket.emit("update_order_history", obj);
            if(buy_order_price == sell_order_price) {
                let obBuy = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_sell_volume,
                };
                let obSell = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_sell_volume,
                };
                socket.emit("delete_buy_stack", obBuy);
                socket.emit("delete_sell_stack", obSell);
            } else {
                let obBuy = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: buy_order_price,
                  volume: remaining_sell_volume,
                };
                let obSell = {
                  currency_type: currency_type,
                  compare_currency: compare_currency,
                  raw_price: sell_order_price,
                  volume: remaining_sell_volume,
                };
                socket.emit("delete_buy_stack", obBuy);
                socket.emit("delete_sell_stack", obSell);      
            }
            
              await updateTokenPriceAfterTrade(
                  currency_type,
                  compare_currency,
                  buy_order_price,
              );
             
              await updateGraphData(
                  currency_type,
                  compare_currency,
                  buy_order_price,
                  remaining_sell_volume
              );
            }
        }
    if(total_execution!=remaining_buy_volume && i<=sellorders.length){
        i=i+1;
        await executeBuyOrder(buy_order, sellorders, currency_type, compare_currency, i, isBuy);
    }
    return true;
}catch(error) {
    console.log("error in exeOrder>order1.js ", error.message);
  }
}

async function executeSellOrder(buyorders, sell_orders, currency_type, compare_currency, i, isSell) {
  const SellStack = require("../models/sell_stack");
    try {
        let total_execution = 0; 
        let buy_order = buyorders[i];
        let sell_order = sell_orders;
        if(isSell) {
          sell_order = await SellStack.findOne({_id: sell_orders._id});
        }
        let buy_order_price = buy_order?round(buy_order.raw_price):0;
        let sell_order_price = sell_order?round(sell_order.raw_price):0;
        let buy_order_volume = buy_order?round(buy_order.volume):0;
        let sell_order_volume = sell_order?round(sell_order.volume):0;
        let buy_order_total_executed = buy_order?round(buy_order.total_executed):0;
        let sell_order_total_executed = sell_order?round(sell_order.total_executed):0;
      
        // console.log(buy_order, sell_order, i);
        let remaining_buy_volume = sub(buy_order_volume, buy_order_total_executed);
        let remaining_sell_volume = sub(sell_order_volume, sell_order_total_executed);
            if (remaining_buy_volume > 0 && remaining_buy_volume == remaining_sell_volume) {
                console.log("Totally Executed>>>", remaining_buy_volume, remaining_sell_volume);
                total_execution = remaining_sell_volume;
                let commission = sub(mul(remaining_sell_volume, buy_order_price),mul(remaining_buy_volume, sell_order_price));
                await updateBuyWallet(remaining_buy_volume, buy_order.user_id, buy_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase(), commission);
                await updateSellWallet(remaining_sell_volume, sell_order.user_id, sell_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase());
                await updateBuyOrder(remaining_buy_volume, 1, buy_order, sell_order);
                await updatedSellOrder(remaining_sell_volume, 1, buy_order, sell_order);
                await createHistory(remaining_buy_volume, buy_order, sell_order, currency_type, compare_currency,'sell');
                // if(commission>0) {
                //   await createAdminCommision(commission, buy_order, sell_order, currency_type.toUpperCase(), compare_currency.toUpperCase())
                // }
                if (socket.connected) {
                  const obj =  {
                    currency_type: currency_type,
                    compare_currency: compare_currency,
                    raw_price: sell_order_price,
                    volume: remaining_sell_volume,
                    timestamp: Date.now()
                }
                socket.emit("update_order_history", obj);
                if(sell_order_price == buy_order_price) {
                    let obSell = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_sell_volume,
                    };
                    let obBuy = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_buy_volume,
                    };
                    socket.emit("delete_sell_stack", obSell);
                    socket.emit("delete_buy_stack", obBuy);
                } else {
                   let obSell = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_sell_volume,
                    };
                    let obBuy = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: buy_order_price,
                        volume: remaining_buy_volume,
                    };
                    socket.emit("delete_sell_stack", obSell);
                    socket.emit("delete_buy_stack", obBuy);
                }
                
                  await updateTokenPriceAfterTrade(
                      currency_type,
                      compare_currency,
                      sell_order_price,
                  );
                  await updateGraphData(
                      currency_type,
                      compare_currency,
                      sell_order_price,
                      remaining_sell_volume
                  );
                }

            } 
            if (remaining_buy_volume > 0 && remaining_buy_volume < remaining_sell_volume) {
                console.log("Buy Order Totally Executed, Sell Order Partially Executed>>>", remaining_buy_volume, remaining_sell_volume);
                total_execution = remaining_buy_volume;
                let commission = sub(mul(remaining_buy_volume, buy_order_price),mul(remaining_buy_volume, sell_order_price));
                await updateBuyWallet(remaining_buy_volume, buy_order.user_id, buy_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase(), commission);
                await updateSellWallet(remaining_buy_volume, sell_order.user_id, sell_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase());
                await updateBuyOrder(remaining_buy_volume, 1, buy_order, sell_order);
                await updatedSellOrder(remaining_buy_volume, 0, buy_order, sell_order);
                await createHistory(remaining_buy_volume, buy_order, sell_order, currency_type, compare_currency, 'sell');
                // if(commission>0) {
                //   await createAdminCommision(commission, buy_order, sell_order, currency_type.toUpperCase(), compare_currency.toUpperCase());
                // }
                isSell = true;
                if (socket.connected) {
                  const obj =  {
                    currency_type: currency_type,
                    compare_currency: compare_currency,
                    raw_price: sell_order_price,
                    volume: remaining_buy_volume,
                    timestamp: Date.now()
                }
                  socket.emit("update_order_history", obj);
                if(buy_order_price == sell_order_price) {
                    let obSell = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_buy_volume,
                    };
                    let obBuy = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_buy_volume,
                    };
                    socket.emit("delete_sell_stack", obSell);
                    socket.emit("delete_buy_stack", obBuy);
                } else {
                  let obSell = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_buy_volume,
                    };
                    let obBuy = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: buy_order_price,
                        volume: remaining_buy_volume,
                    };
                    socket.emit("delete_sell_stack", obSell);
                    socket.emit("delete_buy_stack", obBuy);
                }
                 
                  await updateTokenPriceAfterTrade(
                      currency_type,
                      compare_currency,
                      sell_order_price,
                  );
                  await updateGraphData(
                      currency_type,
                      compare_currency,
                      sell_order_price,
                      remaining_buy_volume
                  );
                }
            } 
            if (remaining_buy_volume > remaining_sell_volume && remaining_sell_volume > 0) {
                console.log("Sell Order Totally Executed, Buy Order Partially Executed>>>", remaining_buy_volume, remaining_sell_volume);
                total_execution = remaining_sell_volume;
                let commission = sub(mul(remaining_sell_volume, buy_order_price),mul(remaining_sell_volume, sell_order_price));
                await updateBuyWallet(remaining_sell_volume, buy_order.user_id, buy_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase(), commission);
                await updateSellWallet(remaining_sell_volume, sell_order.user_id, sell_order_price, currency_type.toUpperCase(), compare_currency.toUpperCase());
                await updateBuyOrder(remaining_sell_volume, 0, buy_order, sell_order);
                await updatedSellOrder(remaining_sell_volume, 1, buy_order, sell_order);
                await createHistory(remaining_sell_volume, buy_order, sell_order, currency_type, compare_currency, 'sell');
                // if(commission>0){
                //   await createAdminCommision(commission, buy_order, sell_order, currency_type.toUpperCase(), compare_currency.toUpperCase());
                // }
                if (socket.connected) {
                  const obj =  {
                    currency_type: currency_type,
                    compare_currency: compare_currency,
                    raw_price: sell_order_price,
                    volume: remaining_sell_volume,
                    timestamp: Date.now()
                }
                socket.emit("update_order_history", obj);
                if(sell_order_price == buy_order_price) {
                    let obSell = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_sell_volume,
                    };
                    let obBuy = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_sell_volume,
                    };
                    socket.emit("delete_sell_stack", obSell);
                    socket.emit("delete_buy_stack", obBuy);
                } else {
                    let obSell = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: sell_order_price,
                        volume: remaining_sell_volume,
                    };
                    let obBuy = {
                        currency_type: currency_type,
                        compare_currency: compare_currency,
                        raw_price: buy_order_price,
                        volume: remaining_sell_volume,
                    };
                    socket.emit("delete_sell_stack", obSell);
                    socket.emit("delete_buy_stack", obBuy); 
                }
                await updateTokenPriceAfterTrade(
                      currency_type,
                      compare_currency,
                      sell_order_price,
                  );
                  await updateGraphData(
                      currency_type,
                      compare_currency,
                      sell_order_price,
                      remaining_sell_volume
                  );
                  
                }
            }
        if(i<=buyorders.length && total_execution!=remaining_sell_volume){
            i=i+1;
            await executeSellOrder(buyorders, sell_order, currency_type, compare_currency, i, isSell);
        }
        return true;
    }catch(error){
        console.log("error in slipAge ", error.message);
        return false;
    }
}
function calculateFee(number, percent) {
    return parseFloat(number) * (parseFloat(percent) / 100.00);
}
async function updateBuyWallet (volume, user_id, price, currency_type, compare_currency, commission=0) {
    const Wallets = require("../models/wallets");
    const WebsiteData = require("../models/website_data");
    // const tdsDetuction = require("../models/tds_detuction");
try{
    let ws = await WebsiteData.findOne({});
    let currency_wallet = await Wallets.findOne({ user:user_id, wallet_type:currency_type }, 'balance user wallet_type locked');
    let compare_currency_wallet = await Wallets.findOne({ user:user_id, wallet_type:compare_currency }, 'balance user wallet_type locked');



    let new_balance = add(currency_wallet.balance, volume);
    await Wallets.updateOne({ _id: currency_wallet._id }, {
        $set: {
            balance: new_balance,
        }
    })
    let compare_currency_change = mul(volume, price);
    let isCommision = sub(compare_currency_change, commission);
    let bal_c = sub(compare_currency_wallet.balance, isCommision);
    let tk_fee = calculateFee(compare_currency_change, ws.taker_fees);
    // let tds_fee = calculateFee(compare_currency_change, ws.tds_fees);
    // let tk_fee = add(tkr_fee, tds_fee);
    let new_balance_cc = sub(bal_c, tk_fee) > 0 ? sub(bal_c, tk_fee) : 0; 
    let new_locked_cc = sub(compare_currency_wallet.locked, compare_currency_change) > 0 ? sub(compare_currency_wallet.locked, compare_currency_change) : 0;
    await Wallets.updateOne({ _id: compare_currency_wallet._id }, {
        $set: {
            balance: new_balance_cc,
            locked: new_locked_cc
        }
    })
    // await tdsDetuction.create({
    //   user_id:user_id,
    //   currency_type:currency_type,
    //   compare_currency:compare_currency,
    //   volume:compare_currency_change,
    //   tds_amount:tds_fee,
    //   type:'buy'
    // })
}catch(error) {
    console.log("error in updateBuyWallet>orders.js ", error.message);
}
}
async function updateSellWallet (volume, user_id, price, currency_type, compare_currency) {
    const Wallets = require("../models/wallets");
    const WebsiteData = require("../models/website_data");
    const tdsDetuction = require("../models/tds_detuction");
try{
    let ws = await WebsiteData.findOne({});
    let currency_wallet = await Wallets.findOne({ user:user_id, wallet_type:currency_type }, 'balance user wallet_type locked');
    let compare_currency_wallet = await Wallets.findOne({ user:user_id, wallet_type:compare_currency }, 'balance user wallet_type locked');
  
    let bal_cc = sub(currency_wallet.balance, volume);
    let mfr_fee = calculateFee(volume, ws.maker_fees);
    let tds_fee = calculateFee(volume, ws.tds_fees);
    let mf_fee = add(mfr_fee, tds_fee);
    let new_balance = sub(bal_cc, mf_fee)>0?sub(bal_cc, mf_fee):0; // subtract fee 
    let new_lock_balance = sub(currency_wallet.locked, volume) > 0 ? sub(currency_wallet.locked, volume) : 0;
    await Wallets.updateOne({ _id: currency_wallet._id }, {
        $set: {
            balance: new_balance,
            locked: new_lock_balance
        }
    })
    let compare_currency_change = mul(volume, price)
    let new_balance_cc = add(compare_currency_wallet.balance, compare_currency_change);
    await Wallets.updateOne({ _id: compare_currency_wallet._id }, {
        $set: {
            balance: new_balance_cc
        }
    })
    await tdsDetuction.create({
      user_id:user_id,
      currency_type:currency_type,
      compare_currency:compare_currency,
      volume:volume,
      tds_amount:tds_fee,
      tds_percent:ws.tds_fees,
      type:'sell'
    })
}catch(error) {
    console.log("error in updateSellWallet>orders.js ", error.message);
}
}
async function updateBuyOrder (volume, status, buy_order, sell_order) {
    const BuyStack = require("../models/buy_stack");
    try {
        const total_executed = add(buy_order.total_executed, volume);
        const last_reansaction = buy_order.last_reansaction + "," + volume;
        const executed_from = buy_order.executed_from + "," + sell_order.user_id;
        const execution_time = buy_order.execution_time + ',' + Date.now();
        await BuyStack.updateOne({ order_id: buy_order.order_id }, {
            $set: {
                sell_raw_price:sell_order.raw_price,
                execution_time: execution_time,
                total_executed: total_executed,
                last_reansaction: last_reansaction,
                order_status: status,
                executed_from: executed_from
            }
        })
    } catch (error) {
        console.log("error in updateBuyOrder>orders.js ", error.message);
    } 
       
}
async function updatedSellOrder (volume, status, buy_order, sell_order) {
    const SellStack = require("../models/sell_stack");
    try {
        const total_executed = add(sell_order.total_executed, volume);
        const last_reansaction = sell_order.last_reansaction + "," + volume;
        const executed_from = sell_order.executed_from + "," + buy_order.user_id;
        const execution_time = sell_order.execution_time + ',' + Date.now();
        await SellStack.updateOne({ order_id: sell_order.order_id }, {
            $set: {
                execution_time: execution_time,
                total_executed: total_executed,
                last_reansaction: last_reansaction,
                order_status: status,
                executed_from: executed_from
            }
        })
    } catch (error) {
        console.log("error in updatedSellOrder>orders.js ", error.message);
    }
}
async function createHistory (volume, buy_order, sell_order, currency_type, compare_currency, type) {
    const TradeHistory = require('../models/trade_history');
    const { createUniqueID } = require('../utils/functions');
      try{
          let price = type=='buy'?buy_order.raw_price:sell_order.raw_price;
          await TradeHistory.create({
            history_id: createUniqueID('history'),
            currency_type: currency_type,
            compare_currency: compare_currency,
            price:price,//sell_order.raw_price,
            buy_order_price:buy_order.raw_price,
            sell_order_price:sell_order.raw_price,
            volume: parseFloat(volume),
            sell_user_id: sell_order.user_id,
            buy_user_id: buy_order.user_id,
            sell_order_id: sell_order.order_id,
            buy_order_id: buy_order.order_id,
            trade_type: "slipAge with sellorder Price",
            trade_date: Date.now()
        });
    }catch (error) {
        console.log("error in updateHistory>orders.js ", error.message);
    }
}
async function createAdminCommision (commission, buy_order, sell_order, currency_type, compare_currency) {
    const adminComm = require("../models/admin_commission");
      try{
          await adminComm.create({
            buy_user_id:buy_order.user_id,
            sell_user_id:sell_order.user_id,
            buy_order_id:buy_order.order_id,
            sell_order_id:sell_order.order_id,
            currency_type: currency_type,
            compare_currency:compare_currency,
            commission:commission
          })

      }catch(error){
        console.log("error in updateAdminCommision>orders.js ", error.message);
      }
}

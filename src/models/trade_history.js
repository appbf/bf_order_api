const mongoose = require("mongoose");

const trade_historySchema = new mongoose.Schema(
  {
    history_id: { type: String },
    currency_type: { type: String },
    compare_currency: { type: String },
    price: { type: Number },
    buy_order_price: { type: Number },
    sell_order_price: { type: Number },
    volume: { type: Number },
    trade_date: { type: String, default: Date.now() },
    sell_user_id: { type: String },
    buy_user_id: { type: String },
    buy_order_id: { type: String },
    sell_order_id: { type: String },
    trade_type: { type: String },
    commition_fee: { type: String }
  },
  { timestamps: true, collection: "trade_history" }
);

module.exports = mongoose.model("trade_history", trade_historySchema);

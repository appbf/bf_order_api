const mongoose = require("mongoose");

const remote_tradingSchema = new mongoose.Schema(
  {
    price:  { type: Number, required:true },
    low:    { type: Number },
    high:   { type: Number },
    min_vol:    { type: Number },
    max_vol:    { type: Number },
    last_price: { type: Number },
    last_vol:   { type: Number },
    order_id:   { type: String },
    compare_currency:   { type: String },
    token:  { type: String },
    currency_type:  { type: String },
    running_status: { type: Number },
    graph:  { type: String },
    update_price:  { type: Boolean,default:false },
    status:  { type: Boolean,default:false },
  },
  { timestamps: true, collection: "remote_trading" }
);

module.exports = mongoose.model("remote_trading", remote_tradingSchema);

const mongoose = require("mongoose");

const tds_detuctionSchema = new mongoose.Schema(
  {
    user_id: { type: String, required:true },
    currency_type: { type: String },
    compare_currency: { type: String },
    type: { type: String },
    volume: { type: Number,required:true},
    tds_amount: { type: Number,required:true },
    tds_percent: { type: Number,default:1 },
    time_stamp: { type: String,default:Date.now() },
  },
  { timestamps: true, collection: "tds_detuction" }
);

module.exports = mongoose.model("tds_detuction", tds_detuctionSchema);

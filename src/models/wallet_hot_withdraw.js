const mongoose = require("mongoose");

const wallet_hot_withdrawSchema = new mongoose.Schema(
  {
   
    wallet_type: { type: String },
    wallet_address: { type: String },
    from_address: { type: String },
    to_address: { type: String },
    amount: { type: Number },
    date: { type: String, default: Date.now() },
    trx_id: { type: String },
    perform_by: { type: String },
  },
  { timestamps: true, collection: "wallet_hot_withdraw" }
);

module.exports = mongoose.model("wallet_hot_withdraw", wallet_hot_withdrawSchema);

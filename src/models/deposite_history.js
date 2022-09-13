const mongoose = require("mongoose");

const deposite_historySchema = new mongoose.Schema(
  {
    id: { type: String },
    user_id: { type:String },
    tx_id: { type: String },
    symbol: { type: String },
    blockNumber: { type: String },
    status: { type: Boolean },
    amount: { type: String },
    from_address: { type: String },
    to_address: { type: String },
    type: { type: String },
    transection_id: { type: String },
    valid: { type: String }
  },
  { timestamps: true, collection: "deposite_history" }
);

module.exports = mongoose.model("deposite_history", deposite_historySchema);

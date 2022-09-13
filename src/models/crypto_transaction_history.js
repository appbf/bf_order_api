const mongoose = require("mongoose");

const crypto_transaction_historySchema = new mongoose.Schema(
  {
    _type: { type: String },
    user_id: { type: String },
    wallet_type: { type: String },
    from_wallet: { type: String },
    to_wallet: { type: String },
    amount: { type: String },
    transaction_date: { type: String },
    transaction_time: { type: String },
    transaction_id: { type: String },
    remark: { type: String },
    status: { type: String },
    check_sum: { type: String },
  },
  { timestamps: true, collection: "crypto_transaction_history" }
);

module.exports = mongoose.model(
  "crypto_transaction_history",
  crypto_transaction_historySchema
);

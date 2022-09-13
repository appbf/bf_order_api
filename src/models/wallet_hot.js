const mongoose = require("mongoose");

const wallet_coldSchema = new mongoose.Schema(
  {
    wallet_type: { type: String },
    wallet_address: { type: String },
    private_key: { type: String },
    qr_code: { type: String },
    total_funds: { type: Number , default:0},
  },
  { timestamps: true, collection: "wallet_hot" }
);

module.exports = mongoose.model("wallet_hot", wallet_coldSchema);

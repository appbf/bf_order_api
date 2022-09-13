const mongoose = require("mongoose");

const wallet_coldSchema = new mongoose.Schema(
  {
    id: { type: Number },
    wallet_type: { type: String, required: true},
    wallet_address: { type: String, required: true },
    total_funds: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "wallet_cold" }
);

module.exports = mongoose.model("wallet_cold", wallet_coldSchema);

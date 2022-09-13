const mongoose = require("mongoose");

const walletsSchema = new mongoose.Schema(
  {
    private_key: { type: String, required: true },
    // public_key: { type: String, required: true },
    wallet_address: { type: String, required: true },
    // wallet_hex: { type: String },
    wallet_type: { type: String, required: true },
    user: { type: String, required: true },
    balance: { type: Number, default: 0 },
    v_balanace: { type: Number, default: 0 },
    locked: { type: Number, default: 0 },
    date: { type: String, default: Date.now() },
    type: { type: String, default: '' },
    contract_address: { type: String, default: '' },
    wallet_status: { type: Number, default: 0 },
    admin_transfer: { type: Number, default: 0 }
  },
  { timestamps: true, collection: "wallets" }
);

module.exports = mongoose.model("wallets", walletsSchema);

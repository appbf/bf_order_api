const mongoose = require("mongoose");

const teansaction_history = new mongoose.Schema(
    {
        transaction_hash: { type: String, required: true, unique: true },
        currency_type: { type: String, required: true },
        to: { type: String, required: true },
        volume: { type: Number, required: true },
        timestamp: { type: String, required: true }
    },
    { timestamps: true, collection: "teansaction_history" }
);

module.exports = mongoose.model("teansaction_history", teansaction_history);

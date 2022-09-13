const mongoose = require("mongoose");

const pending_transaction = new mongoose.Schema(
    {
        user_id: { type: String, required: true },
        wallet_type: { type: String, required: true },
    },
    { timestamps: true, collection: "pending_transaction" }
);

module.exports = mongoose.model("pending_transaction", pending_transaction);

const mongoose = require("mongoose");
const PairedSchema = new mongoose.Schema(
    {
        currency_coin: { type: String, required: true, unique: true },
        initial_price: { type: String, unique: true },
        currency_logo: { type: String, default: null },
        currency_name: { type: String, default: null },
        status: { type: Boolean, default: false },
    },
    { timestamps: true, collection: "paired_currency" }
);



module.exports = mongoose.model("paired_currency", PairedSchema);

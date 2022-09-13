const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    user: { type: String },
    referrer: { type: String },
    userId: { type: String },
    referrerId: { type: Number },
    block_timestamp: { type: String },
    transaction_id: { type: String },
    block_number: { type: String },
  },
  { timestamps: true, collection: "registration" }
);

module.exports = mongoose.model("registration", registrationSchema);

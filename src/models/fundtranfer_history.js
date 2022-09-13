const mongoose = require("mongoose");

const fundtranfer_historySchema = new mongoose.Schema(
  {
    to_user:    { type: String },
    from_user:  { type: String },
    wallet_type:    { type: String },
    amount: { type: Number },
    date:   { type: String, default: Date.now() },
  },
  { timestamps: true, collection: "fundtranfer_history" }
);

module.exports = mongoose.model("fundtranfer_history", fundtranfer_historySchema);

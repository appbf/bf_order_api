const mongoose = require("mongoose");

const token_ownerSchema = new mongoose.Schema(
  {
    user_name: { type: String },
    token_name: { type: String },
    user_id: { type: String },
  },
  { timestamps: true, collection: "token_owner" }
);

module.exports = mongoose.model("token_owner", token_ownerSchema);

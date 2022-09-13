const mongoose = require("mongoose");

const airdrop_commissionSchema = new mongoose.Schema(
  {
    user_id: { type: String, required:true },
    commission: { type: Number,required:true, default:0 },
    time_stamp: { type: String,default:Date.now() },
    wallet_type: { type: String,required:true },
  },
  { timestamps: true, collection: "airdrop_commission" }
);

module.exports = mongoose.model("airdrop_commission", airdrop_commissionSchema);
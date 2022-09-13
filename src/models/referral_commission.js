const mongoose = require("mongoose");

const referral_commissionSchema = new mongoose.Schema(
  {
    user_id: { type: String, required:true },
    _from: { type: String, required:true },
    commission: { type: Number,required:true, default:0 },
    time_stamp: { type: String,default:Date.now() },
    wallet_type: { type: String,required:true },
  },
  { timestamps: true, collection: "referral_commission" }
);

module.exports = mongoose.model("referral_commission", referral_commissionSchema);

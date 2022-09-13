const mongoose = require("mongoose");

const admin_commissionSchema = new mongoose.Schema(
  {
    buy_user_id: { type: String, required:true },
    sell_user_id: { type: String, required:true },
    buy_order_id: { type: String, required:true },
    sell_order_id: { type: String, required:true },
    currency_type: { type: String },
    compare_currency: { type: String },
    commission: { type: Number,required:true, default:0 },
    time_stamp: { type: String,default:Date.now() },
  },
  { timestamps: true, collection: "admin_commission" }
);

module.exports = mongoose.model("admin_commission", admin_commissionSchema);

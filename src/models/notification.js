const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String },
    user_id: { type:String },
    name: { type: String },
    msg: { type: String },
    table_name: { type: String },
    seen_status: {type: Number, default:0 }
  },
  { timestamps: true, collection: "notification" }
);

module.exports = mongoose.model("notification", notificationSchema);

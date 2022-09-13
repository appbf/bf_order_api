const mongoose = require("mongoose");

const activity_historySchema = new mongoose.Schema(
  {
    id: { type: String },
    user_id: { type:String },
    sys_info: { type: String },
    browser_info: { type: String },
    ip_address: { type: String }
  },
  { timestamps: true, collection: "activity_log" }
);

module.exports = mongoose.model("activity_log", activity_historySchema);

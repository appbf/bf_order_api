const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    bank_name: { type: String, required: true },
    name: { type: String, required: true  },
    account_number: { type: Number, required: true },
    ifsc: {type: String, required: true},
    account_type: { type: String, required: true },
    submit_date: { type: String, default: '' },
    accept_date: { type: String, default: '' },
    status: { type: Number , default: 0,},
    auditor_id: { type: String, default: '' },
    auditor_msg: { type: String, default: '' },
    email: { type: String, required: true },
  },
  { timestamps: true, collection: "user_bank_details" }
);

module.exports = mongoose.model("user_bank_details", userSchema);
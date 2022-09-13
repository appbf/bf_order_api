const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    middle_name: { type: String },
    last_name: { type: String },
    date_of_birth: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zip_code: { type: String, required: true },
    added_on: { type: String, default: Date.now()  },
    kyc_type: { type: String, required: true, default: 'individual'  },
    doc_1_type: { type: String, default: '' },
    doc_1_no: {type: String, default: ''},
    doc_1_s: { type: String, default: '' },
    doc_1_f: { type: String, default: '' },
    doc_1_b: { type: String, default: '' },
    doc_2_type: { type: String , default: 'pancard',},
    doc_2_no: { type: String, default: '' },
    doc_2_f: { type: String, default: '' },
    status: { type: Number, default: 0 },
    auditing_date: { type: String, default: '' },
    auditor_msg: { type: String, default: '' }
  
  },
  { timestamps: true, collection: "pending_kyc" }
);

module.exports = mongoose.model("pending_kyc", userSchema);

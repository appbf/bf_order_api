const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const otpBuffer = new mongoose.Schema(
    {
        user_id: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        email_otp: { type: String, default: null },
        mobile_otp: { type: String, default: null },
        kyc_otp: { type: String, default: null },
    },
    { timestamps: true, collection: "user" }
);



module.exports = mongoose.model("OtpBuffer", otpBuffer);

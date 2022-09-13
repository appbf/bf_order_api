const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    website_name: { type: String, default: '' },
    bg_color: { type: String, default: "" },
    bg_color_code: { type: String, default: "" },
    website_title: { type: String, default: '' },
    website_short_name: { type: String, default: '' },
    website_disc: { type: String, default: "" },
    support_email: { type: String, default: "" },
    contact_email: { type: String, default: "" },
    info_email: { type: String, default: "" },
    noreply_email: { type: String, default: "" },
    about_us: { type: String, default: "" },
    logo_img_name: { type: String, default:''},
    favicon_img_name: { type: String, default: "" },
    slogo_img_name: { type: String, default: "" },
    logo_with_title: { type: String, default: "" },
    cms_key: { type: String, default: "" },
    rozarpay_key: { type: String, default: "" },
    msg91_smskey: { type: String, default: "" },
    msg91_emailkey: { type: String, default: "" },
    commision_fee: { type: String, default: "" },
    referral_coin: { type: String, default: "" },
    referral_fee: { type: Number, default: "" },
    airdrop_coin: { type: String, default: "" },
    airdrop_fee: { type: Number, default: "" },
    maker_fees: { type: Number, default: 0 },
    taker_fees: { type: Number, default: 0 },
    trade_fees: { type: Number, default: 0 },
    tds_fees: { type: Number, default: 1 },
    wallet_password: { type: String, default: "123456" },
    news_later: {type: String, default: '' },
    banner_url: {type: String, default: '' },
    banner_status: {type: Boolean, default: false }
  },
  { timestamps: true, collection: "website_data" }
);

module.exports = mongoose.model("website_data", settingSchema);

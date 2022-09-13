const mongoose = require("mongoose");

const inrx_user_profileSchema = new mongoose.Schema(
  {
    user_id: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    dob: { type: String },
    fname: { type: String },
    lname: { type: String },
    mname: { type: String },
    pin_zip: { type: String },
    profile_img: { type: String },
    state: { type: String },
    email: { type: String },
  },
  { timestamps: true, collection: "inrx_user_profile" }
);

inrx_user_profileSchema.virtual("fullName").get(function () {
  return `${this.fname} ${this.mname} ${this.lname}`;
});

inrx_user_profileSchema.virtual("fulladdress").get(function () {
  return `${this.address} ${this.city} ${this.country} ${this.pin_zip}`;
});

module.exports = mongoose.model("inrx_user_profile", inrx_user_profileSchema);

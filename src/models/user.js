const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    email: { type: String, required: true },
    hashedPassword: { type: String, required: true },
    mobile_number: { type: Number, default: '' },
    created_on: {type: String, default: Date.now()},
    self_ref_code: { type: String, default: '' },
    parent_ref_code: { type: String, default: '' },
    user_role: { type: Number, default: 0 },
    is_email_verified: { type: Number , default: false, required: true},
    is_kyc_verified: { type: Number, default: false, required: true },
    is_bank_verified: { type: Number, default: false, required: true },
    is_mobile_verified: { type: Number, default: false, required: true },
    loginToken: { type: String, default: '' },
    referral_income: { type: Number, default: 0.0 },
    ip_address: { type: String, default: '' },
    wallet_password: { type: String, default: ''},
    user_status: { type: Number, default: 1},
    authenticator:{ type: Number, default:0},
    secret_key:{ type: Object, default:false}
  },
  { timestamps: true, collection: "user" }
);

// userSchema.pre('save', function save(next) {
//     if (!this.isModified('password')) return next();
//     try {
//       const salt = bcrypt.genSalt(SALT_WORK_FACTOR);
//       this.password =  bcrypt.hash(this.password, salt);
//       return next();
//     } catch (err) {
//       return next(err);
//     }
//   });
// userSchema.virtual("password").set(function (password) {
//   this.hash_password = bcrypt.hashSync(password, 10);
// });

// userSchema.methods = {
//   authenticate: function (password) {
//     return bcrypt.compareSync(password, this.hash_password);
//   },
// };

// userSchema.virtual('fullName')
//   .get(function () {
//     return `${this.firstName} ${this.lastName}`
//   })

module.exports = mongoose.model("User", userSchema);

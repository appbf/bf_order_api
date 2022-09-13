const user = require("../models/user");
const { formatEmail } = require("../utils/functions");
const { kycUserList,getUserList,kycBankList,updateKYCQuery,updateBankQuery } = require("../utils/functions.users");
const { validateUserId } = require("../utils/validator");
const Users = require('../models/user');
const PendingKYC = require('../models/pending_kyc');

async function searchUsers(req, res) {
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            const is_secure = req.body.is_secure ? req.body.is_secure : true;
            const email = req.body.email ? req.body.email : undefined;
            const user_role = req.body.user_role ? req.body.user_role : undefined;
            const is_email_verified = req.body.is_email_verified ? req.body.is_email_verified : undefined;
            const is_kyc_verified = req.body.is_kyc_verified ? req.body.is_kyc_verified : undefined;
            const is_mobile_verified = req.body.is_mobile_verified ? req.body.is_mobile_verified : undefined;
            const filters = {};
            if (email)
                filters.email = new RegExp(email, "i");
            if (user_role)
                filters.user_role = user_role;
            if (is_email_verified)
                filters.is_email_verified = is_email_verified;
            if (is_kyc_verified)
                filters.is_kyc_verified = is_kyc_verified;
            if (is_mobile_verified)
                filters.is_mobile_verified = is_mobile_verified;
            const users = await user.find(filters);
            if (users) {
                const search_data = users.map((user) => {
                    return {
                        email: is_secure ?formatEmail(user.email):user.email,
                        created_on: user.created_on,
                        self_ref_code: user.self_ref_code,
                        parent_ref_code: user.parent_ref_code,
                        user_role: user.user_role,
                        is_email_verified: user.is_email_verified,
                        is_kyc_verified: user.is_kyc_verified,
                        is_bank_verified: user.is_bank_verified,
                        is_mobile_verified: user.is_mobile_verified,
                        referral_income: user.referral_income,
                    }
                })
                
                return res.json({
                    status: 200,
                    error: false,
                    message: "User list found",
                    data: search_data
                })
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid request"
                })
            }
        } else {
            const { action,raw,user_id } = req.query;
            const data = await getUserList(action,raw,user_id);
            return res.json( data )
            
        }
    } catch (error) {
        console.log("Error: from: src>controller>user.js: ", error.message);
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong!"
        })
    }
}
async function kycUser(req, res) {
    try {
        const { action,raw,user_id } = req.query;
        // console.log(action,raw,user_id);
        const data = await kycUserList(action,raw,user_id);
        return res.json( data )
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function bankUser(req, res) {
    try {
        const { action,raw,user_id } = req.query;
        const data = await kycBankList(action,raw,user_id);
        return res.json( data )
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function updatekyc(req, res) {
    try {
        const { msg,status,user_id } = req.body;
        if(msg && status && user_id){
            const data = await updateKYCQuery(msg,status,user_id);
            return res.json( data )
        }
        return res.json({
            status: 300,
            msg: msg,
            status: status,
            user_id: user_id,
            message: `Error! insufficient data}`
        })
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function updatebank(req, res) {
    try {
        const { msg,status,user_id } = req.body;
        if(msg && status && user_id){
            const data = await updateBankQuery(msg,status,user_id);
            return res.json( data )
        }
        return res.json({
            status: 300,
            msg: msg,
            status: status,
            user_id: user_id,
            message: `Error! insufficient data}`
        })
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
async function getUserProfile(req, res) {
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            let profile_data = {};
            const user_data = await Users.findOne({ user_id: user_id });
            if (user_data) {
                profile_data.email = user_data.email;
                profile_data.mobile_number = user_data.mobile_number?user_data.mobile_number:'';
                const kyc_data = await PendingKYC.findOne({ user_id: user_id });
                if (kyc_data) {
                    let fname = kyc_data.first_name ? kyc_data.first_name : '';
                    let mname = kyc_data.middle_name ? kyc_data.middle_name : '';
                    let lname = kyc_data.last_name ? kyc_data.last_name : '';
                    let full_name = fname + ' ' + mname + ' ' + lname;
                    profile_data.name = full_name;
                }
                return res.json({
                    status: 200,
                    error: false,
                    params: {
                        profile_info: profile_data
                    },
                    message: "Success"
                })
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid request"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid Request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again"
        })
    }
}

async function getAllReferalInfo(req, res) {
    const ReferalCommission = require("../models/user");
    try {
        const { action } = req.body;
        if (action == 'all_referal' ) {
            const all_referals = await ReferalCommission.aggregate( [
                { "$match": { 
                    referral_income: {$gt: 1}
                } }, 
                { $lookup: {
                    from: "pending_kyc",
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "pending_kyc",
                }
                },
            ] );
            // const all_referals = await ReferalCommission.find({referral_income: {$gt: 1} }).sort({"referral_income":-1});
            return res.json({
                status: 200,
                error: false,
                data: all_referals,
                message: "success"
            })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again"+error.message
        })
    }
}
async function getReferalInfo(req, res) {
    const ReferalCommission = require("../models/referral_commission");
    const User = require("../models/user");
    try {
        var { user_id } = req.body;
        if(!user_id){
           var { user_id }  = req.query;
        }
        if (user_id && validateUserId(user_id)) {
            const all_referals = await ReferalCommission.find({ user_id: user_id });
            const user_data           = await User.findOne({user_id:user_id})
            if (all_referals && Array.isArray(all_referals) && all_referals.length > 0) {
                const referalInfo = all_referals.map(async (referal) => {
                    let _referal = {};
                    _referal.from_id = referal._from;
                    _referal.valume = referal.commission;
                    _referal.wallet_type = referal.wallet_type;
                    _referal.time = referal.time_stamp;
                    const kyc_info = await getUserFullNameFromUserId(referal._from);
                    _referal.name = kyc_info?kyc_info.name:'';
                    _referal.kyc_status = kyc_info?kyc_info.status:0;
                    return _referal;
                })
                Promise.all(referalInfo).then(function (results) {
                    if (results) {
                        let total_earning = 0;
                        results.map((d) => {
                            if (d) {
                                total_earning = parseFloat(total_earning) + parseFloat(d.valume);
                            }
                        })
                        return res.json({
                            status: 200,
                            error: false,
                            params: {
                                total_referal_earning: total_earning,
                                total_referals: results,
                                referral_code: user_data.self_ref_code
                            },
                            message: "Success"
                        })
                    } else {
                        return res.json({
                            status: 200,
                            error: false,
                            params: {
                                total_referal_earning: 0,
                                total_referals: [],
                                referral_code: user_data.self_ref_code
                            },
                            message: "No referal found"
                        })
                    }
                    /** */
                })
            } else {
                return res.json({
                    status: 200,
                    error: false, params: {
                        total_referal_earning: 0,
                        total_referals: [],
                        referral_code: user_data.self_ref_code
                    },
                    message: "No referal found"
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                user_id: user_id,
                message: "Invalid request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again"
        })
    }
}
async function getUserFullNameFromUserId(user_id) {
    const KYC = require('../models/pending_kyc');
    const User = require("../models/user");
    // console.log("Time Satrt: ", Date.now())
    if (user_id && validateUserId(user_id)) {
        try {
            const name_data = await KYC.findOne({ user_id: user_id }, 'first_name middle_name last_name email status');
            // console.log("name date : ankur: ", name_data);
            if (name_data) {
                // console.log("Time End: ", Date.now())
                let name =  (name_data.first_name ? name_data.first_name : '') + '' + (name_data.middle_name ? " " + name_data.middle_name : '') + '' + (name_data.last_name ? " " + name_data.last_name : '');
                if(name.trim().length = 0){
                     name =  name_data?name_data.email: '';
                }
                return {name:name,status:name_data.status};
            } else {
                // find user email from user table
                const user_name_data = await User.findOne({ user_id: user_id }, 'email');
                if (user_name_data) {
                    return {name:user_name_data.email?user_name_data.email:'Unnamed',status:0};
                } else {
                   return undefined; 
                }
            }
        } catch (error) {
            return undefined;
        }
    } else {
        return undefined;
    }
}
async function getActiveKYC(req, res) {
    try {
        const KYCUser = require('../models/pending_kyc');
        const { action,kyc } = req.query;
        if(kyc){
            const data = await KYCUser.find({status:kyc},{first_name:1,middle_name:1,last_name:1,email:1,user_id:1});
            return res.json( {
                status: 200,
                table : data,
                message: 'success'
            } )
        }
        return res.json({
            status: 400,
            error: true,
            message: `Error! insufficient data`
        })
    } catch (error) {
        return res.json({
            status: 400,
            error: true,
            message: `Error! ${error.message}`
        })
    }
}
module.exports = {
    searchUsers,
    kycUser,
    bankUser,
    updatekyc,
    updatebank,
    getUserProfile,
    getUserFullNameFromUserId,
    getReferalInfo,
    getAllReferalInfo,
    getActiveKYC
}
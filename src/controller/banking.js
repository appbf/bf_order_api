const { validateUserId } = require("../utils/validator");
const User = require('../models/user');
const Banking = require('../models/user_bank_details');
async function setBankDetails(req, res) {
    try {
        const { user_id, name, account_number, confirm_account_number, bank_name, account_type, ifsc_code } = req.body;
        if (user_id && validateUserId(user_id)) {
            if (name && account_number && confirm_account_number && bank_name && account_type && ifsc_code) {
                if (account_number === confirm_account_number) {
                    const bank_details = await Banking.findOne({ user_id: user_id });
                    const User_data = await User.findOne({ user_id: user_id });
                    if (bank_details) {
                        await Banking.updateOne({ user_id: user_id }, {
                            $set: {
                                bank_name: bank_name,
                                name: name,
                                account_number: account_number,
                                ifsc: ifsc_code,
                                status:-1,
                                account_type: account_type,
                                submit_date: Date.now(),
                                email:User_data.email
                            }
                        });
                    } else {
                        await Banking.create({
                            user_id: user_id,
                            bank_name: bank_name,
                            name: name,
                            account_number: account_number,
                            ifsc: ifsc_code,
                            status:-1,
                            account_type: account_type,
                            submit_date: Date.now(),
                            email:User_data.email
                        });
                    }
                    return res.json({
                        status: 200,
                        error: false,
                        message: 'Details updated successfully'
                    })
                } else {
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Account number and confirm account number must be same"
                    })
                }
            } else {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Please provide all fields"
                })
            }
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
            message: "Something went wrong, please try again"
        })
    }
}

async function getBankStatus(req, res) {
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            const bank_details = await Banking.findOne({ user_id: user_id });
            if (bank_details) {
                return res.json({
                    status: 200,
                    error: false,
                    params: {
                        bank_details: bank_details
                    },
                    message: "Success"
                })
            } else {
                return res.json({
                    status: 400,
                    error: false,
                    params: {
                        bank_status: 0
                    },
                    message: "Bank details not found"
                })
            }
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
            message: "Something went wrong, please try again"
        })
    }
}

async function inrWithdraw(req, res) {
        const Wallets = require("../models/wallets");
        const SupportedCurrency = require('../models/suppoted_currency');
        const WithDrawHistory = require("../models/withdraw_history");
        const { generateTransectionid, generateOTP } = require("../utils/functions");
        const { setMobileOtp, sendMobileOtp } = require("../utils/functions.users");
        try {
            const { user_id, symbol,  volume, remark } = req.body;
            if(
                user_id && 
                validateUserId(user_id) &&
                symbol &&
                volume>0 && 
                remark
            ) {
                const user_data = await User.findOne({user_id: user_id});
                /**
                 * is_email_verified
                 * is_mobile_verified
                 */
                if (user_data) {
                    const mobile_no = user_data.mobile_number;
                    const email = user_data.email;
                    if (user_data.is_email_verified == 0) {
                        return res.json({
                            status: 400,
                            error: true,
                            message: "Please varifie your email first"
                        })
                    } 
                    if (user_data.is_mobile_verified == 0) {
                        return res.json({
                            status: 400,
                            error: true,
                            message: "Please varifie your mobile no first"
                        })
                    }
                    if (user_data.is_kyc_verified == 0) {
                        return res.json({
                            status: 400,
                            error: true,
                            message: "Please varifie your kyc first"
                        })
                    }
                    if (user_data.is_bank_verified == 0) {
                        return res.json({
                            status: 400,
                            error: true,
                            message: "Please varifie your bank first"
                        })
                    }
                    if (user_data.is_email_verified == 1 && user_data.is_mobile_verified == 1 && user_data.is_kyc_verified == 1 && user_data.is_bank_verified == 1) {
                        const transection_id = Date.now()+generateTransectionid(20);
                        /**
                         * find user_balance to dedicated wallet_type
                         */
                        /**
                         * find withdrawl fee and with draw limit from supported currencty collection
                         */
                        const currency_info = await SupportedCurrency.findOne({symbol: symbol.toUpperCase()});
                        if (currency_info) {
                            let withdrawl_fee = currency_info.withdrawal_fee?parseFloat(currency_info.withdrawal_fee):0;
                            let withdrawl_limit = currency_info.withdrawal_limit?parseFloat(currency_info.withdrawal_limit):0;
                            if (withdrawl_limit >= volume) {
                                const wallet_info = await Wallets.findOne({user: user_id, wallet_type: symbol.toUpperCase()});
                                if (wallet_info) {
                                    let total_available_balance = (wallet_info.balance?parseFloat(wallet_info.balance):0) - (wallet_info.locked?parseFloat(wallet_info.locked):0);
                                    if (total_available_balance > 0 && total_available_balance > volume) {
                                        /**
                                         * update withdrawl history && send otp
                                         */
                                        const otp = generateOTP();
                                        if (otp) {
                                            /**
                                             * update user balance && create transaction history
                                             */
                                            if (setMobileOtp({user_id: user_id, otp: otp})) {
                                                await WithDrawHistory.create({
                                                    user_id: user_id,
                                                    email:email,
                                                    symbol: symbol.toUpperCase(),
                                                    status: 0,
                                                    amount: volume,
                                                    type: 'withdrawal',
                                                    remark: remark,
                                                    transection_id: transection_id,
                                                    otp_varified: false
                                                });
                                                /**
                                                 * send otp then return success responce
                                                 */
                                                    await sendMobileOtp(mobile_no, otp);
                                                    return res.json({
                                                    status: 200,
                                                    error: false,
                                                    params:{
                                                        transection_id:transection_id,
                                                    },
                                                    message: "OTP Send Successfully!"
                                                })
                                            } else {
                                                return res.json({
                                                    status: 400,
                                                    error: true,
                                                    message: "Something went wrong, please try again!"
                                                })
                                            }
                                        } else {
                                            return res.json({
                                                status: 400,
                                                error: true,
                                                message: "Something went wrong, please try again!"
                                            })
                                        }
                                        
                                    }  else {
                                        return res.json({
                                            status: 400,
                                            error: true,
                                            message: "Insufficient fund in wallet!"
                                        })
                                    }
                                } else {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Insufficient fund in wallet!"
                                    })
                                }
                            } else {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Insufficient fund in wallet"
                                })
                            }
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "This currency is not allowed to be withdrawal!"
                            })
                        }
                    }
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Please varifie your email and mobile first"
                    })
                } else {
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Invalid Request"
                    })
                }
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
                message: "Something went wrong, please try again"
            })
        }
}

async function successInrWithdraw(req, res) {
    const WithdrawHistory = require('../models/withdraw_history');
    const SupportedCurrency = require('../models/suppoted_currency');
    const Wallets = require("../models/wallets");
    const { generateOTP } = require("../utils/functions");
    const fetch = require('cross-fetch');
    try{
        const {transection_id} = req.body;
        if(transection_id) {
            const Withdraw_history = await WithdrawHistory.findOne({transection_id:transection_id, status:2});
            if(Withdraw_history) {
                const wallet_type =  Withdraw_history.symbol;
                let amount = parseFloat(Withdraw_history.amount);
                const currency_info = await SupportedCurrency.findOne({symbol: wallet_type.toUpperCase()});
                if (currency_info) {
                    let withdrawl_fee = currency_info.withdrawal_fee?parseFloat(currency_info.withdrawal_fee):0;
                    const wallet_data=await Wallets.findOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()});
                    if (wallet_data) {
                        let total_available_balance = (wallet_data.balance?parseFloat(wallet_data.balance):0) - (wallet_data.locked?parseFloat(wallet_data.locked):0);
                        console.log("total_available_balance", total_available_balance);
                        if (total_available_balance > 0 && total_available_balance >= amount) {
                            // console.log("final_amount", final_amount);
                            /**
                             * check for hotwallet fund
                             */
                             const bank_details = await Banking.findOne({ user_id: Withdraw_history.user_id});
                             if(bank_details) {
                                    let total_final_amt = amount - withdrawl_fee;
                                    let name = bank_details.name.split(' ').join('');
                                    let account_no = bank_details.account_number;
                                    let ifsc_code = bank_details.ifsc;
                                    let uniq_id = generateOTP();
                                    let user_name = '7903653494';
                                    let password = '79503';
                                    fetch(`http://nadcabpay.in/MoneyTransferApi/payouts.php?username=${user_name}&password=${password}&account_holder_fname=${name}&account_holder_lname=${name}&bank_account_no=${account_no}&bank_ifsc_code=${ifsc_code}&Amount=${total_final_amt}&purpose=BONUS&ClientId=${uniq_id}`)
                                    .then(data=>data.json())
                                    .then((d) =>{
                                        if(d.status == 'PENDING' || d.status == 'SUCCESS') {
                                            const new_balance = parseFloat(wallet_data.balance)-amount;
                                            //  console.log("final_amount", new_balance);
                                            Wallets.updateOne({user:Withdraw_history.user_id, wallet_type:wallet_type.toUpperCase()},{
                                                $set: {
                                                balance: new_balance,
                                                },
                                            }).then(() => {
                                                WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        tx_id:d.orderid,
                                                        status: 1,
                                                    },
                                                }).then(()=>{
                                                    return res.json({
                                                        status:200,
                                                        error:false,
                                                        message:"INR WITHDRAWAL SUCCESSFULLY!"
                                                    });
                                                });
                                            })
                                        } else {
                                            WithdrawHistory.updateOne({transection_id:transection_id},{
                                                $set: {
                                                    status: -2,
                                                },
                                            }).then(() => {
                                                return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"INR NOT Withdraw"
                                                });
                                            }).catch((error) =>{
                                                WithdrawHistory.updateOne({transection_id:transection_id},{
                                                    $set: {
                                                        status: -2,
                                                    },
                                                });
                                               return res.json({
                                                    status:400,
                                                    error:true,
                                                    message:"data fetch!!"
                                                });
                                            })
                                        }
                                    })
                               
                            }else {
                                await WithdrawHistory.updateOne({transection_id:transection_id},{
                                    $set: {
                                        status: -2,
                                    },
                                });
                                return res.json({
                                    status:400,
                                    error:true,
                                    message:"bank deatils Not Found data fetch!!"
                                });
                            }
                        } else {
                            await WithdrawHistory.updateOne({transection_id:transection_id},{
                                $set: {
                                    status: -2,
                                },
                            });
                            return res.json({
                                status:400,
                                error:true,
                                message:"amount is big data fetch!!"
                            });
                        }
                    } else {
                        await WithdrawHistory.updateOne({transection_id:transection_id},{
                            $set: {
                                status: -1,
                            },
                        });
                        return res.json({
                            status:400,
                            error:true,
                            message:"wallet data Not Found!"
                        });
                    }
                } else {
                    return res.json({
                        status:400,
                        error:true,
                        message:"Currency Not Found!"
                    });
                }
            } else {
                return res.json({
                    status:400,
                    error:true,
                    message:"Invalid Request *"
                });
            }
        } else {
            return res.json({
                status:400,
                error:true,
                message:"Invalid Request **"
            });
        }
    } catch (error) {
        return res.json({
            status:400,
            error:true,
            message:"Somthing went Wrong!!",
            err:error.message
        });
    }
}

// async function deleteBankDetails(req, res) {
//     const Banking = require('../models/user_bank_details');
//     try {
//         const { user_id, msg} = req.body;
//         if (user_id && validateUserId(user_id)) {
//             if (msg=='update') {
//                 const bank_details = await Banking.findOne({ user_id: user_id });
//                 if(bank_details) {
//                     await Banking.updateOne({ user_id: user_id }, {
//                         $set: {
//                             status:3,
//                             submit_date: Date.now()
//                         }
//                     });
//                     return res.json({
//                         status: 200,
//                         error: false,
//                         message: 'Requsted Successfully!!'
//                     })
//                 } else {
//                     return res.json({
//                         status: 400,
//                         error: false,
//                         message: 'Not Requested. Somthing Went Wrong!!'
//                     })
//                 }
//             } else if (msg=="delete") {
//                 /**
//                  * get client_user_id
//                  * check user_id is admin or not
//                  */
//                  return res.json({
//                     status: 400,
//                     error: false,
//                     message: 'Admin Delete Code!!'
//                 })
//             } else {    
//                 return res.json({
//                     status: 400,
//                     error: false,
//                     message: 'Something went wrong, please try again **'
//                 })
//             }
           
//         } else {
//             return res.json({
//                 status: 400,
//                 error: true,
//                 message: "Invalid request"
//             })
//         }
//     } catch (error) {
//         return res.json({
//             status: 400,
//             error: true,
//             message: "Something went wrong, please try again"
//         })
//     }
// }
async function getBank(req, res) {
    try {
        const { user_id } = req.body;
        if(user_id && validateUserId(user_id)) {
       const json_bank= require('../json/bank.json');
        return res.json({
            status: 200,
            error:false,
            params: {
                bank: json_bank
            },
            message: "Data fetch!"
        })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request"
            })
        }

    }catch(error) {
        return res.json({
            status: 400,
            error: true,
            message:"Somthing went wrong, Please try again",
            err:error.message
        })
    }
}


module.exports = {
    setBankDetails,
    getBankStatus,
    inrWithdraw,
    successInrWithdraw,
    getBank
}
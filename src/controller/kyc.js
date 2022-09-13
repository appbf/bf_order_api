const { validateUserId } = require("../utils/validator");
const KYC = require('../models/pending_kyc');
const User = require('../models/user');
const { uploadImage } = require("../utils/functions.kyc");

// const multer = require('multer');
// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, '../../d/images')
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + "-" + file.originalname)
//     }
// })
// var upload = multer({ storage: storage });

async function setPersonalInfo(req, res) {
    try {
        const { user_id, kyc_type, first_name, date_of_birth, address, country, state, city, pincode,email } = req.body;
        const middle_name = req.body.middle_name ? req.body.middle_name : '';
        const last_name = req.body.last_name ? req.body.last_name: '';
        // console.log(user_id)
        if (user_id && validateUserId(user_id)) {
            const user_kyc_data = await KYC.findOne({user_id: user_id});
            const user_data = await User.findOne({user_id: user_id});
            if (!user_kyc_data) {
                KYC.create({
                    user_id: user_id,
                    kyc_type: kyc_type,
                    first_name: first_name,
                    middle_name: middle_name,
                    last_name: last_name,
                    date_of_birth: date_of_birth.toString().trim(),
                    address: address.trim(),
                    country: country.trim(),
                    state: state.trim(),
                    city: city.trim(),
                    zip_code: pincode.trim(),
                    email: user_data.email
                }).then(() => {
                    return res.json({
                        status: 200,
                        error: false,
                        message: "Submitted successfully!"
                    })
                }).catch((error) => {
                    console.log("Error from : controller>kyc.js>setPersonalInfo: ", error.message)
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Something went wrong, please try again!"
                    })
                })
            } else {
                KYC.updateOne({user_id: user_id}, {
                    $set: {
                        kyc_type: kyc_type,
                        first_name: first_name,
                        middle_name: middle_name,
                        last_name: last_name,
                        date_of_birth: date_of_birth.toString(),
                        address: address,
                        country: country,
                        state: state,
                        city: city,
                        zip_code: pincode
                    }
                }).then(() => {
                    return res.json({
                        status: 200,
                        error: false,
                        message: "Submitted successfully!"
                    })
                }).catch((error) => {
                    console.log("Error from : controller>kyc.js>setPersonalInfo: ", error.message)
                    return res.json({
                        status: 400,
                        error: true,
                        message: "Something went wrong, please try again!"
                    })
                })
            }
        } else {
            return res.json({
                status: 400,
                error: true,
                message: 'Invalid request'
            })
        }
    } catch (error) {
        console.log("Error from : controller>kyc.js>setPersonalInfo (last): ", error.message)
        return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again!"
        })
    }
}
/**
 * title> doct > document type
 * 
 * title> docn > aadhar no
 * title> docf > aadhar front
 * title> docb > aadhar back
 * title> docs > aadhar selfie
 * 
 * title> pann > pan no
 * title> panf > pan front
 *
 */
async function updateKYCDocument(req, res) {
//    console.log("body: ", req.body, req.files);    
    try {
        const { user_id, title, data } = req.body;
        if (user_id && validateUserId(user_id)) {
            if (title && data) {
                switch (title) {
                    case 'docn':
                        if (data.type && data.value) {
                            KYC.updateOne({ user_id: user_id }, {
                                $set: {
                                    doc_1_no: data.value,
                                    doc_1_type: data.type
                                }
                            }).then(() => {
                                return res.json({
                                    status: 200,
                                    error: false,
                                    message: "Submitted successfully"
                                })
                            }).catch((error) => {
                                return res.json({
                                    status: 400,
                                    error: error.message,
                                    message: "Something went wrong*"
                                })
                            })
                        } else {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Invalid request"
                            })
                        }
                        break;
                    case 'docf':
                        try {
                            /**
                             * size and type validation need to be written in here
                             */
                            const files = req.files;
                            // console.log(files.file)
                            const url = await uploadImage(files.file, false, user_id+'-'+'docf');
                            if (url) {
                                KYC.updateOne({ user_id: user_id }, {
                                    $set: {
                                        doc_1_f: url
                                    }
                                }).then(() => {
                                    return res.json({
                                        status: 200,
                                        error: false,
                                        message: "Submitted successfully"
                                    })
                                }).catch((error) => {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Something went wrong"
                                    })
                                })
                            } else {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Unable to upload data"
                                })
                            }
                        } catch (error) {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again"
                            })
                        }
                        break;
                    case 'docb':
                        try {
                            /**
                             * size and type validation need to be written in here
                             */
                             const files = req.files;
                            // console.log(files.file)
                            const url = await uploadImage(files.file, false, user_id+'-'+'docb');
                            if (url) {
                                KYC.updateOne({ user_id: user_id }, {
                                    $set: {
                                        doc_1_b: url
                                    }
                                }).then(() => {
                                    return res.json({
                                        status: 200,
                                        error: false,
                                        message: "Submitted successfully"
                                    })
                                }).catch((error) => {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Something went wrong"
                                    })
                                })
                            } else {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Unable to upload data"
                                })
                            }
                        } catch (error) {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again"
                            })
                        }
                        break;
                    case 'docs':
                        try {
                            /**
                             * size and type validation need to be written in here
                             */
                             const files = req.files;
                            // console.log(files.file)
                            const url = await uploadImage(files.file, false, user_id+'-'+'docs');
                            if (url) {
                                KYC.updateOne({ user_id: user_id }, {
                                    $set: {
                                        doc_1_s: url
                                    }
                                }).then(() => {
                                    return res.json({
                                        status: 200,
                                        error: false,
                                        message: "Submitted successfully"
                                    })
                                }).catch((error) => {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Something went wrong"
                                    })
                                })
                            } else {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Unable to upload data"
                                })
                            }
                        } catch (error) {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again"
                            })
                        }
                        break;
                    case 'pann':
                        KYC.updateOne({ user_id: user_id }, {
                            $set: {
                                doc_2_no: data
                            }
                        }).then(() => {
                            return res.json({
                                status: 200,
                                error: false,
                                message: "Submitted successfully"
                            })
                        }).catch((error) => {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong"
                            })
                        })
                        break;
                    case 'panf':
                        try {
                            /**
                             * size and type validation need to be written in here
                             */
                             const files = req.files;
                            // console.log(files.file)
                            const url = await uploadImage(files.file, false, user_id+'-'+'panf');
                            if (url) {
                                KYC.updateOne({ user_id: user_id }, {
                                    $set: {
                                        doc_2_f: url,
                                        // status: -1
                                    }
                                }).then(() => {
                                    return res.json({
                                        status: 200,
                                        error: false,
                                        message: "Submitted successfully"
                                    })
                                }).catch((error) => {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Something went wrong"
                                    })
                                })
                            } else {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Unable to upload data"
                                })
                            }
                        } catch (error) {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again"
                            })
                        }
                        break;
                    case 'kycstatus':
                        /**
                         * check for kyc docs
                         * and update status
                         */
                        try {
                            KYC.findOne({ user_id: user_id }).then( (data) => {
                                if (data) {
                                    // console.log(data)
                                    const first_name = data.first_name ? data.first_name : undefined,
                                        date_of_birth = data.date_of_birth ? data.date_of_birth : undefined,
                                        address = data.address ? data.address : undefined,
                                        state = data.state ? data.state : undefined,
                                        city = data.city ? data.city : undefined,
                                        country = data.country ? data.country : undefined,
                                        zipcode = data.zip_code ? data.zip_code : undefined,
                                        kyc_type = data.kyc_type ? data.kyc_type : undefined,
                                        doc_1_type = data.doc_1_type ? data.doc_1_type : undefined,
                                        doc_1_no = data.doc_1_no ? data.doc_1_no : undefined,
                                        doc_1_s = data.doc_1_s ? data.doc_1_s : undefined,
                                        doc_1_f = data.doc_2_f ? data.doc_2_f : undefined,
                                        doc_1_b = data.doc_1_b ? data.doc_1_b : undefined,
                                        doc_2_type = data.doc_2_type ? data.doc_2_type : undefined,
                                        doc_2_no = data.doc_2_no ? data.doc_2_no : undefined,
                                        doc_2_f = data.doc_2_f ? data.doc_2_f : undefined;
                                    if (
                                        first_name && date_of_birth && address && state &&
                                        city && country && zipcode && kyc_type && doc_1_type &&
                                        doc_1_no && doc_1_s && doc_1_f && doc_1_b &&
                                        doc_2_no && doc_2_f
                                    ) {
                                        /**
                                         * update status at 2 places 1 is user collection and another is pending kyc_collection
                                         */
                                        KYC.updateOne({ user_id: user_id }, {
                                            $set: {
                                                status: -1
                                            }
                                        }).then((data) =>{
                                            return res.json({
                                                status: 200,
                                                error: false,
                                                params: {
                                                    kyc_status: -1
                                                },
                                                message: "KYC updated successfully"
                                            })
                                        }).catch((error) => {
                                            return res.json({
                                                status: 400,
                                                error: true,
                                                message: "Something went wrong, please try again."
                                            })
                                        });
                                    } else {
                                        return res.json({
                                            status: 400,
                                            error: true,
                                            message: "Please provide all the required option in kyc",
                                        })
                                    }
                                } else {
                                    return res.json({
                                        status: 400,
                                        error: true,
                                        message: "Invalid Request"
                                    })
                                }
                            }).catch((error) => {
                                return res.json({
                                    status: 400,
                                    error: true,
                                    message: "Something went wrong, please try again.."
                                })
                            })
                        } catch (error) {
                            return res.json({
                                status: 400,
                                error: true,
                                message: "Something went wrong, please try again"
                            })
                        }
                        break;
                }
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
                message: "Invalid request"
            })
        }
    } catch (error) {
        return res.json({
            status: 400,
            error: error.message,
            message: "Something went wrong="
        })
    } 

}
async function checkKYCStatus(req, res) {
    try {
        const { user_id } = req.body;
        if (user_id && validateUserId(user_id)) {
            KYC.findOne({ user_id: user_id }).then((kyc_data) => {
                if (kyc_data && kyc_data.status) {
                    return res.json({
                        status: 200,
                        error: false,
                        params: {
                            kyc_status: kyc_data.status
                        },
                        message: "Kyc status found"
                    })
                } else {
                    return res.json({
                        status: 200,
                        error: false,
                        params: {
                            kyc_status: 0
                        },
                        message: "Kyc not filled yet"
                    })
                }
            }).catch((error) => {
                return res.json({
                    status: 400,
                    error: true,
                    message: "Invalid request"
                })
            })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request"
            })
        }
    } catch (error) {
        console.log("Error from : controller>KYC.js>checkKYCStatus: ", error.message)
        return res.json({
            status: 400,
            error: true,
            message: "something went wrong, please try again"
        })
    }
}

async function getCountry(req, res) {
    try {
        const { user_id, action, country_name, state_name } = req.body;
        if (user_id && validateUserId(user_id) && action) {
            const country = require("../json/country.json");
            let country_data=[];
            if(action == 'country') {
                country.map((item, index) =>{
                    country_data[index] = item.name;
                });
            }
            if(action == 'state' && country_name) {
                country.map((item) =>{
                    if(country_name == item.name) {
                        country_data = item.states.map((data)=>{
                            return data.name;
                        })
                    }
                });
            }
            if(action == 'city' && country_name && state_name) {
                country.map((item) =>{
                    if(country_name == item.name) {
                        item.states.map((data)=>{
                            if(data.name == state_name){
                                country_data = data.cities;
                            }
                        })
                    }
                });
            }
            return res.json({
                status: 200,
                error: false,
                params:{
                    country_data:country_data
                }
            })
        } else {
            return res.json({
                status: 400,
                error: true,
                message: "Invalid request"
            })
        }
    } catch (error) {
        console.log("Error from : controller>KYC.js>checkKYCStatus: ", error.message)
        return res.json({
            status: 400,
            error: true,
            message: "something went wrong, please try again"
        })
    }
}

// async function uploadDocument(req, res) {
//     try {
//         const {}
//     } catch (error) {
//         return res.json({
//             status: 400,
//             error: true,
//             mesage: "Something went wrong, please try again"
//         })
//     }
//     uploadImage
// }
module.exports = {
    setPersonalInfo,
    checkKYCStatus,
    updateKYCDocument,
    getCountry
}
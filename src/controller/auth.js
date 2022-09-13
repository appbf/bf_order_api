const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { generateOTP, compareHash, distributeReferal } = require("../utils/functions");
const {
  createNewUser,
  isUserExist,
  setEmailOtp,
  checkPassword,
  updateUserPassword,
  getUserIdFromEmail,
} = require("../utils/functions.users");

const { validateUserId } = require("../utils/validator");

async function registerUser(req, res) {
  const { sendOTP } = require("../utils/mailer");
  try {
    const { email, password, confirm_password } = req.body;
    const parent_ref_code = req.body
      ? req.body.parent_ref_code
        ? req.body.parent_ref_code
        : ""
      : "";
    if (password !== confirm_password) {
      return res.json({
        status: 400,
        error: true,
        message: "password and confirm password must be same",
      });
    }
    /**
     * generating otp for the user
     */
    const otp = generateOTP();
    if (!otp) {
      return res.json({
        status: 400,
        error: true,
        message: "Something went wrong!",
      });
    }
    /**
     * checking if user is already existing or not
     *  2   : exist and verified
     *  1   : exist and not verified
     *  0   : not exist
     * -1   : something went wrong
     * -2   : please provide email
     */
    const user_status = await isUserExist(email);
    if (user_status == -2) {
      return res.json({
        status: 400,
        error: true,
        message: "Please provide email!",
      });
    }
    if (user_status == -1) {
      return res.json({
        status: 400,
        error: true,
        message: "Something went wrong, please try again!",
      });
    }
    if (user_status == 1) {
      return res.json({
        status: 400,
        error: true,
        params: {
          ev: false,
        }, // nv: stands for not varified
        message: "Email already exist, but email is not verified!",
      });
    }
    if (user_status == 2) {
      return res.json({
        status: 400,
        error: true,
        message: "Email already exist!",
      });
    }
    /**
     * storing user in db and its related otp
     */
    const user_id = await createNewUser(email, password, parent_ref_code, otp);
    if (!user_id) {
      return res.json({
        status: 400,
        error: true,
        message: "Something went wrong!",
      });
    }
    /**
     * sending otp on the email of the user
     */
    sendOTP(email, otp);
    return res.json({
      status: 200,
      error: false,
      params: {
        user_id: user_id,
        ev: false,
      },
      message: "User is rugistered and varification otp sent to his mail",
    });
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>registerUser: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong!",
    });
  }
}
async function verifyUserEmail(req, res) {
  const { verifyOTP } = require("../utils/validator");
  const { createUserWallets } = require("../utils/function.wallets");
  const Wallets = require("../models/wallets");
  const OtpBuffer = require("../models/otp_buffer");
  const User = require("../models/user");
  const OTP_LENGTH = 6;
  try {
    const { user_id, otp } = req.body;
    if (user_id && otp && otp.toString().length == OTP_LENGTH) {
      const user_status = await validateUserId(user_id);
      if (user_status) {
        const otp_object = await OtpBuffer.findOne({ user_id: user_id });
        if (otp_object) {
          if (otp_object.email_otp) {
            if (verifyOTP(otp_object.email_otp, otp)) {
              await OtpBuffer.updateOne(
                { user_id: user_id },
                {
                  $set: {
                    email_otp: null,
                  },
                }
              );
              await User.updateOne(
                { user_id: user_id },
                {
                  $set: {
                    is_email_verified: true,
                  },
                }
              );
              const user_wallet = await Wallets.findOne({
                user: user_id,
                wallet_type: "BTC",
              });
              if (user_wallet && user_wallet.wallet_address) {
                console.log("Allready created!");
              } else {
                /**
                 * address creation
                 */
                const iscreated = await createUserWallets(user_id);
                if (iscreated) {
                    console.log("Wallets Created!");
                    /**
                     * distribute  
                     * 
                     */
                    await distributeReferal(user_id);
                } else console.log("Wallets couldn't");
              }

                
              return res.json({
                status: 200,
                error: false,
                params: {
                  ev: true,
                  user_id: user_id,
                },
                message: "OTP verified",
              });
            } else {
              return res.json({
                status: 400,
                error: true,
                message: "Invalid OTP",
              });
            }
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "Invalid OTP",
            });
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid request",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserEmail: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}
async function verifyForgetPassword(req, res) {
  const { verifyOTP } = require("../utils/validator");
  const { createUserWallets } = require("../utils/function.wallets");
  const Wallets = require("../models/wallets");
  const OtpBuffer = require("../models/otp_buffer");
  const User = require("../models/user");
  const OTP_LENGTH = 6;
  try {
    const { email, otp } = req.body;
    if (email && otp && otp.toString().length == OTP_LENGTH) {
      const otp_object = await OtpBuffer.findOne({ email: email });
      if (otp_object) {
        if (otp_object.email_otp) {
          if (verifyOTP(otp_object.email_otp, otp)) {
            await OtpBuffer.updateOne(
              { email: email },
              {
                $set: {
                  email_otp: null,
                },
              }
            );
            await User.updateOne(
              { email: email },
              {
                $set: {
                  is_email_verified: true,
                },
              }
            );
            const user_id = await getUserIdFromEmail(email);
            const user_wallet = await Wallets.findOne({
              user: user_id,
              wallet_type: "BTC",
            });
            if (user_wallet && user_wallet.wallet_address) {
              console.log("Allready created!");
            } else {
              /**
               * adress creator
               */
              const iscreated = await createUserWallets(user_id);
              if (iscreated) console.log("Wallets Created!");
              else console.log("Wallets couldn't");
            }
            return res.json({
              status: 200,
              error: false,
              params: {
                access_token: user_id,
              },
              message: "OTP verified",
            });
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "Invalid OTP",
            });
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid OTP",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid Request",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserEmail: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}
async function resendOtp(req, res) {
  const { sendOTP } = require("../utils/mailer");
  const { getEmailFromUserId } = require("../utils/functions.users");
  try {
    const { user_id } = req.body;
    // console.log("Hi", user_id);
    if (user_id) {
      // generate new otp
      const otp = generateOTP();
      if (!otp) {
        return res.json({
          status: 400,
          error: true,
          message: "Something went wrong!",
        });
      }
      // set it to database
      const email = await getEmailFromUserId(user_id);
      if (email) {
        const otp_status = await setEmailOtp({ user_id, otp });
        if (otp_status) {
          // send as mail
          sendOTP(email, otp);
          return res.json({
            status: 200,
            error: false,
            message: "Email sent successfully",
          });
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Something went wrong",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid Request",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid Request",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>suth.js>resendOtp: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong",
    });
  }
}
async function loginUser(req, res) {
  const User = require("../models/user");
  try {
    const { email, password } = req.body;
    if (password) {
      const user_data = await User.findOne({ email: email });
      if (user_data) {
        /**
         * need to write logic
         */
        const isfound = await compareHash(
          user_data.hashedPassword ? user_data.hashedPassword : "",
          password
        );
        if (isfound) {
          return res.json({
            status: 200,
            error: false,
            params: {
              role: user_data.user_role ? user_data.user_role : 0,
              ev: user_data.is_email_verified
                ? user_data.is_email_verified
                : false,
              user_id: user_data.user_id ? user_data.user_id : undefined,
            },
            message: "Login successfully!",
          });
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Username or password not found",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Username or password not found",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Username or password not found",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: controller>auth.js>loginUser: ",
      error.message,
      error
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again",
    });
  }
}

async function resetPassword(req, res) {
  const { sendOTP } = require("../utils/mailer");
  try {
    const { user_id, last_password, password, confirm_password } = req.body;
    if (!user_id) {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid request",
      });
    }
    if (password !== confirm_password) {
      return res.json({
        status: 400,
        error: true,
        message: "password and confirm password must be same",
      });
    }
    /**
         * generating otp for the user
         
        const otp = generateOTP();
        if (!otp) {
            return res.json({
                status: 400,
                error: true,
                message: "Something went wrong!"
            })
        }*/

    const isValidPassword = await checkPassword(user_id, last_password);
    if (isValidPassword) {
      const status = await updateUserPassword(user_id, password);
      if (status) {
        return res.json({
          status: 200,
          error: false,
          message: "Password changed successfully",
        });
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Something went wrong, please try again",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid last password",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>registerUser: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong!",
    });
  }
}
async function forgetPassword(req, res) {
  const { sendOTP } = require("../utils/mailer");
  try {
    const { email } = req.body;
    if (email) {
      // generate new otp
      const otp = generateOTP();
      if (!otp) {
        return res.json({
          status: 400,
          error: true,
          message: "Something went wrong!",
        });
      }
      // set it to database
      if (email) {
        const otp_status = await setEmailOtp({ email, otp });
        if (otp_status) {
          // send as mail
          sendOTP(email, otp);
          return res.json({
            status: 200,
            error: false,
            message: "Email sent successfully",
          });
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Something went wrong",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid Request",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid Request",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>suth.js>forgetPassword: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong",
    });
  }
}
async function updateNewPassword(req, res) {
  try {
    const { access_token, password, confirm_password } = req.body;
    const user_id = access_token;
    if (user_id) {
      if (password !== confirm_password) {
        return res.json({
          status: 400,
          error: true,
          message: "password and confirm password must be same",
        });
      }
      const status = await updateUserPassword(user_id, password);
      if (status) {
        return res.json({
          status: 200,
          error: false,
          params: {
            user_id: user_id,
          },
          message: "Password changed successfully",
        });
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Something went wrong, please try again",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid request",
      });
    }
  } catch (error) {
    console.log("Error: from: src>controller>auth.js: ", error.message);
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}

async function setGoogleAuth(req, res) {
  const User = require("../models/user");
  const {validateUserId} = require('../utils/validator');
  try {
    const { user_id, secret, status } = req.body;
    if (user_id && validateUserId(user_id)) {
      if (secret!=undefined && status!=undefined) {
        await User.updateOne({user_id: user_id}, {
          $set: {
            secret_key: secret,
            authenticator: status
          }
        })
        return res.json({
          status: 200,
          error: false,
          message: "Successfully updated"
        })
      } else {
        return res.json({
          status: 400,
          error: true,
          mesage: "Invalid arguments*"
        })
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        mesage: "Invalid request"
      })
    }
  } catch(error) {
    console.log(
      "Error: from: src>controller>auth.js>setGoogleAuth: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}

async function setGoogleAuthOTP(req, res) {
  const {validateUserId} = require('../utils/validator');
  try {
    const { user_id, status } = req.body;
    if (user_id && validateUserId(user_id)) {
      if (status!=undefined) {
        await User.updateOne({user_id: user_id}, {
          $set: {
            authenticator: status
          }
        })
        return res.json({
          status: 200,
          error: false,
          message: "Successfully updated"
        })
      } else {
        return res.json({
          status: 400,
          error: true,
          mesage: "Invalid arguments*"
        })
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        mesage: "Invalid request"
      })
    }
  } catch(error) {
    console.log(
      "Error: from: src>controller>auth.js>setGoogleAuthOTP: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}
async function getGoogleAuth(req, res) {
  const User = require("../models/user");
  try {
    const { email, password } = req.body;
    if (email && password) {
        const user_data = await User.findOne({email: email });
        if(user_data) {
          let data = {};
          if (user_data.authenticator==2) {
            data.authenticator_key = user_data.secret_key?user_data.secret_key:'';
          } else if(user_data.authenticator==1) {
            data.mobile_no= user_data.mobile_number?user_data.mobile_number:'';
          }
          data.authenticator_status = user_data.authenticator?user_data.authenticator:0;
          return res.json({
            status: 200,
            error: false,
            params: data,
            message: "Successfully updated"
          })
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request!!"
          })
        }
      
      
    } else {
      return res.json({
        status: 400,
        error: true,
        mesage: "Invalid request"
      })
    }
  } catch(error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserEmail: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}

async function getGoogleAuthFromUserId(req, res) {
  const User = require("../models/user");
  try {
    const { user_id } = req.body;
    if (user_id && validateUserId(user_id)) {
        const user_data = await User.findOne({user_id: user_id });
        if(user_data) {
          let data = {};
          data.authenticator_status = user_data.authenticator?user_data.authenticator:0;
          data.authenticator_key = user_data.secret_key?user_data.secret_key:'';
          return res.json({
            status: 200,
            error: false,
            params: data,
            message: "Successfully updated"
          })
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request!!"
          })
        }
      
      
    } else {
      return res.json({
        status: 400,
        error: true,
        mesage: "Invalid request"
      })
    }
  } catch(error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserEmail: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}
async function check_user_status(req, res) {
  const User = require("../models/user");
  const {validateUserId} = require('../utils/validator');
  try {
    const { user_id } = req.body;
    if (user_id && validateUserId(user_id)) {
        const user_data = await User.findOne({user_id: user_id});
        if(user_data) {
          return res.json({
            status: 200,
            error: false,
            params: {
              is_mobile:user_data.is_mobile_verified
            },
            message: "Successfully updated"
          })
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request!!"
          })
        }
      
      
    } else {
      return res.json({
        status: 400,
        error: true,
        mesage: "Invalid request"
      })
    }
  } catch(error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserEmail: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}


async function sendMobileVarificationOtp(req, res) {
  const OtpBuffer = require("../models/otp_buffer");
  const fetch = require('cross-fetch');
  try {
    const { user_id, mobile_no } = req.body;
    if (user_id && validateUserId(user_id)) {
      if (mobile_no) {
        const otp = generateOTP();
        if (otp && (isNaN(parseInt(otp)) == false)) {
          const user_otp_obj = await OtpBuffer.findOne({ user_id: user_id });
          if (user_otp_obj) {
            await fetch(`https://2factor.in/API/V1/87802cca-1c48-11ec-a13b-0200cd936042/SMS/${mobile_no}/${otp}`);
            await User.updateOne({user_id:user_id},{
              $set: {
                mobile_number: mobile_no
              }
            });
            await OtpBuffer.updateOne({ user_id: user_id }, {
              $set: {
                mobile_otp: otp + "_" + Date.now()
              }
            });
            return res.json({
              status: 200,
              error: false,
              message: "Otp sent"
            })
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "You must varifie email first"
            })
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again"
          })
        }
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

async function sendMobileVarificationOtWithEmail(req, res) {
  const OtpBuffer = require("../models/otp_buffer");
  const fetch = require('cross-fetch');
  try {
    const { email, mobile_no } = req.body;
    // if (user_id && validateUserId(user_id)) {
      if (email && mobile_no) {
        const otp = generateOTP();
        if (otp && (isNaN(parseInt(otp)) == false)) {
          const user_otp_obj = await OtpBuffer.findOne({ email: email });
          if (user_otp_obj) {
            await fetch(`https://2factor.in/API/V1/87802cca-1c48-11ec-a13b-0200cd936042/SMS/${mobile_no}/${otp}`);
            await OtpBuffer.updateOne({ email: email }, {
              $set: {
                mobile_otp: otp + "_" + Date.now()
              }
            });
            return res.json({
              status: 200,
              error: false,
              message: "Otp sent"
            })
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "You must varifie email first"
            })
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Something went wrong, please try again"
          })
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid Request"
        })
      }
    // } else {
    //   return res.json({
    //     status: 400,
    //     error: true,
    //     message: "Invalid Request"
    //   })
    // }
  } catch (error) {
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again"
    })
  }
}
async function varifieMobile(req, res) {
  const { verifyOTP } = require("../utils/validator");
  const OtpBuffer = require("../models/otp_buffer");
  const User = require("../models/user");
  const OTP_LENGTH = 6;
  try {
    const { user_id, otp } = req.body;
    if (user_id && otp && otp.toString().length == OTP_LENGTH) {
      const user_status = await validateUserId(user_id);
      if (user_status) {
        const otp_object = await OtpBuffer.findOne({ user_id: user_id });
        if (otp_object) {
          if (otp_object.mobile_otp) {
            if (verifyOTP(otp_object.mobile_otp, otp)) {
              await OtpBuffer.updateOne(
                { user_id: user_id },
                {
                  $set: {
                    mobile_otp: null,
                  },
                }
              );
              await User.updateOne(
                { user_id: user_id },
                {
                  $set: {
                    is_mobile_verified: true,
                  },
                }
              );
              return res.json({
                status: 200,
                error: false,
                message: "OTP verified",
              });
            } else {
              return res.json({
                status: 400,
                error: true,
                message: "Invalid OTP",
              });
            }
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "Invalid OTP",
            });
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid request",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserMobile: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}

async function varifieMobileWithdrawOTP(req, res) {
  const { verifyOTP } = require("../utils/validator");
  const OtpBuffer = require("../models/otp_buffer");
  const withdrawHistory = require("../models/withdraw_history");
  const { sendWithdrawLink } = require("../utils/mailer");
  const OTP_LENGTH = 6;
//   console.log("data",req.body)
  try {
    const { user_id, otp, transection_id } = req.body;
    if (user_id && otp && otp.toString().length == OTP_LENGTH) {
      const user_status = await validateUserId(user_id);
      if (user_status) {
        const otp_object = await OtpBuffer.findOne({ user_id: user_id });
        if (otp_object) {
          if (otp_object.mobile_otp) {
            if (verifyOTP(otp_object.mobile_otp, otp, 2)) {
              const Withdraw_history = await withdrawHistory.findOne({user_id:user_id, status:0, transection_id:transection_id});
              if(Withdraw_history) {
                await OtpBuffer.updateOne(
                  { user_id: user_id },
                  {
                    $set: {
                      mobile_otp: null,
                    },
                  }
                );
                /**
                * Status:3 means otp verified and send mail
                */
                await withdrawHistory.updateOne(
                  { user_id: user_id, status:0, transection_id:transection_id },
                  {
                    $set: {
                      status: 2,
                      otp_varified: true,
                    },
                  }
                );
                 if(Withdraw_history.symbol.toUpperCase() == 'INR') {
                  sendWithdrawLink(Withdraw_history.email, transection_id, Withdraw_history.amount, Withdraw_history.symbol, '', Withdraw_history.remark, 2);
                } else {
                  sendWithdrawLink(Withdraw_history.email, transection_id, Withdraw_history.amount, Withdraw_history.symbol, Withdraw_history.to_address, Withdraw_history.remark, 1);
                }
              } else {
                return res.json({
                  status: 400,
                  error: true,
                  message: "Not a valid User!!",
                });
              }
              return res.json({
                status: 200,
                error: false,
                message: "OTP verified",
              });
            } else {
              return res.json({
                status: 400,
                error: true,
                message: "Invalid OTP",
              });
            }
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "Invalid OTP",
            });
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request",
          });
        }
      } else {
        return res.json({
          status: 400,
          error: true,
          message: "Invalid request",
        });
      }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserMobile: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}

async function varifieMobileLogin(req, res) {
  const { verifyOTP } = require("../utils/validator");
  const OtpBuffer = require("../models/otp_buffer");
  const OTP_LENGTH = 6;
  try {
    const { email, otp } = req.body;
    if (email && otp && otp.toString().length == OTP_LENGTH) {
      // const user_status = await validateUserId(user_id);
      // if (user_status) {
        const otp_object = await OtpBuffer.findOne({ email: email });
        if (otp_object) {
          if (otp_object.mobile_otp) {
            if (verifyOTP(otp_object.mobile_otp, otp)) {
              await OtpBuffer.updateOne(
                { email: email },
                {
                  $set: {
                    mobile_otp: null,
                  },
                }
              );
              return res.json({
                status: 200,
                error: false,
                message: "OTP verified",
              });
            } else {
              return res.json({
                status: 400,
                error: true,
                message: "Invalid OTP",
              });
            }
          } else {
            return res.json({
              status: 400,
              error: true,
              message: "Invalid OTP",
            });
          }
        } else {
          return res.json({
            status: 400,
            error: true,
            message: "Invalid Request",
          });
        }
      // } else {
      //   return res.json({
      //     status: 400,
      //     error: true,
      //     message: "Invalid request",
      //   });
      // }
    } else {
      return res.json({
        status: 400,
        error: true,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.log(
      "Error: from: src>controller>auth.js>verifyUserMobile: ",
      error.message
    );
    return res.json({
      status: 400,
      error: true,
      message: "Something went wrong, please try again!",
    });
  }
}


module.exports = {
  registerUser,
  verifyUserEmail,
  resendOtp,
  loginUser,
  resetPassword,
  forgetPassword,
  updateNewPassword,
  verifyForgetPassword,
  setGoogleAuth,
  setGoogleAuthOTP,
  getGoogleAuth,
  sendMobileVarificationOtp,
  sendMobileVarificationOtWithEmail,
  varifieMobile,
  varifieMobileLogin,
  check_user_status,
  getGoogleAuthFromUserId,
  varifieMobileWithdrawOTP
};

//https://stackoverflow.com/questions/61291289/delete-the-associated-blog-posts-with-user-before-deleting-the-respective-user-i

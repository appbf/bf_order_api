const express = require('express');
const {
    registerUser,
    verifyUserEmail,
    loginUser,
    resendOtp,
    forgetPassword,
    resetPassword,
    updateNewPassword,
    verifyForgetPassword,
    setGoogleAuth,
    getGoogleAuth,
    sendMobileVarificationOtp,
    varifieMobile,
    varifieMobileLogin,
    check_user_status,
    getGoogleAuthFromUserId,
    sendMobileVarificationOtWithEmail,
    varifieMobileWithdrawOTP,
    setGoogleAuthOTP
} = require('../controller/auth');
const { validateEmail, validatePassword, validateConfirmPassword } = require('../utils/middleware');

const router = express.Router();

router.post("/register-user", validateEmail, validatePassword, validateConfirmPassword, registerUser);
router.post("/varifie/email", verifyUserEmail);
router.post("/varifie/forget-password", validateEmail, verifyForgetPassword);
router.post("/login", validateEmail, loginUser);
router.post("/forget-password", validateEmail, forgetPassword);
router.post("/resend-otp", resendOtp);
router.post("/reset-password", validatePassword, resetPassword); 
router.post("/set-password", validatePassword, updateNewPassword);
router.post("/set-auth-google", setGoogleAuth);
router.post("/set-auth-google-otp", setGoogleAuthOTP);
router.post("/get-auth-google", getGoogleAuth); 
router.post("/get-auth-google-setting", getGoogleAuthFromUserId); 
router.post("/send-mobile-varification-otp", sendMobileVarificationOtp);
router.post("/send-mobile-varification-otp-email", sendMobileVarificationOtWithEmail);
router.post("/varifie/mobile", varifieMobile);
router.post("/varifie/mobile-login", validateEmail, varifieMobileLogin);
router.post("/varifie/mobile-Withdraw", varifieMobileWithdrawOTP);
router.post("/check_user_status", check_user_status);
 

module.exports = router;
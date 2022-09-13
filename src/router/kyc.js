const express = require('express');
const { setPersonalInfo, checkKYCStatus, updateKYCDocument, getCountry } = require('../controller/kyc');
const {
    validateKycType,
    validateName,
    validateDateOfBirth,
    validateAddress,
    validateCountry,
    validateCity,
    validateState,
    validateZipcode
} = require('../utils/middleware');

const router = express.Router();

router.post("/kyc/set-personal-info", validateKycType, validateName, validateDateOfBirth,/* validateAddress, validateCountry, validateCity, validateState,*/ validateZipcode, setPersonalInfo);
router.post("/kyc/update-documents", updateKYCDocument);
router.post("/kyc/check-status", checkKYCStatus);
router.post("/kyc/get-country", getCountry);
// router.post("/kyc/show", /** kyc display code */);
// router.post("/kyc/update", /** kyc update code */);
// router.post("/kyc/delete", /** kyc delete code */);




module.exports = router;
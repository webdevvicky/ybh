const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../controllers/auth/auth_middlewares');

const {
    signup,
    customerSignIn,
    resendCustomerMailApi,
    googleSignIn,
    facebookSignIn,
    forgotPassword,
    validateResetPasswordToken,
    resetPassword,
    verifyCustomerEmail,
    postSocialAuth,
    customerGoogleToken
} = require('../controllers/auth/customer_auth');
const {
    vendorSignup,
    vendorSignin,
    resendOtp,
    adminSignin,
    verifyVendorEmail,
    sendProfileCompleteStatus
} = require('../controllers/auth/vendor_auth');

//----- Customer Routes -----//
router.post('/customer/signup', signup);
router.post('/customer/signin', customerSignIn);
router.get('/customer/token', customerGoogleToken);
router.post('/customer/resendCustomerMail', resendCustomerMailApi);
router.post('/customer/google', googleSignIn);
router.post('/customer/facebook', facebookSignIn);
router.post('/customer/forgot_password', forgotPassword);
router.post('/customer/validate/reset_password_token', validateResetPasswordToken);
router.post('/customer/reset_password', resetPassword);
router.put('/customer/verify_email', verifyCustomerEmail);
router.put('/customer/post_social_auth/:id', postSocialAuth);


//----- Vendor Routes -----//
router.post('/vendor/signup', vendorSignup);
router.post('/vendor/signin', vendorSignin);
router.post('/vendor/resendOtp', resendOtp);
router.post('/admin/signin', adminSignin);
router.put('/vendor/verify_email', verifyVendorEmail);
router.get('/vendor/profile', authenticateToken, sendProfileCompleteStatus);


module.exports = router;
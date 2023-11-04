const express = require('express');
const router = express.Router();
const {
    saveGeneralSettingInfo,
    getGenralSettingsDetails,
    uploadStoreAssets,
    uploadAdminConfig,
    getEmailSettings,
    getEmailConfig,
    getTaxSettingList,
    getTaxIdentifier,
    getTaxRule,
    getAssignTax,
    deleteTaxZoneRateById,
    storeTaxRule,
    storeAssignTax,
    getTaxZoneDetailsForCustomer,
    updateTaxZoneById,
    deleteTaxZoneById,
    updateTaxRuleById,
    updateAssignTaxById,
    deleteTaxRuleById,
    deleteAssignTaxById,
    getTaxRuleDetailsById,
    getAssignTaxDetailsById
} = require('../controllers/settings/general_settings');
const { authenticateToken } = require('../controllers/auth/auth_middlewares');
const {
    savePaymentGatewaySetting,
    getPaymentGatewayDetails
} = require('../controllers/settings/payment_gateway');

/**
 * General settings
 */
router.put('/general/:id', authenticateToken, saveGeneralSettingInfo);
router.get('/general', getGenralSettingsDetails);
router.post('/upload/logos/:id', authenticateToken, uploadAdminConfig.fields([
    { name: 'store_logo', maxCount: 1 },
    { name: 'admin_logo', maxCount: 1 },
    { name: 'vendor_logo', maxCount: 1 },
    { name: 'email_template_logo', maxCount: 1 },
    { name: 'invoice_logo', maxCount: 1 },
    { name: 'store_icon', maxCount: 1 },
]), uploadStoreAssets);

/**
 * Payment Gateway
 */
router.put('/payment_gateway/:id', authenticateToken, savePaymentGatewaySetting);
router.get('/payment_gateway/:name', authenticateToken, getPaymentGatewayDetails);

/**
 * Email Settings
 */
router.get('/email', authenticateToken, getEmailSettings);


/**
 * Tax Settings
 */
router.get('/tax', authenticateToken, getTaxSettingList);
router.get('/taxIdentifier', authenticateToken, getTaxIdentifier);
router.get('/getTaxRule', authenticateToken, getTaxRule);
router.get('/getAssignTax', authenticateToken, getAssignTax);
router.delete('/deleteTaxZoneRateById/:id', authenticateToken, deleteTaxZoneRateById);
router.post('/storeTaxRule', storeTaxRule);
router.post('/storeAssignTax',storeAssignTax);
router.post('/:setting_id/tax/get_zone_details', authenticateToken, getTaxZoneDetailsForCustomer);
router.put('/updateTaxZone/:id', authenticateToken, updateTaxZoneById);
router.delete('/deleteTaxZone/:id',authenticateToken,deleteTaxZoneById);
router.put('/updateTaxRule/:id', updateTaxRuleById);
router.put('/updateAssignTax/:id', updateAssignTaxById);
router.delete('/deleteTaxRule/:id',authenticateToken,deleteTaxRuleById);
router.delete('/deleteAssignTax/:id',authenticateToken,deleteAssignTaxById);
router.get('/getTaxRuleDetailsById/:id', getTaxRuleDetailsById);
router.get('/getAssignTaxDetailsById/:id', getAssignTaxDetailsById);
module.exports = router;
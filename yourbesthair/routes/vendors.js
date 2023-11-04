const express = require('express');
const router = express.Router();
const {
    getNearByVendors,
    createVendor,
    updateVendor,
    uploadVendorAssets,
    getVendorsStoreNameList,
    getVendorsFilterList,
    getVendorDetailsBySlugOrId,
    putVendorStatus,
    storeVendorSetting,
    updateVendorSetting,
    getVendorSetting,
    getVendorList,
    updateVendorById,
    deleteVendorById,
    bulkDeleteVendor,
    getMyProfileDetails,
    updatePassword,
    updateEmail,
    approveVendorById,
    getVendorsBasedOnCategories,
    generateVendorSlug,
    getVendorById,
    getVendorDashboard,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaff,
} = require('../controllers/vendor/vendor');
const {
    createServiceByVendor,
    getVendorServices,
    getVendorServiceById,
    updateVendorServiceById,
    deleteVendorServiceById,
    bulkDeleteVendorService
} = require('../controllers/vendor/services');
const { uploadVendorConfig } = require('../controllers/vendor/vendor');
const { authenticateToken } = require('../controllers/auth/auth_middlewares');
const {
    getMyServiceCategoriesList,
    getMyServiceCategoriesNameList
} = require('../controllers/vendor/service_categories');
const { getVendorsByCategorySlug } = require('../controllers/vendor/vendor_categories');
router.get('/nearby', getNearByVendors);
router.post('/', authenticateToken, createVendor);
router.put('/staff', authenticateToken, createStaff); 
router.post('/staffupdate', authenticateToken, updateStaff);  
router.put('/update', authenticateToken, updateVendor);
router.post('/upload/logo_banners_works/:id', uploadVendorConfig.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banners' },
    { name: 'works' },
    { name: 'documents' }
]), uploadVendorAssets);
router.get('/store_name', getVendorsStoreNameList);
router.get('/vendor_filter', getVendorsFilterList);
router.get('/getstaff/:id', getStaff);
router.get('/:slug_or_id', getVendorDetailsBySlugOrId);
router.get('/', getVendorList);
router.get('/putVendorStatus/:vendorID/:uniqueString',putVendorStatus);
router.post('/storeVendorSetting', storeVendorSetting);
router.put('/updateVendorSetting/:id',updateVendorSetting);
router.get('/getVendorSetting/:id', getVendorSetting);
router.put('/:id', updateVendorById);
router.delete('/:id', deleteVendorById);
router.delete('/bulkDeleteVendor/:id',bulkDeleteVendor);
router.delete('/staffdelete/:id',authenticateToken, deleteStaff);
router.get('/my/profile', authenticateToken, getMyProfileDetails);
router.post('/change_password', authenticateToken, updatePassword);
router.post('/change_email', authenticateToken, updateEmail);
router.put('/approve/:id', approveVendorById);
router.post('/slug', generateVendorSlug);



// Vendor Service routes
router.get('/service/ById/:id', authenticateToken, getVendorServiceById);
router.get('/service/list', authenticateToken, getVendorServices);
router.post('/service', authenticateToken, createServiceByVendor);
router.put('/service/bulkDeleteService', authenticateToken, bulkDeleteVendorService);
router.put('/service/:id', authenticateToken, updateVendorServiceById);
router.delete('/service/:id', authenticateToken, deleteVendorServiceById);

// Vendor Service Categories Routes
router.get('/service_categories/list', authenticateToken, getMyServiceCategoriesList);
router.get('/service_categories/name', authenticateToken, getMyServiceCategoriesNameList);
router.get('/dashboard/:id',authenticateToken, getVendorDashboard);

// Vendor Categories Routes
router.post('/categories_search', getVendorsBasedOnCategories);
router.get('/categories/:slug', getVendorsByCategorySlug);
router.get('/vendorId/:vendorId', getVendorById);
module.exports = router;

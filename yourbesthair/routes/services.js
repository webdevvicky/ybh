const express = require('express');
const router = express.Router();
const {
    createService,
    getServicesNameList,
    getAssignServiceToVendor,
    assignServiceToVendor,
    searchService,
    getServiceList,
    bulkDeleteService,
    getServiceFilterList,
    updateServiceById,
    uploadServiceImage,
    uploadServiceConfig,
    deleteServiceById,
    getServiceById,
    getServiceByServiceId
} = require('../controllers/services');
const { authenticateToken } = require('../controllers/auth/auth_middlewares');
router.post('/', authenticateToken, createService);
router.get('/name', getServicesNameList);
router.get('/getAssignServiceToVendor', getAssignServiceToVendor);
router.post('/assign', assignServiceToVendor);
router.get('/search', searchService);
router.get('/', getServiceList);
router.put('/bulkDeleteService',bulkDeleteService);
router.get('/filterServices',getServiceFilterList);
router.put('/:id', updateServiceById);
router.post('/upload/image/:id', uploadServiceConfig.single('service_image'), uploadServiceImage);
router.delete('/:id', deleteServiceById);
router.get('/serviceId/:serviceId', getServiceById);
router.get('/byId/:serviceId', getServiceByServiceId);
module.exports = router;
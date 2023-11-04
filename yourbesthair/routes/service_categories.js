const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../controllers/auth/auth_middlewares');
const { 
    createServiceCategory,
    updateServiceCategoryById,
    bulkDeleteServiceCategory,
    deleteServiceCategoryById,
    getServiceCategoryById
 } = require('../controllers/service_categories');

router.post('/', authenticateToken, createServiceCategory);
router.get('/:id', getServiceCategoryById);
router.put('/bulkDeleteServiceCategory',bulkDeleteServiceCategory);
router.put('/:id', authenticateToken, updateServiceCategoryById);
router.delete('/:id', authenticateToken, deleteServiceCategoryById);
module.exports = router;


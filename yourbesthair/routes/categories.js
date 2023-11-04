const express = require('express');
const router = express.Router();
const {
    getCategoryList,
    createCategory,
    updateCategoryById,
    bulkDeleteCategory,
    getCategoriesWithSubCategories,
    getCategoriesFilterList,
    generateCategorySlug,
    uploadCategoryConfig,
    uploadCategoryAssets,
    getCategoryDetailsBySlug,
    getCategoryById
} = require('../controllers/categories');

router.get('/', getCategoryList);
router.post('/', createCategory);
router.put('/:id', updateCategoryById);
router.delete('/bulkDeleteCategory/:id',bulkDeleteCategory);
router.get('/subcategories', getCategoriesWithSubCategories);
router.get('/filterCategories',getCategoriesFilterList);
router.post('/slug', generateCategorySlug);
router.post('/upload/image/:id', uploadCategoryConfig.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
    { name: 'profile', maxCount: 1 }
]), uploadCategoryAssets);
router.get('/:slug', getCategoryDetailsBySlug);
router.get('/categoryId/:categoryId', getCategoryById);

module.exports = router;
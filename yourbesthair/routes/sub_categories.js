const express = require('express');
const router = express.Router();
const {
    createSubCategories,
    getSubCategoryAndCategoryList,
    updateSubCategoryById,
    bulkDeleteSubCategory,
    generateSubCategorySlug,
    uploadSubCategoryConfig,
    uploadSubCategoryAssets
} = require('../controllers/sub_categories');

router.post('/', createSubCategories);
router.get('/categories', getSubCategoryAndCategoryList);
router.put('/:id', updateSubCategoryById);
router.delete('/bulkDeleteSubCategory/:id',bulkDeleteSubCategory);
router.post('/slug', generateSubCategorySlug);
router.post('/upload/image/:id', uploadSubCategoryConfig.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
    {name: 'profile', maxCount: 1}
]), uploadSubCategoryAssets);

module.exports = router;

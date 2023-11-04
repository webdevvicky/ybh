const express = require('express');
const router = express.Router();
const {
    savePage,
    uploadCMSConfig,
    uploadCMSAssets,
    createPage,
    getPageList,
    getPageById,
    deletePageById,
    approvePageById,
    getHomePageDetails,
    bulkDeletePage,
    getUploadedBannerImageData,
    deleteBannerById,
    deletePageBlockById,
    deletePageBlockItemById,
    getPageBySlug
} = require('../controllers/cms/pages');

// router.post('/page', savePage);
router.post('/', createPage);
router.get('/', getPageList);
router.get('/:id', getPageById);
router.put('/:id', savePage);
router.delete('/:id', deletePageById);
router.put('/approve/:id', approvePageById);
router.get('/home/details', getHomePageDetails);
router.get('/page/:slug', getPageBySlug);
router.delete('/bulkDeletePage/:id',bulkDeletePage);
router.post('/upload/cms/:id', uploadCMSConfig.fields([
    { name: 'featured_image', maxCount: 1 },
    { name: 'banners' },
    { name: 'block_items' },
]), uploadCMSAssets);
router.post('/upload/get_banner_details', uploadCMSConfig.fields([
    { name: 'banners', maxCount: 1 },
]), getUploadedBannerImageData)
router.post('/delete/:page_id/:banner_id', deleteBannerById);
router.delete('/:page_id/:block_id', deletePageBlockById);
router.delete('/:page_id/:block_id/:item', deletePageBlockItemById);
module.exports = router;
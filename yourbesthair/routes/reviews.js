const express = require('express');
const router = express.Router();

const {
    updateReviewById,
    uploadReviewConfig,
    uploadReviewImages,
    getReviewList,
    bulkDeleteReview,
    getReviewById,
    deleteReviewById
} = require('../controllers/reviews');

router.put('/:id', updateReviewById);
router.post('/upload/image/:id', uploadReviewConfig.fields([
    { name: 'images' }
]), uploadReviewImages);
router.get('/', getReviewList);
router.delete('/bulkDeleteReview/:id',bulkDeleteReview);
router.get('/:id', getReviewById);
router.delete('/:id', deleteReviewById);

module.exports = router;
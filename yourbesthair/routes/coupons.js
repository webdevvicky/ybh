const express = require('express');
const router = express.Router();
const {
    getCouponList,
    createCoupon,
    updateCouponById,
    deleteCouponById
    
} = require('../controllers/coupons');

router.get('/', getCouponList);
router.post('/', createCoupon);
router.put('/:id', updateCouponById);
router.delete('/:id', deleteCouponById);


module.exports = router;
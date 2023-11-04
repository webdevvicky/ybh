const express = require('express');
const router = express.Router();

const {
    saveBookingDetails,
    paymentSummary,
    bulkDeleteBooking,
    getBookingFilterList,
    updateBookingDetailsById,
    getBookingList,
    getBookingByBookingId,
    getBookingListV2,
    addCommentAndChangeStatus,
    bookingPayoutOfVendor,
    getBookingForCalander,
    getBookingForCalanderV2,
    bookingPayoutAcknowladgeOfVendor,
    assignStaff
} = require('../controllers/bookings');

router.post('/', saveBookingDetails);
router.get('/paymentSummary', paymentSummary);
router.delete('/bulkDeleteBooking/:id',bulkDeleteBooking);
router.get('/filterBooking',getBookingFilterList);
router.put('/:id', updateBookingDetailsById);
router.get('/', getBookingList);
router.get('/:id', getBookingByBookingId);
router.post('/filter', getBookingListV2);
router.post('/calander', getBookingForCalanderV2);
router.put('/status/:id', addCommentAndChangeStatus);
router.put('/vendor_payout_status/:id', bookingPayoutOfVendor);
router.put('/vendor/acknowladge/:id', bookingPayoutAcknowladgeOfVendor);
router.put('/assignstaff/:id', assignStaff);

module.exports = router;
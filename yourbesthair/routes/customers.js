const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../controllers/auth/auth_middlewares');
const {
    saveCustomerDetailsById,
    getCustomerDetailsById,
    getCustomerList,
    createCustomer,
    deleteCustomerById,
    getCustomerDetails,
    getCustomerFilterList,
    bulkDeleteCustomer,
    chargeCustomer,
    resetPassword,
    deleteMyAccount,
    putCustomerStatus,
    getCustomerById,
    getCustomerNearLocation,
    getVendorCustomerList,
    deleteMyAccountAddress,
    createPaymentIntent
} = require('../controllers/customer/customers');
const {
    saveFavouriteItem,
    getMyFavourites,
    isMyfavouriteItem,
    getMyFavouritesFolderItems,
    deleteFavouriteItembyId
} = require('../controllers/customer/customer_favourites');
const {
    createFavouriteFolder,
    getMyFavouriteFolderList,
    updateFavouriteFolderById,
    deleteFavouriteFolderById
} = require('../controllers/customer/favourite_folders');
const { 
    getMyBookings,
    gteMyBookingDetailsById,
    gteMyBookingDetailsByIdV2,
    addCommentOnBooking
 } = require('../controllers/customer/customer_bookings');
const {
    isReviewGivenToVendor,
    getMyReviews,
    addReview
} = require('../controllers/customer/customer_reviews');

const favouritesRoutes = require('./customer_favorites');

router.get('/localityFilter', authenticateToken, getCustomerNearLocation);
router.get('/vendor', authenticateToken, getVendorCustomerList);
router.put('/:id', authenticateToken, saveCustomerDetailsById);
router.get('/:id', authenticateToken, getCustomerDetailsById);
router.get('/my/details', authenticateToken, getCustomerDetails);
router.get('/customerFilter/list', authenticateToken, getCustomerFilterList);
router.delete('/bulkDeleteCustomer/:id',authenticateToken, bulkDeleteCustomer);
router.get('/', authenticateToken, getCustomerList);
router.post('/', authenticateToken, createCustomer);
router.delete('/:id', authenticateToken, deleteCustomerById);
router.post('/reset_password', authenticateToken, resetPassword);
router.post('/favourites', authenticateToken, saveFavouriteItem);
router.delete('/favourites/:id', authenticateToken, deleteFavouriteItembyId);
router.post('/favourite_folder/add', authenticateToken, createFavouriteFolder);
router.put('/favourite_folder/:id', authenticateToken, updateFavouriteFolderById);
router.delete('/favourite_folder/:id', authenticateToken, deleteFavouriteFolderById);
router.get('/favourites/items', authenticateToken, getMyFavourites);
router.get('/favourites/:folder_id/items', authenticateToken, getMyFavouritesFolderItems);
router.get('/favourites/folders', authenticateToken, getMyFavouriteFolderList);
router.post('/favourites/is_favourite_item',authenticateToken, isMyfavouriteItem);
router.post('/charge', authenticateToken, chargeCustomer);
router.get('/bookings/list', authenticateToken, getMyBookings);
router.get('/bookings/:id', authenticateToken, gteMyBookingDetailsByIdV2);
router.put('/bookings/comment/:id', authenticateToken, addCommentOnBooking);
router.get('/reviews/list', authenticateToken, getMyReviews);
router.post('/reviews', authenticateToken, addReview);
router.post('/reviews/is_given_to_vendor',authenticateToken, isReviewGivenToVendor);
router.delete('/delete/account', authenticateToken, deleteMyAccount);
router.delete('/delete/my/address/:addressId', authenticateToken, deleteMyAccountAddress);
router.put('/putCustomerStatus/:customerID/:otp',putCustomerStatus);
router.get('/customerId/:customerId',authenticateToken, getCustomerById);
router.get('/customerId/:customerId',authenticateToken, getCustomerById);
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);

// router.use('/favourites', favouritesRoutes);

module.exports = router;
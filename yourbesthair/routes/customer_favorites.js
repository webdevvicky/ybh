const express = require('express');
const router = express.Router();

const { saveFavouriteItem } = require('../controllers/customer/customer_favourites');

router.post('/:id', saveFavouriteItem);

module.exports = router;
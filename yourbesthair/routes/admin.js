const express = require('express');
const router = express.Router();
const {
    getDashboardTotalCounts
} = require('../controllers/dashboard');

router.get('/dashboard_total_counts', getDashboardTotalCounts);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    deleteFileFromPath
} = require('../controllers/common');

router.delete('/uploads/:folder/:filename', deleteFileFromPath);

module.exports = router;

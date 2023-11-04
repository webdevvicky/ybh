const express = require('express');
const router = express.Router();

const {
    processContact
} = require('../controllers/contacts');


router.post('/submit', processContact);

module.exports = router;
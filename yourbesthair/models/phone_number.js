const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema({
	country_code: String,
    dial_code: String,
    international_number: String,
    number: String
});

module.exports = phoneNumberSchema;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const pointSchema = require('./location');
const fileSchema = require('./file');
const phoneNumberSchema = require('./phone_number');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const vendorverificationSchema = new mongoose.Schema({
	vendorID : String,
    uniqueString : String,
    otp: Number,
    createdAt : Date,
    createdAt : Date, 
    expiresAt : Date,   

});

module.exports = mongoose.model('vendorverification',vendorverificationSchema);
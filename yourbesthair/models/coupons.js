const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 

const couponSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    starton: {
        type: Date,
        required: true,
    },
    expireon: {
        type: Date,
        required: true,
    },
    coupontype: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: false,
        default:1
    },
    couponvalue: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    minpurchaseamount: {
        type: Number,
        required: false,
    },
    uselimit: {
        type: Number,
        required: false
    },
    active_status: {
        type: String,
        enum : ['0', '1', '3'], //3 is for deleted status
        default: '1'
    },
},
{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('coupons',couponSchema);
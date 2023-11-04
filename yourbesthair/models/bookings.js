const mongoose = require('mongoose');
const fileSchema = require('./file');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const bookingSchema = new mongoose.Schema({
    booking_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
	booking_uuid: {
        type: String,
    },
    appointment_date: {
        type: String,
        required: true,
    },
    time_slot: {
        type: String,
        required: true,
    },
    services: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'services',
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers',
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendors',
        required: true
    },
    staffid: {
        type: mongoose.Schema.Types.ObjectId,
        required: false 
    },
    amount: {
        type: Number, 
        required: true
    },
    tax_applied: mongoose.Schema.Types.Mixed,
    booking_status: {
        type: String,
        enum : ['0', '1', '2', '3', '4', '5', '6', '7'], //0-declined, 1-approved, 2-pending, 3-deleted, 4-accepted, 5-cancelled, 6-completed, 7-inprogress
        default: '2'
    },
    vendor_payout_status: {
        type: String,
        enum : ['0', '1', '2'], //1-Acknowledged, 2-Paid, 0-Pending,
        default: '0'
    },
    vendor_acknowladge: {
        type: Boolean,
        default: false
    },
    billing_address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers.billing_address'
    },
    payment_status: {
        type: String,
        enum : ['0', '1'], //0- fail, 1-success
        default: '0'
    },
    payout_transaction_id: String,
    stripe_charge_id: String,
    comment: String,
    admin_comment: String,
    commission: Number
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

bookingSchema.post("save", async function (doc) {
    doc.booking_uuid = "ORDER000000" + doc.booking_id;
    await doc.model("bookings").findOneAndUpdate({_id: doc._id}, doc);
  });

  bookingSchema.plugin(AutoIncrement, {inc_field: 'booking_id'});
  bookingSchema.methods.testMethod = function(){};
module.exports = mongoose.model('bookings',bookingSchema);
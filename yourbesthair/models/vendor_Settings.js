const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const vendorSettingSchema = new mongoose.Schema({
    vendor_setting_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },

    vendor_setting_uuid: {
        type: String,
    },

    selected_vendor:{
        type: String,
        required: true,
    },

    commission_value: {
        type: String,
        required: true,
    },

    approvals_auto_approve_vendors:{
        type: Number,
        enum: [0, 1],
        default: 0
    },
    
    approvals_auto_approve_services:{
        type: Number,
        enum: [ 0, 1],
        default: 0
    },

    payout_auto_approve_vendors:{
        type: Number,
        enum: [ 0, 1],
        default: 0
    },

    payout_auto_approve_services:{
        type: Number,
        enum: [ 0, 1],
        default: 0
    },
}, 
{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

vendorSettingSchema.post("save", async function (doc) {
    doc.vendor_setting_uuid = "VEN_SETTING0000" + doc.vendor_setting_id;
    await doc.model("vendor_Settings").findOneAndUpdate({_id: doc._id}, doc);
});

vendorSettingSchema.plugin(AutoIncrement, {inc_field: 'vendor_setting_id'});
vendorSettingSchema.methods.testMethod = function(){};
module.exports = mongoose.model('vendor_Settings',vendorSettingSchema);
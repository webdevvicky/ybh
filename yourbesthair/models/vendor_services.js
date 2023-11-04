const mongoose = require('mongoose');
const fileSchema = require('./file');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const vendorServiceSchema = new mongoose.Schema({
    vendor_service_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
    vendor_service_uuid: {
        type: String,
    },

    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendors'
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'services'
    },
    tax_rule:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tax_rules'
    },
    description: String,
    price: String,
    duration: String,
    active_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status
        default: '2'
    },
    service_image: fileSchema,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'service_categories'
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

vendorServiceSchema.post("save", async function (doc) {
    doc.vendor_service_uuid = "VEN_SERVICE0000" + doc.vendor_service_id;
    await doc.model("vendor_services").findOneAndUpdate({_id: doc._id}, doc);
});

vendorServiceSchema.plugin(AutoIncrement, {inc_field: 'vendor_service_id'});
vendorServiceSchema.methods.testMethod = function(){};
module.exports = mongoose.model('vendor_services',vendorServiceSchema);
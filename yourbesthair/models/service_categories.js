const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const serviceCategorySchema = new mongoose.Schema({
    service_category_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
    service_category_uuid: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    active_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '1'
    },
    created_by: {
        type: String,
        required: true,
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

serviceCategorySchema.post("save", async function (doc) {
    doc.service_category_uuid = "SERVICE_CAT0000" + doc.service_category_id;
    await doc.model("service_categories").findOneAndUpdate({_id: doc._id}, doc);
});

serviceCategorySchema.plugin(AutoIncrement, {inc_field: 'service_category_id'});
serviceCategorySchema.methods.testMethod = function(){};
module.exports = mongoose.model('service_categories',serviceCategorySchema);
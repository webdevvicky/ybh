const mongoose = require('mongoose');
const fileSchema = require('./file');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const serviceSchema = new mongoose.Schema({
    service_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
    service_uuid: {
        type: String,
    },
    name: String,
    description: String,
    tax_rule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tax_rules'
    },
    active_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '2'
    },
    approval_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '1'
    },
    SKU: String,
    service_image: fileSchema,
    gallery: [{
        url: String,
        file_name: String
    }],
    created_by: mongoose.Schema.Types.ObjectId
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

serviceSchema.pre(
    'save',
    async function (next) {
        if (this.password) {
            const hash = await bcrypt.hash(this.password, 10);
            this.password = hash;
        }
        next();
    }
);

serviceSchema.post("save", async function (doc) {
    doc.service_uuid = "SERVICE0000" + doc.service_id;
    await doc.model("services").findOneAndUpdate({_id: doc._id}, doc);
});

serviceSchema.plugin(AutoIncrement, {inc_field: 'service_id'});
serviceSchema.methods.testMethod = function(){};
module.exports = mongoose.model('services',serviceSchema);
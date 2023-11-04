const mongoose = require('mongoose');
const fileSchema = require('./file');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const categorySchema = new mongoose.Schema({
    categories_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
	categories_uuid: {
        type: String,
    },
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    active_status: {
        type: String,
        enum : ['0', '1', '3'], //3 is for deleted status
        default: '1'
    },
    approval_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '1'
    },
    description1: String,
    description2: String,
    banner: fileSchema,
    icon: fileSchema,
    profile: fileSchema,
    meta_title: String,
    meta_description: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

categorySchema.post("save", async function (doc) {
    doc.categories_uuid = "CAT0000" + doc.categories_id;
    await doc.model("categories").findOneAndUpdate({_id: doc._id}, doc);
});

categorySchema.plugin(AutoIncrement, {inc_field: 'categories_id'});
categorySchema.methods.testMethod = function(){};
module.exports = mongoose.model('categories',categorySchema);
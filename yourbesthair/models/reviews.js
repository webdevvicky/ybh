const mongoose = require('mongoose');
const fileSchema = require('./file');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const reviewSchema = new mongoose.Schema({
    review_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
    review_uuid: {
        type: String,
    },
    ratings: {
        type: Number,
        required: true,
    },
    review: {
        type: String
    },
    images: [fileSchema],
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers',
        required: true,
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendors',
        required: true
    },
    active_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '0'
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

reviewSchema.post("save", async function (doc) {
    doc.review_uuid = "REV0000" + doc.review_id;
    await doc.model("reviews").findOneAndUpdate({_id: doc._id}, doc);
});

reviewSchema.plugin(AutoIncrement, {inc_field: 'review_id'});
reviewSchema.methods.testMethod = function(){};
module.exports = mongoose.model('reviews',reviewSchema);
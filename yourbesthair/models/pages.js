const mongoose = require('mongoose');
const fileSchema = require('./file');

const pagesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
    },
    meta_title: String,
    meta_description: String,
    meta_keywords: String,
    blocks: [{
        block_type: String,
        title: String,
        description: String,
        product_type: String,
        order_by: String,
        order: String,
        num_col: Number,
        items: [mongoose.Schema.Types.ObjectId]
    }],
    active_status: {
        type: String,
        enum : ['0', '1'], 
        default: '1'
    },
    approval_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '2'
    },
    description: String,
    featured_image: fileSchema,
    banners: [{
        title: String,
        image: fileSchema,
        caption: String,
        alt: String
    }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

const pages = mongoose.model('pages', pagesSchema);

module.exports = pages;
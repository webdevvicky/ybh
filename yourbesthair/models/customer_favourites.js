const mongoose = require('mongoose');

const customerFavouriteSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers'
    },
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendors'
    },
    folder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'favourite_folders'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const customerFavourite = mongoose.model('customer_favourites', customerFavouriteSchema);

module.exports = customerFavourite;

const mongoose = require('mongoose');

const favouriteFolderSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers',
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const favouriteFolder = mongoose.model('favourite_folders', favouriteFolderSchema);

module.exports = favouriteFolder;
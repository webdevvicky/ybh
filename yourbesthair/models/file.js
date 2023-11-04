const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
	url: {
        type: String,
        required: false
    },
    file_name: {
        type: String,
        required: false
    }
});

module.exports = fileSchema;
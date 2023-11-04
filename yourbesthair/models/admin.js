const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
	email: {
		type: String,
		required: false,
		unique: true
	},
	password: {
		type: String,
		required: false
	},
},{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const admin = mongoose.model('admins', adminSchema);

module.exports = admin;
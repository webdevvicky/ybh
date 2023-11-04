const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const testUserSchema = new mongoose.Schema({
    full_name: String,
    user_name: String,
    first_name: String,
    last_name: String,
    email: {
        type: String,
        unique: true
    },
    street_address: String,
    city: String, 
    state: String, 
    country: String,
    zip_code: String,
    password: String,
    phone_number: Number,
    active_status: {
        type: String,
        enum : ['0', '1'], 
        default: '1'
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

testUserSchema.pre(
    'save',
    async function (next) {
        if (this.password) {
            const hash = await bcrypt.hash(this.password, 10);
            this.password = hash;
        }
        next();
    }
);

testUserSchema.methods.isValidPassword = async function (password) {
	if (this.password) {
		const compare = await bcrypt.compare(password, this.password);
		return compare;
	} else {
		return false;
	}
};

const testUser = mongoose.model('test_users', testUserSchema);

module.exports = testUser;
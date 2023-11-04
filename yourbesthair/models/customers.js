const mongoose = require('mongoose');
const pointSchema = require('./location');
const bcrypt = require('bcrypt');
const phoneNumberSchema = require('./phone_number');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const billingAddressSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: false
    },
    last_name: {
        type: String,
        required: false
    },
    street_address1: {
        type: String,
        required: false,
    },
    street_address2: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    state: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    zip_code: {
        type: String,
        required: false,
    },
    formatted_address: {
        type: String,
        required: false,
    },
    phone_number: phoneNumberSchema,
    is_primary: {
        type: Boolean,
        required: false
    }
});

const customerSchema = new mongoose.Schema({
    customer_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },

    customer_uuid: {
        type: String,
    },

    email: {
        type: String,
        required: false,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    full_name: {
        type: String,
        required: false
    },
    first_name: {
        type: String,
        required: false
    },
    last_name: {
        type: String,
        required: false
    },
    phone_number: phoneNumberSchema,
    policy_agree: {
        type: Boolean,
        required: false
    },
    title: {
        type: String,
        required: false,
    },
    display_name: {
        type: String,
        required: false,
    },
    nationality: {
        type: String,
        required: false,
    },
    gender: {
        type: String,
        required: false,
    },
    street_address1: {
        type: String,
        required: false,
    },
    street_address2: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        required: false,
    },
    state: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    formatted_address: {
        type: String,
        required: false,
    },
    zip_code: {
        type: String,
        required: false,
    },
    otp: Number,
    email_verification_token: {
        type: String,
        required: false
    },
    is_email_verified: {
        type: Boolean,
        required: false,
        default: false
    },
    reset_password_token: {
        type: String,
        required: false
    },
    reset_password_sent_at: {
        type: Date,
        required: false
    },
    auth_provider: {
        type: String,
        required: false
    },
    location: {
        type: pointSchema,
        index: '2dsphere'
    },
    active_status: {
        type: String,
        enum : ['0', '1'], 
        default: '1'
    },
    approval_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '1'
    },
    billing_address: [billingAddressSchema],
    stripe_card_id: String,
    stripe_customer_id: String
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

customerSchema.pre(
    'save',
    async function(next) {
        if (this.password) {
            const hash = await bcrypt.hash(this.password, 10);
            this.password = hash;
        }
        next();
    }
);

customerSchema.post("save", async function (doc) {
    doc.customer_uuid = "CUST0000" + doc.customer_id;
    await doc.model("customers").findOneAndUpdate({_id: doc._id}, doc);
});

customerSchema.methods.isValidPassword = async function(password) {
    if (this.password) {
        const compare = await bcrypt.compare(password, this.password);
        return compare;
    } else {
        return false
    }
};

customerSchema.plugin(AutoIncrement, {inc_field: 'customer_id'});
customerSchema.methods.testMethod = function(){};
module.exports = mongoose.model('customers',customerSchema);
const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    active_status: {
        type: String,
        enum : ['0', '1'], 
        default: '1'
    },
    api_keys: [{
        mode: {
            type: String,
            required: true
        },
        public_key: {
            type: String,
            required: true
        },
        secret_key: {
            type: String,
            required: true
        },
        is_active: {
            type: Boolean,
            required: true
        }
    }]
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const paymentGateway = mongoose.model('payment_gateways', paymentGatewaySchema);

module.exports = paymentGateway;
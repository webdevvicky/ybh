const mongoose = require('mongoose');
const phoneNumberSchema = require('./phone_number');
const fileSchema = require('./file');
const pointSchema = require('./location');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const generalSettingsSchema = new mongoose.Schema({
    store_info: {
        store_name: String,
        owner: String,
        email: String,
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
        location: {
            type: pointSchema,
            index: '2dsphere'
        },
    },
    logos: {
        store_logo: fileSchema,
        admin_logo: fileSchema,
        vendor_logo: fileSchema,
        email_template_logo: fileSchema,
        invoice_logo: fileSchema,
        store_icon: fileSchema
    },
    seo: {
        meta_title: {
            type: String
        },
        meta_description: {
            type: String
        },
        meta_keywords: {
            type: String
        }
    },
    social_links: {
        facebook: {
            type: String,
            required: true
        },
        twitter: {
            type: String,
            required: true
        },
        instagram: {
            type: String,
            required: true
        },
        pinterest: {
            type: String,
            required: true
        },
        youtube: {
            type: String,
            required: true
        }
    },
    email_settings: [{
        is_enabled: {
            type: Boolean,
            required: true
        },
        service: {
            type: String,
            required: true
        },
        email_from: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        user_name: String,
        host: String,
        port: Number,
        client_id: String,
        client_secret: String,
        refresh_token: String,
        api_key: String
    }],
    tax_settings: [{
        tax_settings_id:{
            type:Number,
            autoIncrement: true,
            primaryKey: true
        },
        tax_settings_uuid: {
            type: String,
        },
        display_price_with_tax: String,
        tax_zone_country: String,
        tax_zone_state: String,
        tax_class: String,
        tax_rate: String,
        tax_rate_description: String,
        isDeleted: {type: Boolean,default: false},
        tax_zip_post_range: {
            type: Boolean,
            default: false
        },
        tax_zip_code : String

    }],
    copyright_content: String
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

generalSettingsSchema.post("save", async function (doc) {
    doc.tax_settings_uuid = "TaxSetting0000" + doc.tax_settings_id;
    await doc.model("general_settings").findOneAndUpdate({_id: doc._id}, doc);
});

generalSettingsSchema.plugin(AutoIncrement, {inc_field: 'tax_settings_id'});
generalSettingsSchema.methods.testMethod = function(){};
module.exports = mongoose.model('general_settings',generalSettingsSchema);
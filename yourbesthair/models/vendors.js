const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const pointSchema = require('./location');
const fileSchema = require('./file');
const phoneNumberSchema = require('./phone_number');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const vendorSchema = new mongoose.Schema({
	vendor_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },

	vendor_uuid: {
        type: String,
    },

	email: {
		type: String,
		required: true,
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
	salon_name: {
		type: String,
		required: true,
		default:"staff saloon"
	},
	location: {
		type: pointSchema,
		index: '2dsphere'
	},
	categories: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: 'categories'
	},
	sub_categories: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: 'categories'
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
	role: {
		type: String,
		required: false,
		default: 'Vendor'
	},
	vendor: {
		type: String,
		required: false
	},
	phone_number: phoneNumberSchema,
	logo: fileSchema,
	banners: [fileSchema],
	about_short: {
		type: String,
		required: false
	},
	about_long: {
		type: String,
		required: false
	},
	business_hours: [{
		display_name: String,
		day: String,
		is_open: Boolean,
		open_at: String,
		close_at: String
	}],
	business_holidays: [{
		holiday_reason: String,
		from_date: String,
		to_date: String		
	}],
	social_links: [{
		display_name: String,
		provider: String,
		id: String
	}],
	work_gallery: [fileSchema],
	documents: [fileSchema],
	slug: String,
	active_status: {
        type: String,
        enum : ['0', '1', '3'], 
        default: '1'
    },
    approval_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status
        default: '2'
    },
	email_verification_token:{
		type: String
	},
	email_verification_token: {
		type: String,
		required: false
	},
	otp: Number,
	is_email_verified: {
		type: Boolean,
		required: false,
		default: false
	},
	is_profile_completed: {
		type: Boolean,
		default: false
	},
	meta_title: String,
	meta_description: String
}, {
	timestamps: {
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
});

vendorSchema.pre(
	'save',
	async function (next) {
		if (this.password) {
			const hash = await bcrypt.hash(this.password, 10);
			this.password = hash;
		}
		next();
	}
);

vendorSchema.post("save", async function (doc) {
    doc.vendor_uuid = "VENDOR0000" + doc.vendor_id;
    await doc.model("vendors").findOneAndUpdate({_id: doc._id}, doc);
});


vendorSchema.methods.isValidPassword = async function (password) {
	if (this.password) {
		const compare = await bcrypt.compare(password, this.password);
		return compare;
	} else {
		return false;
	}
};

vendorSchema.plugin(AutoIncrement, {inc_field: 'vendor_id'});
vendorSchema.methods.testMethod = function(){};
module.exports = mongoose.model('vendors',vendorSchema);
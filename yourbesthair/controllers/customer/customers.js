const Customers = require('../../models/customers');
const VendorSettings = require('../../models/vendor_Settings');
const VendorServices = require("../../models/vendor_services");
const Vendors = require('../../models/vendors');
const Bookings = require('../../models/bookings');
const GeneralSettings = require('../../models/general_settings');
const { generateAPIReponse } = require('../../utils/response');
const { getQueryProject } = require('../../utils/functions');
const { getSecureRandomToken } = require('../../utils/functions');
const {
    sendEmailVerificationMail,
    sendGridMail,
    sendGridMail_customer,
    sendWelcomeMail,
    sendGridMailForBookingConfimation
} = require('../email');
const stripe = require('stripe')('sk_test_51KYPNaLG0ix0F0ADLObhPvRlwRN2POoaDo1siNukcqPsoNMjLVDI5k4E6cHDmtFx0LKy1zhVvKw5nyzR2OiaTn9f00A02lhn0D');
const { updateBookingByIdDBCall } = require('../../controllers/bookings');
const bcrypt = require('bcrypt');
const { getFilterDataListQuery, getFilterDataListForCustomerQuery } = require('../../utils/functions');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

// for general setting service
// var service;
// GeneralSettings.find().then((generalSettings)=>{
// 	service = JSON.stringify(generalSettings[0].email_settings);
// });

let k = 0;

module.exports = {

    async saveCustomerDetailsById(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('saveCustomerDetailsById id =>', id, 'params =>', params);
        const query = await getSaveCustomerDetailsRequestBody(id, params);
        const queryToMatch = query[0];
        const queryToUpdate = query[1];
        Customers.findOneAndUpdate(queryToMatch, queryToUpdate, { new: true })
            .select('_id title display_name nationality gender first_name last_name full_name email street_address1 street_address2 city state country zip_code phone_number formatted_address created_at billing_address')
            .then(customer => {
                return res.status(200).send(generateAPIReponse(0,'Customer details saved successfully', customer));
            }).catch(error => {
                console.log('updating customer error =>', error);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    },
    async getCustomerNearLocation(req, res) {
        try {
            const params = req.query;
            const id = req.params.id;
            console.log('getCustomerNearLocation id =>', id, 'params =>', params);
            let customer = await Customers.findOne({ _id: mongoose.Types.ObjectId(id) }, { city: 1, state: 1, country: 1, zip_code: 1 }).lean().exec();
            if (customer) {
                let vendor = await Vendors.find({ 
                    $and: [
                        { state: { $regex: "^" + customer.state + "$", $options: 'i' } },
                        { country: { $regex: "^" + customer.country + "$", $options: 'i' } },
                      ]}, { city: 1, state: 1, country: 1, zip_code: 1 }).lean().exec();
                return res.status(200).send(generateAPIReponse(0,'Api excuted successfully', vendor));
            } else {
                return res.status(400).send(generateAPIReponse(1,"No customer found"));
            }
        } catch (error) {
            console.log('getCustomerNearLocation =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getCustomerDetailsById(req, res) {
        const id = req.params.id;
        console.log('getCustomerDetailsById Id =>', id);
        Customers.findOne({ _id: id }, getQueryProject([
            '_id', 'first_name', 'last_name', 'full_name', 'email',
            'street_address1', 'street_address2', 'city', 'state', 'country', 'zip_code',
            'phone_number', 'formatted_address','is_email_verified',
            'created_at', 'billing_address', 'customer_uuid'
        ])).then(customer => {
            return res.status(200).send(generateAPIReponse(0,'Customer details fetched successfully', customer));
        }).catch(error => {
            console.log('getCustomerDetailsById error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },


    getCustomerDetails(req, res) {
        console.log('req.user', req.user);
        const id = req.user.id;
        console.log('getCustomerDetails token Id =>', id);
        Customers.findOne({ _id: id },{ reset_password_sent_at: 0, reset_password_token: 0, password: 0, auth_provider: 0, email_verification_token: 0 }).then(customer => {
            return res.status(200).send(generateAPIReponse(0,'Customer details fetched successfully', customer));
        }).catch(error => {
            console.log('getCustomerDetails error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async getCustomerFilterList(req, res) {
        //res.send("Customer Filter List");
        const params = req.query;
        var from_date = new Date(params.from_date);
        from_date.setDate(from_date.getDate());
        params.from_date = from_date;
       
        var to_date = new Date(params.to_date);
        to_date.setDate(to_date.getDate());
        params.to_date = to_date;

        if (from_date == "Invalid Date"){
            from_date = "1990-03-01T00:00:00.000Z"
        }

        if (to_date == "Invalid Date"){
            to_date = new Date();
        }
       
        if(params.approval_status ==null && params.approval_status == undefined){
            delete params.approval_status;
        }

        if(params.full_name ==null && params.full_name == undefined){
            delete params.full_name;
        }

        if(params.email ==null && params.email == undefined){
            delete params.email;
        }

        if(params.from_date !== null){
            delete params.from_date;
        }

        if(params.to_date !== null ){
            delete params.to_date;
        }

        try {
            const customers = await Customers.find(params).where({created_at: {$gte: new Date(from_date).toISOString(), $lt : new Date(to_date).toISOString() }});
            return res.status(200).send(generateAPIReponse(0,'Customers Filter list fetched successfully', customers));
          } catch (err) {
            console.log('getCustomerFilterList error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
          }
    },

    async bulkDeleteCustomer(req, res){
        //res.send("customer delete");
        const id = req.params.id;
        const arr = id.split(',');
        try{
            Customers.updateMany({_id:{$in: arr}},{ $set: { approval_status: "3", active_status: "3"} },{ returnOriginal: false },
                    function (customers) {
                        return res.status(200).send(generateAPIReponse(0,'Customer deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteCustomerById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

  

    getCustomerList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if(isNaN(page) && isNaN(limit)){
            Customers.find().then(customer => {
                return res.status(200).send(generateAPIReponse(0,'Customer details fetched successfully', customer));
            }).catch(error => {
                console.log('getCustomerDetails error ==>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : { "$expr": { "$ne": ["$active_status", "3"] } }
            if (queryParams.customer_name) {
                filterQuery['$or'] = [
                    { first_name: { "$regex": `.*${queryParams.customer_name}.*`, "$options": "i" } },
                    { last_name: { "$regex": `.*${queryParams.customer_name}.*`, "$options": "i" } }
                ]
            }
            console.log('filterQuery', filterQuery);
            Customers.aggregate([{
                $match: filterQuery
            },
            { $sort: { created_at: -1 } },
            {
                $project: {'first_name':1, 'last_name':1, 'full_name':1, 'email':1,
                'street_address1':1, 'street_address2':1, 'city':1, 'state':1, 'country':1,
                'phone_number':1, 'formatted_address':1,
                'created_at':1, 'billing_address':1, 'active_status':1, 'customer_uuid':1, 'is_email_verified':1 }
            },
            { '$facet'    : {
                metadata: [ { $count: "total" } ],
                data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
            } }
        ]).then(customers => {
                return res.status(200).send(generateAPIReponse(0,'Customer list fetched successfully', customers));
            }).catch(error => {
                console.log('getCustomerList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getVendorCustomerList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip = (page - 1) * limit + 0;
        if (isNaN(page) && isNaN(limit)) {
            skip = 0;
            limit = 10;
        }
        let filterQuery = queryParams ? getFilterDataListForCustomerQuery(queryParams) : { "$expr": { "$ne": ["$active_status", "3"] } }
        if (queryParams.customer_name) {
            filterQuery['$or'] = [
                { first_name: { "$regex": `.*${queryParams.customer_name}.*`, "$options": "i" } },
                { last_name: { "$regex": `.*${queryParams.customer_name}.*`, "$options": "i" } }
            ]
        }
        console.log('filterQuery', filterQuery);
        Bookings.aggregate([
            {
                $lookup: {
                    from: "customers",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $unwind: {
                    path: "$customer",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: filterQuery
            },
            { $sort: { 'customer.created_at': -1 } },
            {
                $group: {
                    _id: "$customer._id",
                    customer: { $first: "$customer" }
                }
            },
            {
                $project: {
                    'first_name': "$customer.first_name",
                    'last_name': "$c.last_name",
                    'full_name': "$customer.full_name",
                    'email': "$customer.email",
                    'street_address1': "$customer.street_address1",
                    'street_address2': "$customer.street_address2",
                    'city': "$customer.city",
                    'state': "$customer.state",
                    'country': "$customer.country",
                    'phone_number': "$customer.phone_number",
                    'formatted_address': "$customer.formatted_address",
                    'created_at': "$customer.created_at",
                    'billing_address': "$customer.billing_address",
                    'active_status': "$customer.active_status",
                    'is_email_verified': "$customer.is_email_verified",
                    'customer_uuid': "$customer.customer_uuid",
                }
            },
            {
                '$facet': {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
                }
            }
        ]).then(customers => {
            return res.status(200).send(generateAPIReponse(0,'Customer list fetched successfully', customers));
        }).catch(error => {
            console.log('getCustomerList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },
    
    // async createCustomer(req, res) {
    //     const J_service = JSON.parse(service).length;
	// 	const parse = JSON.parse(service);
	// 	for(i=0;i<J_service;i++)
	// 	{
	// 		if (parse[i].is_enabled == true){
	// 			k = i;
	// 		}
	// 	}
	// 	if (k == 0){
    //     const params = req.body;
    //     console.log('createCustomer params ==>', params);
    //     try {
    //         params.email_verification_token = await getSecureRandomToken(20);
    //         params.auth_provider = 'admin';
    //         params.customer_id = req.body.customer_id;
    //         const customer = await module.exports.createCustomerDBCall(params);
    //         await sendEmailVerificationMail(customer);
            
    //         return res.status(200).send(generateAPIReponse(0,'Customer created successfully', customer));
    //     } catch (error) {
    //         console.log('createCustomer error =>', error.message);
    //         if (error.resCode)
    //             return res.status(error.resCode).send(generateAPIReponse(error.message));
    //         else
    //             return res.status(500).send(generateAPIReponse(1,error.message));
    //     }
    // }else if(k == 1){
    //     const params = req.body;
    //     console.log('createCustomer params ==>', params);
    //     try {
    //         params.email_verification_token = await getSecureRandomToken(20);
    //         params.auth_provider = 'admin';
    //         params.customer_id = req.body.customer_id;
    //         const customer = await module.exports.createCustomerDBCall(params);
    //         await sendEmailVerificationMail(customer);
            
    //         return res.status(200).send(generateAPIReponse(0,'Customer created successfully', customer));
    //     } catch (error) {
    //         console.log('createCustomer error =>', error.message);
    //         if (error.resCode)
    //             return res.status(error.resCode).send(generateAPIReponse(error.message));
    //         else
    //             return res.status(500).send(generateAPIReponse(1,error.message));
    //     }
    // }else{
    //     const params = req.body;
    //     console.log('createCustomer params ==>', params);
    //     try {
    //         params.email_verification_token = await getSecureRandomToken(20);
    //         params.auth_provider = 'admin';
    //         params.customer_id = req.body.customer_id;
    //         const customer = await module.exports.createCustomerDBCall(params);
    //         //await sendEmailVerificationMail(customer);

    //         await sendGridMail(customer);
            
    //         return res.status(200).send(generateAPIReponse(0,'Customer created successfully', customer));
    //     } catch (error) {
    //         console.log('createCustomer error =>', error.message);
    //         if (error.resCode)
    //             return res.status(error.resCode).send(generateAPIReponse(error.message));
    //         else
    //             return res.status(500).send(generateAPIReponse(1,error.message));
    //     }
    // }
    // },

    async createCustomer(req, res) {
        const params = req.body;
        console.log('createCustomer params ==>', params);
        try {
            params.email_verification_token = await getSecureRandomToken(20);
            params.auth_provider = 'admin';
            params.customer_id = req.body.customer_id;
            const customer = await module.exports.createCustomerDBCall(params);
            await sendGridMail_customer(customer);
            return res.status(200).send(generateAPIReponse(0,'Customer created successfully', customer));
        } catch (error) {
            console.log('createCustomer error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    createCustomerDBCall(params) {
        return new Promise(async(resolve, reject) => {
            const isEmailExist = await Customers.exists({ email: params.email });
            if (params.phone_number) {
                const isPhoneNumberExist = await Customers.exists({ 'phone_number.international_number': params.phone_number.international_number });
                if (isPhoneNumberExist)
                    return reject({ resCode: 409, message: 'The phone number you entered is already exist, Please try with another one.' })
            }
            if (isEmailExist)
                return reject({ resCode: 409, message: 'The email you entered is already exist, Please try with another one.' })
            const newCustomer = new Customers(params);
            if (params.full_name) {
                const name = params.full_name.split(' ');
                newCustomer.first_name = name[0];
                newCustomer.last_name = name && name.length > 1 ? name[1]: '';
            }
            newCustomer.save()
                .then(async(customer) => {
                    resolve(customer);
                })
                .catch((err) => {
                    reject({ resCode: 500, message: err.message })
                });
        })
    },

    async deleteCustomerById(req, res) {
        const id = req.params.id;
        console.log('deleteCustomerById id =>', id);
        try {
            await deleteCustomerByIdDBCall(id);
            return res.status(200).send(generateAPIReponse(0,'Customer deleted successfully'));
        } catch (error) {
            console.log('deleteCustomerById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async resetPassword(req, res) {
        const params = req.body;
        const id = req.user.id;
        console.log('resetPassword params =>', params, 'id => ', id);
        const customer = await Customers.findOne({ _id: id });
        if (!customer)
            return res.status(404).send(generateAPIReponse(1,'Requested customer does not exist'));
        const isPasswordValid = await customer.isValidPassword(params.old_password);
        if (!isPasswordValid)
            return res.status(401).send(generateAPIReponse(1,'The old password you entered is incorrect'));
        if (params.new_password !== params.confirm_password)
            return res.status(401).send(generateAPIReponse(1,'The new password and confirm pasword does not match'));
        const hash = await bcrypt.hash(params.new_password, 10);
        Customers.findOneAndUpdate({ _id: id }, {
            password: hash,
        }).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Your password reset successfully'));
        }).catch(error => {
            console.log('resetPassword error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async deleteMyAccount(req, res) {
        const id = req.user.id;
        console.log('deleteMyAccount id =>', id);
        try {
            await deleteCustomerByIdDBCall(id);
            return res.status(200).send(generateAPIReponse(0,'Account deleted successfully'));
        } catch (error) {
            console.log('deleteMyAccount error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async deleteMyAccountAddress(req, res) {
        const id = req.user.id;
        const addressId = req.params.addressId;
        console.log('deleteMyAccountAddress id =>', id);
        try {
            await Customers.findOneAndUpdate({ _id: ObjectId(id) }, { $pull: { billing_address: { _id: addressId }}}).exec();
            return res.status(200).send(generateAPIReponse(0,'Address deleted successfully'));
        } catch (error) {
            console.log('deleteMyAccountAddress error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async putCustomerStatus(req, res) {
        try {
            const { customerID, otp } = req.params;
            let result = await Customers.findOne({ _id: customerID }).exec();
            if (result && result._id) {
                if (result.otp == otp) {
                    await Customers.findOneAndUpdate({ _id: customerID }, { is_email_verified: true, otp: null }).exec();
                    await sendWelcomeMail(result);
                    // res.redirect('https://vendor-bookingdemo.zielcommerce.in/');
                    return res.status(200).send(generateAPIReponse(0,'Account verified successfully'));
                } else {
                    return res.status(400).send(generateAPIReponse(1,'Invalid otp!'));
                }
            } else {
                return res.status(400).send(generateAPIReponse(1,'No User found!'));
            }
        } catch (error) {
            console.log('putCustomerStatus error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async chargeCustomer(req, res) {
        const params = req.body;
        // console.log('charge customer params =>', params);
        const customer = await Customers.findOne({ _id: params.customerId }).exec();
       // console.log(customer)
        let charge;
        try {
            if (params.is_payment_retry) {
                await stripe.customers.update(customer.stripe_customer_id, {
                    source: params.token_id,
                })
                const chargeBody = await getStripeCreateChargeBody(customer, params);
                stripe.charges.update(params.stripe_charge_id, chargeBody).then(result => {
                    charge = result
                    Customers.findByIdAndUpdate(params.customerId, { stripe_card_id: params.card_id }).then(result => {
                        resolve(stripeCustomer.id);
                    }).catch(error => {
                        console.log('update customer stripe id error=>', error);
                        reject(error)
                    })
                })
            } else {
                const chargeBody = await getStripeCreateChargeBody(customer, params);
                charge = await stripe.charges.create(chargeBody)
            }
            updateBookingByIdDBCall({
                payment_status: "1",
                stripe_charge_id: charge.id
            }, params.bookingId)

            let _transactionId = charge && charge.id ? charge.id.replace('ch_', ''): '';
            let _tempBooking = await Bookings.findOne({ _id: params.bookingId }).populate('services').populate('customer').populate('vendor').lean().exec();
            let _vendor_settings = await VendorSettings.findOne({}, { commission_value: 1 }).sort({ updated_at: -1, created_at: -1 }).lean().exec();
            _vendor_settings = _vendor_settings && _vendor_settings.commission_value ? parseFloat(_vendor_settings.commission_value)/100 : 0;
            let _commision = _tempBooking && _tempBooking.amount ? _tempBooking.amount * _vendor_settings: 0
            await Bookings.findOneAndUpdate({ _id: params.bookingId }, { $set: { commission: _commision }}).lean().exec();
            let _bookingId = _tempBooking ? _tempBooking.booking_uuid: "";
            if (_tempBooking) {
                if (_tempBooking.customer && _tempBooking.customer.billing_address && _tempBooking.customer.billing_address.length ) {
                    let _address = _tempBooking.customer.billing_address.find(x => (x._id && _tempBooking.billing_address && x._id.toString() == _tempBooking.billing_address.toString()) || x.is_primary)
                    _tempBooking.billing_address = _address;
                    _tempBooking['customer']['billing_address'] = _address;
                }
                if (_tempBooking.tax_applied && _tempBooking.tax_applied.settingId) {
                    let param = _tempBooking.tax_applied
                    let _params = { country: param.country, state: param.state }
                    const result = await findTaxZoneDetailsOfCustomerRegion(
                        param.settingId,
                        _params
                    );
                    let tax = result && result.tax_settings ? result.tax_settings : null;
                    let final_result = await findProductDetails(param.services, tax);
                    _tempBooking['calculated_services'] = final_result
                }
            }
            await sendGridMailForBookingConfimation(_tempBooking, _commision, "customer");
            await sendGridMailForBookingConfimation(_tempBooking, _commision, "vendor");
            await sendGridMailForBookingConfimation(_tempBooking, _commision, "admin");

            return res.status(200).send(generateAPIReponse(0,'Customer charged successfully', { transactionId: _transactionId, bookingId: _bookingId}));
        } catch (error) {
            updateBookingByIdDBCall({
                payment_status: "0",
                stripe_charge_id: error.charge
            }, params.bookingId)
            console.log('chargeCustomer error =>', error.message);
            return res.status(307).send(generateAPIReponse(error.message, error.charge));
        }
    },
    getCustomerById(req, res) {
        const customerId = req.params.customerId;
        console.log('getCustomerDetailsById CustomerId =>', customerId);
        Customers.findOne({ _id: ObjectId(customerId) }).then(async(customer) => {
            let result = customer;
            return res.status(200).send(generateAPIReponse(0,'Customer details by Id fetched successfully', result));
        }).catch(error => {
            console.log('getCustomerDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async createPaymentIntent(req, res) {
        const params = req.body;
        try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: params.amount,
              currency: "usd",
              payment_method_types: ["card"]
            });
            const clientSecret = paymentIntent.client_secret;
        
           /*  res.json({
              clientSecret
            }) */
            return res.status(200).send(generateAPIReponse(0,'Stripe client token created successfully', clientSecret));
          } catch (error) {
            console.log('createPaymentIntent error =>',error.message);
            //res.json({ error: error.message })
            return res.status(307).send(generateAPIReponse(1,error.message));
          }
    }
}

function getStripeCreateChargeBody(customer, params) {

   // console.log(params);
    console.log(customer.stripe_customer_id);
   
    return new Promise(async(resolve, reject) => {
        try {
            const stripeCustomerId = !customer.stripe_customer_id ? await createStripeCustomer(customer, params.token_id, params.card_id) : customer.stripe_customer_id;
           
            const billingAddress = params.billing_address;
            // console.log(stripeCustomerId);
            // console.log(billingAddress);
            let _amount = params.amount ? Number(params.amount) * 100: 0;
            _amount = Number(parseFloat(_amount).toFixed(2))
            const body = {
                shipping: {
                    name: `${billingAddress.first_name} ${billingAddress.last_name}`,
                    address: {
                        line1: billingAddress.street_address1 || billingAddress.street_address2,
                        postal_code: billingAddress.zip_code,
                        city: billingAddress.city,
                        state: billingAddress.state,
                        country: billingAddress.country,
                    }
                },
                amount: _amount,
                currency: 'usd',
                description: 'Service Booking Charge',
                customer: stripeCustomerId
            }
            resolve(body);
        } catch (error) {
            reject(error)
        }
    })
}

async function getTaxZoneDetailsDBCallQuery(settingId, query) {
    return new Promise((resolve, reject) => {
        console.log("query ------------------", JSON.stringify(query));
        let _query = { ...query, _id: settingId, 'tax_settings.isDeleted': false }
        GeneralSettings.findOne(_query)
            .then((result) => {
                if (result && result.tax_settings && result.tax_settings.length) {
                    resolve(result);
                } else {
                    resolve(null);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
}

async function findTaxZoneDetailsOfCustomerRegion(settingId, params) {
    return new Promise(async (resolve, reject) => {
        try {
            let result;
            result = await getTaxZoneDetailsDBCallQuery(settingId, {
                $and: [
                    { 'tax_settings.tax_zone_country': { $regex: "^" + params.country + "$", $options: 'i' } },
                    { 'tax_settings.tax_zone_state': { $regex: "^" + params.state + "$", $options: 'i' } },
                ],
            });
            if (result == null) {
                result = await getTaxZoneDetailsDBCallQuery(settingId, {
                    $and: [
                        { 'tax_settings.tax_zone_country': { $regex: "^" + params.country + "$", $options: 'i' } },
                        { 'tax_settings.tax_zone_state': { $exists: false } },
                    ],
                });
            }
            if (result == null) {
                result = await getTaxZoneDetailsDBCallQuery(settingId, {
                    'tax_settings.tax_zone_country': "All Countries",
                });
            }
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

async function findProductDetails(service = [], tax = []) {
    console.log("tax --------------------------------", JSON.stringify(tax));
    return new Promise(async (resolve, reject) => {
        let serviceIds = service.map(x => mongoose.Types.ObjectId(x.id));
        let products = await VendorServices.find({ _id: { $in: serviceIds } }).populate([
            {
                path: 'service',
                populate: [{ path: 'tax_rule' }]
            }
        ]).lean().exec();
        if (products && products.length) {
            products = products.map(x => {
                let _tempTaxRule = x.service && x.service.tax_rule ? x.service.tax_rule : null;
                let _serviceCount = service.find(y => y.id && y.id.toString() == x._id.toString());
                let _tax = 0, _price = 0, _toTax = 0, _finalTax = [];
                if (x.price) {
                    _price = Number(x.price)
                    if (_serviceCount) {
                        _price = _price * (_serviceCount.count ? Number(_serviceCount.count) : 1)
                    }
                }
                if (_tempTaxRule && !_tempTaxRule.isDeleted && _tempTaxRule.tax_rate) {
                    let _actualRate = _tempTaxRule.tax_rate || [];
                    _actualRate.forEach(element => {
                        let _taxRate = tax && tax.length ? tax.find(p => p._id && p._id.toString() == element.toString()): null;
                        let _totalTax = {}
                        let _tax_rate = _taxRate && _taxRate.tax_rate ? Number(_taxRate.tax_rate) : 0
                        let _tax_desc = _taxRate && _taxRate.tax_rate_description ? _taxRate.tax_rate_description : null
                        _totalTax['tax_rate'] = _tax_rate;
                        _totalTax['tax_rate_description'] = _tax_desc;
                        _tax = (_price * _tax_rate) / 100;
                        _toTax += _tax;
                        _totalTax['tax'] = _tax;
                        _finalTax.push(_totalTax)
                    })
                }
                x['applied_tax'] = _finalTax
                x['quantity'] = (_serviceCount.count ? Number(_serviceCount.count) : 1);
                x['name'] = x.service && x.service.name ? x.service.name : '';
                x['taxable'] = _toTax;
                x['price'] = _price;
                x['total'] = _price + _toTax;
                return x;
            })
            let _vendor_settings = await VendorSettings.findOne({}, { commission_value: 1 }).sort({ updated_at: -1, created_at: -1 }).lean().exec();
            _vendor_settings = _vendor_settings && _vendor_settings.commission_value ? parseFloat(_vendor_settings.commission_value)/100 : 0;
            let total = products.reduce((sum, x) => { return sum + (x.total ? Number(x.total) : 0) }, 0);
            let taxableValue = products.reduce((sum, x) => { return sum + (x.price ? Number(x.price) : 0) }, 0);
            let totalTax = products.reduce((sum, x) => { return sum + (x.taxable ? Number(x.taxable) : 0) }, 0);
            let commission = taxableValue * _vendor_settings;
            commission = Number(parseFloat(commission).toFixed(2))
            let estimatedSellerTotal = total //- commission;
            let _finalRes = { services: products, expenditure: { total, taxableValue, totalTax, commission, estimatedSellerTotal } }
            resolve(_finalRes)
        } else {
            resolve({ services: [], expenditure: { total: 0, taxableValue: 0, totalTax: 0, commission: 0, estimatedSellerTotal: 0 } })
        }
    })
};

function createStripeCustomer(customer, tokenId, cardId) {
  
    console.log('createStripeCustomer', tokenId, cardId);
    return new Promise((resolve, reject) => {
        stripe.customers.create({
            name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email,
            source: tokenId
        }).then(async(stripeCustomer) => {
            Customers.findByIdAndUpdate(customer._id, { stripe_customer_id: stripeCustomer.id, stripe_card_id: cardId }).then(result => {
                resolve(stripeCustomer.id);
            }).catch(error => {
                console.log('update customer stripe id error=>', error);
                reject(error)
            })
        }).catch(error => {
            console.log('createStripeCustomer error=>', error);
            reject(error)
        })
    })
}

function getSaveCustomerDetailsRequestBody(id, params) {
    return new Promise(async(resolve, reject) => {
        if (params.full_name) {
            const name = params.full_name.split(' ');
            params.first_name = name[0];
            params.last_name = name[1];
        }
        let queryToUpdate = { $push: {}, $set: {} }
        queryToUpdate.$set = params;
        let idToMatch = { _id: id }
        if (params.billing_address) {
            const billingDetails = params.billing_address
            const customer = await Customers.findOne({ _id: id })
            if (customer.billing_address && customer.billing_address.length !== 0 && (params.billing_address.is_primary == false || params.billing_address.is_primary == undefined)) {
                billingDetails['is_primary'] = false
            } else {
                billingDetails['is_primary'] = true
            }
            if (billingDetails._id) {
                idToMatch['billing_address._id'] = billingDetails._id;
                if (billingDetails.is_primary) {
                    const updatedCustomer = await setPrimarybillingAddress(id, billingDetails._id, customer.billing_address);
                }
                const allFields = Object.keys(billingDetails);
                if (allFields.length > 0) {
                    allFields.filter(item => {
                        if (item !== 'is_primary') {
                            queryToUpdate.$set[`billing_address.$.${item}`] = billingDetails[item];
                        }
                    })
                }
            } else {
                queryToUpdate.$push['billing_address'] = params.billing_address;
            }
            delete params.billing_address;
        }
        console.log('queryToUpdate', queryToUpdate);
        return resolve([idToMatch, queryToUpdate]);
    })
}

function setPrimarybillingAddress(id, billingAddressId, billingAddress) {
    console.log('setPrimarybillingAddress');
    return new Promise((resolve, reject) => {
        billingAddress.forEach(function(address, index) {
            if (address._id == billingAddressId) {
                billingAddress[index].is_primary = true;
            } else {
                billingAddress[index].is_primary = false;
            }
        });
        Customers.findOneAndUpdate({ _id: id }, {
            billing_address: billingAddress
        }, { new: true }).then(customer => {
            resolve(customer);
        }).catch(error => {
            console.log('setPrimarybillingAddress error =>', error);
            reject(error)
        })
    })
}


function deleteCustomerByIdDBCall(id) {
    return new Promise((resolve, reject) => {
        const status = {
            active_status: "3"
        }
        Customers.findByIdAndUpdate(id, status).then(result => {
            resolve(result);
        }).catch(error => {
            reject(error)
        })
    })
}
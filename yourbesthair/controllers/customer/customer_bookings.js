const Bookings = require('../../models/bookings');
const GeneralSettings = require("../../models/general_settings");
const VendorServices = require("../../models/vendor_services");
const VendorSettings = require("../../models/vendor_Settings");
const { generateAPIReponse } = require('../../utils/response');
const mongoose = require('mongoose');
var _ = require('lodash');

module.exports = {

    getMyBookings(req, res) {
        console.log('getMyBookings');
        Bookings.find({ customer: req.user.id })
            .populate('services', 'name')
            .populate('vendor', 'formatted_address salon_name slug logo')
            .sort({ appointment_date: -1 }).lean()
            .then(bookings => {
                bookings.map(x => {
                    if (x.booking_status) {
                        switch (true) {
                            case x.booking_status == '1':
                             x['status'] = {
                                "name": "accepted",
                                "display_name": "Accepted",
                                "value": "1"
                            };
                             break;
                            case x.booking_status == '2':
                             x['status'] =  {
                                "name": "pending",
                                "display_name": "Pending",
                                "value": "2"
                            };
                             break;
                            case x.booking_status == '3':
                             x['status'] =  {
                                "name": "declined",
                                "display_name": "Declined",
                                "value": "3"
                            };
                             break;
                            case x.booking_status == '4':
                             x['status'] =  {
                                "name": "cancelled",
                                "display_name": "Cancelled",
                                "value": "4"
                            };
                             break;
                            case x.booking_status == '5':
                             x['status'] =  {
                                "name": "completed",
                                "display_name": "Completed",
                                "value": "5"
                            };
                             break;
                            case x.booking_status == '6':
                             x['status'] =  {
                                "name": "inprogress",
                                "display_name": "InProgress",
                                "value": "6"
                            };
                             break;
                            default: 
                            break;
                        }
                    }
                    return x;
                });
                return res.status(200).send(generateAPIReponse(0,'Customer bookings fetched successfully', bookings));
            })
            .catch(error => {
                console.log('getMyBookings error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    },

    gteMyBookingDetailsById(req, res) {
        console.log('gteMyBookingDetailsById id =>', req.params.id);
        Bookings.aggregate([
            {
                $match: {
                    "$expr": { "$eq": ['$_id', mongoose.Types.ObjectId(req.params.id)] }
                }
            },
            {
                $lookup: {
                    from: "vendor_services",
                    let: { "vendorId": "$vendor", "servicesId": "$services" },
                    as: "services",
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    {
                                        "$expr": { "$eq": ["$vendor", "$$vendorId"] }
                                    },
                                    {
                                        "$expr": { "$in": ["$service", "$$servicesId"] }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "services",
                                let: { "serviceId": "$service" },
                                pipeline: [
                                    {
                                        $match: {
                                            "$expr": { "$eq": ["$_id", "$$serviceId"] }
                                        }
                                    },
                                    {
                                        $project: {
                                            name: 1,
                                        }
                                    },
                                ],
                                as: "services"
                            }
                        },
                        {
                            $project: {
                                vendor: 0, service: 0, __v: 0, created_at: 0, updated_at: 0
                            }
                        },
                        { $unwind: "$services" },
                    ]
                }
            },
            {
                $lookup: {
                    from: "customers",
                    let: { "customerId": "$customer" },
                    as: "customer",
                    pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$_id", "$$customerId"] }
                            }
                        },
                        {
                            $project: {
                                first_name: 1, last_name: 1, phone_number: 1, street_address1: 1, street_address2: 1, city: 1, state: 1, country: 1, zip_code: 1, formatted_address: 1, billing_address: 1
                            }
                        }
                    ]
                }
            },
            { $unwind: "$customer" },
        ]).then(booking => {
            const billingAddress = _.find(booking[0].customer.billing_address, function (billingAddress) { return billingAddress._id.equals(booking[0].billing_address) });
            booking[0].customer.billing_address = billingAddress;
            delete booking[0].billing_address;
            return res.status(200).send(generateAPIReponse(0,'Customer booking details fetched successfully', booking[0]));
        }).catch(error => {
            console.log('gteMyBookingDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async gteMyBookingDetailsByIdV2(req, res) {
        try {
            console.log('gteMyBookingDetailsById id =>', req.params.id);
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(generateAPIReponse(1,"Invalid booking id"));
            let _bookings = await Bookings.findOne({ _id: mongoose.Types.ObjectId(req.params.id) })
            .populate('services').populate('customer').populate('vendor').lean().exec();
            if (_bookings) {
                if (_bookings.customer && _bookings.customer.billing_address && _bookings.customer.billing_address.length ) {
                    let _address = _bookings.customer.billing_address.find(x => (x._id && _bookings.billing_address && x._id.toString() == _bookings.billing_address.toString()) || x.is_primary)
                    _bookings.billing_address = _address;
                    _bookings['customer']['billing_address'] = _address;
                }
                if (_bookings.tax_applied && _bookings.tax_applied.settingId) {
                    let param = _bookings.tax_applied
                    let _params = { country: param.country, state: param.state }
                    const result = await findTaxZoneDetailsOfCustomerRegion(
                        param.settingId,
                        _params
                    );
                    let tax = result && result.tax_settings ? result.tax_settings : null;
                    let final_result = await findProductDetails(param.services, tax);
                    _bookings['calculated_services'] = final_result
                }
            }
            return res.status(200).send(generateAPIReponse(0,'Customer booking details fetched successfully', _bookings));
        } catch (error) {
            console.log('gteMyBookingDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message || "Something went wrong!"));
        }
    },

    async addCommentOnBooking(req, res) {
        try {
            console.log('addCommentOnBooking id =>', req.params.id);
            let { comment } = req.body;
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(generateAPIReponse(1,"Invalid booking id"));
            let _bookings = await Bookings.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.id) }, { $set: { comment }}, { new: true }).lean().exec();
            return res.status(200).send(generateAPIReponse(0,'Comment added successfully!'));
        } catch (error) {
            return res.status(500).send(generateAPIReponse(1,error.message || "Something went wrong!"));
        }
    }
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
const moment = require('moment');
const Bookings = require('../models/bookings');
const Customers = require('../models/customers');
const Vendors = require('../models/vendors');
const VendorService = require('../models/vendor_services');
const TaxRule = require("../models/tax_rules");
const Services = require('../models/services');
const GeneralSettings = require("../models/general_settings");
const VendorSettings = require("../models/vendor_Settings");
const { generateAPIReponse } = require('../utils/response');
const { getQueryProject } = require('../utils/functions');
const { getFilterDataListQuery } = require('../utils/functions');
const {
    getBookingsByServiceNameQuery,
    getBookingsByCustomerMatchQuery,
    getBookingsByVendorMatchQuery
} = require('../utils/db_queries/booking_queries')
const mongoose = require('mongoose')
const {
	sendGridMail_assignstaff,
} = require('./email');
const ObjectId = mongoose.Types.ObjectId;
 
module.exports = {
    async saveBookingDetails(req, res) {
        const params = req.body;
        console.log('saveBookingDetails params', params);
        myObjectId = ObjectId();
        params.staffid=myObjectId;

        try {
            const booking = await addBookingDetailsDBCall(params);
            return res.status(200).send(generateAPIReponse(0,'Booking details saved successfully', booking));
        } catch (error) {
            console.log('saveBookingDetails error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },  

    async updateBookingDetailsById(req, res) {
        const id = req.params.id;
        const params = req.body;
        console.log('updateBookingDetailsById id =>', id, 'params =>', params);
        try {
            const booking = await module.exports.updateBookingByIdDBCall(params, id);
            return res.status(200).send(generateAPIReponse(0,'Booking details updated successfully', booking));
        } catch (error) {
            console.log('updateBookingDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    updateBookingByIdDBCall(params, id) {
        return new Promise(async(resolve, reject) => {
            Bookings.findByIdAndUpdate(id, params, { new: true }).then(booking => {
                resolve(booking);
            }).catch(error => {
                reject(error);
            })
        })
    },
      
    getBookingList(req, res) {
        const queryParams = req.query;
        let page = queryParams.page ? parseInt(queryParams.page): 1;
        let limit = queryParams.limit ? parseInt(queryParams.limit): 50;
        let skip =  (page - 1) * limit + 0;
        if(isNaN(page) && isNaN(limit)){
            Bookings.find({ "active_status": { $ne: "3" } }).then((bookings) => {
                return res.status(200).send(generateAPIReponse(0,'Booking details fetched successfully', bookings));
            }).catch(error => {
                console.log('getBookingDetails error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            const filterQuery = queryParams ? getFilterDataListQuery(queryParams) : { "active_status": { $ne: "3" } }
            let aggregateQuery = [{ $match: filterQuery }];
            const serviceQuery = getBookingsByServiceNameQuery(queryParams.service_name ? { 'services.name': { "$regex": `.*${queryParams.service_name}.*`, "$options": "i" } } : {});
            aggregateQuery = aggregateQuery.concat(serviceQuery);
            const vendoreQuery = getBookingsByVendorMatchQuery(queryParams.vendor_name ? { 'vendor.salon_name': { "$regex": `.*${queryParams.vendor_name}.*`, "$options": "i" } } : {});
            aggregateQuery = aggregateQuery.concat(vendoreQuery);
            if (queryParams['customer_name'] && queryParams['customer_email']) {
                const customerQuery = getBookingsByCustomerMatchQuery({
                    $and: [
                        { 'customer.first_name': { "$regex": `.*${queryParams.customer_name}.*`, "$options": "i" } },
                        { 'customer.email': { "$regex": `.*${queryParams.customer_email}.*`, "$options": "i" } }
                    ]
                });
                aggregateQuery = aggregateQuery.concat(customerQuery);
            } else if (queryParams['customer_name']) {
                const customerQuery = getBookingsByCustomerMatchQuery({ 'customer.first_name': { "$regex": `.*${queryParams.customer_name}.*`, "$options": "i" } });
                console.log('customerQuery', customerQuery);
                aggregateQuery = aggregateQuery.concat(customerQuery);
            } else if (queryParams['customer_email']) {
                const customerQuery = getBookingsByCustomerMatchQuery({ 'customer.email': { "$regex": `.*${queryParams.customer_email}.*`, "$options": "i" } });
                aggregateQuery = aggregateQuery.concat(customerQuery);
            }
            else if (queryParams.booking_uuid) {
                filterQuery['$or'] = [
                    { booking_uuid: { "$regex": `${queryParams.booking_uuid}`, "$options": "i" } }
                ]
            }
            else if (queryParams.booking_status) {
                filterQuery['$or'] = [
                    { booking_status: { "$regex": `${queryParams.booking_status}`, "$options": "i" } }
                ]
            }
            else {
                const customerQuery = getBookingsByCustomerMatchQuery({});
                aggregateQuery = aggregateQuery.concat(customerQuery);
            }
            let paginate = { '$facet'    : {
                metadata: [ { $count: "total" }, { $addFields: { page: Number(page) } } ],
                data: [ { $skip: skip }, { $limit: limit } ] // add projection here wish you re-shape the docs
            } }
    
            aggregateQuery = aggregateQuery.concat(paginate);
            //console.log('getBookingList aggregateQuery', aggregateQuery);
            Bookings.aggregate(aggregateQuery).then(result => {
                //console.log("result >>>>>>>>>",result[0])
                return res.status(200).send(generateAPIReponse(0,'Booking list fetched successfully', result));
            }).catch(error => {
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async getBookingListV2(req, res) {
        try {
            const { _id, booking_uuid, booking_id, customer_name, customer_email, vendor_id, vendor_name, service_name, status, payout_status, fromDate, toDate, page, limit , staff_id} = req.body;
            let _query = {};
            let _page = page ? parseInt(page): 1;
            let _limit = limit ? parseInt(limit): 50;
            let skip =  (_page - 1) * _limit;
            console.log("skip limit------------------------", skip, _limit);
            if (_id) {
                if (!ObjectId.isValid(_id)) return res.status(400).send(generateAPIReponse(1,"Invalid id"));
                _query = { _id: ObjectId(_id) };
            }
            if (booking_uuid) {
                _query = { ..._query, booking_uuid }
            }
            if (booking_id) {
                _query = { ..._query, booking_id }
            }
            if (customer_name) {
                _query = { ..._query, 'customer.full_name': { $regex: customer_name, $options: 'i' } }
            }
            if (customer_email) {
                _query = { ..._query, 'customer.email': { $regex: customer_email, $options: 'i' } }
            }
            if (vendor_name) {
                _query = { ..._query, 'vendor.salon_name': { $regex: vendor_name, $options: 'i' } }
            }
            if (vendor_id) {
                _query = { ..._query, 'vendor._id': ObjectId(vendor_id) }
            }

            if (staff_id) {
                _query = { ..._query, 'staffid': ObjectId(staff_id) }
            }
            if (service_name) {
                _query = { ..._query, 'services.name': { $regex: service_name, $options: 'i' } }
            }
            if (status || status == '0') {
                _query = { ..._query, "booking_status": Number(status) }
            }
            if (payout_status || payout_status == '0') {
                _query = { ..._query, "vendor_payout_status": payout_status.toString() }
            }
            if (fromDate && toDate) {
                _query = { ..._query, 'appointment_date': { $gte: new Date(fromDate).toISOString(), $lte: new Date(toDate).toISOString() } }
                console.log("_query in -----------------------------------", JSON.stringify(_query));
            } else if (fromDate) {
                _query = { ..._query, 'appointment_date': { $gte: new Date(fromDate).toISOString() } }
            } else if (toDate) {
                _query = { ..._query, 'appointment_date': { $lte: new Date(toDate).toISOString() } }
            }
            console.log("_query -----------------------------------", JSON.stringify(_query));

            // let _bookings = await Bookings.find(_query).populate('services').populate('customer')
            // .populate('vendor').sort({ updated_at: -1, created_at: -1 }).skip(skip).limit(limit).lean().exec();
            let _aggregate = [
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
                    $lookup: {
                        from: "vendors",
                        localField: "vendor",
                        foreignField: "_id",
                        as: "vendor"
                    }
                },
                {
                    $unwind: {
                        path: "$vendor",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services"
                    }
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $match: _query },
                {
                    $group: {
                        _id: "$_id",
                        booking_id: { $first: "$booking_id" },
                        booking_uuid: { $first: "$booking_uuid" },
                        appointment_date: { $first: "$appointment_date" },
                        time_slot: { $first: "$time_slot" },
                        services: { $push: "$services" },
                        customer: { $first: "$customer" },
                        vendor: { $first: "$vendor" },
                        amount: { $first: "$amount" },
                        active_status: { $first: "$active_status" },
                        booking_status: { $first: "$booking_status" },
                        billing_address: { $first: "$billing_address" },
                        payment_status: { $first: "$payment_status" },
                        vendor_payout_status: { $first: "$vendor_payout_status" },
                        payout_transaction_id: { $first: "$payout_transaction_id" },
                        vendor_acknowladge: { $first: "$vendor_acknowladge" },
                        stripe_charge_id: { $first: "$stripe_charge_id" },
                        comment: { $first: "$comment" },
                        commission: { $first: "$commission" },
                        created_at: { $first: "$created_at" },
                    }
                },
                { $sort: { created_at: -1 }},
                { $skip: skip },
                { $limit: _limit }
            ]
            let _countQuery = [
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
                    $lookup: {
                        from: "vendors",
                        localField: "vendor",
                        foreignField: "_id",
                        as: "vendor"
                    }
                },
                {
                    $unwind: {
                        path: "$vendor",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services"
                    }
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $match: _query },
                {
                    $group: {
                        _id: "$_id",
                        booking_id: { $first: "$booking_id" },
                        booking_uuid: { $first: "$booking_uuid" },
                        appointment_date: { $first: "$appointment_date" },
                        time_slot: { $first: "$time_slot" },
                        services: { $push: "$services" },
                        customer: { $first: "$customer" },
                        vendor: { $first: "$vendor" },
                        amount: { $first: "$amount" },
                        booking_status: { $first: "$booking_status" },
                        billing_address: { $first: "$billing_address" },
                        payment_status: { $first: "$payment_status" },
                        vendor_payout_status: { $first: "$vendor_payout_status" },
                        payout_transaction_id: { $first: "$payout_transaction_id" },
                        vendor_acknowladge: { $first: "$vendor_acknowladge" },
                        _charge_id: { $first: "$stripe_charge_id" },
                        comment: { $first: "$comment" },
                        commission: { $first: "$commission" },
                    }
                },
                { $count: "totalCount" }
            ]
            console.log("_aggregate ----------------------------", JSON.stringify(_aggregate));
            let _bookings = await Bookings.aggregate(_aggregate).exec();
            let _customerCount = await Bookings.aggregate([
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
                    $lookup: {
                        from: "vendors",
                        localField: "vendor",
                        foreignField: "_id",
                        as: "vendor"
                    }
                },
                {
                    $unwind: {
                        path: "$vendor",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services"
                    }
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $match: _query },
                {
                    $group: {
                        _id: "$customer._id"
                    }
                },
                { $count: "totalCount" }
            ]).exec();
            let _totalBooking = _bookings.reduce((total, obj) => Number(obj.amount) + total, 0);
            let _totalCommision = _bookings.reduce((total, obj) => Number(obj.commission) + total, 0);
            let _count = await Bookings.aggregate(_countQuery).exec(), count = 0, customerCount = 0;
            if (_count.length) count = _count[0] && _count[0].totalCount ? _count[0].totalCount: 0
            if (_customerCount.length) customerCount = _customerCount[0] && _customerCount[0].totalCount ? _customerCount[0].totalCount: 0
            return res.status(200).send(generateAPIReponse(0,'Booking details fetched successfully', { data: _bookings, count, bookingAmout: _totalBooking, totalCommision: _totalCommision, customerCount }));
        } catch (error) {
            console.log('getBookingListV2 error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },
    async assignStaff(req, res) {
        try {
            console.log('assign Staff id =>', req.params.id);
            const vendorId = req.user.id;
            const bookingid = req.params.id;
            console.log("Logged vendor is ",vendorId);
            let { staffid } = req.body;
            console.log(staffid);
            const staffcheck = await Vendors
            .find ({_id:staffid,vendor:vendorId})
            .countDocuments();
            console.log(staffcheck);
            if (staffcheck == 0 ) return res.status(400).send(generateAPIReponse(1,"Staff is not belongs to this vendor"));
            const bookingcheck = await Bookings
            .find ({_id:bookingid,vendor:vendorId})
            .countDocuments();
            console.log(bookingcheck);
            if (bookingcheck == 0 ) return res.status(400).send(generateAPIReponse(1,"Booking is not belongs to this vendor"));
            let _set = {};
            if (staffid) _set = { ..._set, staffid }
            let staffDetails = await Vendors.find( { _id: staffid }, { first_name: 1, email: 1 } ); 
            
            staffDetails['booking_id']=bookingid;

            console.log(staffDetails);
            
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(generateAPIReponse(1,"Invalid booking id"));
            if (Object.keys(_set).length) await Bookings.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.id) }, { $set: _set }, { new: true }).lean().exec();
            sendGridMail_assignstaff(staffDetails);
            return res.status(200).send(generateAPIReponse(0,'Staff updated successfully!'));
        } catch (error) {
            console.log('assignStaff error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message || "Something went wrong!"));
        }
    },  
    async getBookingForCalander(req, res) {
        try {
            let { _id, vendor_id, fromDate, toDate } = req.body;
            let _query = {};
            if (_id) {
                if (!ObjectId.isValid(_id)) return res.status(400).send(generateAPIReponse(1,"Invalid id"));
                _query = { _id: ObjectId(_id) };
            }
            if (vendor_id) {
                _query = { ..._query, 'vendor._id': ObjectId(vendor_id) }
            }
            if (fromDate && toDate) {
                _query = { ..._query, 'appointment_date': { $gte: new Date(fromDate).toISOString(), $lte: new Date(toDate).toISOString() } }
            } else {
                const date = new Date(), y = date.getFullYear(), m = date.getMonth();
                fromDate = new Date(y, m, 1);
                toDate = new Date(y, m + 1, 1);
                _query = { ..._query, 'appointment_date': { $gte: new Date(fromDate).toISOString(), $lte: new Date(toDate).toISOString() } }
            }
            console.log("_query -----------------------------------", JSON.stringify(_query));
            let _aggregate = [
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
                    $lookup: {
                        from: "vendors",
                        localField: "vendor",
                        foreignField: "_id",
                        as: "vendor"
                    }
                },
                {
                    $unwind: {
                        path: "$vendor",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services"
                    }
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $match: _query },
                {
                    $group: {
                        _id: "$_id",
                        booking_id: { $first: "$booking_id" },
                        booking_uuid: { $first: "$booking_uuid" },
                        appointment_date: { $first: "$appointment_date" },
                        time_slot: { $first: "$time_slot" },
                        services: { $push: "$services" },
                        customer: { $first: "$customer" },
                        vendor: { $first: "$vendor" },
                        amount: { $first: "$amount" },
                        active_status: { $first: "$active_status" },
                        booking_status: { $first: "$booking_status" },
                        billing_address: { $first: "$billing_address" },
                        payment_status: { $first: "$payment_status" },
                        vendor_payout_status: { $first: "$vendor_payout_status" },
                        payout_transaction_id: { $first: "$payout_transaction_id" },
                        vendor_acknowladge: { $first: "$vendor_acknowladge" },
                        stripe_charge_id: { $first: "$stripe_charge_id" },
                        comment: { $first: "$comment" },
                        commission: { $first: "$commission" },
                        created_at: { $first: "$created_at" },
                    }
                },
                {
                    $group: {
                        _id: {
                            "$dateToString": {
                              "format": "%Y-%m-%d",
                              "date": { "$toDate": "$appointment_date" }
                            }
                        },
                        bookings: {
                            $push: "$$ROOT"
                        }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]
            console.log("_aggregate getBookingForCalander ----------------------------", JSON.stringify(_aggregate));
            let _bookings = await Bookings.aggregate(_aggregate).exec();
            const dateRange = getDatesInRange(fromDate, toDate);
            let _result = dateRange.map(x => {
                let _temp = _bookings.find(a => a._id == x);
                if (_temp) {
                    return {
                        _id: _temp._id,
                        bookings: _temp.bookings
                    }
                } else {
                    return {
                        _id: x,
                        bookings: []
                    }
                }
            })
            return res.status(200).send(generateAPIReponse(0,'Booking details fetched successfully', _result));
        } catch (error) {
            console.log('getBookingForCalander error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async getBookingForCalanderV2(req, res) {
        try {
            let { _id, vendor_id, fromDate, toDate, isTimeSlot } = req.body;
            let _query = {};
            if (_id) {
                if (!ObjectId.isValid(_id)) return res.status(400).send(generateAPIReponse(1,"Invalid id"));
                _query = { _id: ObjectId(_id) };
            }
            if (vendor_id) {
                _query = { ..._query, 'vendor._id': ObjectId(vendor_id) }
            }
            if (fromDate && toDate) {
                _query = { ..._query, 'appointment_date': { $gte: new Date(fromDate).toISOString(), $lte: new Date(toDate).toISOString() } }
            } else {
                const date = new Date(), y = date.getFullYear(), m = date.getMonth();
                fromDate = new Date(y, m, 1);
                toDate = new Date(y, m + 1, 1);
                _query = { ..._query, 'appointment_date': { $gte: new Date(fromDate).toISOString(), $lte: new Date(toDate).toISOString() } }
            }
            console.log("_query -----------------------------------", JSON.stringify(_query));
            let _aggregate = [
                {
                    $lookup: {
                        from: "vendors",
                        localField: "vendor",
                        foreignField: "_id",
                        as: "vendor"
                    }
                },
                {
                    $unwind: {
                        path: "$vendor",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services"
                    }
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $match: _query },
                {
                    $group: {
                        _id: "$_id",
                        booking_id: { $first: "$booking_id" },
                        booking_uuid: { $first: "$booking_uuid" },
                        appointment_date: { $first: "$appointment_date" },
                        time_slot: { $first: "$time_slot" },
                        services: { $push: "$services" },
                        vendor: { $first: "$vendor" },
                        amount: { $first: "$amount" },
                        comment: { $first: "$comment" },
                    }
                },
                {
                    $sort: { appointment_date: 1 }
                }
            ]
            console.log("_aggregate getBookingForCalander ----------------------------", JSON.stringify(_aggregate));
            let _bookings = await Bookings.aggregate(_aggregate).exec();
            let _result = _bookings.map(x => {
                let _temp = x.services && x.services.length ? x.services.map(a => a.name).join(', '): '';
                let _time = x.time_slot ? x.time_slot.split('-'): [];
                let time1 = _time.length ? _time[0].trim().toLowerCase(): '00:00 am';
                let time2 = _time.length && _time.length > 1 ? _time[1].trim().toLowerCase(): '00:00 am';
                let hour1 = 0, minute1 = 0, hour2 = 0, minute2 = 0;
                if (time1) {
                    if (time1.includes('am')) {
                        time1 = time1.replace(' ', '').replace('am', '');
                        time1 = time1.split(':')
                        hour1 = time1.length && time1[0] ? Number(time1[0]): 0;
                        minute1 = time1.length && time1.length > 1 && time1[1] ? Number(time1[1]): 0;
                    }
                    if (time1.includes('pm')) {
                        time1 = time1.replace(' ', '').replace('pm', '');
                        time1 = time1.split(':')
                        hour1 = time1.length && time1[0] ? Number(time1[0]) + 12: 0;
                        minute1 = time1.length && time1.length > 1 && time1[1] ? Number(time1[1]): 0;
                    }
                }
                if (time2) {
                    if (time2.includes('am')) {
                        time2 = time2.replace(' ', '').replace('am', '');
                        time2 = time2.split(':')
                        hour2 = time2.length && time2[0] ? Number(time2[0]): 0;
                        minute2 = time2.length && time2.length > 1 && time2[1] ? Number(time2[1]): 0;
                    }
                    if (time2.includes('pm')) {
                        time2 = time2.replace(' ', '').replace('pm', '');
                        time2 = time2.split(':')
                        hour2 = time2.length && time2[0] ? Number(time2[0]) + 12: 0;
                        minute2 = time2.length && time2.length > 1 && time2[1] ? Number(time2[1]): 0;
                    }
                }
                if (isTimeSlot) {
                    return {
                        id: x._id,
                        title: _temp,
                        start: moment(x.appointment_date).set({ hours: hour1, minutes: minute1, seconds: 0, milliseconds: 0 }).format(),
                        end: moment(x.appointment_date).set({ hours: hour2, minutes: minute2, seconds: 0, milliseconds: 0 }).format(),
                        time_slot: x.time_slot
                    }
                } else {
                    return {
                        id: x._id,
                        title: _temp,
                        start: moment(x.appointment_date).set({ hours: hour1, minutes: minute1, seconds: 0, milliseconds: 0 }).format(),
                        end: moment(x.appointment_date).set({ hours: hour2, minutes: minute2, seconds: 0, milliseconds: 0 }).format(),
                    }
                }
                
            })
            return res.status(200).send(generateAPIReponse(0,'Booking details fetched successfully', _result));
        } catch (error) {
            console.log('getBookingForCalander error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async paymentSummary(req, res){
        const { Customer_id, Vendor_id, Service_id, VendorService_id } = req.query;
        const arr = Service_id.split(',');

        const Tax_Rate = [];
        Customers.findOne({ _id: Customer_id }, getQueryProject(['full_name','billing_address'])).then(customer => {
            Vendors.findOne({ _id:Vendor_id }, getQueryProject(['street_address1', 'street_address2'])).then(vendor => {
               const vendorService =  VendorService.findOne({ _id: VendorService_id}, getQueryProject(['service','price'])).populate("service").then(vendorService => {
               const v_price = vendorService.price;
                Services.find({_id:{$in: arr}}, getQueryProject(['name','tax_rule'])).then(service => {
                        var d = Date(Date.now());
                        bookingDate = d.toString()
                       GeneralSettings.findOne().select("tax_settings").then(async (taxSettings) => {
                                TaxRule.find().populate("services").lean().then(async (taxRules) => {
                                    taxRules.forEach((taxRule) => {
                                        const newTaxRate = [];
                                        taxRule.tax_rate.forEach((it) => {
                                           
                                        const mTax = taxSettings.tax_settings.find((i) => i._id.toString() == it.toString());
                                        Tax_Rate.push(mTax.tax_rate)
                                    
                                        if (mTax !== null && mTax !== undefined) newTaxRate.push(mTax);
                                        });
                                        taxRule.tax_rate = newTaxRate;
                                    });

                                    var sum = 0;
                                    for(var i=0; i < Tax_Rate.length; i++){
                                        sum += parseInt(Tax_Rate[i]);
                                    }
                                    //console.log(sum);

                                    const order_total  = parseInt(v_price) + parseInt(sum);
                                    const tax_total = parseInt(sum);
                                    //console.log(tax_total);

                                    return res.status(200).send(generateAPIReponse(0,'Payment Summary fetched successfully', 
                                    {customer:customer, vendor:vendor, vendorService:vendorService, service:service, taxRules:taxRules, order_total:order_total, tax_total:tax_total, booking:bookingDate}));
                                })
                                })
                            })
                        })
                })
            })
    },

    async bulkDeleteBooking(req, res){
        //res.send("Booking delete");
        const id = req.params.id;
		const arr = id.split(',');

        console.log(arr)
        try{
            Bookings.updateMany({_id:{$in: arr}},{ $set: { booking_status: 3} },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Booking deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteBookingById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    async getBookingFilterList(req, res) {
        const params = req.query;
        if (params.customer == null && params.customer == undefined) {
            Bookings.find(params).then(async (bookings) => {
                const cust_id = bookings[0].customer;
                Customers.find(cust_id).then(async (customer) => {
                    try {
                        const bookings = await Bookings.find(params)
                            .populate('customers')
                        // .populate('[services]')
                        // .populate('vendors');
                        return res.status(200).send(generateAPIReponse(0,'Booking Filter list fetched successfully', { customer: customer, bookings: bookings }));
                    } catch (err) {
                        console.log('getServicesFilterList error =>', err.message);
                        return res.status(500).send(generateAPIReponse(1,err.message));
                    }
                });
            })
        }
        else {
            Customers.find({ full_name: params.customer }).then(async (customer) => {
                customer.forEach(async (id)=> {
                    const mID = id._id;
                    params._id = mID;
                   
                    try {
                        Bookings.find({ customer: params._id }).then(async (cursor) => {
                            cursor.forEach(async (customer) => {
                                var id = customer._id;
                               
                                Bookings.findOne(id).then(async (cursorr) => {
                                    cursor = cursorr;
                                });
                            })
                            console.log(cursor)
                            return res.status(200).send(generateAPIReponse(0,'Booking Filter list fetched successfully', { customer: customer, cursor: cursor }));
                        });
                    } catch (err) {
                        console.log('getServicesFilterList error =>', err.message);
                        return res.status(500).send(generateAPIReponse(1,err.message));
                    }
                })
            });
        }
    },

    async getBookingByBookingId(req, res) {
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

    async addCommentAndChangeStatus(req, res) {
        try {
            console.log('addCommentAndChangeStatus id =>', req.params.id);
            let { admin_comment, booking_status } = req.body;
            let _set = {};
            if (admin_comment) _set = { ..._set, admin_comment }
            if (booking_status) _set = { ..._set, booking_status }
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(generateAPIReponse(1,"Invalid booking id"));
            if (Object.keys(_set).length) await Bookings.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.id) }, { $set: _set }, { new: true }).lean().exec();
            return res.status(200).send(generateAPIReponse(0,'Booking updated successfully!'));
        } catch (error) {
            console.log('addCommentAndChangeStatus error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message || "Something went wrong!"));
        }
    },

    async bookingPayoutOfVendor(req, res) {
        try {
            console.log('bookingPayoutOfVendor id =>', req.params.id);
            let { vendor_payout_status, payout_transaction_id } = req.body;
            let _set = {};
            if (!payout_transaction_id) return res.status(400).send(generateAPIReponse(1,"Please add your payout transaction id!"));
            if (vendor_payout_status) _set = { ..._set, vendor_payout_status, payout_transaction_id }
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(generateAPIReponse(1,"Invalid booking id"));
            if (Object.keys(_set).length) await Bookings.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.id) }, { $set: _set }, { new: true }).lean().exec();
            return res.status(200).send(generateAPIReponse(0,'Booking payout status updated successfully!'));
        } catch (error) {
            console.log('bookingPayoutOfVendor error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message || "Something went wrong!"));
        }
    },

    async bookingPayoutAcknowladgeOfVendor(req, res) {
        try {
            console.log('bookingPayoutAcknowladgeOfVendor id =>', req.params.id);
            let { vendor_acknowladge } = req.body;
            let _set = { vendor_acknowladge };
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(generateAPIReponse(1,"Invalid booking id"));
            if (Object.keys(_set).length) await Bookings.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.params.id) }, { $set: _set }, { new: true }).lean().exec();
            return res.status(200).send(generateAPIReponse(0,(vendor_acknowladge ? 'Booking payout acknowledged successfully!': "You haven't get your payout yet!")));
        } catch (error) {
            console.log('bookingPayoutAcknowladgeOfVendor error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message || "Something went wrong!"));
        }
    },
}

function addBookingDetailsDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newBooking = new Bookings(params);
        newBooking.save().then(booking => {
            resolve(booking);
        }).catch((error) => {
            reject(error);
        });
    })
};

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
        let products = await VendorService.find({ _id: { $in: serviceIds } }).populate([
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
            let estimatedSellerTotal = total - commission;
            let _finalRes = { services: products, expenditure: { total, taxableValue, totalTax, commission, estimatedSellerTotal } }
            resolve(_finalRes)
        } else {
            resolve({ services: [], expenditure: { total: 0, taxableValue: 0, totalTax: 0, commission: 0, estimatedSellerTotal: 0 } })
        }
    })
};

function getDatesInRange(startDate, endDate) {
    const start = new Date(new Date(startDate).setUTCHours(0, 0, 0, 0));
    const end = new Date(new Date(endDate).setUTCHours(0, 0, 0, 0));
    const date = new Date(start.getTime());
    const dates = [];
    while (date <= end) {
        dates.push(dateToYMD(new Date(date)));
        date.setDate(date.getDate() + 1);
    }
    return dates;
}

function dateToYMD(date) {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}
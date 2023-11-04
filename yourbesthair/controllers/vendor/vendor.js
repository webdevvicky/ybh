const Vendors = require('../../models/vendors');
const VendorSettings = require('../../models/vendor_Settings');
const VendorVerification = require("../../models/vendorverification");
const VendorServices = require('../../models/vendor_services');
const Bookings = require('../../models/bookings');
const { generateAPIReponse } = require('../../utils/response');
const multer = require('multer');
const mongoose = require('mongoose');
const {
    getQueryProject,
    getStatusObjectWithStatusKey,
    getFilterDataListQuery,
    getSecureRandomOtp
} = require('../../utils/functions');
const {
	sendGridMail,
	sendGridMail_vendor
} = require('../email');
const { updateVendorServicesStatusByQuery } = require('../vendor_services');
const bcrypt = require('bcrypt');
const { sendVendorApprovalMail, sendVendorApprovalMailV2 } = require('./vendor_email');
const { isValidObjectId } = require('../../utils/functions');
const { searchCategoriesByName } = require('../categories');
var _ = require('lodash');
var ObjectId = require('mongodb').ObjectID;

let status = 0;

//for vendor_status update
var vendor_status = 0;
VendorSettings.find().then((vendorsettings) => {
  let approval = vendorsettings && vendorsettings.length && vendorsettings[0] && vendorsettings[0].approvals_auto_approve_vendors ? vendorsettings[0].approvals_auto_approve_vendors: 0
  vendor_status = JSON.stringify(approval);
});

module.exports = {   
    getNearByVendors(req, res) {
        const categoryId = req.query.category_id;
        const latitude = req.query.latitude;
        const longitude = req.query.longitude;
        Vendors.find({
            location: {
                $nearSphere: {
                    $geometry: { type: 'Point', coordinates: [latitude, longitude] },
                    $maxDistance: 10000
                }
            },
            category: categoryId
        }).then(vendors => {
            return res.status(200).send(generateAPIReponse(0,'Near by vendors fetched successfully', vendors));
        }).catch(err => {
            console.log('getNearByVendors error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
        });
    },

    async createVendor(req, res) {
        if (vendor_status == 1){
            const params = req.body;
        console.log('createVendor params', params);
        try {
            const isEmailExist = await Vendors.exists({ email: params.email });
            const isSlugExist = await Vendors.exists({ slug: params.slug });
            if (isEmailExist)
            return res.status(400).send({message:"The email you entered is already exist, Please try with another one.", status:400});
            if (isSlugExist)
                return res.status(409).send(generateAPIReponse(1,'The shop url you entered is already exist, Please try with another one.', {status:409}));
                params.approval_status = "1";
                params.active_status = "1";
                let otp = getSecureRandomOtp();
                params['otp'] = otp
                const vendor = await createVendorDBCall(params);
            await sendGridMail_vendor(vendor);
            params.vendor_id = req.body.vendor_id;
            return res.status(200).send(generateAPIReponse(0,"Vendor signed up successfully", vendor, 200));
            vendor_status = 0;
        } catch (error) {
            console.log('createVendor error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
        }else{
            const params = req.body;
        console.log('createVendor params', params);
        try {
            const isEmailExist = await Vendors.exists({ email: params.email });
            const isSlugExist = await Vendors.exists({ slug: params.slug });
            if (isEmailExist)
            return res.status(400).send({message:"The email you entered is already exist, Please try with another one.", status:400});
            if (isSlugExist)
            return res.status(409).send(generateAPIReponse(1,'The shop url you entered is already exist, Please try with another one.', {status:409}));
                params.approval_status = "2";
                params.active_status = "0";
                let otp = getSecureRandomOtp();
                params['otp'] = otp
                const vendor = await createVendorDBCall(params);
           
            await sendGridMail_vendor(vendor);
            params.vendor_id = req.body.vendor_id;
            return res.status(200).send(generateAPIReponse(0,"Vendor signed up successfully", vendor, 200));
            vendor_status = 0;
        } catch (error) {
            console.log('createVendor error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
        } 
    },

    async createStaff(req, res) {
        const params = req.body; 
        const _vendorid = req.user.id;
        console.log(_vendorid);
        console.log('createVendor params', params);
        try {
            const isEmailExist = await Vendors.exists({ email: params.email });
            if (isEmailExist)
            return res.status(400).send({message:"The email you entered is already exist, Please try with another one.", status:400});
                params.approval_status = "1";
                params.active_status = "1";
                params.is_email_verified="true";
                params.vendor= _vendorid;
                let otp = getSecureRandomOtp();
                params['otp'] = otp
                const vendor = await createVendorDBCall(params);

            await sendGridMail_vendor(vendor);
            params.vendor_id = req.body.vendor_id;
            return res.status(200).send(generateAPIReponse(0,"Staff signed up successfully", vendor, 200));
            vendor_status = 0;
        } catch (error) {
            console.log('createStaff error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
        
    },

    
    
    async getStaff(req, res) {

        let  vendor_id = req.params.id;          
        const stafflist = await Vendors
        .find ({vendor:vendor_id}, { first_name: 1, last_name: 1,email:1 });
        stafflength = stafflist.length;    
        console.log(stafflength) 
        if (stafflength > 0)
        {
            return res.status(200).send(generateAPIReponse(0,"Staff List", stafflist, 200));
      
        }
        else 
        {
            console.log('No Staff available ');
            return res.status(500).send(generateAPIReponse(1,"No Staff Available for this vendor"));

        }
    },

    async updateVendor(req, res) {
        const vendorId = req.user.id;
        const params = req.body;
        if (params.vendor_id) delete params.vendor_id
        if (params.active_status) delete params.active_status
        if (params.approval_status) delete params.approval_status
        if (params.created_at) delete params.created_at
        if (params.otp) delete params.otp
        if (params.status) delete params.status
        if (params.updated_at) delete params.updated_at
        console.log('updateVendor params', params);
        try {
            const _vendor = await Vendors.findOne({ _id: vendorId, approval_status: { $ne: 3 } }).lean().exec();
            const isSlugExist = await Vendors.exists({ slug: params.slug });
            const isEmailExist = await Vendors.exists({ email: params.email });
            if (isEmailExist && _vendor && _vendor.email && _vendor.email != params.email) {
                return res.status(400).send({ message: "The email you entered is already exist, Please try with another one.", status: 400 });
            }
            if (isSlugExist && _vendor && _vendor.slug && _vendor.slug != params.slug)
                return res.status(400).send(generateAPIReponse(1,'The shop url you entered is already exist, Please try with another one.', { status: 400 }));
            // let otp = getSecureRandomOtp();
            // params['otp'] = otp
            if (params.password) {
                const hashPassword = await bcrypt.hash(params.password, 10);
                params.password = hashPassword;
            }
            params.is_profile_completed = true;
            const vendor = await Vendors.findOneAndUpdate({ _id: vendorId }, { $set: params }, { new: true }).exec()
            params.vendor_id = req.body.vendor_id;
            return res.status(200).send(generateAPIReponse(0,"Vendor updated successfully", vendor, 200));
        } catch (error) {
            console.log('updateVendor error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },


    async updateStaff(req, res) {
        const vendorId = req.user.id;
        const params = req.body;
        const staffid = params.staffid;
        //console.log('logged vendor is', vendorId)
        if (params.active_status) delete params.active_status
        if (params.approval_status) delete params.approval_status
        if (params.created_at) delete params.created_at
        if (params.otp) delete params.otp
        if (params.status) delete params.status
        if (params.updated_at) delete params.updated_at
      //  console.log('updateStaff params', params);
        try {
            const staffcheck = await Vendors
            .find ({_id:staffid,vendor:vendorId})
            .countDocuments();
           // console.log(staffcheck);
            if (staffcheck == 0 ) return res.status(400).send(generateAPIReponse(1,"Staff is not belongs to this vendor"));
            const _vendor = await Vendors.findOne({ _id: staffid, vendor:vendorId, approval_status: { $ne: 3 } }).lean().exec();
            const isEmailExist = await Vendors.exists({ email: params.email });
            if (isEmailExist && _vendor && _vendor.email && _vendor.email != params.email) {
                return res.status(400).send({ message: "The email you entered is already exist, Please try with another one.", status: 400 });
            }
            // let otp = getSecureRandomOtp();
            // params['otp'] = otp
            if (params.password) {
                const hashPassword = await bcrypt.hash(params.password, 10);
                params.password = hashPassword;
            }
            params.is_profile_completed = true;
            const vendor = await Vendors.findOneAndUpdate({ _id: staffid }, { $set: params }, { new: true }).exec()
            params.vendor_id = req.body.staffid;
            return res.status(200).send(generateAPIReponse(0,"Staff updated successfully", vendor, 200));
        } catch (error) {
            console.log('Staff Update error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async deleteStaff(req, res){
        let delstaff = req.params.id
       // console.log(new Date()); 
        let { staffid } = req.body;
        console.log(staffid);
        const vendorId = req.user.id;
        let _set = {};
        if (staffid) _set = { ..._set, staffid }
        const staffnew = await Bookings.find({"staffid":delstaff,"appointment_date":{"$gte":new Date().toISOString()}},{booking_id:1,appointment_date:1});
        const staffcheck = await Vendors
            .find ({_id:staffid,vendor:vendorId})
            .countDocuments();
            console.log(staffcheck);
        if (staffcheck == 0 ) return res.status(400).send(generateAPIReponse(1,"Staff is not belongs to this vendor"));
            
        
        console.log(staffnew);  
        try{
            
        for (let item of staffnew) {
           // console.log (item._id);
            if (Object.keys(_set).length) await Bookings.findOneAndUpdate({ _id: mongoose.Types.ObjectId(item._id) }, { $set: _set }, { new: true }).lean().exec();
               
             }
             await Vendors.findOneAndUpdate({ _id: mongoose.Types.ObjectId(delstaff) }, { "active_status": 3 }, { new: true }).lean().exec();
             return res.status(200).send(generateAPIReponse(0,'Staff deleted successfully..!!'));
           
             }
             catch (error) {
                console.log('Staff Delete  error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            } 
         
            
    },

    
    uploadVendorAssets(req, res) {
        const assets = req.files;
        const vendorId = req.params.id;
        console.log('uploadVendorAssets files =>', assets, 'vendorId =>', vendorId);
        if (!assets) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            let queryToUpdate = {
                $push: {},
                $set: {}
            }
            if (assets.banners) {
                const banners = getAssetListForDB(assets.banners);
                queryToUpdate.$push['banners'] = {
                    $each: banners
                }
            }
            if (assets.works) {
                const works = getAssetListForDB(assets.works)
                queryToUpdate.$push['work_gallery'] = {
                    $each: works
                }
            }
            if (assets.documents) {
                const documents = getAssetListForDB(assets.documents)
                queryToUpdate.$push['documents'] = {
                    $each: documents
                }
            }
            if (assets.logo) {
                const logo = getAssetObjectForDB(assets.logo[0]);
                queryToUpdate.$set['logo'] = logo;
            }
            Vendors.updateOne({ _id: vendorId }, queryToUpdate, { new: true }).then(vendor => {
                return res.status(200).send(generateAPIReponse(0,'Assets uploaded successfully', vendor));
            }).catch(error => {
                console.log('uploadVendorAssets error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getVendorsStoreNameList(req, res) {
        Vendors.aggregate([{
            $project: { salon_name: { $concat: ["$salon_name", " - ", "$email"] }, slug: 1, logo: 1 }
        }]).then(vendors => {
            return res.status(200).send(generateAPIReponse(0,'Vendor list fetched successfully', vendors));
        }).catch(error => {
            console.log('getVendorsStoreNameList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async getVendorsFilterList(req, res) {
        try {
            const vendors = await Vendors.find({
                salon_name: req.query.salon_name, 
                email:req.query.email,
                categories:[req.query.categories],
                approval_status:req.query.approval_status
            })
            return res.status(200).send(generateAPIReponse(0,'Vendor Filter list fetched successfully', vendors));
          } catch (err) {
            console.log('getVendorFilterList error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
          }
    },
    async getVendorDashboard(req, res) {
        try {
            const { _id, booking_uuid, booking_id, customer_name, customer_email,   vendor_name, service_name, status, payout_status, fromDate, toDate, page, limit } = req.body;
            let  vendor_id = req.params.id;
            let _query = {};
            let _page = page ? parseInt(page): 1;
            let _limit = 5;
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
            //console.log("_query -----------------------------------", JSON.stringify(_query));

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
            //console.log("_aggregate ----------------------------", JSON.stringify(_aggregate));
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
            const vendorServicesResult = await VendorServices
            .find ({vendor:vendor_id})
            .countDocuments();

            const bookinglist = await Bookings
            .find ({vendor:vendor_id,payment_status:'1'});
            
            let _totalBooking = bookinglist.reduce((total, obj) => Number(obj.amount) + total, 0);


            //let _totalBooking = _bookings.reduce((total, obj) => Number(obj.amount) + total, 0);
            let _totalCommision = _bookings.reduce((total, obj) => Number(obj.commission) + total, 0);
            let _count = await Bookings.aggregate(_countQuery).exec(), count = 0, customerCount = 0;
            if (_count.length) count = _count[0] && _count[0].totalCount ? _count[0].totalCount: 0
            if (_customerCount.length) customerCount = _customerCount[0] && _customerCount[0].totalCount ? _customerCount[0].totalCount: 0
            return res.status(200).send(generateAPIReponse(0,'Vendor Dashboard Result', { customers: customerCount, services:vendorServicesResult,  bookings:count,  bookingamout: _totalBooking,   recentbookings: _bookings  }));
      
        } catch (error) {
            console.log('Vendor Dashboard error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },
    async getVendorDashboard1(req, res) {
        try { 
            const identifier = req.params.id;
           // console.log('getVendorDetailsBySlugOrId identifier =>', identifier);
            const matchQuery = isValidObjectId(identifier) ? ['$_id', mongoose.Types.ObjectId(identifier)] : ['$slug', identifier];
           // console.log('getVendorDetailsBySlugOrId query =>', matchQuery);
            
            const vendorServicesResult = await VendorServices
                .find ({vendor:identifier})
                .countDocuments();
            //console.log(vendorServicesResult)
            
            const bookingReult = await Bookings
                .find ({vendor:identifier})
                .countDocuments();
            //console.log(bookingReult)
           
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
            
                {
                    $group: {
                        _id: "$customer._id"
                    }
                },
                { $count: "totalCount" }
            ]).exec();
            
            _query = {  'vendor._id': ObjectId(identifier)}

            const bookingdata = await Bookings
            .find ({vendor:identifier,payment_status:'1', booking_status: '2' }).limit(5)
            .sort ({_id: -1})
             

         
            
         
            const bookinglist = await Bookings
            .find ({vendor:identifier,payment_status:'1'});
            
            let _totalBooking = bookinglist.reduce((total, obj) => Number(obj.amount) + total, 0);

             
           
            if (_customerCount.length)  customerCount = _customerCount[0] && _customerCount[0].totalCount ? _customerCount[0].totalCount: 0
           
           
            
           
           
           
            return res.status(200).send(generateAPIReponse(0,'Vendor Dashboard Result', { customers: customerCount, services: vendorServicesResult, bookings:bookingReult , bookingamount:_totalBooking, recentbookings:bookingdata}));
        }
        catch (error) {
            console.log('Vendor Dashboard Error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }    
    },    
    getVendorDetailsBySlugOrId(req, res) {
        const identifier = req.params.slug_or_id;
        console.log('getVendorDetailsBySlugOrId identifier =>', identifier);
        const matchQuery = isValidObjectId(identifier) ? ['$_id', mongoose.Types.ObjectId(identifier)] : ['$slug', identifier];
        console.log('getVendorDetailsBySlugOrId query =>', matchQuery);
        Vendors.aggregate([{
                $match: {
                    "$expr": { "$eq": matchQuery }
                }
            },
            {
                $lookup: {
                    from: "vendor_services",
                    let: { "vendorId": "$_id" },
                    as: "services",
                    pipeline: [{
                            $match: {
                                "$expr": { "$eq": ["$vendor", "$$vendorId"] }
                            }
                        },
                        {
                            $lookup: {
                                from: "service_categories",
                                let: { "serviceCategoryId": "$category" },
                                as: "label",
                                pipeline: [{
                                        $match: {
                                            "$expr": { "$eq": ["$_id", "$$serviceCategoryId"] },

                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            name: 1,
                                        }
                                    },
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "services",
                                let: { "serviceId": "$service" },
                                pipeline: [{
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
                            $lookup: {
                                from: "vendor_services",
                                let: { "vendorId": "$_id" },
                                pipeline: [{
                                        $match: {
                                            "$expr": { "$eq": ["$_id", "$$vendorId"] }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1
                                        }
                                    },
                                ],
                                as: "vendor_services"
                            }
                        },
                        {
                            "$addFields": {
                                "label": { $arrayElemAt: ["$label", 0] },
                            }
                        },
                        {
                            "$addFields": {
                                "vendor_services": { $arrayElemAt: ["$vendor_services", 0] },
                            }
                        },
                        {
                            $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$services", 0] }, "$$ROOT"] } }
                        },
                        { $unwind: "$services" },
                        { $project: { services: 0, vendor: 0, created_at: 0, updated_at: 0, __v: 0, _id: 0 } },
                    ]
                }
            },
            {
                $lookup: {
                    from: "reviews",
                    let: { "vendorId": "$_id" },
                    as: "reviews",
                    pipeline: [{
                            $match: {
                                $and: [
                                    { "$expr": { "$eq": ["$reviewee", "$$vendorId"] }, },
                                    { "$expr": { "$eq": ["$active_status", "1"] } },
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "customers",
                                let: { "reviewerId": "$reviewer" },
                                as: "reviewer",
                                pipeline: [{
                                        $match: {
                                            "$expr": { "$eq": ["$_id", "$$reviewerId"] }
                                        }
                                    },
                                    {
                                        $project: {
                                            // _id: 0,
                                            first_name: 1,
                                            last_name: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $group: {
                                _id: { post: "$reviewee", rating: "$ratings" },
                                count: { $sum: 1 },
                                reviews: { $push: "$$ROOT" },
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.post",
                                counts: { $push: { rating: "$_id.rating", count: "$count" } },
                                reviews: { $push: "$reviews" },
                                avgRating: {
                                    $avg: "$_id.rating"
                                },
                            }
                        },
                        {
                            $project: {
                                _id: "$_id",
                                avg_rating: "$avgRating",
                                // avg_rating: { $round: ["$avgRating", 1] },
                                counts: "$counts",
                                review_list: {
                                    $reduce: {
                                        input: "$reviews",
                                        initialValue: [],
                                        in: { $concatArrays: ["$$value", "$$this"] }
                                    }
                                },
                            }
                        },
                    ]
                }
            },
            {
                $unwind: {
                    path: "$reviews",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]).then(vendor => {
            if (vendor.length == 0) {
                return res.status(404).send(generateAPIReponse(1,'No vendor found'));
            } else {
                if (vendor[0].reviews) {
                    vendor[0].reviews.avg_rating = _.round(vendor[0].reviews.avg_rating, 1)
                }
                return res.status(200).send(generateAPIReponse(0,'Vendor details fetcheddd successfully', vendor[0]));
            }
        }).catch(error => {
            console.log('getVendorDetailsBySlugOrId error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    // async putVendorStatus(req, res){
    //         const id = req.query.id;
    //         Vendors.findOne({_id:id}).then(vendors=>{
    //             vendors.is_email_verified = "true";
    //             vendors.save().then(updateVendor=>{
    //                 return res.status(200).send(generateAPIReponse(0,'Your Account Has Been Approved and Activated..!!'));
    //             }).catch(error => {
    //                 console.log('updateVendorStatus error =>', error.message);
    //                 return res.status(500).send(generateAPIReponse(1,error.message));
    //             })       
    //     });
    // },

    async putVendorStatus(req, res){
       
       const vendorID = req.params.vendorID;
       const uniqueString = req.params.uniqueString;

       Vendors.find({_id : vendorID})
        .then((result)=>{

            if (result.length > 0){
                        Vendors.updateOne({_id:vendorID}, {is_email_verified : true})
                        .then(()=>{

                           res.redirect('https://vendor-bookingdemo.zielcommerce.in/');

                        })
                        .catch(error => {
                            console.log("Update Error")
                        })
            }else{

                console.log("error is here");
            }
        })
        .catch((error)=>{
            console.log("Error here")
        })
    },

    async bulkDeleteVendor(req, res){
        //res.send("vendor delete");
        const id = req.params.id;
        const arr = id.split(',');
        try{
            Vendors.updateMany({_id:{$in: arr}},{ $set: { approval_status: "3", active_status: "3"} },{ returnOriginal: false },
                    function (vendors) {
                        return res.status(200).send(generateAPIReponse(0,'Vendor deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteVendorById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    // async storeVendorSetting(req,res){
    //     const newVendorSettings = new VendorSettings({
    //         vendor_setting_id: req.body.vendor_setting_id,
    //         selected_vendor: req.body.selected_vendor,
    //         commission_value: req.body.commission_value,
    //         approvals_auto_approve_vendors: req.body.approvals_auto_approve_vendors,
    //         approvals_auto_approve_services: req.body.approvals_auto_approve_services,
    //         payout_auto_approve_vendors: req.body.payout_auto_approve_vendors,
    //         payout_auto_approve_services: req.body.payout_auto_approve_services
    //       });
    //       newVendorSettings.save().then(savedVendorSettings => {
    //           res.send('Vendor Settings was stored successfully');
    //           return res.status(200).send(generateAPIReponse(0,'Vendor Settings was stored successfully..!!'));
    //         }).catch(error => {
    //             console.log('storeVendorSetting error =>', error.message);
    //             return res.status(500).send(generateAPIReponse(1,error.message));
    //         });
    // },

    async storeVendorSetting(req, res) {
        const params = req.body;
        console.log('createVendorSetting params', params);
        try {
            const vendorSetting = await module.exports.createVendorSettingDbCall(params);
            return res.status(200).send(generateAPIReponse(0,'Vendor Setting created successfully', vendorSetting));
        } catch (error) {
            console.log('createvendorSetting error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    updateVendorSetting(req, res){
        const id = req.query.id;
        const selected_vendor = req.body.selected_vendor;
        const commission_value = req.body.commission_value;
        const approvals_auto_approve_vendors = req.body.approvals_auto_approve_vendors;
        const approvals_auto_approve_services = req.body.approvals_auto_approve_services;
        const payout_auto_approve_vendors = req.body.payout_auto_approve_vendors;
        const payout_auto_approve_services = req.body.payout_auto_approve_services;
        VendorSettings.findOneAndUpdate({id:id}).then(vendorsettings=>{
            vendorsettings.selected_vendor = selected_vendor;
            vendorsettings.commission_value = commission_value;
            vendorsettings.approvals_auto_approve_vendors = approvals_auto_approve_vendors;
            vendorsettings.approvals_auto_approve_services = approvals_auto_approve_services;
            vendorsettings.payout_auto_approve_vendors = payout_auto_approve_vendors;
            vendorsettings.payout_auto_approve_services = payout_auto_approve_services;
            vendorsettings.save().then(updateVendorSettings=>{
                return res.status(200).send(generateAPIReponse(0,'Vendor Settings was updated successfully..!!'));
            }).catch(error => {
                console.log('updateVendorSetting error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })       
        });
    },

      getVendorSetting(req, res) {
        VendorSettings.find().then(vendorSettings => {
            return res.status(200).send(generateAPIReponse(0,'Vendor settings fetched successfully', vendorSettings));
        }).catch(error => {
            console.log('getVendorSettingList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },


    async getVendorList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if(isNaN(page) && isNaN(limit)){
            Vendors.find().then((vendor) => {
                return res.status(200).send(generateAPIReponse(0,'Vendor details fetched successfully', vendor));
            }).catch(error => {
                console.log('getVendorDetails error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            const filterQuery = queryParams ? getFilterDataListQuery(queryParams) : { "active_status": { $ne: "3" } }
            if (queryParams.category) {
                const ids = await getCategoryIdsByMatchedName(queryParams.category);
                if (ids.length > 0) {
                    filterQuery['categories'] = {
                        "$in": [ids]
                    }
                }
            }
            Vendors.aggregate([{
                $match: filterQuery
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories'
                }
            },
            { $sort: { created_at: -1 } },
            {
                $project: {'salon_name':1, 'logo':1, 'email':1, 'active_status':1, 'approval_status':1,
                'street_address2':1, 'city':1, 'state':1, 'country':1,
                'phone_number.international_number':1, 'full_name':1,
                'created_at':1, 'formatted_address':1, 'slug':1, 'categories':1, 'is_email_verified':1, 'vendor_uuid':1 }
            },
            { '$facet'    : {
                metadata: [ { $count: "total" } ],
                data: [ { $skip: skip }, { $limit: limit }]  // add projection here wish you re-shape the docs
            } }
        ]).then(vendors => {
                return res.status(200).send(generateAPIReponse(0,'Vendor list fetched successfully', vendors));
            }).catch(error => {
                console.log('getVendorList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async updateVendorById(req, res) {
        const id = req.params.id;
        const params = req.body;
        console.log('updateVendorById id =>', id, 'params =>', params);
        if (params.slug) {
            const isSlugExist = await isVendorSlugExist(params.slug, id);
            if (isSlugExist)
                return res.status(409).send({ message: 'The shop url you entered is already exist, Please try with another one.' });
        }
        Vendors.findByIdAndUpdate(id, params, { new: true }).then(vendor => {
            return res.status(200).send(generateAPIReponse(0,'Vendor updated successfully', vendor));
        }).catch(error => {
            console.log('updateVendorById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async deleteVendorById(req, res) {
        const id = req.params.id;
        console.log('deleteVendorById id =>', id);
        const status = {
            active_status: "3"
        }
        try {
            await updateVendorServicesStatusByQuery({ vendor: id }, status);
            await updateVendorDetailsById(id, status);
            return res.status(200).send(generateAPIReponse(0,'Vendor deleted successfully'));
        } catch (error) {
            console.log('deleteVendorById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getMyProfileDetails(req, res) {
        console.log('getMyProfileDetails id=>', req.user.id);
        Vendors.findOne({ _id: req.user.id }).then(vendor => {
            return res.status(200).send(generateAPIReponse(0,'Vendor Profile details retrieved successfully', vendor));
        }).catch(error => {
            console.log('getMyProfileDetails error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async updatePassword(req, res) {
        console.log('updatePassword params =>', req.body);
        const { new_password, confirm_password, current_password } = req.body;
        if (new_password !== confirm_password)
            return res.status(401).send(generateAPIReponse(1,'New password and confirm password does not match'));
        const vendor = await Vendors.findOne({ _id: req.user.id });
        const isPasswordValid = await vendor.isValidPassword(current_password);
        if (!isPasswordValid)
            return res.status(401).send(generateAPIReponse(1,'Your current password is invalid'));
        const hashPassword = await bcrypt.hash(new_password, 10);
        try {
            await updateVendorDetailsById(req.user.id, { password: hashPassword });
            return res.status(200).send(generateAPIReponse(0,'Password Changed Successfully'));
        } catch (error) {
            console.log('updatePassword error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async updateEmail(req, res) {
        console.log('updateEmail params =>', req.body);
        const { new_email, confirm_email, current_password } = req.body;
        if (new_email !== confirm_email)
            return res.status(401).send(generateAPIReponse(1,'New email and confirm email does not match'));
        const vendor = await Vendors.findOne({ _id: req.user.id });
        const isPasswordValid = await vendor.isValidPassword(current_password);
        if (!isPasswordValid)
            return res.status(401).send(generateAPIReponse(1,'Your current password is invalid'));
        try {
            await updateVendorDetailsById(req.user.id, { email: new_email });
            return res.status(200).send(generateAPIReponse(0,'Email Changed Successfully'));
        } catch (error) {
            console.log('updateEmail error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    approveVendorById(req, res) {
        const id = req.params.id;
        const params = req.body;
        console.log('approveVendorById id =>', id, 'params =>', params);
        // const status = getStatusObjectWithStatusKey(1);
        Vendors.findByIdAndUpdate(id, params, { new: true }).then(async(vendor) => {
            try {
                
                await sendVendorApprovalMailV2(vendor, params?.approval_status);
                return res.status(200).send(generateAPIReponse(0,params?.approval_status ? 'Vendor Approved Successfully': 'Vendor Rejected Successfully', vendor));
            } catch (error) {
                return res.status(500).send(generateAPIReponse(1,`Sending approval email error: ${error.message}`));
            }
        }).catch(error => {
            console.log('approveVendorById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getVendorsBasedOnCategories(req, res) {
        console.log('getVendorsBasedOnCategories params =>', req.body);
        const categories = req.body.categories;
        const categoriesIds = categories.map(category => { return mongoose.Types.ObjectId(category) })
        const subCategories = req.body.sub_categories;
        const subCategoriesIds = subCategories.map(subCategory => { return mongoose.Types.ObjectId(subCategory) })
        Vendors.aggregate([{
                $match: {
                    "$and": [{
                            "$or": [{
                                    "categories": {
                                        "$in": categoriesIds
                                    }
                                },
                                {
                                    "sub_categories": {
                                        "$in": subCategoriesIds
                                    }
                                }
                            ]
                        },
                        {
                            "is_email_verified": true
                        },
                        {
                            "active_status": "1"
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "vendor_services",
                    let: { "vendorId": "$_id" },
                    as: "services",
                    pipeline: [{
                            $match: {
                                "$expr": { "$eq": ["$vendor", "$$vendorId"] }
                            }
                        },
                        {
                            $lookup: {
                                from: "services",
                                let: { "serviceId": "$service" },
                                pipeline: [{
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
                            $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$services", 0] }, "$$ROOT"] } }
                        },
                        { $unwind: "$services" },
                        { $project: { services: 0, vendor: 0, created_at: 0, updated_at: 0, __v: 0, _id: 0 } },
                    ]
                }
            },
            {
                "$project": {
                    email_verification_token: 0,
                    is_email_verified: 0,
                    password: 0,
                    __v: 0
                }
            }
        ]).then(vendors => {
            return res.status(200).send(generateAPIReponse(0,'Vendor retrieved successfully', vendors));
        }).catch(error => {
            console.log('getVendorsBasedOnCategories error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async generateVendorSlug(req, res) {
        const params = req.body
        console.log('generateVendorSlug params =>', params);
        try {
            if (params.title) {
                let slug = params.title.replace(/\s/g, "-").toLowerCase();
                const isSlugExist = await Vendors.exists({ slug: slug });
                if (isSlugExist) {
                    let numericPrefix = 1;
                    while (1) {
                        const newSlug = (`${slug}-${numericPrefix++}`).toLowerCase(); //new Slug with incremented Slug Numerical Prefix
                        const isNewSlugExist = await Vendors.exists({ slug: newSlug }); //Check if already exists in DB
                        //This returns true if exists.
                        if (!isNewSlugExist) {
                            //There is no more coincidence. Finally found unique slug.
                            slug = newSlug; //New Slug 
                            break; //Break Loop
                        }
                    }
                } else {
                    console.log('slug =>', slug);
                    return res.status(200).send(generateAPIReponse(0,'Vendor slug generated successfully', { slug: slug }));
                }
                console.log('slug =>', slug);
                return res.status(200).send(generateAPIReponse(0,'Vendor slug generated successfully', { slug: slug }));
            } else {
                return res.status(400).send(generateAPIReponse(1,'Please provide title'));
            }
        } catch (error) {
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getVendorById(req, res) {
        const vendorId = req.params.vendorId;
        console.log('getVendorDetailsById CustomerId =>', vendorId);
        Vendors.findOne({ _id: ObjectId(vendorId) }).then(async(vendor) => {
            let result = vendor;
            return res.status(200).send(generateAPIReponse(0,'Vendor details by Id fetched successfully', result));
        }).catch(error => {
            console.log('getCustomerDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },



    createVendorSettingDbCall(params) {
        return new Promise(async(resolve, reject) => {
            const newVendorSettings = new VendorSettings(params);
            newVendorSettings.save().then(vendorSetting => {
                resolve(vendorSetting);
            }).catch((error) => {
                reject(error);
            });
        })
    }
};

function isVendorSlugExist(slug, id) {
    return new Promise(async(resolve, reject) => {
        const vendor = await Vendors.findOne({ slug: slug });
        let isSlugExist = false
        if (vendor) {
            isSlugExist = vendor._id == id ? false : true;
        }
        resolve(isSlugExist);
    })
}

function updateVendorDetailsById(id, data) {
    return new Promise((resolve, reject) => {
        Vendors.findByIdAndUpdate(id, data).then(result => {
            resolve();
        }).catch(error => {
            reject(error);
        })
    })
}

function createVendorDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newVendor = new Vendors(params);
        newVendor.save()
            .then(async(vendor) => {
                resolve(vendor);
            })
            .catch((error) => {
                reject(error)
            });
    })
}

const vendorStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "logo") {
            cb(null, 'uploads/logo');
        } else if (file.fieldname === "banners") {
            cb(null, 'uploads/banners');
        } else if (file.fieldname === "works") {
            cb(null, 'uploads/works');
        } else if (file.fieldname === "documents") {
            cb(null, 'uploads/documents');
        }
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
})

module.exports.uploadVendorConfig = multer({ storage: vendorStorage });

function getAssetListForDB(assets) {
    const assestList = [];
    let assestObject = {};
    assets.forEach(item => {
        assestObject = getAssetObjectForDB(item);
        assestList.push(assestObject);
    })
    return assestList;
}

function getAssetObjectForDB(item) {
    return {
        url: `${item.path}`,
        file_name: item.filename
    }
}

function getCategoryIdsByMatchedName(categoryName) {
    return new Promise(async(resolve, reject) => {
        const matchedCategories = await searchCategoriesByName(categoryName);
        if (matchedCategories.length > 0) {
            const categoryIds = matchedCategories.map(item => {
                return item._id;
            })
            resolve(categoryIds);
        } else {
            resolve([]);
        }
    })
}
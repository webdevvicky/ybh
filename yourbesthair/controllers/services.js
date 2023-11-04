const Services = require('../models/services');
const VendorServices = require('../models/vendor_services');
const TaxRule = require('../models/tax_rules');
const { generateAPIReponse } = require('../utils/response');
const { getQueryProject, getStatusObject, getFilterDataListQuery } = require('../utils/functions');
const Vendors = require('../models/vendors');
const multer = require('multer');
const { updateVendorServicesStatusByQuery } = require('../controllers/vendor_services');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    async createService(req, res) {
        const params = req.body;
        console.log('createService params', params);
        if (req.user.role == 'admin') {
            params.status = req.body.status;
        }
        try {
            const service = await module.exports.createServiceDbCall(params, req.user.id);
            return res.status(200).send(generateAPIReponse(0,'Service created successfully', service));
        } catch (error) {
            console.log('createService error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    createServiceDbCall(params, userId) {
        return new Promise(async(resolve, reject) => {
            if (!params.name) {
                params['name'] = params.service;
            }
            const isServiceExist = await Services.exists({ "name": new RegExp(`^${params.name}$`, 'i'), active_status: { $ne: "3" } })
            if (isServiceExist)
                return reject({ resCode: 409, message: 'This service already exist!' })
            params.created_by = userId;
            delete params.service;
            const newService = new Services(params);
            newService.save().then(service => {
                resolve(service);
            }).catch((error) => {
                reject(error);
            });
        })
    },

    getServicesNameList(req, res) {
        Services.find({}, getQueryProject([
            'name',
        ])).sort({ created_at: -1 }).then(services => {
            return res.status(200).send(generateAPIReponse(0,'Service list fetched successfully', services));
        }).catch(error => {
            console.log('getServicesNameList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getAssignServiceToVendor(req,res){
        //res.send("get assign service");
        VendorServices.find()
        .populate('tax_rule')
        .then(async(vendorServices) => {
            return res.status(200).send(generateAPIReponse(0,'Assign Services fetched successfully', vendorServices));
        }).catch(error => {
            console.log('getvendorServicesList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        });
    },

    assignServiceToVendor(req, res) {
        const params = req.body;
        console.log('assignServiceToVendor params', params);
        VendorServices.insertMany(params).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Services Assigned successfully'));
        }).catch((error) => {
            console.log('assignServiceToVendor error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        });
    },

    searchService(req, res) {
        console.log('search params', req.query);
        const { lat, lng, text, limit, page } = req.query;
        const skips = Number(limit) * Number(page);
        Vendors.aggregate([{
                $geoNear: {
                    near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    distanceField: "distance",
                    maxDistance: 1000000,
                    includeLocs: "location",
                    spherical: true
                }
            },
            {
                $match: {
                    "active_status": "1"
                }
            },
            {
                $lookup: {
                    from: "vendor_services",
                    let: { "vendorId": "$_id" },
                    as: "vendor_services",
                    pipeline: [{
                            $match: {
                                $and: [
                                    { "$expr": { "$eq": ["$vendor", "$$vendorId"] } },
                                    { "active_status": { "$ne": "3" } }
                                ]
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
                                            "$expr": { "$eq": ["$_id", "$$serviceId"] },
                                            "name": { "$regex": `.*${text}.*`, "$options": "i" }
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
                        { $limit: 3 },
                        {
                            "$addFields": {
                                "label": { $arrayElemAt: ["$label", 0] },
                            }
                        },
                        {
                            $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$services", 0] }, "$$ROOT"] } }
                        },
                        { $unwind: "$services" },
                        { $project: { services: 0, vendor: 0, created_at: 0, updated_at: 0, __v: 0, _id: 0 } },
                        {
                            $group: {
                                _id: "$vendor",
                                services: { $push: "$$ROOT" }
                            }
                        },
                    ]
                }
            },
            { $unwind: "$vendor_services" },
            {
                "$addFields": {
                    "services": "$vendor_services.services"
                }
            },
            { $project: { password: 0, __v: 0, vendor_services: 0, email_verification_token: 0 } },
            {
                $facet: {
                    paginated_result: [{ $skip: skips }, { $limit: Number(limit) }],
                    total_count: [{
                        $count: 'count'
                    }]
                }
            }
        ]).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Service list fetched successfully', result[0]));
        }).catch(error => {
            console.log('error', error.message);
        })
    },

    getServiceList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if(isNaN(page) && isNaN(limit)){
            Services.find().then(async(service) => {
                let result = service;
                return res.status(200).send(generateAPIReponse(0,'Service details by Id fetched successfully', result));
            }).catch(error => {
                console.log('getServiceDetailsById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            const filterQuery = queryParams ? getFilterDataListQuery(queryParams) : { "$expr": { "$ne": ["$active_status", "3"] } }
        console.log('filterQuery', filterQuery);
        Services.aggregate([{
                $match: filterQuery
            },
            {
                $lookup: {
                    from: 'vendor_services',
                    as: 'vendor_services',
                    let: { "serviceId": "$_id" },
                    pipeline: [{
                        $match: {
                            $and: [
                                { "$expr": { "$eq": ["$service", "$$serviceId"] } },
                                { "active_status": { "$ne": "3" } }
                            ]
                        }
                    }]
                }
            },
            { $sort: { created_at: -1 } },
            {
                "$addFields": {
                    "no_of_providers": { $size: "$vendor_services" }
                }
            },
            {
                $project: { vendor_services: 0 }
            },
            { '$facet'    : {
                metadata: [ { $count: "total" }, { $addFields: { page: Number(page) } } ],
                data: [ { $skip: skip }, { $limit: limit } ]
            } }
        ]).then(services => {
            return res.status(200).send(generateAPIReponse(0,'Service list fetched successfully', services));
        }).catch(error => {
            console.log('getServiceList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
        }
    },

    async bulkDeleteService(req, res) {
        //res.send("Service delete");
        let { ids } = req.body
        try {
            let serviceLevelId = ids.length ? ids.map(x => ObjectId(x)) : [];
            await Services.updateMany({ _id: { $in: serviceLevelId } }, { $set: { approval_status: "3", active_status: "3" } }).exec();
            return res.status(200).send(generateAPIReponse(0,'Service deleted successfully..!!'));
        } catch (error) {
            console.log('bulkDeleteServiceById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async getServiceFilterList(req, res) {
        //res.send("Service Filter List");
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

        if(params.name ==null && params.name == undefined){
            delete params.name;
        }

        if(params.from_date !== null){
            delete params.from_date;
        }

        if(params.to_date !== null ){
            delete params.to_date;
        }

        try {
            const services = await Services.find(params).where({created_at: {$gte: new Date(from_date).toISOString(), $lt : new Date(to_date).toISOString() }});
            return res.status(200).send(generateAPIReponse(0,'Services Filter list fetched successfully', services));
          } catch (err) {
            console.log('getServiceFilterList error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
          }
    },

    updateServiceById(req, res) {
       
        const id = req.params.id;
        const params = req.body;
     
        console.log('updateServiceById id =>', id, 'params =>', params);
        Services.findByIdAndUpdate(id, params, { new: true }).then(service => {
            return res.status(200).send(generateAPIReponse(0,'Service updated successfully', service));
        }).catch(error => {
            console.log('updateServiceById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    uploadServiceImage(req, res) {
        const file = req.file;
        const serviceId = req.params.id;
        console.log('uploadServiceImage file =>', file, 'serviceId =>', serviceId);
        if (!file) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            const dataToUpdate = {
                service_image: {
                    url: `${file.path}`,
                    file_name: file.filename
                }
            }
            Services.findByIdAndUpdate(serviceId, dataToUpdate, { new: true }).then(service => {
                return res.status(200).send(generateAPIReponse(0,'Service Image uploaded successfully', service));
            }).catch(error => {
                console.log('uploadServiceImage error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async deleteServiceById(req, res) {
        const id = req.params.id;
        console.log('deleteServiceById id =>', id);
        const status = {
            active_status: "3"
        }
        try {
            await updateVendorServicesStatusByQuery({ service: id }, status);
            await updateServiceStatus(id, status);
            return res.status(200).send(generateAPIReponse(0,'Service deleted successfully'));
        } catch (error) {
            console.log('deleteServiceById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async getServiceById(req, res) {
        try {
            const serviceId = req.params.serviceId;
            console.log('getServiceDetailsById serviceId =>', serviceId);
            let result = await Services.findOne({ _id: ObjectId(serviceId) }).lean().exec();
            return res.status(200).send(generateAPIReponse(0,'Service details by Id fetched successfully', result));
        } catch (error) {
            console.log('getServiceDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },
    async getServiceByServiceId(req, res) {
        try {
            const serviceId = req.params.serviceId;
            console.log('getServiceDetailsById serviceId =>', serviceId);
            let result = await Services.findOne({ _id: ObjectId(serviceId) }).populate('tax_rule').lean().exec();
            return res.status(200).send(generateAPIReponse(0,'Service details by Id fetched successfully', result));
        } catch (error) {
            console.log('getServiceDetailsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
}

const serviceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/service');
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
})

function updateServiceStatus(id, status) {
    return new Promise((resolve, reject) => {
        Services.findByIdAndUpdate(id, status).then(result => {
            resolve();
        }).catch(error => {
            reject(error);
        })
    })
}

module.exports.uploadServiceConfig = multer({ storage: serviceStorage });
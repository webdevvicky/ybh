
const VendorServices = require('../../models/vendor_services');
const { createServiceDbCall } = require('../../controllers/services');
const { getStatusObject, getStatusObjectWithStatusKey } = require('../../utils/functions');
const { generateAPIReponse } = require('../../utils/response');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {
    getVendorServices(req, res) {
        console.log('getVendorServices for =>', req.user.id);
        let { status } = req.query;
        let _query = {
            $and: [
                { vendor: mongoose.Types.ObjectId(req.user.id) },
                { "active_status": { "$ne": "3" } }
            ]
        }
        if (['0', '1', '2', '3'].includes(status)) {
            _query = {
                $and: [
                    { vendor: mongoose.Types.ObjectId(req.user.id) },
                    { "active_status": status }
                ]
            }
        }
        VendorServices.aggregate([
            {
                $match: _query
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'vendor_service'
                }
            },
            {
                $lookup: {
                    from: 'service_categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'service_category'
                }
            },
            { $sort: { created_at: -1 } },
            {
                "$addFields": {
                    "service._id": { $arrayElemAt: ["$vendor_service._id", 0] },
                    "service.name": { $arrayElemAt: ["$vendor_service.name", 0] },
                    "service_image": { $arrayElemAt: ["$vendor_service.service_image", 0] },
                    "category._id": { $arrayElemAt: ["$service_category._id", 0] },
                    "category.name": { $arrayElemAt: ["$service_category.name", 0] }
                }
            },
            {
                $project: {
                    vendor_service: 0, __v: 0, service_category: 0
                }
            }
        ]).then(services => {
            return res.status(200).send(generateAPIReponse(0,'Vendor Service list retrieved successfully', services));
        }).catch(error => {
            console.log('getVendorServices error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getVendorServiceById(req, res) {
        console.log('getVendorServiceById for =>', req.user.id);
        let { id } = req.params;
        let _query = {
            $and: [
                { vendor: mongoose.Types.ObjectId(req.user.id) },
                { "active_status": { "$ne": "3" } },
                { _id: mongoose.Types.ObjectId(id) }
            ]
        }
        VendorServices.aggregate([
            {
                $match: _query
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'vendor_service'
                }
            },
            {
                $lookup: {
                    from: 'service_categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'service_category'
                }
            },
            { $sort: { created_at: -1 } },
            {
                "$addFields": {
                    "service._id": { $arrayElemAt: ["$vendor_service._id", 0] },
                    "service.name": { $arrayElemAt: ["$vendor_service.name", 0] },
                    "service_image": { $arrayElemAt: ["$vendor_service.service_image", 0] },
                    "category._id": { $arrayElemAt: ["$service_category._id", 0] },
                    "category.name": { $arrayElemAt: ["$service_category.name", 0] }
                }
            },
            {
                $project: {
                    vendor_service: 0, __v: 0, service_category: 0
                }
            }
        ]).then(services => {
            let _service = (services && services.length) ? services[0]: null
            return res.status(200).send(generateAPIReponse(0,'Vendor Service list retrieved successfully', _service));
        }).catch(error => {
            console.log('getVendorServiceById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async createServiceByVendor(req, res) {
        const params = req.body;
        const _vendorId = req.user.id;
        console.log('createServiceByVendor params', params);
        try {
            if (params.service && ObjectId.isValid(params.service)) {
                let _checkService = await VendorServices.findOne({ vendor: ObjectId(_vendorId), service: ObjectId(params.service) }).lean().exec();
                if (_checkService) {
                    return res.status(400).send(generateAPIReponse(1,"You have alredy created this service!"));
                }
            }
            if (params.service && !ObjectId.isValid(params.service)) {
                const service = await createServiceDbCall(params, _vendorId);
                params.service = service._id;
            }
            params.vendor = _vendorId;
            await createVendorServiceDbCall(params);
            return res.status(200).send(generateAPIReponse(0,'Service created successfully', params.service));
        } catch (error) {
            console.log('createServiceByVendor error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    updateVendorServiceById(req, res) {
        const id = req.params.id;
        const params = req.body;
        console.log('updateVendorServiceById id =>', id, 'params =>', params);
        VendorServices.findByIdAndUpdate(id, params, { new: true }).then(service => {
            return res.status(200).send(generateAPIReponse(0,'Service updated successfully', service));
        }).catch(error => {
            console.log('updateVendorServiceById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async deleteVendorServiceById(req, res) {
        const id = req.params.id;
        console.log('deleteVendorServiceById id =>', id);
        const status = getStatusObjectWithStatusKey(3);
        VendorServices.updateOne({ _id: id }, status).then(service => {
            return res.status(200).send(generateAPIReponse(0,'Service deleted successfully'));
        }).catch(error => {
            console.log('deleteVendorServiceById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async bulkDeleteVendorService(req, res) {
        try {
            let { ids } = req.body;
            ids = ids.length ? ids.map(x => ObjectId(x)): []
            await VendorServices.updateMany({ _id: { $in: ids }}, { $set: { active_status: 3 }}).exec();
            return res.status(200).send(generateAPIReponse(0,'Service deleted successfully'));
        } catch (error) {
            console.log('bulkDeleteVendorService error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
}

function createVendorServiceDbCall(params) {
    console.log('createVendorServiceDbCall');
    return new Promise((resolve, reject) => {
        params.status = getStatusObject('pending_admin_approval', 2);
        const newVendorService = new VendorServices(params);
        newVendorService.save(params).then(vendorService => {
            resolve(vendorService)
        }).catch((error) => {
            console.log('createVendorServiceDbCall error =>', error);
            reject(error)
        });
    })
}
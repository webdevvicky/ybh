const ServiceCategories = require('../models/service_categories');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { generateAPIReponse } = require('../utils/response');
const VendorServices = require('../models/vendor_services');
const { getStatusObjectWithStatusKey } = require('../utils/functions');
const { updateVendorServicesStatusByQuery } = require('../controllers/vendor_services');
module.exports = {

    async createServiceCategory(req, res) {
        const params = req.body;
        console.log('createServiceCategory params', params);
        try {
            const serviceCategory = await createServiceCategoryDBCall(params, req.user.id);
            return res.status(200).send(generateAPIReponse(0,'Service label created successfully', serviceCategory));
        } catch (error) {
            console.log('createServiceCategory error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    updateServiceCategoryById(req, res) {
        const id = req.params.id;
        const params = req.body;
        console.log('updateServiceCategoryById id =>', id, 'params =>', params);
        ServiceCategories.findByIdAndUpdate(id, params, { new: true }).then(serviceCategory => {
            return res.status(200).send(generateAPIReponse(0,'Service category updated successfully', serviceCategory));
        }).catch(error => {
            console.log('updateServiceCategoryById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async bulkDeleteServiceCategory(req, res) {
        //res.send("Service Category delete");
        const { ids } = req.body;
        let serviceLevelId = ids.length ? ids.map(x => ObjectId(x)): [];
        try {
            await ServiceCategories.updateMany({ _id: { $in: serviceLevelId } }, { $set: { active_status: "3" } }).exec();
            return res.status(200).send(generateAPIReponse(0,'Service Category deleted successfully..!!'));
        } catch (error) {
            console.log('bulkDeleteServiceCategoryById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async deleteServiceCategoryById(req, res) {
        const id = req.params.id;
        console.log('deleteServiceCategoryById id =>', id);
        const status = getStatusObjectWithStatusKey(3);
        try {
            await updateVendorServicesStatusByQuery({ category: id }, { category: null });
            await updateServiceCategoryStatus(id, status);
            return res.status(200).send(generateAPIReponse(0,'Service category deleted successfully'));
        } catch (error) {
            console.log('deleteServiceCategoryById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },
    
    async getServiceCategoryById(req, res) {
        try {
            let { id } = req.params;
            let _category = await ServiceCategories.findOne({_id: ObjectId(id) }).exec();
            return res.status(200).send(generateAPIReponse(0,'Service category sent successfully', _category));
        } catch (error) {
            console.log('getServiceCategoryById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
}

function createServiceCategoryDBCall(params, userId) {
    return new Promise(async (resolve, reject) => {
        const isServiceCategoryExist = await ServiceCategories.exists(
            {
                $and: [
                    { "created_by": userId },
                    { "name": new RegExp(`^${params.name}$`, 'i') },
                    { "active_status": { $ne: "3" }}
                ]
            })
        if (isServiceCategoryExist)
            return reject({ resCode: 409, message: 'This label already exist!' })
        params.created_by = userId;
        const newCategory = new ServiceCategories(params);
        newCategory.save().then(result => {
            resolve(result);
        }).catch(error => {
            reject(error);
        })
    })
}

function updateServiceCategoryStatus(id, status) {
    return new Promise((resolve, reject) => {
        ServiceCategories.findByIdAndUpdate(id, status).then(result => {
            resolve();
        }).catch(error => {
            reject(error);
        })
    })
}
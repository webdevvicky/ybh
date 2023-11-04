const crypto = require('crypto');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
    getSecureRandomToken(length) {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(length, (err, buffer) => {
                const token = buffer.toString('hex');
                if (err)
                    reject(err);
                else
                    resolve(token);
            })
        })
    },
    getSecureRandomOtp() {
        let otp = Math.floor(100000 + Math.random() * 900000);
        return otp;
    },
    /**
     * This function creates query project to fetch specific fields from collection
     * @param {*} fileds // array of fileds to fetch from collection
     * Ex: Input - ['full_name', 'email']
     *     Output - { full_name: 1, email: 1}
     */
    getQueryProject(fileds) {
        const project = {}
        fileds.map(field => {
            project[field] = 1
        })
        return project;
    },

    getStatusObject(status) {
        return {
            status: status
        }
    },

    getStatusObjectWithStatusKey(status) {
        const statusKey = {
            status: module.exports.getStatusObject(status)
        }
        return statusKey;
    },

    isValidObjectId(id) {
        return ObjectId.isValid(id) && new ObjectId(id) == id;
    },

    getAssetListForDB(assets) {
        const assestList = [];
        let assestObject = {};
        assets.forEach(item => {
            assestObject = module.exports.getAssetObjectForDB(item);
            assestList.push(assestObject);
        })
        return assestList;
    },

    getAssetObjectForDB(item) {
        return {
            url: `${item.path}`,
            file_name: item.filename
        }
    },

    getFilterDataListQuery(params) {
        const filterItem = Object.keys(params);
       
        let filterQuery = {},
            createdAt = {};
        if (params.active_status == null) {
            filterQuery = {
                "$expr": { "$ne": ["$active_status", "3"] }
            };
        }
        filterItem.forEach(item => {
          
            switch (item) {
                case 'active_status':
                    //filterQuery['active_status'] = params.active_status;
                    filterQuery['active_status'] = { "$regex": `${params.active_status}`, "$options": "i" };
                    break;
                case 'approval_status':
                   // filterQuery['approval_status'] = params.approval_status;
                    filterQuery['approval_status'] = { "$regex": `${params.approval_status}`, "$options": "i" };
                    break;
                case 'name':
                    filterQuery['name'] = { "$regex": `.*${params.name}.*`, "$options": "i" };
                    break;
                case 'email':
                    filterQuery['email'] = { "$regex": `.*${params.email}.*`, "$options": "i" };
                    break;
                case 'from_date':
                    createdAt = { $gte: new Date(params.from_date).toISOString(), $lte: new Date(params.to_date).toISOString() }
                    break;
                case 'fromDate':
                    createdAt = { $gte: new Date(params.fromDate).toISOString(), $lte: new Date(params.toDate).toISOString() }
                    break;
                case 'search':
                    filterQuery['name'] = { "$regex": `.*${params.search}.*`, "$options": "i" }
                    break;
                case 'salon_name':
                    filterQuery['salon_name'] = { "$regex": `.*${params.salon_name}.*`, "$options": "i" }
                    break;
            }
            if (Object.keys(createdAt).length > 0) {
                filterQuery['created_at'] = createdAt;
            }
        })
        return filterQuery;
    },

    getFilterDataListForCustomerQuery(params) {
        const filterItem = Object.keys(params);
       
        let filterQuery = {},
            createdAt = {};
        if (params.active_status == null) {
            filterQuery = {
                "$expr": { "$ne": ["$active_status", "3"] }
            };
        }
        filterItem.forEach(item => {
          
            switch (item) {
                case 'active_status':
                    //filterQuery['active_status'] = params.active_status;
                    filterQuery['customer.active_status'] = { "$regex": `${params.active_status}`, "$options": "i" };
                    break;
                case 'approval_status':
                   // filterQuery['approval_status'] = params.approval_status;
                    filterQuery['customer.approval_status'] = { "$regex": `${params.approval_status}`, "$options": "i" };
                    break;
                case 'name':
                    filterQuery['customer.name'] = { "$regex": `.*${params.name}.*`, "$options": "i" };
                    break;
                case 'email':
                    filterQuery['customer.email'] = { "$regex": `.*${params.email}.*`, "$options": "i" };
                    break;
                case 'from_date':
                    createdAt['$gte'] = new Date(params.from_date).toISOString();
                    break;
                case 'to_date':
                    createdAt['$lt'] = new Date(params.to_date).toISOString();
                    break;
                case 'search':
                    filterQuery['customer.name'] = { "$regex": `.*${params.search}.*`, "$options": "i" }
                    break;
                case 'salon_name':
                    filterQuery['customer.salon_name'] = { "$regex": `.*${params.salon_name}.*`, "$options": "i" }
                    break;
                case 'vendor_id':
                    filterQuery['vendor'] = params.vendor_id ? ObjectId(params.vendor_id): null
                    break;
            }
            if (Object.keys(createdAt).length > 0) {
                filterQuery['customer.created_at'] = createdAt;
            }
        })
        return filterQuery;
    },

    getFilterDataListQueryV2(params) {
        const filterItem = Object.keys(params);
        let filterQuery = {},
            createdAt = {};
        if (params.approval_status == null) {
            filterQuery = {
                "$expr": { "$ne": ["$approval_status", 3] }
            };
        }
        filterItem.forEach(item => {
            switch (item) {
                case 'approval_status':
                    filterQuery['approval_status'] = params.approval_status;
                    break;
                case 'approval_status':
                    filterQuery['approval_status'] = params.approval_status;
                    break;
                case 'name':
                    filterQuery['name'] = { "$regex": `.*${params.name}.*`, "$options": "i" };
                    break;
                case 'email':
                    filterQuery['email'] = { "$regex": `.*${params.email}.*`, "$options": "i" };
                    break;
                case 'from_date':
                    createdAt['$gte'] = new Date(params.from_date);
                    break;
                case 'to_date':
                    createdAt['$lte'] = new Date(params.to_date);
                    break;
                case 'search':
                    filterQuery['name'] = { "$regex": `.*${params.search}.*`, "$options": "i" }
                    break;
                case 'salon_name':
                    filterQuery['salon_name'] = { "$regex": `.*${params.salon_name}.*`, "$options": "i" }
                    break;
            }
            if (Object.keys(createdAt).length > 0) {
                filterQuery['created_at'] = createdAt;
            }
        })
        return filterQuery;
    },
}
const VendorServices = require('../models/vendor_services');

module.exports = {
    updateVendorServicesStatusByQuery(query, status) {
        return new Promise((resolve, reject) => {
            VendorServices.updateMany(query, status).then(result => {
                resolve();
            }).catch(error => {
                reject(error);
            })
        })
    }
}
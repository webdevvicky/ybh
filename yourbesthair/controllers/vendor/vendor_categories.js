const { getCategoryIdBySlug } = require('../../controllers/categories');
const Vendors = require('../../models/vendors');
const { generateAPIReponse } = require('../../utils/response');
const { getVendorsByCategorySlugQuery } = require('./db_query/get_vendors_by_category_slug');
module.exports = {

    async getVendorsByCategorySlug(req, res) {
        const { page = 0, limit = 20 } = req.query;
        const slug = req.params.slug;
        console.log('getVendorsByCategorySlug slug =>', slug);
        console.log('getVendorsByCategorySlug query params =>', req.query);
        const categoryId = await getCategoryIdBySlug(slug);
        console.log('categoryId of slug =>', categoryId);
        const query = getVendorsByCategorySlugQuery(categoryId, page, limit);
        Vendors.aggregate(query).then(vendors => {
            return res.status(200).send(generateAPIReponse(0,'Vendors retrieved successfully', vendors[0]));
        }).catch(error => {
            console.log('getVendorsByCategorySlug error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getVendorsFilterCustomerSide(req, res) {
        res.send("filter");
    },
}
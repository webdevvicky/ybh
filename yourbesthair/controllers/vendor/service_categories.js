const ServiceCategories = require('../../models/service_categories');
const { generateAPIReponse } = require('../../utils/response');
const { getQueryProject } = require('../../utils/functions');

module.exports = {
    getMyServiceCategoriesList(req, res) {
        console.log('getMyServiceCategoriesList user=>', req.user.id);
        ServiceCategories.aggregate([
            {
                $match: {
                    $and: [
                        { created_by: req.user.id },
                        { "active_status": { "$ne": "3" } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'vendor_services',
                    as: 'vendor_services',
                    let: { 'serviceCategoryId': '$_id' },
                    pipeline: [
                        {
                            $match: {
                                "$expr": { "$eq": ["$category", "$$serviceCategoryId"] }
                            }
                        }
                    ]
                }

            },
            { $sort: { created_at: -1 } },
            {
                "$addFields": {
                    "service_count": { $size: "$vendor_services" }
                }
            },
            {
                $project: {
                    vendor_services: 0, updated_at: 0, __v: 0, created_by: 0
                }
            }
        ]).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Service category list retrieved successfully', result));
        }).catch(error => {
            console.log('getMyServiceCategoriesList error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getMyServiceCategoriesNameList(req, res) {
        console.log('getMyServiceCategoriesNameList');
        ServiceCategories.find({
            $and: [
                { created_by: req.user.id },
                { "active_status": { "$ne": "3" } }
            ]
        }, getQueryProject(['name'])).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Service category name list retrieved successfully', result));
        }).catch(error => {
            console.log('getMyServiceCategoriesNameList error =>', error);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    }
}
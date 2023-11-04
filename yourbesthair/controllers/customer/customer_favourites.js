const CustomerFavourites = require('../../models/customer_favourites');
const { generateAPIReponse } = require('../../utils/response');
const mongoose = require('mongoose');
var _ = require('lodash');

module.exports = {
    saveFavouriteItem(req, res) {
        console.log('saveFavouriteItem id =>', req.user.id, 'params =>', req.body);
        const params = req.body;
        params.customer_id = req.user.id;
        const newFavourite = new CustomerFavourites(params);
        newFavourite.save()
            .then(async (result) => {
                return res.status(200).send(generateAPIReponse(0,'Vendor added to favourites list successfully', result));
            })
            .catch((error) => {
                console.log('saveFavouriteItem error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            });
    },

    getMyFavourites(req, res) {
        CustomerFavourites.aggregate([
            {
                $match: {
                    "customer_id": mongoose.Types.ObjectId(req.user.id)
                }
            },
            // { $limit: 4 },
            {
                $lookup: {
                    from: "vendors",
                    localField: "vendor_id",
                    foreignField: "_id",
                    as: "vendors"
                }
            },
            {
                $lookup: {
                    from: "favourite_folders",
                    localField: "folder_id",
                    foreignField: "_id",
                    as: "folders",
                }
            },
            {
                $project: {
                    vendor_id: 0, customer_id: 0, created_at: 0, updated_at: 0, __v: 0,
                }
            },
            { $unwind: "$vendors" },
        ]).then(result => {
            var grouped = _.groupBy(result, function (data) {
                if (data.folders[0]) {
                    return data.folders[0].name;
                } else {
                    return "Default"
                }
            });
            return res.status(200).send(generateAPIReponse(0,'My favourites fetched successfully', grouped));
        }).catch(error => {
            console.log('getMyFavourites error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getMyFavouritesFolderItems(req, res) {
        const folderId = req.params.folder_id;
        console.log('getMyFavouritesFolderItems folder Id =>', folderId);
        const { limit, page } = req.query;
        console.log('getMyFavouritesFolderItems query params =>', req.query);
        const skips = Number(limit) * Number(page);
        let matchQuery;
        if (folderId == 'null') {
            matchQuery = {
                '$and': [
                    { "customer_id": mongoose.Types.ObjectId(req.user.id) },
                    { folder_id: { $exists: false } }
                ]
            }
        } else {
            matchQuery = { "folder_id": mongoose.Types.ObjectId(folderId) }
        }
        console.log('getMyFavouritesFolderItems match query', matchQuery);
        CustomerFavourites.aggregate([
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "vendors",
                    localField: "vendor_id",
                    foreignField: "_id",
                    as: "vendors"
                }
            },
            {
                $project: {
                    _id: 0, vendor_id: 0, customer_id: 0, created_at: 0, updated_at: 0, __v: 0,
                }
            },
            {
                $facet: {
                    paginated_result: [{ $skip: skips }, { $limit: Number(limit) }],
                    total_count: [
                      {
                        $count: 'count'
                      }
                    ]
                  }
            },
            // { $unwind: "$vendors" },
        ]).then(result => {
            const vendorList = result[0].paginated_result.map(item => {
                return item['vendors'][0]
            });
            return res.status(200).send(generateAPIReponse(0,'My favourites folder items fetched successfully', {
                paginated_result: vendorList,
                total_count: result[0].total_count
            }));
        }).catch(error => {
            console.log('getMyFavouritesFolderItems error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    isMyfavouriteItem(req, res) {
        console.log('isMyfavouriteItem customer id =>', req.params.id, 'params =>', req.body);
        CustomerFavourites.findOne({
            $and: [
                { customer_id: req.user.id },
                { vendor_id: req.body.vendor_id }
            ]
        }).then(result => {
            if (result)
                return res.status(200).send(generateAPIReponse(0,'Is My favourite item', { _id: result._id, is_my_fav: true }));
            else
                return res.status(200).send(generateAPIReponse(0,'Is My favourite item', { is_my_fav: false }));
        }).catch(error => {
            console.log('isMyfavouriteItem error =>', error.message);
            return res.status(200).send(generateAPIReponse(0,'Is My favourite item'));
        })
    },

    deleteFavouriteItembyId(req, res) {
        console.log('deleteFavouriteItembyId id =>', req.params.id);
        CustomerFavourites.deleteOne({ _id: req.params.id }).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Favourite item deleted successfully'));
        }).catch(error => {
            console.log('deleteFavouriteItembyId error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    deleteFavouriteFolderItems(folderId) {
        return new Promise((resolve, reject) => {
            CustomerFavourites.deleteMany({ folder_id: folderId }).then(result => {
                resolve(result);
            }).catch(error => {
                reject(error);
            })
        })
    }
}
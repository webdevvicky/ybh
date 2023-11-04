const Pages = require('../../models/pages');
const { generateAPIReponse } = require('../../utils/response');
const multer = require('multer');
const url = require("url");
const {
    getAssetListForDB,
    getAssetObjectForDB,
    getStatusObject,
    getStatusObjectWithStatusKey
} = require('../../utils/functions');
const fs = require('fs');
const { getSecureRandomToken } = require('../../utils/functions');
const Vendors = require('../../models/vendors');
const Categories = require('../../models/categories');

module.exports = {
    createPage(req, res) {
        const params = req.body;
       // console.log('createPage params', params);
        try {
            const pagesData = new Pages(params);
            pagesData.save().then(result => {
                return res.status(200).send(generateAPIReponse(0,'Page saved successfully', result));
            })
        } catch (error) {
             console.log('createPage error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }, 

    savePage(req, res) {
        const params = req.body;
        const id = req.params.id;
       // console.log('savePage id =>', id, 'params =>', params);
        let idToMatch = { _id: id };
        let updateDocument = params;
        try {
            if (params.banners) {
                if (params.banners._id) {
                    idToMatch['banners._id'] = params.banners._id
                    updateDocument = {
                        $set: {
                            "banners.$": params.banners
                        }
                    }
                } else {
                    updateDocument = {
                        $push: params
                    }
                }
            } else {
                if (params._id) {
                    idToMatch['blocks._id'] = params._id;
                    updateDocument = {
                        $set: {
                            "blocks.$.title": params.title
                        },
                        $addToSet: {
                            'blocks.$.items': params.items
                        }
                    }
                } else {
                    updateDocument = {
                        $push: {
                            blocks: params
                        }
                    }
                }
            }
           // console.log('idToMatch', idToMatch);
            //console.log('updateDocument', updateDocument);
            Pages.findOneAndUpdate(idToMatch, updateDocument, { upsert: true }).then(result => {
                return res.status(200).send(generateAPIReponse(0,'Page saved successfully', result));
            })
        } catch (error) {
            //console.log('savePage error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getUploadedBannerImageData(req, res) {
        const assets = req.files;
        //console.log('uploadCMSAssets files =>', assets);
        if (!assets) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            const imageObj = getAssetObjectForDB(assets.banners[0]);
            //console.log('imageObj =>', imageObj);
            return res.status(200).send(generateAPIReponse(0,'File uploaded successfully', imageObj));
        }
    },

    getPageList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if (isNaN(page) && isNaN(limit)){
            Pages.find()
            .then(page => {
                return res.status(200).send(generateAPIReponse(0,'Page fetched successfully', page));
            }).catch(error => {
                //console.log('getPageById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            Pages.find()
            .sort({ created_at: -1 });
            Pages.aggregate([
                { '$facet'    : {
                    metadata: [ { $count: "total" },  ],
                    data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
                } }
            ])
            .then(pages => {
                return res.status(200).send(generateAPIReponse(0,'Page list fetched successfully', pages));
            }).catch(error => {
                //console.log('getPageList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getPageById(req, res) {
        const id = req.params.id;
        //('getPageById Id =>', id);
        Pages.findOne({ _id: id })
            .then(page => {
                return res.status(200).send(generateAPIReponse(0,'Page fetched successfully', page));
            }).catch(error => {
                console.log('getPageById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    },

    getPageBySlug(req, res) {
        const slug = req.params.slug;
        //('getPageById Id =>', id);
        Pages.findOne({ slug: slug })
            .then(page => {
                return res.status(200).send(generateAPIReponse(0,'Page fetched successfully', page));
            }).catch(error => {
                console.log('getPageBySlug error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    },

    async deletePageById(req, res) {
        const id = req.params.id;
        //console.log('deletePageById id =>', id);
        const status = getStatusObjectWithStatusKey(3);
        Pages.findByIdAndUpdate(id, status).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Page deleted successfully'));
        }).catch(error => {
           // console.log('deletePageById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    }, 

    async approvePageById(req, res) {
        const id = req.params.id;
        //console.log('approvePageById id =>', id);
        const approvalStatus = {
            approval_status: getStatusObject(1)
        }
        Pages.findByIdAndUpdate(id, approvalStatus).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Page Approved successfully'));
        }).catch(error => {
            //console.log('approvePageById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getHomePageDetails(req, res) {
        //console.log('getHomePageDetails');
        Pages.aggregate([{
            $match: {
                "$expr": { "$eq": ['$name', 'Home'] },
            }
        }]).then(async(result) => {
            await Promise.all(result[0].blocks.map(async(item, i) => {
                if (item.block_type == "vendor") {
                    result[0].blocks[i]['items'] = await getVendorBlockDetailsById(item.items);
                }
                if (item.block_type == "category") {
                    result[0].blocks[i]['items'] = await getCategoryBlockDetailsById(item.items);
                }
            }));
            return res.status(200).send(generateAPIReponse(0,'Home page retrieved successfully', result[0]));
        }).catch(error => {
            //console.log('getHomePageDetails error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async bulkDeletePage(req, res){
        //res.send("Page delete");
        const id = req.params.id;
		const arr = id.split(',');
        try{
            Pages.updateMany({_id:{$in: arr}},{ $set: { approval_status: "3", active_status: "3"}},{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Page deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeletePageById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    uploadCMSAssets(req, res) {
        const assets = req.files;
        const id = req.params.id;
        //console.log('uploadCMSAssets files =>', assets, 'id =>', id);
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
            if (assets.block_items) {
                const blockItems = getAssetListForDB(assets.block_items)
                queryToUpdate.$push['blocks.items.image'] = {
                    $each: blockItems
                }
            }
            if (assets.logo) {
                const featuredImage = getAssetObjectForDB(assets.featured_image[0]);
                queryToUpdate.$set['featured_image'] = featuredImage;
            }
            Pages.updateOne({ _id: id }, queryToUpdate, { new: true }).then(page => {
                return res.status(200).send(generateAPIReponse(0,'Assets uploaded successfully', page));
            }).catch(error => {
                //console.log('uploadCMSAssets error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async deleteBannerById(req, res) {
        const pageId = req.params.page_id;
        const bannerId = req.params.banner_id;
        const params = req.body;
        //console.log('deleteBannerById pageId =>', pageId, 'bannerId =>', bannerId, 'params =>', params);
        const imagePath = url.parse(params.image_url).pathname.slice(1);
        //console.log('imagePath', imagePath);
        try {
            await deleteBannerImageFromPath(imagePath);
        } catch (error) {
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
        Pages.updateOne({ _id: pageId }, {
            $pull: {
                banners: {
                    '_id': bannerId
                }
            }
        }).then(result => {
            //console.log('result', result);
            return res.status(200).send(generateAPIReponse(0,'Banner deleted successfully', result));
        }).catch(error => {
           // console.log('deleteBannerById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    deletePageBlockById(req, res) {
        const pageId = req.params.page_id;
        const blockId = req.params.block_id;
        //console.log('deletePageBlockById pageId =>', pageId, 'blockId =>', blockId);
        Pages.updateOne({ _id: pageId }, {
            $pull: {
                blocks: {
                    '_id': blockId
                }
            }
        }).then(result => {
            //console.log('result', result);
            return res.status(200).send(generateAPIReponse(0,'Block deleted successfully', result));
        }).catch(error => {
            //console.log('deletePageBlockById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    deletePageBlockItemById(req, res) {
        const pageId = req.params.page_id;
        const item = req.params.item;
        const blockId = req.params.block_id;
       // console.log('deletePageBlockItemById pageId =>', pageId, 'item =>', item, 'blockId =>', blockId);
        Pages.updateOne({ _id: pageId, "blocks._id": blockId }, {
            $pull: {
                "blocks.$.items": {
                    $in: [item]
                }
            }
        }, { multi: true }).then(result => {
           // console.log('result', result);
            return res.status(200).send(generateAPIReponse(0,'Block item deleted successfully', result));
        }).catch(error => {
           // console.log('deletePageBlockItemById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    }
}

function deleteBannerImageFromPath(imageUrl) {
    return new Promise((resolve, reject) => {
        try {
            fs.unlinkSync(imageUrl);
            resolve();
        } catch (error) {
           // console.log('deleteBannerImageFromPath error =>', error.message, error.code);
            if (error.code == 'ENOENT') {
               // console.log('No Such file found');
                resolve();
            } else {
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
        }
    })

}
const pageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "featured_image") {
            cb(null, 'uploads/cms/featured_image');
        } else if (file.fieldname === "block_items") {
            cb(null, 'uploads/cms/block_items_image');
        } else if (file.fieldname === "banners") {
            cb(null, 'uploads/cms/banners');
        }
    },
    filename: async(req, file, cb) => {
        const filename = await getSecureRandomToken(10);
        cb(null, `${filename}-${file.originalname}`);
    }
})

function getVendorBlockDetailsById(ids) {
    return new Promise((resolve, reject) => {
        Vendors.aggregate([{
                $match: {
                    "$expr": { "$in": ['$_id', ids] },
                }
            }, {
                $lookup: {
                    from: "reviews",
                    let: { "vendorId": "$_id" },
                    as: "reviews",
                    pipeline: [{
                            $match: {
                                "$expr": { "$eq": ["$reviewee", "$$vendorId"] }
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
                                counts: "$counts"
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
            },
            {
                $project: {
                    _id: 1,
                    salon_name: 1,
                    logo: 1,
                    formatted_address: 1,
                    reviews: 1,
                    slug: 1
                }
            },
        ]).then(vendor => {
            resolve(vendor)
        }).catch(error => {
            console.log('getVendorBlockDetailsById error =>', error.message);
            reject(error);
        })
    })
}

function getCategoryBlockDetailsById(ids) {
    return new Promise(async(resolve, reject) => {
        const category = await getCategoriesBlockDBCall(ids);
        // const subCategory = await getSubCategoriesBlockDBCall(ids);
        // const result = category.concat(subCategory)
        resolve(category)
    })
}

function getCategoriesBlockDBCall(ids) {
    return new Promise((resolve, reject) => {
        Categories.aggregate([{
                $match: {
                    "$expr": { "$in": ['$_id', ids] },
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    profile: 1,
                    slug: 1
                }
            }
        ]).then(category => {

            resolve(category)
        }).catch(error => {
           // console.log('getCategoryBlockDetailsById error =>', error.message);
            reject(error);
        })
    })
}

function getSubCategoriesBlockDBCall(ids) {
    return new Promise((resolve, reject) => {
        Categories.aggregate([{
                $match: {
                    "$expr": { "$in": ['$_id', ids] },
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    profile: 1,
                    slug: 1
                }
            }
        ]).then(subCategory => {
            resolve(subCategory)
        }).catch(error => {
           // console.log('getSubCategoriesBlockDBCall error =>', error.message);
            reject(error);
        })
    })
}

module.exports.uploadCMSConfig = multer({ storage: pageStorage });
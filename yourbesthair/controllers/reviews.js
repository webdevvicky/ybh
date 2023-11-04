const Reviews = require('../models/reviews');
const { generateAPIReponse } = require('../utils/response');
var _ = require('lodash');
const multer = require('multer');
const mongoose = require('mongoose');
const { getStatusObjectWithStatusKey } = require('../utils/functions');
module.exports = {
    updateReviewById(req, res) {
        const id = req.params.id;
        const params = req.body;
        console.log('updateReviewById id =>', id, 'params =>', params);
        Reviews.findByIdAndUpdate(id, params, { new: true })
            .then(review => {
                return res.status(200).send(generateAPIReponse(0,'Review updated successfully', review));
            }).catch(error => {
                console.log('updateReviewById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    },

    uploadReviewImages(req, res) {
        const assets = req.files;
        const reviewId = req.params.id;
        console.log('uploadReviewImages files =>', assets, 'reviewId =>', reviewId);
        if (!assets) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            let queryToUpdate = { $push: {} }
            if (assets.images) {
                const images = getAssetListForDB(assets.images);
                queryToUpdate.$push['images'] = {
                    $each: images
                }
            }
            Reviews.updateOne({ _id: reviewId }, queryToUpdate, { new: true }).then(review => {
                return res.status(200).send(generateAPIReponse(0,'Review Image uploaded successfully', review));
            }).catch(error => {
                console.log('uploadReviewImages error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getReviewList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        let _query = {}
        if (queryParams.vendor_id && mongoose.Types.ObjectId.isValid(queryParams.vendor_id)) {
            _query = { reviewee: mongoose.Types.ObjectId(queryParams.vendor_id) } 
        }
        if (isNaN(page) && isNaN(limit)){
            Reviews.find(_query)
            .populate('reviewee', 'salon_name')
            .populate('reviewer', 'full_name')
            .sort({ created_at: -1 }).lean()
            .then(reviews => {
                reviews.map(x => {
                    if (x.active_status) {
                        switch (true) {
                            case x.active_status == '0':
                             x['status'] = "Pending";
                             break;
                            case x.active_status == '1':
                             x['status'] = "Approved";
                             break;
                            case x.active_status == '2':
                             x['status'] = "Declined";
                             break;
                            case x.active_status == '3':
                             x['status'] = "Deleted";
                             break;
                            default: 
                            break;
                        }
                    }
                    return x;
                });
                return res.status(200).send(generateAPIReponse(0,'Reviews list fetched successfully', reviews));
            }).catch(error => {
                console.log('getReviewList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
                Reviews.aggregate([
                    {
                        $lookup: {
                            from: "customers",
                            localField: "reviewer",
                            foreignField: "_id",
                            as: "reviewer"
                        }
                    },
                    {
                        $unwind: {
                            path: "$reviewer",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: "vendors",
                            localField: "reviewee",
                            foreignField: "_id",
                            as: "reviewee"
                        }
                    },
                    {
                        $unwind: {
                            path: "$reviewee",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    { '$facet'    : {
                        metadata: [ { $count: "total" } ],
                        data: [{ $sort: { created_at: -1 }}, { $skip: skip }, { $limit: limit }]// add projection here wish you re-shape the docs
                    } }
                ])
                .then(reviews => {
                    reviews.map(x => {
                        if (x.active_status) {
                            switch (true) {
                                case x.active_status == '0':
                                 x['status'] = "Pending";
                                 break;
                                case x.active_status == '1':
                                 x['status'] = "Approved";
                                 break;
                                case x.active_status == '2':
                                 x['status'] = "Declined";
                                 break;
                                case x.active_status == '3':
                                 x['status'] = "Deleted";
                                 break;
                                default: 
                                break;
                            }
                        }
                        return x;
                    });
                    return res.status(200).send(generateAPIReponse(0,'Reviews list fetched successfully', reviews));
                }).catch(error => {
                    console.log('getReviewList error =>', error.message);
                    return res.status(500).send(generateAPIReponse(1,error.message));
                })
        }
    },


    async bulkDeleteReview(req, res){
        //res.send("Review delete");
        const id = req.params.id;
		const arr = id.split(',');
        try{
            Reviews.updateMany({_id:{$in: arr}},{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Review deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteReviewById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    getReviewById(req, res) {
        const id = req.params.id;
        console.log('getReviewById Id =>', id);
        Reviews.findOne({ _id: id })
            .populate('reviewee', 'salon_name')
            .populate('reviewer', 'full_name')
            .then(review => {
                return res.status(200).send(generateAPIReponse(0,'Review fetched successfully', review));
            }).catch(error => {
                console.log('getReviewById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    },

    async deleteReviewById(req, res) {
        const id = req.params.id;
        console.log('deleteReviewById id =>', id);
        const status = getStatusObjectWithStatusKey(3);
        Reviews.findByIdAndUpdate(id, status).then(result => {
            return res.status(200).send(generateAPIReponse(0,'Review deleted successfully'));
        }).catch(error => {
            console.log('deleteReviewById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },
}

const reviewStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "images") {
            cb(null, 'uploads/reviews');
        }
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
})

module.exports.uploadReviewConfig = multer({ storage: reviewStorage });

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
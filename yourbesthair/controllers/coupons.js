const Coupons = require('../models/coupons');
const { generateAPIReponse } = require('../utils/response');
const { getFilterDataListQuery } = require('../utils/functions');
const multer = require('multer');
var ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose')


module.exports = { 
    getCouponList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        let _query = {};
        if(isNaN(page) && isNaN(limit)){
           Coupons.find({  status: '1' }).then(async(coupon) => {
                let result = coupon;
                return res.status(200).send(generateAPIReponse(0,'Coupons fetched successfully', result));
            }).catch(error => {
                console.log('getCouponList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }) 
        } else {
            console.log("filter heree")
            
            starton = queryParams.starton;
            expireon = queryParams.expireon;
            if (starton) {
                _query = { ..._query, 'starton': { $gte: new Date(starton) } }
            } 
            if (expireon) {
                _query = { ..._query, 'expireon': { $lte: new Date(expireon) } }
            }
            console.log(_query)
            Coupons.aggregate([{
                $match: _query
            } 
           
        ]).then(coupons => {
                return res.status(200).send(generateAPIReponse(0,'Coupon list fetched successfully', coupons));
            }).catch(error => {
                console.log('getCoupon error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async createCoupon(req, res) {
        const params = req.body;
        console.log('save Coupon params', params);
        try {
            if (iscodeExist) {
                return res.status(400).send({ message: "The coupon code you entered is already exist, Please try with another one.", status: 400 });
            }
            const category = await addCouponsDBCall(params);
            return res.status(200).send(generateAPIReponse(0,'Coupon saved successfully', category));
        } catch (error) {
            console.log('saveCoupon error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async updateCouponById(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('updateCouponById id =>', id, 'params =>', params);
        
        try {
            const iscodeExist = await Coupons.exists({ code: params.code });
           
            if (iscodeExist) {
                return res.status(400).send({ message: "The coupon code you entered is already exist, Please try with another one.", status: 400 });
            }
            const category = await updateCouponsByIdDBCall(id, params);
            return res.status(200).send(generateAPIReponse(0,'Coupon updated successfully', category));
        } catch (error) {
            console.log('updateCouponsById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },
    async deleteCouponById(req,res)
    {
        
        const id = req.params.id;
        console.log(id)
        try{
            await Coupons.findOneAndUpdate({ _id: mongoose.Types.ObjectId(id) }, { $set: { status: "0", active_status: "3"} }, { new: true }).lean().exec();
               
            
                return res.status(200).send(generateAPIReponse(0,'Coupon deleted successfully..!!'));

            }catch (error) {
                console.log('Coupon Delete error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },
    async bulkDeleteCategory(req, res){
        //res.send("Category delete");
        const id = req.params.id;
        var arr = id.split(','); 
        //console.log(arr);
        try{
            Categories.updateMany({_id:{$in: arr}},{ $set: { approval_status: "3", active_status: "3"} },{ returnOriginal: false },
                    function (categories) {
                        return res.status(200).send(generateAPIReponse(0,'Category deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteCategoryById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    getCategoriesWithSubCategories(req, res) {
         const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if(isNaN(page) && isNaN(limit)){
            Categories.find({ category: { $eq: null }}).then(async(category) => {
                let result = category;
                return res.status(200).send(generateAPIReponse(0,'Category list fetched successfully', result));
            }).catch(error => {
                console.log('getCategoryList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        } else {
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : 
            { "$expr": { "$ne": ["$active_status", "3"] } }
            if (queryParams.name) {
                filterQuery['$or'] = [
                    { name: { "$regex": `.*${queryParams.name}.*`, "$options": "i" } }
                ]
            }
            if (queryParams.approval_status) {
                filterQuery['$or'] = [
                    { approval_status: { "$regex": `${queryParams.approval_status}`, "$options": "i" } }
                ]
            }
            filterQuery['category'] = { $eq: null };
            Categories.aggregate([{
                $match: filterQuery
            },
            { $sort: { created_at: -1 } },
            {
                $lookup: {
                    from: 'categories',
                    as: 'sub_categories',
                    let: { "categoryId": "$_id" },
                    pipeline: [{
                        $match: {
                            $and: [
                                { "$expr": { "$eq": ["$category", "$$categoryId"] } },
                                { "$expr": { "$ne": ["$active_status", "3"] } },
                            ]
                        }
                    }]
                }
            }, 
            {
                $project: {'name':1, 'slug':1, 'description1':1, 'categories_uuid': 1,
                'meta_title':1, 'meta_description':1,
                'created_at':1, 'billing_address':1, 'active_status':1, 'approval_status':1, 'sub_categories':1 }
            },
            { '$facet'    : {
                metadata: [ { $count: "total" } ],
                data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
            } }
        ]).then(async (categories) => {
                for(let _items of categories) {
                    for (let _item of _items.data) {
                        if (_item._id) {
                            let _vendor = await Vendors.find({ $or: [{ categories: _item._id }, { sub_categories: _item._id }]}, { _id: 1, salon_name: 1 }).lean().exec();
                            _item['vendor'] = _vendor
                        }
                    }
                }
                return res.status(200).send(generateAPIReponse(0,'Categories, Sub categories list fetched successfully', categories));
            }).catch(error => {
                console.log('getCategoriesWithSubCategories error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },


    async getCategoriesFilterList(req, res) {
        //res.send("Category Filter List");
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
            const categories = await Categories.find(params).where({created_at: {$gte: new Date(from_date).toISOString(), $lt : new Date(to_date).toISOString()}});
            return res.status(200).send(generateAPIReponse(0,'Categories Filter list fetched successfully', categories));
          } catch (err) {
            console.log('getCategoryFilterList error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
          }
    },

    getCategoryListDBCall(queryParams,page,limit,skip) {
        return new Promise((resolve, reject) => {
            Categories.aggregate([{
                    $match: {
                        $and: [
                            { "$expr": { "$ne": ["$active_status", "3"] } },
                            { "$expr": { "$ne": ["$active_status", "0"] } },
                            { "$expr": { "$eq": ["$category", null] } }
                        ]

                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        as: 'sub_categories',
                        let: { "categoryId": "$_id" },
                        pipeline: [{
                            $match: {
                                $and: [
                                    { "$expr": { "$eq": ["$category", "$$categoryId"] } },
                                    { "$expr": { "$ne": ["$active_status", "3"] } },
                                ]
                            }
                        }]
                    }
                },
                { '$facet'    : {
                                metadata: [ { $count: "total" } ],
                                data: [ { $skip: skip }] // add projection here wish you re-shape the docs
                            } }
            ]).then(categories => {
                resolve(categories);
            }).catch(error => {
                reject(error);
            })
        })
    },

    getCategoryIdBySlug(slugString) {
        let categoryId
        return new Promise((resolve, reject) => {
            Categories.findOne({ slug: slugString }).then(async(category) => {
                if (category == undefined || category == null) {
                    categoryId = await getSubCategoryIdBySlug(slugString);
                } else {
                    categoryId = category._id;
                }
                resolve(categoryId);
            }).catch(error => {
                reject(error);
            })
        })
    },

    searchCategoriesByName(name) {
        return new Promise((resolve, reject) => {
            Categories.find({ name: { "$regex": `.*${name}.*`, "$options": "i" } }).then(async(categories) => {
                resolve(categories);
            }).catch(error => {
                reject(error);
            })
        })
    },

    async generateCategorySlug(req, res) {
        const params = req.body
        console.log('generateCategorySlug params =>', params);
        try {
            if (params.title) {
                let slug = params.title.replace(/\s/g, "-").toLowerCase();
                const isSlugExist = await Categories.exists({ slug: slug });
                if (isSlugExist) {
                    let numericPrefix = 1;
                    while (1) {
                        const newSlug = (`${slug}-${numericPrefix++}`).toLowerCase(); //new Slug with incremented Slug Numerical Prefix
                        const isNewSlugExist = await Categories.exists({ slug: newSlug }); //Check if already exists in DB
                        //This returns true if exists.
                        if (!isNewSlugExist) {
                            //There is no more coincidence. Finally found unique slug.
                            slug = newSlug; //New Slug 
                            break; //Break Loop
                        }
                    }
                } else {
                    console.log('slug =>', slug);
                    return res.status(200).send(generateAPIReponse(0,'Category slug generated successfully', { slug: slug }));
                }
                console.log('slug =>', slug);
                return res.status(200).send(generateAPIReponse(0,'Category slug generated successfully', { slug: slug }));
            } else {
                return res.status(204).send(generateAPIReponse(1,'Please provide title'));
            }

        } catch (error) {
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getCategoryDetailsBySlug(req, res) {
        const slug = req.params.slug;
        console.log('getCategoryDetailsBySlug slug =>', slug);
        Categories.findOne({ slug: slug }).then(async(category) => {
            let result = category;
            if (!category) {
                result = await getSubCategoryDetailsBySlug(slug);
            }
            return res.status(200).send(generateAPIReponse(0,'Category details by slug fetched successfully', result));
        }).catch(error => {
            console.log('getCategoryDetailsBySlug error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    uploadCategoryAssets(req, res) {
        const assets = req.files;
        const categoryId = req.params.id;
        console.log('uploadCategoryAssets files =>', assets, 'categoryId =>', categoryId);
        if (!assets) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            let queryToUpdate = {
                $set: {}
            }
            if (assets.banner) {
                const banner = getAssetObjectForDB(assets.banner[0]);
                queryToUpdate.$set['banner'] = banner;
            }
            if (assets.icon) {
                const icon = getAssetObjectForDB(assets.icon[0]);
                queryToUpdate.$set['icon'] = icon;
            }
            if (assets.profile) {
                const profile = getAssetObjectForDB(assets.profile[0]);
                queryToUpdate.$set['profile'] = profile;
            }
            Categories.updateOne({ _id: categoryId }, queryToUpdate, { new: true }).then(category => {
                return res.status(200).send(generateAPIReponse(0,'Assets uploaded successfully', category));
            }).catch(error => {
                console.log('uploadCategoryAssets error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getCategoryById(req, res) {
        const categoryId = req.params.categoryId;
        console.log('getCategoryDetailsById categoryId =>', categoryId);
        Categories.findOne({ _id: ObjectId(categoryId) }).then(async(category) => {
            let result = category;
            return res.status(200).send(generateAPIReponse(0,'Category details by Id fetched successfully', result));
        }).catch(error => {
            console.log('getCategoryDetailsBySlug error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    }
}

function updateCouponsByIdDBCall(id, params) {
    return new Promise((resolve, reject) => {
        Coupons.findByIdAndUpdate(id, params, { new: true }).then(result => {
            resolve(result);
        }).catch(error => {
            reject(error);
        })
    })
}

function updateSubCategoiesStatusByCategoryId(categoryId, active_status) {
    return new Promise((resolve, reject) => {
        Categories.updateMany({ category: categoryId }, active_status).then(result => {
            resolve();
        }).catch(error => {
            reject(error);
        })
    })
}

function generateCategorySubCategoryListOutput(categories) {
    return new Promise((resolve, reject) => {
        const resultArray = [];
        categories.map(parentCat => {
            resultArray.push(parentCat)
            if (parentCat.sub_categories.length !== 0) {
                parentCat.sub_categories.map(subCat => {
                    subCat.category = {
                        _id: parentCat._id,
                        name: parentCat.name
                    }
                    subCat.is_sub_category = true;
                    resultArray.push(subCat)
                })
            }
            delete parentCat.sub_categories
        })
        resolve(resultArray);
    })
}

function getAssetObjectForDB(item) {
    return {
        url: `${item.path}`,
        file_name: item.filename
    }
}

function addCouponsDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newCoupons = new Coupons(params);
        newCoupons.save().then(category => {
            resolve(category);
        }).catch((error) => {
            reject(error);
        });
    })
}

const categoryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "banner") {
            cb(null, 'uploads/category_banner');
        } else if (file.fieldname === "icon") {
            cb(null, 'uploads/category_icon');
        } else if (file.fieldname === "profile") {
            cb(null, 'uploads/category_profile');
        }
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
})

module.exports.uploadCategoryConfig = multer({ storage: categoryStorage });

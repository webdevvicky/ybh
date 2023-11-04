const SubCategories = require('../models/categories');
const { generateAPIReponse } = require('../utils/response');
const { getCategoryListDBCall } = require('../controllers/categories');
const multer = require('multer');

module.exports = {
    async createSubCategories(req, res) {
        const params = req.body;
        console.log('saveCategoryDetails params', params);
        try {
            const SubCategories = await addSubCategoriesDetailsDBCall(params);
            return res.status(200).send(generateAPIReponse(0,'SubCategories saved successfully', SubCategories));
        } catch (error) {
            console.log('savesubCategoriesDetails error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getSubCategoryAndCategoryList(req, res) {
        try {
            Promise.all([getCategoryListDBCall(), getSubCategoryListDBCall()]).then(result => {
                return res.status(200).send(generateAPIReponse(0,'Subcategory list with category list fetched successfully', { categories: result[0], sub_categories: result[1] }));
            })
        } catch (error) {
            console.log('getSubCategoryListWithCategory error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    updateSubCategoryById(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('updateSubCategoryById id =>', id, 'params =>', params);
        SubCategories.findByIdAndUpdate(id, params, { new: true }).then(subCategory => {
            return res.status(200).send(generateAPIReponse(0,'Sub category updated successfully', subCategory));
        }).catch(error => {
            console.log('updateSubCategoryById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async bulkDeleteSubCategory(req, res){
        //res.send("SubCategory delete");
        const id = req.params.id;
		const arr = id.split(',');
        try{
            SubCategories.updateMany({_id:{$in: arr}},{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'SubCategory deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteSubCategoryById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    getSubCategoryIdBySlug(slug) {
        return new Promise((resolve, reject) => {
            SubCategories.findOne({ slug: slug }).then(subCategory => {
                resolve(subCategory._id);
            }).catch(error => {
                reject(error);
            })
        })
    },

    async generateSubCategorySlug(req, res) {
        const params = req.body
        console.log('generateSubCategorySlug params =>', params);
        try {
            if (params.title) {
                let slug = params.title.replace(/\s/g, "-").toLowerCase();
                const isSlugExist = await SubCategories.exists({ slug: slug });
                if (isSlugExist) {
                    let numericPrefix = 1;
                    while (1) {
                        const newSlug = (`${slug}-${numericPrefix++}`).toLowerCase(); //new Slug with incremented Slug Numerical Prefix
                        const isNewSlugExist = await SubCategories.exists({ slug: newSlug }); //Check if already exists in DB
                        //This returns true if exists.
                        if (!isNewSlugExist) {
                            //There is no more coincidence. Finally found unique slug.
                            slug = newSlug; //New Slug 
                            break; //Break Loop
                        }
                    }
                } else {
                    console.log('slug =>', slug);
                    return res.status(200).send(generateAPIReponse(0,'Sub category slug generated successfully', { slug: slug }));
                }
                console.log('slug =>', slug);
                return res.status(200).send(generateAPIReponse(0,'Sub category slug generated successfully', { slug: slug }));
            } else {
                return res.status(204).send(generateAPIReponse(1,'Please provide title'));
            }
        } catch (error) {
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    uploadSubCategoryAssets(req, res) {
        const assets = req.files;
        const subCategoryId = req.params.id;
        console.log('uploadSubCategoryAssets files =>', assets, 'subCategoryId =>', subCategoryId);
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
            SubCategories.updateOne({ _id: subCategoryId }, queryToUpdate, { new: true }).then(subCategory => {
                return res.status(200).send(generateAPIReponse(0,'Assets uploaded successfully', subCategory));
            }).catch(error => {
                console.log('uploadSubCategoryAssets error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getSubCategoryDetailsBySlug(slug) {
        console.log('getSubCategoryDetailsBySlug slug =>', slug);
        return new Promise((resolve, reject) => {
            SubCategories.findOne({ slug: slug }).then(result => {
                resolve(result);
            }).catch(error => {
                reject(error);
            })
        })
    }
}

function getSubCategoryListDBCall() {
    return new Promise((resolve, reject) => {
        SubCategories.find().populate('category').then(subCategories => {
            resolve(subCategories);
        }).catch(error => {
            reject(error);
        })
    })
}

function addSubCategoriesDetailsDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newSubCategories = new SubCategories(params);
        newSubCategories.save().then(SubCategories => {
            resolve(SubCategories);
        }).catch((error) => {
            reject(error);
        });
    })
}

function getAssetObjectForDB(item) {
    return {
        url: `${item.path}`,
        file_name: item.filename
    }
}

const subCategoryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "banner") {
            cb(null, 'uploads/subcategory_banner');
        } else if (file.fieldname === "icon") {
            cb(null, 'uploads/subcategory_icon');
        } else if (file.fieldname === "profile") {
            cb(null, 'uploads/subcategory_profile');
        }
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
})

module.exports.uploadSubCategoryConfig = multer({ storage: subCategoryStorage });
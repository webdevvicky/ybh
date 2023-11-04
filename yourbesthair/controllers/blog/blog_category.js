const blogCategory = require('../../models/blog_category');
const categories = require('../../models/categories');
const { generateAPIReponse } = require('../../utils/response');
const { getFilterDataListQuery } = require('../../utils/functions');

const categoryId = async () => {
    const checkAttri = await blogCategory.findOne({}).sort({ _id: -1 }).lean().exec();
    if (checkAttri && checkAttri.id) {
        let tempId = checkAttri.id;
        tempId = Number(tempId.slice(-5));
        const generatedId = tempId + 1;
        categoryId = generatedId;
    }
    return categoryId;
}

module.exports = {
    async createBlogCategory(req, res) {
        const params = req.body;
       
            params['id'] = await categoryId();
        
        let queryToUpdate = {};            
        queryToUpdate['parent_blog_cat'] = req.body.parent_blog_cat;
        queryToUpdate['name'] = req.body.name;
        queryToUpdate['active_status'] = req.body.active_status;
        queryToUpdate['slug'] = req.body.slug;
        queryToUpdate['meta_title'] = req.body.meta_title;
        queryToUpdate['meta_description'] = req.body.meta_description;
        queryToUpdate['meta_keywords'] = req.body.meta_keywords;
    
        try {
            const BlogCategoryData = await addBlogCategoryDetailsDBCall(queryToUpdate);
            return res.status(200).send(generateAPIReponse(0,'Category created successfully', BlogCategoryData));
        } catch (error) {
            console.log('create blog category error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getBlogCategoryById(req, res) {
        blogCategory.find()
        .populate("parent_blog_cat")
        .then(data => {
            let result = categorytree(data);
            return res.status(200).send(generateAPIReponse(0,'category details fetched successfully', result));
        }).catch(error => {
            console.log('getCustomerDetailsById error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getBlogCategoryList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if (isNaN(page) && isNaN(limit)){
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : 
            { "$expr": { "$ne": ["$active_status", "3"] } }
            if (queryParams.name) {
                filterQuery['$or'] = [
                    { name: { "$regex": `.*${queryParams.name}.*`, "$options": "i" } }
                ]
            }
            if (queryParams.active_status) {
                filterQuery['$or'] = [
                    { active_status: { "$regex": `${queryParams.active_status}`, "$options": "i" } }
                ]
            } 
            blogCategory.aggregate([{
                $match: filterQuery
            }, 
            {
                $project: {'name':1, 'slug':1, 'parent_blog_cat':1, 
                'meta_keywords':1, 'blog_category_uuid':1,
                'meta_title':1, 'meta_description':1,
                'created_at':1, 'active_status':1 }
            },
            // { "$lookup": {
            //     "from": "blogCategory",
            //     "let": { "parent_blog_cat": "$parent_blog_cat" },
            //     "pipeline": [{ "$match": { "$expr": { "$eq": ["$blog_category_id", "$$parent_blog_cat"] }}}],
            //     "as": "parent_blog_cat"
            // }},
          // { $lookup: {from: 'blog_category', localField: 'parent_blog_cat', foreignField: '_id', as:'parent_blog_cat'} },
        ])
        .then(blogCategories => {
                let result = categorytree(blogCategories);
                return res.status(200).send(generateAPIReponse(0,'blogCategories list fetched successfully', result));
            }).catch(error => {
                console.log('getblogCategoriesList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : 
            { "$expr": { "$ne": ["$active_status", "3"] } }
            if (queryParams.name) {
                filterQuery['$or'] = [
                    { name: { "$regex": `.*${queryParams.name}.*`, "$options": "i" } }
                ]
            }
            if (queryParams.active_status) {
                filterQuery['$or'] = [
                    { active_status: { "$regex": `${queryParams.active_status}`, "$options": "i" } }
                ]
            }
            blogCategory.aggregate([{
                $match: filterQuery
            },
            { $sort: { created_at: -1 } },
            {
                $project: {'name':1, 'slug':1, 'parent_blog_cat':1, 
                'meta_keywords':1, 'blog_category_uuid':1,
                'meta_title':1, 'meta_description':1,
                'created_at':1, 'active_status':1 }
            },
            // { "$lookup": {
            //     "from": "blogCategory",
            //     "let": { "parent_blog_cat": "$parent_blog_cat" },
            //     "pipeline": [{ "$match": { "$expr": { "$eq": ["$blog_category_id", "$$parent_blog_cat"] }}}],
            //     "as": "parent_blog_cat"
            //   }},
             // { $lookup: {from: 'blog_category', localField: 'parent_blog_cat', foreignField: '_id', as:'parent_blog_cat'} },
            { '$facet'    : {
                metadata: [ { $count: "total" } ],
                data: [ { $skip: skip }, { $limit: limit }]// add projection here wish you re-shape the docs
            } }
        ])
        .then(blogCategories => {
                let result = categorytree(blogCategories);
                return res.status(200).send(generateAPIReponse(0,'blogCategories list fetched successfully', result));
            }).catch(error => {
                console.log('getblogCategoriesList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async bulkDeleteBlogCategory(req, res){
        //res.send("Blog delete");
        const id = req.params.id;
		const arr = id.split(',');
        try{
            blogCategory.updateMany({_id:{$in: arr}},{ $set: { active_status:"3" } },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Blog Category deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteBlogCategoryById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    async updateBlogCategoryById(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('Update Category id =>', id, 'params =>', params);
        try {
            const updateBlogCategoryData = await updateBlogCategoryByIdDBCall(params, id);
            return res.status(200).send(generateAPIReponse(0,'Blog Category status updated successfully', updateBlogCategoryData));
        } catch (error) {
            console.log('update Category error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async deleteBlogCategoryById(req, res){
        const id = req.params.id;
        try{
            blogCategory.findOneAndUpdate({_id: id },{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (blogPostCategories) {
                        return res.status(200).send(generateAPIReponse(0,'Blog Post Category deleted successfully..!!'));
                });
            }catch (error) {
                console.log('deleteBlogPostCategoryById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },
}

/**
 * INFO: Suporting function to create sub category
 * @param {Array} _category 
 * @returns Category tree
 */
 const categorytree = (_category) => {
    let _result = [], _obj = {};
    _category.forEach(a => {
        if (_obj[a._id] && _obj[a._id].children) {
            a.children = _obj[a._id] && _obj[a._id].children;
        }
        _obj[a._id] = a;
        if (!a.parent_id) {
            _result.push(a);
        } else {
            _obj[a.parent_id] = _obj[a.parent_id] || {};
            _obj[a.parent_id].children = _obj[a.parent_id].children || [];
            _obj[a.parent_id].children.push(a);
        }
    });
    _result = responseFormatter(_result)
    return _result;
};

/**
 * INFO: Format response
 * @param {*} _result 
 * @returns 
 */
const responseFormatter = (_result) => {
    _result = _result.map(x => {
        let _item = { data: {}, children: [] };
        if (x.children && x.children.length) {
            _item['data'] = x;
            _item['children'] = x.children && x.children.length? responseFormatter(x.children): [];
        } else {
            _item['data'] = x;
        }
        return _item;
    })
    return _result;
}

function addBlogCategoryDetailsDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newCategory = new blogCategory(params);
        newCategory.save().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        });
    })
}

function updateBlogCategoryByIdDBCall(params, id) {
    return new Promise(async(resolve, reject) => {
        blogCategory.findOneAndUpdate({ "_id": id}, params, { new: true, useFindAndModify: false }).then(data => {
            resolve(data);
        }).catch(error => {
            reject(error);
        })
    })
}

function deleteBlogCategoryByIdDBCall(param, id) {
    return new Promise(async(resolve, reject) => {
        blogCategory.findOneAndDelete({ "_id": id}).then(data => {
            resolve(data);
        }).catch(error => {
            reject(error);
        });
    })
}
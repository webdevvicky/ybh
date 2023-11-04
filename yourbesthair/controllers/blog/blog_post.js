const blogPost = require('../../models/blog_post');
const { generateAPIReponse } = require('../../utils/response');
const { getQueryProject } = require('../../utils/functions');
const { getFilterDataListQuery } = require('../../utils/functions');
const multer = require('multer');

module.exports = {
    async createBlogPost(req, res) {
            let queryToUpdate = {};            
            queryToUpdate['blog_id'] = req.body.blog_id;
            queryToUpdate['blog_category_id'] = req.body.blog_category_id;
            queryToUpdate['blog_post_name'] = req.body.blog_post_name;
            queryToUpdate['title'] = req.body.title;
            queryToUpdate['active_status'] = req.body.active_status;
            queryToUpdate['author'] = req.body.author;
            queryToUpdate['content'] = req.body.content;
            queryToUpdate['post_content'] = req.body.post_content;
            queryToUpdate['meta_title'] = req.body.meta_title;
            queryToUpdate['meta_description'] = req.body.meta_description;
            queryToUpdate['meta_keywords'] = req.body.meta_keywords;

            try {
                const BlogPostData = await addBlogPostDBCall(queryToUpdate);
                return res.status(200).send(generateAPIReponse(0,'Blog post created successfully', BlogPostData));
            } catch (error) {
                console.log('create blog post error =>', error.message);
                if (error.resCode)
                    return res.status(error.resCode).send(generateAPIReponse(error.message));
                else
                    return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    uploadBlogPostImage(req, res) {
        const file = req.file;
        const blogId = req.params.id;
        console.log('uploadBlogPostImage file =>', file, 'blogId =>', blogId);
        if (!file) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            const dataToUpdate = {
                blog_image: {
                    url: `${file.path}`,
                    file_name: file.filename
                }
            }
            blogPost.findByIdAndUpdate(blogId, dataToUpdate, { new: true }).then(blog => {
                return res.status(200).send(generateAPIReponse(0,'Blog Image uploaded successfully', blog));
            }).catch(error => {
                console.log('uploadBlogPostImage error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    getAllBlogPostByCategory(req, res) {
        const id = req.params.id;
        console.log('******** Get All Blog Post *********');
        console.log('Blog category Id =>', id);
        blogPost.find({ category_id: id }, getQueryProject([
            '_id', 'title', 'sub_title', 'author',
            'created_at', 'updated_at'
        ]))
        .populate("blog_category_id")
        .then(data => {
            return res.status(200).send(generateAPIReponse(0,'All blog Post fetched successfully', data));
        }).catch(error => {
            console.log('get all blog post error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getBlogPostById(req, res) {
        const id = req.params.id;
        console.log('******** Get Blog Post *********');
        console.log('Blog post Id =>', id);
        blogPost.find({ _id: id }, getQueryProject([
            '_id', 'title', 'sub_title', 'author', 'content', 
            'blog_category_id','blog_image',
            'created_at', 'updated_at'
        ]))
        .populate("blog_category_id")
        .then(customer => {
            return res.status(200).send(generateAPIReponse(0,'Blog post fetched successfully', customer));
        }).catch(error => {
            console.log('get blog post error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getBlogPostList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if (isNaN(page) && isNaN(limit)){
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : 
        { "$expr": { "$ne": ["$active_status", "3"] } }
        if (queryParams.category_name) {
            filterQuery['$or'] = [
                { category_name: { "$regex": `.*${queryParams.category_name}.*`, "$options": "i" } }
            ]
        }
        if (queryParams.active_status) {
            filterQuery['$or'] = [
                { active_status: { "$regex": `${queryParams.active_status}`, "$options": "i" } }
            ]
        }
        blogPost.aggregate([{
            $match: filterQuery
        },
        { $lookup: {from: 'blogcategories', localField: 'blog_category_id', foreignField: '_id', as:'blog_category_id'} },
        {
            $project: {'blog_post_name':1, 'title':1, 'author':1,
            'content':1, 'post_content':1, 'meta_title':1, 'meta_description':1,
            'meta_keywords':1, 'blog_uuid':1,
            'created_at':1, 'active_status':1, 'blog_category_id':1, 'blog_image':1 }
        }
    ]).then(blogPost => {
            return res.status(200).send(generateAPIReponse(0,'blogPost list fetched successfully', blogPost));
        }).catch(error => {
            console.log('getblogPostList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
        }else{
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : 
        { "$expr": { "$ne": ["$active_status", "3"] } }
        if (queryParams.category_name) {
            filterQuery['$or'] = [
                { category_name: { "$regex": `.*${queryParams.category_name}.*`, "$options": "i" } }
            ]
        }
        if (queryParams.active_status) {
            filterQuery['$or'] = [
                { active_status: { "$regex": `${queryParams.active_status}`, "$options": "i" } }
            ]
        }
        blogPost.aggregate([{
            $match: filterQuery
        },
        { $sort: { created_at: -1 } },
        {
            $project: {'blog_post_name':1, 'title':1, 'author':1,
            'content':1, 'post_content':1, 'meta_title':1, 'meta_description':1,
            'meta_keywords':1, 'blog_uuid':1,
            'created_at':1, 'active_status':1 , 'blog_category_id':1, 'blog_image':1}
        },
        { $lookup: {from: 'blogcategories', localField: 'blog_category_id', foreignField: '_id', as:'blog_category_id'} },
        { '$facet'    : {
            metadata: [ { $count: "total" } ],
            data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
        } }
    ]).then(blogPost => {
            return res.status(200).send(generateAPIReponse(0,'blogPost list fetched successfully', blogPost));
        }).catch(error => {
            console.log('getblogPostList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
        }
    },

    async deleteBlogPostById(req, res){
        const id = req.params.id;
        try{
            blogPost.findOneAndUpdate({_id: id },{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (blogPosts) {
                        return res.status(200).send(generateAPIReponse(0,'Blog Post deleted successfully..!!'));
                });
            }catch (error) {
                console.log('deleteBlogPostById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    async bulkDeleteBlogPost(req, res){
        //res.send("Blog Post delete");
        const id = req.params.id;
		const arr = id.split(',');
        try{
            blogPost.updateMany({_id:{$in: arr}},{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Blog Post deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteBlogPostById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    async updateBlogPostById(req, res) {
        const params = req.body;
        const id = req.params.id;
        try {
            const updateData = await updatePost(params, id);
            return res.status(200).send(generateAPIReponse(0,'Blog Post status update successfully', updateData));
        } catch (error) {
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
}

function updatePost(params, id) {
    return new Promise(async(resolve, reject) => {
        blogPost.findOneAndUpdate({ "_id": id}, params, { new: true, useFindAndModify: false }).then(data => {
            resolve(data);
        }).catch(error => {
            reject(error);
        })
    })
}

function addBlogPostDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newPost = new blogPost(params);
        newPost.save().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        });
    })
}

const blogBanner = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/post_banner');
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
});

module.exports.uploadPostConfig = multer({ storage: blogBanner });
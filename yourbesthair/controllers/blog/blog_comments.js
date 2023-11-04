const blogComment = require('../../models/blog_comment');
const { generateAPIReponse } = require('../../utils/response');
const { getQueryProject } = require('../../utils/functions');
const { getFilterDataListQuery } = require('../../utils/functions');
module.exports = {
    async createBlogPostComment(req, res) {
        const params = req.body;
        try {
            const BlogComment = await addBlogPostCommentDBCall(params);
            return res.status(200).send(generateAPIReponse(0,'Comment submitted successfully', BlogComment));
        } catch (error) {
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async updateCommentStatusById(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('Update comment id =>', id, 'params =>', params);
        try {
            const updateCommentData = await updateBlogCommentByIdDBCall(params, id);
            return res.status(200).send(generateAPIReponse(0,'Blog comment status updated successfully', updateCommentData));
        } catch (error) {
            console.log('update comment error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getBlogPostCommentById(req, res) {
        const id = req.params.id;
        console.log('Blog post Id =>', id);
        blogComment.find({ post_id: id }, getQueryProject([
            '_id', 'name', 'email',
            'comment', 'active_status'
        ])).then(comments => {
            return res.status(200).send(generateAPIReponse(0,'Blog comments fetched successfully', comments));
        }).catch(error => {
            console.log('Get Blog comments error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getBlogCommentList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if (isNaN(page) && isNaN(limit)){
            blogComment.find().then(comments => {
                return res.status(200).send(generateAPIReponse(0,'Blog comments fetched successfully', comments));
            }).catch(error => {
                console.log('Get Blog comments error ==>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            let filterQuery = queryParams ? getFilterDataListQuery(queryParams) : 
            { "$expr": { "$ne": ["$active_status", "3"] } }
            if (queryParams.post_name) {
                filterQuery['$or'] = [
                    { post_name: { "$regex": `.*${queryParams.post_name}.*`, "$options": "i" } }
                ]
            }
            if (queryParams.active_status) {
                filterQuery['$or'] = [
                    { active_status: { "$regex": `${queryParams.active_status}`, "$options": "i" } }
                ]
            }
            blogComment.aggregate([{
                $match: filterQuery
            },
            { $sort: { created_at: -1 } },
            {
                $project: {'name':1, 'email':1,
                'comment':1, 'active_status':1}
            },
            { '$facet'    : {
                metadata: [ { $count: "total" } ],
                data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
            } }
        ]).then(blogComment => {
                return res.status(200).send(generateAPIReponse(0,'blogComment list fetched successfully', blogComment));
            }).catch(error => {
                console.log('getblogCommentList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async deleteCommentStatusById(req, res){
        const id = req.params.id;
        try{
            blogComment.findOneAndUpdate({_id: id },{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (blogComments) {
                        return res.status(200).send(generateAPIReponse(0,'Blog Comment deleted successfully..!!'));
                });
            }catch (error) {
                console.log('deleteBlogCommentsById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    async bulkDeleteBlogComment(req, res){
        const id = req.params.id;
		const arr = id.split(',');
        try{
            blogComment.updateMany({_id:{$in: arr}},{ $set: { active_status:"3" } },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Blog Comments deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteBlogCommentsById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    }
}

function addBlogPostCommentDBCall(params) {
    return new Promise(async(resolve, reject) => {
        const newComment = new blogComment(params);
        newComment.save().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        });
    })
}

function updateBlogCommentByIdDBCall(params, id) {
    return new Promise(async(resolve, reject) => {
        blogComment.findOneAndUpdate({'_id':id}, params, { new: true }).then(data => {
            resolve(data);
        }).catch(error => {
            reject(error);
        })
    })
}
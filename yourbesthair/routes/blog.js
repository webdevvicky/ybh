const express = require('express');
const router = express.Router();
const {
    createBlogCategory,
    getBlogCategoryById,
    getBlogCategoryList,
    bulkDeleteBlogCategory,
    updateBlogCategoryById,
    deleteBlogCategoryById,
} = require('../controllers/blog/blog_category');
const {
    uploadPostConfig,
    createBlogPost,
    uploadBlogPostImage,
    getAllBlogPostByCategory,
    getBlogPostById,
    getBlogPostList,
    updateBlogPostById,
    deleteBlogPostById,
    bulkDeleteBlogPost
} = require('../controllers/blog/blog_post');
const {
    createBlogPostComment,
    getBlogPostCommentById,
    getBlogCommentList,
    updateCommentStatusById,
    deleteCommentStatusById,
    bulkDeleteBlogComment
} = require('../controllers/blog/blog_comments');

const favouritesRoutes = require('./blog');

router.post('/createcategory', createBlogCategory);
router.put('/updatecategory/:id', updateBlogCategoryById);
router.delete('/deletecategory/:id', deleteBlogCategoryById);
router.get('/category/list', getBlogCategoryById);
router.get('/blogs', getBlogCategoryList);
router.delete('/bulkDeleteBlogCategory/:id',bulkDeleteBlogCategory);
router.post('/createpost', uploadPostConfig.fields([
    { name: 'banner' }
]), createBlogPost);
router.post('/upload/image/:id', uploadPostConfig.single('blog_image'), uploadBlogPostImage);
router.put('/updatepost/:id', updateBlogPostById);
router.delete('/deletepost/:id', deleteBlogPostById);
router.delete('/bulkDeleteBlogPost/:id',bulkDeleteBlogPost);
router.get('/post/list/:id', getAllBlogPostByCategory);
router.get('/post/:id', getBlogPostById);
router.get('/posts', getBlogPostList);
router.post('/createcomment', createBlogPostComment);
router.put('/updatecomment/:id', updateCommentStatusById);
router.delete('/deletecomment/:id', deleteCommentStatusById);
router.get('/comment/list/:id', getBlogPostCommentById);
getBlogCommentList
router.get('/comments', getBlogCommentList);
router.delete('/bulkDeleteBlogComment/:id',bulkDeleteBlogComment);

// router.use('/favourites', favouritesRoutes);

module.exports = router;
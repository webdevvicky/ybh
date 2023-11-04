const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsersList,
    getUsersFilterList,
    getUserDetailsById,
    updateUserById,
    deleteUserById,
    bulkDeleteUser,
    uploadUserConfig,
    uploadUserAssets,
    getMyMenuItems
} = require('../controllers/users');

router.post('/', createUser);
router.get('/', getUsersList);
router.get('/users_filter',getUsersFilterList);
router.get('/:id', getUserDetailsById);
router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);
router.delete('/bulkDeleteUser/:id',bulkDeleteUser);
router.post('/upload/image/:id', uploadUserConfig.fields([
    { name: 'profile_img', maxCount: 1 }
]), uploadUserAssets);
router.get('/access/menu', getMyMenuItems)

module.exports = router;

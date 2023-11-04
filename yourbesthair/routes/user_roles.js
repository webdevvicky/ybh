const express = require('express');
const router = express.Router();
const { 
    createRole, 
    bulkDeleteRole,
    getRoleList,
    getFilterRoleList,
    updateRoleDetailsById,
    getRoleDetailsById,
    deleteRoleById
 } = require('../controllers/user_roles');

router.post('/', createRole);
router.delete('/bulkDeleteRole/:id',bulkDeleteRole);
router.get('/', getRoleList);
router.get('/role_filter', getFilterRoleList);
router.put('/:id', updateRoleDetailsById);
router.get('/:id', getRoleDetailsById);
router.delete('/:id', deleteRoleById);
module.exports = router;

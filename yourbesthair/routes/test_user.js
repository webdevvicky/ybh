const express = require('express');
const router = express.Router();
const {
    adminSignin,
    createTestUser,
    getTestUserDetailsById,
    getTestUserList,
    signupTestUser,
    updateTestUserById
} = require('../controllers/test_user');
const { authenticateToken } = require('../controllers/auth/auth_middlewares');

router.post('/signin', adminSignin);
router.post('/signup', signupTestUser);
router.post('/', authenticateToken, createTestUser);
router.get('/:id', authenticateToken, getTestUserDetailsById);
router.get('/', authenticateToken, getTestUserList);
router.put('/:id', authenticateToken, updateTestUserById);

module.exports = router;

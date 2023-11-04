const TestUsers = require('../models/test_user');
const Admin = require('../models/admin');
const { getAuthToken } = require('../controllers/auth/customer_auth');
const { generateAPIReponse } = require('../utils/response');
const { getQueryProject } = require('../utils/functions');
module.exports = {

    async adminSignin(req, res) {
        const { email, password } = req.body;
        const testUser = await TestUsers.findOne({ email })
        if (!testUser)
            return res.status(404).send(generateAPIReponse(1,'The email address you entered is invalid. Please try again or sign up below.'));
        const isPasswordValid = await testUser.isValidPassword(password);
        if (!isPasswordValid)
            return res.status(401).send(generateAPIReponse(1,'The password you entered is incorrect. Please try again.'));
        const token = getAuthToken({ id: testUser._id });
        return res.status(200).send(generateAPIReponse(0,'Logged in Successfully', { token: token, user: getAuthUserResponse(testUser) }));
    },

    async signupTestUser(req, res) {
        const params = req.body;
        console.log('signupTestUser params =>', params);
        try {
            const testUser = await createTestUserDBCall(params);
            const token = getAuthToken({ id: testUser._id });
            return res.status(200).send(generateAPIReponse(0,'Test user signed up successfully', { token: token, user: getAuthUserResponse(testUser) }));
        } catch (error) {
            console.log('signupTestUser error =>', error);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async createTestUser(req, res) {
        const params = req.body;
        console.log('createTestUser params ==>', params);
        try {
            const testUser = await createTestUserDBCall(params);
            return res.status(200).send(generateAPIReponse(0,'Test User created successfully', testUser));
        } catch (error) {
            console.log('createTestUser error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getTestUserDetailsById(req, res) {
        const id = req.params.id;
        console.log('getTestUserDetailsById Id =>', id);
        TestUsers.findOne({ _id: id }, getQueryProject([
            '_id', 'user_name', 'first_name', 'last_name', 'email',
            'street_address', 'city', 'state', 'country', 'zip_code',
            'phone_number', 'created_at'
        ])).then(testUser => {
            return res.status(200).send(generateAPIReponse(0,'Test User details fetched successfully', testUser));
        }).catch(error => {
            console.log('getTestUserDetailsById error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    getTestUserList(req, res) {
        console.log('getTestUserList');
        TestUsers.find({ "active_status": { $ne: "3" } }, getQueryProject([
            '_id', 'full_name', 'user_name', 'first_name', 'last_name', 'email', 'created_at'
        ])).sort({ created_at: -1 }).then(testUsers => {
            return res.status(200).send(generateAPIReponse(0,'Test User list fetched successfully', testUsers));
        }).catch(error => {
            console.log('getTestUserList error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async updateTestUserById(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('updateTestUserById id =>', id, 'params =>', params);
        TestUsers.findOneAndUpdate({ _id: id }, params, { new: true }).select('_id  user_name first_name last_name email street_address city state country zip_code phone_number created_at')
            .then(testUser => {
                return res.status(200).send(generateAPIReponse(0,'Test user details saved successfully', testUser));
            }).catch(error => {
                console.log('updateTestUserById error =>', error);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
    }
}

function createTestUserDBCall(params) {
    console.log('createTestUserDBCall =>', params)
    return new Promise(async (resolve, reject) => {
        const isEmailExist = await TestUsers.exists({ email: params.email });
        if (isEmailExist)
            return reject({ resCode: 409, message: 'The email you entered is already exist, Please try with another one.' })
        const newTestUser = new TestUsers(params);
        newTestUser.save()
            .then(async (testUser) => {
                resolve(testUser);
            })
            .catch((err) => {
                reject({ resCode: 500, message: err.message })
            });
    })
}

function getAuthUserResponse(user) {
    return {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
    }
}
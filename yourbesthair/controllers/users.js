const Users = require('../models/users');
const { getStatusObjectWithStatusKey } = require('../utils/functions');
const { generateAPIReponse } = require('../utils/response')
const { getQueryProject } = require('../utils/functions');
const multer = require('multer');


module.exports = {
    async createUser(req, res) {
        const params = req.body;
        console.log('createUser params', params);
        try {
            const isEmailExist = await Users.exists({ email: params.email });
            if (isEmailExist)
                return res.status(409).send(generateAPIReponse(1,'The email you entered is already exist, Please try with another one.'));
            const user = await createUserDbCall(params);
            params.user_role_id = req.body.user_role_id;
            return res.status(200).send(generateAPIReponse(0,'User created successfully', user));
        } catch (error) {
            console.log('createUser error =>', error.message);
            if (error.resCode)
                return res.status(error.resCode).send(generateAPIReponse(error.message));
            else
                return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async updateUserById(req, res) {
        const id = req.body.id;
        const params = req.body;
        console.log('updateUserById id =>', id, 'params =>', params);
        try {
            const user = await updateUserDetailsById(id, params);
            console.log(user);
            return res.status(200).send(generateAPIReponse(0,'User updated successfully', user));
        } catch (error) {
            console.log('updateUserById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    getUsersList(req, res) {
        const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
        if(isNaN(page) && isNaN(limit)){
            Users.find().then(user => {
                return res.status(200).send(generateAPIReponse(0,'User details fetched successfully', user));
            }).catch(error => {
                console.log('getUserDetailsById error ==>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }else{
            Users.find({ "active_status": { $ne: "3" } }, getQueryProject([
                'first_name', 'last_name', 'user_name', 'email',
                'role', 'active_status'
            ]))
            .populate('role', 'role_name').sort({ created_at: -1 })
            Users.aggregate([
                { '$facet'    : {
                    metadata: [ { $count: "total" } ],
                    data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
                } }
            ])
            .then(users => {
                return res.status(200).send(generateAPIReponse(0,'Users list fetched successfully', users));
            }).catch(error => {
                console.log('getUsersList error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

    async getUsersFilterList(req, res) {
        //res.send('User Filter List');
        try {
            const users = await Users.find({
                user_name: req.query.user_name,
				email: req.query.email
            })
            return res.status(200).send(generateAPIReponse(0,'Users Filter list fetched successfully', users));
          } catch (err) {
            console.log('getUsersFilterList error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
          }
    },

    getUserDetailsById(req, res) {
        const id = req.params.id;
        console.log('getUserDetailsById Id =>', id);
        Users.findOne({ _id: id }).then(user => {
            return res.status(200).send(generateAPIReponse(0,'User details fetched successfully', user));
        }).catch(error => {
            console.log('getUserDetailsById error ==>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    async deleteUserById(req, res) {
        const id = req.params.id;
        console.log('deleteUserById id =>', id);
        const status = getStatusObjectWithStatusKey(3)
        try {
            await updateUserDetailsById(id, status);
            return res.status(200).send(generateAPIReponse(0,'User deleted successfully'));
        } catch (error) {
            console.log('deleteUserById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },

    async bulkDeleteUser(req, res){
        //res.send("User delete");
        const id = req.params.id;
        const arr = id.split(',');
        try{
            Users.updateMany({_id:{$in: arr}},{ $set: { active_status: "3"}  },{ returnOriginal: false },
                    function (users) {
                        return res.status(200).send(generateAPIReponse(0,'User deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteUserById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

    uploadUserAssets(req, res) {
        const assets = req.files;
        const userId = req.params.id;
        console.log('uploadUserAssets files =>', assets, 'userId =>', userId);
        if (!assets) {
            return res.status(404).send(generateAPIReponse(1,'No files Available'));
        } else {
            let queryToUpdate = {
                $set: {}
            }
            if (assets.profile_img) {
                const profile_img = getAssetObjectForDB(assets.profile_img[0]);
                queryToUpdate.$set['profile_img'] = profile_img;
            }
            Users.updateOne({ _id: userId }, queryToUpdate, { new: true }).then(user => {
                return res.status(200).send(generateAPIReponse(0,'Assets uploaded successfully', user));
            }).catch(error => {
                console.log('uploadUserAssets error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },

	getMyMenuItems(req, res) {
		const id = req.user.id;
		console.log('getMyMenuItems Id =>', id);
		Users.findOne({ _id: id }).populate('role').then(user => {
			return res.status(200).send(generateAPIReponse(0,'Menu items fetched successfully', user.role.menu_access));
		}).catch(error => {
			console.log('getMyMenuItems error ==>', error.message);
			return res.status(500).send(generateAPIReponse(1,error.message));
		})
	}
}

function createUserDbCall(params) {
    return new Promise(async (resolve, reject) => {
        const newUser = new Users(params);
        newUser.save().then(user => {
            resolve(user);
        }).catch((error) => {
            reject(error);
        });
    })
}

function updateUserDetailsById(id, data) {
    return new Promise((resolve, reject) => {
        Users.findOneAndUpdate(id, data, { new: true }).then(result => {
            resolve(result);
        }).catch(error => {
            reject(error);
        })
    })
}

function getAssetObjectForDB(item) {
    return {
        url: `${item.path}`,
        file_name: item.filename
    }
}

const userStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "profile_img") {
            cb(null, 'uploads/user_profile');
        }
    },
    filename: (req, file, cb) => { cb(null, `${req.params.id}-${file.originalname}`); }
})

module.exports.uploadUserConfig = multer({ storage: userStorage });
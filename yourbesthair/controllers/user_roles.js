const UserRoles = require('../models/user_roles');
const { generateAPIReponse } = require('../utils/response');
const { getStatusObjectWithStatusKey } = require('../utils/functions');

module.exports = {

	async getRoleIdByRoleName(roleName) {
		return new Promise((resolve) => {
			UserRoles.findOne({ role_name: roleName })
				.then(role => {
					resolve(role._id);
				});
		});
	},

	async createRole(req, res) {
		//console.log("save");
		const params = req.body;
		//console.log('createRole params', params);
		try {
			const role = await createRoleDbCall(params);
			params.user_role_id = req.body.user_role_id;
			return res.status(200).send(generateAPIReponse(0,'Role created successfully', role));
		} catch (error) {
			console.log('createRole error =>', error.message);
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	},

	async bulkDeleteRole(req, res){
        //res.send("Role delete");
        const id = req.params.id;
		const arr = id.split(',');
        try{
            UserRoles.updateMany({_id:{$in: arr}},{ $set: { active_status: "3"} },{ returnOriginal: false },
                    function (roles) {
                        return res.status(200).send(generateAPIReponse(0,'Role deleted successfully..!!'));
                });
            }catch (error) {
                console.log('bulkDeleteRoleById error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            }
    },

	getRoleList(req, res) {
		const queryParams = req.query;
        let page = parseInt(queryParams.page);
        let limit = parseInt(queryParams.limit);
        let skip =  (page - 1) * limit + 0;
		if(isNaN(page) && isNaN(limit)){
			UserRoles.find().then(role => {
				return res.status(200).send(generateAPIReponse(0,'Role details fetched successfully', role));
			}).catch(error => {
				console.log('getRoleDetailsById error ==>', error.message);
				return res.status(500).send(generateAPIReponse(1,error.message));
			})
		}else{
			UserRoles.aggregate([
				{
					$match: {
						$and: [{ "active_status": { $ne: "3" } }, { "active_status": { $ne: "0" } }]
					}
				},
				{
					$lookup: {
						from: 'users',
						as: 'users',
						let: { "roleId": "$_id" },
						pipeline: [
							{
								$match: {
									$and: [
										{ "$expr": { "$eq": ["$role", "$$roleId"] } },
										{ "active_status": { "$ne": "3" } }
									]
								}
							}
						]
					}
				},
				{ $sort: { created_at: -1 } },
				{
					"$addFields": {
						"no_of_users": { $size: "$users" }
					}
				},
				{
					$project: { users: 0 }
				},
				{ '$facet'    : {
					metadata: [ { $count: "total" } ],
					data: [ { $skip: skip }, { $limit: limit }] // add projection here wish you re-shape the docs
				} }
			]).then(roles => {
				return res.status(200).send(generateAPIReponse(0,'Role list fetched successfully', roles));
			}).catch(error => {
				console.log('getRoleList error =>', error.message);
				return res.status(500).send(generateAPIReponse(1,error.message));
			})
		}
	},

	async getFilterRoleList(req, res) {
		//res.send('Role Filter List');
		try {
            const userRoles = await UserRoles.find({
                role_name: req.query.role_name,
				role_resources: req.query.role_resources
            })
            return res.status(200).send(generateAPIReponse(0,'User Roles Filter list fetched successfully', userRoles));
          } catch (err) {
            console.log('getUserRolesFilterList error =>', err.message);
            return res.status(500).send(generateAPIReponse(1,err.message));
          }
	},

	updateRoleDetailsById(req, res) {
		const id = req.params.id;
		const params = req.body;
		console.log('updateRoleDetailsById id =>', id, 'params =>', params);
		UserRoles.findByIdAndUpdate(id, params, { new: true }).then(role => {
			return res.status(200).send(generateAPIReponse(0,'Role details updated successfully', role));
		}).catch(error => {
			console.log('updateRoleDetailsById error =>', error.message);
			return res.status(500).send(generateAPIReponse(1,error.message));
		})
	},

	getRoleDetailsById(req, res) {
		const id = req.params.id;
		console.log('getRoleDetailsById Id =>', id);
		UserRoles.findOne({ _id: id }).then(role => {
			return res.status(200).send(generateAPIReponse(0,'Role details fetched successfully', role));
		}).catch(error => {
			console.log('getRoleDetailsById error ==>', error.message);
			return res.status(500).send(generateAPIReponse(1,error.message));
		})
	},

    async deleteRoleById(req, res) {
        const id = req.params.id;
        console.log('deleteRoleById id =>', id);
        const status = getStatusObjectWithStatusKey('deleted', 'Deleted')
        try {
            await updateRoleDetailsById(id, status);
            return res.status(200).send(generateAPIReponse(0,'Role deleted successfully'));
        } catch (error) {
            console.log('deleteRoleById error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    }
};

function createRoleDbCall(params) {
	return new Promise(async (resolve, reject) => {
		const newRole = new UserRoles(params);
		newRole.save().then(role => {
			resolve(role);
		}).catch((error) => {
			reject(error);
		});
	})
}

function updateRoleDetailsById(id, data) {
    return new Promise((resolve, reject) => {
        UserRoles.findByIdAndUpdate(id, data, { new: true }).then(result => {
            resolve(result);
        }).catch(error => {
            reject(error);
        })
    })
}
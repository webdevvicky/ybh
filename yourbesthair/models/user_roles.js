const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userRolesSchema = new mongoose.Schema({
	user_role_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
    user_role_uuid: {
        type: String,
    },
	role_name: {
		type: String,
		required: true,
	},
	menu_access: String,
	role_resources: String,
	active_status: {
        type: String,
        enum : ['0', '1', '2', '3'], //3 is for deleted status 
        default: '1'
    },
});

userRolesSchema.post("save", async function (doc) {
    doc.user_role_uuid = "USER_ROLE0000" + doc.user_role_id;
    await doc.model("user_roles").findOneAndUpdate({_id: doc._id}, doc);
});

userRolesSchema.plugin(AutoIncrement, {inc_field: 'user_role_id'});
userRolesSchema.methods.testMethod = function(){};
module.exports = mongoose.model('user_roles',userRolesSchema);
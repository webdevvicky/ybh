const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const blogCommentSchema = new mongoose.Schema({
	blog_comment_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },

    blog_comment_uuid: {
        type: String,
    },

    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post',
        required: true
    },
    post_name: {
        type: String,
        ref: 'post',
        required: true
    },
	name: {
		type: String,
		required: true
	},
    email: {
		type: String,
		required: false
	},
    comment: {
		type: String,
		required: true
	},
    response_to: {
		type: String,
		required: true
	},
	active_status: {
        type: String,
        enum : ['0', '1', '2'], 
        default: '2'
    },
	meta_title: {
		type: String,
		default: this.name
	},
	meta_description: {
		type: String,
		default: this.name
	},
	meta_keywords: {
		type: String,
		default: this.name
	}
},{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

blogCommentSchema.post("save", async function (doc) {
    doc.blog_comment_uuid = "BlogComment0000" + doc.blog_comment_id;
    await doc.model("blogComments").findOneAndUpdate({_id: doc._id}, doc);
  });

  blogCommentSchema.plugin(AutoIncrement, {inc_field: 'blog_comment_id'});
  blogCommentSchema.methods.testMethod = function(){};
module.exports = mongoose.model('blogComments',blogCommentSchema);
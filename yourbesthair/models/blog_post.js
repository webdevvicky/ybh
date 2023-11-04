const mongoose = require('mongoose');
const fileSchema = require('./file');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const blogPostSchema = new mongoose.Schema({
	blog_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
	blog_uuid: {
        type: String,
    },
    blog_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'blogCategory'
    },
	blog_post_name: {
        type: String,
        ref: 'blogCategory'
    },
	title: {
		type: String,
		required: true
	},
	blog_image: fileSchema,
	active_status: {
        type: String,
        enum : ['0', '1', '3'], //3 is for deleted 
        default: '1'
    },
    author: {
		type: String,
		required: false
	},
    content: {
		type: String,
		required: true
	},
	post_content: {
		type: String,
		required: false
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

blogPostSchema.post("save", async function (doc) {
    doc.blog_uuid = "Blog0000" + doc.blog_id;
    await doc.model("blogPost").findOneAndUpdate({_id: doc._id}, doc);
  });

blogPostSchema.plugin(AutoIncrement, {inc_field: 'blog_id'});
blogPostSchema.methods.testMethod = function(){};
module.exports = mongoose.model('blogPost',blogPostSchema);


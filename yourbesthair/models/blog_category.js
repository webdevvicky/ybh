const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const blogCategorySchema = new mongoose.Schema({
	blog_category_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },

	parent_blog_cat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'blogCategory',
        default: null
    },

    blog_category_uuid: {
        type: String,
    },

	name: {
		type: String,
		required: true,
		unique: true
	},

	slug: {
		type: String,
		required: true
	},

	active_status: {
        type: String,
        enum : ['0', '1', '2', '3'], 
        default: '1'
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

blogCategorySchema.post("save", async function (doc) {
    doc.blog_category_uuid = "BlogCat0000" + doc.blog_category_id;
    await doc.model("blogCategory").findOneAndUpdate({_id: doc._id}, doc);
  });

blogCategorySchema.plugin(AutoIncrement, {inc_field: 'blog_category_id'});
blogCategorySchema.methods.testMethod = function(){};
module.exports = mongoose.model('blogCategory',blogCategorySchema);
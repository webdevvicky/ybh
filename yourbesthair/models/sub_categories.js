// const mongoose = require('mongoose');
// const AutoIncrement = require('mongoose-sequence')(mongoose);
// const fileSchema = require('./file');

// const subCategorySchema = new mongoose.Schema({
//     sub_categories_id:{
//         type:Number,
//         autoIncrement: true,
//         primaryKey: true
//     },

//     sub_categories_uuid: {
//         type: String,
//     },

//     category: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'categories'
//     },
//     name: {
//         type: String,
//         required: true,
//     },
//     slug: {
//         type: String,
//         required: true,
//     },
//     active_status: {
//         type: String,
//         enum : ['0', '1'],
//         default: '1'
//     },
//     description1: String,
// 	description2: String,
// 	banner: fileSchema,
// 	icon: fileSchema,
//     meta_title: String,
//     meta_description: String,
// }, {
//     timestamps: {
//         createdAt: 'created_at',
//         updatedAt: 'updated_at'
//     }
// });

// subCategorySchema.post("save", async function (doc) {
//     doc.sub_categories_uuid = "SUBCAT0000" + doc.sub_categories_id;
//     await doc.model("sub_categories").findOneAndUpdate({_id: doc._id}, doc);
// });

// subCategorySchema.plugin(AutoIncrement, {inc_field: 'sub_categories_id'});
// subCategorySchema.methods.testMethod = function(){};
// module.exports = mongoose.model('sub_categories',subCategorySchema);
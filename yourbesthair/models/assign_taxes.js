const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const assignTaxSchema = new mongoose.Schema({
    assign_tax_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },

    assign_tax_uuid: {
        type: String,
    },

    general_settings: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'general_settings'
    },
    services: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'services'
    },
    isDeleted: {type: Boolean,default: false}
}, 
{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

assignTaxSchema.post("save", async function (doc) {
    doc.assign_tax_uuid = "AT0000" + doc.assign_tax_id;
    await doc.model("assign_taxes").findOneAndUpdate({_id: doc._id}, doc);
  });

assignTaxSchema.plugin(AutoIncrement, {inc_field: 'assign_tax_id'});
assignTaxSchema.methods.testMethod = function(){};
module.exports = mongoose.model('assign_taxes',assignTaxSchema);
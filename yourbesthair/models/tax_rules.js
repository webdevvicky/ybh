const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const taxRuleSchema = new mongoose.Schema({
    tax_rule_id:{
        type:Number,
        autoIncrement: true,
        primaryKey: true
    },
    tax_rule_uuid: {
        type: String,
    },
    name:{
        type: String,
        required: true,
    },
    tax_rate: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'general_settings'
    },
    isDeleted: {type: Boolean,default: false}
}, 
{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

taxRuleSchema.post("save", async function (doc) {
    doc.tax_rule_uuid = "TAXRULE0000" + doc.tax_rule_id;
    await doc.model("tax_rules").findOneAndUpdate({_id: doc._id}, doc);
});

taxRuleSchema.plugin(AutoIncrement, {inc_field: 'tax_rule_id'});
taxRuleSchema.methods.testMethod = function(){};
module.exports = mongoose.model('tax_rules',taxRuleSchema);
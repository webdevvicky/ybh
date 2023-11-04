const PaymentGateway = require('../../models/payment_gateway');
const { generateAPIReponse } = require('../../utils/response');

module.exports = {
    getPaymentGatewayDetails(req, res) {
        const name = req.params.name;
        console.log('getPaymentGatewayDetails by name =>', name);
        PaymentGateway.findOne({ name: name }).then(gateways => {
            return res.status(200).send(generateAPIReponse(0,'Payment gateway details fetched successfully', gateways));
        }).catch(error => {
            console.log('getPaymentGatewayDetails error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        })
    },

    savePaymentGatewaySetting(req, res) {
        const params = req.body;
        const id = req.params.id;
        console.log('savePaymentGatewaySetting params =>', params, 'id =>', id);
        if (id) {
            PaymentGateway.findByIdAndUpdate(id, params).then(result => {
                return res.status(200).send(generateAPIReponse(0,'Payment gateway settings saved successfully', result));
            }).catch(error => {
                console.log('savePaymentGatewaySetting error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        } else {
            const paymentSettingsData = new PaymentGateway(params);
            paymentSettingsData.save().then(result => {
                return res.status(200).send(generateAPIReponse(0,'Payment gateway settings saved successfully', result));
            }).catch(error => {
                console.log('savePaymentGatewaySetting error =>', error.message);
                return res.status(500).send(generateAPIReponse(1,error.message));
            })
        }
    },
}
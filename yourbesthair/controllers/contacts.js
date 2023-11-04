const { generateAPIReponse } = require('../utils/response');
var _ = require('lodash');
const multer = require('multer');
const mongoose = require('mongoose');
const { getStatusObjectWithStatusKey } = require('../utils/functions');
const {sendContactMail} = require('./email');
module.exports = {
    async processContact(req, res) {
        const params = req.body;
        //console.log('Contact form submit', params);
        //return res.status(200).send(generateAPIReponse(0,'Form submitted', params));        
        try {         
            await sendContactMail(params);
            return res.status(200).send(generateAPIReponse(0,'We have received your message. We will get back to you shortly', params));
        } catch (error) {
            console.log('processContact error =>', error.message);
            return res.status(500).send(generateAPIReponse(1,error.message));
        }
    },
}
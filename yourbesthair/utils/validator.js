const { validationResult } = require("express-validator");
const respHandler = require('./response-handler');

const requestValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respHandler.error(res, {statuscode: 400, body: errors.array().map(m => m.msg.replace('$$', m.param))});
  }
  next();
};

module.exports = requestValidator;
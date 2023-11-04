const { generateAPIReponse } = require('../../utils/response');
let jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config/auth');

module.exports = {
    authenticateToken(req, res, next) {
        const bearerToken = req.headers.authorization;
        if (!bearerToken)
            return res.status(401).send(generateAPIReponse(1,'Please sign in or sign up before continuing.'));
        const token = bearerToken.split(' ');
        if (token[0] == 'Bearer') {
            jwt.verify(token[1], jwtSecret, function (err, decoded) {
                if (err) {
                    console.log('authenticateToken error =>', err);
                    return res.status(401).send(generateAPIReponse(1,err.message));
                }
                req.user = decoded.user;
                next();
            });
        }
        else {
            return res.status(401).send(generateAPIReponse(1,'Provided token is not Bearer token, Please provide valid token'));
        }
    }
}
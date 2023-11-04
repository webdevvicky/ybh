const { errorMessage } = require("./error-handler");


module.exports = {
    ERROR_MESSAGES: errorMessage,
    success: (res, opt) => {
        return res
            .status(200)
            .json({
                'statuscode': 200,
                body: opt.body,
                message: opt.message
            })
    },
    error: (res, opt) => {
        return res
            .status(opt.statuscode || 400)
            .json({
                'statuscode': opt.statuscode || 400,
                body: opt.body || '',
                message: opt.message
            });
    }
};

const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    logger.error(err);

    if(err.isOperational){
        return res.status(err.statusCode).json({
            message: err.message,
        })
    }
    res.status(500).json({
        message: 'Internal server error'
    });
};
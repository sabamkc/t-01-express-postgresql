const { pino } = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorisation']
});

module.exports = logger;
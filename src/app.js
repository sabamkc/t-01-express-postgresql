const express = require('express');
const menuRoutes = require('./routes/menu.routes');
const httpLogger = require('./middlewares/httplogger');
const errorHandler = require('./middlewares/errorHandler');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(httpLogger);

app.use(errorHandler);

app.use(helmet());
app.use(cors());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

app.use('/health', healthRoutes);

app.use(express.json());

app.use('/api/menu-items', menuRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        message: err.message || 'Internal server error'
    })
})

module.exports = app;


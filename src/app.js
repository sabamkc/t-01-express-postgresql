const express = require('express');
const menuRoutes = require('./routes/menu.routes');

const app = express();

app.use(express.json());

app.use('/api/menu-items', menuRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        message: err.message || 'Internal server error'
    })
})

module.exports = app;


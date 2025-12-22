const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Deep health check with DB connection
router.get('/deep', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        serverTime: result.rows[0].now
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
});

module.exports = router;

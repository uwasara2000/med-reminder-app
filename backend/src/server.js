require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');
const db = require('./db/database');
const runSeed = require('./utils/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(morgan('dev'));

// Auto-seed database if empty
if (!db.data.users || db.data.users.length === 0) {
  console.log('⚡ Initializing database with demo patient and caregiver records...');
  runSeed();
}

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Medication Reminder App Backend API',
    docs: '/api/health',
    status: 'Running'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
if (require.main === module) {
  const startServer = (port) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`===================================================`);
      console.log(`💊 Medication Reminder Backend is live!`);
      console.log(`🌐 Server running at: http://localhost:${port}`);
      console.log(`🩺 Healthcheck: http://localhost:${port}/api/health`);
      console.log(`===================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${port} is currently in use. Trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server startup error:', err);
      }
    });
  };

  startServer(Number(PORT));
}

module.exports = app;

'use strict';
require('dotenv').config();

const http = require('http');
const createApp = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocketServer } = require('./src/socket/socketServer');

const PORT = process.env.PORT || 3000;

// ── Validate required env vars before starting ──────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('   Set them in Render → Environment tab and redeploy.');
  process.exit(1);
}

const start = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create Express app
  const app = createApp();

  // 3. Wrap in http.Server so Socket.IO can share the same port
  const httpServer = http.createServer(app);

  // 4. Attach Socket.IO
  initSocketServer(httpServer);

  // 5. Listen
  httpServer.listen(PORT, () => {
    console.log(`🚀 Robin-App server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`   Health → http://localhost:${PORT}/health`);
    console.log(`   API    → http://localhost:${PORT}/api/v1`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    httpServer.close(() => process.exit(1));
  });
};

start();

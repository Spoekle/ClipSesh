const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
require('dotenv').config();
const backendUrl = process.env.BACKEND_URL || 'https://api.spoekle.com';

console.log('Environment variables loaded...');

// Create necessary directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePicturesDir = path.join(__dirname, 'profilePictures');
const downloadDir = path.join(__dirname, 'download');
const chunksDir = path.join(__dirname, 'download/tmp');

[uploadsDir, profilePicturesDir, downloadDir, chunksDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://mongo:27017/clipsDB", {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
})
  .then(() => {
    console.log(`Connected to MongoDB at ${process.env.MONGODB_URI || "mongodb://mongo:27017/clipsDB"}`);
    // Only require CreateAdmin after successful MongoDB connection
    require('./scripts/CreateAdmin');
    console.log('Admin user credentials:');
    console.log(`Username: ${process.env.ADMIN_USERNAME}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD}`);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error(`Please check if MongoDB is running at ${process.env.MONGODB_URI || "mongodb://mongo:27017/clipsDB"}`);
  });

const app = express();
// Create HTTP server for Socket.IO
const server = http.createServer(app);
// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, you should restrict this
    methods: ["GET", "POST"]
  }
});

app.set('trust proxy', true);
app.use((_req, _res, next) => {
  _req.ip = _req.headers['x-forwarded-for'] || _req.socket.remoteAddress;
  next();
});

// Make Socket.IO instance available to routes
app.set('io', io);

// Increase limits for large file uploads (3GB)
app.use(bodyParser.json({ limit: '3072mb' }));
app.use(bodyParser.urlencoded({ limit: '3072mb', extended: true }));
app.use(express.json({ limit: '3072mb' }));

// Increase request timeout for large uploads
app.use((_req, _res, next) => {
  _req.setTimeout(7200000);
  next();
});

// Configure CORS with more detailed settings
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Static content serving
app.use('/uploads', express.static(uploadsDir));
app.use('/profilePictures', express.static(profilePicturesDir));
app.use('/download', express.static(downloadDir));

// Import route modules
const adminRoute = require('./routes/Admin');
const userRoute = require('./routes/User');
const clipsRoute = require('./routes/Clips');
const messagesRoute = require('./routes/Messages');
const ratingsRoute = require('./routes/Ratings');
const zipsRoute = require('./routes/Zips');
const discordRoute = require('./routes/Discord');
const configRoute = require('./routes/Config');
const notificationsRoute = require('./routes/Notifications');
const profilesRoute = require('./routes/Profiles');
const searchRoute = require('./routes/Search');
const trophiesRoute = require('./routes/Trophies');

// Register API routes
app.use('/api/admin', adminRoute);
app.use('/api/users', userRoute);
app.use('/api/clips', clipsRoute);
app.use('/api/messages', messagesRoute);
app.use('/api/ratings', ratingsRoute);
app.use('/api/zips', zipsRoute);
app.use('/api/discord', discordRoute);
app.use('/api/config', configRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/profiles', profilesRoute);
app.use('/api/search', searchRoute);
app.use('/api/trophies', trophiesRoute);

// Configure WebSocket event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    console.log('Client authenticated:', socket.id);
    socket.join('authenticated');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Swagger API documentation configuration
const swaggerDocs = require('./swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Fallback route handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Use server.listen instead of app.listen for Socket.IO
server.listen(5000, () => {
  console.log('Server with WebSocket support is running on port 5000, happy rating!');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Simple function to ensure directory exists with proper permissions
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o777 });
      console.log(`Created directory: ${directory}`);
      // Explicitly set permissions to ensure writability
      fs.chmodSync(directory, 0o777);
    } catch (err) {
      console.error(`Error creating directory ${directory}:`, err);
      throw err;
    }
  }
  return directory;
}

// Setup basic directories
let downloadDir = path.join(__dirname, '..', '..', 'download');
let chunksDir = path.join(__dirname, '..', '..', 'upload-chunks');

// Check for production environment paths
if (process.env.NODE_ENV === 'production' || fs.existsSync('/var/www/backend')) {
  downloadDir = '/var/www/backend/src/download';
  chunksDir = '/var/www/backend/src/upload-chunks';
  console.log("Using production paths for file storage");
}

// Ensure directories exist with proper permissions
ensureDirectoryExists(downloadDir);
ensureDirectoryExists(chunksDir);

console.log(`Chunks directory set to: ${chunksDir}`);
console.log(`Download directory set to: ${downloadDir}`);

// Configure multer storage for complete ZIP files
const clipsZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, downloadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

// Configure multer storage for ZIP chunks
const chunksStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadId = req.body.uploadId;
      if (!uploadId) {
        console.error('No uploadId found in request body!');
        return cb(new Error('Missing uploadId in request'));
      }
      
      console.log(`Creating chunk directory for uploadId: ${uploadId}`);
      const sessionDir = path.join(chunksDir, uploadId);
      ensureDirectoryExists(sessionDir);
      console.log(`Using session directory: ${sessionDir}`);
      cb(null, sessionDir);
    } catch (err) {
      console.error('Error setting chunk destination:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex;
    console.log(`Setting chunk filename: ${chunkIndex}`);
    cb(null, `${chunkIndex}`);
  }
});

// Create multer instances with appropriate limits
const clipsZipUpload = multer({ 
  storage: clipsZipStorage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB
});

const chunkUpload = multer({
  storage: chunksStorage,
  limits: { fileSize: 60 * 1024 * 1024 } // 60MB per chunk
});

module.exports = {
  clipsZipUpload,
  chunkUpload,
  downloadDir,
  chunksDir,
  ensureDirectoryExists
};
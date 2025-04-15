const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure directory exists with proper permissions
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o777 });
      // Set permissions to ensure writability
      fs.chmodSync(directory, 0o777);
    } catch (err) {
      console.error(`Error creating directory ${directory}:`, err);
      throw err;
    }
  }
  return directory;
}

// Setup directories
let downloadDir = path.join(__dirname, '..', '..', 'download');
let chunksDir = path.join(downloadDir, 'tmp');

// Check for production environment paths
if (process.env.NODE_ENV === 'production' || fs.existsSync('/var/www/backend')) {
  downloadDir = '/var/www/backend/src/download';
  chunksDir = path.join(downloadDir, 'tmp');
}

// Ensure directories exist
ensureDirectoryExists(downloadDir);
ensureDirectoryExists(chunksDir);

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
      // Get uploadId from body or query params
      let uploadId = req.body.uploadId || req.query.uploadId;
      
      if (!uploadId) {
        // Create a temporary directory for orphaned chunks
        const tempDir = path.join(chunksDir, 'orphaned_' + Date.now());
        ensureDirectoryExists(tempDir);
        return cb(null, tempDir);
      }
      
      const sessionDir = path.join(chunksDir, uploadId);
      ensureDirectoryExists(sessionDir);
      cb(null, sessionDir);
    } catch (err) {
      console.error('Error setting chunk destination:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Get chunkIndex from body or query params
      let chunkIndex = req.body.chunkIndex;
      if (chunkIndex === undefined && req.query.chunkIndex !== undefined) {
        chunkIndex = req.query.chunkIndex;
      }
      
      if (chunkIndex === undefined) {
        // Generate a unique filename for orphaned chunks
        const uniqueName = `orphaned_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        return cb(null, uniqueName);
      }
      
      cb(null, `${chunkIndex}`);
    } catch (err) {
      console.error('Error setting chunk filename:', err);
      cb(err);
    }
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
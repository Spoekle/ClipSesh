const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Simple function to ensure directory exists
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
  return directory;
}

// Setup basic directories
const downloadDir = path.join(__dirname, '..', '..', 'download');
const chunksDir = path.join(__dirname, '..', '..', 'upload-chunks');

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
    const uploadId = req.body.uploadId || 'default';
    const sessionDir = path.join(chunksDir, uploadId);
    ensureDirectoryExists(sessionDir);
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex;
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
  limits: { fileSize: 550 * 1024 * 1024 } // 550MB per chunk (little extra for safety)
});

module.exports = {
  clipsZipUpload,
  chunkUpload,
  downloadDir,
  chunksDir
};
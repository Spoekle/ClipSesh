const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine the appropriate download directory with fallback options
function getDownloadDirectory() {
  let baseDir;
  const defaultDir = path.join(__dirname, '..', '..', 'download');
  const productionDir = '/var/www/backend/src/download';
  
  // Try production directory if in production environment
  if (process.env.NODE_ENV === 'production' && fs.existsSync(productionDir)) {
    baseDir = productionDir;
    console.log(`Using production download directory: ${baseDir}`);
  } else {
    baseDir = defaultDir;
    console.log(`Using default download directory: ${baseDir}`);
  }
  
  // Ensure directory exists with proper permissions
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true, mode: 0o777 });
      console.log(`Created download directory: ${baseDir}`);
      fs.chmodSync(baseDir, 0o777);
    }
  } catch (error) {
    console.error(`Error creating download directory: ${error.message}`);
    // Fallback to system temp directory if needed
    baseDir = path.join(os.tmpdir(), 'clipsesh-downloads');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    console.log(`Using fallback temp directory: ${baseDir}`);
  }
  
  return baseDir;
}

// Determine chunks directory for chunked uploads
function getChunksDirectory() {
  let chunksDir;
  const defaultDir = path.join(__dirname, '..', '..', 'upload-chunks');
  const productionDir = '/var/www/backend/src/upload-chunks';
  
  if (process.env.NODE_ENV === 'production' && fs.existsSync(productionDir)) {
    chunksDir = productionDir;
  } else {
    chunksDir = defaultDir;
  }
  
  try {
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true, mode: 0o777 });
      fs.chmodSync(chunksDir, 0o777);
    }
  } catch (error) {
    console.error(`Error creating chunks directory: ${error.message}`);
    chunksDir = path.join(os.tmpdir(), 'clipsesh-chunks');
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true });
    }
  }
  
  return chunksDir;
}

// Ensure directories exist with proper permissions
const clipsZipDir = getDownloadDirectory();
const chunksDir = getChunksDirectory();

// Configure multer storage for complete ZIP files
const clipsZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, clipsZipDir);
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
    
    try {
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true, mode: 0o777 });
        console.log(`Created session directory: ${sessionDir}`);
      }
      cb(null, sessionDir);
    } catch (error) {
      console.error(`Error creating session directory: ${error.message}`);
      // Fallback to temp directory
      const tempSessionDir = path.join(os.tmpdir(), 'clipsesh-chunks', uploadId);
      if (!fs.existsSync(tempSessionDir)) {
        fs.mkdirSync(tempSessionDir, { recursive: true });
      }
      cb(null, tempSessionDir);
    }
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per chunk
});

// Export configurations for use in route handlers
module.exports = {
  clipsZipUpload,
  chunkUpload,
  clipsZipDir,
  chunksDir
};
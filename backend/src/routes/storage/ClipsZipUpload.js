const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure download directory exists
const clipsZipDir = path.join(__dirname, '..', '..', 'download');
if (!fs.existsSync(clipsZipDir)) {
  fs.mkdirSync(clipsZipDir, { recursive: true });
}

// Configure multer storage for profile pictures
const clipsZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, clipsZipDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  }
});
const clipsZipUpload = multer({ storage: clipsZipStorage });

module.exports = clipsZipUpload;
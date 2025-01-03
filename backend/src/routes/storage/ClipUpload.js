const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Upload folder stuff
const clipsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(clipsDir)) {
  fs.mkdirSync(clipsDir, { recursive: true });
}

// Configure multer storage for profile pictures
const clipsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, clipsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const clipUpload = multer({ storage: clipsStorage });

module.exports = clipUpload;
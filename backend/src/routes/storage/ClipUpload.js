const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getClipPath } = require('../../utils/seasonHelpers');

// Upload folder stuff
const clipsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(clipsDir)) {
  fs.mkdirSync(clipsDir, { recursive: true });
}

// Configure multer storage for clips with season/date organization
const clipsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Use current date to determine season and daily directory
      const uploadDate = new Date();
      const { directory } = getClipPath(clipsDir, '', uploadDate);
      cb(null, directory);
    } catch (error) {
      console.error('Error determining clip destination:', error);
      // Fallback to base clipsDir if there's an error
      cb(null, clipsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate filename with timestamp and original name
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedOriginalName}`);
  }
});
const clipUpload = multer({ storage: clipsStorage });

module.exports = clipUpload;
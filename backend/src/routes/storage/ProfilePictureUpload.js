const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure profilePictures directory exists
const profilePicturesDir = path.join(__dirname, '..', '..', 'profilePictures');
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

// Configure multer storage for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicturesDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const profilePictureUpload = multer({ storage: profilePictureStorage });

module.exports = profilePictureUpload;
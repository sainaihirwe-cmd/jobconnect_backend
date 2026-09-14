const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  if (file.fieldname === 'profilePicture' || file.fieldname === 'companyLogo') {
    const valid = allowedImageTypes.includes(file.mimetype);
    return valid ? cb(null, true) : cb(new Error('Invalid image file type. Allowed: JPG, JPEG, PNG, WEBP'));
  }

  if (file.fieldname === 'cv' || file.fieldname === 'resume') {
    const valid = allowedDocumentTypes.includes(file.mimetype);
    return valid ? cb(null, true) : cb(new Error('Invalid CV file type. Allowed: PDF, DOC, DOCX'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;

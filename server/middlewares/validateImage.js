import multer from 'multer';

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}.${file.mimetype.split('/')[1]}`);
  }
});

const imageFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpe?g|png)/i)) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 1000000 }
});

export default upload;

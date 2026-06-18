const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, _file, cb) => {
    cb(null, `${uuidv4()}.csv`);
  },
});

const fileFilter = (_req, file, cb) => {
  const isCsv = file.mimetype === 'text/csv'
    || file.mimetype === 'application/csv'
    || file.mimetype === 'application/vnd.ms-excel'
    || file.originalname.toLowerCase().endsWith('.csv');

  if (isCsv) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;

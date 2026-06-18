const logger = require('../utils/logger');

// Map Prisma error codes to human-readable messages
const PRISMA_ERRORS = {
  P2002: 'A record with this value already exists.',
  P2025: 'Record not found.',
  P2003: 'Related record not found.',
  P2014: 'Invalid relation.',
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Prisma known errors
  if (err.code && PRISMA_ERRORS[err.code]) {
    statusCode = err.code === 'P2025' ? 404 : 400;
    message = PRISMA_ERRORS[err.code];
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum size is 10MB.';
  }
  if (err.message === 'Only CSV files are allowed') {
    statusCode = 400;
    message = err.message;
  }

  // JWT errors (handled in jwt.js, these are the raw ones that slip through)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token.';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  if (statusCode === 500) {
    logger.error(`${req.method} ${req.path} → ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.path} → ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;

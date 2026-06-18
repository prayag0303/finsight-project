const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  req.user = decoded;
  next();
};

// Middleware for internal routes called by the AI service
const authenticateInternal = (req, _res, next) => {
  const key = req.headers['x-internal-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return next(new AppError('Unauthorized', 401));
  }
  next();
};

module.exports = { authenticate, authenticateInternal };

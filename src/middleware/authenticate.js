const { verifyAccess } = require('../utils/jwt');
const { AppError } = require('../utils/apiResponse');

/**
 * Verifies the Bearer JWT access token on every protected request.
 * Attaches { id, role } to req.user on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccess(token);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    return next(new AppError('Invalid token', 401));
  }
};

module.exports = { authenticate };

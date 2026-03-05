const { AppError } = require('../utils/apiResponse');

/**
 * Role-based authorization guard.
 * Usage: router.get('/admin', authenticate, authorize('ADMIN'), handler)
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Forbidden: insufficient permissions', 403));
  }
  next();
};

module.exports = { authorize };

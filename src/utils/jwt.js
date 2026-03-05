const jwt = require('jsonwebtoken');

/**
 * Sign a short-lived access token (15 min)
 */
const signAccess = (userId, role) =>
  jwt.sign({ sub: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    issuer: 'robin-app',
  });

/**
 * Sign a long-lived refresh token (7 days)
 */
const signRefresh = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'robin-app',
  });

const verifyAccess = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'robin-app' });

const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer: 'robin-app' });

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };

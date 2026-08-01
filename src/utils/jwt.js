const jwt = require('jsonwebtoken');

const signAccess = (userId, role) => {
  const expiresIn = role === 'ADMIN' ? '24h' : '15m';
  return jwt.sign({ sub: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn,
    issuer: 'robin-app',
  });
};

const signRefresh = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    issuer: 'robin-app',
  });

const verifyAccess = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'robin-app' });

const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer: 'robin-app' });

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };

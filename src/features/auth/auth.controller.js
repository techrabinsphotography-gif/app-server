const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/apiResponse');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.register({ name, email, password });
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { accessToken, user }, 'Registered successfully', 201);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login({ email, password });
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { accessToken, user }, 'Logged in');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const raw = req.cookies?.refreshToken;
    const { accessToken, refreshToken: newRt, user } = await authService.refresh(raw);
    res.cookie('refreshToken', newRt, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { accessToken, user }, 'Token refreshed');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const raw = req.cookies?.refreshToken;
    await authService.logout(raw);
    res.clearCookie('refreshToken');
    sendSuccess(res, {}, 'Logged out');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, {}, 'If that email exists, a reset link has been sent');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    sendSuccess(res, {}, 'Password reset successfully');
  } catch (err) { next(err); }
};

const verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyEmail(req.params.token);
    sendSuccess(res, {}, 'Email verified');
  } catch (err) { next(err); }
};

const sendOtp = async (req, res, next) => {
  try {
    await authService.sendOtp(req.body.email);
    sendSuccess(res, {}, 'OTP sent to your email');
  } catch (err) { next(err); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { accessToken, refreshToken, user } = await authService.verifyOtp(email, otp);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    sendSuccess(res, { accessToken, user }, 'Logged in successfully');
  } catch (err) { next(err); }
};

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword, verifyEmail, sendOtp, verifyOtp };

const crypto = require('crypto');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const { signAccess, signRefresh, verifyRefresh } = require('../../utils/jwt');
const { AppError } = require('../../utils/apiResponse');
const { sendMail } = require('../../utils/mailer');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 409);

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    name,
    email,
    passwordHash: password, // hashed by pre-save hook
    emailVerifyToken,
  });

  const verifyUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/v1/auth/verify-email/${emailVerifyToken}`;
  await sendMail(
    email,
    'Verify your Robin Studio account',
    `<p>Hi ${name},</p><p>Please verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
  ).catch(() => { }); // don't block registration if mail fails

  return _issueTokens(user);
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await user.comparePassword(password);
  if (!valid) throw new AppError('Invalid email or password', 401);

  return _issueTokens(user);
};

// ─── Refresh ──────────────────────────────────────────────────────────────────
const refresh = async (rawToken) => {
  if (!rawToken) throw new AppError('Refresh token missing', 401);

  let decoded;
  try {
    decoded = verifyRefresh(rawToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await RefreshToken.findOne({ token: rawToken, userId: decoded.sub });
  if (!stored) throw new AppError('Refresh token not recognised', 401);

  await RefreshToken.deleteOne({ _id: stored._id });

  const user = await User.findById(decoded.sub);
  if (!user) throw new AppError('User not found', 404);

  return _issueTokens(user);
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (rawToken) => {
  if (rawToken) {
    await RefreshToken.deleteOne({ token: rawToken });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return; // silent — don't reveal whether email exists

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/v1/auth/reset-password/${token}`;
  await sendMail(
    email,
    'Reset your Robin Studio password',
    `<p>Reset link (valid 30 min): <a href="${resetUrl}">${resetUrl}</a></p>`
  );
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw new AppError('Token invalid or expired', 400);

  user.passwordHash = newPassword; // hashed by pre-save hook
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (token) => {
  const user = await User.findOne({ emailVerifyToken: token });
  if (!user) throw new AppError('Invalid verification token', 400);

  user.isEmailVerified = true;
  user.emailVerifyToken = null;
  await user.save({ validateBeforeSave: false });
};

// ─── OTP Login ───────────────────────────────────────────────────────────────
const sendOtp = async (email) => {
  // Find or auto-create user by email (passwordless flow)
  let user = await User.findOne({ email });
  if (!user) {
    // Create a minimal user — no password needed for OTP flow
    const randomPass = crypto.randomBytes(16).toString('hex');
    user = await User.create({
      name: email.split('@')[0], // default name from email
      email,
      passwordHash: randomPass,
    });
  }

  // Generate 4-digit OTP
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  user.passwordResetToken = `otp:${otpHash}`;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await user.save({ validateBeforeSave: false });

  await sendMail(
    email,
    'Your Robin Studio login code',
    `
    <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;background:#0f1b2e;color:#fff;border-radius:12px;">
      <h2 style="color:#FF8E3C;margin-bottom:8px;">Robin Studio</h2>
      <p style="color:rgba(255,255,255,0.7);margin-bottom:24px;">Your one-time login code:</p>
      <div style="font-size:42px;font-weight:bold;letter-spacing:12px;text-align:center;color:#fff;background:#1a2a3a;padding:20px;border-radius:10px;">${otp}</div>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:20px;text-align:center;">Valid for 10 minutes. Do not share this code.</p>
    </div>
    `
  );
};

const verifyOtp = async (email, otp) => {
  const user = await User.findOne({
    email,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user || !user.passwordResetToken?.startsWith('otp:')) {
    throw new AppError('OTP expired or not found. Please request a new one.', 400);
  }

  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const storedHash = user.passwordResetToken.replace('otp:', '');

  if (otpHash !== storedHash) {
    throw new AppError('Invalid OTP', 400);
  }

  // Clear OTP fields
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return _issueTokens(user);
};
const _issueTokens = async (user) => {
  const accessToken = signAccess(user._id.toString(), user.role);
  const refreshToken = signRefresh(user._id.toString());

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken, user };
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, verifyEmail, sendOtp, verifyOtp };

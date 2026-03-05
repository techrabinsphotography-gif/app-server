const svc = require('./profile.service');
const { sendSuccess } = require('../../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const data = await svc.getProfile(req.user.id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await svc.updateProfile(req.user.id, req.body);
    sendSuccess(res, data, 'Profile updated');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await svc.changePassword(req.user.id, req.body);
    sendSuccess(res, {}, 'Password changed');
  } catch (err) { next(err); }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new Error('No file uploaded'));
    const data = await svc.updateAvatar(req.user.id, req.file.path);
    sendSuccess(res, data, 'Avatar updated');
  } catch (err) { next(err); }
};

const deleteAccount = async (req, res, next) => {
  try {
    await svc.deleteAccount(req.user.id);
    sendSuccess(res, {}, 'Account deleted');
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, changePassword, updateAvatar, deleteAccount };

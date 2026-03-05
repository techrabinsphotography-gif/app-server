const User = require('../../models/User');
const { AppError } = require('../../utils/apiResponse');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateProfile = async (userId, { name, phone }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { name, phone },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  user.passwordHash = newPassword; // hashed by pre-save hook
  return user.save();
};

const updateAvatar = async (userId, avatarUrl) => {
  const user = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const deleteAccount = async (userId) => {
  await User.findByIdAndDelete(userId);
};

module.exports = { getProfile, updateProfile, changePassword, updateAvatar, deleteAccount };

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
    avatarUrl: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving (only when modified)
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare plain password with hash
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Never expose passwordHash in JSON output
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.emailVerifyToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

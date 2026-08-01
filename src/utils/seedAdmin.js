'use strict';
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL    = 'Rabins.admin@robin.com';
const DEFAULT_ADMIN_PASSWORD = 'Rabins@2026';
const DEFAULT_ADMIN_NAME     = 'Rabin Admin';

const seedAdmin = async () => {
  const email    = (process.env.ADMIN_EMAIL    || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const name     = process.env.ADMIN_NAME     || DEFAULT_ADMIN_NAME;

  let admin = await User.findOne({ email }).select('+passwordHash');

  if (!admin) {
    admin = new User({
      name,
      email,
      phone: '+910000000000',
      role: 'ADMIN',
      passwordHash: password, // pre('save') hook will bcrypt this
      isEmailVerified: true,
    });
    await admin.save();
    console.log(`✅ Admin user CREATED: ${email}  (role: ADMIN)`);
    return;
  }

  // If admin exists but role changed or password doesn't match, fix it
  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  let changed = false;

  if (admin.role !== 'ADMIN') {
    admin.role = 'ADMIN';
    changed = true;
  }
  if (!admin.isEmailVerified) {
    admin.isEmailVerified = true;
    changed = true;
  }
  if (!isMatch) {
    admin.passwordHash = password; // pre('save') will re-bcrypt
    changed = true;
    console.log(`🔑 Admin password CHANGED to match env: ${email}`);
  }

  if (changed) {
    await admin.save();
    console.log(`🛠️  Admin account UPDATED: ${email}`);
    return;
  }

  console.log(`👀 Admin user OK: ${email}  (role: ${admin.role}, verified: ${admin.isEmailVerified})`);
};

module.exports = { seedAdmin };

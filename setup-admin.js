const mongoose = require('mongoose');
const uri = 'mongodb+srv://techrabinsphotography_db_user:P1v3VD4D6bun105U@cluster0.h8zldpj.mongodb.net/?appName=Cluster0';
mongoose.connect(uri).then(async () => {
  const User = require('./src/models/User');
  let user = await User.findOne({ email: 'Rabins.admin@robin.com' });
  if (!user) {
    user = new User({
      name: 'Master Admin',
      email: 'Rabins.admin@robin.com',
      passwordHash: 'Rabins@2026',
      role: 'ADMIN',
      isEmailVerified: true
    });
    await user.save();
    console.log('✅ Custom Admin user created successfully.');
  } else {
    user.role = 'ADMIN';
    if (!user.isEmailVerified) user.isEmailVerified = true;
    user.passwordHash = 'Rabins@2026';
    await user.save();
    console.log('✅ Custom Admin already exists, role updated and password reset to Rabins@2026.');
  }
  process.exit(0);
}).catch(console.error);

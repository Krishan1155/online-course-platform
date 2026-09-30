import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project3');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@courseplatform.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin',
        isVerified: true,
      });
      console.log(`Admin user created: ${adminEmail}`);
    } 
    else 
    {
      adminExists.role= 'admin';
      adminExists.isVerified=true;
      await adminExists.save();
      console.log('Admin role ensured for: ${adminEmail}');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();

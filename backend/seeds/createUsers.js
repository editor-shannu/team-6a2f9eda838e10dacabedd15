const mongoose = require('mongoose');
const User = require('../models/User');

const users = [
  {
    username: 'admin',
    email: 'admin@quorafaq.com',
    password: 'admin123',
    displayName: 'Administrator',
    bio: 'Site administrator with full access',
    role: 'admin',
    reputation: 10000,
    badges: ['Founder', 'Administrator'],
    isBanned: false
  },
  {
    username: 'moderator',
    email: 'moderator@quorafaq.com',
    password: 'mod12345',
    displayName: 'Senior Moderator',
    bio: 'Community moderator',
    role: 'moderator',
    reputation: 5000,
    badges: ['Moderator', 'Helper'],
    isBanned: false
  },
  {
    username: 'student',
    email: 'student@quorafaq.com',
    password: 'student123',
    displayName: 'Regular Member',
    bio: 'Active community member',
    role: 'user',
    reputation: 250,
    badges: ['Contributor'],
    isBanned: false
  }
];

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/quorafaq');
    console.log('Connected to MongoDB');

    for (const u of users) {
      const existingByEmail = await User.findOne({ email: u.email });
      const existingByUsername = await User.findOne({ username: u.username });
      if (existingByEmail || existingByUsername) {
        console.log('User already exists:', u.username, '- updating if needed');
        if (existingByEmail && existingByEmail.username !== u.username) {
          console.log('  Email conflict with user:', existingByEmail.username);
        }
        if (existingByUsername && existingByUsername.email !== u.email) {
          console.log('  Updating email for:', u.username);
          existingByUsername.email = u.email;
          await existingByUsername.save();
        }
      } else {
        await User.create(u);
        console.log('Created user:', u.username);
      }
    }

    console.log('\n--- Credentials ---');
    console.log('Admin:     admin@quorafaq.com / admin123');
    console.log('Moderator: moderator@quorafaq.com / mod12345');
    console.log('Student:   student@quorafaq.com / student123');

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

seed();
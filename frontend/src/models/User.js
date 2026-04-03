const mongoose = require('mongoose');

const USER_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(USER_ROLES), required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  USER_ROLES,
};

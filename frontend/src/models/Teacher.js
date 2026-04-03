const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    subject: { type: String, required: true },
    qualification: { type: String },
    mobileNumber: { type: String },
    department: { type: String, required: true },
    dateOfBirth: { type: Date },
  },
  { timestamps: true }
);

module.exports = {
  Teacher: mongoose.model('Teacher', teacherSchema),
};

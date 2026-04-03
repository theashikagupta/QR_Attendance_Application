const mongoose = require('mongoose');

const ISSUE_TYPES = {
  DEBAR_REQUEST: 'DEBAR_REQUEST',
  ATTENDANCE_ISSUE: 'ATTENDANCE_ISSUE',
  ACADEMIC_ISSUE: 'ACADEMIC_ISSUE',
  TECHNICAL_ISSUE: 'TECHNICAL_ISSUE',
};

const contactRequestSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    issueType: { type: String, enum: Object.values(ISSUE_TYPES), required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    message: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    responseMessage: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = {
  ContactRequest: mongoose.model('ContactRequest', contactRequestSchema),
  ISSUE_TYPES,
};

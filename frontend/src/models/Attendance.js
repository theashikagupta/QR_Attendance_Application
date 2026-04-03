const mongoose = require('mongoose');

const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
};

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: Object.values(ATTENDANCE_STATUS), required: true },
    scanTime: { type: Date, required: true },
    isManualOverride: { type: Boolean, default: false },
    overrideReason: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

module.exports = {
  Attendance: mongoose.model('Attendance', attendanceSchema),
  ATTENDANCE_STATUS,
};

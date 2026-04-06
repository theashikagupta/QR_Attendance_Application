const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const { USER_ROLES } = require('../models/User');
const { Teacher } = require('../models/Teacher');
const { SectionAllocation } = require('../models/SectionAllocation');
const { Student } = require('../models/Student');
const { Attendance, ATTENDANCE_STATUS } = require('../models/Attendance');
const { ContactRequest, ISSUE_TYPES } = require('../models/ContactRequest');
const { generateQRCodeBuffer } = require('../utils/qr');

const router = express.Router();

router.use(auth(USER_ROLES.TEACHER));

// Get teacher profile and allocations
router.get('/me', async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }).lean();
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const allocations = await SectionAllocation.find({ teacher: teacher._id }).lean();

    res.json({ teacher, allocations });
  } catch (err) {
    next(err);
  }
});

// Get students for a section (visibility rule enforced)
router.get('/sections/:allocationId/students', async (req, res, next) => {
  try {
    const allocation = await SectionAllocation.findById(req.params.allocationId).lean();
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

    const students = await Student.find({
      department: allocation.department,
      section: allocation.section,
    }).lean();

    res.json(students);
  } catch (err) {
    next(err);
  }
});

// View attendance summary for a date
router.get('/attendance', async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const records = await Attendance.find({
      teacher: teacher._id,
      date: { $gte: targetDate, $lt: nextDate },
    })
      .populate('student')
      .lean();

    res.json(records);
  } catch (err) {
    next(err);
  }
});

// Helper to convert HH:MM string to Date today
const timeStringToToday = (timeStr) => {
  const [h, m] = (timeStr || '0:0').split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

// Scan QR and mark attendance
router.post('/attendance/scan', async (req, res, next) => {
  try {
    const teacherUserId = req.user._id;
    const teacher = await Teacher.findOne({ user: teacherUserId });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const { payload, allocationId, timestamp } = req.body;
    if (!payload || !allocationId) {
      return res.status(400).json({ message: 'payload and allocationId are required' });
    }

    const allocation = await SectionAllocation.findById(allocationId).lean();
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (String(allocation.teacher) !== String(teacher._id)) {
      return res.status(403).json({ message: 'Allocation does not belong to this teacher' });
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    const start = timeStringToToday(allocation.startTime);
    const end = timeStringToToday(allocation.endTime);

    if (now < start || now > end) {
      return res.status(400).json({
        code: 'OUT_OF_SLOT',
        message: 'Scan is outside the allocated time slot',
      });
    }

    const qrBaseUrl = process.env.QR_SERVICE_BASE_URL;
    let studentId;
    let qrSecret;

    if (qrBaseUrl) {
      try {
        const validateRes = await axios.post(`${qrBaseUrl}/api/qr/validate`, {
          payload,
          teacherId: teacher._id,
          allocationId,
          timestamp: now.toISOString(),
        });

        if (!validateRes.data?.valid) {
          return res.status(400).json({ code: 'INVALID_QR', message: 'Invalid QR payload' });
        }

        studentId = validateRes.data.studentId;
        qrSecret = validateRes.data.qrSecret;
      } catch (err) {
        console.error('QR validation failed:', err.response?.data || err.message || err);
        return res.status(502).json({
          code: 'QR_SERVICE_ERROR',
          message: 'QR service is unavailable or validation failed',
        });
      }
    } else {
      // Fallback: parse placeholder ENC::<studentId>::<qrSecret>
      if (!payload.startsWith('ENC::')) {
        return res.status(400).json({ code: 'INVALID_QR', message: 'Invalid QR payload' });
      }

      const parts = payload.split('::');
      if (parts.length !== 3) {
        return res.status(400).json({ code: 'INVALID_QR', message: 'Malformed QR payload' });
      }

      [, studentId, qrSecret] = parts;
    }

    const student = await Student.findOne({ _id: studentId, qrSecret });
    if (!student) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Student not found for QR' });
    }

    if (student.status === 'INACTIVE' || student.status === 'DEBARRED') {
      return res.status(400).json({
        code: 'BLOCKED',
        message: `Student is ${student.status.toLowerCase()} and cannot mark attendance`,
      });
    }

    if (
      student.department !== allocation.department ||
      student.section !== allocation.section
    ) {
      return res.status(400).json({
        code: 'VISIBILITY_MISMATCH',
        message: 'Student does not belong to this department/section',
      });
    }

    const attendanceDate = new Date(now);
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      student: student._id,
      teacher: teacher._id,
      subject: allocation.subject,
      date: attendanceDate,
    });

    if (existing) {
      return res.status(200).json({
        code: 'ALREADY_MARKED',
        message: 'Attendance already marked for this student today',
        attendance: existing,
      });
    }

    const tenMinutesMs = 10 * 60 * 1000;
    const isLate = now - start > tenMinutesMs;

    const attendance = await Attendance.create({
      student: student._id,
      teacher: teacher._id,
      subject: allocation.subject,
      date: attendanceDate,
      status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
      scanTime: now,
      isManualOverride: false,
    });

    return res.status(201).json({
      code: isLate ? 'LATE' : 'PRESENT',
      message: isLate ? 'Marked as late' : 'Attendance marked',
      attendance,
    });
  } catch (err) {
    next(err);
  }
});

// Generate session QR code for attendance
router.get('/attendance/session-qr/:allocationId', async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const allocation = await SectionAllocation.findById(req.params.allocationId).lean();
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (String(allocation.teacher) !== String(teacher._id)) {
      return res.status(403).json({ message: 'Allocation does not belong to this teacher' });
    }

    const sessionPayload = `SESSION::${allocation._id}::${Date.now()}`;
    const qrBuffer = await generateQRCodeBuffer(sessionPayload);

    const base64Image = qrBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    res.json({
      qrImage: dataUrl,
      payload: sessionPayload,
      allocation: {
        subject: allocation.subject,
        department: allocation.department,
        section: allocation.section,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Contact admin
router.post('/contact-admin', async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const { issueType, studentId, message } = req.body;

    const request = await ContactRequest.create({
      teacher: teacher._id,
      issueType: issueType || ISSUE_TYPES.ATTENDANCE_ISSUE,
      student: studentId || undefined,
      message,
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

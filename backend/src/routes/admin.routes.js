const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { User, USER_ROLES } = require('../models/User');
const { Student, STUDENT_STATUS } = require('../models/Student');
const { Teacher } = require('../models/Teacher');
const { SectionAllocation } = require('../models/SectionAllocation');
const { Attendance, ATTENDANCE_STATUS } = require('../models/Attendance');
const axios = require('axios');
const { ContactRequest } = require('../models/ContactRequest');
const { sendTeacherCredentialsEmail, sendStudentStatusEmail } = require('../utils/email');
const { buildAttendanceSummary, buildDefaultersList } = require('../utils/reports');
const { generateStudentQRCode } = require('../utils/qr');

const router = express.Router();

// All routes here are admin-only
router.use(auth(USER_ROLES.ADMIN));

// Create student
router.post(
  '/students',
  [
    body('name').notEmpty(),
    body('admissionNumber').notEmpty(),
    body('mobileNumber').notEmpty(),
    body('email').isEmail(),
    body('semester').notEmpty(),
    body('section').notEmpty(),
    body('department').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // qrSecret will be used to generate encrypted QR code
      const qrSecret = `stu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      let student = await Student.create({
        ...req.body,
        status: req.body.status || STUDENT_STATUS.ACTIVE,
        qrSecret,
      });

      // Generate QR code directly using qrcode library
      try {
        const { payload, imageDataUrl } = await generateStudentQRCode(student._id.toString(), student.qrSecret);
        student.qrPayload = payload;
        student.qrImageUrl = imageDataUrl; // Base64 encoded PNG image
        await student.save();
      } catch (qrErr) {
        console.error('QR generation failed', qrErr.message || qrErr);
        // Continue without QR - not critical
      }

      res.status(201).json(student);
    } catch (err) {
      next(err);
    }
  }
);

// Update student
router.put('/students/:id', async (req, res, next) => {
  try {
    const existing = await Student.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    const previousStatus = existing.status;

    Object.assign(existing, req.body);
    await existing.save();

    // If status changed to INACTIVE or DEBARRED, notify student
    if (
      previousStatus !== existing.status &&
      [STUDENT_STATUS.INACTIVE, STUDENT_STATUS.DEBARRED].includes(existing.status)
    ) {
      try {
        await sendStudentStatusEmail({
          to: existing.email,
          name: existing.name,
          status: existing.status,
        });
      } catch (mailErr) {
        console.error('Failed to send student status email', mailErr.message || mailErr);
      }
    }

    res.json(existing);
  } catch (err) {
    next(err);
  }
});

// Delete student
router.delete('/students/:id', async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// List students with filters
router.get('/students', async (req, res, next) => {
  try {
    const { search, department, section, semester, status } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (section) filter.section = section;
    if (semester) filter.semester = semester;
    if (status) filter.status = status;

    let query = Student.find(filter);

    if (search) {
      const regex = new RegExp(search, 'i');
      query = Student.find({
        ...filter,
        $or: [{ name: regex }, { admissionNumber: regex }],
      });
    }

    const students = await query.lean();
    res.json(students);
  } catch (err) {
    next(err);
  }
});

// Create teacher (with login)
router.post(
  '/teachers',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('subject').notEmpty(),
    body('department').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, subject, qualification, mobileNumber, department, dateOfBirth } =
        req.body;

      const plainPassword = Math.random().toString(36).slice(2, 10);
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      const user = await User.create({
        name,
        email,
        passwordHash,
        role: USER_ROLES.TEACHER,
      });

      const teacher = await Teacher.create({
        user: user._id,
        name,
        email,
        subject,
        qualification,
        mobileNumber,
        department,
        dateOfBirth,
      });

      try {
        await sendTeacherCredentialsEmail({ to: email, name, password: plainPassword });
      } catch (mailErr) {
        console.error('Failed to send teacher credentials email', mailErr.message || mailErr);
      }

      res.status(201).json({
        teacher,
        generatedPassword: plainPassword,
      });
    } catch (err) {
      next(err);
    }
  }
);

// List teachers
router.get('/teachers', async (req, res, next) => {
  try {
    const teachers = await Teacher.find().lean();
    res.json(teachers);
  } catch (err) {
    next(err);
  }
});

// Assign section
router.post(
  '/sections/allocate',
  [
    body('teacherId').notEmpty(),
    body('subject').notEmpty(),
    body('department').notEmpty(),
    body('section').notEmpty(),
    body('startTime').notEmpty(),
    body('endTime').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const allocation = await SectionAllocation.create({
        teacher: req.body.teacherId,
        subject: req.body.subject,
        department: req.body.department,
        section: req.body.section,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
      });

      res.status(201).json(allocation);
    } catch (err) {
      next(err);
    }
  }
);

// List sections
router.get('/sections', async (req, res, next) => {
  try {
    const sections = await SectionAllocation.find().populate('teacher').lean();
    res.json(sections);
  } catch (err) {
    next(err);
  }
});

// View teacher → section → students
router.get('/sections/:id/students', async (req, res, next) => {
  try {
    const allocation = await SectionAllocation.findById(req.params.id).populate('teacher').lean();
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

    const students = await Student.find({
      department: allocation.department,
      section: allocation.section,
    }).lean();

    res.json({ allocation, students });
  } catch (err) {
    next(err);
  }
});

// Manual attendance override
router.post(
  '/attendance/override',
  [
    body('studentId').notEmpty(),
    body('teacherId').notEmpty(),
    body('subject').notEmpty(),
    body('date').notEmpty(),
    body('status').isIn(Object.values(ATTENDANCE_STATUS)),
    body('reason').notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const { studentId, teacherId, subject, date, status, reason } = req.body;

      const attendanceDate = new Date(date);

      const attendance = await Attendance.findOneAndUpdate(
        { student: studentId, teacher: teacherId, subject, date: attendanceDate },
        {
          student: studentId,
          teacher: teacherId,
          subject,
          date: attendanceDate,
          status,
          scanTime: new Date(),
          isManualOverride: true,
          overrideReason: reason,
        },
        { upsert: true, new: true }
      );

      res.json(attendance);
    } catch (err) {
      next(err);
    }
  }
);

// Fetch teacher reports/requests
router.get('/contact-requests', async (req, res, next) => {
  try {
    const requests = await ContactRequest.find().populate('teacher').populate('student');
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Update teacher request (admin response)
router.patch('/contact-requests/:id', async (req, res, next) => {
  try {
    const { status, responseMessage } = req.body;
    const request = await ContactRequest.findById(req.params.id).populate('teacher');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (status) request.status = status;
    if (responseMessage) request.responseMessage = responseMessage;
    if (status === 'RESOLVED' && !request.resolvedAt) {
      request.resolvedAt = new Date();
    }

    await request.save();

    // TODO: optionally email teacher with the response

    res.json(request);
  } catch (err) {
    next(err);
  }
});

// Reports & analytics
router.get('/reports/attendance-summary', async (req, res, next) => {
  try {
    const { department, section, subject, fromDate, toDate } = req.query;

    const summary = await buildAttendanceSummary({
      department,
      section,
      subject,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

router.get('/reports/defaulters', async (req, res, next) => {
  try {
    const { department, section, subject, fromDate, toDate, threshold } = req.query;
    const defaulters = await buildDefaultersList({
      department,
      section,
      subject,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      threshold: threshold ? Number(threshold) : 75,
    });

    res.json(defaulters);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

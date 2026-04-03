const { Attendance, ATTENDANCE_STATUS } = require('../models/Attendance');

const buildAttendanceSummary = async ({ department, section, subject, fromDate, toDate }) => {
  const match = {};

  if (subject) match.subject = subject;

  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = fromDate;
    if (toDate) match.date.$lte = toDate;
  }

  // Department/section are derived via student; we can look up via populate in a second query
  const base = await Attendance.find(match).populate('student').lean();

  const filtered = base.filter((r) => {
    if (department && r.student?.department !== department) return false;
    if (section && r.student?.section !== section) return false;
    return true;
  });

  const total = filtered.length;
  const counts = {
    [ATTENDANCE_STATUS.PRESENT]: 0,
    [ATTENDANCE_STATUS.ABSENT]: 0,
    [ATTENDANCE_STATUS.LATE]: 0,
  };

  for (const r of filtered) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }

  const percent = (value) => (total ? Math.round((value / total) * 100) : 0);

  return {
    total,
    counts,
    percentages: {
      present: percent(counts[ATTENDANCE_STATUS.PRESENT]),
      absent: percent(counts[ATTENDANCE_STATUS.ABSENT]),
      late: percent(counts[ATTENDANCE_STATUS.LATE]),
    },
  };
};

const buildDefaultersList = async ({ department, section, subject, fromDate, toDate, threshold = 75 }) => {
  const match = {};
  if (subject) match.subject = subject;
  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = fromDate;
    if (toDate) match.date.$lte = toDate;
  }

  const records = await Attendance.find(match).populate('student').lean();

  const perStudent = new Map();

  for (const r of records) {
    if (!r.student) continue;
    if (department && r.student.department !== department) continue;
    if (section && r.student.section !== section) continue;

    const key = String(r.student._id);
    if (!perStudent.has(key)) {
      perStudent.set(key, {
        student: r.student,
        total: 0,
        present: 0,
      });
    }
    const agg = perStudent.get(key);
    agg.total += 1;
    if (r.status === ATTENDANCE_STATUS.PRESENT || r.status === ATTENDANCE_STATUS.LATE) {
      agg.present += 1;
    }
  }

  const defaulters = [];

  for (const { student, total, present } of perStudent.values()) {
    if (!total) continue;
    const percent = Math.round((present / total) * 100);
    if (percent < threshold) {
      defaulters.push({
        student,
        total,
        present,
        percentage: percent,
      });
    }
  }

  return defaulters;
};

module.exports = {
  buildAttendanceSummary,
  buildDefaultersList,
};

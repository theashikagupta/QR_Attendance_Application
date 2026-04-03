const mongoose = require('mongoose');

const sectionAllocationSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    subject: { type: String, required: true },
    department: { type: String, required: true },
    section: { type: String, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "10:00"
  },
  { timestamps: true }
);

module.exports = {
  SectionAllocation: mongoose.model('SectionAllocation', sectionAllocationSchema),
};

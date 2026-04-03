import React, { useState } from 'react';
import api from '../../api/client';

function TeacherContactAdminPage() {
  const [issueType, setIssueType] = useState('ATTENDANCE_ISSUE');
  const [studentNote, setStudentNote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fullMessage = studentNote
        ? `Student: ${studentNote}\n\n${message}`
        : message;

      await api.post('/teacher/contact-admin', {
        issueType,
        message: fullMessage,
      });

      setIssueType('ATTENDANCE_ISSUE');
      setStudentNote('');
      setMessage('');
      setSuccess('Request sent to admin successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Contact Admin</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="
          max-w-xl
          rounded-xl
          border border-white/5
          bg-slate-900/60
          backdrop-blur
          p-5
          space-y-4
          text-sm
        "
      >
        {/* Issue Type */}
        <div>
          <label className="block text-xs font-medium text-slate-300">
            Issue Type
          </label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="
              mt-1 w-full rounded-lg
              bg-slate-800
              border border-white/10
              px-3 py-2
              text-slate-100
              focus:outline-none focus:ring-2 focus:ring-cyan-400/40
            "
          >
            <option value="DEBAR_REQUEST">Debar student request</option>
            <option value="ATTENDANCE_ISSUE">Attendance issue</option>
            <option value="ACADEMIC_ISSUE">Academic issue</option>
            <option value="TECHNICAL_ISSUE">Technical issue</option>
          </select>
        </div>

        {/* Student */}
        <div>
          <label className="block text-xs font-medium text-slate-300">
            Student (optional)
          </label>
          <input
            value={studentNote}
            onChange={(e) => setStudentNote(e.target.value)}
            placeholder="Name / Admission No"
            className="
              mt-1 w-full rounded-lg
              bg-slate-800
              border border-white/10
              px-3 py-2
              text-slate-100
              placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-cyan-400/40
            "
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-slate-300">
            Message
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="
              mt-1 w-full rounded-lg
              bg-slate-800
              border border-white/10
              px-3 py-2
              text-slate-100
              placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-cyan-400/40
            "
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="
            inline-flex items-center
            rounded-lg
            bg-cyan-600
            px-5 py-2
            text-sm font-medium text-white
            transition
            hover:bg-cyan-500
            active:scale-[0.98]
            disabled:opacity-60
          "
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

export default TeacherContactAdminPage;

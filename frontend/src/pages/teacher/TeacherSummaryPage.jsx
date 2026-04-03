import React, { useEffect, useState } from 'react';
import api from '../../api/client';

function TeacherSummaryPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teacher/attendance', { params: { date } });
      setRecords(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = records.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0, PRESENT: 0, ABSENT: 0, LATE: 0 }
  );

  const pct = (v) => (counts.total ? Math.round((v / counts.total) * 100) : 0);

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Attendance Summary</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadAttendance();
        }}
        className="
          rounded-xl
          border border-white/5
          bg-slate-900/60
          backdrop-blur
          p-4
          flex flex-wrap gap-3 items-end
          text-sm
        "
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="
              mt-1 rounded-lg
              bg-slate-800
              border border-white/10
              px-3 py-2
              text-slate-100
              focus:outline-none focus:ring-2 focus:ring-cyan-400/40
            "
          />
        </div>
        <button
          type="submit"
          className="
            rounded-lg
            bg-cyan-600
            px-4 py-2
            text-sm font-medium text-white
            hover:bg-cyan-500
            transition
          "
        >
          Refresh
        </button>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
        <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4">
          <div className="text-slate-400 text-xs mb-1">Total Records</div>
          <div className="text-3xl font-semibold">{counts.total}</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Present</span>
            <span>{pct(counts.PRESENT)}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-2 bg-emerald-500 rounded-full"
              style={{ width: `${pct(counts.PRESENT)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Absent</span>
              <span>{pct(counts.ABSENT)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-red-500 rounded-full"
                style={{ width: `${pct(counts.ABSENT)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Late</span>
              <span>{pct(counts.LATE)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-amber-500 rounded-full"
                style={{ width: `${pct(counts.LATE)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4 overflow-x-auto">
        <h3 className="text-sm font-medium mb-3">Per-student Records</h3>

        <table className="min-w-full text-xs">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-2 py-2 text-left">Student</th>
              <th className="px-2 py-2 text-left">Admission No</th>
              <th className="px-2 py-2 text-left">Subject</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Scan Time</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id} className="border-t border-white/5">
                <td className="px-2 py-1">{r.student?.name}</td>
                <td className="px-2 py-1">{r.student?.admissionNumber}</td>
                <td className="px-2 py-1">{r.subject}</td>
                <td className="px-2 py-1">{r.status}</td>
                <td className="px-2 py-1">
                  {r.scanTime ? new Date(r.scanTime).toLocaleTimeString() : ''}
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-slate-400">
                  No records for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherSummaryPage;

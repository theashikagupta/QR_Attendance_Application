import React, { useState } from 'react';
import api from '../../api/client';

function AdminReportsPage() {
  const [filters, setFilters] = useState({
    department: '',
    section: '',
    subject: '',
    fromDate: '',
    toDate: '',
  });
  const [summary, setSummary] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const loadReports = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = { ...filters };
      const [summaryRes, defaulterRes] = await Promise.all([
        api.get('/admin/reports/attendance-summary', { params }),
        api.get('/admin/reports/defaulters', { params }),
      ]);
      setSummary(summaryRes.data || null);
      setDefaulters(defaulterRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const percentBar = (value, color) => (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-2 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-10 text-right text-slate-300">{value}%</span>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Reports & Analytics</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={loadReports}
        className="
          rounded-xl border border-white/5
          bg-slate-900/70 backdrop-blur
          p-4 flex flex-wrap gap-3 items-end
        "
      >
        {[
          { label: 'Department', name: 'department' },
          { label: 'Section', name: 'section' },
          { label: 'Subject', name: 'subject' },
        ].map((f) => (
          <div key={f.name} className="flex flex-col">
            <label className="text-xs text-slate-300">{f.label}</label>
            <input
              name={f.name}
              value={filters[f.name]}
              onChange={handleChange}
              className="mt-1 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
        ))}

        {['fromDate', 'toDate'].map((f) => (
          <div key={f} className="flex flex-col">
            <label className="text-xs text-slate-300">
              {f === 'fromDate' ? 'From Date' : 'To Date'}
            </label>
            <input
              type="date"
              name={f}
              value={filters[f]}
              onChange={handleChange}
              className="mt-1 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
        ))}

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          Generate
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary */}
        <div className="rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl">
          <h3 className="text-sm font-medium mb-3">Attendance Summary</h3>

          {!summary && !loading && (
            <p className="text-xs text-slate-400">
              Generate a report to view attendance summary.
            </p>
          )}

          {summary && (
            <div className="space-y-3 text-sm">
              <div className="text-slate-300">
                Total Records:{' '}
                <span className="font-semibold text-white">{summary.total}</span>
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">Present</div>
                {percentBar(summary.percentages?.present || 0, 'bg-emerald-500')}
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">Absent</div>
                {percentBar(summary.percentages?.absent || 0, 'bg-red-500')}
              </div>

              <div>
                <div className="mb-1 text-xs text-slate-400">Late</div>
                {percentBar(summary.percentages?.late || 0, 'bg-amber-500')}
              </div>
            </div>
          )}
        </div>

        {/* Defaulters */}
        <div className="rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl overflow-x-auto">
          <h3 className="text-sm font-medium mb-3">
            Defaulters <span className="text-xs text-slate-400">(Below 75%)</span>
          </h3>

          {defaulters.length === 0 && !loading && (
            <p className="text-xs text-slate-400">
              No defaulters for selected filters.
            </p>
          )}

          {defaulters.length > 0 && (
            <table className="min-w-full text-xs">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-2 py-2 text-left">Name</th>
                  <th className="px-2 py-2 text-left">Admission No</th>
                  <th className="px-2 py-2 text-left">Total</th>
                  <th className="px-2 py-2 text-left">Present</th>
                  <th className="px-2 py-2 text-left">%</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d) => (
                  <tr key={d.student._id} className="border-t border-white/5">
                    <td className="px-2 py-1">{d.student.name}</td>
                    <td className="px-2 py-1">{d.student.admissionNumber}</td>
                    <td className="px-2 py-1">{d.total}</td>
                    <td className="px-2 py-1">{d.present}</td>
                    <td className="px-2 py-1 text-red-400 font-medium">
                      {d.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReportsPage;

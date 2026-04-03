import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const EMPTY_FORM = {
  teacherId: '',
  subject: '',
  department: '',
  section: '',
  startTime: '',
  endTime: '',
};

function AdminSectionsPage() {
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [studentsForAllocation, setStudentsForAllocation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [teachersRes, sectionsRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/sections'),
      ]);
      setTeachers(teachersRes.data || []);
      setSections(sectionsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/sections/allocate', form);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create section allocation');
    } finally {
      setLoading(false);
    }
  };

  const viewStudents = async (allocation) => {
    setSelectedAllocation(allocation);
    setStudentsForAllocation([]);
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/sections/${allocation._id}/students`);
      setStudentsForAllocation(res.data?.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Section Allocation</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          {/* Allocations */}
          <div className="rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl overflow-x-auto">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-medium">Allocations</h3>
              {loading && <span className="text-xs text-slate-400">Loading…</span>}
            </div>

            <table className="min-w-full text-xs">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-2 py-2 text-left">Teacher</th>
                  <th className="px-2 py-2 text-left">Subject</th>
                  <th className="px-2 py-2 text-left">Dept / Sec</th>
                  <th className="px-2 py-2 text-left">Time</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((a) => (
                  <tr key={a._id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-2 py-1">{a.teacher?.name}</td>
                    <td className="px-2 py-1">{a.subject}</td>
                    <td className="px-2 py-1">
                      <div>{a.department}</div>
                      <div className="text-[11px] text-slate-400">Sec {a.section}</div>
                    </td>
                    <td className="px-2 py-1">
                      {a.startTime} – {a.endTime}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <button
                        onClick={() => viewStudents(a)}
                        className="px-3 py-0.5 rounded border border-white/10 hover:bg-white/10"
                      >
                        View Students
                      </button>
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-slate-400">
                      No allocations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Students */}
          {selectedAllocation && (
            <div className="rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl overflow-x-auto">
              <h3 className="text-sm font-medium mb-2">
                Students · {selectedAllocation.subject} · {selectedAllocation.department} / Sec{' '}
                {selectedAllocation.section}
              </h3>

              <table className="min-w-full text-xs">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-2 py-2 text-left">Name</th>
                    <th className="px-2 py-2 text-left">Admission No</th>
                    <th className="px-2 py-2 text-left">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsForAllocation.map((s) => (
                    <tr key={s._id} className="border-t border-white/5">
                      <td className="px-2 py-1">{s.name}</td>
                      <td className="px-2 py-1">{s.admissionNumber}</td>
                      <td className="px-2 py-1">{s.semester}</td>
                    </tr>
                  ))}
                  {studentsForAllocation.length === 0 && !loading && (
                    <tr>
                      <td colSpan={3} className="px-2 py-4 text-center text-slate-400">
                        No students for this allocation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Allocation */}
        <div className="rounded-xl border border-white/5 bg-slate-900/80 backdrop-blur p-4 shadow-xl">
          <h3 className="text-sm font-medium mb-3">Create Allocation</h3>

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs text-slate-300">Teacher</label>
              <select
                name="teacherId"
                value={form.teacherId}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} – {t.department}
                  </option>
                ))}
              </select>
            </div>

            {['subject', 'department', 'section'].map((f) => (
              <div key={f}>
                <label className="block text-xs text-slate-300">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </label>
                <input
                  name={f}
                  value={form[f]}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2">
              {['startTime', 'endTime'].map((f) => (
                <input
                  key={f}
                  type="time"
                  name={f}
                  value={form[f]}
                  onChange={handleChange}
                  className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full rounded-lg
                bg-indigo-600
                py-2 text-sm font-medium
                hover:bg-indigo-500
                disabled:opacity-60
              "
            >
              Create Allocation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminSectionsPage;

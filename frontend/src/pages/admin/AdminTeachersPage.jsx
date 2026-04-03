import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const EMPTY_FORM = {
  name: '',
  email: '',
  subject: '',
  qualification: '',
  mobileNumber: '',
  department: '',
  dateOfBirth: '',
};

function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const loadTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGeneratedPassword('');
    try {
      const res = await api.post('/admin/teachers', form);
      setForm(EMPTY_FORM);
      if (res.data?.generatedPassword) {
        setGeneratedPassword(res.data.generatedPassword);
      }
      await loadTeachers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Teacher Management</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers Table */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Teachers</h3>
            {loading && <span className="text-xs text-slate-400">Loading…</span>}
          </div>

          <table className="min-w-full text-xs">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Email</th>
                <th className="px-2 py-2 text-left">Subject</th>
                <th className="px-2 py-2 text-left">Department</th>
                <th className="px-2 py-2 text-left">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t._id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-2 py-1">{t.name}</td>
                  <td className="px-2 py-1">{t.email}</td>
                  <td className="px-2 py-1">{t.subject}</td>
                  <td className="px-2 py-1">{t.department}</td>
                  <td className="px-2 py-1">{t.mobileNumber}</td>
                </tr>
              ))}
              {teachers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-slate-400">
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Teacher */}
        <div className="rounded-xl border border-white/5 bg-slate-900/80 backdrop-blur p-4 shadow-xl">
          <h3 className="text-sm font-medium mb-3">Create Teacher</h3>

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            {[
              { label: 'Name', name: 'name', type: 'text', required: true },
              { label: 'Email', name: 'email', type: 'email', required: true },
              { label: 'Subject', name: 'subject', type: 'text', required: true },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs text-slate-300">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  required={f.required}
                  className="
                    mt-1 w-full rounded-lg
                    bg-slate-800
                    border border-white/10
                    px-3 py-2
                    text-slate-100
                    focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                  "
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300">Department</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300">Mobile</label>
                <input
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300">Qualification</label>
              <input
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full mt-2 rounded-lg
                bg-indigo-600
                py-2 text-sm font-medium text-white
                hover:bg-indigo-500
                active:scale-[0.98]
                disabled:opacity-60
              "
            >
              Create Teacher
            </button>
          </form>

          {generatedPassword && (
            <div className="mt-4 text-xs bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 text-indigo-300">
              Temporary password: <strong>{generatedPassword}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTeachersPage;

import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const EMPTY_FORM = {
  name: '',
  admissionNumber: '',
  mobileNumber: '',
  email: '',
  semester: '',
  section: '',
  department: '',
  status: 'ACTIVE',
};

function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    section: '',
    semester: '',
    status: '',
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/students', { params: filters });
      setStudents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name || '',
      admissionNumber: s.admissionNumber || '',
      mobileNumber: s.mobileNumber || '',
      email: s.email || '',
      semester: s.semester || '',
      section: s.section || '',
      department: s.department || '',
      status: s.status || 'ACTIVE',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/admin/students/${editingId}`, form);
      } else {
        await api.post('/admin/students', form);
      }
      cancelEdit();
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    setLoading(true);
    try {
      await api.delete(`/admin/students/${id}`);
      if (editingId === id) cancelEdit();
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      ACTIVE: 'bg-emerald-500/15 text-emerald-300',
      INACTIVE: 'bg-amber-500/15 text-amber-300',
      DEBARRED: 'bg-red-500/15 text-red-300',
    };
    return map[status] || 'bg-slate-500/15 text-slate-300';
  };

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Student Management</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={applyFilters}
        className="
          rounded-xl border border-white/5
          bg-slate-900/70 backdrop-blur
          p-4 flex flex-wrap gap-3 items-end
        "
      >
        {[
          { label: 'Search', name: 'search', placeholder: 'Name / Admission No' },
          { label: 'Department', name: 'department' },
          { label: 'Section', name: 'section' },
          { label: 'Semester', name: 'semester' },
        ].map((f) => (
          <div key={f.name} className="flex flex-col">
            <label className="text-xs text-slate-300">{f.label}</label>
            <input
              name={f.name}
              value={filters[f.name]}
              onChange={handleFilterChange}
              placeholder={f.placeholder}
              className="mt-1 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
        ))}

        <div className="flex flex-col">
          <label className="text-xs text-slate-300">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="mt-1 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DEBARRED">Debarred</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          Apply
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl overflow-x-auto">
          <div className="flex justify-between mb-3">
            <h3 className="text-sm font-medium">Students</h3>
            {loading && <span className="text-xs text-slate-400">Loading…</span>}
          </div>

          <table className="min-w-full text-xs">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Admission No</th>
                <th className="px-2 py-2 text-left">Dept / Sec / Sem</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">QR</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-2 py-1">{s.name}</td>
                  <td className="px-2 py-1">{s.admissionNumber}</td>
                  <td className="px-2 py-1">
                    <div>{s.department}</div>
                    <div className="text-[11px] text-slate-400">
                      Sec {s.section} · Sem {s.semester}
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    {s.qrPayload ? (
                      <span className="text-emerald-400">Generated</span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-right space-x-1">
                    <button
                      onClick={() => startEdit(s)}
                      className="px-2 py-0.5 rounded border border-white/10 hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="px-2 py-0.5 rounded border border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-white/5 bg-slate-900/80 backdrop-blur p-4 shadow-xl">
          <h3 className="text-sm font-medium mb-3">
            {editingId ? 'Edit Student' : 'Add Student'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            {['name', 'admissionNumber', 'mobileNumber', 'email'].map((f) => (
              <div key={f}>
                <label className="block text-xs text-slate-300">{f}</label>
                <input
                  name={f}
                  value={form[f]}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                />
              </div>
            ))}

            <div className="grid grid-cols-3 gap-2">
              {['semester', 'section', 'department'].map((f) => (
                <input
                  key={f}
                  name={f}
                  value={form[f]}
                  onChange={handleChange}
                  placeholder={f}
                  className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                />
              ))}
            </div>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DEBARRED">Debarred</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-indigo-600 py-2 hover:bg-indigo-500 disabled:opacity-60"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-white/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminStudentsPage;

import React, { useEffect, useState } from 'react';
import api from '../../api/client';

function AdminIssuesPage() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/contact-requests');
      setRequests(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teacher requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openRequest = (req) => {
    setSelected(req);
    setResponseMessage(req.responseMessage || '');
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await api.patch(`/admin/contact-requests/${selected._id}`, {
        status: 'RESOLVED',
        responseMessage,
      });
      setSelected(null);
      setResponseMessage('');
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) =>
    status === 'RESOLVED'
      ? 'bg-emerald-500/15 text-emerald-300'
      : 'bg-amber-500/15 text-amber-300';

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">Teacher Requests</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests Table */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-slate-900/70 backdrop-blur p-4 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Incoming Requests</h3>
            {loading && <span className="text-xs text-slate-400">Loading…</span>}
          </div>

          <table className="min-w-full text-xs">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-2 py-2 text-left">Teacher</th>
                <th className="px-2 py-2 text-left">Issue Type</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Created</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-2 py-1">{r.teacher?.name}</td>
                  <td className="px-2 py-1">{r.issueType}</td>
                  <td className="px-2 py-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${statusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      onClick={() => openRequest(r)}
                      className="px-3 py-0.5 rounded border border-white/10 hover:bg-white/10"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-slate-400">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Details Panel */}
        <div className="rounded-xl border border-white/5 bg-slate-900/80 backdrop-blur p-4 shadow-xl">
          <h3 className="text-sm font-medium mb-3">Request Details</h3>

          {!selected && (
            <p className="text-xs text-slate-400">
              Select a request to view details and respond.
            </p>
          )}

          {selected && (
            <form onSubmit={handleResolve} className="space-y-3 text-sm">
              <div className="text-xs">
                <div className="font-medium mb-1">
                  From: {selected.teacher?.name}
                </div>
                <div className="text-slate-400 mb-1">
                  Issue: {selected.issueType}
                </div>

                {selected.student && (
                  <div className="text-slate-400 mb-1">
                    Student: {selected.student.name} (
                    {selected.student.admissionNumber})
                  </div>
                )}

                <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-slate-200">
                  {selected.message}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300">
                  Admin Response
                </label>
                <textarea
                  rows={4}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  required
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

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-lg
                  bg-indigo-600
                  py-2 text-sm font-medium text-white
                  hover:bg-indigo-500
                  disabled:opacity-60
                "
              >
                Mark as Resolved
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminIssuesPage;

import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import QrScanner from '../../components/QrScanner';

function TeacherAttendancePage() {
  const [profile, setProfile] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/teacher/me');
        setProfile(res.data?.teacher || null);
        setAllocations(res.data?.allocations || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const selectAllocation = async (allocation) => {
    setSelectedAllocation(allocation);
    setStudents([]);
    setScanMessage('');
    setScannerOpen(false);
    setLoading(true);
    try {
      const res = await api.get(`/teacher/sections/${allocation._id}/students`);
      setStudents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (payload) => {
    if (!selectedAllocation || !payload) return;
    setLoading(true);
    try {
      const res = await api.post('/teacher/attendance/scan', {
        payload,
        allocationId: selectedAllocation._id,
      });
      setScanMessage(res.data?.message || 'Scan processed');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <h2 className="text-xl font-semibold">QR Attendance</h2>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {profile && (
        <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4 text-sm">
          <div className="font-medium">{profile.name}</div>
          <div className="text-slate-400">{profile.department}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocations */}
        <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4">
          <h3 className="text-sm font-medium mb-3">Assigned Sections</h3>

          {allocations.length === 0 && !loading && (
            <p className="text-xs text-slate-400">No allocations assigned.</p>
          )}

          <ul className="space-y-2 text-xs">
            {allocations.map((a) => (
              <li key={a._id}>
                <button
                  onClick={() => selectAllocation(a)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                    selectedAllocation?._id === a._id
                      ? 'border-cyan-400 bg-slate-800 text-white'
                      : 'border-white/10 bg-slate-800/40 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-medium">{a.subject}</div>
                  <div className="text-[11px] text-slate-400">
                    {a.department} · Sec {a.section} · {a.startTime} - {a.endTime}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAllocation ? (
            <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4">
              <div className="flex items-center justify-between mb-3 text-sm">
                <div>
                  <div className="font-medium">{selectedAllocation.subject}</div>
                  <div className="text-slate-400">
                    {selectedAllocation.department} · Sec {selectedAllocation.section}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setScannerOpen((o) => !o);
                    setScanMessage('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs hover:bg-cyan-500 transition"
                >
                  {scannerOpen ? 'Stop Scanner' : 'Start Attendance (QR)'}
                </button>
              </div>

              {scannerOpen && (
                <div className="mb-3 space-y-2">
                  <p className="text-xs text-slate-400">
                    Point the camera at the student QR code. Each scan is validated in real time.
                  </p>
                  <QrScanner onScan={handleScan} />
                </div>
              )}

              {scanMessage && (
                <div className="mb-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1">
                  {scanMessage}
                </div>
              )}

              {/* Students Table */}
              <div className="border-t border-white/10 pt-3">
                <h4 className="text-sm font-medium mb-2">Matched Students</h4>

                <table className="min-w-full text-xs">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="px-2 py-2 text-left">Name</th>
                      <th className="px-2 py-2 text-left">Admission No</th>
                      <th className="px-2 py-2 text-left">Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s._id} className="border-t border-white/5">
                        <td className="px-2 py-1">{s.name}</td>
                        <td className="px-2 py-1">{s.admissionNumber}</td>
                        <td className="px-2 py-1">{s.semester}</td>
                      </tr>
                    ))}
                    {students.length === 0 && !loading && (
                      <tr>
                        <td colSpan={3} className="px-2 py-4 text-center text-slate-400">
                          No students for this allocation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-4 text-slate-400 text-sm">
              Select an allocation from the left to start QR attendance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherAttendancePage;

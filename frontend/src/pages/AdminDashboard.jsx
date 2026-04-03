import React from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminStudentsPage from './admin/AdminStudentsPage';
import AdminTeachersPage from './admin/AdminTeachersPage';
import AdminSectionsPage from './admin/AdminSectionsPage';
import AdminReportsPage from './admin/AdminReportsPage';
import AdminIssuesPage from './admin/AdminIssuesPage';

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItem =
    'relative block px-4 py-2.5 rounded-lg transition-all duration-200';

  return (
    <DashboardLayout title="Admin Dashboard" onLogout={handleLogout}>
      <div className="flex gap-6">
        {/* Sidebar */}
        <nav
          className="
            w-64 flex-shrink-0
            rounded-2xl
            border border-white/5
            bg-slate-900/70
            backdrop-blur-lg
            p-3
            shadow-2xl
          "
        >
          <ul className="space-y-1 text-sm font-medium">
            {[
              { to: 'students', label: 'Students' },
              { to: 'teachers', label: 'Teachers' },
              { to: 'sections', label: 'Section Allocation' },
              { to: 'reports', label: 'Reports & Analytics' },
              { to: 'issues', label: 'Teacher Requests' },
            ].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `
                    ${navItem}
                    ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }
                  `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-cyan-400"></span>
                      )}
                      <span className="ml-3">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <section
          className="
            flex-1
            rounded-2xl
            border border-white/5
            bg-slate-800/40
            backdrop-blur-lg
            p-6
            shadow-xl
            text-slate-100
          "
        >
          <Routes>
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="teachers" element={<AdminTeachersPage />} />
            <Route path="sections" element={<AdminSectionsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="issues" element={<AdminIssuesPage />} />
            <Route path="*" element={<Navigate to="students" replace />} />
          </Routes>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;

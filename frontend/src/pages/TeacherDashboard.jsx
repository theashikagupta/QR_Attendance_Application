import React from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import TeacherAttendancePage from './teacher/TeacherAttendancePage';
import TeacherSummaryPage from './teacher/TeacherSummaryPage';
import TeacherContactAdminPage from './teacher/TeacherContactAdminPage';

function TeacherDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const profileMenu = (
    <div className="flex items-center gap-4 text-xs text-slate-300">
      <button className="hover:text-white transition underline underline-offset-4">
        Contact Admin
      </button>
    </div>
  );

  const navItem =
    'relative block px-4 py-2.5 rounded-lg transition-all duration-200';

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      onLogout={handleLogout}
      extraRight={profileMenu}
    >
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
              { to: 'attendance', label: 'QR Attendance' },
              { to: 'summary', label: 'Attendance Summary' },
              { to: 'contact-admin', label: 'Contact Admin' },
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
            <Route path="attendance" element={<TeacherAttendancePage />} />
            <Route path="summary" element={<TeacherSummaryPage />} />
            <Route path="contact-admin" element={<TeacherContactAdminPage />} />
            <Route path="*" element={<Navigate to="attendance" replace />} />
          </Routes>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default TeacherDashboard;

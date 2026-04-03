import React from 'react';

function DashboardLayout({ title, children, onLogout, extraRight }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-900 text-slate-50 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          {extraRight}
          <button
            onClick={onLogout}
            className="px-3 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}

export default DashboardLayout;

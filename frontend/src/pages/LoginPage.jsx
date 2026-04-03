import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TEACHER') navigate('/teacher');
      else setError('Unsupported role');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      
      {/* subtle background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      {/* glass card */}
      <div className="
        relative
        w-full max-w-md
        rounded-2xl
        border border-white/10
        bg-white/10
        backdrop-blur-xl
        shadow-2xl
        p-8
        animate-[fadeIn_0.5s_ease-out]
      ">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          QR College Attendance
        </h1>
        <p className="text-sm text-slate-300 mt-1 mb-6">
          Admin / Teacher Login
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              className="
                mt-1 w-full rounded-lg
                bg-white/10
                border border-white/10
                px-3 py-2 text-sm text-white
                placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-cyan-400/40
              "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              className="
                mt-1 w-full rounded-lg
                bg-white/10
                border border-white/10
                px-3 py-2 text-sm text-white
                placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-cyan-400/40
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full mt-2 rounded-lg
              bg-gradient-to-r from-cyan-500 to-indigo-500
              py-2.5 text-sm font-medium text-white
              transition-all duration-200
              hover:brightness-110
              active:scale-[0.98]
              disabled:opacity-60
            "
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* animation keyframes */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}

export default LoginPage;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { setRole } = useRole();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // Demo: route based on email keyword
    if (form.email.includes('admin')) { setRole('admin'); navigate('/dashboard/admin'); }
    else if (form.email.includes('therapist')) { setRole('therapist'); navigate('/dashboard/therapist'); }
    else { setRole('patient'); navigate('/dashboard/patient'); }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-primary-300 via-primary-400 to-primary-600 flex-col justify-between p-12 relative overflow-hidden">
        <div><span className="text-2xl font-bold text-white">MindBridge</span></div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight">Welcome<br />back.</h2>
          <p className="text-primary-100 mt-4">Your healing journey continues here.</p>
        </div>
        <div className="text-8xl">🌿</div>
        <p className="text-primary-200 text-xs">© 2024 MindBridge.</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900">Sign in</h1>
          <p className="text-gray-500 mt-2">Enter your credentials to continue.</p>
          <p className="text-xs text-gray-400 mt-1 bg-blue-50 px-3 py-2 rounded-lg">
              Demo tip: use <strong>admin@</strong>, <strong>therapist@</strong>, or any email for patient view.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
              <input
                type="email" placeholder="name@example.com"
                value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="input-field" required
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-xs text-brand hover:underline">Forgot password?</a>
              </div>
              <input
                type="password" placeholder="Enter your password"
                value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="input-field" required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-4 text-base">Sign In →</button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

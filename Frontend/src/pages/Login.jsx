import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useRole } from '../context/RoleContext';

const DASHBOARD_BY_ROLE = {
  admin: '/dashboard/admin',
  therapist: '/dashboard/therapist',
  patient: '/dashboard/patient',
};

// The Google button only renders when a Client ID is configured.
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loginWithGoogle } = useRole();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const uiRole = await login(form.email, form.password);
      navigate(DASHBOARD_BY_ROLE[uiRole] || '/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Google users have no password — this is their only way back in.
  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    try {
      const uiRole = await loginWithGoogle(credentialResponse.credential);
      navigate(DASHBOARD_BY_ROLE[uiRole] || '/');
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
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

          {error && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

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
            <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          {GOOGLE_ENABLED && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-medium">OR CONTINUE WITH</span></div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  text="continue_with"
                  shape="pill"
                  width="280"
                />
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

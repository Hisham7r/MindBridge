import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useRole } from '../context/RoleContext';

// The Google button only renders when a Client ID is configured.
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Register() {
  const [tab, setTab] = useState('patient');
  const [form, setForm] = useState({ name: '', email: '', password: '', licenseNumber: '', specializations: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, loginWithGoogle } = useRole();
  const navigate = useNavigate();

  const isTherapist = tab === 'therapist';

  // Google sign-in always creates/loads a PATIENT account — therapists must
  // register through the therapist form (licence + specializations required).
  async function handleGoogleSuccess(credentialResponse) {
    setError('');
    try {
      const uiRole = await loginWithGoogle(credentialResponse.credential);
      navigate(uiRole === 'therapist' ? '/dashboard/therapist' : uiRole === 'admin' ? '/dashboard/admin' : '/dashboard/patient');
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Therapist sign-up collects licence + specializations up front; the rest
    // of the profile (title, about, fee, languages…) is completed in Settings.
    let extras;
    if (isTherapist) {
      const specs = form.specializations.split(',').map((s) => s.trim()).filter(Boolean);
      if (!form.licenseNumber.trim()) {
        setError('Please enter your license number.');
        return;
      }
      if (specs.length === 0) {
        setError('Please enter at least one specialization.');
        return;
      }
      extras = { licenseNumber: form.licenseNumber.trim(), specializations: specs };
    }

    setSubmitting(true);
    try {
      // UI tab ('patient'/'therapist') -> backend role enum (UPPERCASE).
      const uiRole = await register(form.name, form.email, form.password, tab.toUpperCase(), extras);
      navigate(uiRole === 'therapist' ? '/dashboard/therapist' : '/dashboard/patient');
    } catch (err) {
      // Surface the first field-level validation message if present.
      const detail = err.details?.[0]?.message;
      setError(detail || err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-primary-300 via-primary-400 to-primary-600 flex-col justify-between p-12 relative overflow-hidden">
        <div>
          <span className="text-2xl font-bold text-white">MindBridge</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Your mental<br />sanctuary<br />begins here.
          </h2>
          <p className="text-primary-100 mt-4 leading-relaxed">
            Join a community dedicated to healing, growth, and professional support. Every journey is unique; let's find yours.
          </p>
        </div>
        <div className="relative">
          <div className="w-72 h-72 bg-primary-500/40 rounded-full absolute -bottom-20 -left-10 flex items-center justify-center overflow-hidden">
            <div className="text-8xl">🧘</div>
          </div>
        </div>
        <p className="text-primary-200 text-xs">© 2024 MindBridge. Healing is a journey.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-2">Welcome! Let's set up your profile.</p>

          {error && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-full p-1 mt-6">
            {['patient', 'therapist'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-brand' : 'text-gray-500 hover:text-gray-700'}`}
              >
                I am a {t === 'patient' ? 'Patient' : 'Therapist'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                {/* <span className="text-xs text-gray-400" style={{ fontFamily: 'serif' }}>مکمل نام</span> */}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field pr-10"
                  required  
                />
                {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span> */}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                {/* <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>ای میل ایڈریس</span> */}
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field pr-10"
                  required
                />
                {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">✉</span> */}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                {/* <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>پاس ورڈ</span> */}
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-10"
                  minLength={8}
                  required
                />
                {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span> /* you can add icon here infornt of the email like a lock etc  */}
              </div>
              <div className="flex justify-end mt-1">
                <a href="#" className="text-xs text-brand hover:underline">Forgot password?</a>
              </div>
            </div>

            {/* Therapist-only fields — appear when the "Therapist" tab is active */}
            {isTherapist && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PSY-2024-001234"
                    value={form.licenseNumber}
                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Specializations</label>
                  <input
                    type="text"
                    placeholder="e.g. Anxiety, Depression, CBT"
                    value={form.specializations}
                    onChange={(e) => setForm({ ...form, specializations: e.target.value })}
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Separate multiple with commas. You'll add the rest of your profile (title, fee, about, languages) after signing up.
                  </p>
                </div>
              </>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Creating account…' : 'Create Account →'}
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
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-semibold hover:underline">Log in</Link>
          </p>

          <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-700 italic">
              "The first step towards healing is finding a space where you feel heard."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

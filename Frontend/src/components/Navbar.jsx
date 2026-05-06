import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { useState } from 'react';

const navItems = {
  guest: [
    { label: 'Therapists', to: '/therapists' },
    { label: 'Career Therapy', to: '/career-therapy' },
    { label: 'Sessions', to: '/sessions' },
  ],
  patient: [
    { label: 'Therapists', to: '/therapists' },
    { label: 'Career Therapy', to: '/career-therapy' },
    { label: 'Sessions', to: '/sessions' },
  ],
  therapist: [
    { label: 'Therapists', to: '/therapists' },
    { label: 'Career Therapy', to: '/career-therapy' },
    { label: 'Sessions', to: '/sessions' },
  ],
  admin: [],
};

export default function Navbar() {
  const { role, setRole, currentUser } = useRole();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) return null; // dashboards have their own sidebar nav

  const items = navItems[role] || navItems.guest;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand">MindBridge</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link text-sm ${location.pathname === item.to ? 'nav-link-active border-b-2 border-brand pb-0.5' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Role Switcher (Dev only) */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="hidden md:flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-500 px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Demo: {role}
              </button>
              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {['guest', 'patient', 'therapist', 'admin'].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setShowRoleSwitcher(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors capitalize ${role === r ? 'text-brand font-semibold' : 'text-gray-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {role === 'guest' ? (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline text-sm py-2 px-4">Log In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {role === 'admin' ? (
                  <Link to="/dashboard/admin" className="text-sm text-brand font-semibold">Admin Console</Link>
                ) : role === 'therapist' ? (
                  <Link to="/dashboard/therapist" className="text-sm text-brand font-semibold">My Dashboard</Link>
                ) : (
                  <Link to="/dashboard/patient" className="text-sm font-semibold text-brand">Profile</Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold hover:bg-primary-700 transition-colors"
                  >
                    {currentUser.initials}
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                        <p className="text-xs text-gray-400">{currentUser.email}</p>
                      </div>
                      <Link to={role === 'patient' ? '/dashboard/patient' : role === 'therapist' ? '/dashboard/therapist' : '/dashboard/admin'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                      <Link to="/login" onClick={() => setRole('guest')} className="block px-4 py-2 text-sm text-red-500 hover:bg-red-50">Logout</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

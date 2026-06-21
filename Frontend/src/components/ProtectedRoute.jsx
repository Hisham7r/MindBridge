import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { role, loading } = useRole();

  // While the session is being restored from a stored token, don't redirect —
  // otherwise a page refresh would bounce a logged-in user to /login.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (allowedRoles.includes(role)) {
    return children;
  }

  return <Navigate to="/login" replace />;
}

import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { role } = useRole();

  if (allowedRoles.includes(role)) {
    return children;
  }

  return <Navigate to="/login" replace />;
}

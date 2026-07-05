import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, clearToken, getToken } from '../services/api';
import { mapUser } from '../services/adapters';

const RoleContext = createContext(null);

// Backend roles are UPPERCASE (PATIENT/THERAPIST/ADMIN); the UI uses lowercase
// ('patient'/'therapist'/'admin') everywhere (routes, ProtectedRoute, sidebar).
function toUiRole(role) {
  return role ? String(role).toLowerCase() : 'guest';
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState('guest'); // 'patient' | 'therapist' | 'admin' | 'guest'
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // On first load, restore the session from a stored token (if any).
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then(({ user }) => {
        setCurrentUser(mapUser(user));
        setRole(toUiRole(user.role));
      })
      .catch(() => {
        clearToken(); // token invalid/expired
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user, token } = await api.login(email, password);
    setToken(token);
    setCurrentUser(mapUser(user));
    setRole(toUiRole(user.role));
    return toUiRole(user.role);
  }

  async function register(name, email, password, apiRole, extras) {
    const { user, token } = await api.register(name, email, password, apiRole, extras);
    setToken(token);
    setCurrentUser(mapUser(user));
    setRole(toUiRole(user.role));
    return toUiRole(user.role);
  }

  function logout() {
    clearToken();
    setCurrentUser(null);
    setRole('guest');
  }

  return (
    <RoleContext.Provider
      value={{ role, setRole, currentUser, setCurrentUser, login, register, logout, loading }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

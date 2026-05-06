import { createContext, useContext, useState } from 'react';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState('guest'); // 'patient' | 'therapist' | 'admin' | 'guest'
  const [currentUser, setCurrentUser] = useState({
    name: 'Sarah Rahman',
    email: 'sarah@example.com',
    initials: 'SR',
    avatar: null,
  });

  return (
    <RoleContext.Provider value={{ role, setRole, currentUser, setCurrentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

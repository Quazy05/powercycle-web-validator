'use client';
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [unit, setUnit] = useState(null); // 'Wonogiri' or 'Sudirman'
  const [username, setUsername] = useState(null);

  const login = (selectedRole, selectedUnit = null, selectedUsername = null) => {
    setRole(selectedRole);
    if (selectedUnit) {
      setUnit(selectedUnit);
    }
    if (selectedUsername) {
      setUsername(selectedUsername);
    }
  };

  const logout = () => {
    setRole(null);
    setUnit(null);
    setUsername(null);
  };

  const selectUnit = (selectedUnit) => {
    setUnit(selectedUnit);
  };

  return (
    <AuthContext.Provider value={{ role, unit, username, login, logout, selectUnit }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/db';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [unit, setUnit] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUsername(firebaseUser.email);
        const savedRole = localStorage.getItem('powercycle_role');
        const savedUnit = localStorage.getItem('powercycle_unit');
        if (savedRole) setRole(savedRole);
        if (savedUnit) setUnit(savedUnit);
      } else {
        setRole(null);
        setUnit(null);
        setUsername(null);
        localStorage.removeItem('powercycle_role');
        localStorage.removeItem('powercycle_unit');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (selectedRole, selectedUnit = null, selectedUsername = null) => {
    setRole(selectedRole);
    if (selectedUnit) {
      setUnit(selectedUnit);
      localStorage.setItem('powercycle_unit', selectedUnit);
    }
    if (selectedUsername) {
      setUsername(selectedUsername);
    }
    if (selectedRole) {
      localStorage.setItem('powercycle_role', selectedRole);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setRole(null);
      setUnit(null);
      setUsername(null);
      localStorage.removeItem('powercycle_role');
      localStorage.removeItem('powercycle_unit');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const selectUnit = (selectedUnit) => {
    setUnit(selectedUnit);
    localStorage.setItem('powercycle_unit', selectedUnit);
  };

  return (
    <AuthContext.Provider value={{ role, unit, username, loading, login, logout, selectUnit }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

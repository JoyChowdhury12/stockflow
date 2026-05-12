import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wh_token');
    if (token) {
      api.getProfile()
        .then(setUser)
        .catch(() => localStorage.removeItem('wh_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });

    localStorage.setItem('wh_token', token);
    setUser(user || {});

    window.location.href = '/';
  };

  const register = async (name, email, password) => {
    const { token, user } = await api.register({ name, email, password });

    localStorage.setItem('wh_token', token);
    setUser(user || {});

    window.location.href = '/';
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = (updated) => setUser(updated);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

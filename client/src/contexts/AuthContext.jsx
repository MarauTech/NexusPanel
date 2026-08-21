import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(null); // null = unknown, true/false
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // 1. Check if first-run setup is completed
      const statusRes = await api.auth.getStatus();
      setSetupCompleted(Boolean(statusRes.data?.setupCompleted));

      if (statusRes.data?.setupCompleted) {
        // 2. Check if user is currently authenticated
        try {
          const meRes = await api.auth.getMe();
          if (meRes.data && meRes.data.id) {
            setUser(meRes.data);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (authErr) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setSetupCompleted(false);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username, password) => {
    const res = await api.auth.login({ username, password });
    if (res.data?.token) {
      localStorage.setItem('nexuspanel_token', res.data.token);
    }
    if (res.data && res.data.user) {
      setUser(res.data.user);
      setIsAuthenticated(true);
      setSetupCompleted(true);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('nexuspanel_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, setupCompleted, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

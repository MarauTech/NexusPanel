import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getServerUrl } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(null); // null = unknown, true/false
  const [serverConnected, setServerConnected] = useState(true); // true/false
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Check if server is reachable and if first-run setup is completed
      const statusRes = await api.auth.getStatus();
      setServerConnected(true);
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
      console.warn('Backend server not directly reachable or not configured yet:', err.message);
      
      // If running in Capacitor/Android or standalone and cannot reach server
      const isStandaloneOrCapacitor = Boolean(
        window.Capacitor || 
        window.location.origin.includes('localhost') || 
        window.location.protocol === 'file:' || 
        window.location.protocol === 'capacitor:'
      );

      if (isStandaloneOrCapacitor && !getServerUrl()) {
        setServerConnected(false);
      } else if (err.message?.includes('Network Error') || err.code === 'ECONNABORTED') {
        setServerConnected(false);
      } else {
        // Assume default web setup
        setSetupCompleted(false);
      }

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
      setServerConnected(true);
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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      setupCompleted, 
      serverConnected, 
      setServerConnected, 
      isLoading, 
      login, 
      logout, 
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

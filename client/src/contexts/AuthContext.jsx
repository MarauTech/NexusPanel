import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // No authentication required in open homelab mode
  const [user] = useState({ id: 1, username: 'admin', display_name: 'Administrator', role: 'admin' });
  const [isAuthenticated] = useState(true);
  const [isLoading] = useState(false);

  const login = async () => {};
  const logout = async () => {};
  const checkAuth = async () => {};

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ServicesContext = createContext();

export function ServicesProvider({ children }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.services.getServices();
      setServices(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reorder = async (orderedIds) => {
    try {
      const items = orderedIds.map((id, index) => ({ id, sort_order: index }));
      await api.services.reorderServices({ items });
      await refresh();
    } catch (err) {
      setError('Failed to reorder services');
    }
  };

  return (
    <ServicesContext.Provider value={{ services, loading, error, refresh, reorder, setServices }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.services.getServices();
      setServices(res.data);
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

  return { services, loading, error, refresh, reorder };
};

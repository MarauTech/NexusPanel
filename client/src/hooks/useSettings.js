import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.settings.getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = async (data) => {
    try {
      await api.settings.updateSettings(data);
      addToast('Settings saved successfully', 'success');
      await refresh();
      return true;
    } catch (err) {
      addToast('Failed to save settings', 'error');
      return false;
    }
  };

  return { settings, loading, updateSettings, refresh };
};

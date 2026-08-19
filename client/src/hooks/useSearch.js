import { useState, useMemo } from 'react';
import { filterServices } from '../utils/helpers';

export const useSearch = (services = []) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    return filterServices(services, query);
  }, [services, query]);

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  return { query, setQuery, results, isOpen, open, close };
};

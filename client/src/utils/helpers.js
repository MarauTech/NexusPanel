import { STATUS_COLORS, STATUS_LABELS } from './constants';

export const formatDate = (date, formatStr) => {
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(new Date(date));
};

export const formatTime = (date, formatStr) => {
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));
};

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.unknown;
};

export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || STATUS_LABELS.unknown;
};

export const filterServices = (services, query) => {
  if (!query) return services;
  const q = query.toLowerCase();
  return services.filter(service => 
    service.name?.toLowerCase().includes(q) ||
    service.description?.toLowerCase().includes(q) ||
    service.category?.name?.toLowerCase().includes(q) ||
    service.tags?.some(tag => tag.name?.toLowerCase().includes(q))
  );
};

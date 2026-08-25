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
  if (!query || typeof query !== 'string' || !query.trim()) return services;
  const q = query.trim().toLowerCase();
  return services.filter(service => {
    const nameMatch = service.name?.toLowerCase().includes(q);
    const urlMatch = service.url?.toLowerCase().includes(q);
    const descMatch = service.description?.toLowerCase().includes(q);
    const catMatch = (service.category_name || service.category?.name)?.toLowerCase().includes(q);
    const badgeMatch = service.custom_badge?.toLowerCase().includes(q);
    const statusMatch = (service.health_status || service.status)?.toLowerCase() === q;
    const tagMatch = Array.isArray(service.tags) && service.tags.some(tag => 
      (typeof tag === 'string' ? tag : tag.name)?.toLowerCase().includes(q)
    );
    return nameMatch || urlMatch || descMatch || catMatch || badgeMatch || statusMatch || tagMatch;
  });
};

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // In zero-auth homelab mode, 401 is passed through without forcing login redirect
    }
    return Promise.reject(error);
  }
);

const API = {
  auth: {
    getStatus: () => api.get('/auth/status'),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    setup: (data) => api.post('/auth/setup', data),
    changePassword: (data) => api.put('/auth/password', data),
  },
  services: {
    getServices: () => api.get('/services'),
    getService: (id) => api.get(`/services/${id}`),
    createService: (data) => api.post('/services', data),
    updateService: (id, data) => api.put(`/services/${id}`, data),
    deleteService: (id) => api.delete(`/services/${id}`),
    reorderServices: (items) => api.put('/services/reorder', { items }),
    seedDemo: () => api.post('/services/seed-demo'),
    clearServices: () => api.post('/services/clear'),
  },
  categories: {
    getCategories: () => api.get('/categories'),
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),
    reorderCategories: (data) => api.put('/categories/reorder', data),
  },
  tags: {
    getTags: () => api.get('/tags'),
    createTag: (data) => api.post('/tags', data),
    deleteTag: (id) => api.delete(`/tags/${id}`),
  },
  settings: {
    getSettings: () => api.get('/settings'),
    updateSettings: (data) => api.put('/settings', data),
  },
  backup: {
    exportBackup: () => api.get('/backup/export'),
    importBackup: (data) => api.post('/backup/import', data),
    factoryReset: () => api.post('/backup/factory-reset'),
  },
  icons: {
    getIcons: () => api.get('/icons'),
  },
  health: {
    getHealth: () => api.get('/health'),
    probe: (url) => api.post('/health/probe', { url }),
  },
  proxmox: {
    testConnection: (data) => api.post('/proxmox/test', data),
    getNodeStatus: () => api.get('/proxmox/node-status'),
    getLxcStatus: () => api.get('/proxmox/lxc-status'),
  },
  system: {
    getStats: () => api.get('/system/stats'),
    getWeather: () => api.get('/system/weather'),
  },
  upload: {
    uploadImage: (formData) => api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },
  scanner: {
    discover: () => api.get('/scanner/discover'),
    scanCustom: (hosts) => api.post('/scanner/scan-custom', { hosts }),
    addBatch: (services) => api.post('/scanner/add-batch', { services }),
  }
};

export default API;

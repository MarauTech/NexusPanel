import axios from 'axios';

export function getServerUrl() {
  const custom = localStorage.getItem('nexuspanel_server_url');
  if (custom) return custom.replace(/\/+$/, '');
  return '';
}

export function setServerUrl(url) {
  if (!url) {
    localStorage.removeItem('nexuspanel_server_url');
  } else {
    let clean = url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }
    localStorage.setItem('nexuspanel_server_url', clean);
  }
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexuspanel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const serverUrl = getServerUrl();
  if (serverUrl) {
    // If request URL starts with /api or relative, prepend configured server URL
    if (config.url?.startsWith('/')) {
      config.url = `${serverUrl}${config.url.startsWith('/api') ? '' : '/api'}${config.url}`;
    } else if (!config.url?.startsWith('http')) {
      config.url = `${serverUrl}/api/${config.url}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response.data?.code;
      if (code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED' || code === 'USER_NOT_FOUND' || code === 'TOKEN_REVOKED') {
        localStorage.removeItem('nexuspanel_token');
      }
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
    toggleFavorite: (id, favorite) => api.patch(`/services/${id}/favorite`, { favorite }),
    toggleEnabled: (id, enabled) => api.patch(`/services/${id}/toggle`, { enabled }),
    deleteService: (id) => api.delete(`/services/${id}`),
    reorderServices: (items) => api.put('/services/reorder', { items }),
    seedDemo: (data = {}) => api.post('/services/seed-demo', data),
    clearServices: () => api.post('/services/clear'),
    probeService: (id) => api.post(`/services/${id}/probe`),
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
    factoryReset: (data = { confirmation: 'RESET NEXUSPANEL' }) => api.post('/backup/factory-reset', data),
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
  },
  widgets: {
    getConfig: () => api.get('/widgets/config'),
    updateConfig: (widgets) => api.put('/widgets/config', { widgets }),
    getSystem: () => api.get('/widgets/system'),
    getProxmox: () => api.get('/widgets/proxmox'),
    getDocker: () => api.get('/widgets/docker'),
    getDnsAdblock: () => api.get('/widgets/dns-adblock'),
    toggleDnsAdblock: (duration) => api.post('/widgets/dns-adblock/toggle', { duration }),
    getNetwork: () => api.get('/widgets/network'),
    getServiceHealth: () => api.get('/widgets/service-health'),
    getUptimeKuma: () => api.get('/widgets/uptime-kuma'),
    getMediaStreams: () => api.get('/widgets/media-streams'),
    getDownloads: () => api.get('/widgets/downloads'),
    getHomeAssistant: () => api.get('/widgets/homeassistant'),
    getWeather: () => api.get('/widgets/weather'),
    getScratchpad: () => api.get('/widgets/scratchpad'),
    updateScratchpad: (data) => api.put('/widgets/scratchpad', data),
  }
};

export default API;

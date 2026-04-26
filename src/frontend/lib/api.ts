import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  setup: (storeName: string, username: string, password: string) =>
    api.post('/auth/setup', { storeName, username, password }).then((r) => r.data),
};

// Items / Price Book
export const itemsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/items', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/items/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/items', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/items/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/items/${id}`).then((r) => r.data),
  history: (id: string) => api.get(`/items/${id}/history`).then((r) => r.data),
  export: () => api.get('/items/export').then((r) => r.data),
  bulkPrices: (itemIds: string[], retailPrice: number) =>
    api.post('/items/bulk-prices', { itemIds, retailPrice }).then((r) => r.data),
};

export const departmentsApi = {
  list: () => api.get('/departments').then((r) => r.data),
  create: (name: string) => api.post('/departments', { name }).then((r) => r.data),
};

export const vendorsApi = {
  list: () => api.get('/vendors').then((r) => r.data),
  create: (data: unknown) => api.post('/vendors', data).then((r) => r.data),
};

// Inventory
export const inventoryApi = {
  list: (params?: Record<string, string | boolean | number>) =>
    api.get('/inventory', { params }).then((r) => r.data),
  transactions: (params?: Record<string, string | number>) =>
    api.get('/inventory/transactions', { params }).then((r) => r.data),
  createTransaction: (data: unknown) =>
    api.post('/inventory/transactions', data).then((r) => r.data),
};

// Fuel
export const fuelApi = {
  tanks: () => api.get('/fuel/tanks').then((r) => r.data),
  createTank: (data: unknown) => api.post('/fuel/tanks', data).then((r) => r.data),
  updateTank: (id: string, data: unknown) => api.put(`/fuel/tanks/${id}`, data).then((r) => r.data),
  deliveries: (tankId?: string) =>
    api.get('/fuel/deliveries', { params: tankId ? { tankId } : undefined }).then((r) => r.data),
  logDelivery: (data: unknown) => api.post('/fuel/deliveries', data).then((r) => r.data),
  readings: (tankId?: string) =>
    api.get('/fuel/readings', { params: tankId ? { tankId } : undefined }).then((r) => r.data),
  logReading: (data: unknown) => api.post('/fuel/readings', data).then((r) => r.data),
};

// Promotions
export const promotionsApi = {
  list: () => api.get('/promotions').then((r) => r.data),
  create: (data: unknown) => api.post('/promotions', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/promotions/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/promotions/${id}`).then((r) => r.data),
};

// Reconciliation
export const reconApi = {
  daily: () => api.get('/recon/daily').then((r) => r.data),
  createClose: (data: unknown) => api.post('/recon/daily', data).then((r) => r.data),
  updateClose: (id: string, data: unknown) => api.put(`/recon/daily/${id}`, data).then((r) => r.data),
  spotCounts: () => api.get('/recon/spot-counts').then((r) => r.data),
  createSpotCount: (data: unknown) => api.post('/recon/spot-counts', data).then((r) => r.data),
  completeSpotCount: (id: string) => api.put(`/recon/spot-counts/${id}/complete`, {}).then((r) => r.data),
};

// POS
export const posApi = {
  batches: () => api.get('/pos/batches').then((r) => r.data),
  import: (fileName: string) => api.post('/pos/import', { fileName }).then((r) => r.data),
};

export default api;

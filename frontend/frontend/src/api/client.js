import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  me: () => client.get('/auth/me'),
};

export const itemsApi = {
  list: (params) => client.get('/items', { params }),
  get: (id) => client.get(`/items/${id}`),
  create: (data) => client.post('/items', data),
  update: (id, data) => client.put(`/items/${id}`, data),
  delete: (id) => client.delete(`/items/${id}`),
  uploadImages: (id, formData) => client.post(`/items/${id}/images`, formData),
  deleteImage: (id, imageId) => client.delete(`/items/${id}/images/${imageId}`),
};

export const usersApi = {
  list: () => client.get('/users'),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id) => client.delete(`/users/${id}`),
};

export const locationsApi = {
  list: () => client.get('/locations'),
  create: (data) => client.post('/locations', data),
  update: (id, data) => client.put(`/locations/${id}`, data),
  delete: (id) => client.delete(`/locations/${id}`),
};

export const categoriesApi = {
  list: () => client.get('/categories'),
  create: (data) => client.post('/categories', data),
  update: (id, data) => client.put(`/categories/${id}`, data),
  delete: (id) => client.delete(`/categories/${id}`),
};

export const tagsApi = {
  list: () => client.get('/tags'),
  delete: (id) => client.delete(`/tags/${id}`),
};

export const dashboardApi = {
  get: () => client.get('/dashboard'),
};

export const exportApi = {
  csv: () => client.get('/export/csv', { responseType: 'blob' }),
  excel: () => client.get('/export/excel', { responseType: 'blob' }),
};

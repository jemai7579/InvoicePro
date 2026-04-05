import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005/api',
});

// Request interceptor: add dynamic token (user or admin based on current flow)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  
  // Choose token based on context or use both (backend will decide which middleware to use)
  if (config.url?.includes('/admin/')) {
    if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor: flatten { success: true, data: ... } responses
api.interceptors.response.use(
  (response) => {
    // If backend uses { success, data } format, return response.data.data
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;


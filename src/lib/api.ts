import axios from 'axios';

// Create a configured axios instance with cache prevention headers
const api = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Add request interceptor to ensure cache headers are applied to all requests
api.interceptors.request.use((config) => {
  // Add cache prevention headers if not already set
  if (config.headers) {
    config.headers['Cache-Control'] = 'no-cache, no-store, max-age=0, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  
  return config;
});

export default api; 
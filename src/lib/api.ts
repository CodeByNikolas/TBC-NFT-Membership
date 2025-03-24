import axios from 'axios';

// Create a configured axios instance with cache prevention headers
const api = axios.create({
  headers: {
    'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  // Add longer default timeout for all requests
  timeout: 120000, // 2 minutes default timeout
  // Add larger size limits for uploads
  maxContentLength: Infinity,
  maxBodyLength: Infinity
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

// Add response interceptor to handle network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Better handle network errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
      console.error(`Network error (${error.code}) occurred:`, error.message);
      // Wrap the error to provide more context
      error.message = `Network connectivity issue: ${error.message}. This might be due to rate limiting or connectivity issues with the API endpoint.`;
    }
    
    return Promise.reject(error);
  }
);

export default api; 
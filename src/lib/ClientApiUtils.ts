/**
 * ClientApiUtils.ts - Utilities for client-side API communications
 * 
 * This file contains utilities for making HTTP requests from the client-side
 * to external APIs or our own backend. These utilities are designed to run in
 * the browser and handle common client-side communication needs.
 */
import axios from 'axios';

// Cache prevention headers used across all HTTP requests
export const CACHE_PREVENTION_HEADERS = {
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Types for error handling
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  isNetworkError?: boolean;
  originalError?: any;
}

/**
 * Transforms any error into a standardized ApiError
 */
function handleRequestError(error: any): ApiError {
  const apiError: ApiError = new Error(
    error.message || 'An unknown error occurred'
  ) as ApiError;
  
  apiError.originalError = error;

  // Handle network connectivity errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
    apiError.isNetworkError = true;
    apiError.message = `Network connectivity issue: ${error.message}. This might be due to rate limiting or connectivity issues with the API endpoint.`;
    console.error(`Network error (${error.code}) occurred:`, error.message);
  }
  
  // Handle HTTP response errors
  if (error.response) {
    apiError.status = error.response.status;
    apiError.statusText = error.response.statusText;
    apiError.message = `HTTP error ${error.response.status}: ${error.response.statusText}`;
  }
  
  // Handle fetch Response errors
  if (error instanceof Response || (error.status && error.statusText)) {
    apiError.status = error.status;
    apiError.statusText = error.statusText;
    apiError.message = `HTTP error ${error.status}: ${error.statusText}`;
  }

  return apiError;
}

// ==== AXIOS BASED HTTP CLIENT ====

// Create a configured axios instance with cache prevention headers
export const api = axios.create({
  headers: CACHE_PREVENTION_HEADERS,
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
    Object.assign(config.headers, CACHE_PREVENTION_HEADERS);
  }
  
  return config;
});

// Add response interceptor to handle network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(handleRequestError(error));
  }
);

// ==== FETCH BASED HTTP CLIENT ====

// Default timeout for fetch calls (matching axios default)
const DEFAULT_FETCH_TIMEOUT = 120000;

/**
 * Custom fetch wrapper that prevents caching by default
 */
export function fetchWithNoCache<T>(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Merge with existing headers if any
  const headers = {
    ...options.headers,
    ...CACHE_PREVENTION_HEADERS
  };
  
  // Create an AbortController for the timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 
    options.signal ? DEFAULT_FETCH_TIMEOUT : DEFAULT_FETCH_TIMEOUT);
  
  return fetch(url, {
    ...options,
    headers,
    signal: options.signal || controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

/**
 * Utility function to make JSON POST requests with cache prevention
 */
export function postJSON<T = any>(
  url: string, 
  data: any, 
  extraOptions: RequestInit = {}
): Promise<T> {
  return fetchWithNoCache(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...extraOptions
  })
  .then(response => {
    if (!response.ok) {
      throw response;
    }
    return response.json();
  })
  .catch(error => {
    throw handleRequestError(error);
  });
}

/**
 * Utility function to make JSON GET requests with cache prevention
 */
export function getJSON<T = any>(
  url: string, 
  params: Record<string, string | number | boolean | undefined> = {}, 
  extraOptions: RequestInit = {}
): Promise<T> {
  // Build URL with query parameters
  const urlWithParams = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlWithParams.searchParams.append(key, String(value));
    }
  });
  
  return fetchWithNoCache(urlWithParams.toString(), {
    method: 'GET',
    ...extraOptions
  })
  .then(response => {
    if (!response.ok) {
      throw response;
    }
    return response.json();
  })
  .catch(error => {
    throw handleRequestError(error);
  });
} 
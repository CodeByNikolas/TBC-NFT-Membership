/**
 * ServerApiUtils.ts - Utilities for server-side API responses
 * 
 * This file contains utilities for creating consistent HTTP responses from the server
 * in Next.js API routes. These utilities ensure proper headers, status codes, and
 * response formats.
 */
import { NextResponse } from 'next/server';
import { CACHE_PREVENTION_HEADERS } from './ClientApiUtils';

// Valid HTTP status codes for error responses
export type HttpErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503 | 504;

// Error response structure with optional details
export interface ApiErrorResponse {
  error: string;
  details?: Record<string, any>;
  code?: string;
  timestamp?: string;
}

/**
 * Adds cache prevention headers to a NextResponse object
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  // Use the shared cache headers definition from ClientApiUtils
  Object.entries(CACHE_PREVENTION_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Creates a JSON NextResponse with cache prevention headers
 */
export function jsonResponseNoCache<T = any>(data: T, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  return addNoCacheHeaders(response);
}

/**
 * Creates an error JSON NextResponse with cache prevention headers
 */
export function errorResponseNoCache(
  message: string, 
  status: HttpErrorStatus = 500, 
  details?: Record<string, any>,
  errorCode?: string
): NextResponse {
  // Validate status code is an error status
  if (status < 400) {
    console.warn(`Invalid error status code ${status}, defaulting to 500`);
    status = 500;
  }
  
  const errorResponse: ApiErrorResponse = { 
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  if (errorCode) {
    errorResponse.code = errorCode;
  }
  
  return jsonResponseNoCache(errorResponse, { status });
}

/**
 * Creates a successful JSON response with data and optional metadata
 */
export function successResponseNoCache<T = any>(
  data: T, 
  message?: string,
  metadata?: Record<string, any>
): NextResponse {
  const response = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(metadata ? { metadata } : {})
  };
  
  return jsonResponseNoCache(response);
}

/**
 * Utility function to handle async API route operations with consistent error handling
 */
export async function withApiErrorHandling<T>(
  handler: () => Promise<T>,
  errorHandler?: (error: any) => { message: string, status: HttpErrorStatus, details?: any }
): Promise<NextResponse> {
  try {
    const result = await handler();
    return successResponseNoCache(result);
  } catch (error: any) {
    console.error('API error:', error);
    
    // Use custom error handler if provided
    if (errorHandler) {
      const { message, status, details } = errorHandler(error);
      return errorResponseNoCache(message, status, details);
    }
    
    // Default error handling
    const status = error.status || 500;
    const message = error.message || 'An unexpected error occurred';
    return errorResponseNoCache(message, status as HttpErrorStatus);
  }
} 
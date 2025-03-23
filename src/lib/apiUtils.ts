import { NextResponse } from 'next/server';

/**
 * Adds cache prevention headers to a NextResponse object
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

/**
 * Creates a JSON NextResponse with cache prevention headers
 */
export function jsonResponseNoCache(data: any, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  return addNoCacheHeaders(response);
}

/**
 * Creates an error JSON NextResponse with cache prevention headers
 */
export function errorResponseNoCache(message: string, status: number = 500): NextResponse {
  return jsonResponseNoCache({ error: message }, { status });
} 
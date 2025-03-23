/**
 * Custom fetch wrapper that prevents caching by default
 */
export async function fetchWithNoCache(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Add cache prevention headers to all requests
  const noCacheHeaders = {
    'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  
  // Merge with existing headers if any
  const headers = {
    ...options.headers,
    ...noCacheHeaders
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Utility function to make JSON POST requests with cache prevention
 */
export async function postJSON<T = any>(
  url: string, 
  data: any, 
  extraOptions: RequestInit = {}
): Promise<T> {
  const response = await fetchWithNoCache(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...extraOptions
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

/**
 * Utility function to make JSON GET requests with cache prevention
 */
export async function getJSON<T = any>(
  url: string, 
  params: Record<string, string | number | boolean | undefined> = {}, 
  extraOptions: RequestInit = {}
): Promise<T> {
  // Build URL with query parameters
  const urlWithParams = new URL(url, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlWithParams.searchParams.append(key, String(value));
    }
  });
  
  const response = await fetchWithNoCache(urlWithParams.toString(), {
    method: 'GET',
    ...extraOptions
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
} 
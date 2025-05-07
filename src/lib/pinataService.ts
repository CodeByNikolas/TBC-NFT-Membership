/**
 * Utility service for interacting with Pinata IPFS via our backend API
 */

/**
 * Updates an existing IPFS directory by sending only the changed files
 * @param oldCID The CID of the existing directory to update
 * @param changes Array of objects containing file paths and base64-encoded contents
 * @param allFilePaths Array of all file paths expected in the final directory
 * @param pinataApiKey Your Pinata API key
 * @param pinataApiSecret Your Pinata API secret
 * @returns Promise resolving to the new CID or throwing an error
 */
export async function updateCollection(
  oldCID: string,
  changes: { path: string; content: string }[],
  allFilePaths: string[],
  pinataApiKey: string,
  pinataApiSecret: string,
): Promise<string> {
  try {
    const response = await fetch('/api/update-collection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pinata-api-key': pinataApiKey,
        'x-pinata-api-secret': pinataApiSecret,
      },
      body: JSON.stringify({
        oldCID,
        changes,
        allFilePaths,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.newCID) {
      throw new Error('Failed to update collection: No CID returned');
    }
    
    return data.newCID;
  } catch (error: any) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

/**
 * Get the Pinata credentials from localStorage
 * @returns Object containing API key and secret or null if not found
 */
export function getPinataCredentials(): { apiKey: string; apiSecret: string } | null {
  if (typeof window === 'undefined') return null;
  
  const apiKey = localStorage.getItem('ipfsPinataKey');
  const apiSecret = localStorage.getItem('ipfsPinataSecret');
  
  if (!apiKey || !apiSecret) return null;
  
  return { apiKey, apiSecret };
}

/**
 * Utility to convert a file to a base64 string
 * @param file File object to convert
 * @returns Promise resolving to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Get the IPFS Gateway URL for an IPFS hash
 * @param ipfsUri The IPFS URI
 * @returns The gateway URL
 */
export function getIpfsGatewayUrl(ipfsUri: string): string {
  // Handle different formats of IPFS URIs
  if (!ipfsUri) return '';
  
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  
  if (ipfsUri.includes('/ipfs/')) {
    const cid = ipfsUri.split('/ipfs/')[1];
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  
  // If it looks like a bare CID
  if (ipfsUri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsUri}`;
  }
  
  return ipfsUri;
}

/**
 * Validates if a CID likely points to a valid collection directory
 * by checking for the existence of a specific file via the gateway.
 * @param cid The IPFS directory CID to validate
 * @returns Promise resolving to { isValid: boolean } or throwing an error
 */
export async function validateCollectionCID(cid: string): Promise<{ isValid: boolean }> {
  if (!cid || cid.trim() === '') {
    // Don't call API for empty CID, consider it "not valid" for update purposes
    return { isValid: false };
  }
  try {
    const response = await fetch('/api/validate-cid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cid }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to validate CID (HTTP ${response.status})`);
    }

    // The API returns success: true if the check completed,
    // and isValid: true/false based on the gateway fetch result.
    return { isValid: data.isValid };

  } catch (error: any) {
    console.error('Error validating CID:', error);
    // Return isValid: false on API error to prevent proceeding
    // Or rethrow if you want the component to handle the error explicitly
     // throw error;
     return { isValid: false }; // Treat API errors as invalid for simplicity
  }
} 
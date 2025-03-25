import { ethers } from 'ethers';

// Map of network names to their block explorer URLs
export const NETWORK_EXPLORER_MAP: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io',
  1: 'https://etherscan.io',
  137: 'https://polygonscan.com',
  80002: 'https://amoy.polygonscan.com',
};

// Chain ID to display name mapping
export const CHAIN_ID_TO_DISPLAY_NAME: Record<number, string> = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80002: 'Polygon Amoy'
};

/**
 * Get display name for chain ID
 */
export function getDisplayNameFromChainId(chainId: number): string {
  return CHAIN_ID_TO_DISPLAY_NAME[chainId] || 'Unknown Network';
}

/**
 * Get the block explorer URL for an address (contract or wallet)
 */
export function getAddressExplorerUrl(address: string, chainId: number): string {
  const baseUrl = NETWORK_EXPLORER_MAP[chainId] || '';
  if (!baseUrl) return '';
  
  return `${baseUrl}/address/${address}`;
}

/**
 * Get the block explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string, chainId: number): string {
  const baseUrl = NETWORK_EXPLORER_MAP[chainId] || '';
  if (!baseUrl) return '';
  
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get IPFS gateway URL for an IPFS hash
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
  
  // If the URI is just a CID
  if (ipfsUri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsUri}`;
  }
  
  return ipfsUri;
}

function loadInfuraKey(): string {
  // Load Infura API key from environment or localStorage if available
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('infuraKey') || '';
    } catch (e) {
      // Ignore localStorage error
    }
  }
  return '';
}

/**
 * Get RPC URL for a chain ID
 */
export function getRpcUrl(chainId: number): string | null {
  let infuraKey = loadInfuraKey();
  
  // Network-specific RPC URLs
  const rpcUrls: Record<number, string> = {
    11155111: `https://sepolia.infura.io/v3/${infuraKey}`,
    80001: `https://polygon-mumbai.infura.io/v3/${infuraKey}`,
    1: `https://mainnet.infura.io/v3/${infuraKey}`,
    137: `https://polygon-mainnet.infura.io/v3/${infuraKey}`,
    108: `https://polygon-amoy.infura.io/v3/${infuraKey}`,
  };
  
  return rpcUrls[chainId] || null;
}
/**
 * Get an ethers provider for the specified chain ID
 */
export function getProvider(chainId: number) {
  const rpcUrl = getRpcUrl(chainId);
  
  // Attempt to create a provider using the RPC URL
  if (rpcUrl) {
    try {
      return new ethers.JsonRpcProvider(rpcUrl);
    } catch (error) {
      console.error(`Error creating provider for ${chainId} with RPC URL:`, error);
    }
  }

  // If no RPC URL is available, try to use wallet provider
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    try {
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error(`Error creating wallet provider:`, error);
    }
  }

  console.error(`No valid provider found for network: ${chainId}`);
  return null;
}

// Create and export combined utility object
const ethersUtils = {
  getProvider,
  getDisplayNameFromChainId,
  getAddressExplorerUrl,
  getTxExplorerUrl,
  getIpfsGatewayUrl,
  getRpcUrl
};

export default ethersUtils;
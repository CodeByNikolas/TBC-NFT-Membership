// Utility functions for network-related operations

// Map of network names to their block explorer URLs
const NETWORK_EXPLORER_MAP: Record<string, string> = {
  'sepolia': 'https://sepolia.etherscan.io',
  'mainnet': 'https://etherscan.io',
  'polygon': 'https://polygonscan.com',
  'polygon-amoy': 'https://amoy.polygonscan.com',
  'polygon amoy': 'https://amoy.polygonscan.com',
  'amoy': 'https://amoy.polygonscan.com',
};

// Get Infura RPC URL for a chain ID
export function getInfuraRpcUrl(chainId: number): string | null {
  // Only use Infura if the API key is available in settings
  const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY || '';
  
  // If no API key is provided, return null to fallback to wallet's RPC
  if (!INFURA_API_KEY) {
    return null;
  }
  
  switch (chainId) {
    case 1:
      return `https://mainnet.infura.io/v3/${INFURA_API_KEY}`;
    case 11155111:
      return `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;
    case 137:
      return `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`;
    case 80002:
      // Fallback for Amoy since Infura doesn't support it yet
      return `https://polygon-amoy.infura.io/v3/${INFURA_API_KEY}`;
    default:
      return null;
  }
}

// Get network name from chain ID
export function getNetworkNameFromChainId(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'mainnet';
    case 11155111:
      return 'sepolia';
    case 137:
      return 'polygon';
    case 80002:
      return 'amoy';
    default:
      return 'unknown';
  }
}

// Get display name for chain ID
export function getDisplayNameFromChainId(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 137:
      return 'Polygon Mainnet';
    case 80002:
      return 'Polygon Amoy';
    default:
      return 'Unknown Network';
  }
}

// Get the formatted display name for a network
export function getNetworkDisplayName(networkId: string): string {
  const networkMap: Record<string, string> = {
    'sepolia': 'Sepolia',
    'mainnet': 'Ethereum',
    'polygon': 'Polygon',
    'polygon-amoy': 'Polygon Amoy',
    'polygon amoy': 'Polygon Amoy',
    'amoy': 'Polygon Amoy',
  };
  
  return networkMap[networkId.toLowerCase()] || networkId;
}

// Get the block explorer URL for an address (contract or wallet)
export function getAddressExplorerUrl(address: string, network: string): string {
  const baseUrl = NETWORK_EXPLORER_MAP[network.toLowerCase()] || '';
  if (!baseUrl) return '';
  
  return `${baseUrl}/address/${address}`;
}

// Get the block explorer URL for a transaction
export function getTxExplorerUrl(txHash: string, network: string): string {
  const baseUrl = NETWORK_EXPLORER_MAP[network.toLowerCase()] || '';
  if (!baseUrl) return '';
  
  return `${baseUrl}/tx/${txHash}`;
}

// Get IPFS gateway URL for an IPFS hash
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
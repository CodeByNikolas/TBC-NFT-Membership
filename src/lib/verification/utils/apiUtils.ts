/**
 * Get API endpoints based on the chain ID
 */
export function getApiEndpoint(chainId: number): string {
  // Map chain IDs to API endpoints
  switch(chainId) {
    case 1:
      return 'https://api.etherscan.io/api';
    case 11155111:
      return 'https://api-sepolia.etherscan.io/api';
    case 137:
      return 'https://api.polygonscan.com/api';
    case 80002:
      return 'https://api-amoy.polygonscan.com/api';
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

/**
 * Get the appropriate API key based on the chain ID
 */
export function getApiKey(chainId: number): string {
  // Ethereum networks
  if (chainId === 1 || chainId === 11155111) {
    return process.env.ETHERSCAN_API_KEY || '';
  } 
  // Polygon networks
  else if (chainId === 137 || chainId === 80002) {
    return process.env.POLYGONSCAN_API_KEY || '';
  }
  return '';
}

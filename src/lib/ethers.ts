import { ethers } from 'ethers';

/**
 * Get an ethers provider for the specified network
 */
export function getProvider(network: string) {
  // Load Infura API key from localStorage if available
  let infuraKey = '';
  if (typeof window !== 'undefined') {
    infuraKey = localStorage.getItem('infuraKey') || '';
  }

  // Add RPC URLs for each supported network
  const rpcUrls: Record<string, string> = {
    'sepolia': process.env.SEPOLIA_RPC_URL || (infuraKey ? `https://sepolia.infura.io/v3/${infuraKey}` : ''),
    'mumbai': process.env.MUMBAI_RPC_URL || (infuraKey ? `https://polygon-mumbai.infura.io/v3/${infuraKey}` : ''),
    'goerli': process.env.GOERLI_RPC_URL || (infuraKey ? `https://goerli.infura.io/v3/${infuraKey}` : ''),
    'mainnet': process.env.MAINNET_RPC_URL || (infuraKey ? `https://mainnet.infura.io/v3/${infuraKey}` : ''),
    'polygon': process.env.POLYGON_RPC_URL || (infuraKey ? `https://polygon-mainnet.infura.io/v3/${infuraKey}` : ''),
  };

  const rpcUrl = rpcUrls[network.toLowerCase()];
  
  // If no RPC URL is available, try to use wallet provider
  if (!rpcUrl && typeof window !== 'undefined' && window.ethereum) {
    try {
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error(`Error creating wallet provider:`, error);
    }
  }
  
  if (!rpcUrl) {
    console.error(`No RPC URL found for network: ${network}`);
    return null;
  }
  
  try {
    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (error) {
    console.error(`Error creating provider for ${network}:`, error);
    
    // Fallback to wallet provider if available
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        return new ethers.BrowserProvider(window.ethereum);
      } catch (walletError) {
        console.error('Error creating wallet provider:', walletError);
      }
    }
    
    return null;
  }
}

export default { getProvider }; 
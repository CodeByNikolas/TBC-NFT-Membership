import { ethers } from 'ethers';

/**
 * Get an ethers provider for the specified network
 */
export function getProvider(network: string) {
  // Add RPC URLs for each supported network
  const rpcUrls: Record<string, string> = {
    'sepolia': process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    'mumbai': process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY',
    'goerli': process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    'mainnet': process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    'polygon': process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
  };

  const rpcUrl = rpcUrls[network.toLowerCase()];
  
  if (!rpcUrl) {
    console.error(`No RPC URL found for network: ${network}`);
    return null;
  }
  
  try {
    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (error) {
    console.error(`Error creating provider for ${network}:`, error);
    return null;
  }
}

export default { getProvider }; 
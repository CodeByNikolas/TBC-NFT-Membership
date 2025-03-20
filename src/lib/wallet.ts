import { ethers } from 'ethers';

/**
 * Gets a wallet instance for contract deployment
 * This should be configured with environment variables in production
 */
export async function getWallet() {
  // For development, use a simple wallet with private key from env
  // In production, this should be properly secured
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('No deployer private key found in environment variables');
    return null;
  }
  
  try {
    return new ethers.Wallet(privateKey);
  } catch (error) {
    console.error('Error creating wallet:', error);
    return null;
  }
}

export default { getWallet }; 
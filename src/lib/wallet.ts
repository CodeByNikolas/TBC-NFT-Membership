import { ethers } from 'ethers';

/**
 * Gets a wallet for server-side operations
 * This uses the private key from environment variables
 */
export async function getWallet(): Promise<ethers.BrowserProvider> {
  // For security, we should use environment variables for the private key
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('No deployer private key found in environment variables');
  }

  try {
    // Create a wallet from the private key
    const wallet = new ethers.Wallet(privateKey);
    return wallet.provider as ethers.BrowserProvider;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error('Failed to initialize wallet');
  }
} 